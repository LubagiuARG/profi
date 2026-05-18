-- AlterTable
ALTER TABLE "Resena" ADD COLUMN "solicitudId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Resena_solicitudId_key" ON "Resena"("solicitudId");
