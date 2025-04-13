-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('SHIP', 'DIGITAL');

-- CreateEnum
CREATE TYPE "ApprovalMethod" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "CodeType" AS ENUM ('SAME_FOR_ALL', 'SINGLE_USE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PROCESSED', 'REJECTED');

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "approvalMethod" "ApprovalMethod",
ADD COLUMN     "codeType" "CodeType",
ADD COLUMN     "couponCodes" TEXT[],
ADD COLUMN     "digitalApprovalMethod" "ApprovalMethod",
ADD COLUMN     "downloadableFileUrl" TEXT,
ADD COLUMN     "freeProductApprovalMethod" "ApprovalMethod" DEFAULT 'MANUAL',
ADD COLUMN     "freeProductDeliveryMethod" "DeliveryMethod" DEFAULT 'SHIP',
ADD COLUMN     "giftCardDeliveryMethod" "DeliveryMethod";

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "feedbackDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "orderNo" TEXT,
ADD COLUMN     "promotionId" INTEGER,
ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
