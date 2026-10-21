# सेवा सागर · Seva Sagar

**Offline, encrypted daily-seva diary + bhandara banner studio for the bhakts of Sant Rampal Ji Maharaj — with file-level over-the-air updates and a zero-backend admin panel.**

॥ राम सत नाम ॥

| | |
|---|---|
| **Download page** | https://glitchyapi.github.io/seva-sagar/ |
| **Admin panel** | https://glitchyapi.github.io/seva-sagar/admin/ |
| **Universal update API** | https://glitchyapi.github.io/seva-sagar/updates/manifest.json |
| **Package** | `com.satlok.seva` · minSdk 23 (Android 6) · targetSdk 34 |
| **APK size** | ~0.33 MB (no Gradle, no AndroidX, no framework) |

---

## 1. What the app does

* **Seva diary** — naam jaap (mala), satsang (minutes), path (pages), bhandara seva (hours), prachar, daan.
  Daily target ring, streaks, best streak, month heatmap, per-type totals, notes and place.
* **Bhandara banner studio** — 5 print-ready 1080×1350 designs rendered on-canvas, fully offline,
  Devanagari aware, live preview, share to WhatsApp or save to gallery. Saved bhandaras get automatic reminders.
* **Reminders & notifications** — exact daily alarm, bhandara alerts, update notifications, admin announcements.
  Survives reboot, timezone change and app upgrade.
* **Private by construction** — the diary is `DEFLATE-9 → AES-256-GCM`, key wrapped by a hardware
  AndroidKeyStore key, or by `PBKDF2-HMAC-SHA256 (200 000 iterations)` when a PIN is set.
  Atomic writes (tmp → fsync → rename) so a crash can never corrupt a diary. Nothing leaves the phone.
* **Adaptive UI** — Light / Dark / AMOLED / System, 5 accents, 4 languages
  (हिन्दी · English · ਪੰਜਾਬੀ · हरियाणवी), animated splash, edge-to-edge insets, reduced-motion support.
* **Smart updates** — checks a public JSON URL on open (and every 6 h), downloads **only the files whose
  SHA-256 changed**, verifies each hash, stages them, then flips one pointer atomically. One-tap rollback.

## 2. Architecture

```
┌──────────────────────── Android shell (Java, ~1.4k lines, zero dependencies) ───────────────────────┐
│ MainActivity   WebView serving https://app.sevasagar.local from assets/web OR files/web/vN          │
│ Bridge         @JavascriptInterface: vault · http · notify · reminders · permissions · share · OTA   │
│ Vault          deflate + AES-256-GCM envelope, AndroidKeyStore / PBKDF2 PIN, encrypted backups       │
│ Updater        content-addressed delta patcher + APK downloader/installer (hash-verified)            │
│ Notify         channels, rich notifications, AlarmManager exact reminders                            │
│ ShareProvider  dependency-free FileProvider replacement (share sheet, gallery, package installer)    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
                    ▲ bridge (JSON in / JSON out + events)
┌──────────────────────── Web bundle (hot-updatable, ~290 KB) ────────────────────────────────────────┐
│ core.js  state · storage · theme      ui.js  icons · router · sheets · dialogs · toasts              │
│ screens.js  home · seva · bhandara · profile      banner.js  canvas poster engine                    │
│ update.js  OTA orchestration + announcements      i18n.js  4 languages                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

The web bundle is the product. Changing UI, logic, translations or banners is a **content patch** —
users get it in seconds without reinstalling. Only native changes (new permission, new bridge method)
need a new APK, which the app downloads and hands to the system installer itself.

## 3. Build the APK (no Gradle, no Android Studio)

Requirements: JDK 17, Python 3 with Pillow + numpy, Android build-tools 34, `android.jar` (API 34).

```bash
export ANDROID_BUILD_TOOLS=/path/to/build-tools/34.0.0
export ANDROID_PLATFORM=/path/to/platforms/android-34/android.jar
python3 scripts/build_apk.py --version 1.0.1 --code 2 --web 2
```

Pipeline: brand render → web fingerprint → `aapt2 compile/link` → `javac` → `d8` → zip → `zipalign` →
`apksigner` (v1+v2+v3) → verify. Output: `dist/SevaSagar-vX.Y.Z.apk` + `dist/build-info.json`.

> **Signing key.** `keys/seva-release.jks` + `keys/keystore.properties` are generated on first build and
> are **git-ignored**. Back them up privately. Every future APK must be signed with the same key or
> Android will refuse the update.

## 4. Publish an update

### From the admin panel (recommended)
1. Open https://glitchyapi.github.io/seva-sagar/admin/ and connect with a GitHub token (`repo` scope).
2. **Publish update** → *Load from repo* (or drop your `app/web` folder).
3. The panel diffs SHA-256 against the live manifest and shows exactly what devotees will download.
4. Fill the changelog (4 languages), press **Publish**. One atomic commit lands in `docs/`.
5. **Notify users** sends an announcement that appears as a real device notification on every phone.
6. **App installer** uploads a new APK, publishes a GitHub Release and bumps `shell.versionCode`.
7. **History** rolls every device back to any previous content version in one click.

### From the CLI
```bash
python3 scripts/publish.py --version 1.0.1 --web 2 \
  --notes-hi "नया बैनर डिज़ाइन" --notes-en "New banner design"
