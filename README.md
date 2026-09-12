# lookout

[Open lookout](https://snowball-projects.github.io/lookout/).

lookout is snowball’s finance workspace. Its six-page MVP groups Holdings,
Exposure and Allocation under Portfolio, and Markets, Derivatives and Strategies
under Research. Holdings and Exposure support local file imports and a synthetic
example; the remaining four pages are explicitly planned, without calculations.
Engine transfers and the ten approved predecessor GitHub deletions are complete;
source-labelled ideas and reproducible exercises are preserved separately.

The workspace validates a source-attributed holdings/quote bundle,
keeps missing valuations explicit, and converts fully valued holdings into the
existing Moneyprinter input contract without losing account lineage in the
separate workspace report. It performs no network calls and uses synthetic data.

```sh
python3 -m unittest discover -s tests -v
python3 scripts/prepare_workspace.py examples/holdings.json
```

The command writes a JSON result to stdout; inputs are never overwritten.
`exposure_input` is null when holdings cannot all be valued in the selected
currency. No missing price is replaced with zero or one. Moneyprinter remains
responsible for fund snapshot validation and recursive exposure calculations.

See [product decisions](docs/PRODUCT.md), [repository plan](docs/REPOSITORIES.md)
and [holdings contract](specs/holdings.md). The stdlib Python reference verifies
the data boundary; the static browser implementation is checked against it.
The public interface requires no Python runtime, server, or new service.

Integration check against an independent Moneyprinter checkout:

```sh
python3 scripts/check_exposure_adapter.py --engine-root ../finance-migration/moneyprinter
```

The holdings example adapts Moneyprinter's synthetic portfolio fixture from
`snowball-projects/moneyprinter` at `3ff3ff0` (MIT), adding synthetic accounts and
quotes. The source repository remains authoritative for exposure behavior.
Derivatives reference fixtures record their native engine and numerical oracle
provenance. Lookout's original software uses the [MIT license](LICENSE), the
owner-approved standard for snowball software. Existing engine copyright notices,
third-party licenses and data terms remain applicable.

## Web interface

```sh
npm ci
npm test
npm run dev
npm run build
```

The static interface has no frontend runtime dependencies and uses no account
service, uploads, analytics or browser persistence. Local imports accept
`lookout.workspace/1` JSON (holdings only) or `lookout.file/1` JSON containing
holdings and an attached offline exposure report. The file-size limit is 5 MB.
Malformed files leave the previous workspace intact; reload clears imported data.
Exports preserve the exact imported original. Search/account filters bound the
visible holdings table to 200 matches; narrow the filter for larger portfolios.

Browser valuation uses exact decimal arithmetic and is checked against the Python
reference. Displayed money is rounded; the imported/exported values are unchanged.
Exposure is calculated by the independent Moneyprinter engine, not reimplemented
in the browser. Prepare a combined file locally:

```sh
python3 scripts/create_report.py holdings.json --engine-root ../moneyprinter > report.json
```

The command leaves its input unchanged, makes no network requests and records the
engine revision and a SHA-256 association with the normalized exposure input. The
viewer rejects mismatched inputs and inconsistent totals/paths. These checks do
not authenticate the report author or prove that the engine produced an arbitrary
imported report; the interface labels it as an imported calculation.

`web/example.json` is generated from `examples/holdings.json` with the independently
maintained engine. Regenerate it using the command above with the synthetic input
when its engine reference changes. Switching among the six pages preserves the
loaded workspace. Planned pages are accessible without loading portfolio data.

## Hosting and operation

The public dashboard is deployed to GitHub Pages by `.github/workflows/pages.yml`
from branch `main`, after tests and a static build to `dist/`. No server process,
credentials, database or paid compute instance is required. The former Render
blueprint is removed because the owner chose static Pages hosting for this launch.
Only browser assets and the MIT license enter `dist/`; source documentation,
local files and historical data are not deployment assets. GitHub remains the
canonical source. `.openai/hosting.json` retains the earlier private Sites preview
identity; it is not the public production deployment configuration.

GitHub Pages serves the static files and processes hosting request metadata under its
own policies. Imported file contents remain in browser memory and are not sent
to the host. Static hosting is subject to the provider's bandwidth/build limits;
no zero-cost-at-any-usage or zero-host-logging claim is made. See GitHub's
[Pages documentation](https://docs.github.com/en/pages).

To revive or move the app, check out a release, run the checks above, and serve
`dist/` on any HTTPS static host. Hash routes require no server rewrites. The
local preview binds only to 127.0.0.1. Roll back by deploying a previously checked
release. There are no scheduled updates, live data feeds or migration jobs.

An optional WebMCP action switches between Holdings and Exposure without
returning portfolio contents. Its unit contract is checked; live browser
registry integration has not been verified.

[Operations](https://snowball-projects.github.io/operations/#lookout)
