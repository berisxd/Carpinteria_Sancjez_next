# 📁 Estructura completa de web-next (Fase 1 - Histórico)

> Nota: esta estructura corresponde al cierre de Fase 1.
> Actualmente el proyecto incluye ademas modulos de checkout/pedidos/pagos, contacto/cotizacion y panel admin.
> Para el estado vigente de migracion ver `MIGRATION_PLAN.md`.

```
web-next/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   │   └── route.ts              # NextAuth (previo)
│   │   │   │
│   │   │   ├── categorias/               # ✨ NUEVO
│   │   │   │   ├── route.ts              # GET /api/categorias
│   │   │   │   └── [slug]/
│   │   │   │       └── route.ts          # GET /api/categorias/[slug]
│   │   │   │
│   │   │   └── productos/                # ✨ NUEVO
│   │   │       ├── route.ts              # GET /api/productos
│   │   │       └── [id]/
│   │   │           └── route.ts          # GET /api/productos/[id]
│   │   │
│   │   ├── categoria/
│   │   │   └── [slug]/
│   │   │       └── page.tsx              # ✨ NUEVO - Página de categoría
│   │   │
│   │   ├── producto/
│   │   │   └── [id]/
│   │   │       └── page.tsx              # ✨ NUEVO - Detalle de producto
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx                  # Login (previo)
│   │   │
│   │   ├── layout.tsx                    # (actualizado)
│   │   ├── page.tsx                      # ✨ RENOVADO - Home catálogo
│   │   ├── globals.css                   # (previo)
│   │   └── favicon.ico                   # (previo)
│   │
│   ├── components/                       # ✨ NUEVO
│   │   ├── CategoriaCard.tsx             # Componente de tarjeta categoría
│   │   └── ProductoCard.tsx              # Componente de tarjeta producto
│   │
│   ├── lib/
│   │   ├── prisma.ts                     # Cliente Prisma (previo)
│   │   └── auth.ts                       # Config NextAuth (previo)
│   │
│   └── types/
│       └── next-auth.d.ts                # Tipado NextAuth (previo)
│
├── prisma/
│   ├── schema.prisma                     # ✨ ACTUALIZADO - +Categoria +Producto +Pedido
│   ├── seed.ts                           # ✨ NUEVO - Script de seed
│   ├── migrations/                       # (auto-generadas)
│   └── (previos: migrations del auth)
│
├── public/
│   ├── next.svg                          # (previo)
│   └── ...
│
├── .env                                  # ✨ ACTUALIZADO - DB_URL
├── .env.example                          # ✨ NUEVO - Plantilla
├── .gitignore                            # (previo)
├── eslint.config.mjs                     # (previo)
├── next-env.d.ts                         # (previo)
├── next.config.ts                        # (previo)
├── package.json                          # ✨ ACTUALIZADO - scripts + ts-node
├── package-lock.json                     # ✨ ACTUALIZADO
├── postcss.config.mjs                    # (previo)
├── tsconfig.json                         # (previo)
├── README.md                             # (previo - plantilla)
│
├── MIGRATION_PLAN.md                     # ✨ ACTUALIZADO - Plan detallado
├── FASE1_SUMMARY.md                      # ✨ NUEVO - Resumen ejecutivo
└── README_SETUP.md                       # ✨ NUEVO - Guía de setup completa


Resumen de cambios:
─────────────────
✨ NUEVO:          14 archivos nuevos
🔄 ACTUALIZADO:   5 archivos modificados
📍 INTACTOS:       Todos los demás (Node, config, etc.)
```

---

## 🎯 Archivos clave que modificaste

### 1. **prisma/schema.prisma** - Modelos agregados
```prisma
model Categoria { ... }          # ← NUEVO
model Producto { ... }           # ← NUEVO
model Pedido { ... }             # ← NUEVO (preparado para Fase 2)
enum UserRole { ... }            # (previo, sin cambios)
```

### 2. **src/app/page.tsx** - Home renovado
Ahora muestra:
- Todas las categorías con contador de productos
- Últimos 6 productos
- Links navegables

### 3. **package.json** - Scripts nuevos
```json
"seed": "ts-node --esm --skip-project prisma/seed.ts"
```

---

## 🔐 Información sensible (.env)

**NO SUBIR A GIT (protegido en .gitignore):**
```env
DATABASE_URL="postgresql://usuario:pass@localhost:5432/carpinteria_next"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-clave-aleatoria-aqui"
```

---

## 📊 Estadísticas de código

| Métrica | Cantidad |
|---------|----------|
| Archivos nuevos | 14 |
| Líneas de código nuevo | ~800 |
| Componentes React | 2 |
| Rutas API | 4 |
| Páginas públicas | 3 |
| Funciones Prisma | 4 |
| Categorías de prueba | 4 |
| Productos de prueba | 8 |

---

## 🚀 Para levantar en 5 minutos

```bash
cd web-next

# 1. Setup BD
psql -U postgres -c "CREATE DATABASE carpinteria_next;"

# 2. Env
cp .env.example .env
# Edita .env con DATABASE_URL correcta

# 3. Migraciones
npx prisma migrate dev --name init

# 4. Datos
npm run seed

# 5. Servidor
npm run dev

# Abre http://localhost:3000
```

**Si todo funciona, veras:**
- 4 categorías en el home
- 6 productos más recientes
- Al clickear categoría → lista completa
- Al clickear producto → detalle con imagen, materiales, precio
