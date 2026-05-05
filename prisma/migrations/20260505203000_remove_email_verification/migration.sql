DROP TABLE IF EXISTS "EmailVerificationCode";

ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerifiedAt";

DROP TYPE IF EXISTS "VerificationPurpose";
