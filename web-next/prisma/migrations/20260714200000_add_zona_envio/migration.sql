-- CreateTable
CREATE TABLE "ZonaEnvio" (
    "id" TEXT NOT NULL,
    "codigoPostal" TEXT NOT NULL,
    "municipio" TEXT NOT NULL DEFAULT '',
    "precio" DECIMAL(10,2) NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZonaEnvio_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN "costoEnvio" DECIMAL(10,2);

-- CreateIndex
CREATE UNIQUE INDEX "ZonaEnvio_codigoPostal_key" ON "ZonaEnvio"("codigoPostal");

-- CreateIndex
CREATE INDEX "ZonaEnvio_codigoPostal_idx" ON "ZonaEnvio"("codigoPostal");

-- CreateIndex
CREATE INDEX "ZonaEnvio_habilitado_idx" ON "ZonaEnvio"("habilitado");
