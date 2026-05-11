CREATE TYPE "AccessRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "useCase" TEXT NOT NULL,
    "message" TEXT,
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'pending',
    "approvalToken" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccessRequest_approvalToken_key" ON "AccessRequest"("approvalToken");
CREATE INDEX "AccessRequest_email_idx" ON "AccessRequest"("email");
CREATE INDEX "AccessRequest_email_status_idx" ON "AccessRequest"("email", "status");
CREATE INDEX "AccessRequest_status_createdAt_idx" ON "AccessRequest"("status", "createdAt");
CREATE UNIQUE INDEX "AccessRequest_pending_email_key" ON "AccessRequest"("email") WHERE "status" = 'pending';
