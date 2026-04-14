import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carpinteria.settings')
import django
django.setup()

from carpinteria.models import Producto, Categoria

# Obtener una categoría
cat = Categoria.objects.first()
print(f'Categoría: {cat}')

# Crear un producto de prueba
try:
    p = Producto.objects.create(
        nombre='Producto Test 123',
        categoria=cat,
        precio=1500.00,
        descripcion='Este es un producto de prueba',
        materiales='Madera de pino',
        imagen='https://via.placeholder.com/500x500'
    )
    print(f'✓ Producto creado: {p}')
    print(f'Total de productos: {Producto.objects.count()}')
except Exception as e:
    print(f'✗ Error: {e}')
    import traceback
    traceback.print_exc()
