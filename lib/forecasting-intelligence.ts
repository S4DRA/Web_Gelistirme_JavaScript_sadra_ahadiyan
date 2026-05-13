import type { FinanceType } from "@/lib/workspace";

export type ForecastModelStage =
  | "deterministic_financial_math"
  | "naive_baseline"
  | "seasonal_naive_baseline"
  | "moving_average"
  | "linear_regression"
  | "ARIMA"
  | "SARIMA"
  | "VAR"
  | "state_space_models"
  | "Kalman_filter"
  | "random_forest"
  | "gradient_boosting"
  | "forecast_ensembles"
  | "LSTM_only_if_justified"
  | "transformers_only_if_justified";

export type ForecastFeatureName =
  | "lag_features"
  | "rolling_averages"
  | "rolling_volatility"
  | "trend_features"
  | "seasonality_features"
  | "holiday_features"
  | "calendar_features"
  | "recurring_transaction_detection"
  | "billing_cycle_detection"
  | "payroll_cycle_detection"
  | "category_level_trends"
  | "intervention_flags"
  | "macro_context_extension_points";

export type ForecastMetricName = "RMSE" | "MAE" | "MAPE" | "MASE" | "RMSSE" | "AUC_only_for_binary_classification";

export type ForecastTransaction = {
  amount: number;
  category: string;
  date: Date;
  type: "income" | "expense";
};

export type ForecastRiskProfile = {
  businessLiquidityRisk: "low" | "medium" | "high";
  cashShortageProbability: number;
  confidenceLevel: number;
  cvar: number;
  debtPressureProbability: number;
  downsideProbability: number;
  emergencyFundSurvivalDays: number | null;
  predictionInterval: {
    lower: number;
    upper: number;
  };
  valueAtRisk: number;
};

export type ForecastGovernance = {
  activeModel: ForecastModelStage;
  benchmarkModel: ForecastModelStage;
  challengerModels: ForecastModelStage[];
  metrics: ForecastMetricName[];
  minimumHistoryRecommendationDays: number;
  rules: string[];
  validationMethods: string[];
};

export type ForecastFeatureCatalog = {
  active: ForecastFeatureName[];
  future: ForecastFeatureName[];
};

export type ScenarioSet = {
  base: number;
  best: number;
  worst: number;
};

export type ForecastIntelligence = {
  featureCatalog: ForecastFeatureCatalog;
  governance: ForecastGovernance;
  modelHierarchy: ForecastModelStage[];
  riskProfile: ForecastRiskProfile;
  scenarioSet: ScenarioSet;
  signals: string[];
};

export const FORECAST_MODEL_HIERARCHY: ForecastModelStage[] = [
  "deterministic_financial_math",
  "naive_baseline",
  "seasonal_naive_baseline",
  "moving_average",
  "linear_regression",
  "ARIMA",
  "SARIMA",
  "VAR",
  "state_space_models",
  "Kalman_filter",
  "random_forest",
  "gradient_boosting",
  "forecast_ensembles",
  "LSTM_only_if_justified",
  "transformers_only_if_justified",
];

const GOVERNANCE_METRICS: ForecastMetricName[] = [
  "RMSE",
  "MAE",
  "MAPE",
  "MASE",
  "RMSSE",
  "AUC_only_for_binary_classification",
];

function clampProbability(value: number) {
  return Math.min(0.99, Math.max(0.01, value));
}

function standardDeviation(values: number[]) {
  if (values.length < 2) {
    return 0;
  }

  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) / (values.length - 1);

  return Math.sqrt(Math.max(0, variance));
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

function normalCdf(value: number) {
  return 0.5 * (1 + erf(value / Math.SQRT2));
}

// Abramowitz and Stegun approximation; accurate enough for product risk bands.
function erf(value: number) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));

  return sign * y;
}

