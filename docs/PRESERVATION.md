# Preservation status before repository retirement

Assessment: September 10, 2026. No repository is deleted or approved for deletion
by this document. The owner requires final repository-specific confirmation.

The review covered current functional source and documentation, reachable history
topology and material removed features. The latest remote check found no change
to any of the ten candidate heads below, one branch each, no advertised tags and
no open PRs or issues. It did not execute every historical revision, inspect the
Windows machine or recover unreachable/deleted refs.

## Preserved contributions

The private, source-labelled project-ideas draft preserves the following ideas
and reproducible exercises. The September 10 completion pass adds synthetic
examples and exact calculation/data conventions where the previous notes were
too general. These are specifications for intentionally deferred work, not a
claim that the corresponding lookout page is implemented.

| Repository and reviewed head | Preserved contribution | Initial MVP disposition |
| --- | --- | --- |
| `adelevski/Crypto-Portfolio-Tracker` `44422be` | Common quotes, per-account/manual holdings, totals, refresh/freeze and missing-price behavior; synthetic account valuation example. | Holdings valuation implemented; provider ingestion/refresh deferred. No ledger or performance history existed to migrate. |
| `adelevski/tinytrack` `abefb34` | Native ETH JSON-RPC and exchange adapter normalization, exact wei conversion and account lineage; broken refactor and working parent identified. | Provider/RPC adapters deliberately deferred. This is not ERC-20 or multichain tracking. |
| `adelevski/PortfolioOptimizer` `c219fd0`; historical `2ed7180` | Objectives/frontier/owned-universe bridge, exact constraints and infeasibility checks; historical Greeks, IV inversion, CRR/JR convergence, GBM and tail-risk exercises. | Reproducible specifications retained; allocation/risk/pricing extensions deferred. Faulty numerical helpers are not carried forward. |
| `adelevski/finance_dashboards` `c0771d1` | OHLCV/pattern screens, compression/breakout predicate, explicit Bollinger/Keltner-like definitions, gap/short-history fixtures, venue identity/feed lifecycle. | Calculations and optional streaming deferred. Credential history, dead endpoints and market orders are excluded. |
| `adelevski/TradingDashboard` `8ed54f1` | Instrument/history/expiry selection and call/put IV curves; synthetic chain contract, quote age, units and coverage. | Self-contained chart/input exercise retained; chain adapter and smile UI deferred. |
| `adelevski/OptionPricer` `99794e9` | Independent QuantLib composition and numerical oracle: dates 2020-01-01→2021-01-05, spot=strike=100, r=5%, sigma=20%, q=0, call/put ≈10.45058/5.57353. | Reference recipe independently reproduced. `Business252()` uses its default Brazil day-count calendar; TARGET is passed separately to BlackConstantVol. Explicit TARGET day counting changes maturity. No second engine is needed. |
| `adelevski/QuantConnect` `f4f460d` | All nine parameterized strategy/event exercises, offline NLP→timestamped replay, synthetic lifecycle/availability/expiry checks and teaching provenance limits. | Intentionally deferred catalogue. No profitability claim, corpus copying or hosted LEAN/NLP runtime. |
| `adelevski/ML-for-Asset-Managers` `8cc37ec` | Seeded bounded correlation-eigenvalue experiment, Marchenko–Pastur support/density and singular-domain checks; book attribution. | Allocation diagnostic deferred; denoising/prediction were not implemented. Reimplement ideas rather than copy book code. |
| `adelevski/TradingEngineServer` `1592804` | One configured shared worker, bounded awaited jobs and cooperative cancellation; no busy loop or duplicated service instance. | General engineering exercise retained. There was no trading algorithm/server to migrate. |
| Personal Moneyprinter predecessor | One-level exposure/provider normalization lessons and input/output schema design are recorded privately. Source/layout changes have been reconciled. | Recursive exposure uses the independent snowball engine. Private retention choices and the final deletion decision remain in the private migration record. |

## Local work and deletion gate

Known local source checkouts were reviewed for uncommitted, untracked and
unmerged work. The private migration record contains exact paths, refs and any
owner-approved data-disposal decisions. No additional calculation was discovered
in the reconciled local changes. Do not copy private financial records or their
history into lookout or the independent history-free snowball engine.

The final source-labelled draft and reproduction checkpoints were committed,
pushed and verified in the independent private writing repository on September
10, 2026. No original source history or historical account values are claimed
to be archived. The owner is reviewing those notes before deciding on deletion.

Before deleting any exact repository:

1. Keep that verified preservation record outside the retiring repositories.
2. Refresh refs and relevant local state once more; review any intervening work.
3. Obtain the owner's final repository-specific decision. Distinguish GitHub
   deletion from separately deleting local checkouts.

Preserving a deferred exercise does not require rebuilding the abandoned app.
Likewise, adding a planned page does not establish a completed implementation.
