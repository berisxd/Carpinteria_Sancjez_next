from django.core.management.base import BaseCommand, CommandError

from carpinteria.models import Categoria, Producto


class Command(BaseCommand):
    help = "Create one test product for manual verification."

    def handle(self, *args, **options):
        categoria = Categoria.objects.first()
        if not categoria:
            raise CommandError("No existe ninguna categoria. Crea una antes de correr este comando.")

        producto, created = Producto.objects.get_or_create(
            nombre="Producto Test 123",
            defaults={
                "categoria": categoria,
                "precio": 1500.00,
                "descripcion": "Este es un producto de prueba",
                "materiales": "Madera de pino",
                "imagen": "https://via.placeholder.com/500x500",
            },
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f"Producto creado: {producto}"))
        else:
            self.stdout.write(self.style.WARNING(f"Producto ya existente: {producto}"))

        self.stdout.write(f"Total de productos: {Producto.objects.count()}")
