# Dampener Predictive Intelligence Blueprint

This blueprint translates the research document `Financial Forecasting and Predictive Analytics for Future Financial Outcomes` into Dampener's product and engineering architecture. The implementation should remain staged: deterministic financial math and transparent baselines first, statistically validated challengers next, and deep learning only after data scale and complexity justify it.

## Senior Architecture Opinion

Dampener should not present itself as an AI forecasting platform before it has governed forecasting foundations. The correct product direction is a predictive financial intelligence system that combines:

- deterministic financial math for value, debt, savings, and cash-flow timing;
- time-aware forecasting baselines for income, expenses, invoices, runway, and category trends;
- uncertainty and scenario layers for downside decisions;
- governance that proves every more complex model beats transparent baselines under rolling-origin backtesting.

## Concepts Not Yet Fully Used

- Present value, future value, NPV, IRR, DCF, ordinary annuity, annuity due, perpetuity, growing perpetuity, loan amortization, and debt schedules.
- Nominal versus real rate consistency and monthly/yearly compounding consistency.
- Naive, seasonal naive, moving average, regression, ARIMA, SARIMA, VAR, state-space, Kalman, random forest, gradient boosting, ensembles, LSTM, and transformer model hierarchy.
- Lag features, rolling averages, rolling volatility, trends, seasonality, holidays, calendar variables, recurring/billing/payroll cycle detection, category trends, intervention flags, and macro extension points.
- Prediction intervals, Monte Carlo simulation, scenario analysis, stress testing, VaR, CVaR, downside probability, cash shortage probability, debt pressure probability, emergency fund survival, and business liquidity risk.
- Rolling-origin backtesting, leakage prevention, benchmark and challenger comparison, forecast error tracking, interval coverage, model drift, and structural break monitoring.
- Hierarchical reconciliation so category, client, department, product, region, branch, and workspace forecasts add up to total forecasts.

## Integration Map

| Concept family | Current integration | Next integration target |
| --- | --- | --- |
| Financial math | `lib/financial-math.ts` foundation | Debt payoff, loan amortization view, savings goals, DCF/NPV planning |
| Forecast hierarchy | `lib/forecasting-intelligence.ts` model governance metadata | Rolling-origin backtesting tables and challenger model registry |
| Feature engineering | Active/future feature catalog in prediction result | Persist engineered feature snapshots for model audit |
| Risk and uncertainty | Prediction interval, scenario set, VaR/CVaR-like estimates, probabilities | Monte Carlo simulations and stress-test saved scenarios |
| Validation governance | Rules and validation method metadata | Forecast error history, interval coverage, drift alerts |
| UI/UX | Dashboard shows best/worst case, shortage risk, 95% range | Dedicated liquidity risk and scenario planning panels |

## Data Dampener Should Collect Next

- Transaction source and import metadata, including whether a value was revised, imported, manual, duplicate-held, or post-period adjusted.
- Recurring bill/payroll anchors, expected payment dates, actual settlement dates, and payment delay history.
- Invoice issue date, promised payment terms, actual paid date, client, category, and partial-payment history.
- Debt principal, APR, compounding frequency, payment amount, due date, remaining term, and refinancing assumptions.
- Savings goals, target dates, minimum reserve targets, essential spending flags, and household/business obligation priority.
- Event/intervention flags: job change, rent change, price change, promotion, campaign, one-off purchase, tax payment, capital expenditure.
- Optional macro and calendar extensions: holidays, inflation assumptions, interest-rate assumptions, FX exposure, business seasonality.

## Realistic Now Versus Future

Realistic now:

- deterministic cash-flow calendar;
- debt and annuity math;
- naive baseline;
- moving average;
- transparent regression-style feature outputs;
- scenario analysis;
- stress testing;
- prediction intervals using observed volatility;
- downside, shortage, debt pressure, emergency fund, and liquidity risk estimates.

Future challengers after enough data:

- ARIMA and SARIMA for single mature series;
- VAR for interacting income, expense, invoice, and balance series;
- state-space and Kalman filtering for noisy or missing financial observations;
- random forest and gradient boosting for rich tabular histories;
- forecast ensembles after two or more validated model families perform well.

Future placeholders only:

- LSTM when Dampener has many related sequences or dense transaction histories;
- transformers when app-scale panels or long-context sequence modeling justify the compute and governance burden.

## Product Features This Enables

- Cash-flow forecast with best/base/worst case and 95% interval.
- Cash shortage warning and days-until-negative estimate.
- Emergency fund survival forecast.
- Debt payoff projection and loan amortization view.
- Invoice payment risk and liquidity pressure dashboard.
- Scenario planning for job loss, rent increase, payroll pressure, delayed invoices, rate changes, or revenue decline.
- Stress testing for business liquidity, debt service, and household resilience.
- Forecast reasoning that explains which assumptions and data sources influenced the result.
- Forecast model confidence badge based on history length, backtest quality, interval coverage, and drift.

## Governance Rules

- Never use random train/test splits for time-series forecasting.
- Always compare complex models to naive, seasonal naive, regression, and ARIMA-class baselines where appropriate.
- Use RMSE when large misses are costly, MAE for robust central performance, MASE/RMSSE for cross-series comparison, and AUC only for binary classification.
- Treat VaR as a reporting threshold and CVaR as a downside decision threshold.
- Reconcile hierarchical forecasts whenever category totals must match total cash-flow forecasts.
- Monitor forecast error, interval coverage, drift, structural breaks, and exception counts after deployment.
