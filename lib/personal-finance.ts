export type PersonalFinanceTransaction = {
  amount: number;
  category: string;
  date: Date | string;
  type: "income" | "expense" | string;
};

export type PersonalFinanceSummary = {
  billSubscriptionSpend: number;
  dailyBurnRate: number;
  healthScore: number;
  monthlyIncome: number;
  monthlySpending: number;
  monthlySurvivalCost: number;
  monthlySurvivalMonths: number | null;
  savingsProgress: number;
};

const billSubscriptionCategories = new Set([
  "bill",
  "bills",
  "rent",
  "subscription",
  "subscriptions",
  "utility",
  "utilities",
  "phone",
  "phone bill",
  "phone bills",
  "internet",
  "insurance",
  "recurring",
  "recurring payment",
  "recurring payments",
]);

const essentialCategories = new Set([
  ...billSubscriptionCategories,
  "grocery",
  "groceries",
  "transport",
  "transportation",
  "fuel",
  "health",
  "healthcare",
  "medical",
  "dining",
  "food",
]);

export function normalizePersonalCategory(category: string) {
  return category
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");
}

export function isBillOrSubscriptionCategory(category: string) {
  const normalized = normalizePersonalCategory(category);

  return (
    billSubscriptionCategories.has(normalized) ||
    normalized.includes("bill") ||
    normalized.includes("subscription") ||
    normalized.includes("recurring")
  );
}

export function isEssentialPersonalCategory(category: string) {
  const normalized = normalizePersonalCategory(category);

  return (
    essentialCategories.has(normalized) ||
    isBillOrSubscriptionCategory(normalized)
  );
}

function toValidDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameMonth(date: Date, now: Date) {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function safeAmount(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function buildPersonalFinanceSummary({
  netBalance,
  now = new Date(),
  transactions,
}: {
  netBalance: number;
  now?: Date;
  transactions: PersonalFinanceTransaction[];
}): PersonalFinanceSummary {
  const monthlyTransactions = transactions.filter((transaction) => {
    const date = toValidDate(transaction.date);
    return date ? isSameMonth(date, now) : false;
  });
  const monthlyIncome = monthlyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + safeAmount(transaction.amount), 0);
  const monthlySpending = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + safeAmount(transaction.amount), 0);
  const monthlySurvivalCost = monthlyTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense" && isEssentialPersonalCategory(transaction.category),
    )
    .reduce((total, transaction) => total + safeAmount(transaction.amount), 0);
  const billSubscriptionSpend = monthlyTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense" && isBillOrSubscriptionCategory(transaction.category),
    )
    .reduce((total, transaction) => total + safeAmount(transaction.amount), 0);
  const dailyBurnRate = monthlySpending / Math.max(1, now.getDate());
  const savingsTarget = Math.max(5000, monthlySurvivalCost * 3);
  const savingsProgress = Math.min(100, Math.max(0, (netBalance / savingsTarget) * 100));
  const savingsRate =
    monthlyIncome > 0 ? Math.max(0, (monthlyIncome - monthlySpending) / monthlyIncome) : 0;
  const spendBalance = monthlyIncome > 0 ? Math.max(0, 1 - monthlySpending / monthlyIncome) : 0;
  const healthScore = Math.round(
    Math.min(100, Math.max(0, savingsRate * 45 + spendBalance * 35 + savingsProgress * 0.2)),
  );
  const monthlySurvivalMonths =
    monthlySurvivalCost > 0 ? Math.max(0, netBalance / monthlySurvivalCost) : null;

  return {
    billSubscriptionSpend,
    dailyBurnRate,
    healthScore,
    monthlyIncome,
    monthlySpending,
    monthlySurvivalCost,
    monthlySurvivalMonths,
    savingsProgress,
  };
}
