import re
from rest_framework import serializers
from .models import User, Complaint, ComplaintTimeline, ComplaintComment, Notification, AuditLog


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "department", "phone", "address", "profile_image", "date_joined")
        read_only_fields = ("id", "date_joined")


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=6, error_messages={"min_length": "Password must be at least 6 characters long."})
    confirm_password = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(required=True, max_length=15)
    address = serializers.CharField(required=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "confirm_password", "phone", "address", "role")

    def validate_username(self, value):
        username = value.strip()
        if not re.match(r'^[a-zA-Z0-9_.]+$', username):
            raise serializers.ValidationError("Username can only contain letters, numbers, dots, and underscores.")
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return username

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A user with that email address already exists.")
        return email

    def validate_phone(self, value):
        phone = value.strip()
        # Clean phone digits
        cleaned_phone = re.sub(r'[\s\-+]', '', phone)
        if not re.match(r'^\d{10,12}$', cleaned_phone):
            raise serializers.ValidationError("Please enter a valid 10-digit mobile number.")
        return cleaned_phone

    def validate(self, data):
        password = data.get("password")
        confirm_password = data.pop("confirm_password", None)
        if password != confirm_password:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(
            username=validated_data["username"].strip(),
            email=validated_data["email"].strip().lower(),
            role=validated_data["role"],
            department="",
            phone=validated_data.get("phone", "").strip(),
            address=validated_data.get("address", "").strip()
        )
        user.set_password(password)
        user.save()
        return user


class AdminCreateDepartmentUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=6)
    department = serializers.ChoiceField(choices=[
        ("Road Department", "Road Department"),
        ("Sanitation Department", "Sanitation Department"),
        ("Electrical Department", "Electrical Department"),
        ("Water Department", "Water Department"),
    ], required=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "department", "phone")

    def validate_username(self, value):
        username = value.strip()
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return username

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A user with that email address already exists.")
        return email

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(
            username=validated_data["username"].strip(),
            email=validated_data["email"].strip().lower(),
            role="Department",
            department=validated_data["department"],
            phone=validated_data.get("phone", "").strip()
        )
        user.set_password(password)
        user.save()
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("phone", "address", "profile_image", "email")



class ComplaintTimelineSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.username", read_only=True)

    class Meta:
        model = ComplaintTimeline
        fields = ("id", "status", "changed_by_name", "remarks", "timestamp")


class ComplaintCommentSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    sender_role = serializers.CharField(source="sender.role", read_only=True)

    class Meta:
        model = ComplaintComment
        fields = ("id", "sender", "sender_name", "sender_role", "comment", "created_at")
        read_only_fields = ("id", "sender", "created_at")


class ComplaintSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source="citizen.username", read_only=True)
    citizen_email = serializers.CharField(source="citizen.email", read_only=True)
    citizen_phone = serializers.CharField(source="citizen.phone", read_only=True)
    timeline = ComplaintTimelineSerializer(many=True, read_only=True)
    comments = ComplaintCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = (
            "id",
            "complaint_id",
            "citizen",
            "citizen_name",
            "citizen_email",
            "citizen_phone",
            "category",
            "title",
            "description",
            "image",
            "latitude",
            "longitude",
            "address",
            "department",
            "priority",
            "status",
            "rejection_reason",
            "resolution_image",
            "resolution_latitude",
            "resolution_longitude",
            "resolution_address",
            "resolution_remarks",
            "resolved_at",
            "created_at",
            "updated_at",
            "timeline",
            "comments"
        )
        read_only_fields = (
            "id",
            "complaint_id",
            "citizen",
            "department",
            "created_at",
            "updated_at"
        )


class ComplaintStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["Accepted", "In Progress", "Resolved", "Rejected"])
    remarks = serializers.CharField(required=False, allow_blank=True)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "recipient", "sender", "complaint", "title", "message", "notification_type", "is_read", "created_at")


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = AuditLog
        fields = ("id", "user", "user_name", "action", "ip_address", "details", "timestamp")
