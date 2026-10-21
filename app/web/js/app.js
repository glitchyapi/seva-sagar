/* ══════════════════════════════════════════════════════════════
   Seva Sagar · app boot — splash, lock, onboarding, lifecycle
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var S = window.Seva, U = S.u;
  var t = function (k, v) { return S.t(k, v); };
  var MIN_SPLASH = 1050;
  var started = Date.now();

  function setInsets(d) {
    if (!d) return;
    var r = document.documentElement.style;
    if (d.top != null) r.setProperty('--sat', Math.max(20, d.top) + 'px');
    if (d.bottom != null) r.setProperty('--sab', Math.max(0, d.bottom) + 'px');
  }
  S.events.on('insets', setInsets);

  function hideSplash() {
    var wait = Math.max(0, MIN_SPLASH - (Date.now() - started));
    setTimeout(function () {
      var sp = document.getElementById('splash');
      sp.classList.add('is-out');
      document.getElementById('app').hidden = false;
      setTimeout(function () { sp.style.display = 'none'; }, 500);
    }, wait);
  }

  /* ── lock screen (PIN) ─────────────────────────────────── */
  function lockGate(next) {
    var tries = 0;
    function ask() {
      UI.dialog({
        icon: 'lock', title: t('data.pinEnter'), persistent: true,
        msg: t('data.vaultInfo'),
        body: '<div style="margin-top:14px"><input class="input" id="lk" type="password" inputmode="numeric" ' +
          'style="text-align:center;letter-spacing:6px;font-size:20px" placeholder="••••"></div>',
        actions: [{ label: t('common.ok'), kind: 'primary', onClick: function (el) {
          var v = el.querySelector('#lk').value;
          if (!v) return false;
          var r = S.N.call('pinUnlock', v);
          if (r.ok) { S.info.vaultUnlocked = true; next(); }
          else {
            tries++;
            UI.toast(t('data.pinWrong'), 'err');
            S.haptic('error');
            setTimeout(ask, 250);
          }
        } }]
      });
      setTimeout(function () {
        var i = document.querySelector('#lk');
        if (i) i.focus();
      }, 350);
    }
    ask();
  }

  /* ── onboarding ────────────────────────────────────────── */
  function onboarding(done) {
    var step = 0;
    var pages = [
      { ico: 'lotus', t: t('onb.p1'), s: t('onb.p1s') },
      { ico: 'image', t: t('onb.p2'), s: t('onb.p2s') },
      { ico: 'shield', t: t('onb.p3'), s: t('onb.p3s') }
    ];
    var d = UI.dialog({
      icon: 'sparkle', title: t('onb.title'), persistent: true,
      msg: t('onb.sub'),
      body: '<div id="ob" style="margin-top:16px"></div>' +
        '<div class="field" style="margin-top:14px"><input class="input" id="ob-name" ' +
        'placeholder="' + U.esc(t('onb.name')) + '" style="text-align:center"></div>',
      actions: [
        { label: t('onb.skip'), onClick: function () { finish(''); } },
        { label: t('onb.start'), kind: 'primary', onClick: function (el) {
            var n = el.querySelector('#ob-name').value.trim();
            finish(n);
          } }
      ]
    });
    function paint() {
      var host = d.el.querySelector('#ob');
      host.innerHTML = pages.map(function (p, i) {
        return '<div class="row" style="opacity:' + (i === step ? 1 : .45) + ';margin-bottom:8px">' +
          '<div class="row-i">' + UI.icon(p.ico, 20) + '</div>' +
          '<div class="row-b"><div class="row-t">' + p.t + '</div><div class="row-s">' + p.s + '</div></div></div>';
      }).join('');
    }
    paint();
    var iv = setInterval(function () { step = (step + 1) % pages.length; paint(); }, 2200);
    function finish(name) {
      clearInterval(iv);
      if (name) S.db.profile.name = name;
      S.db.meta.onboarded = true;
      S.save(true);
      if (S.native) S.N.call('markFirstRunDone');
      Screens.refresh();
      if (done) done();
      setTimeout(askNotif, 600);
    }
  }

  function askNotif() {
    if (!S.native || S.info.sdk < 33) return;
    var p = S.N.call('permissions');
    if (p.ok && p.notifications) return;
    UI.dialog({
      icon: 'bell', title: t('perm.notif'), msg: t('perm.notifSub'),
      actions: [
        { label: t('onb.skip') },
        { label: t('perm.grant'), kind: 'primary', onClick: function () {
            S.N.call('requestPermissions', JSON.stringify(['android.permission.POST_NOTIFICATIONS']));
          } }
      ]
    });
  }

  /* ── boot ──────────────────────────────────────────────── */
  function start() {
    S.boot();
    S.i18n.set(S.db.settings.lang || 'hi');
    S.i18n.apply(document);
    UI.paint(document);
    S.applyTheme();

    var locked = S.native && S.info.vaultPin && !S.info.vaultUnlocked;

    function render() {
      if (locked) { S.load(); S.i18n.set(S.db.settings.lang || 'hi'); }
      Screens.topbar();
      ['home', 'seva', 'bhandara', 'profile'].forEach(function (r) { Screens[r].render(); });
      UI.go('home');
      hideSplash();
      if (!S.db.meta.onboarded) setTimeout(function () { onboarding(); }, 1200);
      setTimeout(function () {
        if (S.db.settings.checkOnStart && window.Updates) Updates.check(false);
      }, 2200);
    }

    if (locked) lockGate(render); else render();
  }

  /* ── lifecycle wiring ──────────────────────────────────── */
  S.events.on('resume', function () {
    if (!window.Updates) return;
    var last = S.db.settings.lastCheck || 0;
    if (Date.now() - last > 6 * 3600 * 1000 && S.db.settings.checkOnStart) Updates.check(false);
    if (Screens.topbar) Screens.topbar();
  });
  S.events.on('theme', function (d) {
    S.info.dark = d.dark;
    if (S.db.settings.theme === 'system') S.applyTheme();
  });
  S.events.on('permission', function (d) {
    var granted = d.permissions && Object.keys(d.permissions).some(function (k) { return d.permissions[k]; });
    UI.toast(granted ? t('perm.granted') : t('perm.denied'), granted ? 'ok' : 'err');
    if (window.Screens && UI.current() === 'profile') Screens.profile.render();
  });
  S.events.on('seva-added', function () {
    if (S.native) {
      var done = S.todayCount(), target = S.db.settings.dailyTarget;
      if (done === target) {
        S.N.j('notify', { id: 4600, channel: 'seva', title: t('home.done'), body: t('greet.line'), route: 'home' });
      }
    }
  });

  /* tabbar + fab */
  document.addEventListener('click', function (e) {
    var tab = e.target.closest ? e.target.closest('.tab') : null;
    if (tab) { UI.go(tab.getAttribute('data-route')); return; }
    var fab = e.target.closest ? e.target.closest('#fab') : null;
    if (fab) {
      var r = UI.current();
      if (r === 'bhandara') {
        var b = document.querySelector('#b-event');
        if (b) { b.click(); return; }
      }
      Screens.openAdd();
    }
  });

  /* keyboard / viewport */
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', U.debounce(function () {
      var h = window.visualViewport.height;
      document.documentElement.style.setProperty('--vvh', h + 'px');
    }, 100));
  }

  /* error surface (never a white screen) */
  window.addEventListener('error', function (e) {
    try {
      if (S.native) S.N.call('log', 'JS ' + e.message + ' @' + e.filename + ':' + e.lineno);
      var sp = document.getElementById('splash');
      if (sp && !sp.classList.contains('is-out')) {
        document.getElementById('app').hidden = false;
        sp.classList.add('is-out');
      }
    } catch (x) {}
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
