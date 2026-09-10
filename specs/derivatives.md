# Derivatives boundary, version 1.0.0

Status: proposed contract and validated synthetic references; no browser adapter, worker, frontend, engine modification or deployment is implemented by this document.

The canonical implementation remains [OptionPricingEngine v0.1.2](https://github.com/adelevski/OptionPricingEngine/tree/749bc959c3bca0befdf439339979c040343ede37), revision `749bc959c3bca0befdf439339979c040343ede37`. A future finance interface can present its results without absorbing the engine's source or pretending every model is available. The existing engine consumes plain numeric inputs and returns a call/put pair. This contract makes those inputs, conventions, limitations and failures explicit at a JSON boundary.

## Scope

Supported model: `black_scholes_merton_constant_v1`, risk-neutral geometric Brownian motion with constant annual volatility, constant continuously compounded risk-free rate and continuous dividend yield.

| Instrument `kind` | `closed_form` | `monte_carlo` |
|---|---|---|
| `european_vanilla` | Current `black_scholes` | Current seeded `euro_monte_carlo` |
| `asian_arithmetic_fixed_strike` | Unsupported | Current seeded `asian_monte_carlo`, type `a` |
| `asian_geometric_fixed_strike` | Unsupported | Current seeded `asian_monte_carlo`, type `g` |

Every successful request returns both call and put prices. A geometric Asian analytic formula is used as an independent **test oracle** in the reference fixture; it is not a new supported engine method. No American exercise, implied volatility, Greeks, calibration, live quotes, order placement, portfolio aggregation or trade recommendations are part of this version.

## Request

Use a plain JSON object. All listed fields are required unless a condition says otherwise. Reject unsupported versions/enums and unknown computational fields rather than silently ignoring assumptions. Do not accept numeric strings, booleans as numbers, nonfinite values or fractional integer fields.

```json
{
  "contract_version": "1.0.0",
  "request_id": "comparison-17",
  "model": "black_scholes_merton_constant_v1",
  "instrument": {
    "kind": "european_vanilla",
    "currency": "USD",
    "spot": 100,
    "strike": 100,
    "maturity_years": 1
  },
  "market": {
    "volatility": 0.2,
    "continuous_risk_free_rate": 0.05,
    "continuous_dividend_yield": 0
  },
  "conventions": {
    "time_basis": "explicit_year_fraction",
    "value_basis": "one_underlying_unit",
    "monitoring": "not_applicable"
  },
  "method": {
    "name": "monte_carlo",
    "paths": 10000,
    "seed": 42
  }
}
```

| Field | Meaning and validation |
|---|---|
| `contract_version` | Exactly `1.0.0` for this contract. Unsupported versions fail explicitly. |
| `request_id` | Caller-generated nonempty opaque string, at most 128 characters; echoed so late worker results cannot overwrite newer requests. No user/account identifier is required. |
| `model` | Exactly the supported model identifier above. |
| `instrument.kind` | One of the three instruments in the capability table. |
| `instrument.currency` | Three uppercase ASCII letters used as a unit label. No exchange-rate conversion, identity validation or data-provider request is implied. Callers must use the same currency for spot, strike and output. |
| `spot`, `strike` | Strictly positive finite numbers in currency units per one underlying unit. Map to core `S`, `K`. |
| `maturity_years` | Strictly positive finite numeric year fraction, core `T`. Zero/expired maturity is rejected; the adapter does not synthesize an expiry payoff. |
| `volatility` | Finite nonnegative annualized decimal, core `v`; `0.2` means 20%, not 0.2%. Zero is supported. |
| `continuous_risk_free_rate` | Finite annual continuously compounded decimal, core `r`. Negative rates are allowed if numerical range remains supported. |
| `continuous_dividend_yield` | Finite annual continuously compounded decimal, core `q`. Do not silently prohibit negative values or substitute a spot cash dividend. |
| `time_basis` | Exactly `explicit_year_fraction`. No valuation date, calendar, trading-session count or day-count convention is inferred. |
| `value_basis` | Exactly `one_underlying_unit`. The result is not multiplied by lot size, contract multiplier, holdings or exchange FX. |
| `monitoring` | European: `not_applicable`. Asian: `legacy_252_time_zero_excludes_expiry_v1`. |
| `method.name` | `closed_form` or `monte_carlo`, restricted by the capability table. |
| `method.paths` | Required only for Monte Carlo, integer 1–100,000 under the proposed browser budget. Maps to core `num_sims`. Reject this field for closed form. |
| `method.seed` | Required only for Monte Carlo, integer 0–4,294,967,295, maps to `uint32_t`. Reject this field for closed form. The UI may generate a seed, but must show/preserve it in exported inputs. |

A caller can later implement a separate date-to-year-fraction calculator, but must preserve its dates and chosen day-count convention separately and pass the resulting numeric maturity deliberately. Version 1 does not accept valuation/expiry dates as computational inputs. In particular, `252` is the Asian sampling convention below; it is not a claim that every instrument's maturity should be converted using business days divided by 252.

Changing year fractions, units, monitoring conventions or treatment of expiry must never happen silently under an existing model/convention identifier. Version the boundary incompatibly when existing requests would change meaning. An additive field still needs an explicit supported-version negotiation before strict consumers accept it.

## Asian observation convention

The source calculates:

```text
n = floor(long_double(T) * 252)
t[i] = i / 252, for i = 0, ..., n - 1
discount time = T
```

The initial spot at time zero is an observation. The terminal maturity is **not** an observation, even when maturity falls on the nominal grid. This is a model convention, not a missing final point to quietly insert. Arithmetic/geometric averaging uses all `n` observations. The model evolves paths by exact multiplicative GBM steps between successive observations and discounts the final payoff at the supplied `T`.

- `n < 1` fails with `INVALID_MONITORING_GRID`.
- `n == 1` means only the current spot enters the average; price therefore does not reflect subsequent volatility. A successful result must include `TIME_ZERO_ONLY_MONITORING` so the UI can explain it.
- Display the resolved observation count and last observation time in details, plus a concise visible legacy-schedule indication for Asian results.
- Floating-point year fractions near a grid boundary can resolve differently if an adapter reimplements the count using different precision. Compute/return the resolved count using the same arithmetic as the selected engine build; do not round `T` or promise identical schedule resolution across different numeric backends near the boundary. Validate the final resolved count against the budget before allocation. A future adapter should test values immediately above/below boundaries.
- Custom dates, monthly schedules and inclusion of terminal expiry are unsupported. A future improved schedule needs a new convention identifier and its own references, not a changed interpretation of this one.

## Success result

```json
{
  "contract_version": "1.0.0",
  "request_id": "example-analytic",
  "status": "ok",
  "engine": {
    "repository": "https://github.com/adelevski/OptionPricingEngine",
    "release": "v0.1.2",
    "revision": "749bc959c3bca0befdf439339979c040343ede37",
    "adapter_version": "<actual adapter version>",
    "build_id": "<actual compiler/standard-library/build identity>"
  },
  "method": { "name": "closed_form" },
  "prices": { "call": 10.450583572185565, "put": 5.5735260222569734 },
  "units": { "currency": "USD", "value_basis": "one_underlying_unit" },
  "resolved_model": {
    "model": "black_scholes_merton_constant_v1",
    "instrument_kind": "european_vanilla",
    "maturity_years": 1,
    "monitoring": null
  },
  "uncertainty": {
    "status": "not_applicable",
    "standard_error": null,
    "confidence_interval": null,
    "reason": "deterministic_closed_form"
  },
  "warnings": [],
  "work": { "paths_completed": 0, "path_observations_processed": 0 }
}
```

This is an illustrative shape, not a fabricated adapter deployment. `adapter_version` and `build_id` must identify a real implementation when one exists. Pair the result with the original request in any saved/exported comparison; do not retain only the rounded displayed prices. Prices remain full-precision finite JSON numbers and units remain explicit. A negative/nonfinite result must fail validation (`INVALID_RESULT`), not be clamped to zero.

For Monte Carlo, `method` echoes actual `paths` and `seed`, `paths_completed` equals requested paths on success, and uncertainty is **always**:

```json
{
  "status": "not_estimated",
  "standard_error": null,
  "confidence_interval": null,
  "reason": "engine_does_not_compute_sampling_uncertainty"
}
```

This is required even for the current zero-volatility Monte Carlo API. The wrapper may know the mathematical model is deterministic, but must not invent an uncertainty estimate absent from the engine result. Never serialize missing error as `0`, `0%`, a zero-width confidence interval, or reuse a deterministic benchmark difference as standard error. `not_applicable` is reserved for the closed-form method. Model uncertainty is not quantified by either status.

A Monte Carlo result includes warning `SAMPLING_UNCERTAINTY_UNAVAILABLE`. Asian results also include `LEGACY_MONITORING_SCHEDULE`; the time-zero-only case adds its warning. Warnings are stable code strings, rendered with concise explanatory UI copy. No warning changes the underlying price or converts success to failure.

Asian `resolved_model.monitoring` contains:

```json
{
  "convention": "legacy_252_time_zero_excludes_expiry_v1",
  "observation_count": 252,
  "first_observation_years": 0,
  "last_observation_years": 0.996031746031746,
  "includes_expiry": false
}
```

European monitoring is `null`. `path_observations_processed` is defined as `paths` for European terminal draws and `paths * observation_count` for Asian paths, counting the initial observation. This is a workload accounting convention, **not** a measurement of wall time or exact CPU operations. Closed form reports zero for both work counters. A future implementation can measure duration separately without claiming universal device performance.

The interface may compare Monte Carlo and closed form in separate requests, then show `estimate - reference` as **signed difference**. Preserve both requests and require identical instrument/model parameters; do not present that difference as “sampling error,” “accuracy,” or a confidence level. The existing CLI uses the opposite subtraction order, so the frontend must label its own convention explicitly rather than parse CLI text.

## Errors, cancellation and budgets

```json
{
  "contract_version": "1.0.0",
  "request_id": "invalid-example",
  "status": "error",
  "prices": null,
  "error": {
    "code": "WORK_BUDGET_EXCEEDED",
    "field": "method.paths",
    "message": "This request exceeds the browser calculation budget."
  }
}
```

Stable error codes: `UNSUPPORTED_CONTRACT_VERSION`, `INVALID_INPUT`, `UNSUPPORTED_MODEL`, `UNSUPPORTED_INSTRUMENT`, `UNSUPPORTED_METHOD`, `UNSUPPORTED_CONVENTION`, `INVALID_MONITORING_GRID`, `WORK_BUDGET_EXCEEDED`, `NUMERIC_RANGE_EXCEEDED`, `INVALID_RESULT`, `ENGINE_FAILURE`. `field` is a dotted path or `null` for a non-field failure; `message` is user-safe explanation, not a native stack trace. Native invalid-argument and overflow exceptions must be caught at the boundary and mapped appropriately. An out-of-range model fails instead of automatically changing parameters or trying another model. No partial price pair is a successful result.

Cancellation has a separate envelope: `{contract_version, request_id, status:"cancelled", prices:null}`. Do not return zero or stale prices for a cancelled/failed request. Include engine provenance on errors only if execution reached an identified build; do not fabricate it for preflight rejections.

Proposed conservative browser limits, to be measured before adoption:

- Default 10,000 paths; maximum 100,000 per request.
- Maximum 2,520 Asian observations and **5,000,000 path-observations** per request. Apply both checks using overflow-safe arithmetic before memory allocation. At a 252-observation one-year schedule, 20,000 paths exceeds the latter limit and must fail; do not silently reduce it.
- One active computation worker per page. No pricing on every keystroke and no repeated random reruns when rendering a chart. Recompute on deliberate submission or an explicitly designed bounded interaction.
- Run compute outside the UI thread. Initially prefer a dedicated worker whose termination can cancel the synchronous unmodified engine. The current C++ API has no progress/cancellation callbacks: do not claim granular progress or promise interruption inside it.
- A 5-second elapsed worker timeout is an initial operational guard, not a promised speed target. Terminate and report cancellation with explanatory UI state; benchmark on representative slower/mobile devices before fixing defaults. A timeout has no usable partial result.
- Browser/backend implementations may advertise stricter limits, but must show them and reject rather than truncate. Do not raise these limits or add a hosted service solely to make an excessively large demo run.

Limits are proposed adapter policy, not restrictions already enforced by the native library and not claims that bounded inputs cannot trigger numerical errors. A native/offline research caller can intentionally use a different budget without silently changing the public browser contract.

## Reproducibility and reference fixtures

See [derivatives-reference.json](../examples/derivatives-reference.json): seven numerical fixtures and five proposed rejection cases, all synthetic. Native values were freshly generated against the exact revision above with AppleClang 21 on macOS. No accounts, imported holdings or market data were used.

1. Analytic European benchmark: spot/strike 100, one year, volatility 0.2, rate 0.05, dividend zero; call approximately 10.45058357 and put 5.57352602.
2. The same European case with 10,000 paths, seed 42; records observed native values separately from the analytic reference.
3. Zero-volatility European, checked independently using discounted spot minus discounted strike.
4. Zero-volatility arithmetic Asian, checked independently by a geometric-series sum of deterministic spot observations at `i/252`.
5. Zero-volatility geometric Asian, checked independently by exponentiating the mean log spot over the same schedule.
6. One-observation Asian at `T=0.006`, spot 110 and strike 100: payoff is current intrinsic value discounted at maturity. This deliberately catches accidental addition of terminal expiry to the average.
7. Seeded geometric Asian at one year, volatility 0.2, dividend 0.01, rate 0.05, 10,000 paths, seed 17. The reference is an independently derived exact geometric-Asian price using the engine's monitoring schedule, not a claimed native closed-form capability.

For fixture 7, with `n` observations:

```text
average_time = (n - 1) / (2 * 252)
variance_log_average = volatility^2 * (n - 1) * (2*n - 1) / (6*n*252)
mean_log_average = log(spot) + (rate - dividend - volatility^2/2) * average_time
d2 = (mean_log_average - log(strike)) / sqrt(variance_log_average)
d1 = d2 + sqrt(variance_log_average)
call = exp(-rate*T) * [exp(mean_log_average + variance_log_average/2)*N(d1) - strike*N(d2)]
put  = exp(-rate*T) * [strike*N(-d2) - exp(mean_log_average + variance_log_average/2)*N(-d1)]
```

Use the deterministic discounted-payoff limit when log variance is zero; the formula above divides by its square root. `N` is the standard normal CDF. This derivation sums `min(t[i], t[j])` for covariance of log observations and therefore must not be reused for a different schedule without recomputation.

Strict numerical tolerances apply to analytic/deterministic reference fixtures. Monte Carlo observations are **not bitwise golden values across all runtimes**: `std::mt19937` seeds are explicit, but `std::normal_distribution` mappings can differ across C++ standard libraries, including a future WebAssembly build. Preserve build identity; same seed guarantees only what the selected implementation can reproduce. The recorded stochastic tolerance is a finite regression smoke check against an analytic reference, not a production confidence interval or guarantee for every seed. The adapter should add multi-seed statistical validation before publication; it must not report the fixture tolerance as result uncertainty.

The rejection fixtures specify the future adapter behavior, not passing tests of an adapter that already exists. They cover expired maturity, an empty Asian observation grid, unavailable Asian closed form, workload excess, and native numeric-range failure. Future adapter tests must additionally cover malformed JSON/schema, unsupported enum combinations, fractional/overflowing integers, missing uncertainty fields, cancellation, stale request IDs, schedule boundaries and finite output validation.

## Boundary and ownership

The future interface should import a versioned adapter through this contract; it should not scrape CLI output, duplicate the pricing formulas for convenience, or add broker credentials to the engine. Independent analytic test oracles remain separate from production capabilities. Preserve original inputs and make comparisons/export portable. No persistence, telemetry or network call is required to calculate these synthetic/manual cases. The engine's source and license stay canonical in its own repository.
