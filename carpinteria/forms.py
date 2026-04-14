from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User


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
