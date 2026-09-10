# lookout

lookout is snowball’s finance workspace. The first web interface covers Holdings
and Exposure, with local file imports and a synthetic example.
This is a private development preview, not the completed six-page dashboard or
a production portfolio service. The product
name, six-page grouping, repository destinations and initial operating model are
owner-approved. Both engine transfers are complete; prototype retirement remains
pending.

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
and [holdings contract](specs/holdings.md). This reference implementation is
stdlib Python to verify the data boundary before choosing a browser adapter.
It does not commit the frontend to Python, a server, or a new service.

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
when its engine reference changes. Allocation, Markets, Derivatives and Strategies
remain planned; there are no empty public tabs for them.

## Preview hosting

`.openai/hosting.json` configures a private static Sites preview. GitHub remains
the canonical source; Sites receives a deployment copy. Only `web/` is copied to
`dist/` and published, so source documentation and local files are not web assets.
The local preview binds only to 127.0.0.1. A later public catalog entry requires a
verified usable public destination.

An optional WebMCP action switches between the same two portfolio views without
returning portfolio contents. Its unit contract is checked; no browser with a
supported live WebMCP context was available for end-to-end registry validation.
