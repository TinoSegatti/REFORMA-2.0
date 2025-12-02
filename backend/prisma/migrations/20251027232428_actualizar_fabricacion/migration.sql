/*
  Warnings:

  - You are about to drop the column `estado` on the `t_fabricacion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "t_fabricacion" DROP COLUMN "estado",
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "sinExistencias" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "public"."EstadoFabricacion";
