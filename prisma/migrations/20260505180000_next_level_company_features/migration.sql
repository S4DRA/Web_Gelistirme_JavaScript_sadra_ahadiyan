-- Extend invoice workflow states for reminders and richer business tracking.
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'overdue';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'cancelled';

CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'admin', 'accountant', 'viewer');
CREATE TYPE "RecurrenceFrequency" AS ENUM ('weekly', 'monthly', 'yearly');
CREATE TYPE "BudgetPeriod" AS ENUM ('monthly', 'quarterly', 'yearly');

CREATE TABLE "Workspace" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "startingBalance" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "monthlyFixedExpenses" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceMember" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "WorkspaceRole" NOT NULL DEFAULT 'viewer',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecurringTransaction" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "TransactionType" NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "category" TEXT NOT NULL,
  "frequency" "RecurrenceFrequency" NOT NULL,
  "nextDate" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecurringTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CategoryBudget" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "period" "BudgetPeriod" NOT NULL DEFAULT 'monthly',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CategoryBudget_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UserPreference" ADD COLUMN "activeWorkspaceId" TEXT;
ALTER TABLE "FinancialTrackingFolder" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "reminderDate" TIMESTAMP(3);

INSERT INTO "Workspace" (
  "id",
  "ownerId",
  "name",
  "currency",
  "startingBalance",
  "monthlyFixedExpenses",
  "createdAt",
  "updatedAt"
)
SELECT
  'workspace_' || "User"."id",
  "User"."id",
  'Main workspace',
  COALESCE("UserPreference"."currency", 'USD'),
  COALESCE("UserPreference"."startingBalance", 0),
  COALESCE("UserPreference"."monthlyFixedExpenses", 0),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
LEFT JOIN "UserPreference" ON "UserPreference"."userId" = "User"."id"
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "WorkspaceMember" ("id", "workspaceId", "userId", "role", "createdAt")
SELECT
  'member_' || "User"."id",
  'workspace_' || "User"."id",
  "User"."id",
  'owner',
  CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT ("id") DO NOTHING;

UPDATE "UserPreference"
SET "activeWorkspaceId" = 'workspace_' || "userId"
WHERE "activeWorkspaceId" IS NULL;

UPDATE "Transaction"
SET "workspaceId" = 'workspace_' || "userId"
WHERE "workspaceId" IS NULL;

UPDATE "Invoice"
SET "workspaceId" = 'workspace_' || "userId"
WHERE "workspaceId" IS NULL;

UPDATE "FinancialTrackingFolder"
SET "workspaceId" = 'workspace_' || "userId"
WHERE "workspaceId" IS NULL;

CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");
CREATE UNIQUE INDEX "CategoryBudget_workspaceId_category_period_key" ON "CategoryBudget"("workspaceId", "category", "period");

CREATE INDEX "Workspace_ownerId_idx" ON "Workspace"("ownerId");
CREATE INDEX "Workspace_ownerId_createdAt_idx" ON "Workspace"("ownerId", "createdAt");
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");
CREATE INDEX "WorkspaceMember_workspaceId_role_idx" ON "WorkspaceMember"("workspaceId", "role");
CREATE INDEX "UserPreference_activeWorkspaceId_idx" ON "UserPreference"("activeWorkspaceId");
CREATE INDEX "FinancialTrackingFolder_workspaceId_idx" ON "FinancialTrackingFolder"("workspaceId");
CREATE INDEX "Transaction_workspaceId_idx" ON "Transaction"("workspaceId");
CREATE INDEX "Transaction_workspaceId_date_idx" ON "Transaction"("workspaceId", "date");
CREATE INDEX "Transaction_workspaceId_category_idx" ON "Transaction"("workspaceId", "category");
CREATE INDEX "Invoice_workspaceId_idx" ON "Invoice"("workspaceId");
CREATE INDEX "Invoice_workspaceId_dueDate_idx" ON "Invoice"("workspaceId", "dueDate");
CREATE INDEX "Invoice_workspaceId_status_idx" ON "Invoice"("workspaceId", "status");
CREATE INDEX "RecurringTransaction_workspaceId_idx" ON "RecurringTransaction"("workspaceId");
CREATE INDEX "RecurringTransaction_workspaceId_nextDate_idx" ON "RecurringTransaction"("workspaceId", "nextDate");
CREATE INDEX "RecurringTransaction_workspaceId_active_idx" ON "RecurringTransaction"("workspaceId", "active");
CREATE INDEX "CategoryBudget_workspaceId_idx" ON "CategoryBudget"("workspaceId");

ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_activeWorkspaceId_fkey" FOREIGN KEY ("activeWorkspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialTrackingFolder" ADD CONSTRAINT "FinancialTrackingFolder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CategoryBudget" ADD CONSTRAINT "CategoryBudget_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
