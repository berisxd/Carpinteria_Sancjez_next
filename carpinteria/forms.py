from django import forms
from django.contrib.auth import authenticate
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User


class EmailOrUsernameAuthenticationForm(AuthenticationForm):
    username = forms.CharField(label='Correo electrónico o usuario')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].widget.attrs.update({
            'class': 'form-control form-control-lg',
            'placeholder': 'correo@ejemplo.com',
            'autocomplete': 'username',
        })
        self.fields['password'].widget.attrs.update({
            'class': 'form-control form-control-lg',
            'placeholder': 'Contraseña',
            'autocomplete': 'current-password',
        })

    def clean(self):
        username = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')

        if username and password:
            login_value = username.strip()
            user = User.objects.filter(email__iexact=login_value).first()
            if user is not None:
                login_value = user.get_username()

            self.user_cache = authenticate(self.request, username=login_value, password=password)
            if self.user_cache is None:
                raise self.get_invalid_login_error()
            self.confirm_login_allowed(self.user_cache)

        return self.cleaned_data


class CustomUserCreationForm(UserCreationForm):
    full_name = forms.CharField(max_length=200, required=True, label='Nombre completo')
    direccion = forms.CharField(max_length=500, required=True, label='Dirección')
    telefono = forms.CharField(max_length=50, required=True, label='Teléfono')
    email = forms.EmailField(required=True, label='Correo electrónico')

    class Meta:
        model = User
        # keep username field (it will be populated with the email and hidden in the template)
        fields = ('username', 'email', 'full_name', 'direccion', 'telefono', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # hide username input; we will use email as the username
        if 'username' in self.fields:
            self.fields['username'].widget = forms.HiddenInput()
            self.fields['username'].required = False

        for field_name, field in self.fields.items():
            if isinstance(field.widget, forms.HiddenInput):
                continue
            field.widget.attrs.update({
                'class': 'form-control form-control-lg',
                'placeholder': field.label,
            })
            if field_name in ['password1', 'password2']:
                field.widget.attrs['autocomplete'] = 'new-password'
            elif field_name == 'email':
                field.widget.attrs['autocomplete'] = 'email'
            else:
                field.widget.attrs['autocomplete'] = 'off'

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email and User.objects.filter(username__iexact=email).exists():
            raise forms.ValidationError('Ya existe una cuenta registrada con ese correo.')
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        email = self.cleaned_data['email']
        # use email as username
        user.username = email
        user.email = email
        if commit:
            user.save()
            # Save profile fields
            try:
                profile = user.profile
            except Exception:
                from .models import Profile
                profile = Profile.objects.create(user=user)

            profile.full_name = self.cleaned_data.get('full_name', '')
            profile.direccion = self.cleaned_data.get('direccion', '')
            profile.telefono = self.cleaned_data.get('telefono', '')
            profile.save()

        return user
