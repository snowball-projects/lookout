# Preservation status before repository retirement

Assessment: September 9–10, 2026. No retirement is approved by this document.
The owner asked to verify preservation before deciding on deletion.

The review covered current functional source and documentation, reachable
history topology and material removed features. It did not execute every
historical revision or recover unreachable/deleted refs. The source-labelled
project-ideas draft and detailed private review reports preserve the useful
ideas found. This is not a claim that every former capability is implemented in
lookout, or that every source checkout can already be deleted safely.

## What each candidate contributes

| Repository and reviewed head | Preserved contribution and destination | Remaining preservation work |
| --- | --- | --- |
| `adelevski/Crypto-Portfolio-Tracker` `44422be` | Holdings: common quotes across accounts, manual holdings, account and aggregate totals, refresh/freeze semantics; missing-price and symbol-mapping lessons. | Lookout tests normalized valuation/account lineage, but selected exchange/import adapters and refresh behavior need fixtures or a deliberate deferral. No transaction ledger, cost basis or performance history existed to migrate. |
| `adelevski/tinytrack` `abefb34` | Holdings: exchange and native-ETH JSON-RPC sources through one account-preserving adapter; wei conversion; broken aggregation refactor and its working parent identified. | Preserve a tested normalized exchange/RPC example if implementing the adapter. Native ETH is not ERC-20/multichain tracking. Current lookout fixtures do not test RPC conversion. |
| `adelevski/PortfolioOptimizer` `c219fd0`; historical `2ed7180` | Allocation: owned-universe bridge, min-risk/max-return/max-Sharpe objectives, frontier, horizon sensitivity. Allocation/Derivatives: historical VaR/tail loss, Greeks, implied volatility, CRR/JR convergence and GBM discretization. | No new allocation module exists. Keep reproducible specifications and chosen reference checks; correct failed-solver handling, time units, terminal nodes and ignored quantiles instead of copying faulty helpers. |
| `adelevski/finance_dashboards` `c0771d1` | Markets: OHLCV/volume, 61 pattern labels, range/breakout and squeeze conditions, historical/live identity, feed lifecycle; removed RSI/price-volume examples. | Retain precise chosen indicator definitions and gap/short-history fixtures. Defer unneeded streaming explicitly. Do not carry credential history, dead snapshot routes or the market-order endpoint into lookout. |
| `adelevski/TradingDashboard` `8ed54f1` | Markets/Derivatives: instrument/history period and expiry selection, call/put implied-volatility curves across strikes; data-age and provider-shape lessons. | Keep a synthetic chain/chart example and contract checks or a self-contained deferred exercise. No new smile UI or options-chain adapter exists. |
| `adelevski/OptionPricer` `99794e9` | Derivatives: independent QuantLib composition and calendar/day-count reference. Draft records dates 2020-01-01 to 2021-01-05, TARGET/Business252, spot=strike=100, r=5%, sigma=20%, q=0, call/put about 10.45058/5.57353. | Independent review reproduction passed. Preserve the dated recipe and oracle provenance durably; native engine fixtures alone do not exercise QuantLib calendar behavior. No second pricing engine is needed. |
| `adelevski/QuantConnect` `f4f460d` | Strategies: all nine exercises—threshold/cooldown, limit/trailing stop, rolling trend/extremes, intraday reversion, small-cap universe/rebalance, stock/bond regimes, FX reversion, options breakout, offline NLP scoring followed by timestamped replay. | Detailed parameters, source paths and defects are recorded. Keep selected event/replay fixtures and teaching provenance; remaining exercises may stay explicitly deferred. Do not copy the tweet corpus or claim historical profitability. |
| `adelevski/ML-for-Asset-Managers` `8cc37ec` | Allocation diagnostics: seeded correlation eigenvalues versus Marchenko–Pastur noise spectrum, sample/asset ratio and estimation stability. Book provenance is recorded. | Keep bounded mathematical recipe and q=1/singular-domain checks. Shrinkage/denoising are proposed extensions, not recovered implementations. Reimplement original code rather than relicense copied book material. |
| `adelevski/TradingEngineServer` `1592804` | General engineering note: one shared configured background worker, logging, bounded awaited work and cooperative cancellation. | The existing source-labelled exercise is sufficient in substance; there was no trading calculation or server implementation to port. Still apply final local-work/provenance/preservation checks before deletion. |

“Remaining” need not mean rebuilding every abandoned experiment before deleting a
prototype. For each item, retain tested behavior when it is being adopted, or a
self-contained reproducible specification when it is intentionally deferred.
Record that distinction explicitly. Do not retain dead code just to count it as
migrated, and do not mistake a link to a soon-to-be-deleted repository for a
durable extraction.

## Final deletion check

Before any specific deletion, refresh remote refs and inspect applicable local
checkouts for unpushed or untracked work. Ensure the source-labelled notes,
reference fixtures, source attribution and any intentionally retained original
material are in durable, verified storage outside that repository. Temporary
review clones and uncommitted drafts alone are not sufficient. Recheck selected
behavior against its preservation record, then obtain the owner's explicit final
decision. No blanket “safe to delete all nine now” conclusion has been reached.

The private personal `adelevski/moneyprinter` has an additional local recovery
snapshot and historical portfolio/provider files. Its reconciliation is recorded
privately, separate from the history-free snowball engine. Do not import that
history or private data into lookout.