git add docs && git commit -m "release: content v2" && git push
```

### The universal manifest
```jsonc
{
  "schema": 1, "app": "sevasagar", "channel": "stable",
  "latest": { "version": "1.0.1", "versionCode": 1, "web": 2, "mandatory": false,
              "notes": { "hi": "…", "en": "…", "pa": "…", "hr": "…" } },
  "shell": { "version": "1.0.0", "versionCode": 1,
             "apk": { "url": "…/SevaSagar-v1.0.0.apk", "sha256": "…", "size": 344064, "mirrors": ["…"] } },
  "web":   { "version": 2, "base": "https://glitchyapi.github.io/seva-sagar/updates/",
             "files": [ { "path": "js/screens.js", "sha256": "…", "size": 50703,
                          "url": "files/ab/abcd…", "mirrors": ["raw…", "cdn…"] } ],
             "deleted": [] },
  "announcement": { "id": "a…", "title": "…", "body": "…", "route": "bhandara", "until": 1735689600000 }
}
```
Files are stored **content-addressed** (`updates/files/<first2>/<sha256>`), so a patch never re-downloads
unchanged bytes and an old version stays available for rollback. Mirrors are tried in order — GitHub Pages,
raw.githubusercontent, jsDelivr, plus any direct-link host you paste in (HeOnlyFiles or similar).
The app can be pointed at a completely different manifest URL in
*Profile → App update → Advanced → Update source*.

## 5. Testing

```bash
cd app/web && python3 -m http.server 8099 &
node scripts/smoke_test.js --mock     # boots the real bundle with a mock native bridge
```
Drives every screen, seeds data, switches themes/languages, captures screenshots to `build/shots/`
and fails on any console error.

## 6. Privacy & security

* No account, no analytics, no network call except the update manifest and patch files.
* Diary encrypted at rest with AES-256-GCM; optional PIN re-wraps the data key with PBKDF2-200k.
* Backups (`.svbak`) are separately encrypted with a passphrase you choose.
* WebView: file/content access disabled, mixed content blocked, cleartext traffic blocked,
  everything served from a private HTTPS origin.
* Every patch file and APK is SHA-256 verified before it is applied or installed.

## 7. Repository layout

```
app/web/        the hot-updatable app (HTML/CSS/JS)
app/android/    native shell (Java, manifest, resources, adaptive icon)
admin/          control panel source (mirrored to docs/admin by the publisher)
docs/           GitHub Pages root: landing page, admin, updates/, downloads/
scripts/        build_apk.py · publish.py · render_brand.py · smoke_test.js
```

---
Made with devotion. **॥ राम सत नाम ॥**
