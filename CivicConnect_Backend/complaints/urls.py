from django.urls import path

from .views import (
    RegisterUserView,
    LoginView,
    ComplaintCreateView,
    ComplaintListView,
    ComplaintDetailView,
    ComplaintStatusUpdateView,
)

urlpatterns = [

    # ==========================================
    # User APIs
    # ==========================================

    path(
        "register/",
        RegisterUserView.as_view(),
        name="register"
    ),

    path(
        "login/",
        LoginView.as_view(),
        name="login"
    ),

    # ==========================================
    # Complaint APIs
    # ==========================================

    path(
        "complaint/",
        ComplaintCreateView.as_view(),
        name="complaint"
    ),

    path(
        "complaints/",
        ComplaintListView.as_view(),
        name="complaints"
    ),

    path(
        "complaints/<str:complaint_id>/",
        ComplaintDetailView.as_view(),
        name="complaint-detail"
    ),

    path(
        "complaints/<str:complaint_id>/status/",
        ComplaintStatusUpdateView.as_view(),
        name="complaint-status"
    ),

]