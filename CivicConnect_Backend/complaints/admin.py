from django.contrib import admin
from .models import User, Complaint


@admin.register(User)
class UserAdmin(admin.ModelAdmin):

    list_display = (
        "username",
        "email",
        "role",
        "phone",
    )


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):

    list_display = (
        "complaint_id",
        "citizen",
        "category",
        "status",
        "created_at",
    )

    list_filter = (
        "category",
        "status",
    )

    search_fields = (
        "complaint_id",
        "title",
    )