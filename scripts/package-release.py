#!/usr/bin/env python3
"""Create a source + runtime bundle, without git metadata, dependencies or saves."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
ROOT_FILES = [
    'index.html', 'studio.css', 'hero.jpg', 'icon.svg', 'manifest.webmanifest', 'sw.js',
    'Deutsch-lernen.bat', 'README.txt', 'QUICK_START_FA.txt',
    'PREVIOUS_VERSION_AUDIT.md', 'PROJECT_REPORT.md', 'AUDIT.md',
    'TEACHING_GUIDE.md', 'RELEASE_CHECKLIST.md', 'COMPANION_GUIDE.md', 'LERNSTUDIO.md', 'package.json',
    'package-lock.json', '.gitignore',
]
SOURCE_DIRS = ['js', 'scripts', 'tests', '.github/workflows']


def build(output):
    files = [ROOT / name for name in ROOT_FILES]
    for directory in SOURCE_DIRS:
        files.extend(p for p in (ROOT / directory).rglob('*')
                     if p.is_file() and '__pycache__' not in p.parts
                     and p.suffix in {'.js', '.cjs', '.py', '.yml', '.yaml'})
    for path in files:
        if not path.is_file():
            raise FileNotFoundError(path)
    files = sorted(set(files), key=lambda p: p.relative_to(ROOT).as_posix())
    output = Path(output).resolve()
    if output in files:
        raise ValueError('Output cannot replace a source file')
    output.parent.mkdir(parents=True, exist_ok=True)
    payload = {p.relative_to(ROOT).as_posix(): p.read_bytes() for p in files}
    info = {
        'product': 'DeutschRitter', 'bundle': 'runtime-and-source',
        'branch': subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip(),
        'baseCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'includesWorkingTreeChanges': True,
        'audio': 'Browser TTS; no MP3 files available in checkout',
        'entrypoint': 'index.html', 'guide': 'QUICK_START_FA.txt',
        'audit': 'PREVIOUS_VERSION_AUDIT.md',
    }
    payload['BUILD_INFO.json'] = (json.dumps(info, indent=2, ensure_ascii=False) + '\n').encode()
    checksums = '\n'.join(f'{hashlib.sha256(data).hexdigest()}  {name}'
                          for name, data in sorted(payload.items())) + '\n'
    payload['SHA256SUMS.txt'] = checksums.encode()
    with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(payload.items()):
            archive.writestr('DeutschRitter/' + name, data)
    with ZipFile(output) as archive:
        if archive.testzip() is not None:
            raise RuntimeError('ZIP CRC verification failed')
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix(output.suffix + '.sha256').write_text(digest + '  ' + output.name + '\n')
    print(json.dumps({'archive': str(output), 'files': len(payload),
                      'bytes': output.stat().st_size, 'sha256': digest}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True)
    build(parser.parse_args().output)
