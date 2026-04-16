import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create or update an admin user from environment variables."

    def handle(self, *args, **options):
        email = os.environ.get("ADMIN_EMAIL", "admin@admin.com").strip()
        username = os.environ.get("ADMIN_USERNAME", email).strip() or email
        password = os.environ.get("ADMIN_PASSWORD", "admin").strip()

        User = get_user_model()
        user = User.objects.filter(email=email).first()

        if user is None:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
            )
            created = True
        else:
            created = False
            if user.username != username:
                user.username = username

            if password:
                user.set_password(password)

        user.is_staff = True
        user.is_superuser = True
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Admin created: {email}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Admin updated: {email}"))