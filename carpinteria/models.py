from django.db import models
from django.utils.text import slugify


class Contacto(models.Model):
    nombre = models.CharField(max_length=120)
    contacto = models.CharField(max_length=200, help_text='Teléfono o email')
    mensaje = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.nombre} — {self.contacto}"


class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['nombre']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    nombre = models.CharField(max_length=200)
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name='productos')
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion = models.TextField()
    materiales = models.TextField(help_text='Ejemplo: Madera de pino, herrajes de acero inoxidable')
    imagen = models.URLField()
    habilitado = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.nombre} ({self.categoria.nombre})"


class Pedido(models.Model):
    METODOS_PAGO = [
        ('tarjeta', 'Tarjeta de Crédito/Débito'),
        ('mercado_pago', 'Mercado Pago'),
        ('ticket_tienda', 'Pago en Carpintería (Ticket)'),
    ]
    
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('confirmado', 'Confirmado'),
        ('procesando', 'Procesando'),
        ('enviado', 'Enviado'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]
    
    nombre_destinatario = models.CharField(max_length=200)
    email = models.EmailField()
    telefono = models.CharField(max_length=20)
    direccion = models.CharField(max_length=500)
    ciudad = models.CharField(max_length=100)
    codigo_postal = models.CharField(max_length=20)
    referencia = models.CharField(max_length=500, blank=True, help_text='Referencia adicional (apto, piso, etc.)')
    
    total = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(max_length=50, choices=METODOS_PAGO)
    estado = models.CharField(max_length=50, choices=ESTADOS, default='pendiente')
    
    productos_json = models.TextField(help_text='Productos en formato JSON')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Pedido #{self.id} — {self.nombre_destinatario} ({self.estado})"


class Profile(models.Model):
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=200, blank=True)
    direccion = models.CharField(max_length=500, blank=True)
    telefono = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"Profile: {self.user.username}"


class Cotizacion(models.Model):
    TIPOS_MUEBLE = [
        ('cocinas_integrales', 'Cocinas Integrales'),
        ('closets', 'Closets y Armarios'),
        ('puertas', 'Puertas'),
        ('muebles_personalizados', 'Muebles Personalizados'),
        ('instalacion_montaje', 'Instalación y Montaje'),
        ('otro', 'Otro'),
    ]
    
    nombre = models.CharField(max_length=200)
    email = models.EmailField()
    telefono = models.CharField(max_length=20)
    tipo_mueble = models.CharField(max_length=50, choices=TIPOS_MUEBLE)
    descripcion = models.TextField(help_text='Describe el mueble que necesitas, medidas, materiales preferidos, etc.')
    imagen_referencia = models.ImageField(upload_to='cotizaciones/', blank=True, null=True, help_text='Sube una imagen de referencia (opcional)')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Cotización'
        verbose_name_plural = 'Cotizaciones'
    
    def __str__(self):
        return f"Cotización #{self.id} — {self.nombre} ({self.get_tipo_mueble_display()})"


from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    else:
        try:
            instance.profile.save()
        except Profile.DoesNotExist:
            Profile.objects.create(user=instance)
