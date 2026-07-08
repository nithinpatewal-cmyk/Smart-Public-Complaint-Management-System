from rest_framework import serializers
from .models import User, Complaint


# ==========================
# User Registration
# ==========================

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "phone",
            "address",
        )

    def create(self, validated_data):

        password = validated_data.pop("password")

        user = User(**validated_data)

        user.set_password(password)

        user.save()

        return user


# ==========================
# Complaint Serializer
# ==========================

class ComplaintSerializer(serializers.ModelSerializer):

    citizen_name = serializers.CharField(
        source="citizen.username",
        read_only=True
    )

    class Meta:
        model = Complaint

        fields = "__all__"