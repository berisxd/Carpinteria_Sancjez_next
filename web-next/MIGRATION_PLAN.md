# Migration Plan: Next.js (Final State)

## Objetivo
Consolidar el proyecto en Next.js + PostgreSQL + Prisma + NextAuth como plataforma unica de operacion.

## Stack objetivo
- Frontend y SSR: Next.js (App Router)
- Base de datos: PostgreSQL
- ORM: Prisma
- Auth: NextAuth (Credentials) + Prisma Adapter

## Estado actual (junio 2026)
Validado con `npm run lint` y `npm run build` en `web-next`.

### Fase 1 - Catalogo (COMPLETADA)
- [x] Modelos de catalogo en Prisma (`Categoria`, `Producto`)
- [x] Endpoints API de lectura (`/api/categorias`, `/api/productos`)
- [x] Vistas publicas (`/`, `/categoria/[slug]`, `/producto/[id]`)
- [x] Seed inicial de categorias y productos

### Fase 2 - Carrito y pedidos (COMPLETADA - MVP)
- [x] Carrito cliente persistido (localStorage)
- [x] Checkout funcional (`/checkout`)
- [x] Creacion de pedidos (`POST /api/pedidos`)
- [x] Confirmacion/detalle (`/pedido/[id]`)
- [x] Ticket PDF (`/api/pedidos/[id]/ticket`)
- [x] Flujo Mercado Pago base: redireccion, callback de resultado y webhook (`/pago/resultado`, `/api/mercadopago/webhook`)

### Fase 3 - Admin y operacion (EN PROGRESO)
- [x] Dashboard admin (`/admin`)
- [x] Gestion de pedidos (`/admin/pedidos`, `/admin/pedidos/[id]`)
- [x] Gestion de productos (`/admin/productos`, `/admin/productos/[id]`)
- [x] Exportaciones CSV (`/api/admin/pedidos/export`, `/api/admin/productos/export`)
- [ ] Endurecimiento de permisos/roles para produccion
- [ ] Cobertura de pruebas e2e para flujo de compra y admin

## Modulos ya migrados en Next.js
- Catalogo: categorias y productos
- Carrito y checkout
- Pedidos y ticket PDF
- Resultado de pago y webhook Mercado Pago
- Contacto y cotizaciones
- Registro/login con NextAuth
- Panel admin (pedidos/productos)

## Pendientes de cierre
1. Pruebas de regresion punta a punta (catalogo, checkout, pagos, admin)
2. Endurecimiento de seguridad y observabilidad para produccion
3. Cobertura de pruebas e2e en CI

## Comandos utiles
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de produccion
- `npm run lint` - Validacion de codigo
- `npx prisma migrate dev` - Aplicar migraciones en desarrollo
- `npx prisma generate` - Generar cliente Prisma
- `npx prisma studio` - Abrir Prisma Studio (UI)
- `npm run seed` - Poblar base con datos de prueba

## Nota de seguridad
- Cambiar `NEXTAUTH_SECRET` antes de publicar
- No subir `.env` al repositorio (ya esta en `.gitignore`)
