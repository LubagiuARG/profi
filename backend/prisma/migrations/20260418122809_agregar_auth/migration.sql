/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `Profesional` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Profesional" ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "vacaciones" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visitas" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Profesional_googleId_key" ON "Profesional"("googleId");
