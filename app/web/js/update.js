/* ══════════════════════════════════════════════════════════════
   Seva Sagar · OTA — universal manifest reader + delta patcher
   The app only READS a public JSON URL. Publishing happens in the
   admin panel; no server of ours is ever required.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var S = window.Seva, U = S.u, t = function (k, v) { return S.t(k, v); };
  var I = function (n, s) { return UI.icon(n, s); };

  var DEFAULT_SOURCES = [
    'https://glitchyapi.github.io/seva-sagar/updates/manifest.json',
    'https://raw.githubusercontent.com/glitchyapi/seva-sagar/main/docs/updates/manifest.json',
    'https://cdn.jsdelivr.net/gh/glitchyapi/seva-sagar@main/docs/updates/manifest.json'
  ];

  var st = {
    checking: false, available: false, apkAvailable: false, mandatory: false,
    manifest: null, plan: null, error: null, progress: 0, phase: 'idle',
    files: [], doneFiles: 0, bytes: 0, total: 0, lastCheck: 0, sheet: null
  };

  function sources() {
    var custom = (S.db.settings.updateUrls || []).filter(Boolean);
    return custom.length ? custom.concat(DEFAULT_SOURCES) : DEFAULT_SOURCES.slice();
  }

  /* ── check ─────────────────────────────────────────────── */
  function check(manual) {
    if (st.checking) return Promise.resolve(st);
    st.checking = true; st.error = null; st.phase = 'checking';
    paint();
    if (!S.native) {
      return browserCheck(manual).then(function () { st.checking = false; paint(); return st; });
    }
    return new Promise(function (resolve) {
      setTimeout(function () {
        var r = S.N.j('updateCheck', { urls: sources(), timeout: 15000 });
        st.checking = false;
        S.db.settings.lastCheck = Date.now();
        st.lastCheck = S.db.settings.lastCheck;
        S.save();
        if (!r.ok || !r.manifest) {
          st.error = r.error || ('HTTP ' + (r.status || 0));
          st.phase = 'error';
          if (manual) UI.toast(t('update.failed') + ' · ' + st.error, 'err');
          paint(); resolve(st); return;
        }
        var m = r.manifest;
        st.manifest = m;
        var latest = m.latest || {};
        var webTarget = (m.web && m.web.version) || latest.web || 0;
        var shell = m.shell || {};
        st.mandatory = !!latest.mandatory;

        var plan = S.N.call('updatePlan', JSON.stringify(m));
        if (plan.ok) {
          st.plan = plan;
          st.available = webTarget > (S.info.webVersion || 1) || (plan.changed && plan.changed.length > 0 && webTarget > plan.current);
          st.files = plan.changed || [];
          st.total = plan.bytes || 0;
        }
        st.apkAvailable = (shell.versionCode || 0) > (S.info.versionCode || 1);
        st.phase = st.available || st.apkAvailable ? 'available' : 'latest';
        handleAnnouncement(m.announcement);

        if (st.available || st.apkAvailable) {
          if (S.db.settings.notifyUpdates) pushNotification(latest, plan);
          showBanner(latest);
          if (S.db.settings.autoUpdate && st.available && !st.apkAvailable) {
            setTimeout(function () { apply(true); }, 900);
          }
        } else if (manual) UI.toast(t('update.latest'), 'ok');
        paint();
        resolve(st);
      }, 30);
    });
  }

  function browserCheck(manual) {
    return new Promise(function (resolve) {
      var ctl = new AbortController();
      var to = setTimeout(function () { ctl.abort(); }, 8000);
      fetch(sources()[0] + '?t=' + Date.now(), { signal: ctl.signal, cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (m) {
          clearTimeout(to);
          st.manifest = m;
          var wv = (m.web && m.web.version) || 1;
          st.available = wv > 1;
          st.phase = st.available ? 'available' : 'latest';
          st.files = (m.web && m.web.files) || [];
          st.total = st.files.reduce(function (a, f) { return a + (f.size || 0); }, 0);
          resolve();
        })
        .catch(function (e) {
          clearTimeout(to);
          st.error = String(e.message || e);
          st.phase = 'error';
          resolve();
        });
    });
  }

  /* admin-pushed announcement -> real device notification, once per id */
  function handleAnnouncement(a) {
    if (!a || !a.id) return;
    if (a.until && Date.now() > a.until) return;
    if (S.db.meta.lastAnnouncement === a.id) return;
    S.db.meta.lastAnnouncement = a.id;
    S.save();
    if (S.native) {
      S.N.j('notify', {
        id: 4800, channel: a.channel || 'bhandara', title: a.title, body: a.body,
        big: a.body, route: a.route || 'home',
        actions: [{ id: 'open', title: t('common.ok'), route: a.route || 'home' }]
      });
    }
    UI.dialog({
      icon: 'sparkle', title: a.title, msg: a.body,
      actions: [
        { label: t('common.close') },
        { label: t('common.ok'), kind: 'primary', onClick: function () {
            if (a.route === 'update') open(); else UI.go(a.route || 'home');
          } }
      ]
    });
  }

  function pushNotification(latest, plan) {
    if (!S.native) return;
    var notes = pickNotes(latest.notes);
    S.N.j('notify', {
      id: 4700, channel: 'updates', title: t('update.available') + ' · v' + (latest.version || ''),
      body: notes || t('update.onlyChanged'), big: notes,
      route: 'update',
      actions: [{ id: 'open', title: t('update.now'), route: 'update' }]
    });
  }
  function pickNotes(n) {
    if (!n) return '';
    if (typeof n === 'string') return n;
    return n[S.i18n.get()] || n.hi || n.en || '';
  }

  /* ── banner ────────────────────────────────────────────── */
  function showBanner(latest) {
    var el = document.getElementById('update-banner');
    if (!el) return;
    el.hidden = false;
    el.innerHTML = '<span class="set-i">' + I('cloudDown', 18) + '</span>' +
      '<span class="u-b"><span class="u-t">' + t('update.available') + '</span>' +
      '<span class="u-s">v' + U.esc(latest.version || '') + ' · ' + U.bytes(st.total) + '</span></span>' +
      '<button class="btn sm primary" id="ub-go">' + t('update.now') + '</button>' +
      '<button class="icon-btn" id="ub-x" style="width:32px;height:32px">' + I('x', 15) + '</button>';
    requestAnimationFrame(function () { el.classList.add('is-in'); });
    el.querySelector('#ub-go').onclick = function () { hideBanner(); open(); };
    el.querySelector('#ub-x').onclick = hideBanner;
  }
  function hideBanner() {
    var el = document.getElementById('update-banner');
    if (!el) return;
    el.classList.remove('is-in');
    setTimeout(function () { el.hidden = true; }, 420);
  }

  /* ── apply patch ───────────────────────────────────────── */
  function apply(auto) {
    if (!S.native) { UI.toast('Android only'); return; }
    if (!st.plan) { UI.toast(t('update.noChange')); return; }
    st.phase = 'downloading'; st.progress = 0; st.doneFiles = 0; st.bytes = 0;
    hideBanner(); paint();
    var r = S.N.j('updateApply', { plan: st.plan, manifest: st.manifest, notify: true });
    if (!r.ok) { st.phase = 'error'; st.error = r.error; paint(); }
  }

  S.events.on('patch_start', function (d) {
    st.phase = 'downloading'; st.files = st.plan ? st.plan.changed : []; st.total = d.bytes || st.total;
    paint();
  });
  S.events.on('patch_progress', function (d) {
    if (d.total) st.total = d.total;
    st.bytes = d.bytes || 0;
    st.progress = st.total ? Math.min(99, Math.round(st.bytes * 100 / st.total)) : 0;
    paintProgress();
  });
  S.events.on('patch_file', function (d) {
    st.doneFiles = d.index; st.bytes = d.bytes;
    st.progress = st.total ? Math.min(99, Math.round(st.bytes * 100 / st.total)) :
      Math.round(d.index * 100 / Math.max(1, d.files));
    st.currentFile = d.path;
    paintProgress();
  });
  S.events.on('patch_error', function (d) {
    st.phase = 'error'; st.error = d.error; paint();
    UI.toast(t('update.failed'), 'err');
  });
  S.events.on('patch_done', function (d) {
    st.phase = 'done'; st.progress = 100; st.available = false;
    var hist = S.db.meta.updateHistory || [];
    hist.unshift({ web: d.target, from: d.from, files: d.files, bytes: d.bytes, at: Date.now() });
    S.db.meta.updateHistory = hist.slice(0, 12);
    S.save(true);
    paint();
    UI.dialog({
      icon: 'check', title: t('update.done'),
      msg: 'v' + d.target + ' · ' + d.files + ' ' + t('update.files') + ' · ' + U.bytes(d.bytes),
      actions: [
        { label: t('update.later'), onClick: function () { } },
        { label: t('update.restart'), kind: 'primary', onClick: function () { S.N.call('restart'); } }
      ]
    });
  });

  /* ── APK ───────────────────────────────────────────────── */
  function downloadApk() {
    if (!S.native || !st.manifest) return;
    var shell = st.manifest.shell || {};
    var apk = shell.apk || {};
    var urls = (apk.mirrors || []).slice();
    if (apk.url) urls.unshift(apk.url);
    if (!urls.length) { UI.toast(t('update.failed'), 'err'); return; }
    st.phase = 'apk-downloading'; st.progress = 0; paint();
    S.N.j('apkDownload', { urls: urls, sha256: apk.sha256 || '', version: shell.version || '', notify: true });
  }
  S.events.on('apk_progress', function (d) {
    st.progress = d.percent || 0; st.bytes = d.bytes; st.total = d.total; paintProgress();
  });
  S.events.on('apk_error', function (d) { st.phase = 'error'; st.error = d.error; paint(); UI.toast(t('update.failed'), 'err'); });
  S.events.on('apk_done', function (d) {
    st.phase = 'apk-ready'; st.progress = 100; paint();
    UI.dialog({
      icon: 'download', title: t('update.install') + ' v' + d.version,
      msg: t('update.apkNote'),
      actions: [
        { label: t('update.later') },
        { label: t('update.install'), kind: 'primary', onClick: installApk }
      ]
    });
  });
  function installApk() {
    var r = S.N.call('apkInstall');
    if (!r.ok && r.needSettings) {
      UI.dialog({
        icon: 'shield', title: t('update.permission'), msg: t('perm.installSub'),
        actions: [{ label: t('common.cancel') },
        { label: t('perm.open'), kind: 'primary', onClick: function () { S.N.call('openSettings', 'install'); } }]
      });
    } else if (!r.ok) UI.toast(r.error || t('common.error'), 'err');
  }

  /* ── UI ────────────────────────────────────────────────── */
  function open() {
    var sh = UI.sheet({ title: t('update.title'), body: '<div id="upd-body"></div>', onClose: function () { st.sheet = null; } });
    st.sheet = sh;
    paint();
    if (!st.manifest && !st.checking) check(false);
  }

  function paint() {
    if (!st.sheet) return;
    var host = st.sheet.el.querySelector('#upd-body');
    if (!host) return;
    var i = S.info, m = st.manifest || {}, latest = m.latest || {}, shell = m.shell || {};
    var phase = st.phase;

    var statusCard =
      '<div class="card tight"><div class="card-h">' +
        '<div><div class="card-t">' + t('update.current') + '</div>' +
        '<div class="card-s">' + t('update.shell') + ' v' + U.esc(i.versionName || '1.0.0') +
        ' · ' + t('update.web') + ' v' + (i.webVersion || 1) + '</div></div>' +
        '<span class="badge ' + (st.available || st.apkAvailable ? '' : 'grey') + '">' +
        (phase === 'checking' ? t('update.checking') : st.available || st.apkAvailable ? 'NEW' : 'LATEST') + '</span>' +
      '</div>' + statusBody() + '</div>';

    var notes = pickNotes(latest.notes);
    var notesCard = (st.available || st.apkAvailable) && notes ?
      '<div class="card tight"><div class="card-h"><div class="card-t">' + t('update.notes') + '</div>' +
      '<span class="pill ac">v' + U.esc(latest.version || shell.version || '') + '</span></div>' +
      '<div style="font-size:13px;line-height:1.6;color:var(--text-2);white-space:pre-line">' + U.esc(notes) + '</div></div>' : '';

    var apkCard = st.apkAvailable ?
      '<div class="card tight" style="border-color:color-mix(in srgb,var(--ac) 40%,transparent)">' +
      '<div class="card-h"><div class="card-t">' + t('update.apk') + ' · v' + U.esc(shell.version || '') + '</div>' +
      '<span class="badge">' + U.bytes((shell.apk || {}).size || 0) + '</span></div>' +
      '<div class="card-s" style="margin-bottom:12px">' + t('update.apkNote') + '</div>' +
      (phase === 'apk-downloading' ? progressHtml() :
        phase === 'apk-ready' ? '<button class="btn primary block" id="u-inst">' + I('download', 18) + t('update.install') + '</button>'
          : '<button class="btn primary block" id="u-apk">' + I('cloudDown', 18) + t('update.now') + '</button>') +
      '</div>' : '';

    var settings =
      '<div class="sec-t">' + t('profile.settings') + '</div><div class="set-group">' +
      toggleRow('auto', 'refresh', t('update.auto'), t('update.autoSub'), S.db.settings.autoUpdate) +
      toggleRow('notify', 'bell', t('update.notify'), t('update.notifySub'), S.db.settings.notifyUpdates) +
      '</div>';

    var hist = S.db.meta.updateHistory || [];
    var histCard = hist.length ? '<div class="sec-t">' + t('update.history') + '</div><div class="card tight">' +
      hist.map(function (h) {
        return '<div class="kv"><span class="k">v' + h.from + ' → v' + h.web + '</span>' +
          '<span class="v">' + h.files + ' ' + t('update.files') + ' · ' + U.bytes(h.bytes) + '</span></div>';
      }).join('') + '</div>' : '';

    var adv = '<div class="sec-t">' + t('update.advanced') + '</div><div class="set-group">' +
      btnRow('link', t('update.source'), sources()[0], 'src') +
      btnRow('undo', t('update.rollback'), '', 'rollback') +
      btnRow('refresh', t('update.reset'), '', 'reset') +
      '</div>' +
      '<div class="card tight"><div class="card-s">' + t('update.lastCheck') + ': ' +
      (S.db.settings.lastCheck ? U.timeAgo(S.db.settings.lastCheck, t) : '—') + '</div></div>';

    host.innerHTML = statusCard + notesCard + apkCard + settings + histCard + adv;
    UI.paint(host);

    bind(host, '#u-check', function () { check(true); });
    bind(host, '#u-apply', function () { apply(false); });
    bind(host, '#u-apk', downloadApk);
    bind(host, '#u-inst', installApk);
    bind(host, '#u-restart', function () { S.N.call('restart'); });
    bind(host, '[data-tg]', function (el) {
      var k = el.getAttribute('data-tg') === 'auto' ? 'autoUpdate' : 'notifyUpdates';
      S.db.settings[k] = !S.db.settings[k]; S.save(); paint();
    });
    bind(host, '[data-adv]', function (el) {
      var k = el.getAttribute('data-adv');
      if (k === 'src') return sourceSheet();
      if (k === 'rollback') {
        var r = S.N.call('updateRollback');
        if (r.ok) UI.dialog({ icon: 'undo', title: t('update.done'), msg: 'v' + r.active,
          actions: [{ label: t('update.restart'), kind: 'primary', onClick: function () { S.N.call('restart'); } }] });
        else UI.toast(t('common.error'), 'err');
      }
      if (k === 'reset') {
        UI.confirm(t('update.reset'), t('update.apkNote'), true).then(function (ok) {
          if (!ok) return;
          S.N.call('updateReset'); S.N.call('restart');
        });
      }
    });
  }

  function statusBody() {
    var p = st.phase;
    if (p === 'checking') return '<div class="prog indet"><i></i></div>' +
      '<div class="card-s" style="margin-top:10px">' + t('update.checking') + '</div>';
    if (p === 'error') return '<div class="card-s" style="color:var(--danger)">' +
      U.esc(st.error || t('common.error')) + '</div>' +
      '<button class="btn block sm" id="u-check" style="margin-top:10px">' + I('refresh', 16) + t('common.retry') + '</button>';
    if (p === 'downloading' || p === 'apk-downloading') return progressHtml();
    if (p === 'done') return '<div class="card-s" style="color:var(--ac);font-weight:700">' + t('update.done') + '</div>' +
      '<button class="btn primary block" id="u-restart" style="margin-top:10px">' + I('refresh', 18) + t('update.restart') + '</button>';
    if (st.available) {
      var n = (st.plan && st.plan.changed ? st.plan.changed.length : st.files.length) || 0;
      return '<div class="stats" style="margin:4px 0 12px">' +
        '<div class="stat ac"><div class="stat-n">' + n + '</div><div class="stat-l">' + t('update.files') + '</div></div>' +
        '<div class="stat"><div class="stat-n">' + U.bytes(st.total) + '</div><div class="stat-l">' + t('update.size') + '</div></div>' +
        '</div><div class="card-s" style="margin-bottom:12px">' + t('update.onlyChanged') +
        (st.mandatory ? ' · <b style="color:var(--warn)">' + t('update.mandatory') + '</b>' : '') + '</div>' +
        '<div class="btn-row"><button class="btn" id="u-check">' + I('refresh', 17) + t('update.check') + '</button>' +
        '<button class="btn primary" id="u-apply">' + I('cloudDown', 17) + t('update.now') + '</button></div>';
    }
    return '<div class="card-s" style="margin-bottom:12px">' + t('update.latest') + '</div>' +
      '<button class="btn block" id="u-check">' + I('refresh', 17) + t('update.check') + '</button>';
  }

  function progressHtml() {
    var files = (st.plan && st.plan.changed) || [];
    return '<div class="prog"><i style="width:' + st.progress + '%"></i></div>' +
      '<div class="kv" style="margin-top:8px"><span class="k">' +
      (st.phase === 'apk-downloading' ? t('update.apk') : t('update.downloading')) + '</span>' +
      '<span class="v" id="u-pct">' + st.progress + '% · ' + U.bytes(st.bytes) + '</span></div>' +
      (files.length ? '<div class="filelist" id="u-files">' + files.map(function (f, idx) {
        var cls = idx < st.doneFiles ? 'done' : idx === st.doneFiles ? 'active' : '';
        return '<div class="fitem ' + cls + '"><span>' + (idx < st.doneFiles ? '✓' : '•') + '</span>' +
          '<span class="fn">' + U.esc(f.path) + '</span><span>' + U.bytes(f.size) + '</span></div>';
      }).join('') + '</div>' : '');
  }

  function paintProgress() {
    if (!st.sheet) return;
    var bar = st.sheet.el.querySelector('.prog i');
    if (bar) bar.style.width = st.progress + '%';
    var pct = st.sheet.el.querySelector('#u-pct');
    if (pct) pct.textContent = st.progress + '% · ' + U.bytes(st.bytes);
    var list = st.sheet.el.querySelectorAll('#u-files .fitem');
    for (var i = 0; i < list.length; i++) {
      list[i].className = 'fitem ' + (i < st.doneFiles ? 'done' : i === st.doneFiles ? 'active' : '');
      list[i].firstChild.textContent = i < st.doneFiles ? '✓' : '•';
    }
  }

  function toggleRow(key, ico, title, sub, on) {
    return '<button class="set" data-tg="' + key + '" style="width:100%;text-align:left">' +
      '<span class="set-i">' + I(ico, 18) + '</span><span class="set-b"><span class="set-t">' + title + '</span>' +
      '<span class="set-s">' + sub + '</span></span>' +
      '<span class="switch' + (on ? ' is-on' : '') + '"><i></i></span></button>';
  }
  function btnRow(ico, title, sub, key) {
    return '<button class="set" data-adv="' + key + '" style="width:100%;text-align:left">' +
      '<span class="set-i">' + I(ico, 18) + '</span><span class="set-b"><span class="set-t">' + title + '</span>' +
      (sub ? '<span class="set-s mono">' + U.esc(String(sub).slice(0, 46)) + '…</span>' : '') + '</span>' +
      '<span class="chev">' + I('right', 16) + '</span></button>';
  }
  function bind(host, sel, fn) {
    host.querySelectorAll(sel).forEach(function (el) { el.onclick = function () { fn(el); }; });
  }

  function sourceSheet() {
    var urls = S.db.settings.updateUrls || [];
    UI.sheet({
      title: t('update.source'),
      body: '<div class="card tight"><div class="card-s">' + t('update.onlyChanged') + '</div></div>' +
        '<div class="field"><label class="label">JSON manifest URL</label>' +
        '<textarea class="textarea mono" id="src" style="min-height:110px">' +
        U.esc((urls.length ? urls : DEFAULT_SOURCES).join('\n')) + '</textarea></div>' +
        '<button class="btn primary block" id="ok">' + t('common.save') + '</button>',
      onMount: function (el, h) {
        el.querySelector('#ok').onclick = function () {
          S.db.settings.updateUrls = el.querySelector('#src').value.split('\n')
            .map(function (x) { return x.trim(); }).filter(Boolean);
          S.save(); h.close(); UI.toast(t('toast.saved'), 'ok'); check(true);
        };
      }
    });
  }

  window.Updates = {
    state: st, check: check, open: open, apply: apply,
    downloadApk: downloadApk, installApk: installApk,
    hideBanner: hideBanner, sources: sources, DEFAULT_SOURCES: DEFAULT_SOURCES
  };
})();
