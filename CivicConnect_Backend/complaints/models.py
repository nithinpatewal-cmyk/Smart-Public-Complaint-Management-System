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

    email = models.EmailField(
        unique=True,
        error_messages={
            "unique": "A user with that email address already exists."
        }
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="Citizen"
    )

    department = models.CharField(
        max_length=100,
        blank=True,
        choices=[
            ("Road Department", "Road Department"),
            ("Sanitation Department", "Sanitation Department"),
            ("Electrical Department", "Electrical Department"),
            ("Water Department", "Water Department"),
        ],
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

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = "Admin"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"


# ===========================
# Complaint Model
# ===========================

class Complaint(models.Model):

    PRIORITY_CHOICES = [
        ("Low", "Low"),
        ("Medium", "Medium"),
        ("High", "High"),
        ("Urgent", "Urgent"),
    ]

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
        unique=True,
        db_index=True
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

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="Medium"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending"
    )

    rejection_reason = models.TextField(
        blank=True
    )

    # Resolution proof fields
    resolution_image = models.ImageField(
        upload_to="resolutions/",
        blank=True,
        null=True
    )

    resolution_latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True
    )

    resolution_longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True
    )

    resolution_address = models.TextField(
        blank=True
    )

    resolution_remarks = models.TextField(
        blank=True
    )

    resolved_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["department"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return f"{self.complaint_id} - {self.title}"


# ===========================
# Complaint Timeline Model
# ===========================

class ComplaintTimeline(models.Model):
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name="timeline"
    )
    status = models.CharField(max_length=50)
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    remarks = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"{self.complaint.complaint_id} -> {self.status}"


# ===========================
# Complaint Comment Model
# ===========================

class ComplaintComment(models.Model):
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name="comments"
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.sender.username} on {self.complaint.complaint_id}"


# ===========================
# Notification Model
# ===========================

class Notification(models.Model):
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default="info")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"


# ===========================
# Audit Log Model
# ===========================

class AuditLog(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    action = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"[{self.timestamp}] {self.user} - {self.action}"
