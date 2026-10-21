#!/usr/bin/env python3
"""
Seva Sagar — reproducible APK build with zero Gradle.

Pipeline: brand render -> web manifest -> aapt2 compile/link -> javac -> d8 ->
          zip dex -> zipalign -> apksigner (v1+v2+v3) -> verify.

Usage:  python3 scripts/build_apk.py [--version 1.0.0] [--code 1] [--web 1]
"""
import argparse, hashlib, json, os, shutil, subprocess, sys, time, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BT = os.environ.get('ANDROID_BUILD_TOOLS', '/home/user/tools/sdk/bt/android-14')
PLATFORM = os.environ.get('ANDROID_PLATFORM', '/home/user/tools/sdk/plat/android-34/android.jar')
APP = os.path.join(ROOT, 'app')
AND = os.path.join(APP, 'android')
WEB = os.path.join(APP, 'web')
BUILD = os.path.join(ROOT, 'build')
DIST = os.path.join(ROOT, 'dist')
KEYS = os.path.join(ROOT, 'keys')

def sh(cmd, **kw):
    print('  $', ' '.join(str(c) for c in cmd)[:220], flush=True)
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, **kw)
    if r.returncode != 0:
        print(r.stdout[-8000:]); print(r.stderr[-8000:], file=sys.stderr)
        raise SystemExit(f'FAILED ({r.returncode}): {cmd[0]}')
    return r.stdout

def sha256_file(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 16), b''):
            h.update(chunk)
    return h.hexdigest()

def web_manifest(version):
    """Hash every shipped web file -> content-addressed baseline for the OTA engine."""
    files = []
    for base, _, names in os.walk(WEB):
        for n in sorted(names):
            if n in ('manifest.json', 'version.json') or n.startswith('.'):
                continue
            full = os.path.join(base, n)
            rel = os.path.relpath(full, WEB).replace(os.sep, '/')
            files.append({'path': rel, 'sha256': sha256_file(full), 'size': os.path.getsize(full)})
    files.sort(key=lambda x: x['path'])
    man = {'version': version, 'files': files, 'generated': int(time.time())}
    with open(os.path.join(WEB, 'manifest.json'), 'w') as f:
        json.dump(man, f, separators=(',', ':'))
    with open(os.path.join(WEB, 'version.json'), 'w') as f:
        json.dump({'web': version, 'generated': int(time.time())}, f, separators=(',', ':'))
    return man

