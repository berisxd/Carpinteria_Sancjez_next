from django.core.management.base import BaseCommand

from carpinteria.models import Producto


class Command(BaseCommand):
    help = "Show quick stats and latest products."

    def handle(self, *args, **options):
        total = Producto.objects.count()
        self.stdout.write(f"Total de productos: {total}")

        self.stdout.write("\nUltimos 5 productos:")
        for producto in Producto.objects.order_by("-created_at")[:5]:
            self.stdout.write(
                f"  {producto.id}: {producto.nombre} (Creado en {producto.created_at})"
            )
