/* GitHub client for the Seva Sagar control panel.
   Everything runs in the browser: Git Data API for atomic multi-file commits,
   Contents API for reads, Releases API for the installer. No backend, ever. */
(function () {
  'use strict';
  const API = 'https://api.github.com';
  let cfg = { token: '', repo: 'glitchyapi/seva-sagar', branch: 'main' };

  function init(c) { cfg = Object.assign(cfg, c); }
  function conf() { return Object.assign({}, cfg); }
  function owner() { return cfg.repo.split('/')[0]; }
  function name() { return cfg.repo.split('/')[1]; }

  async function req(path, method, body, extra) {
    const url = path.startsWith('http') ? path : API + path;
    const res = await fetch(url, Object.assign({
      method: method || 'GET',
      headers: Object.assign({
        'Authorization': 'Bearer ' + cfg.token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    }, extra || {}));
    const txt = await res.text();
    let data = null;
    try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = { raw: txt }; }
    if (!res.ok) {
      const msg = (data && (data.message || data.raw)) || res.statusText;
      const err = new Error(msg + ' (' + res.status + ')');
      err.status = res.status; err.data = data;
      throw err;
    }
    return data;
  }

  const me = () => req('/user');
  const repoInfo = () => req(`/repos/${cfg.repo}`);
  const ref = () => req(`/repos/${cfg.repo}/git/ref/heads/${cfg.branch}`);
  const commitOf = sha => req(`/repos/${cfg.repo}/git/commits/${sha}`);
  const tree = (sha, recursive) => req(`/repos/${cfg.repo}/git/trees/${sha}${recursive ? '?recursive=1' : ''}`);
  const blob = (base64) => req(`/repos/${cfg.repo}/git/blobs`, 'POST', { content: base64, encoding: 'base64' });

  /** One atomic commit containing every file change. */
  async function publish(entries, message, onStep) {
    const step = onStep || function () {};
    step('reading branch head…');
    const r = await ref();
    const headSha = r.object.sha;
    const head = await commitOf(headSha);
    const baseTree = head.tree.sha;

    const treeItems = [];
    let i = 0;
    for (const e of entries) {
      i++;
      if (e.delete) {
        treeItems.push({ path: e.path, mode: '100644', type: 'blob', sha: null });
        step(`remove ${e.path} (${i}/${entries.length})`);
        continue;
      }
      step(`upload ${e.path} (${i}/${entries.length})`);
      const b = await blob(e.base64);
      treeItems.push({ path: e.path, mode: '100644', type: 'blob', sha: b.sha });
    }
    step('creating tree…');
    const t = await req(`/repos/${cfg.repo}/git/trees`, 'POST', { base_tree: baseTree, tree: treeItems });
    step('creating commit…');
    const c = await req(`/repos/${cfg.repo}/git/commits`, 'POST', {
      message, tree: t.sha, parents: [headSha]
    });
    step('moving branch pointer…');
    await req(`/repos/${cfg.repo}/git/refs/heads/${cfg.branch}`, 'PATCH', { sha: c.sha, force: false });
    step('done · ' + c.sha.slice(0, 7));
    return c;
  }

  async function readText(path) {
    try {
      const d = await req(`/repos/${cfg.repo}/contents/${path}?ref=${cfg.branch}&t=${Date.now()}`);
      if (Array.isArray(d)) return null;
      return decodeURIComponent(escape(atob(d.content.replace(/\n/g, ''))));
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  }
  async function readJson(path) {
    const t = await readText(path);
    return t ? JSON.parse(t) : null;
  }
  async function listDir(path) {
    try {
      const d = await req(`/repos/${cfg.repo}/contents/${path}?ref=${cfg.branch}`);
      return Array.isArray(d) ? d : [];
    } catch (e) { if (e.status === 404) return []; throw e; }
  }

  async function createRelease(tag, nameTag, body) {
    try {
      return await req(`/repos/${cfg.repo}/releases`, 'POST', {
        tag_name: tag, name: nameTag, body, draft: false, prerelease: false, target_commitish: cfg.branch
      });
    } catch (e) {
      if (e.status === 422) {
        return await req(`/repos/${cfg.repo}/releases/tags/${encodeURIComponent(tag)}`);
      }
      throw e;
    }
  }

  /* ---------- crypto helpers ---------- */
  async function sha256Hex(buf) {
    const h = await crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function bufToBase64(buf) {
    const bytes = new Uint8Array(buf);
    let s = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(s);
  }
  const textToBase64 = t => bufToBase64(new TextEncoder().encode(t));

  async function deriveKey(pass, salt) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function encryptToken(token, pass) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pass, salt);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token));
    const out = new Uint8Array(28 + ct.byteLength);
    out.set(salt, 0); out.set(iv, 16); out.set(new Uint8Array(ct), 28);
    return 'enc:' + bufToBase64(out.buffer);
  }
  async function decryptToken(packed, pass) {
    const raw = Uint8Array.from(atob(packed.slice(4)), c => c.charCodeAt(0));
    const key = await deriveKey(pass, raw.slice(0, 16));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(16, 28) }, key, raw.slice(28));
    return new TextDecoder().decode(pt);
  }

  /* ---------- url helpers ---------- */
  function pagesBase() { return `https://${owner()}.github.io/${name()}/`; }
  function rawBase() { return `https://raw.githubusercontent.com/${cfg.repo}/${cfg.branch}/docs/`; }
  function cdnBase() { return `https://cdn.jsdelivr.net/gh/${cfg.repo}@${cfg.branch}/docs/`; }
  function manifestUrls() {
    return [pagesBase() + 'updates/manifest.json', rawBase() + 'updates/manifest.json', cdnBase() + 'updates/manifest.json'];
  }

  window.GH = {
    init, conf, req, me, repoInfo, ref, commitOf, tree, blob, publish,
    readText, readJson, listDir, createRelease,
    sha256Hex, bufToBase64, textToBase64, encryptToken, decryptToken,
    pagesBase, rawBase, cdnBase, manifestUrls, owner, name
  };
})();
