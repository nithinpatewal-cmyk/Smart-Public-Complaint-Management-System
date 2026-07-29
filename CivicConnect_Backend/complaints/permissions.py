from rest_framework.permissions import BasePermission


class RolePermission(BasePermission):
    roles = ()

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.role in self.roles)
        )


class IsCitizen(RolePermission):
    roles = ("Citizen",)


class IsDepartment(RolePermission):
    roles = ("Department",)


class IsAdmin(RolePermission):
    roles = ("Admin",)


class IsOwnerOrDepartmentOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role == "Admin" or request.user.is_superuser:
            return True

        if request.user.role == "Citizen" and obj.citizen == request.user:
            return True

        if request.user.role == "Department" and obj.department == request.user.department:
            return True

        return False
