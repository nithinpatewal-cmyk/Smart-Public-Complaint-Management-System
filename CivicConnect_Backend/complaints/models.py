from django.db import models
from django.contrib.auth.models import AbstractUser


# ===========================
# Custom User Model
# ===========================

class User(AbstractUser):

    ROLE_CHOICES = [
        ("Citizen", "Citizen"),
        ("Department", "Department"),
        ("Admin", "Admin"),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="Citizen"
    )

    phone = models.CharField(
        max_length=15,
        blank=True
    )

    address = models.TextField(
        blank=True
    )

    profile_image = models.ImageField(
        upload_to="profiles/",
        blank=True,
        null=True
    )

    def __str__(self):
        return self.username


# ===========================
# Complaint Model
# ===========================

class Complaint(models.Model):

    CATEGORY_CHOICES = [
        ("Road Damage", "Road Damage"),
        ("Garbage", "Garbage"),
        ("Street Light", "Street Light"),
        ("Water Leakage", "Water Leakage"),
    ]

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Accepted", "Accepted"),
        ("In Progress", "In Progress"),
        ("Resolved", "Resolved"),
        ("Rejected", "Rejected"),
    ]

    complaint_id = models.CharField(
        max_length=20,
        unique=True
    )

    citizen = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="complaints"
    )

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES
    )

    title = models.CharField(
        max_length=200
    )

    description = models.TextField()

    image = models.ImageField(
        upload_to="complaints/"
    )

    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7
    )

    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7
    )

    address = models.TextField()

    department = models.CharField(
        max_length=100,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.complaint_id