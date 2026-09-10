# Repository organization and migration

Owner-approved product name and destination: **lookout**, `snowball-projects/lookout`.
One finance website with Portfolio (Holdings, Exposure, Allocation) and Research
(Markets, Derivatives, Strategies). The owner approved the repository destinations,
single lookout catalog entry and import/local/offline operating model. Both engine
transfers are complete. Final prototype deletions remain pending.

## Four maintained repositories

| Repository                                | Responsibility                                                                                                                      | Status                                                                                                                                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `snowball-projects/lookout`               | Website routes/components, shared input/report contracts, import normalization, UI integration tests, optional local import helpers | New canonical product repository. One version/deployment for the website. The MVP includes six routes: working Holdings/Exposure and four clearly labelled planned pages.                   |
| `snowball-projects/moneyprinter`          | Offline fund look-through engine, trace/coverage/overlap, CLI and exports                                                           | Keep name, history and package. No transfer required. Lookout is a consumer, not the engine's replacement.                                                                                            |
| `snowball-projects/option-pricing-engine` | Reusable C++ models, numerical tests and native CLI                                                                                 | Transferred and renamed from `adelevski/OptionPricingEngine`. Public visibility, history, tags and releases preserved; existing C++ names retained.                                                   |
| `snowball-projects/marketbro`             | Offline historical research, bar/result contracts, deterministic policy stages                                                      | Transferred from `adelevski/marketbro`. Private visibility, history, releases and PRs preserved. Website integration initially consumes suitable reports; personal execution remains outside lookout. |

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
The interface uses browser-native HTML, CSS and JavaScript. It does not promise
that all engines can run in a browser or introduce a hosted account aggregation
service.

Each engine retains its own version, tests, license, source documentation and
release process. Lookout pins the versions/contracts it integrates and tests the
boundary with synthetic fixtures. One UI deployment need not release all engines.
The public pages link to canonical engine docs rather than duplicate them.

## How the six pages map to the repositories

Every page and its interface live in lookout. Engine ownership below describes
reusable computation, not a separate website or service per page.

| Page        | Computation and retained ideas                                                                                                                                                                                                                                                         | Current implementation boundary                                                                                                                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Holdings    | Lookout owns account imports, instrument identity, shared dated quotes, valuation and account totals. Crypto-Portfolio-Tracker and tinytrack supply adapter and wallet ideas.                                                                                                          | Local JSON imports, exact browser valuation, filtering, account breakdowns, source inspection and original-file exports are implemented. Exchange/RPC adapters remain deferred. Moneyprinter is not a holdings collector or ledger.                            |
| Exposure    | Moneyprinter owns recursive fund look-through, overlap, unresolved coverage and contribution paths; lookout supplies valued positions and displays results.                                                                                                                            | The adapter is verified against Moneyprinter. The interface checks and displays attached offline reports, including contribution paths, unresolved value and snapshot age. Live calculation in the browser and real fund-data acquisition are not implemented. |
| Allocation  | A tested internal lookout module will own weights, objectives/frontier, constraints, historical risk and covariance diagnostics. PortfolioOptimizer, convex_optimization and ML-for-Asset-Managers supply exercises. Moneyprinter can later describe a proposed allocation's exposure. | No allocation solver is implemented in lookout or supplied by the three retained engines. Reimplement and validate this capability; separate it into a library only if independent use warrants that.                                                          |
| Markets     | Lookout owns dated instrument charts, history/volume, watchlists and explicit screening conditions. finance_dashboards and TradingDashboard supply interactions. Suitable marketbro bar/report contracts may be reused.                                                                | No market page, validated indicator module or shared public feed exists yet. Do not force chart rendering or generic screeners into marketbro.                                                                                                                 |
| Derivatives | OptionPricingEngine owns its native European/Asian models. Lookout owns inputs, visualizations and the integration boundary. OptionPricer supplies an independent QuantLib reference; historical PortfolioOptimizer exercises add future sensitivities/trees.                          | Native reference examples and a proposed contract exist; no browser pricing adapter, smile UI, Greeks or implied-volatility solver is claimed. Add reusable model algorithms to the engine when implemented.                                                   |
| Strategies  | Marketbro owns historical research and explainable result generation; lookout presents portable reports and comparisons. QuantConnect supplies the nine exercise ideas.                                                                                                                | Nonfinite-price rejection and signal date-cutoff fixes are merged. Calendar-aligned holdouts, batch-state accounting and complete replay provenance still need work. No hosted broker, live execution or validated strategy catalogue is delivered.            |

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

The nine prototypes and their source-specific preservation results are listed in
[PRESERVATION.md](PRESERVATION.md). Their useful ideas are retained as working
behavior where adopted and self-contained reproducible exercises where deferred;
retirement does not require implementing all four planned pages first.

The personal historical Moneyprinter is a tenth candidate. Source/layout
reconciliation is complete. The owner chose schema/workflow retention without
keeping outdated snapshot values or creating a new recovery archive. The private
migration record holds the details. Final confirmation must name exact GitHub
repositories and distinguish any separately proposed local file deletion.

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
