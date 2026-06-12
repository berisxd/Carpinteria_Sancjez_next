-- AlterTable
ALTER TABLE "AdminPreference" ADD COLUMN     "pedidosEstado" TEXT NOT NULL DEFAULT 'all',
ADD COLUMN     "pedidosMetodoPago" TEXT NOT NULL DEFAULT 'all',
ADD COLUMN     "pedidosPeriodo" TEXT NOT NULL DEFAULT 'all',
ADD COLUMN     "productosCategoria" TEXT NOT NULL DEFAULT 'all';
