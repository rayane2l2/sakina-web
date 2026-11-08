"""Build a static PWA with a content-derived offline cache version."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import sys


def build(source, destination):
    source, destination = Path(source).resolve(), Path(destination).resolve()
    if source == destination or source in destination.parents or destination in source.parents:
        raise ValueError('Source and destination must be separate directories')
    # Build into a new folder; never recursively delete a computed directory.
    if destination.exists():
        raise ValueError('Destination already exists; choose a new output directory')
    paths = sorted(p for p in source.rglob('*') if p.is_file() and p.suffix.lower() != '.pdf')
    digest = hashlib.sha256()
    for path in paths:
        if path.is_symlink() or any(part.startswith('.') for part in path.relative_to(source).parts):
            raise ValueError('Hidden files and symlinks must not be published: ' + str(path))
        if path.name == 'offline-files.json':
            continue
        digest.update(path.relative_to(source).as_posix().encode('utf-8'))
        digest.update(b'\0')
        digest.update(path.read_bytes())
    version = 'sakina-recite-web-' + digest.hexdigest()[:20]
    shutil.copytree(source, destination, ignore=shutil.ignore_patterns('*.pdf'))
    for name in ['sw.js', 'js/app.js']:
        path = destination / name
        text = path.read_text(encoding='utf-8')
        text, count = re.subn(r'sakina-recite-(?:v\d+|web-[a-f0-9]+)', version, text)
        if not count:
            raise ValueError('Missing cache version in ' + name)
        path.write_text(text, encoding='utf-8')
    (destination / '.nojekyll').write_text('', encoding='utf-8')
    files = ['./'] + sorted(p.relative_to(destination).as_posix() for p in destination.rglob('*')
                            if p.is_file() and p.name not in ['sw.js', 'offline-files.json', '.nojekyll'])
    (destination / 'offline-files.json').write_text(json.dumps(files), encoding='utf-8')
    total = sum(p.stat().st_size for p in destination.rglob('*') if p.is_file())
    print(f'{len(files)} resources; {total / 1024**2:.1f} MiB; cache {version}')
    return version


if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent
    build(root / 'app', Path(sys.argv[1]) if len(sys.argv) > 1 else root / '_site')
