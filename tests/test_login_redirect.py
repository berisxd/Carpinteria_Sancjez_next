from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse


class LoginRedirectTest(TestCase):
    def test_staff_user_can_log_in_with_email_and_is_redirected_to_admin_panel(self):
        password = 'admin12345'
        User.objects.create_user(
            username='admin_render',
            email='admin@admin.com',
            password=password,
            is_staff=True,
            is_superuser=True,
        )

        response = self.client.post(reverse('login'), {
            'username': 'admin@admin.com',
            'password': password,
        })

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.headers['Location'], reverse('admin_panel'))

    def test_regular_user_logs_in_with_email_and_is_redirected_home(self):
        password = 'cliente12345'
        User.objects.create_user(
            username='cliente_render',
            email='cliente@example.com',
            password=password,
            is_staff=False,
        )

        response = self.client.post(reverse('login'), {
            'username': 'cliente@example.com',
            'password': password,
        })

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.headers['Location'], reverse('home'))