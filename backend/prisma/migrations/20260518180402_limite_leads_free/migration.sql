-- AlterTable
ALTER TABLE "Profesional" ADD COLUMN     "solicitudesResetEn" TIMESTAMP(3),
ADD COLUMN     "solicitudesUsadasMes" INTEGER NOT NULL DEFAULT 0;
