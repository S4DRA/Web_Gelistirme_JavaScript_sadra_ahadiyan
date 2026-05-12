type AnalyticsTransaction = {
  amount: { toString(): string };
  category: string;
  date: Date;
  type: "income" | "expense" | string;
};

type AnalyticsInvoice = {
  amount: { toString(): string };
  dueDate: Date;
  status: string;
};

type AnalyticsBudget = {
  amount: { toString(): string };
  category: string;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

export function buildAnalytics({
  budgets,
  invoices,
  monthlyFixedExpenses,
  netBalance,
  transactions,
}: {
  budgets: AnalyticsBudget[];
  invoices: AnalyticsInvoice[];
  monthlyFixedExpenses: number;
  netBalance: number;
  transactions: AnalyticsTransaction[];
}) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const currentMonth = startOfMonth(now);
  const previousMonth = new Date(currentMonth);
  previousMonth.setMonth(previousMonth.getMonth() - 1);

  const currentMonthTransactions = transactions.filter((item) => item.date >= currentMonth);
  const previousMonthTransactions = transactions.filter(
    (item) => item.date >= previousMonth && item.date < currentMonth,
  );
  const expenses = currentMonthTransactions.filter((item) => item.type === "expense");
  const income = currentMonthTransactions.filter((item) => item.type === "income");
  const currentExpenses = expenses.reduce(
    (total, item) => total + Number(item.amount.toString()),
    0,
  );
  const currentIncome = income.reduce(
    (total, item) => total + Number(item.amount.toString()),
    0,
  );
  const previousExpenses = previousMonthTransactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + Number(item.amount.toString()), 0);
  const previousIncome = previousMonthTransactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + Number(item.amount.toString()), 0);
  const categorySpend = expenses.reduce<Record<string, number>>((totals, item) => {
    totals[item.category] = (totals[item.category] ?? 0) + Number(item.amount.toString());
    return totals;
  }, {});
  const categoryBreakdown = Object.entries(categorySpend)
    .map(([category, amount]) => ({
      amount,
      category,
      percent: currentExpenses > 0 ? Math.round((amount / currentExpenses) * 100) : 0,
    }))
    .sort((left, right) => right.amount - left.amount);
  const topCategory = categoryBreakdown[0] ?? null;
  const expenseChangePercent =
    previousExpenses > 0
      ? Math.round(((currentExpenses - previousExpenses) / previousExpenses) * 100)
      : null;
  const incomeChangePercent =
    previousIncome > 0
      ? Math.round(((currentIncome - previousIncome) / previousIncome) * 100)
      : null;
  const lastSixMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentMonth);
    date.setMonth(currentMonth.getMonth() - (5 - index));
    return monthKey(date);
  });
  const monthlyTrend = lastSixMonths.map((key) => {
    const monthTransactions = transactions.filter(
      (transaction) => monthKey(transaction.date) === key,
    );
    const monthIncome = monthTransactions
      .filter((item) => item.type === "income")
      .reduce((total, item) => total + Number(item.amount.toString()), 0);
    const monthExpenses = monthTransactions
      .filter((item) => item.type === "expense")
      .reduce((total, item) => total + Number(item.amount.toString()), 0);

    return {
      expenses: monthExpenses,
      income: monthIncome,
      label: monthLabel(key),
      net: monthIncome - monthExpenses,
    };
  });
  const openInvoices = invoices.filter(
    (invoice) => invoice.status !== "paid" && invoice.status !== "cancelled",
  );
  const overdueInvoices = openInvoices.filter((invoice) => {
    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < todayStart;
  });
  const dueSoonInvoices = openInvoices.filter((invoice) => {
    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const sevenDaysFromToday = new Date(todayStart);
    sevenDaysFromToday.setDate(todayStart.getDate() + 7);

    return dueDate >= todayStart && dueDate <= sevenDaysFromToday;
  });
  const invoiceAging = {
    dueSoon: dueSoonInvoices.reduce((total, invoice) => total + Number(invoice.amount.toString()), 0),
    overdue: overdueInvoices.reduce((total, invoice) => total + Number(invoice.amount.toString()), 0),
    paid: invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((total, invoice) => total + Number(invoice.amount.toString()), 0),
    unpaid: openInvoices.reduce((total, invoice) => total + Number(invoice.amount.toString()), 0),
  };
  const budgetWarnings = budgets
    .map((budget) => {
      const spent = categorySpend[budget.category] ?? 0;
      const limit = Number(budget.amount.toString());

      return {
        category: budget.category,
        limit,
        percent: limit > 0 ? Math.round((spent / limit) * 100) : 0,
        spent,
      };
    })
    .filter((budget) => budget.percent >= 80)
    .sort((left, right) => right.percent - left.percent);
  const runwayMonths =
    monthlyFixedExpenses > 0 ? Math.floor(netBalance / monthlyFixedExpenses) : null;
  const recommendations = [
    overdueInvoices.length > 0
      ? `Follow up on ${overdueInvoices.length} overdue invoice${overdueInvoices.length === 1 ? "" : "s"} today.`
      : null,
    dueSoonInvoices.length > 0
      ? `${dueSoonInvoices.length} invoice${dueSoonInvoices.length === 1 ? "" : "s"} due in the next 7 days.`
      : null,
    expenseChangePercent !== null && expenseChangePercent > 15
      ? `Expenses are up ${expenseChangePercent}% compared with last month.`
      : null,
    topCategory
      ? `${topCategory.category} is your largest expense category this month.`
      : null,
    runwayMonths !== null && runwayMonths < 2
      ? `Your current balance covers less than 2 months of fixed expenses.`
      : null,
  ].filter((item): item is string => item !== null);

  return {
    budgetWarnings,
    categoryBreakdown,
    currentExpenses,
    currentIncome,
    expenseChangePercent,
    incomeChangePercent,
    invoiceAging,
    monthlyTrend,
    overdueAmount: invoiceAging.overdue,
    overdueInvoices: overdueInvoices.length,
    previousExpenses,
    recommendations,
    runwayMonths,
    topCategory,
  };
}
