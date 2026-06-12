# Carpinteria Sanchez

Proyecto en modo Next.js only.

La aplicacion principal y unica vive en `web-next` con Next.js + Prisma + PostgreSQL.

## Requisitos

- Node.js 18+
- PostgreSQL

## Inicio rapido local

1. Entrar a `web-next`.
2. Instalar dependencias: `npm install`.
3. Ejecutar en desarrollo: `npm run dev:low`.
4. Abrir `http://localhost:3000`.

## Variables de entorno

Definir en `web-next/.env` (o en tu proveedor de hosting):

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `MP_ACCESS_TOKEN`

## Deploy

- Render blueprint principal: `render.yaml`
  - `rootDir: web-next`
  - build: `npm install && npm run build`
  - start: `npm run start`

## Referencias

- Setup detallado: `web-next/README_SETUP.md`
- Plan de migracion: `web-next/MIGRATION_PLAN.md`
