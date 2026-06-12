# Carpintería - Next.js Migration (Estado actual)

## 🚀 Setup Inicial

### 1. Requisitos previos
- Node.js 18+ instalado
- PostgreSQL 12+ corriendo localmente o en la nube

### 2. Variables de entorno

Copia `.env.example` a `.env` y completa tus datos:

```bash
cp .env.example .env
```

```env
# Conexión a PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/carpinteria_next"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-clave-super-segura-aqui"

# Mercado Pago (pagos reales)
MP_ACCESS_TOKEN="TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Para generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Crear y ejecutar migraciones de base de datos

```bash
# Crear las tablas en tu PostgreSQL
npx prisma migrate dev --name init

# Esto pedirá confirmar la creación de las migraciones
```

### 5. Seed de datos de prueba

```bash
npm run seed
```

Esto creará:
- 4 categorías (Armarios, Librerías, Cocinas, Muebles Personalizados)
- 8 productos de prueba con imágenes placeholder

### 6. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Estructura de carpetas

```
web-next/
├── src/
│   ├── app/
│   │   ├── (rutas públicas)
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/     # Endpoints de autenticación
│   │   │   ├── categorias/              # API de categorías
│   │   │   └── productos/               # API de productos
│   │   ├── categoria/[slug]/            # Página de categoría
│   │   ├── producto/[id]/               # Página de detalle de producto
│   │   ├── login/                       # Página de login
│   │   └── page.tsx                     # Home (catálogo)
│   ├── components/                      # Componentes React reutilizables
│   ├── lib/
│   │   ├── prisma.ts                    # Cliente de Prisma singleton
│   │   └── auth.ts                      # Configuración NextAuth
│   └── types/
│       └── next-auth.d.ts               # Tipado de NextAuth
├── prisma/
│   ├── schema.prisma                    # Definición de modelos
│   ├── seed.ts                          # Script de seed
│   └── migrations/                      # Migraciones automáticas
├── .env                                 # Variables de entorno (NO subir a git)
├── .env.example                         # Plantilla de variables
└── package.json
```

---

## 🔌 Endpoints API disponibles

### Categorías
- `GET /api/categorias` - Todas las categorías con conteo de productos
- `GET /api/categorias/[slug]` - Categoría por slug + sus productos

### Productos
- `GET /api/productos` - Todos los productos habilitados
- `GET /api/productos/[id]` - Detalle de un producto

**Ejemplo de uso:**
```bash
# Obtener todas las categorías
curl http://localhost:3000/api/categorias

# Obtener productos de la categoría "armarios"
curl http://localhost:3000/api/categorias/armarios

# Obtener detalle de un producto
curl http://localhost:3000/api/productos/[id-del-producto]
```

---

## 📖 Páginas públicas

- `/` - Home con categorías y últimos productos
- `/categoria/[slug]` - Catálogo de una categoría
- `/producto/[id]` - Detalle de producto
- `/login` - Página de login (sin funcionalidad aún)

---

## 🛠️ Scripts útiles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Ejecutar app buildada
npm start

# Linting
npm run lint

# Seed de datos
npm run seed

# Generar cliente Prisma
npx prisma generate

# Abrir Prisma Studio (UI para ver BD)
npx prisma studio

# Crear nueva migración
npx prisma migrate dev --name descripcion_migracion
```

---

## 🔐 Seguridad

- [ ] Cambiar `NEXTAUTH_SECRET` en producción (usa `openssl rand -base64 32`)
- [ ] Usar variables de entorno seguros en hosting
- [ ] No subir `.env` a git (ya está en `.gitignore`)
- [ ] Validar todas las entradas de usuario antes de guardar en BD

---

## 📊 Estado de la migración

### ✅ Fase 1 - Catálogo (COMPLETADA)
- [x] Modelos de Categoria y Producto en Prisma
- [x] Endpoints API GET para catalogo
- [x] Paginas publicas de catalogo
- [x] Seed con datos de prueba

### ✅ Fase 2 - Carrito y Pedidos (COMPLETADA - MVP)
- [x] Carrito cliente persistido
- [x] Checkout en `/checkout`
- [x] API de pedidos (`POST /api/pedidos`)
- [x] Confirmacion de pedido (`/pedido/[id]`)
- [x] Ticket PDF (`/api/pedidos/[id]/ticket`)
- [x] Mercado Pago base: retorno (`/pago/resultado`) y webhook (`/api/mercadopago/webhook`)

### 🟨 Fase 3 - Admin y Operación (EN PROGRESO)
- [x] Panel de administracion (`/admin`)
- [x] Gestion de productos (`/admin/productos`)
- [x] Gestion de pedidos (`/admin/pedidos`)
- [x] Exportaciones CSV (`/api/admin/pedidos/export`, `/api/admin/productos/export`)
- [ ] Endurecimiento de seguridad/roles para produccion
- [ ] Pruebas e2e completas para flujos criticos de compra y admin

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'next-auth'"
```bash
npm install
npm run dev
```

### Error: "database does not exist"
Asegúrate de:
1. PostgreSQL está corriendo
2. `DATABASE_URL` es correcto
3. La base de datos `carpinteria_next` existe

Para crear la BD:
```bash
psql -U postgres -c "CREATE DATABASE carpinteria_next;"
```

### Error al ejecutar seed
```bash
# Asegúrate que las migraciones están aplicadas
npx prisma migrate dev

# Luego ejecuta el seed
npm run seed
```

### Imágenes no cargan
Los productos de prueba usan imágenes placeholder de `via.placeholder.com`. Para usar tus propias imágenes:
1. Sube las imágenes a un CDN o servidor
2. Reemplaza las URLs en el seed o en la base de datos

---

## 📝 Notas de desarrollo

- Next.js 16 con App Router (no Pages Router)
- Prisma como ORM
- NextAuth para autenticación (Credentials provider)
- Tailwind CSS para estilos
- TypeScript para type safety

---

## 📞 Soporte

Para dudas sobre la migración, consulta [MIGRATION_PLAN.md](./MIGRATION_PLAN.md).