def ensure_keystore():
    os.makedirs(KEYS, exist_ok=True)
    ks = os.path.join(KEYS, 'seva-release.jks')
    prop = os.path.join(KEYS, 'keystore.properties')
    if os.path.exists(ks) and os.path.exists(prop):
        cfg = dict(l.strip().split('=', 1) for l in open(prop) if '=' in l and not l.startswith('#'))
        return ks, cfg
    import secrets
    pw = secrets.token_urlsafe(18)
    sh(['keytool', '-genkeypair', '-v', '-keystore', ks, '-alias', 'seva',
        '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10950',
        '-storepass', pw, '-keypass', pw,
        '-dname', 'CN=Seva Sagar, OU=Bhakt Seva, O=Satlok Seva, L=Hisar, ST=Haryana, C=IN'])
    cfg = {'storePassword': pw, 'keyPassword': pw, 'alias': 'seva'}
    with open(prop, 'w') as f:
        f.write('# KEEP THIS FILE AND THE .jks SAFE — every future update must be signed\n'
                '# with this same key or Android will refuse to install the update.\n')
        for k, v in cfg.items():
            f.write(f'{k}={v}\n')
    return ks, cfg

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--version', default='1.0.0')
    ap.add_argument('--code', type=int, default=1)
    ap.add_argument('--web', type=int, default=1)
    ap.add_argument('--skip-brand', action='store_true')
    ap.add_argument('--debug', action='store_true')
    a = ap.parse_args()

    print(f'== Seva Sagar {a.version} (code {a.code}, web {a.web}) ==')
    if not os.path.exists(BT):
        raise SystemExit('Android build-tools missing: ' + BT)
    if not a.skip_brand:
        print('[1/8] brand assets')
        sh([sys.executable, os.path.join(ROOT, 'scripts', 'render_brand.py')])

    print('[2/8] web manifest')
    man = web_manifest(a.web)
    print(f'      {len(man["files"])} files, {sum(f["size"] for f in man["files"])/1024:.1f} KB')

    if os.path.exists(BUILD):
        shutil.rmtree(BUILD)
    for d in ('gen', 'classes', 'dex', 'res', 'apk'):
        os.makedirs(os.path.join(BUILD, d), exist_ok=True)
    os.makedirs(DIST, exist_ok=True)

    print('[3/8] aapt2 compile + link')
    res_zip = os.path.join(BUILD, 'res', 'compiled.zip')
    sh([os.path.join(BT, 'aapt2'), 'compile', '--dir', os.path.join(AND, 'res'), '-o', res_zip])
    base_apk = os.path.join(BUILD, 'apk', 'base.apk')
    sh([os.path.join(BT, 'aapt2'), 'link',
        '-o', base_apk,
        '-I', PLATFORM,
        '--manifest', os.path.join(AND, 'AndroidManifest.xml'),
        '--java', os.path.join(BUILD, 'gen'),
        '-A', WEB,
        '--min-sdk-version', '23', '--target-sdk-version', '34',
        '--version-code', str(a.code), '--version-name', a.version,
        '--auto-add-overlay', '--no-version-vectors',
        res_zip])
    # aapt2 puts assets under the given dir's *contents*; we need them at assets/web/...
    # (-A WEB copies WEB contents to assets root, so we re-pack with the web/ prefix)
    with zipfile.ZipFile(base_apk) as z:
        names = z.namelist()
    if not any(n.startswith('assets/web/') for n in names):
        tmp = os.path.join(BUILD, 'apk', 'repack.apk')
        with zipfile.ZipFile(base_apk) as zin, zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                name = item.filename
                if name.startswith('assets/'):
                    name = 'assets/web/' + name[len('assets/'):]
                zout.writestr(name, data)
        shutil.move(tmp, base_apk)

    print('[4/8] javac')
    srcs = []
    for base, _, names in os.walk(os.path.join(AND, 'java')):
        srcs += [os.path.join(base, n) for n in names if n.endswith('.java')]
    for base, _, names in os.walk(os.path.join(BUILD, 'gen')):
        srcs += [os.path.join(base, n) for n in names if n.endswith('.java')]
    sh(['javac', '-source', '8', '-target', '8', '-encoding', 'UTF-8',
        '-bootclasspath', PLATFORM, '-nowarn', '-Xlint:none',
        '-d', os.path.join(BUILD, 'classes')] + srcs)

    print('[5/8] d8 (dex)')
    classes = []
    for base, _, names in os.walk(os.path.join(BUILD, 'classes')):
        classes += [os.path.join(base, n) for n in names if n.endswith('.class')]
    d8cmd = [os.path.join(BT, 'd8'), '--release', '--min-api', '23',
             '--lib', PLATFORM, '--output', os.path.join(BUILD, 'dex')] + classes
    sh(d8cmd)

    print('[6/8] package dex')
    unsigned = os.path.join(BUILD, 'apk', 'unsigned.apk')
    with zipfile.ZipFile(base_apk) as zin, zipfile.ZipFile(unsigned, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            zout.writestr(item, zin.read(item.filename))
        zout.write(os.path.join(BUILD, 'dex', 'classes.dex'), 'classes.dex')

    print('[7/8] zipalign')
    aligned = os.path.join(BUILD, 'apk', 'aligned.apk')
    sh([os.path.join(BT, 'zipalign'), '-f', '-p', '4', unsigned, aligned])

    print('[8/8] apksigner')
    ks, cfg = ensure_keystore()
    out = os.path.join(DIST, f'SevaSagar-v{a.version}.apk')
    sh(['java', '-jar', os.path.join(BT, 'lib', 'apksigner.jar'), 'sign',
        '--ks', ks, '--ks-key-alias', cfg['alias'],
        '--ks-pass', 'pass:' + cfg['storePassword'],
        '--key-pass', 'pass:' + cfg['keyPassword'],
        '--v1-signing-enabled', 'true', '--v2-signing-enabled', 'true',
        '--v3-signing-enabled', 'true',
        '--out', out, aligned])
    sh(['java', '-jar', os.path.join(BT, 'lib', 'apksigner.jar'), 'verify', '--print-certs', '-v', out])
    sh([os.path.join(BT, 'zipalign'), '-c', '-p', '4', out])

    size = os.path.getsize(out)
    info = {'version': a.version, 'versionCode': a.code, 'webVersion': a.web,
            'apk': os.path.basename(out), 'bytes': size, 'sha256': sha256_file(out),
            'builtAt': int(time.time())}
    with open(os.path.join(DIST, 'build-info.json'), 'w') as f:
        json.dump(info, f, indent=2)
    print(f'\nOK  {out}  ({size/1024/1024:.2f} MB)\nsha256 {info["sha256"]}')

if __name__ == '__main__':
    main()
