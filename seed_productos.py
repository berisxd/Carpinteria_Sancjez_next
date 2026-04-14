from carpinteria.models import Producto, Categoria

# Crear o obtener categorías
cocinas, _ = Categoria.objects.get_or_create(nombre="Cocinas Integrales", defaults={'slug': 'cocinas-integrales'})
closets, _ = Categoria.objects.get_or_create(nombre="Closets", defaults={'slug': 'closets'})
puertas, _ = Categoria.objects.get_or_create(nombre="Puertas", defaults={'slug': 'puertas'})
muebles_pers, _ = Categoria.objects.get_or_create(nombre="Muebles Personalizados", defaults={'slug': 'muebles-personalizados'})
instalacion, _ = Categoria.objects.get_or_create(nombre="Instalación y Montaje", defaults={'slug': 'instalacion-montaje'})

# Cocinas Integrales
Producto.objects.create(
    nombre="Cocina Integral Moderna",
    categoria=cocinas,
    precio=8500.00,
    descripcion="Cocina integral de alta gama con diseño moderno y funcional. Incluye despensero, alacena y zona de cocción. Ideal para espacios medianos a grandes.",
    materiales="Madera de pino premium, herrajes de acero inoxidable, acabado en poliuretano satinado, encimera de granito.",
    imagen="https://plus.unsplash.com/premium_photo-1683141179507-734e6157ddba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzd8fGNvY2luYXMlMjBpbnRlZ3JhbGVzfGVufDB8fDB8fHww"
)

Producto.objects.create(
    nombre="Cocina Compacta",
    categoria=cocinas,
    precio=4200.00,
    descripcion="Cocina integral compacta perfecta para apartamentos y espacios reducidos. Diseño minimalista con máxima eficiencia.",
    materiales="Madera de pino, herrajes cromados, acabado lacado brillante, encimera sintética.",
    imagen="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=60"
)

# Closets y Armarios
Producto.objects.create(
    nombre="Closet Empotrado Modular",
    categoria=closets,
    precio=6500.00,
    descripcion="Closet empotrado con sistema modular ajustable. Incluye perchas, estantes y cajones organizadores.",
    materiales="Madera de cedro, puertas con espejo de seguridad, bisagras soft-close, perillas de aluminio.",
    imagen="https://images.unsplash.com/photo-1640357154220-9775b0f31dec?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
)

Producto.objects.create(
    nombre="Armario Zapatera",
    categoria=closets,
    precio=2800.00,
    descripcion="Armario organizador para zapatos y accesorios. Espacios independientes para hasta 15 pares.",
    materiales="Madera de pino, puertas abatibles, estantes internos con divisiones.",
    imagen="https://images.unsplash.com/photo-1637003833874-971d4da7eea6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjd8fGFybWFyaW8lMjB6YXBhdGVyYXxlbnwwfHwwfHx8MA%3D%3D"
)

# Puertas
Producto.objects.create(
    nombre="Puerta Interior de Pino Macizo",
    categoria=puertas,
    precio=1200.00,
    descripcion="Puerta interior de pino macizo con marcos y herrajes incluidos. Acabado natural o lacado a elección.",
    materiales="Pino macizo clase A, herrajes cromados, bisagras de 3 puntos.",
    imagen="https://media.istockphoto.com/id/871381408/es/foto/colecci%C3%B3n-de-puertas-de-madera-diferentes-aislados-en-blanco.webp?a=1&b=1&s=612x612&w=0&k=20&c=1ObK4sgLy9x00s6fUDYEhXnIJLW0_0Kye7Yn1UGNrLM="
)

Producto.objects.create(
    nombre="Puerta Exterior Seguridad",
    categoria=puertas,
    precio=3500.00,
    descripcion="Puerta exterior de seguridad con blindaje y cerraduras de doble cierre. Acabado elegante.",
    materiales="Acero reforzado, marcos de aluminio, cerradura de seguridad 3 puntos, acabado pintura epóxica.",
    imagen="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=60"
)

# Muebles Personalizados
Producto.objects.create(
    nombre="Escritorio Ejecutivo",
    categoria=muebles_pers,
    precio=3200.00,
    descripcion="Escritorio ejecutivo personalizado con espacio de almacenaje. Diseño ergonómico para home office.",
    materiales="Madera de caoba, herrajes dorados, acabado barnizado brillante.",
    imagen="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=60"
)

Producto.objects.create(
    nombre="Librero Modular",
    categoria=muebles_pers,
    precio=4800.00,
    descripcion="Librero modular ajustable con múltiples configuraciones posibles según tu espacio.",
    materiales="Madera de pino, herrajes de acero inoxidable, estantes flotantes.",
    imagen="https://images.unsplash.com/photo-1730372798395-68e89f0b5ce9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGxpYnJlcm8lMjBtb2R1bGFyfGVufDB8fDB8fHww"
)

# Instalación y Montaje
Producto.objects.create(
    nombre="Instalación Completa de Cocina",
    categoria=instalacion,
    precio=1500.00,
    descripcion="Servicio completo de instalación de cocina integral con conexiones de gas, agua y electricidad.",
    materiales="Incluye: consulta, medidas, instalación de herrajes, nivelación, pruebas finales.",
    imagen="https://images.unsplash.com/photo-1615974679548-2fcfd4699f62?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NzR8fGNhcnBpbnRlcm98ZW58MHx8MHx8fDA%3D"
)

Producto.objects.create(
    nombre="Montaje de Closet y Armarios",
    categoria=instalacion,
    precio=800.00,
    descripcion="Montaje profes ional de closets empotrados incluyendo anclaje y pruebas de seguridad.",
    materiales="Servicio incluye: herramientas especializadas, instalación de anclajes, acabados finales.",
    imagen="https://images.unsplash.com/photo-1497219055242-93359eeed651?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGNhcnBpbnRlcm98ZW58MHx8MHx8fDA%3D"
)

print("✓ 10 productos agregados exitosamente")
