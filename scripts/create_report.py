"""Prepare a local portfolio/report file without transmitting or modifying inputs."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'src'))
from workspace import prepare_workspace


def unique(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('Duplicate JSON field: ' + key)
        result[key] = value
    return result


def create_report(bundle, engine_root):
    engine_root = engine_root.resolve()
    if subprocess.check_output(['git', '-C', str(engine_root), 'status', '--porcelain', '--', 'src']).strip():
        raise ValueError('Engine source has local modifications; commit them before generating a revision-attributed report.')
    commit = subprocess.check_output(['git', '-C', str(engine_root), 'rev-parse', 'HEAD'], text=True).strip()
    sys.path.insert(0, str(engine_root / 'src'))
    from moneyprinter.tools import compute_exposure_tool
    prepared = prepare_workspace(bundle)
    attachment = None
    if prepared['exposure_input'] is not None:
        payload = prepared['exposure_input']
        report = compute_exposure_tool(payload)
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()).hexdigest()
        attachment = {'input_sha256': digest, 'engine_commit': commit, 'report': report}
    return {'schema_version': 'lookout.file/1', 'workspace': bundle, 'exposure': attachment}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('--engine-root', type=Path, required=True)
    args = parser.parse_args()
    try:
        if args.input.stat().st_size > 5_000_000:
            raise ValueError('Input exceeds 5 MB.')
        bundle = json.loads(args.input.read_text(), object_pairs_hook=unique, parse_constant=lambda v: (_ for _ in ()).throw(ValueError('Invalid number')))
        output = json.dumps(create_report(bundle, args.engine_root), ensure_ascii=False, indent=2, allow_nan=False)
        if len(output.encode('utf-8')) > 5_000_000:
            raise ValueError('Prepared report exceeds the viewer’s 5 MB limit; reduce the input scope.')
        print(output)
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'Cannot prepare report: {error}\n')
