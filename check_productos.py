import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carpinteria.settings')
import django
django.setup()

from carpinteria.models import Producto, Categoria

total = Producto.objects.count()
print(f'Total de productos: {total}')

print('\nUltimos 5 productos:')
for p in Producto.objects.order_by('-created_at')[:5]:
    print(f'  {p.id}: {p.nombre} (Crear en {p.created_at})')
