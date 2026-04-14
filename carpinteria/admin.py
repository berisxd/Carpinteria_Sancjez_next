from django.contrib import admin
from .models import Contacto, Producto, Pedido


@admin.register(Contacto)
class ContactoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'contacto', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria', 'precio', 'created_at')
    list_filter = ('categoria', 'created_at')
    search_fields = ('nombre', 'descripcion')
    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'categoria', 'precio')
        }),
        ('Detalles', {
            'fields': ('descripcion', 'materiales', 'imagen')
        }),
    )


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre_destinatario', 'total', 'metodo_pago', 'estado', 'created_at')
    list_filter = ('estado', 'metodo_pago', 'created_at')
    search_fields = ('nombre_destinatario', 'email', 'telefono')
    readonly_fields = ('created_at', 'updated_at', 'productos_json')
    fieldsets = (
        ('Información del Pedido', {
            'fields': ('id', 'estado', 'created_at', 'updated_at')
        }),
        ('Datos del Destinatario', {
            'fields': ('nombre_destinatario', 'email', 'telefono')
        }),
        ('Dirección de Entrega', {
            'fields': ('direccion', 'ciudad', 'codigo_postal', 'referencia')
        }),
        ('Pago', {
            'fields': ('total', 'metodo_pago')
        }),
        ('Productos', {
            'fields': ('productos_json',)
        }),
    )
