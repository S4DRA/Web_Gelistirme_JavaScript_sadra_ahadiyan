CREATE TABLE "SignupRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "companyName" TEXT,
    "companyWebsite" TEXT,
    "note" TEXT,
    "source" TEXT NOT NULL,
    "approvalTokenHash" TEXT NOT NULL,
    "inviteTokenHash" TEXT,
    "approvedAt" TIMESTAMP(3),
    "inviteSentAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignupRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SignupRequest_approvalTokenHash_key" ON "SignupRequest"("approvalTokenHash");
CREATE UNIQUE INDEX "SignupRequest_inviteTokenHash_key" ON "SignupRequest"("inviteTokenHash");
CREATE INDEX "SignupRequest_email_createdAt_idx" ON "SignupRequest"("email", "createdAt");
CREATE INDEX "SignupRequest_email_approvedAt_usedAt_expiresAt_idx" ON "SignupRequest"("email", "approvedAt", "usedAt", "expiresAt");
CREATE INDEX "SignupRequest_expiresAt_idx" ON "SignupRequest"("expiresAt");
