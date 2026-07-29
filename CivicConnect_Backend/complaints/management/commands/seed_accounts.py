from django.core.management.base import BaseCommand
from complaints.models import User


class Command(BaseCommand):
    help = "Seeds default Admin and Department Officer accounts for CivicConnect"

    def handle(self, *args, **options):
        # 1. Seed / Repair Admin Account
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@civicconnect.gov",
                "role": "Admin",
                "is_superuser": True,
                "is_staff": True,
            }
        )
        admin_user.set_password("admin123")
        admin_user.role = "Admin"
        admin_user.is_superuser = True
        admin_user.is_staff = True
        admin_user.email = "admin@civicconnect.gov"
        admin_user.save()
        self.stdout.write(self.style.SUCCESS(f"Admin user 'admin' (password: admin123) {'created' if created else 'updated'}."))

        # 2. Seed Department Officers
        departments = [
            ("road_officer", "road@civicconnect.gov", "Road Department"),
            ("sanitation_officer", "sanitation@civicconnect.gov", "Sanitation Department"),
            ("electrical_officer", "electrical@civicconnect.gov", "Electrical Department"),
            ("water_officer", "water@civicconnect.gov", "Water Department"),
        ]

        for username, email, dept in departments:
            u, c = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "role": "Department",
                    "department": dept,
                }
            )
            u.set_password("dept123")
            u.role = "Department"
            u.department = dept
            u.email = email
            u.save()
            self.stdout.write(self.style.SUCCESS(f"Department officer '{username}' ({dept}, password: dept123) {'created' if c else 'updated'}."))
