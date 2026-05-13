export type CashFlow = {
  amount: number;
  period: number;
};

export type AmortizationPayment = {
  endingBalance: number;
  interest: number;
  payment: number;
  period: number;
  principal: number;
};

const IRR_TOLERANCE = 1e-7;
const IRR_MAX_ITERATIONS = 100;

function assertFiniteNumber(value: number, label: string) {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

function assertPositivePeriod(period: number, label: string) {
  if (!Number.isInteger(period) || period < 0) {
    throw new Error(`${label} must be a non-negative integer period.`);
  }
}

export function effectivePeriodicRate({
  annualRate,
  periodsPerYear,
}: {
  annualRate: number;
  periodsPerYear: number;
}) {
  assertFiniteNumber(annualRate, "annualRate");

  if (!Number.isInteger(periodsPerYear) || periodsPerYear <= 0) {
    throw new Error("periodsPerYear must be a positive integer.");
  }

  return annualRate / periodsPerYear;
}

export function presentValue({
  cashFlow,
  period,
  rate,
}: {
  cashFlow: number;
  period: number;
  rate: number;
}) {
  assertFiniteNumber(cashFlow, "cashFlow");
  assertFiniteNumber(rate, "rate");
  assertPositivePeriod(period, "period");

  return cashFlow / (1 + rate) ** period;
}

export function futureValue({
  cashFlow,
  period,
  rate,
}: {
  cashFlow: number;
  period: number;
  rate: number;
}) {
  assertFiniteNumber(cashFlow, "cashFlow");
  assertFiniteNumber(rate, "rate");
  assertPositivePeriod(period, "period");

  return cashFlow * (1 + rate) ** period;
}

export function netPresentValue({
  cashFlows,
  rate,
}: {
  cashFlows: CashFlow[];
  rate: number;
}) {
  assertFiniteNumber(rate, "rate");

  return cashFlows.reduce(
    (total, cashFlow) =>
      total +
      presentValue({
        cashFlow: cashFlow.amount,
        period: cashFlow.period,
        rate,
      }),
    0,
  );
}

export function internalRateOfReturn(cashFlows: CashFlow[]) {
  if (cashFlows.length < 2) {
    return null;
  }

  const amounts = cashFlows
    .slice()
    .sort((left, right) => left.period - right.period)
    .map((cashFlow) => cashFlow.amount);
  const hasPositive = amounts.some((amount) => amount > 0);
  const hasNegative = amounts.some((amount) => amount < 0);

  if (!hasPositive || !hasNegative) {
    return null;
  }

  let lower = -0.9999;
  let upper = 10;

  for (let iteration = 0; iteration < IRR_MAX_ITERATIONS; iteration += 1) {
    const midpoint = (lower + upper) / 2;
    const value = netPresentValue({ cashFlows, rate: midpoint });

    if (Math.abs(value) < IRR_TOLERANCE) {
      return midpoint;
    }

    const lowerValue = netPresentValue({ cashFlows, rate: lower });

    if (Math.sign(value) === Math.sign(lowerValue)) {
      lower = midpoint;
    } else {
      upper = midpoint;
    }
  }

  return (lower + upper) / 2;
}

export function ordinaryAnnuityPresentValue({
  payment,
  periods,
  rate,
}: {
  payment: number;
  periods: number;
  rate: number;
}) {
  assertFiniteNumber(payment, "payment");
  assertFiniteNumber(rate, "rate");
  assertPositivePeriod(periods, "periods");

  if (rate === 0) {
    return payment * periods;
  }

  return payment * ((1 - (1 + rate) ** -periods) / rate);
}

export function futureValueOfAnnuity({
  payment,
  periods,
  rate,
}: {
  payment: number;
  periods: number;
  rate: number;
}) {
  assertFiniteNumber(payment, "payment");
  assertFiniteNumber(rate, "rate");
  assertPositivePeriod(periods, "periods");

  if (rate === 0) {
    return payment * periods;
  }

  return payment * (((1 + rate) ** periods - 1) / rate);
}

export function annuityDueAdjustment(value: number, rate: number) {
  assertFiniteNumber(value, "value");
  assertFiniteNumber(rate, "rate");

  return value * (1 + rate);
}

export function perpetuityPresentValue({
  payment,
  rate,
}: {
  payment: number;
  rate: number;
}) {
  assertFiniteNumber(payment, "payment");
  assertFiniteNumber(rate, "rate");

  if (rate <= 0) {
    throw new Error("rate must be positive for perpetuity valuation.");
  }

  return payment / rate;
}

export function growingPerpetuityPresentValue({
  nextCashFlow,
  growthRate,
  rate,
}: {
  nextCashFlow: number;
  growthRate: number;
  rate: number;
}) {
  assertFiniteNumber(nextCashFlow, "nextCashFlow");
  assertFiniteNumber(growthRate, "growthRate");
  assertFiniteNumber(rate, "rate");

  if (rate <= growthRate) {
    throw new Error("rate must be greater than growthRate for growing perpetuity valuation.");
  }

  return nextCashFlow / (rate - growthRate);
}

export function loanPayment({
  periods,
  principal,
  rate,
}: {
  periods: number;
  principal: number;
  rate: number;
}) {
  assertFiniteNumber(principal, "principal");
  assertFiniteNumber(rate, "rate");
  assertPositivePeriod(periods, "periods");

  if (periods === 0) {
    return 0;
  }

  if (rate === 0) {
    return principal / periods;
  }

  return principal * (rate / (1 - (1 + rate) ** -periods));
}

export function buildLoanAmortizationSchedule({
  periods,
  principal,
  rate,
}: {
  periods: number;
  principal: number;
  rate: number;
}): AmortizationPayment[] {
  const payment = loanPayment({ periods, principal, rate });
  const schedule: AmortizationPayment[] = [];
  let balance = principal;

  for (let period = 1; period <= periods; period += 1) {
    const interest = balance * rate;
    const principalPaid = Math.min(balance, payment - interest);
    balance = Math.max(0, balance - principalPaid);

    schedule.push({
      endingBalance: balance,
      interest,
      payment,
      period,
      principal: principalPaid,
    });
  }

  return schedule;
}
