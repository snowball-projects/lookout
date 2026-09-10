# lookout working agreements

lookout is snowball's finance workspace, owned by its founder Nas Delevski.
Use lowercase `lookout` and `snowball`. Keep the website's six routes together;
retain independently useful engines as canonical projects. Read README.md,
specs/holdings.md, docs/PRODUCT.md and docs/REPOSITORIES.md before changing
contracts, product behavior or migration.
Read snowball's current principles before public/data/architecture decisions.

This checkout currently contains an offline data foundation, not a completed or
deployed website. Do not imply that example values are real quotes, account data,
validated forecasts or investment recommendations. Use only synthetic fixtures.
Never add credentials, private holdings, telemetry or live execution by default.
The initial product uses user-controlled imports, synthetic examples and
local/offline calculations. Defer automatic account connections and shared live
feeds. Lookout is the sole finance catalog card approved for snowball's website;
link independently maintained engines through documentation and relevant views.

Missing prices remain unknown. Preserve account/source/timestamp lineage,
original inputs, exact decimal values, explicit currency/time/model conventions
and unresolved exposure. Validate incoming data before computation. Do not round
or drop an unsupported value merely to satisfy a downstream engine contract.

Moneyprinter owns recursive exposure calculations and its contract. Lookout's
adapter must be checked against its tested outputs rather than duplicating that
engine. Derivatives reference fixtures distinguish deterministic numeric checks
from runtime-dependent Monte Carlo observations. Specs marked proposed are not
claims that browser adapters exist.

Run `python3 -m unittest discover -s tests -v`; check the CLI on the synthetic
fixture. Run the independent engine when changing its boundary. No additional
runtime dependencies are needed for the current slice. Keep source reports and
future UI labels explicit about partial data and skipped checks.

Repository transfers, public deployment and retirement must follow the owner
review and gates in docs/REPOSITORIES.md. Do not delete the historical personal
Moneyprinter repo or local data during routine consolidation. Keep source and
data licenses distinct. The owner confirmed MIT as the canonical license for
snowball-owned software; keep LICENSE, metadata and current documentation aligned.
Preserve third-party licenses and copyright notices. Do not relicense datasets
or book-derived code merely because they appear in a source repository.
