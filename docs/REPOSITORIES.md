# Repository organization and migration

Owner-approved product name and destination: **lookout**, `snowball-projects/lookout`.
One finance website with Portfolio (Holdings, Exposure, Allocation) and Research
(Markets, Derivatives, Strategies). The owner approved the repository destinations,
single lookout catalog entry and import/local/offline operating model. Both engine
transfers are complete. Final prototype deletions remain pending.

## Four maintained repositories

| Repository | Responsibility | Status |
| --- | --- | --- |
| `snowball-projects/lookout` | Website routes/components, shared input/report contracts, import normalization, UI integration tests, optional local import helpers | New canonical product repository. One version/deployment for the website. Current work is the executable data foundation, not the six finished pages. |
| `snowball-projects/moneyprinter` | Offline fund look-through engine, trace/coverage/overlap, CLI and exports | Keep name, history and package. No transfer required. Lookout is a consumer, not the engine's replacement. |
| `snowball-projects/option-pricing-engine` | Reusable C++ models, numerical tests and native CLI | Transferred and renamed from `adelevski/OptionPricingEngine`. Public visibility, history, tags and releases preserved; existing C++ names retained. |
| `snowball-projects/marketbro` | Offline historical research, bar/result contracts, deterministic policy stages | Transferred from `adelevski/marketbro`. Private visibility, history, releases and PRs preserved. Website integration initially consumes suitable reports; personal execution remains outside lookout. |

Four is a responsibility boundary, not a permanent quota. Import helpers start in
lookout rather than become a fifth repository. Split them only if they acquire
independent consumers or operational needs. Keep legacy credentials and raw
provider exports out of the new source history.

## Pages are routes, engines are libraries

All six pages share navigation, theme, accessibility, instruments, currency/date
conventions, import/export and scenario state. A repo per page would multiply
releases and make shared changes unnecessarily difficult. Use internal modules
and tests to separate page concerns.

This is not initially a frontend/backend deployment split. No always-running
backend is required to use imported data and offline calculation reports.
Moneyprinter, OptionPricingEngine and marketbro remain calculation/research
components; retaining their repositories does not create three services.

The eventual website can host a static interface. Lightweight browser-side
calculation, a bounded C++ browser build, and offline-generated reports must be
chosen per actual computation and verified against native reference fixtures.
We have not yet chosen a frontend framework, promised all engines can run in a
browser, or introduced a hosted account aggregation service.

Each engine retains its own version, tests, license, source documentation and
release process. Lookout pins the versions/contracts it integrates and tests the
boundary with synthetic fixtures. One UI deployment need not release all engines.
The public pages link to canonical engine docs rather than duplicate them.

## How the six pages map to the repositories

Every page and its interface live in lookout. Engine ownership below describes
reusable computation, not a separate website or service per page.

| Page | Computation and retained ideas | Current implementation boundary |
| --- | --- | --- |
| Holdings | Lookout owns account imports, instrument identity, shared dated quotes, valuation and account totals. Crypto-Portfolio-Tracker and tinytrack supply adapter and wallet ideas. | Synthetic account-aware valuation is tested. Exchange/RPC adapters and the UI are not built. Moneyprinter is not a holdings collector or ledger. |
| Exposure | Moneyprinter owns recursive fund look-through, overlap, unresolved coverage and contribution paths; lookout supplies valued positions and displays results. | The synthetic adapter is verified against Moneyprinter. Real fund-data acquisition and the page remain to be built. |
| Allocation | A tested internal lookout module will own weights, objectives/frontier, constraints, historical risk and covariance diagnostics. PortfolioOptimizer, convex_optimization and ML-for-Asset-Managers supply exercises. Moneyprinter can later describe a proposed allocation's exposure. | No allocation solver is implemented in lookout or supplied by the three retained engines. Reimplement and validate this capability; separate it into a library only if independent use warrants that. |
| Markets | Lookout owns dated instrument charts, history/volume, watchlists and explicit screening conditions. finance_dashboards and TradingDashboard supply interactions. Suitable marketbro bar/report contracts may be reused. | No market page, validated indicator module or shared public feed exists yet. Do not force chart rendering or generic screeners into marketbro. |
| Derivatives | OptionPricingEngine owns its native European/Asian models. Lookout owns inputs, visualizations and the integration boundary. OptionPricer supplies an independent QuantLib reference; historical PortfolioOptimizer exercises add future sensitivities/trees. | Native reference examples and a proposed contract exist; no browser pricing adapter, smile UI, Greeks or implied-volatility solver is claimed. Add reusable model algorithms to the engine when implemented. |
| Strategies | Marketbro owns historical research and explainable result generation; lookout presents portable reports and comparisons. QuantConnect supplies the nine exercise ideas. | Nonfinite-price rejection and signal date-cutoff fixes are merged. Calendar-aligned holdouts, batch-state accounting and complete replay provenance still need work. No hosted broker, live execution or validated strategy catalogue is delivered. |

