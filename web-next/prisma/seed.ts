import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const imagenesPropias = {
  armarioClasico: "/nuestros_productos/escritorio_1.jpg",
  placardEspejo: "/nuestros_productos/escritorio_2.jpg",
  libreriaMinimalista: "/nuestros_productos/escritorio_3.jpg",
  bibliotecaTecho: "/nuestros_productos/escritorio_4.jpg",
  cocinaIntegral: "/nuestros_productos/escritorio_5.jpg",
  cocinaModular: "/nuestros_productos/escritorio_6.jpg",
  escritorioPersonalizado: "/nuestros_productos/escritorio_2.jpg",
  camaAlmacenaje: "/nuestros_productos/escritorio_1.jpg",
};

async function main() {
  console.log("🌱 Comenzando seed de datos...");

  const adminPasswordHash = await hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {
      name: "Administrador",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
    create: {
      name: "Administrador",
      email: "admin@admin.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  console.log("✓ Admin de desarrollo listo: admin@admin.com");

  // Limpiar datos existentes
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();

  // Crear categorías
  const categorias = await Promise.all([
    prisma.categoria.create({
      data: {
        nombre: "Armarios",
        slug: "armarios",
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: "Librerías",
        slug: "librerias",
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: "Cocinas",
        slug: "cocinas",
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: "Muebles Personalizados",
        slug: "muebles-personalizados",
      },
    }),
  ]);

  console.log(`✓ ${categorias.length} categorías creadas`);

  // Crear productos
  const productos = await Promise.all([
    // Armarios
    prisma.producto.create({
      data: {
        nombre: "Armario Empotrado Clásico",
        categoriaId: categorias[0].id,
        precio: 1500.0,
        descripcion:
          "Armario empotrado de estilo clásico con puertas corredizas. Ideal para maximizar espacios y mantener tu habitación organizada.",
        materiales:
          "Madera de pino, herrajes de acero inoxidable, vidrio templado",
        imagen: imagenesPropias.armarioClasico,
        habilitado: true,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Placard Moderno con Espejo",
        categoriaId: categorias[0].id,
        precio: 2200.0,
        descripcion:
          "Diseño moderno con espejo integrado. Perfecto para entradas y dormitorios. Incluye bisagras soft-close.",
        materiales:
          "MDF premium, espejo de 5mm, herrajes alemanes Blum, pintura alquidálica",
        imagen: imagenesPropias.placardEspejo,
        habilitado: true,
      },
    }),

    // Librerías
    prisma.producto.create({
      data: {
        nombre: "Librería de Pared Minimalista",
        categoriaId: categorias[1].id,
        precio: 800.0,
        descripcion:
          "Librería flotante de diseño minimalista. Soporta hasta 20kg por repisa. Sin herrajes visibles.",
        materiales: "Madera de pino macizo, espigas ocultas, acabado natural",
        imagen: imagenesPropias.libreriaMinimalista,
        habilitado: true,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Biblioteca de Piso a Techo",
        categoriaId: categorias[1].id,
        precio: 3500.0,
        descripcion:
          "Biblioteca de gran formato que aprovecha toda tu pared. Con puertas de vidrio en secciones selectas.",
        materiales:
          "Madera de roble, vidrio templado, marco de aluminio anodizado",
        imagen: imagenesPropias.bibliotecaTecho,
        habilitado: true,
      },
    }),

    // Cocinas
    prisma.producto.create({
      data: {
        nombre: "Cocina Integral Moderna",
        categoriaId: categorias[2].id,
        precio: 5000.0,
        descripcion:
          "Cocina integral completa con isla central. Incluye instalación y puesta en marcha.",
        materiales:
          "MDF lacado, mesada de granito, herrajes Blum, zócalo aluminio",
        imagen: imagenesPropias.cocinaIntegral,
        habilitado: true,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Muebles de Cocina Modular",
        categoriaId: categorias[2].id,
        precio: 2800.0,
        descripcion:
          "Sistema modular adaptable a cualquier espacio. Componibles y amplibles.",
        materiales:
          "MDF melamínico, puertas con borde PVC, herrajes metálicos cromados",
        imagen: imagenesPropias.cocinaModular,
        habilitado: true,
      },
    }),

    // Muebles Personalizados
    prisma.producto.create({
      data: {
        nombre: "Escritorio Personalizado",
        categoriaId: categorias[3].id,
        precio: 1200.0,
        descripcion:
          "Escritorio diseñado a medida según tus necesidades. Con cable management integrado.",
        materiales:
          "Madera MDF enchapada en roble, estructura de acero, herrajes acero inoxidable",
        imagen: imagenesPropias.escritorioPersonalizado,
        habilitado: true,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Cama con Almacenaje Integrado",
        categoriaId: categorias[3].id,
        precio: 2000.0,
        descripcion:
          "Cama Queen con compartimentos de almacenaje bajo la superficie. Optimiza tu habitación.",
        materiales:
          "Estructura de madera de pino, cabecera tapizada, cajones deslizantes",
        imagen: imagenesPropias.camaAlmacenaje,
        habilitado: true,
      },
    }),
  ]);

  console.log(`✓ ${productos.length} productos creados`);

  console.log("✅ Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("❌ Error durante seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
