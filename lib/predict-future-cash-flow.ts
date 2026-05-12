import { getPrisma } from "@/lib/prisma";
import type { FinanceType } from "@/lib/workspace";

export type PredictionMode = "conservative" | "balanced" | "optimistic";
export type PredictionPeriod = 7 | 30 | 90 | 180 | 365;

export type PredictionOptions = {
  includePlannedExpenses: boolean;
  includeRecurring: boolean;
  includeUnpaidInvoices: boolean;
  mode: PredictionMode;
  periodDays: PredictionPeriod;
};

export type PredictionResult = {
  currentBalance: number;
  dailyNetCashFlow: number;
  daysUntilNegative: number | null;
  explanation: string[];
  futureBalance: number;
  mode: PredictionMode;
  periodDays: PredictionPeriod;
  risk: boolean;
  scenarioAdjustment: number;
  sevenDayBalance: number;
  thirtyDayBalance: number;
  ninetyDayBalance: number;
};

type TransactionTotals = {
  totalIncome: number;
  totalExpenses: number;
};

type TransactionForPrediction = {
  type: "income" | "expense";
  amount: { toString(): string };
  date: Date;
};

export const DEFAULT_PREDICTION_OPTIONS: PredictionOptions = {
  includePlannedExpenses: true,
  includeRecurring: true,
  includeUnpaidInvoices: true,
  mode: "balanced",
  periodDays: 30,
};

const allowedPeriods = new Set([7, 30, 90, 180, 365]);
const allowedModes = new Set(["conservative", "balanced", "optimistic"]);

export function normalizePredictionOptions(value: unknown): PredictionOptions {
  const options = value && typeof value === "object" ? (value as Partial<PredictionOptions>) : {};
  const periodDays = Number(options.periodDays);
  const mode = typeof options.mode === "string" ? options.mode : "";

  return {
    includePlannedExpenses:
      typeof options.includePlannedExpenses === "boolean"
        ? options.includePlannedExpenses
        : DEFAULT_PREDICTION_OPTIONS.includePlannedExpenses,
    includeRecurring:
      typeof options.includeRecurring === "boolean"
        ? options.includeRecurring
        : DEFAULT_PREDICTION_OPTIONS.includeRecurring,
    includeUnpaidInvoices:
      typeof options.includeUnpaidInvoices === "boolean"
        ? options.includeUnpaidInvoices
        : DEFAULT_PREDICTION_OPTIONS.includeUnpaidInvoices,
    mode: allowedModes.has(mode) ? (mode as PredictionMode) : DEFAULT_PREDICTION_OPTIONS.mode,
    periodDays: allowedPeriods.has(periodDays)
      ? (periodDays as PredictionPeriod)
      : DEFAULT_PREDICTION_OPTIONS.periodDays,
  };
}

export async function predictFutureCashFlow(
  workspaceId: string,
  options: PredictionOptions = DEFAULT_PREDICTION_OPTIONS,
  financeType: FinanceType = "business",
): Promise<PredictionResult> {
  const prisma = getPrisma();

  const [transactions, workspace, recurringTransactions, unpaidInvoices, budgets] =
    await Promise.all([
      prisma.transaction.findMany({
        where: { financeType, workspaceId },
        select: {
          amount: true,
          date: true,
          type: true,
        },
        orderBy: { date: "asc" },
      }),
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          monthlyFixedExpenses: true,
          startingBalance: true,
        },
      }),
      prisma.recurringTransaction.findMany({
        where: { active: true, financeType, workspaceId },
        select: {
          amount: true,
          frequency: true,
          type: true,
        },
      }),
      prisma.invoice.findMany({
        where: {
          status: { in: ["unpaid", "sent", "overdue"] },
          financeType,
          workspaceId,
        },
        select: {
          amount: true,
          dueDate: true,
        },
      }),
      prisma.categoryBudget.findMany({
        where: { financeType, period: "monthly", workspaceId },
        select: { amount: true },
      }),
    ]);

  const startingBalance = workspace
    ? Number(workspace.startingBalance.toString())
    : 0;
  const monthlyFixedDailyExpense = workspace
    ? Number(workspace.monthlyFixedExpenses.toString()) / 30
    : 0;
  const plannedDailyExpense = options.includePlannedExpenses
    ? budgets.reduce((total, budget) => total + Number(budget.amount.toString()) / 30, 0)
    : 0;
  const recurringDailyNet = options.includeRecurring
    ? recurringTransactions.reduce((total, item) => {
        const amount = Number(item.amount.toString());
        const dailyAmount =
          item.frequency === "weekly"
            ? amount / 7
            : item.frequency === "yearly"
              ? amount / 365
              : amount / 30;

        return total + (item.type === "income" ? dailyAmount : -dailyAmount);
      }, 0)
    : 0;
  const invoiceIncome = options.includeUnpaidInvoices
    ? getInvoiceIncomeWindows(unpaidInvoices)
    : {
        upcomingSevenDayInvoiceIncome: 0,
        upcomingThirtyDayInvoiceIncome: 0,
        upcomingInvoiceIncome: 0,
        upcomingSelectedPeriodInvoiceIncome: 0,
      };

  const totals = transactions.reduce<TransactionTotals>(
    (result: TransactionTotals, transaction: TransactionForPrediction) => {
      const amount = Number(transaction.amount.toString());

      if (transaction.type === "income") {
        result.totalIncome += amount;
      }

      if (transaction.type === "expense") {
        result.totalExpenses += amount;
      }

      return result;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
    },
  );

  const currentBalance = startingBalance + totals.totalIncome - totals.totalExpenses;
  const historicalDailyNet = getHistoricalDailyNet(transactions, totals);
  const scenarioAdjustment = getScenarioAdjustment(options.mode);
  const dailyNetCashFlow =
    historicalDailyNet * scenarioAdjustment +
    recurringDailyNet -
    monthlyFixedDailyExpense -
    plannedDailyExpense;

  return buildPrediction({
    currentBalance,
    dailyNetCashFlow,
    invoiceIncome,
    options,
    plannedDailyExpense,
    recurringDailyNet,
    scenarioAdjustment,
  });
}

