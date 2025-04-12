/*
  Warnings:

  - A unique constraint covering the columns `[asin]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "productIds" INTEGER[];

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "asin" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_asin_key" ON "Product"("asin");
