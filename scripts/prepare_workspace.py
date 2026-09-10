"""Read a local bundle and emit the prepared workspace; never fetch or write inputs."""
import json
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from workspace import ContractError, prepare_workspace

def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ContractError(f"Duplicate JSON field: {key}")
        result[key] = value
    return result


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/prepare_workspace.py INPUT.json")
    try:
        path = Path(sys.argv[1])
        if path.stat().st_size > 5_000_000:
            raise ContractError("Input exceeds 5 MB limit")
        result = prepare_workspace(json.loads(path.read_text(), object_pairs_hook=unique_object))
    except (OSError, ValueError) as error:
        print(f"Unable to prepare workspace: {error}", file=sys.stderr)
        raise SystemExit(1)
    print(json.dumps(result, indent=2))
