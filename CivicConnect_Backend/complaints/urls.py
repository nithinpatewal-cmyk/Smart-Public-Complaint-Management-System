from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterUserView,
    LoginView,
    UserProfileView,
    ChangePasswordView,
    ComplaintCreateView,
    ComplaintListView,
    ComplaintDetailView,
    ComplaintActionView,
    ComplaintResolutionView,
    ComplaintCommentView,
    NotificationListView,
    NotificationMarkReadView,
    AdminUserListView,
    AdminUserDetailView,
    AdminCreateDepartmentUserView,
    AnalyticsDashboardView,
    ReportExportView,
    PublicStatsView,
    PublicShowcaseView
)

urlpatterns = [
    # Auth & Tokens
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("register/", RegisterUserView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("profile/change-password/", ChangePasswordView.as_view(), name="change-password"),

    # Complaint APIs
    path("complaint/", ComplaintCreateView.as_view(), name="complaint-create"),
    path("complaints/", ComplaintListView.as_view(), name="complaint-list"),
    path("complaints/<str:complaint_id>/", ComplaintDetailView.as_view(), name="complaint-detail"),
    path("complaints/<str:complaint_id>/action/", ComplaintActionView.as_view(), name="complaint-action"),
    path("complaints/<str:complaint_id>/status/", ComplaintActionView.as_view(), name="complaint-status"),
    path("complaints/<str:complaint_id>/resolve/", ComplaintResolutionView.as_view(), name="complaint-resolve"),
    path("complaints/<str:complaint_id>/comments/", ComplaintCommentView.as_view(), name="complaint-comments"),

    # Notifications
    path("notifications/", NotificationListView.as_view(), name="notifications"),
    path("notifications/read/", NotificationMarkReadView.as_view(), name="notifications-read-all"),
    path("notifications/<int:notification_id>/read/", NotificationMarkReadView.as_view(), name="notifications-read-single"),

    # Analytics & Reports
    path("analytics/", AnalyticsDashboardView.as_view(), name="analytics"),
    path("reports/export/", ReportExportView.as_view(), name="reports-export"),

    # Admin Management
    path("admin/users/", AdminUserListView.as_view(), name="admin-users"),
    path("admin/users/<int:user_id>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("admin/create-department-user/", AdminCreateDepartmentUserView.as_view(), name="admin-create-department-user"),

    # Public Endpoints
    path("public/stats/", PublicStatsView.as_view(), name="public-stats"),
    path("public/showcase/", PublicShowcaseView.as_view(), name="public-showcase"),
]
