-- CreateTable
CREATE TABLE "EmailChangeVerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailChangeVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailChangeVerificationCode_userId_createdAt_idx" ON "EmailChangeVerificationCode"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailChangeVerificationCode_email_createdAt_idx" ON "EmailChangeVerificationCode"("email", "createdAt");

-- CreateIndex
CREATE INDEX "EmailChangeVerificationCode_expiresAt_idx" ON "EmailChangeVerificationCode"("expiresAt");

-- CreateIndex
CREATE INDEX "EmailChangeVerificationCode_userId_email_consumedAt_expires_idx" ON "EmailChangeVerificationCode"("userId", "email", "consumedAt", "expiresAt");

-- AddForeignKey
ALTER TABLE "EmailChangeVerificationCode" ADD CONSTRAINT "EmailChangeVerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
