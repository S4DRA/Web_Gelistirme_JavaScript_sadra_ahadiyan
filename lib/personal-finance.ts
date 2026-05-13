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
  personalBalance: number;
  monthlyIncome: number;
  monthlySpending: number;
  monthlySurvivalCost: number;
  monthlySurvivalMonths: number | null;
  savingsProgress: number;
  totalExpenses: number;
  totalIncome: number;
  windows: {
    billsAndSubscriptions: string;
    dailyBurnRate: string;
    monthlyIncome: string;
    monthlySpending: string;
    monthlySurvivalCost: string;
    personalBalance: string;
    savingsProgress: string;
  };
};

const recurringCategories = new Set([
  "electricity",
  "gas",
  "gym",
  "internet",
  "insurance",
  "netflix",
  "phone",
  "phone bill",
  "phone bills",
  "rent",
  "spotify",
  "subscription",
  "subscriptions",
  "utility",
  "utilities",
  "water",
]);

const billSubscriptionCategories = new Set([
  "bill",
  "bills",
  ...recurringCategories,
  "recurring",
  "recurring payment",
  "recurring payments",
]);

const essentialCategories = new Set([
  "bill",
  "bills",
  "electricity",
  "gas",
  "groceries",
  "health",
  "internet",
  "medical",
  "phone",
  "rent",
  "transport",
  "utilities",
  "water",
]);

const optionalCategories = new Set([
  "coffee",
  "dining",
  "entertainment",
  "gaming",
  "hobbies",
  "luxury",
  "restaurant",
  "restaurants",
  "shopping",
  "travel",
]);

const calculationWindows = {
  billsAndSubscriptions: "current month recurring/fixed expense categories",
  dailyBurnRate: "rolling 30-day expenses divided by active days in that rolling window",
  monthlyIncome: "current month income",
  monthlySpending: "current month expenses",
  monthlySurvivalCost: "average monthly essential expenses across uploaded transaction months",
  personalBalance: "all uploaded income minus all uploaded expenses",
  savingsProgress: "personal balance divided by all uploaded income",
};

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
    normalized.includes("electric") ||
    normalized.includes("insurance") ||
    normalized.includes("internet") ||
    normalized.includes("phone") ||
    normalized.includes("subscription") ||
    normalized.includes("recurring") ||
    normalized.includes("utility")
  );
}

function isRecurringCategory(category: string) {
  const normalized = normalizePersonalCategory(category);

  return (
    recurringCategories.has(normalized) ||
    normalized.includes("subscription") ||
    normalized.includes("netflix") ||
    normalized.includes("spotify")
  );
}

function isOptionalPersonalCategory(category: string) {
  const normalized = normalizePersonalCategory(category);

  return (
    optionalCategories.has(normalized) ||
    normalized.includes("coffee") ||
    normalized.includes("dining") ||
    normalized.includes("entertainment") ||
    normalized.includes("gaming") ||
    normalized.includes("luxury") ||
    normalized.includes("restaurant") ||
    normalized.includes("shopping") ||
    normalized.includes("travel")
  );
}

export function isEssentialPersonalCategory(category: string) {
  const normalized = normalizePersonalCategory(category);

  return essentialCategories.has(normalized);
}

function toValidDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameMonth(date: Date, now: Date) {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthSpanCount(dates: Date[]) {
  if (dates.length === 0) {
    return 1;
  }

  const sorted = [...dates].sort((left, right) => left.getTime() - right.getTime());
  const first = startOfMonth(sorted[0]);
  const last = startOfMonth(sorted[sorted.length - 1]);

  return Math.max(
    1,
    (last.getFullYear() - first.getFullYear()) * 12 + last.getMonth() - first.getMonth() + 1,
  );
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function safeAmount(value: number | string) {
  const amount = typeof value === "number"
    ? value
    : Number(value.replace(/[^0-9,.-]/g, "").replace(",", "."));
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
}

function normalizeTransaction(transaction: PersonalFinanceTransaction) {
  const date = toValidDate(transaction.date);
  const normalizedType = String(transaction.type).trim().toLowerCase();
  const type = normalizedType === "income" || normalizedType === "expense"
    ? normalizedType
    : null;
  const amount = safeAmount(transaction.amount);

  if (!date || !type || amount <= 0) {
    return null;
  }

  return {
    amount,
    category: transaction.category || "Uncategorized",
    date,
    type,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type NormalizedPersonalTransaction = NonNullable<ReturnType<typeof normalizeTransaction>>;

function getRepeatedMonthlyExpenseKeys(transactions: NormalizedPersonalTransaction[]) {
  const categoryMonths = new Map<string, Set<string>>();
  const fixedAmountMonths = new Map<string, Set<string>>();

  for (const transaction of transactions) {
    if (transaction.type !== "expense" || isOptionalPersonalCategory(transaction.category)) {
      continue;
    }

    const category = normalizePersonalCategory(transaction.category);
    const month = getMonthKey(transaction.date);
    const roundedAmount = Math.round(transaction.amount);
    const fixedKey = `${category}:${roundedAmount}`;

    categoryMonths.set(category, categoryMonths.get(category) ?? new Set());
    categoryMonths.get(category)?.add(month);
    fixedAmountMonths.set(fixedKey, fixedAmountMonths.get(fixedKey) ?? new Set());
    fixedAmountMonths.get(fixedKey)?.add(month);
  }

  return {
    categories: new Set(
      [...categoryMonths.entries()]
        .filter(([, months]) => months.size >= 2)
        .map(([category]) => category),
    ),
    fixedAmounts: new Set(
      [...fixedAmountMonths.entries()]
        .filter(([, months]) => months.size >= 2)
        .map(([key]) => key),
    ),
  };
}

function isDetectedRecurringExpense(
  transaction: NormalizedPersonalTransaction,
  repeated: ReturnType<typeof getRepeatedMonthlyExpenseKeys>,
) {
  if (transaction.type !== "expense" || isOptionalPersonalCategory(transaction.category)) {
    return false;
  }

  const category = normalizePersonalCategory(transaction.category);
  const fixedKey = `${category}:${Math.round(transaction.amount)}`;

  return repeated.categories.has(category) || repeated.fixedAmounts.has(fixedKey);
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
  const safeTransactions = transactions
    .map(normalizeTransaction)
    .filter((transaction): transaction is NonNullable<ReturnType<typeof normalizeTransaction>> => transaction !== null);
  const monthlyTransactions = safeTransactions.filter((transaction) =>
    isSameMonth(transaction.date, now),
  );
  const repeatedMonthlyExpenses = getRepeatedMonthlyExpenseKeys(safeTransactions);
  const rollingThirtyStart = new Date(now);
  rollingThirtyStart.setDate(now.getDate() - 29);
  rollingThirtyStart.setHours(0, 0, 0, 0);
  const rollingThirtyTransactions = safeTransactions.filter(
    (transaction) => transaction.date >= rollingThirtyStart && transaction.date <= now,
  );
  const totalIncome = safeTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const totalExpenses = safeTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const personalBalance = totalIncome - totalExpenses;
  const safeNetBalance = Number.isFinite(netBalance) ? netBalance : personalBalance;
  const monthlyIncome = monthlyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const averageMonthlyIncome =
    totalIncome /
    monthSpanCount(
      safeTransactions
        .filter((transaction) => transaction.type === "income")
        .map((transaction) => transaction.date),
    );
  const monthlySpending = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const essentialExpenses = safeTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense" && isEssentialPersonalCategory(transaction.category),
    );
  const monthlySurvivalCost =
    essentialExpenses.reduce((total, transaction) => total + transaction.amount, 0) /
    monthSpanCount(essentialExpenses.map((transaction) => transaction.date));
  const billSubscriptionSpend = monthlyTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        (isBillOrSubscriptionCategory(transaction.category) ||
          isRecurringCategory(transaction.category) ||
          isDetectedRecurringExpense(transaction, repeatedMonthlyExpenses)),
    )
    .reduce((total, transaction) => total + transaction.amount, 0);
  const rollingThirtyExpenses = rollingThirtyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const rollingThirtyDates = rollingThirtyTransactions.map((transaction) => transaction.date);
  const earliestRollingDate = rollingThirtyDates.length
    ? new Date(Math.min(...rollingThirtyDates.map((date) => date.getTime())))
    : rollingThirtyStart;
  earliestRollingDate.setHours(0, 0, 0, 0);
  const activeRollingDays = clamp(
    Math.floor((now.getTime() - earliestRollingDate.getTime()) / 86_400_000) + 1,
    1,
    30,
  );
  const dailyBurnRate = rollingThirtyExpenses / activeRollingDays;
  const savingsProgress =
    totalIncome > 0 ? clamp((personalBalance / totalIncome) * 100, 0, 100) : 0;
  const savingsRatio = totalIncome > 0 ? clamp(personalBalance / totalIncome, 0, 1) : 0;
  const incomeBaseline = Math.max(monthlyIncome, averageMonthlyIncome);
  const expenseToIncomeRatio =
    incomeBaseline > 0 ? monthlySpending / incomeBaseline : monthlySpending > 0 ? 2 : 0;
  const essentialExpenseRatio =
    incomeBaseline > 0 ? monthlySurvivalCost / incomeBaseline : monthlySurvivalCost > 0 ? 1 : 0;
  const cashRunwayDays =
    safeNetBalance > 0 && dailyBurnRate > 0
      ? safeNetBalance / dailyBurnRate
      : safeNetBalance > 0
        ? 120
        : 0;
  const projectedThirtyDayBalance = safeNetBalance - dailyBurnRate * 30;
  const positiveBalanceBonus = safeNetBalance > 0 ? 15 : 0;
  const savingsRatioBonus = clamp(savingsRatio / 0.2, 0, 1) * 10;
  const projectionBonus = projectedThirtyDayBalance >= 0 ? 10 : 0;
  const burnRateBonus = clamp(cashRunwayDays / 90, 0, 1) * 10;
  const expenseRatioPenalty =
    expenseToIncomeRatio > 1 ? 10 + clamp(expenseToIncomeRatio - 1, 0, 1) * 15 : 0;
  const negativeProjectionPenalty = projectedThirtyDayBalance < 0 ? 20 : 0;
  const essentialPressurePenalty = clamp((essentialExpenseRatio - 0.45) / 0.55, 0, 1) * 15;
  const healthScore = Math.round(
    clamp(
      50 +
        positiveBalanceBonus +
        savingsRatioBonus +
        projectionBonus +
        burnRateBonus -
        expenseRatioPenalty -
        negativeProjectionPenalty -
        essentialPressurePenalty,
      0,
      100,
    ),
  );
  const monthlySurvivalMonths =
    monthlySurvivalCost > 0 ? Math.max(0, safeNetBalance / monthlySurvivalCost) : null;

  return {
    billSubscriptionSpend,
    dailyBurnRate,
    healthScore,
    personalBalance,
    monthlyIncome,
    monthlySpending,
    monthlySurvivalCost,
    monthlySurvivalMonths,
    savingsProgress,
    totalExpenses,
    totalIncome,
    windows: calculationWindows,
  };
}
