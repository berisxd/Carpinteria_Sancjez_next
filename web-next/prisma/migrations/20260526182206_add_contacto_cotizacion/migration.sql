-- CreateEnum
CREATE TYPE "TipoMueble" AS ENUM ('cocinas_integrales', 'closets', 'puertas', 'muebles_personalizados', 'instalacion_montaje', 'otro');

-- CreateTable
CREATE TABLE "Contacto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "tipoMueble" "TipoMueble" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "imagenReferencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contacto_createdAt_idx" ON "Contacto"("createdAt");

-- CreateIndex
CREATE INDEX "Cotizacion_tipoMueble_idx" ON "Cotizacion"("tipoMueble");

-- CreateIndex
CREATE INDEX "Cotizacion_createdAt_idx" ON "Cotizacion"("createdAt");

-- CreateIndex
CREATE INDEX "Cotizacion_email_idx" ON "Cotizacion"("email");