function getHistoricalDailyNet(
  transactions: TransactionForPrediction[],
  totals: TransactionTotals,
) {
  if (transactions.length === 0) {
    return 0;
  }

  const firstTransactionDate = new Date(transactions[0].date);
  const today = new Date();

  firstTransactionDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const numberOfDays = Math.max(
    1,
    Math.floor((today.getTime() - firstTransactionDate.getTime()) / millisecondsPerDay) +
      1,
  );
  const averageDailyIncome = totals.totalIncome / numberOfDays;
  const averageDailyExpenses = totals.totalExpenses / numberOfDays;

  return averageDailyIncome - averageDailyExpenses;
}

function getInvoiceIncomeWindows(
  invoices: { amount: { toString(): string }; dueDate: Date }[],
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return invoices.reduce(
    (totals, invoice) => {
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysAway = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const amount = Number(invoice.amount.toString());

      if (daysAway < 0) {
        return totals;
      }

      if (daysAway <= 7) {
        totals.upcomingSevenDayInvoiceIncome += amount;
      }

      if (daysAway <= 30) {
        totals.upcomingThirtyDayInvoiceIncome += amount;
      }

      if (daysAway <= 90) {
        totals.upcomingInvoiceIncome += amount;
      }

      if (daysAway <= 365) {
        totals.upcomingSelectedPeriodInvoiceIncome += amount;
      }

      return totals;
    },
    {
      upcomingInvoiceIncome: 0,
      upcomingSelectedPeriodInvoiceIncome: 0,
      upcomingSevenDayInvoiceIncome: 0,
      upcomingThirtyDayInvoiceIncome: 0,
    },
  );
}

function getScenarioAdjustment(mode: PredictionMode) {
  if (mode === "conservative") {
    return 0.85;
  }

  if (mode === "optimistic") {
    return 1.12;
  }

  return 1;
}

function buildPrediction({
  currentBalance,
  dailyNetCashFlow,
  invoiceIncome,
  options,
  plannedDailyExpense,
  recurringDailyNet,
  scenarioAdjustment,
}: {
  currentBalance: number;
  dailyNetCashFlow: number;
  invoiceIncome: ReturnType<typeof getInvoiceIncomeWindows>;
  options: PredictionOptions;
  plannedDailyExpense: number;
  recurringDailyNet: number;
  scenarioAdjustment: number;
}): PredictionResult {
  const sevenDayBalance =
    currentBalance + dailyNetCashFlow * 7 + invoiceIncome.upcomingSevenDayInvoiceIncome;
  const thirtyDayBalance =
    currentBalance + dailyNetCashFlow * 30 + invoiceIncome.upcomingThirtyDayInvoiceIncome;
  const ninetyDayBalance =
    currentBalance + dailyNetCashFlow * 90 + invoiceIncome.upcomingInvoiceIncome;
  const selectedInvoiceIncome =
    options.periodDays <= 7
      ? invoiceIncome.upcomingSevenDayInvoiceIncome
      : options.periodDays <= 30
        ? invoiceIncome.upcomingThirtyDayInvoiceIncome
        : options.periodDays <= 90
          ? invoiceIncome.upcomingInvoiceIncome
          : invoiceIncome.upcomingSelectedPeriodInvoiceIncome;
  const futureBalance =
    currentBalance + dailyNetCashFlow * options.periodDays + selectedInvoiceIncome;
  const risk = futureBalance < 0;
  const explanation = [
    `${options.mode[0].toUpperCase()}${options.mode.slice(1)} mode adjusts recent daily cash flow by ${Math.round(
      scenarioAdjustment * 100,
    )}%.`,
    options.includeRecurring
      ? `Recurring items add ${recurringDailyNet.toFixed(2)} per day.`
      : "Recurring items are excluded.",
    options.includeUnpaidInvoices
      ? "Open invoices are included when due inside the selected period."
      : "Open invoices are excluded.",
    options.includePlannedExpenses
      ? `Planned expenses subtract ${plannedDailyExpense.toFixed(2)} per day.`
      : "Planned expenses are excluded.",
  ];

  let daysUntilNegative: number | null = null;

  if (risk) {
    if (currentBalance <= 0) {
      daysUntilNegative = 0;
    } else if (dailyNetCashFlow < 0) {
      daysUntilNegative = Math.ceil(currentBalance / Math.abs(dailyNetCashFlow));
    }
  }

  return {
    currentBalance,
    dailyNetCashFlow,
    daysUntilNegative,
    explanation,
    futureBalance,
    mode: options.mode,
    periodDays: options.periodDays,
    risk,
    scenarioAdjustment,
    sevenDayBalance,
    thirtyDayBalance,
    ninetyDayBalance,
  };
}
