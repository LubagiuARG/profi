/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `Electricista` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Electricista" ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "vacaciones" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visitas" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Electricista_googleId_key" ON "Electricista"("googleId");
