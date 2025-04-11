/*
  Warnings:

  - You are about to drop the column `campaignId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `campaignId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the `Campaign` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_campaignId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "campaignId",
ALTER COLUMN "ratio" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "campaignId";

-- DropTable
DROP TABLE "Campaign";

-- DropEnum
DROP TYPE "CampaignStatus";
