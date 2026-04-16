from django.test import TestCase

from carpinteria.models import Categoria, Producto


class ProductoCreationTest(TestCase):
    def test_producto_can_be_created(self):
        categoria = Categoria.objects.create(nombre="Testing", slug="testing")

        producto = Producto.objects.create(
            nombre="Producto Test",
            categoria=categoria,
            precio=1500.00,
            descripcion="Producto de prueba",
            materiales="Madera de pino",
            imagen="https://via.placeholder.com/500x500",
        )

        self.assertIsNotNone(producto.id)
        self.assertEqual(Producto.objects.count(), 1)
