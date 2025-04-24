-- AlterTable
ALTER TABLE "User" ALTER COLUMN "currentPeriodEnd" DROP NOT NULL,
ALTER COLUMN "stripeSubscriptionId" DROP NOT NULL;
