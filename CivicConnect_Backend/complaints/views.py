from django.contrib.auth import authenticate

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Complaint
from .serializers import RegisterSerializer, ComplaintSerializer


# ==========================================
# Register API
# ==========================================

class RegisterUserView(APIView):

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():

            serializer.save()

            return Response(
                {"message": "Registration Successful"},
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ==========================================
# Login API
# ==========================================

class LoginView(APIView):

    def post(self, request):

        email = request.data.get("email")
        password = request.data.get("password")

        try:
            user = User.objects.get(email=email)

        except User.DoesNotExist:

            return Response(
                {"error": "Invalid Email"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = authenticate(
            username=user.username,
            password=password
        )

        if user is None:

            return Response(
                {"error": "Invalid Password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)

        return Response({

            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role

        })


# ==========================================
# Create Complaint API
# ==========================================

class ComplaintCreateView(APIView):

    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):

        serializer = ComplaintSerializer(data=request.data)

        if serializer.is_valid():

            serializer.save()

            return Response(
                {"message": "Complaint Submitted Successfully"},
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ==========================================
# Get All Complaints API
# ==========================================

class ComplaintListView(APIView):

    def get(self, request):

        complaints = Complaint.objects.all().order_by("-created_at")

        serializer = ComplaintSerializer(
            complaints,
            many=True
        )

        return Response(serializer.data)


# ==========================================
# Get Single Complaint API
# ==========================================

class ComplaintDetailView(APIView):

    def get(self, request, complaint_id):

        try:

            complaint = Complaint.objects.get(
                complaint_id=complaint_id
            )

        except Complaint.DoesNotExist:

            return Response(
                {"error": "Complaint not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ComplaintSerializer(complaint)

        return Response(serializer.data)


# ==========================================
# Update Complaint Status API
# ==========================================

class ComplaintStatusUpdateView(APIView):

    def patch(self, request, complaint_id):

        try:

            complaint = Complaint.objects.get(
                complaint_id=complaint_id
            )

        except Complaint.DoesNotExist:

            return Response(
                {"error": "Complaint not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        complaint.status = request.data.get("status")

        complaint.save()

        serializer = ComplaintSerializer(complaint)

        return Response(serializer.data)