/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `Token` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Token" DROP COLUMN "expiresAt",
ADD COLUMN     "expires" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