export function buildDailyNetSeries(transactions: ForecastTransaction[]) {
  const byDay = new Map<string, number>();

  for (const transaction of transactions) {
    const key = transaction.date.toISOString().slice(0, 10);
    const signedAmount = transaction.type === "income" ? transaction.amount : -transaction.amount;
    byDay.set(key, (byDay.get(key) ?? 0) + signedAmount);
  }

  return [...byDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, net]) => ({ date, net }));
}

export function buildFeatureCatalog({
  financeType,
  transactions,
}: {
  financeType: FinanceType;
  transactions: ForecastTransaction[];
}): ForecastFeatureCatalog {
  const active = new Set<ForecastFeatureName>([
    "lag_features",
    "rolling_averages",
    "rolling_volatility",
    "trend_features",
    "calendar_features",
    "recurring_transaction_detection",
    "category_level_trends",
  ]);

  if (transactions.length >= 60) {
    active.add("seasonality_features");
  }

  if (financeType === "business") {
    active.add("billing_cycle_detection");
  } else {
    active.add("payroll_cycle_detection");
  }

  return {
    active: [...active],
    future: [
      "holiday_features",
      "intervention_flags",
      "macro_context_extension_points",
    ],
  };
}

export function buildForecastGovernance(transactions: ForecastTransaction[]): ForecastGovernance {
  const historyDays = buildDailyNetSeries(transactions).length;
  const challengerModels: ForecastModelStage[] =
    historyDays >= 180
      ? ["moving_average", "linear_regression", "ARIMA", "SARIMA"]
      : ["moving_average", "linear_regression"];

  if (historyDays >= 365) {
    challengerModels.push("random_forest", "gradient_boosting", "forecast_ensembles");
  }

  return {
    activeModel: "deterministic_financial_math",
    benchmarkModel: "naive_baseline",
    challengerModels,
    metrics: GOVERNANCE_METRICS,
    minimumHistoryRecommendationDays: 180,
    rules: [
      "Never use random train/test splits for time-series forecasting.",
      "Use AUC only for binary outcomes such as default, delinquency, churn, or missed-payment risk.",
      "LSTM and transformers remain challengers only when data scale and sequence complexity justify them.",
      "Keep nominal cash flows with nominal rates and real cash flows with real rates.",
      "Match cash-flow timing to the compounding period.",
    ],
    validationMethods: [
      "rolling_origin_backtesting",
      "time_aware_train_test_splits",
      "leakage_prevention",
      "benchmark_comparison",
      "challenger_model_comparison",
      "forecast_error_tracking",
      "interval_coverage_testing",
      "model_drift_monitoring",
      "structural_break_monitoring",
    ],
  };
}

export function buildForecastRiskProfile({
  currentBalance,
  dailyNetCashFlow,
  financeType,
  fixedDailyObligation,
  futureBalance,
  periodDays,
  transactions,
}: {
  currentBalance: number;
  dailyNetCashFlow: number;
  financeType: FinanceType;
  fixedDailyObligation: number;
  futureBalance: number;
  periodDays: number;
  transactions: ForecastTransaction[];
}): ForecastRiskProfile {
  const netSeries = buildDailyNetSeries(transactions).map((item) => item.net);
  const observedVolatility = standardDeviation(netSeries);
  const fallbackVolatility = Math.max(25, Math.abs(dailyNetCashFlow) * 0.35, fixedDailyObligation * 0.5);
  const dailyVolatility = observedVolatility > 0 ? observedVolatility : fallbackVolatility;
  const horizonVolatility = dailyVolatility * Math.sqrt(Math.max(1, periodDays));
  const lower = futureBalance - 1.96 * horizonVolatility;
  const upper = futureBalance + 1.96 * horizonVolatility;
  const downsideProbability = clampProbability(normalCdf((currentBalance - futureBalance) / Math.max(1, horizonVolatility)));
  const cashShortageProbability = clampProbability(normalCdf((0 - futureBalance) / Math.max(1, horizonVolatility)));
  const debtPressureProbability = clampProbability(
    sigmoid((fixedDailyObligation * periodDays - currentBalance) / Math.max(1, Math.abs(currentBalance) + 1)),
  );
  const valueAtRisk = Math.max(0, currentBalance - lower);
  const cvar = Math.max(valueAtRisk, valueAtRisk + horizonVolatility * 0.42);
  const emergencyFundSurvivalDays =
    fixedDailyObligation > 0 ? Math.floor(currentBalance / fixedDailyObligation) : null;
  const businessLiquidityRisk =
    cashShortageProbability > 0.35 || futureBalance < 0
      ? "high"
      : cashShortageProbability > 0.18 || debtPressureProbability > 0.55
        ? "medium"
        : "low";

  return {
    businessLiquidityRisk: financeType === "business" ? businessLiquidityRisk : "low",
    cashShortageProbability,
    confidenceLevel: 0.95,
    cvar,
    debtPressureProbability,
    downsideProbability,
    emergencyFundSurvivalDays,
    predictionInterval: {
      lower,
      upper,
    },
    valueAtRisk,
  };
}

