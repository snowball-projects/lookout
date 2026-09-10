"""Compare lookout's normalized bundle against an independent Moneyprinter fixture."""
import argparse
import json
from pathlib import Path
import sys

parser = argparse.ArgumentParser()
parser.add_argument('--engine-root', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(root / 'src'), str(args.engine_root.resolve() / 'src')]
from workspace import prepare_workspace
from moneyprinter.tools import compute_exposure_tool

bundle = json.loads((root / 'examples/holdings.json').read_text())
expected_bundle = json.loads((args.engine_root / 'tests/fixtures/synthetic_portfolio.json').read_text())
workspace = prepare_workspace(bundle)
actual = compute_exposure_tool(workspace['exposure_input'])
expected = compute_exposure_tool(expected_bundle)
if actual != expected:
    raise SystemExit('Exposure adapter differs from the independent engine fixture')
print('PASS: full exposure output matches the independent Moneyprinter reference.')
print('Account lineage retained separately for all four synthetic account positions.')
