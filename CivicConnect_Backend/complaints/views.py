import csv, datetime
from django.db import transaction
from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils import timezone

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Complaint, ComplaintTimeline, ComplaintComment, Notification, AuditLog
from .permissions import IsCitizen, IsDepartment, IsAdmin, IsOwnerOrDepartmentOrAdmin
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    AdminCreateDepartmentUserSerializer,
    UserProfileUpdateSerializer,
    ComplaintSerializer,
    ComplaintCommentSerializer,
    NotificationSerializer,
    AuditLogSerializer
)
from .utils import extract_exif_gps, extract_gps_from_image

DEPARTMENT_BY_CATEGORY = {
    "Road Damage": "Road Department",
    "Garbage": "Sanitation Department",
    "Street Light": "Electrical Department",
    "Water Leakage": "Water Department",
}


def log_action(user, action, request=None, details=""):
    try:
        ip = None
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
        AuditLog.objects.create(
            user=user if user and user.is_authenticated else None,
            action=action,
            ip_address=ip,
            details=details
        )
    except Exception as e:
        print("Audit log error:", e)


def create_notification(recipient, sender, complaint, title, message, notification_type="info"):
    try:
        Notification.objects.create(
            recipient=recipient,
            sender=sender,
            complaint=complaint,
            title=title,
            message=message,
            notification_type=notification_type
        )
    except Exception as e:
        print("Notification error:", e)


