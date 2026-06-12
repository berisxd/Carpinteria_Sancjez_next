# ✅ Fase 1: Catálogo - Completada (Histórico)

> Nota: este documento resume el cierre original de Fase 1.
> El estado actual del proyecto ya incluye avances de Fase 2 y Fase 3.
> Ver `MIGRATION_PLAN.md` y `README_SETUP.md` para el estado vigente.

## 📊 Resumen de cambios

### Nuevos archivos creados (18 archivos)

#### Modelos & Base de datos
- `prisma/schema.prisma` - Esquema actualizado con **Categoria**, **Producto**, **Pedido**
- `prisma/seed.ts` - Script para popular BD con datos de prueba

#### API Endpoints (4 rutas)
- `src/app/api/categorias/route.ts` - GET: todas las categorías
- `src/app/api/categorias/[slug]/route.ts` - GET: categoría + productos
- `src/app/api/productos/route.ts` - GET: todos los productos
- `src/app/api/productos/[id]/route.ts` - GET: detalle de producto

#### Páginas públicas (3 rutas)
- `src/app/page.tsx` - **Home renovado** con catálogo
- `src/app/categoria/[slug]/page.tsx` - Página de categoría
- `src/app/producto/[id]/page.tsx` - Detalle de producto con relacionados

#### Componentes React (2 componentes)
- `src/components/CategoriaCard.tsx` - Card de categoría
- `src/components/ProductoCard.tsx` - Card de producto

#### Documentación
- `README_SETUP.md` - Guía completa de setup (muy importante leer)
- `MIGRATION_PLAN.md` - Plan actualizado

---

## 🚀 Próximos pasos para levantar localmente

### 1. Instalar PostgreSQL (si no lo tienes)
- Descarga desde https://www.postgresql.org/download/
- Instala con usuario `postgres` / contraseña `postgres`

### 2. Crear base de datos
```bash
psql -U postgres -c "CREATE DATABASE carpinteria_next;"
```

### 3. Configurar variables de entorno
```bash
cd web-next
cp .env.example .env
# Edita .env con tus datos de PostgreSQL
```

### 4. Ejecutar migraciones
```bash
npx prisma migrate dev --name init
```

### 5. Llenar BD con datos de prueba
```bash
npm run seed
```

### 6. Levantar servidor
```bash
npm run dev
```

Abre http://localhost:3000 y verás:
- **Home** con categorías y últimos productos
- **Categorías** clickeables con todos sus productos
- **Detalle** de cada producto con imagen y descripción

---

## 📐 Arquitectura

```
web-next/
├── src/
│   ├── app/
│   │   ├── page.tsx                 ← HOME (catálogo)
│   │   ├── categoria/[slug]/        ← Página de categoría
│   │   ├── producto/[id]/           ← Detalle de producto
│   │   ├── api/
│   │   │   ├── categorias/          ← GET /api/categorias
│   │   │   │   ├── route.ts         ← Lista todas
│   │   │   │   └── [slug]/
│   │   │   │       └── route.ts     ← Por slug
│   │   │   └── productos/           ← GET /api/productos
│   │   │       ├── route.ts         ← Lista todas
│   │   │       └── [id]/
│   │   │           └── route.ts     ← Por ID
│   │   └── auth/[...nextauth]/      ← NextAuth (sin cambios)
│   ├── components/
│   │   ├── CategoriaCard.tsx
│   │   └── ProductoCard.tsx
│   ├── lib/
│   │   ├── prisma.ts                ← Cliente Prisma
│   │   └── auth.ts                  ← NextAuth config
│   └── types/
│       └── next-auth.d.ts
├── prisma/
│   ├── schema.prisma                ← ACTUALIZADO: +Categoria, +Producto, +Pedido
│   ├── seed.ts                      ← ✨ NUEVO: datos de prueba
│   └── migrations/                  ← Auto-generadas con `prisma migrate`
└── package.json                     ← ACTUALIZADO: script seed

```

---

## 🧪 Testing

Una vez levantado con `npm run dev`, prueba en terminal:

```bash
# Obtener todas las categorías
curl http://localhost:3000/api/categorias

# Obtener productos de "armarios"
curl http://localhost:3000/api/categorias/armarios

# Visitar en navegador
- http://localhost:3000/              → Home
- http://localhost:3000/categoria/armarios
- http://localhost:3000/producto/[id-del-producto]
```

---

## ✨ Datos de prueba inclusos

El seed crea automáticamente:

| Categoría | Productos |
|-----------|-----------|
| Armarios | Armario Empotrado Clásico, Placard Moderno |
| Librerías | Librería Minimalista, Biblioteca Piso Techo |
| Cocinas | Cocina Integral, Muebles Modulares |
| Muebles Personalizados | Escritorio, Cama con Almacenaje |

Todos con precios, descripciones completas y materiales.

---

## 🔄 Nota historica

Este documento resume la Fase 1 en su momento original.

Estado actual del proyecto: operacion unificada en Next.js.
Para el estado vigente, consultar `MIGRATION_PLAN.md`.

---

## 📝 Checklist de validación

- [ ] PostgreSQL está corriendo localmente
- [ ] Base de datos `carpinteria_next` existe
- [ ] `npm run seed` se ejecutó sin errores
- [ ] Home carga categorías y productos
- [ ] Click en categoría abre la página de esa categoría
- [ ] Click en producto abre el detalle
- [ ] Detalle muestra imagen, descripción, materiales, precio
- [ ] Productos relacionados aparecen al final

Una vez que hayas hecho todo esto, ✅ **Fase 1 está validada**.

---

## 📌 Estado actual (junio 2026)

### Fase 2
- Implementada: carrito, checkout, creacion de pedidos, confirmacion, ticket PDF y flujo base de Mercado Pago.

### Fase 3
- En progreso: admin de pedidos y productos, dashboard y exportaciones CSV.

### Pendiente global
- Endurecimiento para produccion y pruebas e2e completas.

---

## 📞 Dudas

Consulta [README_SETUP.md](./README_SETUP.md) para troubleshooting completo.
