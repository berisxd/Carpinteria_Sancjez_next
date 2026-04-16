from django.core.management.base import BaseCommand

from carpinteria.models import Categoria, Producto


PRODUCTOS = [
    {
        "nombre": "Cocina Integral Moderna",
        "categoria": "Cocinas Integrales",
        "slug": "cocinas-integrales",
        "precio": 8500.00,
        "descripcion": "Cocina integral de alta gama con diseño moderno y funcional.",
        "materiales": "Madera de pino premium, herrajes de acero inoxidable.",
        "imagen": "https://plus.unsplash.com/premium_photo-1683141179507-734e6157ddba?w=500&auto=format&fit=crop&q=60",
    },
    {
        "nombre": "Cocina Compacta",
        "categoria": "Cocinas Integrales",
        "slug": "cocinas-integrales",
        "precio": 4200.00,
        "descripcion": "Cocina compacta para apartamentos y espacios reducidos.",
        "materiales": "Madera de pino, herrajes cromados.",
        "imagen": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=60",
    },
    {
        "nombre": "Closet Empotrado Modular",
        "categoria": "Closets",
        "slug": "closets",
        "precio": 6500.00,
        "descripcion": "Closet empotrado con sistema modular ajustable.",
        "materiales": "Madera de cedro, puertas con espejo de seguridad.",
        "imagen": "https://images.unsplash.com/photo-1640357154220-9775b0f31dec?q=80&w=870&auto=format&fit=crop",
    },
    {
        "nombre": "Armario Zapatera",
        "categoria": "Closets",
        "slug": "closets",
        "precio": 2800.00,
        "descripcion": "Armario organizador para zapatos y accesorios.",
        "materiales": "Madera de pino, puertas abatibles.",
        "imagen": "https://images.unsplash.com/photo-1637003833874-971d4da7eea6?w=500&auto=format&fit=crop&q=60",
    },
    {
        "nombre": "Puerta Interior de Pino Macizo",
        "categoria": "Puertas",
        "slug": "puertas",
        "precio": 1200.00,
        "descripcion": "Puerta interior de pino macizo con marcos y herrajes incluidos.",
        "materiales": "Pino macizo clase A, herrajes cromados.",
        "imagen": "https://media.istockphoto.com/id/871381408/es/foto/colecci%C3%B3n-de-puertas-de-madera-diferentes-aislados-en-blanco.webp",
    },
    {
        "nombre": "Puerta Exterior Seguridad",
        "categoria": "Puertas",
        "slug": "puertas",
        "precio": 3500.00,
        "descripcion": "Puerta exterior de seguridad con cerraduras de doble cierre.",
        "materiales": "Acero reforzado, marcos de aluminio.",
        "imagen": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=60",
    },
    {
        "nombre": "Escritorio Ejecutivo",
        "categoria": "Muebles Personalizados",
        "slug": "muebles-personalizados",
        "precio": 3200.00,
        "descripcion": "Escritorio ejecutivo personalizado para home office.",
        "materiales": "Madera de caoba, herrajes dorados.",
        "imagen": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=60",
    },
    {
        "nombre": "Librero Modular",
        "categoria": "Muebles Personalizados",
        "slug": "muebles-personalizados",
        "precio": 4800.00,
        "descripcion": "Librero modular con configuraciones ajustables.",
        "materiales": "Madera de pino, herrajes de acero inoxidable.",
        "imagen": "https://images.unsplash.com/photo-1730372798395-68e89f0b5ce9?w=500&auto=format&fit=crop&q=60",
    },
    {
        "nombre": "Instalación Completa de Cocina",
        "categoria": "Instalación y Montaje",
        "slug": "instalacion-montaje",
        "precio": 1500.00,
        "descripcion": "Servicio completo de instalación de cocina integral.",
        "materiales": "Consulta, medidas e instalación de herrajes.",
        "imagen": "https://images.unsplash.com/photo-1615974679548-2fcfd4699f62?w=500&auto=format&fit=crop&q=60",
    },
    {
        "nombre": "Montaje de Closet y Armarios",
        "categoria": "Instalación y Montaje",
        "slug": "instalacion-montaje",
        "precio": 800.00,
        "descripcion": "Montaje profesional de closets y armarios empotrados.",
        "materiales": "Herramientas especializadas y anclajes de seguridad.",
        "imagen": "https://images.unsplash.com/photo-1497219055242-93359eeed651?w=500&auto=format&fit=crop&q=60",
    },
]


class Command(BaseCommand):
    help = "Seed initial product catalog (idempotent)."

    def handle(self, *args, **options):
        created_count = 0

        for item in PRODUCTOS:
            # Use slug as canonical key to avoid unique conflicts from legacy names.
            categoria, _ = Categoria.objects.get_or_create(
                slug=item["slug"],
                defaults={"nombre": item["categoria"]},
            )

            # Keep category display name aligned with seed data.
            if categoria.nombre != item["categoria"]:
                categoria.nombre = item["categoria"]
                categoria.save(update_fields=["nombre"])

            _, created = Producto.objects.update_or_create(
                nombre=item["nombre"],
                defaults={
                    "categoria": categoria,
                    "precio": item["precio"],
                    "descripcion": item["descripcion"],
                    "materiales": item["materiales"],
                    "imagen": item["imagen"],
                    "habilitado": True,
                },
            )

            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Catalogo actualizado. Total productos: {Producto.objects.count()} (nuevos: {created_count})"
            )
        )
