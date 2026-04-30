import { getDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

type PredictionResult = {
  futureBalance: number;
  risk: boolean;
  daysUntilNegative: number | null;
};

export async function predictFutureCashFlow(): Promise<PredictionResult> {
  const user = await getDemoUser();

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    select: {
      type: true,
      amount: true,
      date: true,
    },
    orderBy: { date: "asc" },
  });

  if (transactions.length === 0) {
    return {
      futureBalance: 0,
      risk: false,
      daysUntilNegative: null,
    };
  }

  const totals = transactions.reduce(
    (result, transaction) => {
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

  const currentBalance = totals.totalIncome - totals.totalExpenses;
  const firstTransactionDate = new Date(transactions[0].date);
  const today = new Date();

  firstTransactionDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const numberOfDays =
    Math.max(
      1,
      Math.floor((today.getTime() - firstTransactionDate.getTime()) / millisecondsPerDay) +
        1,
    );

  const averageDailyIncome = totals.totalIncome / numberOfDays;
  const averageDailyExpenses = totals.totalExpenses / numberOfDays;
  const dailyNetCashFlow = averageDailyIncome - averageDailyExpenses;
  const futureBalance = currentBalance + dailyNetCashFlow * 30;
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
    risk,
    daysUntilNegative,
  };
}
