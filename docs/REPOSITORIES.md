# Repository organization and migration

Owner-approved product name and destination: **lookout**, `snowball-projects/lookout`.
One finance website with Portfolio (Holdings, Exposure, Allocation) and Research
(Markets, Derivatives, Strategies). The grouping is approved; the transfers,
engine renames and final deletions below are proposed, not completed.

## Four maintained repositories

| Repository | Responsibility | Proposed action |
| --- | --- | --- |
| `snowball-projects/lookout` | Website routes/components, shared input/report contracts, import normalization, UI integration tests, optional local import helpers | New canonical product repository. One version/deployment for the website. Current work is the executable data foundation, not the six finished pages. |
| `snowball-projects/moneyprinter` | Offline fund look-through engine, trace/coverage/overlap, CLI and exports | Keep name, history and package. No transfer required. Lookout is a consumer, not the engine's replacement. |
| `snowball-projects/option-pricing-engine` | Reusable C++ models, numerical tests and native CLI | Proposed transfer of `adelevski/OptionPricingEngine`, plus repository-only lowercase rename. Preserve history/tags; don't rewrite C++ names merely to match the URL. |
| `snowball-projects/marketbro` | Offline historical research, bar/result contracts, deterministic policy stages | Proposed transfer of `adelevski/marketbro` with its name/history intact. Public website integration initially consumes suitable results; personal governance and live-block remain. |

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

`OptionPricingEngine` and `marketbro` are **transfer candidates, not deletion
candidates**. A GitHub transfer/rename preserves the repository and its history;
do not subsequently delete the transferred engine under the impression it is an
obsolete copy. Existing personal URLs should be verified after transfer.

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
