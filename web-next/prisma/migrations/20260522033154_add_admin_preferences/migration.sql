-- CreateTable
CREATE TABLE "AdminPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pedidosPageSize" INTEGER NOT NULL DEFAULT 10,
    "pedidosSortBy" TEXT NOT NULL DEFAULT 'fecha',
    "pedidosSortDir" TEXT NOT NULL DEFAULT 'desc',
    "productosPageSize" INTEGER NOT NULL DEFAULT 10,
    "productosSortBy" TEXT NOT NULL DEFAULT 'fecha',
    "productosSortDir" TEXT NOT NULL DEFAULT 'desc',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminPreference_userId_key" ON "AdminPreference"("userId");

-- AddForeignKey
ALTER TABLE "AdminPreference" ADD CONSTRAINT "AdminPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
