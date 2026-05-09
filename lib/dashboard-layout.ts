export type DashboardSectionId =
  | "alerts"
  | "metrics"
  | "prediction"
  | "recommendations"
  | "cashFlow"
  | "analytics";

export type DashboardMetricId =
  | "totalIncome"
  | "totalExpenses"
  | "netBalance"
  | "runway"
  | "overdueInvoices"
  | "dueSoon";

export type DashboardLayout = {
  hiddenCards: DashboardMetricId[];
  hiddenSections: DashboardSectionId[];
  metricOrder: DashboardMetricId[];
  sectionOrder: DashboardSectionId[];
};

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  hiddenCards: [],
  hiddenSections: [],
  metricOrder: [
    "totalIncome",
    "totalExpenses",
    "netBalance",
    "runway",
    "overdueInvoices",
    "dueSoon",
  ],
  sectionOrder: [
    "alerts",
    "metrics",
    "prediction",
    "recommendations",
    "cashFlow",
    "analytics",
  ],
};

const metricIds = new Set(DEFAULT_DASHBOARD_LAYOUT.metricOrder);
const sectionIds = new Set(DEFAULT_DASHBOARD_LAYOUT.sectionOrder);

export function normalizeDashboardLayout(value: unknown): DashboardLayout {
  if (!value || typeof value !== "object") {
    return DEFAULT_DASHBOARD_LAYOUT;
  }

  const layout = value as Partial<DashboardLayout>;

  return {
    hiddenCards: normalizeIdList(layout.hiddenCards, metricIds),
    hiddenSections: normalizeIdList(layout.hiddenSections, sectionIds),
    metricOrder: normalizeOrderedIds(layout.metricOrder, DEFAULT_DASHBOARD_LAYOUT.metricOrder),
    sectionOrder: normalizeOrderedIds(
      layout.sectionOrder,
      DEFAULT_DASHBOARD_LAYOUT.sectionOrder,
    ),
  };
}

function normalizeIdList<T extends string>(value: unknown, allowedIds: Set<T>) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is T => allowedIds.has(item));
}

function normalizeOrderedIds<T extends string>(value: unknown, defaultOrder: T[]) {
  const allowedIds = new Set(defaultOrder);
  const provided = Array.isArray(value)
    ? value.filter((item): item is T => allowedIds.has(item))
    : [];
  const missing = defaultOrder.filter((item) => !provided.includes(item));

  return [...provided, ...missing];
}