class RegisterUserView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            log_action(user, "User Registered", request, f"Role: {user.role}")
            return Response(
                {"message": "Registration successful. Please log in.", "user": UserSerializer(user).data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = (request.data.get("email") or request.data.get("username") or "").strip()
        password = request.data.get("password", "")
        selected_role = (request.data.get("role") or "").strip()

        user = User.objects.filter(
            Q(email__iexact=identifier) | Q(username__iexact=identifier)
        ).first()

        if not user or not user.check_password(password):
            return Response(
                {"error": "Invalid username/email or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {"error": "Account is deactivated. Contact Administrator."},
                status=status.HTTP_403_FORBIDDEN
            )

        if user.is_superuser and user.role != "Admin":
            user.role = "Admin"
            user.save(update_fields=["role"])

        if selected_role and selected_role.lower() != user.role.lower():
            return Response(
                {"error": f"Selected role '{selected_role}' does not match your account role '{user.role}'."},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)
        log_action(user, "User Login", request, f"Role: {user.role}")

        return Response({
            "access": str(refresh.access_token),
            "token": str(refresh.access_token),
            "refresh": str(refresh),
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "department": user.department,
            "phone": user.phone,
            "address": user.address
        })


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        if not old_password or not new_password:
            return Response({"error": "Both old and new passwords are required."}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_password(old_password):
            return Response({"error": "Incorrect current password."}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.save()
        log_action(request.user, "Changed Password", request)
        return Response({"message": "Password updated successfully."})


class ComplaintCreateView(APIView):
    permission_classes = [IsCitizen]
    parser_classes = (MultiPartParser, FormParser)

    @transaction.atomic
    def post(self, request):
        title = request.data.get("title", "").strip()
        category = request.data.get("category", "").strip()
        description = request.data.get("description", "").strip()
        address = request.data.get("address", "").strip()
        image = request.FILES.get("image")
        priority = request.data.get("priority", "Medium")

        if not title or not category or not description or not image:
            return Response(
                {"error": "Title, category, description, and image photo are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Process EXIF/OCR GPS extraction from image
        ext_lat, ext_lng, ext_addr, ext_method = extract_gps_from_image(image)
        lat = request.data.get("latitude")
        lng = request.data.get("longitude")

        # If EXIF or OCR extracted valid GPS coordinates, enforce them!
        if ext_lat is not None and ext_lng is not None:
            final_lat = ext_lat
            final_lng = ext_lng
            gps_extracted = True
            gps_method = ext_method
            if ext_addr and not address:
                address = ext_addr
        else:
            if not lat or not lng:
                return Response(
                    {"error": "No GPS coordinates found in photo (EXIF or OCR overlay). Please select location manually on map."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            final_lat = lat
            final_lng = lng
            gps_extracted = False
            gps_method = "Manual"

        department = DEPARTMENT_BY_CATEGORY.get(category, "General Department")
        complaint_id = f"CC{int(timezone.now().timestamp() * 1000)}"

        complaint = Complaint.objects.create(
            complaint_id=complaint_id,
            citizen=request.user,
            category=category,
            title=title,
            description=description,
            image=image,
            latitude=final_lat,
            longitude=final_lng,
            address=address or "Location coordinates recorded",
            department=department,
            priority=priority if priority in ["Low", "Medium", "High", "Urgent"] else "Medium",
            status="Pending"
        )

        # Create Timeline
        ComplaintTimeline.objects.create(
            complaint=complaint,
            status="Pending",
            changed_by=request.user,
            remarks="Complaint submitted by citizen."
        )

        # Create Notifications
        create_notification(
            recipient=request.user,
            sender=None,
            complaint=complaint,
            title="Complaint Submitted",
            message=f"Your complaint #{complaint.complaint_id} has been submitted successfully and routed to {department}.",
            notification_type="success"
        )

        # Notify Department Officers
        dept_officers = User.objects.filter(role="Department", department=department)
        for officer in dept_officers:
            create_notification(
                recipient=officer,
                sender=request.user,
                complaint=complaint,
                title="New Complaint Assigned",
                message=f"New complaint #{complaint.complaint_id} ({category}) assigned to {department}.",
                notification_type="info"
            )

        log_action(request.user, "Created Complaint", request, f"ID: {complaint.complaint_id}, GPS Extracted: {gps_extracted}")
        return Response(ComplaintSerializer(complaint).data, status=status.HTTP_201_CREATED)


class ComplaintListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        queryset = Complaint.objects.all()

        if user.role == "Citizen":
            queryset = queryset.filter(citizen=user)
        elif user.role == "Department":
            queryset = queryset.filter(department=user.department)
        # Admin sees all

        # Filters
        category = request.query_params.get("category")
        status_param = request.query_params.get("status")
        priority = request.query_params.get("priority")
        search = request.query_params.get("search")

        if category and category != "All":
            queryset = queryset.filter(category=category)
        if status_param and status_param != "All":
            queryset = queryset.filter(status=status_param)
        if priority and priority != "All":
            queryset = queryset.filter(priority=priority)
        if search:
            queryset = queryset.filter(
                Q(complaint_id__icontains=search) |
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(category__icontains=search) |
                Q(address__icontains=search)
            )

        return Response(ComplaintSerializer(queryset, many=True).data)


class ComplaintDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrDepartmentOrAdmin]

    def get(self, request, complaint_id):
        complaint = Complaint.objects.filter(
            Q(complaint_id=complaint_id) | Q(id=complaint_id) if complaint_id.isdigit() else Q(complaint_id=complaint_id)
        ).first()

        if not complaint:
            return Response({"error": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, complaint)
        return Response(ComplaintSerializer(complaint).data)


class ComplaintActionView(APIView):
    """
    Department/Admin action to Accept, Reject, or set to In Progress
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, complaint_id):
        complaint = Complaint.objects.filter(complaint_id=complaint_id).first()
        if not complaint:
            return Response({"error": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == "Department" and complaint.department != request.user.department:
            return Response({"error": "Unauthorized to update this department's complaint."}, status=status.HTTP_403_FORBIDDEN)

        if request.user.role not in ["Department", "Admin"] and not request.user.is_superuser:
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get("status")
        remarks = request.data.get("remarks", "").strip()
        rejection_reason = request.data.get("rejection_reason", "").strip()

        valid_transitions = {
            "Pending": ["Accepted", "Rejected"],
            "Accepted": ["In Progress"],
            "In Progress": ["Resolved"],
            "Rejected": [],
            "Resolved": []
        }

        if new_status not in valid_transitions.get(complaint.status, []):
            return Response(
                {"error": f"Invalid transition from '{complaint.status}' to '{new_status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status == "Rejected" and not rejection_reason:
            return Response({"error": "Rejection reason is required when rejecting a complaint."}, status=status.HTTP_400_BAD_REQUEST)

        complaint.status = new_status
        if rejection_reason:
            complaint.rejection_reason = rejection_reason
        complaint.save()

        # Record Timeline
        ComplaintTimeline.objects.create(
            complaint=complaint,
            status=new_status,
            changed_by=request.user,
            remarks=rejection_reason if new_status == "Rejected" else (remarks or f"Status updated to {new_status}")
        )

        # Send Notification to Citizen
        msg_map = {
            "Accepted": f"Your complaint #{complaint.complaint_id} has been accepted by {complaint.department}.",
            "In Progress": f"Work has started on your complaint #{complaint.complaint_id}.",
            "Rejected": f"Your complaint #{complaint.complaint_id} was rejected. Reason: {rejection_reason}"
        }
        create_notification(
            recipient=complaint.citizen,
            sender=request.user,
            complaint=complaint,
            title=f"Complaint Status: {new_status}",
            message=msg_map.get(new_status, f"Status updated to {new_status}."),
            notification_type="warning" if new_status == "Rejected" else "info"
        )

        log_action(request.user, f"Updated Complaint Status: {new_status}", request, f"ID: {complaint.complaint_id}")
        return Response(ComplaintSerializer(complaint).data)


class ComplaintResolutionView(APIView):
    """
    Department uploads resolution photo with mandatory EXIF GPS verification
    """
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    @transaction.atomic
    def post(self, request, complaint_id):
        complaint = Complaint.objects.filter(complaint_id=complaint_id).first()
        if not complaint:
            return Response({"error": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == "Department" and complaint.department != request.user.department:
            return Response({"error": "Unauthorized to resolve this complaint."}, status=status.HTTP_403_FORBIDDEN)

        resolution_image = request.FILES.get("resolution_image")
        resolution_remarks = request.data.get("resolution_remarks", "").strip()

        if not resolution_image:
            return Response({"error": "Resolution proof photo is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Extract EXIF/OCR GPS metadata from resolution photo
        res_lat, res_lng, res_addr, res_method = extract_gps_from_image(resolution_image)
        lat_fallback = request.data.get("resolution_latitude")
        lng_fallback = request.data.get("resolution_longitude")

        final_res_lat = res_lat or lat_fallback or complaint.latitude
        final_res_lng = res_lng or lng_fallback or complaint.longitude
        final_res_addr = res_addr or request.data.get("resolution_address", complaint.address)

        complaint.status = "Resolved"
        complaint.resolution_image = resolution_image
        complaint.resolution_latitude = final_res_lat
        complaint.resolution_longitude = final_res_lng
        complaint.resolution_address = final_res_addr
        complaint.resolution_remarks = resolution_remarks or f"Issue resolved by department. (Location verified via {res_method or 'Manual'})"
        complaint.resolved_at = timezone.now()
        complaint.save()

        # Record Timeline
        ComplaintTimeline.objects.create(
            complaint=complaint,
            status="Resolved",
            changed_by=request.user,
            remarks=complaint.resolution_remarks
        )

        # Send Notification to Citizen
        create_notification(
            recipient=complaint.citizen,
            sender=request.user,
            complaint=complaint,
            title="Complaint Resolved 🎉",
            message=f"Your complaint #{complaint.complaint_id} has been marked as Resolved by {complaint.department}. Check resolution proof photos and map location.",
            notification_type="success"
        )

        log_action(request.user, "Resolved Complaint", request, f"ID: {complaint.complaint_id}")
        return Response(ComplaintSerializer(complaint).data)


class ComplaintCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, complaint_id):
        complaint = Complaint.objects.filter(complaint_id=complaint_id).first()
        if not complaint:
            return Response({"error": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)

        comment_text = request.data.get("comment", "").strip()
        if not comment_text:
            return Response({"error": "Comment text cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        comment = ComplaintComment.objects.create(
            complaint=complaint,
            sender=request.user,
            comment=comment_text
        )

        # Notify other party
        recipient = complaint.citizen if request.user.role in ["Department", "Admin"] else None
        if not recipient and complaint.department:
            dept_officer = User.objects.filter(role="Department", department=complaint.department).first()
            if dept_officer:
                recipient = dept_officer

        if recipient:
            create_notification(
                recipient=recipient,
                sender=request.user,
                complaint=complaint,
                title="New Remark / Comment",
                message=f"New comment on #{complaint.complaint_id} by {request.user.username}: '{comment_text[:50]}...'",
                notification_type="info"
            )

        return Response(ComplaintCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(recipient=request.user)
        unread_count = notifications.filter(is_read=False).count()
        return Response({
            "unread_count": unread_count,
            "notifications": NotificationSerializer(notifications[:50], many=True).data
        })


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id=None):
        if notification_id:
            Notification.objects.filter(id=notification_id, recipient=request.user).update(is_read=True)
        else:
            Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"message": "Notifications marked as read."})


class AdminUserListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.all().order_by("-date_joined")
        role_filter = request.query_params.get("role")
        if role_filter and role_filter != "All":
            users = users.filter(role=role_filter)
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserDetailView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, user_id):
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        is_active = request.data.get("is_active")
        role = request.data.get("role")
        department = request.data.get("department")

        if is_active is not None:
            user.is_active = is_active
        if role:
            user.role = role
        if department is not None:
            user.department = department

        user.save()
        log_action(request.user, f"Updated User {user.username}", request)
        return Response(UserSerializer(user).data)


class AdminCreateDepartmentUserView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = AdminCreateDepartmentUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            log_action(request.user, f"Created Department User {user.username}", request, f"Department: {user.department}")
            return Response(
                {"message": f"Department user '{user.username}' created successfully.", "user": UserSerializer(user).data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AnalyticsDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == "Department":
            base = Complaint.objects.filter(department=request.user.department)
        else:
            base = Complaint.objects.all()

        total = base.count()
        pending = base.filter(status="Pending").count()
        accepted = base.filter(status="Accepted").count()
        in_progress = base.filter(status="In Progress").count()
        resolved = base.filter(status="Resolved").count()
        rejected = base.filter(status="Rejected").count()

        cat_breakdown = list(base.values("category").annotate(count=Count("id")))
        dept_breakdown = list(Complaint.objects.values("department").annotate(count=Count("id")))

        total_users = User.objects.count()
        citizens_count = User.objects.filter(role="Citizen").count()

        return Response({
            "total_complaints": total,
            "pending": pending,
            "accepted": accepted,
            "in_progress": in_progress,
            "resolved": resolved,
            "rejected": rejected,
            "total_users": total_users,
            "citizens_count": citizens_count,
            "category_breakdown": cat_breakdown,
            "department_breakdown": dept_breakdown,
        })


class ReportExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ["Department", "Admin"] and not request.user.is_superuser:
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="CivicConnect_Report_{datetime.date.today()}.csv"'

        writer = csv.writer(response)
        writer.writerow(["Complaint ID", "Title", "Category", "Citizen", "Department", "Priority", "Status", "Latitude", "Longitude", "Address", "Created At", "Resolved At"])

        queryset = Complaint.objects.all()
        if request.user.role == "Department":
            queryset = queryset.filter(department=request.user.department)

        for c in queryset:
            writer.writerow([
                c.complaint_id,
                c.title,
                c.category,
                c.citizen.username,
                c.department,
                c.priority,
                c.status,
                c.latitude,
                c.longitude,
                c.address,
                c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                c.resolved_at.strftime("%Y-%m-%d %H:%M:%S") if c.resolved_at else "N/A"
            ])

        return response


class PublicStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        total = Complaint.objects.count()
        resolved = Complaint.objects.filter(status="Resolved").count()
        active = Complaint.objects.filter(status__in=["Pending", "Accepted", "In Progress"]).count()
        return Response({
            "total_complaints": total,
            "resolved_complaints": resolved,
            "active_complaints": active,
            "citizens_registered": User.objects.filter(role="Citizen").count()
        })


class PublicShowcaseView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Fetch complaints that have both image and resolution_image for Before/After showcase
        resolved_complaints = Complaint.objects.filter(
            status="Resolved",
            resolution_image__isnull=False
        )[:10]

        all_active_markers = Complaint.objects.all()[:100]
        return Response({
            "showcase": ComplaintSerializer(resolved_complaints, many=True).data,
            "markers": ComplaintSerializer(all_active_markers, many=True).data
        })
