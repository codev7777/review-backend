/*
  Warnings:

  - You are about to drop the column `companyId` on the `DiscountCode` table. All the data in the column will be lost.
  - You are about to drop the column `timesUsed` on the `DiscountCode` table. All the data in the column will be lost.
  - The `type` column on the `DiscountCode` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `DiscountCode` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `validFrom` to the `DiscountCode` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DiscountCode" DROP CONSTRAINT "DiscountCode_companyId_fkey";

-- DropIndex
DROP INDEX "DiscountCode_companyId_idx";

-- AlterTable
ALTER TABLE "DiscountCode" DROP COLUMN "companyId",
DROP COLUMN "timesUsed",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "validFrom" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
ALTER COLUMN "validUntil" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- DropEnum
DROP TYPE "DiscountStatus";

-- DropEnum
DROP TYPE "DiscountType";

-- CreateTable
CREATE TABLE "_CompanyDiscountCodes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CompanyDiscountCodes_AB_unique" ON "_CompanyDiscountCodes"("A", "B");

-- CreateIndex
CREATE INDEX "_CompanyDiscountCodes_B_index" ON "_CompanyDiscountCodes"("B");

-- AddForeignKey
ALTER TABLE "_CompanyDiscountCodes" ADD CONSTRAINT "_CompanyDiscountCodes_A_fkey" FOREIGN KEY ("A") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyDiscountCodes" ADD CONSTRAINT "_CompanyDiscountCodes_B_fkey" FOREIGN KEY ("B") REFERENCES "DiscountCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
