ALTER TABLE "UserPreference"
ADD COLUMN "dashboardLayout" JSONB,
ADD COLUMN "predictionSettings" JSONB;

ALTER TABLE "Transaction"
ADD COLUMN "note" TEXT,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN "originalAmount" DECIMAL(12, 2),
ADD COLUMN "originalCurrency" TEXT,
ADD COLUMN "exchangeRate" DECIMAL(18, 8),
ADD COLUMN "importFingerprint" TEXT;

ALTER TABLE "Invoice"
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN "originalAmount" DECIMAL(12, 2),
ADD COLUMN "originalCurrency" TEXT,
ADD COLUMN "exchangeRate" DECIMAL(18, 8);

ALTER TABLE "RecurringTransaction"
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

CREATE INDEX "Transaction_workspaceId_importFingerprint_idx"
ON "Transaction"("workspaceId", "importFingerprint");
