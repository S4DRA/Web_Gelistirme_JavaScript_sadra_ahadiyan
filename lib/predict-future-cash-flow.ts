import { getPrisma } from "@/lib/prisma";

type PredictionResult = {
  futureBalance: number;
  sevenDayBalance: number;
  ninetyDayBalance: number;
  dailyNetCashFlow: number;
  risk: boolean;
  daysUntilNegative: number | null;
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

export async function predictFutureCashFlow(
  workspaceId: string,
): Promise<PredictionResult> {
  const prisma = getPrisma();

  const [transactions, workspace, recurringTransactions, unpaidInvoices] =
    await Promise.all([
      prisma.transaction.findMany({
        where: { workspaceId },
        select: {
          type: true,
          amount: true,
          date: true,
        },
        orderBy: { date: "asc" },
      }),
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          startingBalance: true,
          monthlyFixedExpenses: true,
        },
      }),
      prisma.recurringTransaction.findMany({
        where: { workspaceId, active: true },
        select: {
          type: true,
          amount: true,
          frequency: true,
        },
      }),
      prisma.invoice.findMany({
        where: {
          workspaceId,
          status: { in: ["unpaid", "sent", "overdue"] },
        },
        select: {
          amount: true,
          dueDate: true,
        },
      }),
    ]);

  const startingBalance = workspace
    ? Number(workspace.startingBalance.toString())
    : 0;
  const monthlyFixedDailyExpense = workspace
    ? Number(workspace.monthlyFixedExpenses.toString()) / 30
    : 0;
  const recurringDailyNet = recurringTransactions.reduce((total, item) => {
    const amount = Number(item.amount.toString());
    const dailyAmount =
      item.frequency === "weekly"
        ? amount / 7
        : item.frequency === "yearly"
          ? amount / 365
          : amount / 30;

    return total + (item.type === "income" ? dailyAmount : -dailyAmount);
  }, 0);
  const invoiceIncome = getInvoiceIncomeWindows(unpaidInvoices);

  if (transactions.length === 0) {
    return buildPrediction({
      currentBalance: startingBalance,
      dailyNetCashFlow: recurringDailyNet - monthlyFixedDailyExpense,
      ...invoiceIncome,
    });
  }

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
      totalIncome: 0,
      totalExpenses: 0,
    },
  );

  const currentBalance = startingBalance + totals.totalIncome - totals.totalExpenses;
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
  const dailyNetCashFlow =
    averageDailyIncome -
    averageDailyExpenses +
    recurringDailyNet -
    monthlyFixedDailyExpense;

  return buildPrediction({
    currentBalance,
    dailyNetCashFlow,
    ...invoiceIncome,
  });
}

function getInvoiceIncomeWindows(
  invoices: { amount: { toString(): string }; dueDate: Date }[],
) {
  return invoices.reduce(
    (totals, invoice) => {
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      const daysAway = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const amount = Number(invoice.amount.toString());

      if (daysAway <= 7) {
        totals.upcomingSevenDayInvoiceIncome += amount;
      }

      if (daysAway <= 30) {
        totals.upcomingThirtyDayInvoiceIncome += amount;
      }

      if (daysAway <= 90) {
        totals.upcomingInvoiceIncome += amount;
      }

      return totals;
    },
    {
      upcomingSevenDayInvoiceIncome: 0,
      upcomingThirtyDayInvoiceIncome: 0,
      upcomingInvoiceIncome: 0,
    },
  );
}

function buildPrediction({
  currentBalance,
  dailyNetCashFlow,
  upcomingSevenDayInvoiceIncome,
  upcomingThirtyDayInvoiceIncome,
  upcomingInvoiceIncome,
}: {
  currentBalance: number;
  dailyNetCashFlow: number;
  upcomingSevenDayInvoiceIncome: number;
  upcomingThirtyDayInvoiceIncome: number;
  upcomingInvoiceIncome: number;
}): PredictionResult {
  const sevenDayBalance =
    currentBalance + dailyNetCashFlow * 7 + upcomingSevenDayInvoiceIncome;
  const futureBalance =
    currentBalance + dailyNetCashFlow * 30 + upcomingThirtyDayInvoiceIncome;
  const ninetyDayBalance =
    currentBalance + dailyNetCashFlow * 90 + upcomingInvoiceIncome;
  const risk = futureBalance < 0;

  let daysUntilNegative: number | null = null;

  if (risk) {
    if (currentBalance <= 0) {
      daysUntilNegative = 0;
    } else if (dailyNetCashFlow < 0) {
      daysUntilNegative = Math.ceil(currentBalance / Math.abs(dailyNetCashFlow));
    }
  }

  return {
    futureBalance,
    sevenDayBalance,
    ninetyDayBalance,
    dailyNetCashFlow,
    risk,
    daysUntilNegative,
  };
}
