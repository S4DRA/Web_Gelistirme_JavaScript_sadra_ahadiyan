CREATE TYPE "FinanceType" AS ENUM ('personal', 'business');

ALTER TABLE "UserPreference"
ADD COLUMN "activeFinanceType" "FinanceType" NOT NULL DEFAULT 'business';

ALTER TABLE "Transaction"
ADD COLUMN "financeType" "FinanceType" NOT NULL DEFAULT 'business';

ALTER TABLE "Invoice"
ADD COLUMN "financeType" "FinanceType" NOT NULL DEFAULT 'business';

ALTER TABLE "RecurringTransaction"
ADD COLUMN "financeType" "FinanceType" NOT NULL DEFAULT 'business';

ALTER TABLE "CategoryBudget"
ADD COLUMN "financeType" "FinanceType" NOT NULL DEFAULT 'business';

ALTER TABLE "FinancialTrackingFolder"
ADD COLUMN "financeType" "FinanceType" NOT NULL DEFAULT 'business';

DROP INDEX IF EXISTS "CategoryBudget_workspaceId_category_period_key";

CREATE UNIQUE INDEX "CategoryBudget_workspaceId_financeType_category_period_key"
ON "CategoryBudget"("workspaceId", "financeType", "category", "period");

CREATE INDEX "Transaction_workspaceId_financeType_idx"
ON "Transaction"("workspaceId", "financeType");

CREATE INDEX "Transaction_workspaceId_financeType_date_idx"
ON "Transaction"("workspaceId", "financeType", "date");

CREATE INDEX "Invoice_workspaceId_financeType_idx"
ON "Invoice"("workspaceId", "financeType");

CREATE INDEX "Invoice_workspaceId_financeType_dueDate_idx"
ON "Invoice"("workspaceId", "financeType", "dueDate");

CREATE INDEX "Invoice_workspaceId_financeType_status_idx"
ON "Invoice"("workspaceId", "financeType", "status");

CREATE INDEX "RecurringTransaction_workspaceId_financeType_idx"
ON "RecurringTransaction"("workspaceId", "financeType");

CREATE INDEX "RecurringTransaction_workspaceId_financeType_nextDate_idx"
ON "RecurringTransaction"("workspaceId", "financeType", "nextDate");

CREATE INDEX "RecurringTransaction_workspaceId_financeType_active_idx"
ON "RecurringTransaction"("workspaceId", "financeType", "active");

CREATE INDEX "CategoryBudget_workspaceId_financeType_idx"
ON "CategoryBudget"("workspaceId", "financeType");

CREATE INDEX "FinancialTrackingFolder_workspaceId_financeType_idx"
ON "FinancialTrackingFolder"("workspaceId", "financeType");
