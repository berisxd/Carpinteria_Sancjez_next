-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "mpMerchantOrderId" TEXT,
ADD COLUMN     "mpPaymentId" TEXT,
ADD COLUMN     "mpPreferenceId" TEXT,
ADD COLUMN     "mpStatus" TEXT;

-- CreateIndex
CREATE INDEX "Pedido_mpPreferenceId_idx" ON "Pedido"("mpPreferenceId");

-- CreateIndex
CREATE INDEX "Pedido_mpPaymentId_idx" ON "Pedido"("mpPaymentId");
