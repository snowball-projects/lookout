# Holdings and valuation contract — lookout.workspace/1

This is the implemented first slice. It is a snapshot valuation contract, not
transaction accounting, a historical return series or a point-in-time backtest
input. UTC dates are used for cross-provider comparison; retrieval dates may
postdate the day represented by an imported historical snapshot.

The root JSON object contains exactly:

- `schema_version`: `lookout.workspace/1`;
- `valuation_as_of`: valid ISO `YYYY-MM-DD`;
- `currency`: one three-letter uppercase code; no inferred FX;
- `accounts`: unique `{id, label}` records;
- `instruments`: unique `{id, label, kind}` records;
- `holdings`: `{account_id, instrument_id, quantity, as_of, source}`;
- `quotes`: `{instrument_id, currency, price, as_of, source}`;
- `snapshots`: Moneyprinter v1 fund snapshots, passed to its validator unchanged.

IDs use lowercase schemes and case-sensitive values, e.g. `account:brokerage`,
`figi:BBG...`, or `ticker:EXAMPLE`. The adapter never guesses ticker equivalence.
Kinds are `security`, `fund`, `cash`, `derivative`, `unknown`. Holdings must
reference declared accounts/instruments; one account/instrument row represents
its aggregate quantity, not a lot. Explicitly normalize lots before import.
There is exactly one selected quote per instrument, in the bundle's currency.
Missing quotes are allowed and remain unknown, including cash without a quote.

Quantities/prices are nonnegative decimal strings with at most 28 digits and 18
fractional places. No numbers, exponents, short positions or implicit rounding.
Arithmetic uses a bounded high-precision Decimal context. Product/sum precision
is checked before emitting Moneyprinter's 28-digit/eight-place market values;
unrepresentable values block that adapter instead of silently rounding them.

Holding/quote timestamps include seconds and `Z` or an explicit `±HH:MM` offset.
Their UTC dates cannot exceed the valuation day. Every source contains exactly
`name`, `reference`, `retrieved_at`. Retrieval cannot predate its observation.
References are inert text, never URLs automatically fetched by this layer.
Original observation/quote/source timestamps remain in the result; this version
does not choose a universal staleness threshold or claim point-in-time
availability for backtests.

The validator rejects missing/unknown fields, duplicates, dangling references,
invalid dates/decimals and currency mismatches. Top-level record lists contain
at most 10,000 rows each; the CLI bounds files to 5 MB. Moneyprinter validates
snapshot contents and its own traversal/output budgets at the next boundary.
`prepare_workspace` alone does not claim to validate all snapshot fields.

## Output and the exposure boundary

`lookout.workspace-result/1` contains account-attributed holdings, each with
`market_value` or null, selected quote/source details and `valuation_status`.
`known_market_value` and `account_known_values` describe only priced holdings;
`valuation_complete` and `unpriced` make partial coverage explicit. A zero quote
is a known zero valuation; an absent quote is unknown. Even an unquoted zero
quantity conservatively remains missing rather than silently treating a missing
source as known.

`exposure_input` is null for empty, partly unpriced or excessive-precision
portfolios, with explicit `exposure_blockers`. Otherwise it is a Moneyprinter v1
input whose positions aggregate identical instruments across accounts. Account
lineage remains in the separate workspace result and is not misrepresented as
native Moneyprinter account support. No partial portfolio is silently sent as a
complete fund exposure analysis. The independent engine computes and validates
fund expansion, residuals, overlap and source coverage.

The output never aliases the caller's mutable input. Computation is deterministic;
source record order has no financial meaning. It does not store data, fetch
prices, connect accounts, execute trades or write over inputs.

## Future page contracts

- Holdings uses this contract directly.
- Exposure consumes the engine's own versioned result alongside this lineage.
- Allocation needs a distinct dated returns/scenario contract; do not infer one
  from a single holdings snapshot.
- Markets needs venue/instrument/interval/adjustment-aware OHLCV and quote inputs.
- Derivatives has a separate [proposed contract](derivatives.md) and verified
  native reference fixtures; its browser adapter is not implemented yet.
- Strategies needs immutable bars, availability timestamps, costs, config and
  evaluation/result metadata. Import existing artifacts before inventing a new
  account/execution service.
