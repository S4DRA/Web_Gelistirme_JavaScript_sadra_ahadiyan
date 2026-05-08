-- AlterTable
ALTER TABLE "CategoryBudget" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'unpaid';

-- AlterTable
ALTER TABLE "RecurringTransaction" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Workspace" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "SignupVerificationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignupVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SignupVerificationCode_email_createdAt_idx" ON "SignupVerificationCode"("email", "createdAt");

-- CreateIndex
CREATE INDEX "SignupVerificationCode_expiresAt_idx" ON "SignupVerificationCode"("expiresAt");

-- CreateIndex
CREATE INDEX "SignupVerificationCode_email_consumedAt_expiresAt_idx" ON "SignupVerificationCode"("email", "consumedAt", "expiresAt");