The three engines cover specific existing strengths, not every calculation the
website needs. Holdings, Allocation and Markets therefore require new modules;
keeping the website together does not mean those modules go untested or get mixed
into view code. Shared input contracts connect pages without conflating real
holdings, hypothetical allocations and historical research.

See [preservation status](PRESERVATION.md) for what the review saved and what is
still required before retirement. The owner confirmed MIT for original lookout
software and snowball-owned code; third-party code/data retain their terms.

## Repository retirement candidates

These are deletions to confirm after the applicable preservation gates pass.
Nothing in this document deletes or archives a repository automatically.

| Personal repository | What must be preserved/verified first | Proposed final disposition |
| --- | --- | --- |
| `Crypto-Portfolio-Tracker` | Source-labelled notes; account/common-quote behavior and regression fixtures; any selected adapter transferred with provenance | Delete once successor adapter/import behavior is verified |
| `tinytrack` | Native-ETH adapter lesson and working normalized equivalent; retain per-account behavior from the broken refactor | Delete once the useful wallet/account behavior is preserved |
| `PortfolioOptimizer` | Objective/frontier and owned-universe behavior; historical risk/options exercises; corrected solver/unit tests in successor | Delete after required behavior is reproduced; keep deferred exercises in notes |
| `finance_dashboards` | Chosen chart/screener interactions, indicator definitions and tests; tutorial/data provenance | Delete after extraction; do not migrate credential history or the order endpoint |
| `TradingDashboard` | Price/expiry/volatility-smile interaction and provider-contract tests | Delete after it is represented in lookout or a reproducible retained exercise |
| `OptionPricer` | QuantLib reference fixture with explicit dates/calendar/day count and provenance | Delete once independent reference reproduction is retained |
| `QuantConnect` | All nine corrected exercise descriptions; selected replay fixtures; platform/teaching provenance | Delete after extraction, without requiring implementation of every strategy or copying the tweet corpus |
| `ML-for-Asset-Managers` | Book citation and reproducible seeded covariance-noise exercise specification | Delete after extraction; reuse only material with appropriate rights |
| `TradingEngineServer` | Background-worker lifecycle lesson; no useful trading implementation exists | Delete after owner confirms the source-labelled note is sufficient |
| `moneyprinter` (personal historical repository) | Reconcile dirty Mac source/data work; decide separately what personal records to retain privately; successor exposure verified | **Defer.** Keep private until that reconciliation/retention decision; then delete or privately archive as chosen |

`OptionPricingEngine` and `marketbro` were **transferred, not copied or deleted**.
Their repository IDs, advertised refs, release/asset IDs and PR identities matched
before and after transfer; the old API paths resolve to the new repositories.
Do not subsequently delete a transferred engine as though it were an obsolete
copy. The Moneyprinter overlap and marketbro input fixes are now merged on main.

The existing `snowball-projects/moneyprinter` stays. Earlier deletions of
convex_optimization and CppDerivativesDesignPatterns are already documented in the
source-attributed writing draft and are not new migration actions.

## Migration gates

1. Inventory exact heads, branches/tags, local work and relevant source/data rights.
   The review reports are a dated snapshot; refresh before destructive actions.
2. Define versioned contracts and synthetic examples. Distinguish implemented
   behavior from proposed exercises, and retain per-source attribution.
3. Correct selected engine issues in reviewable branches. Run engine checks and
   integration fixtures before relying on the changed result in lookout.
4. Confirm target names/transfers; transfer complete engine histories. Update
   remotes, URLs, badges, CI/deployment references and release links, then verify.
5. Publish the website only after usable flows, input/privacy boundaries,
   accessibility, calculation budgets, licenses and data-source terms are clear.
6. Confirm the final per-repo retirement list with the owner. Check no unmerged or
   local-only work would be lost, preserve the selected ideas/implementation, then
   delete/archive only the approved repository. Do not delete branches simply
   because their default branch looks empty.

No need to merge unrelated Git histories into lookout. Port selected code with
attribution and tests, use engines through contracts, and keep personal history
separate. Keep deferred ideas in the writing draft rather than carry dead code
into the new product just to say it was preserved.
