#!/usr/bin/env python3
"""
Seva Sagar publisher — turns app/web into a content-addressed patch set and
writes the universal manifest that every installed app reads.

  python3 scripts/publish.py --version 1.0.1 --web 2 \
      --notes-hi "..." --notes-en "..." [--apk dist/SevaSagar-v1.0.1.apk --code 2]

Output lands in docs/ (GitHub Pages root):
  docs/updates/manifest.json      <- the universal URL
  docs/updates/files/ab/<sha256>  <- only the changed files
  docs/updates/history/vN.json    <- rollback snapshots
  docs/downloads/<apk>            <- installer mirror
Commit + push, and every device updates itself on next open.
"""
import argparse, hashlib, json, os, shutil, sys, time, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, 'app', 'web')
DOCS = os.path.join(ROOT, 'docs')
UP = os.path.join(DOCS, 'updates')
HIST = os.path.join(UP, 'history')
MAN = os.path.join(UP, 'manifest.json')

OWNER = os.environ.get('SEVA_OWNER', 'glitchyapi')
REPO = os.environ.get('SEVA_REPO', 'seva-sagar')
BRANCH = os.environ.get('SEVA_BRANCH', 'main')
PAGES = f'https://{OWNER}.github.io/{REPO}/'
RAW = f'https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}/docs/'
CDN = f'https://cdn.jsdelivr.net/gh/{OWNER}/{REPO}@{BRANCH}/docs/'


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def scan_web():
    out = {}
    for base, _, names in os.walk(WEB):
        for n in names:
            if n in ('manifest.json', 'version.json') or n.startswith('.'):
                continue
            full = os.path.join(base, n)
            rel = os.path.relpath(full, WEB).replace(os.sep, '/')
            with open(full, 'rb') as f:
                data = f.read()
            out[rel] = {'path': rel, 'sha256': sha256(data), 'size': len(data), '_data': data}
    return out


def load_manifest():
    if os.path.exists(MAN):
        with open(MAN, encoding='utf-8') as f:
            return json.load(f)
    return {
        'schema': 1, 'app': 'sevasagar', 'channel': 'stable',
        'latest': {'version': '1.0.0', 'versionCode': 1, 'web': 1,
                   'published': datetime.datetime.utcnow().isoformat() + 'Z',
                   'mandatory': False, 'notes': {}},
        'shell': {'version': '1.0.0', 'versionCode': 1, 'apk': None},
        'web': {'version': 1, 'base': PAGES + 'updates/', 'files': [], 'deleted': []},
        'announcement': None, 'history': []
    }


def sync_admin():
    src = os.path.join(ROOT, 'admin')
    dst = os.path.join(DOCS, 'admin')
    if os.path.isdir(src):
        if os.path.isdir(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
        print(f'  admin panel -> docs/admin ({sum(len(f) for _, _, f in os.walk(dst))} files)')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--version', required=True, help='public version name, e.g. 1.0.1')
    ap.add_argument('--web', type=int, required=True, help='content version (increments)')
    ap.add_argument('--code', type=int, default=None, help='native versionCode (only when shipping an APK)')
    ap.add_argument('--apk', default=None)
    ap.add_argument('--notes-hi', default='')
    ap.add_argument('--notes-en', default='')
    ap.add_argument('--notes-pa', default='')
    ap.add_argument('--notes-hr', default='')
    ap.add_argument('--mandatory', action='store_true')
    ap.add_argument('--channel', default='stable')
    ap.add_argument('--first', action='store_true', help='baseline publish (no previous manifest)')
    a = ap.parse_args()

    os.makedirs(UP, exist_ok=True)
    os.makedirs(HIST, exist_ok=True)
    os.makedirs(os.path.join(DOCS, 'downloads'), exist_ok=True)

    m = load_manifest()
    old = {f['path']: f['sha256'] for f in m['web'].get('files', [])}
    files = scan_web()

    changed, unchanged = [], 0
    entries = []
    for rel, f in sorted(files.items()):
        rel_url = f"files/{f['sha256'][:2]}/{f['sha256']}"
        entry = {
            'path': rel, 'sha256': f['sha256'], 'size': f['size'], 'url': rel_url,
            'mirrors': [RAW + 'updates/' + rel_url, CDN + 'updates/' + rel_url]
        }
        entries.append(entry)
        if old.get(rel) == f['sha256'] and not a.first:
            unchanged += 1
            continue
        dest = os.path.join(UP, rel_url)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        if not os.path.exists(dest):
            with open(dest, 'wb') as out:
                out.write(f['_data'])
        changed.append(f)

    deleted = [p for p in old if p not in files]
    total = sum(f['size'] for f in changed)

    m['schema'] = 1
    m['app'] = 'sevasagar'
    m['channel'] = a.channel
    m['latest'] = {
        'version': a.version,
        'versionCode': a.code or m['shell'].get('versionCode', 1),
        'web': a.web,
        'published': datetime.datetime.utcnow().isoformat() + 'Z',
        'mandatory': bool(a.mandatory),
        'size': total,
        'notes': {'hi': a.notes_hi, 'en': a.notes_en, 'pa': a.notes_pa, 'hr': a.notes_hr}
    }
    m['web'] = {'version': a.web, 'base': PAGES + 'updates/', 'files': entries, 'deleted': deleted}
    m.setdefault('announcement', None)
    m['history'] = ([{'web': a.web, 'version': a.version, 'at': m['latest']['published'],
                      'files': len(changed), 'bytes': total}] + m.get('history', []))[:20]

    if a.apk:
        apk_path = os.path.join(ROOT, a.apk) if not os.path.isabs(a.apk) else a.apk
        with open(apk_path, 'rb') as f:
            apk_bytes = f.read()
        apk_name = f'SevaSagar-v{a.version}.apk'
        for target in (apk_name, 'SevaSagar.apk'):
            shutil.copyfile(apk_path, os.path.join(DOCS, 'downloads', target))
        code = a.code or (m['shell'].get('versionCode', 1) + 1)
        m['shell'] = {
            'version': a.version, 'versionCode': code, 'mandatory': bool(a.mandatory),
            'apk': {
                'url': PAGES + 'downloads/' + apk_name,
                'size': len(apk_bytes), 'sha256': sha256(apk_bytes),
                'mirrors': [RAW + 'downloads/' + apk_name,
                            f'https://github.com/{OWNER}/{REPO}/releases/download/v{a.version}/{apk_name}']
            }
        }
        m['latest']['versionCode'] = code
        print(f'  installer {apk_name} ({len(apk_bytes)/1048576:.2f} MB, code {code})')

    with open(MAN, 'w', encoding='utf-8') as f:
        json.dump(m, f, ensure_ascii=False, indent=2)
    with open(os.path.join(HIST, f'v{a.web}.json'), 'w', encoding='utf-8') as f:
        json.dump(m, f, ensure_ascii=False, indent=2)

    sync_admin()

    print(f'\ncontent v{a.web} ({a.version})')
    print(f'  changed {len(changed)} · unchanged {unchanged} · deleted {len(deleted)}')
    print(f'  devices download {total/1024:.1f} KB of {sum(f["size"] for f in files.values())/1024:.1f} KB total')
    print(f'\nuniversal URL:\n  {PAGES}updates/manifest.json\n  {RAW}updates/manifest.json')
    if changed:
        print('\nchanged files:')
        for f in changed[:25]:
            print(f'  {f["path"]:<34} {f["size"]:>8} B')
        if len(changed) > 25:
            print(f'  … +{len(changed)-25} more')


if __name__ == '__main__':
    main()
