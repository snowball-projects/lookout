# Preservation status before repository retirement

Completed September 10, 2026. After reviewing the preserved notes, the owner
approved deletion of the ten personal GitHub repositories below. Each deletion
succeeded and was verified absent through GitHub. The four canonical snowball
repositories remain. Local cleanup was separately authorized and completed on
September 11, 2026: retained historical source moved to private preservation
archives, and superseded checkout folders were removed after verification.

The review covered current functional source and documentation, reachable history
topology and material removed features. The final pre-deletion remote check found no change
to any of the ten recorded heads below, one branch each, no advertised tags and
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
| `adelevski/moneyprinter` `5c4cc94` | One-level exposure/provider normalization lessons and input/output schema design are recorded privately. Source/layout changes have been reconciled. | Recursive exposure uses the independent snowball engine. The historical GitHub repository was deleted. A code-only extraction and source-version index are retained; old personal financial values and Git databases were intentionally discarded during the later authorized cleanup. |

## Local work and deletion gate

Known local source checkouts were reviewed for uncommitted, untracked and
unmerged work. The private migration record contains exact paths, refs and any
owner-approved data-disposal decisions. No additional calculation was discovered
in the reconciled local changes. Do not copy private financial records or their
history into lookout or the independent history-free snowball engine.

The final source-labelled draft and reproduction checkpoints were committed,
pushed and verified in the independent private writing repository on September
10, 2026. At that retirement gate, the notes did not claim a source-history or
account-value archive. The later local cleanup preserved other historical source
and Git directories in private archives, with personal moneyprinter limited to
the code-only extraction described above. The private archive index records the
exact retained contents and restore procedure. The owner reviewed and accepted
the preservation notes before approving the
exact ten deletions. Remote identities, heads and absence of open work were
rechecked immediately before deletion. The private migration record retains the
verification results.

Preserving a deferred exercise does not require rebuilding the abandoned app.
Likewise, adding a planned page does not establish a completed implementation.
