/* Seva Sagar control panel — publish content patches, installers and
   announcements straight to GitHub. No server, no database. */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const DOC = 'docs/';
  const UP = DOC + 'updates/';
  const MAN = UP + 'manifest.json';
  const HIST = UP + 'history/';
  const DL = DOC + 'downloads/';

  let manifest = null;
  let staged = [];      // {path, size, sha256, base64, status}
  let apkFile = null;
  let busy = false;

  /* ─────────────── helpers ─────────────── */
  function toast(msg, kind) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'on ' + (kind || '');
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = ''; }, 3200);
  }
  function bytes(n) {
    if (n == null) return '—';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }
  function log(sel, text, append) {
    const el = $(sel);
    el.hidden = false;
    el.textContent = append ? el.textContent + '\n' + text : text;
    el.scrollTop = el.scrollHeight;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function modal(html) {
    const root = $('#modal-root');
    root.innerHTML = `<div class="modal"><div class="in">${html}</div></div>`;
    root.querySelector('.modal').addEventListener('click', e => {
      if (e.target.classList.contains('modal')) root.innerHTML = '';
    });
    return root;
  }
  function closeModal() { $('#modal-root').innerHTML = ''; }
  function setBusy(b) {
    busy = b;
    $$('.btn.primary').forEach(x => x.disabled = b);
  }

  /* ─────────────── connect ─────────────── */
  async function connect(token, repo, branch, pass) {
    GH.init({ token, repo, branch });
    const errBox = $('#connect-err');
    errBox.hidden = true;
    try {
      const user = await GH.me();
      await GH.repoInfo();
      localStorage.setItem('seva.gh.repo', repo);
      localStorage.setItem('seva.gh.branch', branch);
      if (pass) localStorage.setItem('seva.gh.token', await GH.encryptToken(token, pass));
      else localStorage.setItem('seva.gh.token', token);
      localStorage.setItem('seva.gh.enc', pass ? '1' : '0');
      $('#conn').textContent = '@' + user.login;
      $('#conn').className = 'chip';
      $('#view-connect').hidden = true;
      $('#view-main').hidden = false;
      toast('Connected as @' + user.login, 'ok');
      await refreshManifest();
      renderDash();
    } catch (e) {
      errBox.hidden = false;
      errBox.textContent = 'Could not connect: ' + e.message;
      throw e;
    }
  }

  async function restore() {
    const packed = localStorage.getItem('seva.gh.token');
    if (!packed) return;
    $('#in-repo').value = localStorage.getItem('seva.gh.repo') || 'glitchyapi/seva-sagar';
    $('#in-branch').value = localStorage.getItem('seva.gh.branch') || 'main';
    if (localStorage.getItem('seva.gh.enc') === '1') {
      const pass = prompt('Passphrase to unlock your stored GitHub token');
      if (!pass) return;
      try {
        const token = await GH.decryptToken(packed, pass);
        await connect(token, $('#in-repo').value, $('#in-branch').value, pass);
      } catch (e) { toast('Unlock failed: ' + e.message, 'err'); }
    } else {
      try { await connect(packed, $('#in-repo').value, $('#in-branch').value, ''); }
      catch (e) { /* show connect view */ }
    }
  }

  /* ─────────────── manifest ─────────────── */
  async function refreshManifest() {
    try {
      manifest = await GH.readJson(MAN);
    } catch (e) { manifest = null; }
    if (!manifest) {
      manifest = {
        schema: 1, app: 'sevasagar', channel: 'stable',
        latest: { version: '1.0.0', versionCode: 1, web: 1, published: new Date().toISOString(), mandatory: false, notes: {} },
        shell: { version: '1.0.0', versionCode: 1, apk: null },
        web: { version: 1, base: GH.pagesBase() + 'updates/', files: [], deleted: [] },
        announcement: null, history: []
      };
    }
    manifest.web.base = GH.pagesBase() + 'updates/';
    $('#man-edit').value = JSON.stringify(manifest, null, 2);
    $('#rel-web').value = (manifest.web.version || 1) + 1;
    const parts = String(manifest.latest.version || '1.0.0').split('.');
    parts[2] = String((+parts[2] || 0) + 1);
    $('#rel-name').value = parts.join('.');
    return manifest;
  }

  function renderDash() {
    const m = manifest || {};
    const files = (m.web && m.web.files) || [];
    const total = files.reduce((a, f) => a + (f.size || 0), 0);
    $('#dash-stats').innerHTML = `
      <div class="stat ac"><b>v${esc(m.latest && m.latest.version || '—')}</b><span>Published version</span></div>
      <div class="stat"><b>${m.web ? m.web.version : '—'}</b><span>Content version</span></div>
      <div class="stat"><b>${files.length}</b><span>Files tracked</span></div>
      <div class="stat"><b>${bytes(total)}</b><span>Full bundle size</span></div>
      <div class="stat"><b>v${esc(m.shell && m.shell.version || '—')}</b><span>Installer (code ${m.shell ? m.shell.versionCode : '—'})</span></div>
      <div class="stat"><b>${m.announcement ? 'ON' : '—'}</b><span>Active announcement</span></div>`;
    $('#url-manifest').textContent = GH.manifestUrls()[0];
    $('#url-raw').textContent = GH.manifestUrls()[1];
    $('#url-apk').textContent = (m.shell && m.shell.apk && m.shell.apk.url) || GH.pagesBase() + 'downloads/SevaSagar.apk';
    $('#dash-live').textContent = JSON.stringify(m, null, 2);
  }

  /* ─────────────── staging files ─────────────── */
  function normalizePaths(list) {
    // strip the common folder prefix so paths are relative to the web root
    if (!list.length) return list;
    const paths = list.map(f => f.rel);
    const idx = paths.findIndex(p => /(^|\/)index\.html$/.test(p));
    let prefix = '';
    if (idx >= 0) {
      const p = paths[idx];
      prefix = p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '';
    } else {
      const first = paths[0].split('/')[0];
      if (paths.every(p => p.split('/')[0] === first) && paths[0].includes('/')) prefix = first + '/';
    }
    list.forEach(f => { f.path = prefix && f.rel.startsWith(prefix) ? f.rel.slice(prefix.length) : f.rel; });
    return list.filter(f => f.path && !f.path.startsWith('.') && !/\/\./.test(f.path));
  }

  async function stageFiles(fileList) {
    const raw = [];
    for (const f of fileList) {
      const rel = f.webkitRelativePath || f._rel || f.name;
      if (/(^|\/)(manifest\.json|version\.json)$/.test(rel)) continue;
      const buf = await f.arrayBuffer();
      raw.push({
        rel, name: f.name, size: buf.byteLength,
        sha256: await GH.sha256Hex(buf),
        base64: GH.bufToBase64(buf)
      });
    }
    staged = normalizePaths(raw);
    computeDiff();
    toast(staged.length + ' files staged', 'ok');
  }

  function computeDiff() {
    const old = {};
    ((manifest.web && manifest.web.files) || []).forEach(f => old[f.path] = f.sha256);
    const seen = {};
    staged.forEach(f => {
      seen[f.path] = 1;
      f.status = !old[f.path] ? 'new' : old[f.path] === f.sha256 ? 'same' : 'mod';
    });
    const deleted = Object.keys(old).filter(p => !seen[p]);
    const changed = staged.filter(f => f.status !== 'same');
    const size = changed.reduce((a, f) => a + f.size, 0);
    $('#diff-summary').innerHTML = staged.length
      ? `<b>${changed.length}</b> changed · <b>${staged.length - changed.length}</b> unchanged ·
         <b>${deleted.length}</b> removed · devotees download <b style="color:var(--ac)">${bytes(size)}</b>`
      : '';
    $('#diff-list').innerHTML = staged.map(f => `
      <div class="frow"><span class="tag ${f.status}">${f.status.toUpperCase()}</span>
        <span class="path">${esc(f.path)}</span><span class="size">${bytes(f.size)}</span></div>`).join('') +
      deleted.map(p => `<div class="frow"><span class="tag del">DEL</span><span class="path">${esc(p)}</span><span class="size">—</span></div>`).join('');
    $('#mirror-list').innerHTML = changed.map((f, i) => `
      <div class="frow"><span class="path">${esc(f.path)}</span>
        <input data-mirror="${i}" placeholder="https://your-host/…/${f.path}"></div>`).join('');
    staged._deleted = deleted;
  }

  async function loadFromRepo() {
    setBusy(true);
    try {
      toast('Reading app/web from the repository…');
      const head = await GH.ref();
      const c = await GH.commitOf(head.object.sha);
      const t = await GH.tree(c.tree.sha, true);
      const items = t.tree.filter(x => x.type === 'blob' && x.path.startsWith('app/web/'));
      if (!items.length) throw new Error('app/web not found in the repository');
      const out = [];
      for (const it of items) {
        const rel = it.path.slice('app/'.length);
        if (/(^|\/)(manifest\.json|version\.json)$/.test(rel)) continue;
        const b = await GH.req(`/repos/${GH.conf().repo}/git/blobs/${it.sha}`);
        const bin = Uint8Array.from(atob(b.content.replace(/\n/g, '')), ch => ch.charCodeAt(0));
        out.push({
          rel, path: rel.slice('web/'.length), name: rel.split('/').pop(),
          size: bin.length, sha256: await GH.sha256Hex(bin.buffer), base64: GH.bufToBase64(bin.buffer)
        });
      }
      staged = out;
      computeDiff();
      toast(out.length + ' files loaded from repo', 'ok');
    } catch (e) { toast(e.message, 'err'); }
    setBusy(false);
  }

  /* ─────────────── publish ─────────────── */
  function buildManifest() {
    const webVersion = +$('#rel-web').value || ((manifest.web.version || 1) + 1);
    const versionName = $('#rel-name').value.trim() || manifest.latest.version;
    const old = {};
    ((manifest.web && manifest.web.files) || []).forEach(f => old[f.path] = f);
    const files = staged.map(f => {
      const short = f.sha256.slice(0, 2);
      const rel = `files/${short}/${f.sha256}`;
      const mirrors = [GH.rawBase() + 'updates/' + rel, GH.cdnBase() + 'updates/' + rel];
      const extra = $(`[data-mirror="${staged.filter(x => x.status !== 'same').indexOf(f)}"]`);
      if (extra && extra.value.trim()) mirrors.push(extra.value.trim());
      return { path: f.path, sha256: f.sha256, size: f.size, url: rel, mirrors };
    });
    const changed = staged.filter(f => f.status !== 'same');
    const m = JSON.parse(JSON.stringify(manifest));
    m.schema = 1;
    m.app = 'sevasagar';
    m.channel = $('#rel-channel').value;
    m.latest = {
      version: versionName,
      versionCode: (m.shell && m.shell.versionCode) || 1,
      web: webVersion,
      published: new Date().toISOString(),
      mandatory: $('#rel-mandatory').checked,
      size: changed.reduce((a, f) => a + f.size, 0),
      notes: {
        hi: $('#rel-hi').value.trim(), en: $('#rel-en').value.trim(),
        pa: $('#rel-pa').value.trim(), hr: $('#rel-hr').value.trim()
      }
    };
    m.web = {
      version: webVersion,
      base: GH.pagesBase() + 'updates/',
      files,
      deleted: staged._deleted || []
    };
    m.history = [{ web: webVersion, version: versionName, at: m.latest.published, files: changed.length, bytes: m.latest.size }]
      .concat(m.history || []).slice(0, 20);
    return { m, changed };
  }

  async function doPublish() {
    if (busy) return;
    if (!staged.length) { toast('Stage the app files first', 'err'); return; }
    const { m, changed } = buildManifest();
    if (!changed.length) { toast('Nothing changed — no update needed', 'err'); return; }
    setBusy(true);
    $('#publish-log').hidden = false;
    log('#publish-log', 'Publishing content v' + m.web.version + '…');
    try {
      const entries = [];
      changed.forEach(f => {
        const short = f.sha256.slice(0, 2);
        entries.push({ path: UP + `files/${short}/${f.sha256}`, base64: f.base64 });
      });
      entries.push({ path: MAN, base64: GH.textToBase64(JSON.stringify(m, null, 2)) });
      entries.push({ path: HIST + 'v' + m.web.version + '.json', base64: GH.textToBase64(JSON.stringify(m, null, 2)) });
      const c = await GH.publish(entries,
        `release: content v${m.web.version} (${m.latest.version}) — ${changed.length} files`,
        s => log('#publish-log', '· ' + s, true));
      manifest = m;
      renderDash();
      renderHistory();
      $('#man-edit').value = JSON.stringify(m, null, 2);
      log('#publish-log', `\n✅ Published. Commit ${c.sha.slice(0, 7)}\n\nUniversal URL:\n${GH.manifestUrls()[0]}\n\n` +
        `GitHub Pages rebuilds in ~30–60 s. Devices see it on next open (or within 6 h).`, true);
      toast('Update published 🚀', 'ok');
      staged.forEach(f => { if (f.status !== 'same') f.status = 'same'; });
      computeDiff();
      $('#rel-web').value = m.web.version + 1;
    } catch (e) {
      log('#publish-log', '❌ ' + e.message, true);
      toast(e.message, 'err');
    }
    setBusy(false);
  }

  function dryRun() {
    if (!staged.length) { toast('Stage files first', 'err'); return; }
    const { m, changed } = buildManifest();
    modal(`<h3>Manifest preview</h3>
      <p class="muted">${changed.length} files · ${bytes(changed.reduce((a, f) => a + f.size, 0))} to download</p>
      <div class="box mono" style="max-height:52vh">${esc(JSON.stringify(m, null, 2))}</div>
      <div class="row-btn"><button class="btn" onclick="document.getElementById('modal-root').innerHTML=''">Close</button></div>`);
  }

  /* ─────────────── APK ─────────────── */
  async function stageApk(file) {
    apkFile = file;
    const buf = await file.arrayBuffer();
    apkFile._sha = await GH.sha256Hex(buf);
    apkFile._b64 = GH.bufToBase64(buf);
    $('#apk-info').innerHTML = `<b>${esc(file.name)}</b> · ${bytes(buf.byteLength)} ·
      <span class="mono">${apkFile._sha.slice(0, 24)}…</span>`;
    const guess = (file.name.match(/v?(\d+\.\d+\.\d+)/) || [])[1];
    if (guess && !$('#apk-name').value) {
      $('#apk-name').value = guess;
      $('#apk-tag').value = 'v' + guess;
      $('#apk-code').value = ((manifest.shell && manifest.shell.versionCode) || 1) + 1;
    }
  }

  async function publishApk() {
    if (!apkFile) { toast('Choose the signed APK first', 'err'); return; }
    const version = $('#apk-name').value.trim();
    const code = +$('#apk-code').value || 0;
    const tag = $('#apk-tag').value.trim() || ('v' + version);
    if (!version || !code) { toast('Version name and code are required', 'err'); return; }
    setBusy(true);
    log('#apk-log', 'Uploading installer…');
    try {
      const fileName = `SevaSagar-v${version}.apk`;
      const entries = [{ path: DL + fileName, base64: apkFile._b64 }, { path: DL + 'SevaSagar.apk', base64: apkFile._b64 }];
      const m = JSON.parse(JSON.stringify(manifest));
      m.shell = {
        version, versionCode: code, mandatory: $('#apk-mandatory').checked,
        apk: {
          url: GH.pagesBase() + 'downloads/' + fileName,
          size: apkFile.size, sha256: apkFile._sha,
          mirrors: [GH.rawBase() + 'downloads/' + fileName,
                    `https://github.com/${GH.conf().repo}/releases/download/${tag}/${fileName}`]
        }
      };
      m.latest.version = version;
      m.latest.versionCode = code;
      m.latest.published = new Date().toISOString();
      if ($('#apk-notes').value.trim()) {
        m.latest.notes = Object.assign({}, m.latest.notes, { hi: $('#apk-notes').value.trim(), en: $('#apk-notes').value.trim() });
      }
      entries.push({ path: MAN, base64: GH.textToBase64(JSON.stringify(m, null, 2)) });
      const c = await GH.publish(entries, `release: installer v${version} (code ${code})`,
        s => log('#apk-log', '· ' + s, true));
      log('#apk-log', 'Creating GitHub release…', true);
      try {
        await GH.createRelease(tag, 'Seva Sagar v' + version,
          ($('#apk-notes').value || '') +
          `\n\n**Direct download:** ${GH.pagesBase() + 'downloads/' + fileName}\n` +
          `\nSHA-256: \`${apkFile._sha}\`\n\nInstall over the existing app — your encrypted diary is preserved.`);
        log('#apk-log', '· release created', true);
      } catch (e) { log('#apk-log', '· release skipped: ' + e.message, true); }
      manifest = m;
      renderDash();
      $('#man-edit').value = JSON.stringify(m, null, 2);
      log('#apk-log', `\n✅ Installer live:\n${GH.pagesBase() + 'downloads/' + fileName}\n\n` +
        `Devices on an older version code will offer the install automatically.`, true);
      toast('Installer published', 'ok');
    } catch (e) {
      log('#apk-log', '❌ ' + e.message, true);
      toast(e.message, 'err');
    }
    setBusy(false);
  }

  /* ─────────────── broadcast ─────────────── */
  async function broadcast(clear) {
    setBusy(true);
    log('#bc-log', clear ? 'Clearing announcement…' : 'Sending announcement…');
    try {
      const m = JSON.parse(JSON.stringify(manifest));
      if (clear) m.announcement = null;
      else {
        const title = $('#bc-title').value.trim();
        const body = $('#bc-body').value.trim();
        if (!title || !body) { toast('Title and message are required', 'err'); setBusy(false); return; }
        m.announcement = {
          id: 'a' + Date.now().toString(36),
          title, body,
          route: $('#bc-route').value,
          channel: $('#bc-channel').value,
          priority: $('#bc-priority').value,
          until: Date.now() + (+$('#bc-days').value || 7) * 86400000,
          at: new Date().toISOString()
        };
      }
      await GH.publish([{ path: MAN, base64: GH.textToBase64(JSON.stringify(m, null, 2)) }],
        clear ? 'announcement: cleared' : 'announcement: ' + m.announcement.title,
        s => log('#bc-log', '· ' + s, true));
      manifest = m;
      renderDash();
      $('#man-edit').value = JSON.stringify(m, null, 2);
      log('#bc-log', clear ? '\n✅ Cleared.' : '\n✅ Sent. Every device shows it on its next check (app open, or within 6 h).', true);
      toast(clear ? 'Announcement cleared' : 'Announcement sent 📣', 'ok');
    } catch (e) { log('#bc-log', '❌ ' + e.message, true); toast(e.message, 'err'); }
    setBusy(false);
  }

  /* ─────────────── history ─────────────── */
  async function renderHistory() {
    const host = $('#hist-list');
    host.innerHTML = '<p class="muted">loading…</p>';
    try {
      const items = await GH.listDir(HIST);
      const vers = items.filter(x => /^v\d+\.json$/.test(x.name))
        .map(x => ({ n: +x.name.slice(1, -5), name: x.name })).sort((a, b) => b.n - a.n);
      if (!vers.length) { host.innerHTML = '<p class="muted">No published versions yet.</p>'; return; }
      host.innerHTML = vers.map(v => {
        const h = (manifest.history || []).find(x => x.web === v.n) || {};
        const isCur = manifest.web.version === v.n;
        return `<div class="hitem"><div class="b"><div class="t">Content v${v.n} ${isCur ? '<span class="chip">LIVE</span>' : ''}</div>
          <div class="s">${esc(h.version || '')} · ${h.files != null ? h.files + ' files · ' + bytes(h.bytes) : ''}
          ${h.at ? ' · ' + new Date(h.at).toLocaleString() : ''}</div></div>
          ${isCur ? '' : `<button class="btn sm" data-rollback="${v.n}">Roll back to this</button>`}</div>`;
      }).join('');
      $$('[data-rollback]').forEach(b => b.onclick = () => rollback(+b.getAttribute('data-rollback')));
    } catch (e) { host.innerHTML = '<p class="err">' + esc(e.message) + '</p>'; }
  }

  async function rollback(n) {
    if (!confirm('Roll every device back to content v' + n + '?\nA new version number will be published so devices pick it up.')) return;
    setBusy(true);
    try {
      const old = await GH.readJson(HIST + 'v' + n + '.json');
      if (!old) throw new Error('snapshot not found');
      const m = JSON.parse(JSON.stringify(manifest));
      const next = (m.web.version || 1) + 1;
      m.web = { version: next, base: GH.pagesBase() + 'updates/', files: old.web.files, deleted: [] };
      m.latest = Object.assign({}, m.latest, {
        web: next, version: (old.latest && old.latest.version) || m.latest.version,
        published: new Date().toISOString(), mandatory: true,
        notes: { hi: 'पिछले स्थिर वर्शन पर वापसी (v' + n + ')', en: 'Rolled back to stable content v' + n }
      });
      m.history = [{ web: next, version: m.latest.version, at: m.latest.published, rollbackOf: n }]
        .concat(m.history || []).slice(0, 20);
      await GH.publish([
        { path: MAN, base64: GH.textToBase64(JSON.stringify(m, null, 2)) },
        { path: HIST + 'v' + next + '.json', base64: GH.textToBase64(JSON.stringify(m, null, 2)) }
      ], `rollback: content v${next} = snapshot v${n}`);
      manifest = m;
      renderDash(); renderHistory();
      $('#man-edit').value = JSON.stringify(m, null, 2);
      toast('Rolled back — published as v' + next, 'ok');
    } catch (e) { toast(e.message, 'err'); }
    setBusy(false);
  }

  /* ─────────────── wiring ─────────────── */
  function bindDrop(zone, input, handler) {
    const z = $(zone);
    ['dragenter', 'dragover'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.remove('over'); }));
    z.addEventListener('drop', async e => {
      const items = e.dataTransfer.items;
      if (items && items.length && items[0].webkitGetAsEntry) {
        const files = [];
        const walk = async (entry, prefix) => {
          if (entry.isFile) {
            const f = await new Promise(res => entry.file(res));
            f._rel = prefix + entry.name;
            files.push(f);
          } else if (entry.isDirectory) {
            const reader = entry.createReader();
            const entries = await new Promise(res => reader.readEntries(res));
            for (const en of entries) await walk(en, prefix + entry.name + '/');
          }
        };
        const roots = [];
        for (const it of items) { const en = it.webkitGetAsEntry(); if (en) roots.push(en); }
        for (const en of roots) await walk(en, '');
        if (files.length) return handler(files);
      }
      handler([...e.dataTransfer.files]);
    });
    $(input).addEventListener('change', e => handler([...e.target.files]));
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#btn-connect').onclick = () => connect($('#in-token').value.trim(), $('#in-repo').value.trim(),
      $('#in-branch').value.trim() || 'main', $('#in-pass').value).catch(() => {});
    $('#btn-settings').onclick = () => {
      $('#view-main').hidden = true;
      $('#view-connect').hidden = false;
      $('#in-token').value = '';
    };
    $('#btn-theme').onclick = () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('seva.admin.theme', next);
    };
    const savedTheme = localStorage.getItem('seva.admin.theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

    $$('.tab').forEach(t => t.onclick = () => {
      $$('.tab').forEach(x => x.classList.toggle('is-on', x === t));
      const v = t.getAttribute('data-v');
      $$('.pane').forEach(p => p.hidden = p.id !== 'pane-' + v);
      if (v === 'history') renderHistory();
      if (v === 'dash') renderDash();
    });

    bindDrop('#drop', '#file-input', stageFiles);
    $('#drop-apk') && bindDrop('#drop-apk', '#apk-input', fs => fs[0] && stageApk(fs[0]));
    $('#pick-files').onclick = () => $('#file-input').click();
    $('#pick-dir').onclick = () => $('#dir-input').click();
    $('#dir-input').addEventListener('change', e => stageFiles([...e.target.files]));
    $('#pick-apk').onclick = () => $('#apk-input').click();
    $('#load-bundle').onclick = loadFromRepo;
    $('#btn-publish').onclick = doPublish;
    $('#btn-dry').onclick = dryRun;
    $('#btn-apk').onclick = publishApk;
    $('#btn-broadcast').onclick = () => broadcast(false);
    $('#btn-bc-clear').onclick = () => broadcast(true);
    $('#btn-man-validate').onclick = () => {
      try {
        const m = JSON.parse($('#man-edit').value);
        if (!m.web || !Array.isArray(m.web.files)) throw new Error('web.files[] missing');
        log('#man-log', '✅ Valid · content v' + m.web.version + ' · ' + m.web.files.length + ' files');
        toast('Manifest is valid', 'ok');
      } catch (e) { log('#man-log', '❌ ' + e.message); toast(e.message, 'err'); }
    };
    $('#btn-man-save').onclick = async () => {
      setBusy(true);
      try {
        const m = JSON.parse($('#man-edit').value);
        await GH.publish([{ path: MAN, base64: GH.textToBase64(JSON.stringify(m, null, 2)) }], 'manifest: manual edit');
        manifest = m; renderDash();
        log('#man-log', '✅ Saved.');
        toast('Manifest saved', 'ok');
      } catch (e) { log('#man-log', '❌ ' + e.message); toast(e.message, 'err'); }
      setBusy(false);
    };
    $$('[data-copy]').forEach(b => b.onclick = () => {
      navigator.clipboard.writeText($(b.getAttribute('data-copy')).textContent);
      toast('Copied', 'ok');
    });
    restore();
  });
})();