export function buildScenarioSet({
  base,
  currentBalance,
  dailyNetCashFlow,
  periodDays,
}: {
  base: number;
  currentBalance: number;
  dailyNetCashFlow: number;
  periodDays: number;
}): ScenarioSet {
  const movement = dailyNetCashFlow * periodDays;
  const shock = Math.max(Math.abs(movement) * 0.18, Math.abs(currentBalance) * 0.03, 100);

  return {
    base,
    best: base + shock,
    worst: base - shock,
  };
}

export function buildForecastSignals({
  financeType,
  riskProfile,
}: {
  financeType: FinanceType;
  riskProfile: ForecastRiskProfile;
}) {
  const signals = [
    `95% prediction interval: ${riskProfile.predictionInterval.lower.toFixed(2)} to ${riskProfile.predictionInterval.upper.toFixed(2)}.`,
    `Cash shortage probability: ${(riskProfile.cashShortageProbability * 100).toFixed(1)}%.`,
    `Downside probability: ${(riskProfile.downsideProbability * 100).toFixed(1)}%.`,
    `VaR estimate: ${riskProfile.valueAtRisk.toFixed(2)}; CVaR estimate: ${riskProfile.cvar.toFixed(2)}.`,
  ];

  if (financeType === "personal" && riskProfile.emergencyFundSurvivalDays !== null) {
    signals.push(`Emergency fund survival estimate: ${riskProfile.emergencyFundSurvivalDays} days.`);
  }

  if (financeType === "business") {
    signals.push(`Business liquidity risk: ${riskProfile.businessLiquidityRisk}.`);
  }

  return signals;
}

export function buildForecastIntelligence({
  currentBalance,
  dailyNetCashFlow,
  financeType,
  fixedDailyObligation,
  futureBalance,
  periodDays,
  transactions,
}: {
  currentBalance: number;
  dailyNetCashFlow: number;
  financeType: FinanceType;
  fixedDailyObligation: number;
  futureBalance: number;
  periodDays: number;
  transactions: ForecastTransaction[];
}): ForecastIntelligence {
  const riskProfile = buildForecastRiskProfile({
    currentBalance,
    dailyNetCashFlow,
    financeType,
    fixedDailyObligation,
    futureBalance,
    periodDays,
    transactions,
  });

  return {
    featureCatalog: buildFeatureCatalog({ financeType, transactions }),
    governance: buildForecastGovernance(transactions),
    modelHierarchy: FORECAST_MODEL_HIERARCHY,
    riskProfile,
    scenarioSet: buildScenarioSet({
      base: futureBalance,
      currentBalance,
      dailyNetCashFlow,
      periodDays,
    }),
    signals: buildForecastSignals({ financeType, riskProfile }),
  };
}
