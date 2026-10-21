/* ══════════════════════════════════════════════════════════════
   Seva Sagar · core — native bridge, encrypted store, state, utils
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var N = window.SevaNative || null;
  var isNative = !!(N && typeof N.info === 'function');

  /* ---------- event bus (native -> JS) ---------- */
  var listeners = {};
  window.SevaEvents = {
    on: function (type, fn) { (listeners[type] = listeners[type] || []).push(fn); return this; },
    off: function (type, fn) {
      var a = listeners[type] || []; var i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); return this;
    },
    emit: function (type, payload) {
      var data = payload;
      if (typeof payload === 'string') { try { data = JSON.parse(payload); } catch (e) { data = { raw: payload }; } }
      (listeners[type] || []).forEach(function (fn) { try { fn(data); } catch (e) { console.error(e); } });
      (listeners['*'] || []).forEach(function (fn) { try { fn(type, data); } catch (e) {} });
    }
  };

  /* ---------- bridge wrapper ---------- */
  function call(method) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (!isNative) return { ok: false, error: 'browser', browser: true };
    try {
      var r = N[method].apply(N, args);
      return typeof r === 'string' ? JSON.parse(r) : (r || { ok: true });
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  }
  function jcall(method, obj) { return call(method, JSON.stringify(obj || {})); }

  /* ---------- tiny LZ codec (browser preview only) ----------
     Native builds use DEFLATE-9 + AES-256-GCM inside the vault. */
  var LZ = {
    compress: function (s) {
      if (!s) return '';
      var dict = {}, out = [], phrase = s[0], code = 256, i, c;
      for (i = 1; i < s.length; i++) {
        c = s[i];
        if (dict[phrase + c] != null) phrase += c;
        else {
          out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
          dict[phrase + c] = code++; phrase = c;
        }
      }
      out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
      return out.map(function (n) { return String.fromCharCode(n); }).join('');
    },
    decompress: function (s) {
      if (!s) return '';
      var dict = {}, curr = s[0], old = curr, out = [curr], code = 256, i, entry, ch;
      for (i = 1; i < s.length; i++) {
        var cc = s.charCodeAt(i);
        entry = cc < 256 ? s[i] : (dict[cc] != null ? dict[cc] : old + old[0]);
        out.push(entry); ch = entry[0]; dict[code++] = old + ch; old = entry;
      }
      return out.join('');
    }
  };

  /* ---------- defaults ---------- */
  var SEVA_TYPES = [
    { id: 'naam',     icon: 'lotus',   unit: 'mala',   step: 1,  def: 1,  color: '#22C55E' },
    { id: 'satsang',  icon: 'play',    unit: 'minute', step: 5,  def: 30, color: '#38BDF8' },
    { id: 'path',     icon: 'book',    unit: 'page',   step: 1,  def: 5,  color: '#EAB308' },
    { id: 'bhandara', icon: 'hands',   unit: 'hour',   step: 1,  def: 2,  color: '#FF9A2E' },
    { id: 'prachar',  icon: 'megaphone', unit: 'count', step: 1, def: 1,  color: '#A78BFA' },
    { id: 'daan',     icon: 'gift',    unit: 'count',  step: 1,  def: 1,  color: '#FB7185' }
  ];

  function defaults() {
    return {
      v: 2,
      profile: { name: '', city: '', initiated: '', avatar: '' },
      settings: {
        lang: 'hi', theme: 'system', accent: 'green', haptics: true,
        dailyTarget: 5, autoUpdate: true, notifyUpdates: true, checkOnStart: true,
        updateUrls: [], reminderOn: false, reminderHour: 6, reminderMinute: 0,
        bhandaraAlerts: true, lastCheck: 0, devMode: false
      },
      sevas: [],
      bhandaras: [],
      meta: { created: Date.now(), updated: Date.now(), installs: 0 }
    };
  }

  /* ---------- state ---------- */
  var S = {
    native: isNative,
    N: { call: call, j: jcall, raw: N },
    events: window.SevaEvents,
    info: {},
    db: defaults(),
    types: SEVA_TYPES,
    stats: { raw: 0, stored: 0, ratio: 0 },
    ready: false,
    route: 'home'
  };
  window.Seva = S;

  S.type = function (id) {
    for (var i = 0; i < SEVA_TYPES.length; i++) if (SEVA_TYPES[i].id === id) return SEVA_TYPES[i];
    return SEVA_TYPES[SEVA_TYPES.length - 1];
  };

  /* ---------- persistence ---------- */
  var saveTimer = null, saving = false, pending = false;

  S.load = function () {
    var raw = null;
    if (isNative) {
      var r = call('vaultRead', 'db');
      if (r.ok && r.found) raw = r.data;
    } else {
      var enc = localStorage.getItem('seva.db.lz');
      if (enc) { try { raw = LZ.decompress(enc); } catch (e) { raw = null; } }
      if (!raw) raw = localStorage.getItem('seva.db');
    }
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        S.db = merge(defaults(), parsed);
      } catch (e) { console.warn('db parse failed', e); S.db = defaults(); }
    } else S.db = defaults();
    return S.db;
  };

  function merge(base, over) {
    for (var k in over) {
      if (!over.hasOwnProperty(k)) continue;
      if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) &&
          base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], over[k]);
      else base[k] = over[k];
    }
    return base;
  }

  S.save = function (immediate) {
    S.db.meta.updated = Date.now();
    if (immediate) return doSave();
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(doSave, 260);
  };

  function doSave() {
    if (saving) { pending = true; return; }
    saving = true;
    var json = JSON.stringify(S.db);
    var res;
    if (isNative) res = call('vaultWrite', 'db', json);
    else {
      var packed = LZ.compress(json);
      try { localStorage.setItem('seva.db.lz', packed); } catch (e) {}
      res = { ok: true, raw: json.length, stored: packed.length, ratio: 1 - packed.length / Math.max(1, json.length) };
    }
    if (res && res.ok) {
      S.stats.raw = res.raw; S.stats.stored = res.stored; S.stats.ratio = res.ratio;
    }
    saving = false;
    if (pending) { pending = false; doSave(); }
    S.events.emit('saved', res);
  }

  /* ---------- utilities ---------- */
  var U = S.u = {
    pad: function (n) { return n < 10 ? '0' + n : '' + n; },
    key: function (d) {
      d = d || new Date();
      return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate());
    },
    parseKey: function (k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); },
    today: function () { return U.key(new Date()); },
    addDays: function (d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; },
    uid: function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    bytes: function (n) {
      if (n == null) return '—';
      if (n < 1024) return n + ' B';
      if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
      return (n / 1048576).toFixed(2) + ' MB';
    },
    num: function (n) { return (n == null ? 0 : n).toLocaleString('en-IN'); },
    debounce: function (fn, ms) {
      var t; return function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms); };
    },
    clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
    timeAgo: function (ts, t) {
      var s = Math.floor((Date.now() - ts) / 1000);
      if (s < 60) return t('time.now');
      if (s < 3600) return Math.floor(s / 60) + ' ' + t('time.min');
      if (s < 86400) return Math.floor(s / 3600) + ' ' + t('time.hour');
      return Math.floor(s / 86400) + ' ' + t('time.day');
    }
  };

  /* ---------- seva helpers ---------- */
  S.onDate = function (key) {
    return S.db.sevas.filter(function (s) { return s.date === key; })
      .sort(function (a, b) { return b.ts - a.ts; });
  };
  S.todayCount = function () {
    var seen = {};
    S.onDate(U.today()).forEach(function (s) { seen[s.type] = 1; });
    return Object.keys(seen).length;
  };
  S.addSeva = function (type, count, extra) {
    var t = S.type(type);
    var e = {
      id: U.uid(), date: (extra && extra.date) || U.today(), ts: Date.now(),
      type: type, count: count == null ? t.def : count,
      note: (extra && extra.note) || '', place: (extra && extra.place) || ''
    };
    S.db.sevas.push(e);
    S.save();
    S.events.emit('seva-added', e);
    return e;
  };
  S.updateSeva = function (id, patch) {
    for (var i = 0; i < S.db.sevas.length; i++) {
      if (S.db.sevas[i].id === id) {
        for (var k in patch) S.db.sevas[i][k] = patch[k];
        S.save(); S.events.emit('seva-updated', S.db.sevas[i]);
        return S.db.sevas[i];
      }
    }
  };
  S.removeSeva = function (id) {
    S.db.sevas = S.db.sevas.filter(function (s) { return s.id !== id; });
    S.save(); S.events.emit('seva-removed', { id: id });
  };
  S.streak = function () {
    var days = {};
    S.db.sevas.forEach(function (s) { days[s.date] = (days[s.date] || 0) + 1; });
    var cur = 0, d = new Date();
    if (!days[U.key(d)]) d = U.addDays(d, -1);
    while (days[U.key(d)]) { cur++; d = U.addDays(d, -1); }
    var keys = Object.keys(days).sort(), best = 0, run = 0, prev = null;
    keys.forEach(function (k) {
      if (prev && (U.parseKey(k) - U.parseKey(prev)) === 86400000) run++; else run = 1;
      best = Math.max(best, run); prev = k;
    });
    return { current: cur, best: best, days: Object.keys(days).length };
  };
  S.totals = function (from, to) {
    var t = { count: 0, byType: {}, minutes: 0 };
    S.db.sevas.forEach(function (s) {
      if (from && s.date < from) return;
      if (to && s.date > to) return;
      t.count++;
      t.byType[s.type] = (t.byType[s.type] || 0) + (Number(s.count) || 0);
    });
    return t;
  };

  /* ---------- theme ---------- */
  S.applyTheme = function () {
    var st = S.db.settings;
    var mode = st.theme;
    if (mode === 'system') mode = (S.info.dark || window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.setAttribute('data-accent', st.accent || 'green');
    var bg = { dark: '#0B0E13', amoled: '#000000', light: '#F4F6FA' }[mode];
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', bg);
    if (isNative) {
      jcall('setBars', { lightContent: mode !== 'light', statusColor: '#00000000', navColor: '#00000000' });
    }
    S.events.emit('theme-applied', { mode: mode });
  };

  S.haptic = function (kind) {
    if (!S.db.settings.haptics) return;
    if (isNative) call('haptic', kind || 'light');
    else if (navigator.vibrate) navigator.vibrate(kind === 'heavy' ? 30 : 12);
  };

  /* ---------- boot ---------- */
  S.boot = function () {
    if (isNative) {
      S.info = call('info') || {};
      if (S.info.language && !localStorage.getItem('seva.lang.set')) {
        var l = S.info.language;
        if (['hi', 'en', 'pa'].indexOf(l) >= 0) defaults().settings.lang = l;
      }
    } else {
      S.info = { runtime: 'browser', versionName: '1.0.0', versionCode: 1, webVersion: 1, dark: true, language: 'hi' };
    }
    S.load();
    if (isNative && S.info.firstRun && !S.db.profile.name) S.db.meta.installs = 1;
    S.applyTheme();
    S.ready = true;
    return S;
  };
})();
