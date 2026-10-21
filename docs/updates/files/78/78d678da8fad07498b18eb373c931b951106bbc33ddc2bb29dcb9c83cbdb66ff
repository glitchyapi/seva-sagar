/* ══════════════════════════════════════════════════════════════
   Seva Sagar · ui kit — icons, router, sheets, dialogs, toasts
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var S = window.Seva, U = S.u;

  var P = {
    home: 'M3 10.6 12 3.4l9 7.2M5.5 9.4V20h13V9.4M9.8 20v-5.6h4.4V20',
    lotus: 'M12 21c-4.4 0-8-2.6-8-6 2.6 0 4.6.8 6 2M12 21c4.4 0 8-2.6 8-6-2.6 0-4.6.8-6 2M12 21c-2.4-2-3.6-4.3-3.6-7 0-2.4 1.2-4.6 3.6-7 2.4 2.4 3.6 4.6 3.6 7 0 2.7-1.2 5-3.6 7Z',
    banner: 'M4 4h16v11l-3-2-2.5 2-2.5-2-2.5 2L7 13l-3 2V4ZM8 8.5h8M8 11.5h5',
    user: 'M12 12.4a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4ZM4.6 20.4c.7-3.6 3.7-5.6 7.4-5.6s6.7 2 7.4 5.6',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    bell: 'M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9ZM13.7 19a2 2 0 0 1-3.4 0',
    flame: 'M12 3s5 4.2 5 8.6A5 5 0 0 1 7 12c0-1.6.7-3 1.6-4.2.4 1.2 1.2 2 2.1 2.2C10.3 7.6 12 5.6 12 3Z',
    book: 'M4 5.2A2.2 2.2 0 0 1 6.2 3H19v15.5H6.2A2.2 2.2 0 0 0 4 20.7V5.2ZM4 18.6A2.4 2.4 0 0 1 6.4 16H19M8 7h7',
    hands: 'M7.5 13V6.6a1.4 1.4 0 0 1 2.8 0V12m0-1.2V5.2a1.4 1.4 0 0 1 2.8 0v5.6m0-.4V6.4a1.4 1.4 0 0 1 2.8 0V13m0-2.2a1.4 1.4 0 0 1 2.8 0v4.4c0 3.2-2.4 5.8-5.6 5.8h-1.6c-2 0-3.4-.9-4.4-2.6L4 14.6a1.5 1.5 0 0 1 2.4-1.8l1.1 1.4',
    play: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM10.2 8.6l5.4 3.4-5.4 3.4V8.6Z',
    megaphone: 'M4 10v4a1.6 1.6 0 0 0 1.6 1.6H8l7 4.4V4L8 8.4H5.6A1.6 1.6 0 0 0 4 10ZM18.4 8.6a4.4 4.4 0 0 1 0 6.8M8 15.6V20',
    gift: 'M4 11h16v9H4v-9ZM3 7.4h18V11H3V7.4ZM12 7.4V20M12 7.4S10.8 3 8.6 3a2.3 2.3 0 0 0 0 4.4M12 7.4S13.2 3 15.4 3a2.3 2.3 0 0 1 0 4.4',
    share: 'M12 15V3.6M8.4 7 12 3.4 15.6 7M5 13v6.4A1.6 1.6 0 0 0 6.6 21h10.8a1.6 1.6 0 0 0 1.6-1.6V13',
    download: 'M12 3.6V15M8.4 11.4 12 15.2l3.6-3.8M4.6 18.4V20h14.8v-1.6',
    upload: 'M12 15.4V4M8.4 7.6 12 3.8l3.6 3.8M4.6 18.4V20h14.8v-1.6',
    settings: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.6 14.4a1.5 1.5 0 0 0 .3 1.7l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-2.5 1v.3a1.8 1.8 0 1 1-3.6 0v-.2a1.5 1.5 0 0 0-2.6-1l-.1.1a1.8 1.8 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0-1-2.5H4.8a1.8 1.8 0 1 1 0-3.6H5a1.5 1.5 0 0 0 1-2.6l-.1-.1a1.8 1.8 0 1 1 2.6-2.6l.1.1a1.5 1.5 0 0 0 1.7.3h.1a1.5 1.5 0 0 0 .9-1.4V4.8a1.8 1.8 0 1 1 3.6 0V5a1.5 1.5 0 0 0 2.5 1l.1-.1a1.8 1.8 0 1 1 2.6 2.6l-.1.1a1.5 1.5 0 0 0-.3 1.7v.1a1.5 1.5 0 0 0 1.4.9h.3a1.8 1.8 0 1 1 0 3.6h-.2a1.5 1.5 0 0 0-1.4.9Z',
    shield: 'M12 3.2 5 6v5.4c0 4.3 2.9 8.3 7 9.4 4.1-1.1 7-5.1 7-9.4V6l-7-2.8ZM9.2 12.2l2 2 3.6-3.8',
    lock: 'M6.4 10.6h11.2V20H6.4v-9.4ZM8.6 10.6V7.8a3.4 3.4 0 0 1 6.8 0v2.8M12 14.4v2.4',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.2 12h17.6M12 3a13.6 13.6 0 0 1 0 18 13.6 13.6 0 0 1 0-18Z',
    palette: 'M12 21a9 9 0 1 1 0-18c4.9 0 9 3.4 9 7.6 0 2.4-2 4.4-4.4 4.4h-1.4a1.8 1.8 0 0 0-1.3 3 1.8 1.8 0 0 1-1.3 3H12ZM7.6 12.4h.01M9.8 8.4h.01M14.2 8h.01',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7.2V12l3.2 2',
    calendar: 'M4.6 6.6h14.8V20H4.6V6.6ZM8 3.4v3.2M16 3.4v3.2M4.6 10.6h14.8M8.6 14.4h2M13.4 14.4h2M8.6 17.2h2',
    chart: 'M4 20V9.6M9.4 20V4.4M14.8 20v-8M20.2 20v-5',
    check: 'M5 12.8 9.6 17.4 19 6.6',
    x: 'M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6',
    right: 'M9.4 5.6 16 12l-6.6 6.4',
    left: 'M14.6 5.6 8 12l6.6 6.4',
    down: 'M5.6 9.4 12 16l6.4-6.6',
    edit: 'M4.6 19.4h3.2L18.4 8.8a2.2 2.2 0 0 0-3.2-3.2L4.6 16.2v3.2ZM14.4 6.6l3 3',
    trash: 'M4.8 6.8h14.4M9.4 6.8V4.6h5.2v2.2M6.6 6.8 7.6 20h8.8l1-13.2M10.2 10.4v6M13.8 10.4v6',
    refresh: 'M20 12a8 8 0 1 1-2.4-5.7M20 4v4.4h-4.4',
    undo: 'M4 10h9.6a4.8 4.8 0 1 1 0 9.6H8M4 10l4-4M4 10l4 4',
    info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5.4M12 7.8h.01',
    image: 'M4.4 5h15.2v14H4.4V5ZM9 10.2a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8ZM4.4 15.6l4.2-4 4 3.6 3-2.6 4 3.6',
    phone: 'M7 3.6h3l1.4 3.6-2 1.4a11 11 0 0 0 5 5l1.4-2 3.6 1.4v3a1.8 1.8 0 0 1-2 1.8A15.6 15.6 0 0 1 5.2 5.6a1.8 1.8 0 0 1 1.8-2Z',
    pin: 'M12 21s6.6-5.6 6.6-10.4a6.6 6.6 0 1 0-13.2 0C5.4 15.4 12 21 12 21ZM12 13a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z',
    sparkle: 'M12 3.4 13.8 9l5.6 1.8-5.6 1.8L12 18.2l-1.8-5.6L4.6 10.8 10.2 9 12 3.4ZM18.6 16.4l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z',
    cloudDown: 'M7.4 17.4A4.4 4.4 0 0 1 7 8.7a5.6 5.6 0 0 1 10.7 1.4 3.7 3.7 0 0 1-.7 7.3M12 12.4V21M8.8 17.8 12 21l3.2-3.2',
    wifiOff: 'M3 4l18 18M8.8 15.2a4.6 4.6 0 0 1 5.6-.7M5.2 11.4a9.4 9.4 0 0 1 4-2.2M2 7.8a14 14 0 0 1 5-3M16.6 9.4a9.4 9.4 0 0 1 2.2 1.9M22 7.8a14 14 0 0 0-8.4-3.5M12 19.4h.01',
    alert: 'M12 4.4 21 19.6H3L12 4.4ZM12 10v4M12 16.8h.01',
    star: 'M12 3.8l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 10l5.9-.8L12 3.8Z',
    copy: 'M8.6 8.6h10.8v10.8H8.6V8.6ZM5.4 15.4H4.6V4.6h10.8v.8',
    eye: 'M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    grid: 'M4.4 4.4h6v6h-6v-6ZM13.6 4.4h6v6h-6v-6ZM4.4 13.6h6v6h-6v-6ZM13.6 13.6h6v6h-6v-6Z',
    key: 'M15.4 3.6a5 5 0 1 0-4.2 7.7L4 18.5V21h2.6l1-1v-1.8h1.8l1.2-1.2v-1.8h1.8l1.5-1.5a5 5 0 0 0 1.5-9.1ZM16.6 8.2h.01',
    zap: 'M13.4 3 5 13.4h5.6L10 21l8.4-10.4h-5.6L13.4 3Z'
  };

  function icon(name, size, cls) {
    var d = P[name] || P.info;
    return '<svg class="' + (cls || '') + '" width="' + (size || 22) + '" height="' + (size || 22) +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  }
  function paintIcons(root) {
    (root || document).querySelectorAll('[data-ico]').forEach(function (el) {
      if (el.__ico) return;
      el.__ico = 1;
      el.innerHTML = icon(el.getAttribute('data-ico'), +(el.getAttribute('data-size') || 22));
    });
  }

  /* ---------- toasts ---------- */
  function toast(msg, kind, ms) {
    var root = document.getElementById('toast-root');
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.innerHTML = '<span class="t-i">' + icon(kind === 'err' ? 'alert' : kind === 'ok' ? 'check' : 'info', 18) +
      '</span><span>' + U.esc(msg) + '</span>';
    root.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-in'); });
    setTimeout(function () {
      el.classList.remove('is-in');
      setTimeout(function () { el.remove(); }, 300);
    }, ms || 2200);
  }

  /* ---------- sheet ---------- */
  var sheetStack = [];
  function sheet(opts) {
    var root = document.getElementById('sheet-root');
    var back = document.createElement('div');
    back.className = 'sheet-back';
    var el = document.createElement('div');
    el.className = 'sheet';
    el.innerHTML = '<div class="sheet-in"><div class="sheet-grab"></div>' +
      (opts.title ? '<div class="sheet-h"><div class="sheet-t">' + U.esc(opts.title) + '</div>' +
        '<button class="icon-btn" data-close>' + icon('x', 18) + '</button></div>' : '') +
      '<div class="sheet-body">' + (opts.body || '') + '</div></div>';
    root.appendChild(back); root.appendChild(el);
    paintIcons(el);
    requestAnimationFrame(function () { back.classList.add('is-in'); el.classList.add('is-in'); });
    var handle = {
      el: el,
      close: function () {
        back.classList.remove('is-in'); el.classList.remove('is-in');
        setTimeout(function () { back.remove(); el.remove(); }, 280);
        var i = sheetStack.indexOf(handle); if (i >= 0) sheetStack.splice(i, 1);
        if (opts.onClose) opts.onClose();
      }
    };
    back.addEventListener('click', handle.close);
    el.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', handle.close); });
    sheetStack.push(handle);
    if (opts.onMount) opts.onMount(el, handle);
    S.haptic('light');
    return handle;
  }

  /* ---------- dialog ---------- */
  function dialog(opts) {
    var root = document.getElementById('dialog-root');
    var back = document.createElement('div');
    back.className = 'dlg-back';
    var actions = (opts.actions || [{ label: S.t('common.ok'), kind: 'primary' }]);
    back.innerHTML = '<div class="dlg">' +
      (opts.icon ? '<div class="dlg-i">' + icon(opts.icon, 26) + '</div>' : '') +
      '<div class="dlg-t">' + U.esc(opts.title || '') + '</div>' +
      (opts.msg ? '<div class="dlg-m">' + (opts.html ? opts.msg : U.esc(opts.msg)) : '') + '</div>' +
      (opts.body || '') +
      '<div class="dlg-a">' + actions.map(function (a, i) {
        return '<button class="btn ' + (a.kind || '') + '" data-a="' + i + '">' + U.esc(a.label) + '</button>';
      }).join('') + '</div></div>';
    root.appendChild(back);
    requestAnimationFrame(function () { back.classList.add('is-in'); });
    function close() {
      back.classList.remove('is-in');
      setTimeout(function () { back.remove(); }, 260);
    }
    back.querySelectorAll('[data-a]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = actions[+b.getAttribute('data-a')];
        S.haptic('light');
        if (!a || a.onClick) { if (a && a.onClick) { if (a.onClick(back) === false) return; } }
        close();
      });
    });
    if (!opts.persistent) back.addEventListener('click', function (e) { if (e.target === back) close(); });
    S.haptic('light');
    return { el: back, close: close };
  }

  function confirm(title, msg, danger) {
    return new Promise(function (res) {
      dialog({
        icon: danger ? 'alert' : 'info', title: title, msg: msg,
        actions: [
          { label: S.t('common.cancel'), onClick: function () { res(false); } },
          { label: S.t(danger ? 'common.delete' : 'common.ok'), kind: danger ? 'danger' : 'primary',
            onClick: function () { res(true); } }
        ]
      });
    });
  }

  function promptText(title, ph, type, value) {
    return new Promise(function (res) {
      var d = dialog({
        icon: 'key', title: title, persistent: true,
        body: '<div style="margin-top:14px"><input class="input" id="__pin" type="' + (type || 'text') +
          '" inputmode="' + (type === 'password' ? 'numeric' : 'text') + '" placeholder="' + U.esc(ph || '') +
          '" value="' + U.esc(value || '') + '" style="text-align:center;letter-spacing:2px"></div>',
        actions: [
          { label: S.t('common.cancel'), onClick: function () { res(null); } },
          { label: S.t('common.ok'), kind: 'primary', onClick: function (el) {
              var v = el.querySelector('#__pin').value;
              if (!v) return false;
              res(v);
            } }
        ]
      });
      setTimeout(function () { var i = d.el.querySelector('#__pin'); if (i) i.focus(); }, 320);
    });
  }

  /* ---------- ring ---------- */
  function ring(done, total, size) {
    size = size || 92;
    var r = (size - 12) / 2, c = 2 * Math.PI * r;
    var pct = total > 0 ? Math.min(1, done / total) : 0;
    return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg width="' + size + '" height="' + size + '">' +
      '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="var(--ac)"/><stop offset="1" stop-color="var(--ac-2)"/>' +
      '</linearGradient></defs>' +
      '<circle class="bg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="9"/>' +
      '<circle class="fg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="9" ' +
      'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - pct)).toFixed(1) + '"/>' +
      '</svg><div class="ring-c"><div><div class="ring-n">' + done + '<span style="font-size:14px;color:var(--muted)">/' + total + '</span></div>' +
      '<div class="ring-l">' + S.t('home.completed') + '</div></div></div></div>';
  }

  /* ---------- ripple ---------- */
  document.addEventListener('pointerdown', function (e) {
    var t = e.target.closest ? e.target.closest('.btn,.qa,.row,.set,.chip,.tab,.icon-btn') : null;
    if (!t) return;
    var rect = t.getBoundingClientRect();
    var s = Math.max(rect.width, rect.height);
    var sp = document.createElement('span');
    sp.className = 'ripple';
    sp.style.width = sp.style.height = s + 'px';
    sp.style.left = (e.clientX - rect.left - s / 2) + 'px';
    sp.style.top = (e.clientY - rect.top - s / 2) + 'px';
    if (getComputedStyle(t).position === 'static') t.style.position = 'relative';
    t.style.overflow = 'hidden';
    t.appendChild(sp);
    setTimeout(function () { sp.remove(); }, 540);
  }, { passive: true });

  /* ---------- router ---------- */
  var ROUTES = ['home', 'seva', 'bhandara', 'profile'];
  var current = 'home';
  var scrollTop = {};

  function go(route, opts) {
    if (ROUTES.indexOf(route) < 0) route = 'home';
    var prev = document.getElementById('page-' + current);
    if (prev) scrollTop[current] = prev.scrollTop;
    current = route; S.route = route;
    ROUTES.forEach(function (r) {
      var p = document.getElementById('page-' + r);
      if (p) p.classList.toggle('is-active', r === route);
    });
    document.querySelectorAll('.tab').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-route') === route);
    });
    if (window.Screens && Screens[route] && Screens[route].render) Screens[route].render(opts);
    var pg = document.getElementById('page-' + route);
    if (pg && !(opts && opts.keepScroll)) pg.scrollTop = scrollTop[route] || 0;
    S.haptic('light');
    var fab = document.getElementById('fab');
    if (fab) fab.style.display = (route === 'profile') ? 'none' : '';
  }

  window.UI = {
    icon: icon, paint: paintIcons, toast: toast, sheet: sheet, dialog: dialog,
    confirm: confirm, prompt: promptText, ring: ring, go: go,
    current: function () { return current; },
    closeTopSheet: function () {
      if (sheetStack.length) { sheetStack[sheetStack.length - 1].close(); return true; }
      return false;
    },
    hasSheet: function () { return sheetStack.length > 0; }
  };

  window.__sevaRoute = function (r) {
    if (r === 'update') { if (window.Updates) Updates.open(); return; }
    if (r === 'add') { if (window.Screens) Screens.openAdd(); return; }
    if (r === 'banner') { go('bhandara'); return; }
    go(r);
  };
  window.__sevaBack = function () {
    if (UI.closeTopSheet()) return true;
    var dlg = document.querySelector('.dlg-back');
    if (dlg) { dlg.click(); return true; }
    if (current !== 'home') { go('home'); return true; }
    return false;
  };
})();
