# lookout

Implementation groundwork for lookout, snowball’s finance workspace.
This is not the published website or a production portfolio service. The product name and target `snowball-projects/lookout` are owner-approved;
engine transfers and prototype retirement remain pending.

The first executable slice validates a source-attributed holdings/quote bundle,
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

See [repository plan](docs/REPOSITORIES.md)
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
provenance. New lookout source licensing will be resolved before public release;
existing engine and third-party licenses are unchanged.
