/* ══════════════════════════════════════════════════════════════
   Seva Sagar · screens — home · seva · bhandara · profile
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var S = window.Seva, U = S.u, t = function (k, v) { return S.t(k, v); };
  var I = function (n, s) { return UI.icon(n, s); };
  var QUOTES = [
    'सतभक्ति ही मोक्ष का एकमात्र मार्ग है।',
    'नाम जप से मन निर्मल होता है, और निर्मल मन ही सतलोक का द्वार है।',
    'सेवा से बढ़कर कोई धर्म नहीं, और सतगुरु से बढ़कर कोई सहारा नहीं।',
    'जो साधक रोज़ नियम से साधना करता है, वह कभी पथ से नहीं भटकता।',
    'गुरु के वचन जीवन का आधार हैं — इन्हें आचरण में उतारो।',
    'दान और सेवा से पुण्य बढ़ता है, नाम से मुक्ति मिलती है।',
    'सत्संग सुनने से अज्ञान का अंधेरा स्वयं मिट जाता है।'
  ];

  function greeting() {
    var h = new Date().getHours();
    if (h < 5) return t('greet.night');
    if (h < 12) return t('greet.morning');
    if (h < 16) return t('greet.afternoon');
    if (h < 20) return t('greet.evening');
    return t('greet.night');
  }
  function initials(name) {
    var n = (name || '').trim();
    if (!n) return '🙏';
    var p = n.split(/\s+/);
    return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
  }

  /* ───────────────────────── top bar ───────────────────────── */
  function topbar() {
    var p = S.db.profile;
    var el = document.getElementById('topbar');
    var hasUpdate = window.Updates && Updates.state && Updates.state.available;
    el.innerHTML = '<div class="topbar-in">' +
      '<div class="avatar" id="tb-avatar">' + U.esc(initials(p.name)) + '</div>' +
      '<div class="hi"><div class="hi-1">' + U.esc(greeting()) + (p.name ? ', ' + U.esc(p.name.split(' ')[0]) : '') + ' 🙏</div>' +
      '<div class="hi-2">' + t('greet.line') + ' · ' + S.i18n.date(new Date(), 'full') + '</div></div>' +
      '<button class="icon-btn" id="tb-bell">' + I('bell', 20) + (hasUpdate ? '<span class="dot"></span>' : '') + '</button>' +
      '</div>';
    UI.paint(el);
    el.querySelector('#tb-avatar').onclick = function () { UI.go('profile'); };
    el.querySelector('#tb-bell').onclick = function () {
      if (window.Updates) Updates.open();
    };
  }

  /* ───────────────────────── HOME ───────────────────────── */
  var home = {
    render: function () {
      var el = document.getElementById('page-home');
      var done = S.todayCount(), target = S.db.settings.dailyTarget || 5;
      var st = S.streak();
      var today = S.onDate(U.today());
      var quick = [
        { id: 'naam', ico: 'lotus', label: t('type.naam') },
        { id: 'satsang', ico: 'play', label: t('type.satsang') },
        { id: 'bhandara', ico: 'hands', label: t('type.bhandara') },
        { id: 'banner', ico: 'image', label: t('bhandara.make') }
      ];
      var quote = QUOTES[new Date().getDate() % QUOTES.length];

      el.innerHTML = '<div class="wrap stagger">' +
        '<div class="hero">' +
          '<div class="hero-row">' + UI.ring(done, target, 92) +
            '<div class="hero-info">' +
              '<div class="hero-t">' + t('home.today') + '</div>' +
              '<div class="hero-d">' + (done >= target ? t('home.done') : (target - done) + ' ' + t('home.remaining')) + '</div>' +
              '<div style="margin-top:9px;display:flex;gap:6px;flex-wrap:wrap">' +
                '<span class="pill ac">' + I('flame', 13) + st.current + ' ' + t('home.days') + '</span>' +
                '<span class="pill">' + I('star', 13) + st.best + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="hero-actions">' +
            '<button class="btn primary" style="flex:1" data-act="add">' + I('plus', 18) + t('home.addSeva') + '</button>' +
            '<button class="btn" data-act="target" style="flex:0 0 auto">' + I('settings', 18) + '</button>' +
          '</div>' +
        '</div>' +

        '<div class="card tight"><div class="card-h"><div class="card-t">' + t('home.quick') + '</div></div>' +
          '<div class="quick">' + quick.map(function (q) {
            return '<button class="qa" data-q="' + q.id + '"><span class="qa-i">' + I(q.ico, 20) + '</span>' +
              '<span class="qa-l">' + U.esc(q.label) + '</span></button>';
          }).join('') + '</div></div>' +

        '<div class="card"><div class="card-h"><div><div class="card-t">' + t('home.todayList') + '</div>' +
          '<div class="card-s">' + today.length + ' ' + t('seva.entries') + '</div></div>' +
          '<button class="link" data-act="all">' + t('home.viewAll') + I('right', 14) + '</button></div>' +
          (today.length ? '<div class="list">' + today.map(rowHtml).join('') + '</div>'
            : emptyHtml('lotus', t('home.empty'), t('home.emptySub'))) + '</div>' +

        '<div class="card tight"><div class="card-h"><div class="card-t">' + t('home.week') + '</div>' +
          '<span class="badge">' + weekTotal() + '</span></div>' + weekStrip() + '</div>' +

        '<div class="quote"><div class="quote-q">“' + U.esc(quote) + '”</div>' +
          '<div class="quote-a">' + I('sparkle', 14) + t('home.thought') + '</div></div>' +
        '</div>';

      UI.paint(el);
      el.querySelectorAll('[data-q]').forEach(function (b) {
        b.onclick = function () {
          var id = b.getAttribute('data-q');
          if (id === 'banner') { UI.go('bhandara'); return; }
          if (id === 'naam') {
            S.addSeva('naam', 1);
            S.haptic('success');
            UI.toast(t('toast.sevaAdded') + ' · +1 ' + t('unit.mala'), 'ok');
            home.render(); topbar();
            return;
          }
          Screens.openAdd(id);
        };
      });
      el.querySelectorAll('[data-act]').forEach(function (b) {
        b.onclick = function () {
          var a = b.getAttribute('data-act');
          if (a === 'add') Screens.openAdd();
          if (a === 'all') UI.go('seva');
          if (a === 'target') Screens.targetSheet();
        };
      });
      bindRows(el);
    }
  };

  function weekTotal() {
    var n = 0, d = new Date();
    for (var i = 0; i < 7; i++) { n += S.onDate(U.key(U.addDays(d, -i))).length; }
    return n + ' ' + t('seva.entries');
  }
  function weekStrip() {
    var out = '', days = S.i18n.days();
    for (var i = 6; i >= 0; i--) {
      var d = U.addDays(new Date(), -i), k = U.key(d), n = S.onDate(k).length;
      out += '<div class="wd' + (i === 0 ? ' today' : '') + (n ? ' done' : '') + '">' +
        '<div class="wd-l">' + days[d.getDay()] + '</div><div class="wd-n">' + d.getDate() + '</div>' +
        '<div class="wd-d"></div></div>';
    }
    return '<div class="week">' + out + '</div>';
  }
  function rowHtml(s) {
    var ty = S.type(s.type);
    return '<div class="row" data-seva="' + s.id + '">' +
      '<div class="row-i" style="background:' + hexA(ty.color, .16) + ';color:' + ty.color + '">' + I(ty.icon, 20) + '</div>' +
      '<div class="row-b"><div class="row-t">' + t('type.' + s.type) + '</div>' +
      '<div class="row-s">' + (s.note ? U.esc(s.note) : (s.place ? U.esc(s.place) : timeOf(s.ts))) + '</div></div>' +
      '<div class="row-e"><div class="row-n">' + U.num(s.count) + '</div><div class="row-u">' + t('unit.' + ty.unit) + '</div></div>' +
      '</div>';
  }
  function timeOf(ts) {
    var d = new Date(ts);
    return U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
  }
  function hexA(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function emptyHtml(ico, title, sub) {
    return '<div class="empty"><div class="empty-i">' + I(ico, 26) + '</div>' +
      '<div class="empty-t">' + title + '</div><div class="empty-s">' + sub + '</div></div>';
  }
  function bindRows(root) {
    root.querySelectorAll('[data-seva]').forEach(function (r) {
      r.onclick = function () {
        var id = r.getAttribute('data-seva');
        var e = S.db.sevas.filter(function (x) { return x.id === id; })[0];
        if (e) Screens.openAdd(e.type, e);
      };
    });
  }

  /* ───────────────────────── SEVA ───────────────────────── */
  var sevaState = { month: new Date(), filter: 'all' };
  var seva = {
    render: function () {
      var el = document.getElementById('page-seva');
      var m = sevaState.month;
      var mk = m.getFullYear() + '-' + U.pad(m.getMonth() + 1);
      var items = S.db.sevas.filter(function (s) {
        return s.date.indexOf(mk) === 0 && (sevaState.filter === 'all' || s.type === sevaState.filter);
      }).sort(function (a, b) { return b.ts - a.ts; });

      var totals = {};
      items.forEach(function (s) { totals[s.type] = (totals[s.type] || 0) + (+s.count || 0); });

      el.innerHTML = '<div class="wrap">' +
        '<div class="card-h" style="margin-top:6px">' +
          '<button class="icon-btn" data-m="-1">' + I('left', 18) + '</button>' +
          '<div style="text-align:center;flex:1"><div class="card-t" style="font-size:16px">' +
            S.i18n.months()[m.getMonth()] + ' ' + m.getFullYear() + '</div>' +
            '<div class="card-s">' + items.length + ' ' + t('seva.entries') + '</div></div>' +
          '<button class="icon-btn" data-m="1">' + I('right', 18) + '</button>' +
        '</div>' +
        '<div class="chips">' +
          '<button class="chip' + (sevaState.filter === 'all' ? ' is-on' : '') + '" data-f="all">' + t('seva.all') + '</button>' +
          S.types.map(function (ty) {
            return '<button class="chip' + (sevaState.filter === ty.id ? ' is-on' : '') + '" data-f="' + ty.id + '">' +
              t('type.' + ty.id) + '</button>';
          }).join('') +
        '</div>' +
        (Object.keys(totals).length ? '<div class="stats" style="margin:12px 0">' +
          Object.keys(totals).slice(0, 4).map(function (k) {
            var ty = S.type(k);
            return '<div class="stat"><div class="stat-n" style="color:' + ty.color + '">' + U.num(totals[k]) + '</div>' +
              '<div class="stat-l">' + t('type.' + k) + ' · ' + t('unit.' + ty.unit) + '</div></div>';
          }).join('') + '</div>' : '') +
        '<div class="card tight"><div class="card-h"><div class="card-t">' + t('seva.calendar') + '</div>' +
          '<span class="badge grey">' + t('seva.monthTotal') + '</span></div>' + heatmap(m) + '</div>' +
        (items.length ? groupedList(items) : emptyHtml('book', t('seva.empty'), t('seva.emptySub'))) +
        '</div>';

      UI.paint(el);
      el.querySelectorAll('[data-m]').forEach(function (b) {
        b.onclick = function () {
          sevaState.month = new Date(m.getFullYear(), m.getMonth() + (+b.getAttribute('data-m')), 1);
          seva.render();
        };
      });
      el.querySelectorAll('[data-f]').forEach(function (b) {
        b.onclick = function () { sevaState.filter = b.getAttribute('data-f'); seva.render(); };
      });
      el.querySelectorAll('[data-day]').forEach(function (d) {
        d.onclick = function () { Screens.openAdd(null, { date: d.getAttribute('data-day') }); };
      });
      bindRows(el);
    }
  };

  function heatmap(m) {
    var first = new Date(m.getFullYear(), m.getMonth(), 1);
    var days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    var pad = first.getDay();
    var counts = {};
    S.db.sevas.forEach(function (s) { counts[s.date] = (counts[s.date] || 0) + 1; });
    var out = '<div class="heat-h">' + S.i18n.days().map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="heat">';
    for (var i = 0; i < pad; i++) out += '<div class="heat-d pad"></div>';
    for (var d = 1; d <= days; d++) {
      var k = m.getFullYear() + '-' + U.pad(m.getMonth() + 1) + '-' + U.pad(d);
      var n = counts[k] || 0;
      var lvl = n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 6 ? 3 : 4;
      out += '<div class="heat-d l' + lvl + (k === U.today() ? ' today' : '') + '" data-day="' + k + '">' + d + '</div>';
    }
    return out + '</div>';
  }

  function groupedList(items) {
    var groups = {}, order = [];
    items.forEach(function (s) {
      if (!groups[s.date]) { groups[s.date] = []; order.push(s.date); }
      groups[s.date].push(s);
    });
    return order.map(function (d) {
      var label = d === U.today() ? t('common.today') :
        d === U.key(U.addDays(new Date(), -1)) ? t('common.yesterday') : S.i18n.date(d, 'full');
      return '<div class="sec-t">' + label + '<span>' + groups[d].length + '</span></div>' +
        '<div class="list">' + groups[d].map(rowHtml).join('') + '</div>';
    }).join('');
  }

  /* ───────────────────────── BHANDARA ───────────────────────── */
  var bState = { tab: 'make', tpl: 'saffron', data: null, editing: null };
  function bData() {
    if (!bState.data) {
      var d = U.addDays(new Date(), 7);
      bState.data = {
        title: t('bhandara.defaultTitle'), date: U.key(d), time: '09:00',
        venue: '', organizer: S.db.profile.name || '', phone: '', message: ''
      };
    }
    return bState.data;
  }
  var bhandara = {
    render: function () {
      var el = document.getElementById('page-bhandara');
      el.innerHTML = '<div class="wrap">' +
        '<div class="seg" style="margin:8px 0 14px">' +
          '<button class="' + (bState.tab === 'make' ? 'is-on' : '') + '" data-tab="make">' + t('bhandara.make') + '</button>' +
          '<button class="' + (bState.tab === 'mine' ? 'is-on' : '') + '" data-tab="mine">' + t('bhandara.mine') + '</button>' +
        '</div><div id="b-body"></div></div>';
      el.querySelectorAll('[data-tab]').forEach(function (b) {
        b.onclick = function () { bState.tab = b.getAttribute('data-tab'); bhandara.render(); };
      });
      if (bState.tab === 'make') renderMake(el.querySelector('#b-body'));
      else renderMine(el.querySelector('#b-body'));
    }
  };

  function renderMake(host) {
    var d = bData();
    host.innerHTML =
      '<div class="card tight"><div class="card-h"><div class="card-t">' + t('bhandara.template') + '</div></div>' +
        '<div class="tpl-strip" id="tpl-strip">' + Banner.templates.map(function (tp) {
          return '<button class="tpl' + (bState.tpl === tp.id ? ' is-on' : '') + '" data-tpl="' + tp.id + '">' +
            '<canvas></canvas><div class="tpl-l">' + tp.name + '</div></button>';
        }).join('') + '</div></div>' +
      '<div class="preview" style="margin-bottom:14px"><canvas id="b-canvas"></canvas></div>' +
      '<div class="btn-row" style="margin-bottom:14px">' +
        '<button class="btn primary" id="b-share">' + I('share', 18) + t('bhandara.share') + '</button>' +
        '<button class="btn" id="b-save">' + I('download', 18) + t('bhandara.saveImg') + '</button>' +
      '</div>' +
      '<div class="card">' +
        field('title', t('bhandara.eventName'), d.title, 'text') +
        '<div style="display:flex;gap:10px">' +
          '<div style="flex:1">' + field('date', t('bhandara.date'), d.date, 'date') + '</div>' +
          '<div style="flex:1">' + field('time', t('bhandara.time'), d.time, 'time') + '</div>' +
        '</div>' +
        field('venue', t('bhandara.venue'), d.venue, 'text', t('bhandara.venuePh')) +
        field('organizer', t('bhandara.organizer'), d.organizer, 'text', t('bhandara.organizerPh')) +
        field('phone', t('bhandara.phone'), d.phone, 'tel') +
        '<div class="field"><label class="label">' + t('bhandara.message') + ' · ' + t('common.optional') + '</label>' +
          '<textarea class="textarea" data-b="message" placeholder="' + U.esc(t('bhandara.allWelcome')) + '">' + U.esc(d.message) + '</textarea></div>' +
        '<button class="btn primary block" id="b-event">' + I('calendar', 18) + t('bhandara.saveEvent') + '</button>' +
      '</div>';
    UI.paint(host);

    var canvas = host.querySelector('#b-canvas');
    var redraw = U.debounce(function () { Banner.render(canvas, bData(), bState.tpl, 540); }, 120);
    Banner.render(canvas, d, bState.tpl, 540);
    host.querySelectorAll('[data-tpl]').forEach(function (b, i) {
      var c = b.querySelector('canvas');
      Banner.render(c, d, b.getAttribute('data-tpl'), 164);
      b.onclick = function () {
        bState.tpl = b.getAttribute('data-tpl');
        host.querySelectorAll('.tpl').forEach(function (x) { x.classList.remove('is-on'); });
        b.classList.add('is-on');
        Banner.render(canvas, bData(), bState.tpl, 540);
        S.haptic('light');
      };
    });
    var refreshThumbs = U.debounce(function () {
      host.querySelectorAll('[data-tpl]').forEach(function (b) {
        Banner.render(b.querySelector('canvas'), bData(), b.getAttribute('data-tpl'), 164);
      });
    }, 420);
    host.querySelectorAll('[data-b]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        bData()[inp.getAttribute('data-b')] = inp.value;
        redraw(); refreshThumbs();
      });
    });
    host.querySelector('#b-share').onclick = function () {
      var full = document.createElement('canvas');
      Banner.render(full, bData(), bState.tpl, Banner.W);
      var r = Banner.share(full, fileName());
      if (r.ok) UI.toast(t('common.share'), 'ok'); else UI.toast(t('common.error'), 'err');
    };
    host.querySelector('#b-save').onclick = function () {
      var full = document.createElement('canvas');
      Banner.render(full, bData(), bState.tpl, Banner.W);
      var r = Banner.save(full, fileName());
      if (r.ok) UI.toast(t('toast.imageSaved'), 'ok');
      else UI.toast(r.error || t('common.error'), 'err');
    };
    host.querySelector('#b-event').onclick = function () {
      var ev = JSON.parse(JSON.stringify(bData()));
      ev.id = bState.editing || U.uid();
      ev.tpl = bState.tpl;
      ev.created = Date.now();
      S.db.bhandaras = S.db.bhandaras.filter(function (x) { return x.id !== ev.id; });
      S.db.bhandaras.push(ev);
      S.save();
      scheduleBhandaraReminder(ev);
      bState.editing = null;
      UI.toast(t('toast.eventSaved'), 'ok');
      S.haptic('success');
      bState.tab = 'mine';
      bhandara.render();
    };
  }

  function fileName() {
    var d = bData();
    return 'bhandara-' + (d.date || U.today()) + '.png';
  }
  function field(key, label, val, type, ph) {
    return '<div class="field"><label class="label">' + label + '</label>' +
      '<input class="input" data-b="' + key + '" type="' + type + '" value="' + U.esc(val || '') +
      '" placeholder="' + U.esc(ph || '') + '"></div>';
  }

  function scheduleBhandaraReminder(ev) {
    if (!S.native || !S.db.settings.bhandaraAlerts || !ev.date) return;
    var d = U.parseKey(ev.date);
    var dayBefore = U.addDays(d, -1);
    var hh = +(ev.time || '09:00').split(':')[0];
    if (dayBefore < U.parseKey(U.today())) { dayBefore = d; }
    S.N.j('reminderUpsert', {
      id: 'bh-' + ev.id, hour: Math.max(7, hh - 2), minute: 0,
      days: [], title: ev.title, body: S.i18n.date(ev.date) + ' · ' + (ev.venue || ''),
      route: 'bhandara', channel: 'bhandara', once: true, date: U.key(dayBefore)
    });
  }

  function renderMine(host) {
    var today = U.today();
    var up = S.db.bhandaras.filter(function (b) { return b.date >= today; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var past = S.db.bhandaras.filter(function (b) { return b.date < today; })
      .sort(function (a, b) { return a.date > b.date ? -1 : 1; });
    if (!S.db.bhandaras.length) {
      host.innerHTML = '<div class="card">' + emptyHtml('banner', t('bhandara.empty'), t('bhandara.emptySub')) + '</div>';
      UI.paint(host); return;
    }
    function card(b, isPast) {
      var days = Math.round((U.parseKey(b.date) - U.parseKey(today)) / 86400000);
      return '<div class="card tight" data-bh="' + b.id + '">' +
        '<div class="row" style="background:transparent;border:0;padding:0">' +
          '<div class="row-i">' + I('banner', 20) + '</div>' +
          '<div class="row-b"><div class="row-t">' + U.esc(b.title) + '</div>' +
          '<div class="row-s">' + S.i18n.date(b.date) + (b.venue ? ' · ' + U.esc(b.venue) : '') + '</div></div>' +
          '<div class="row-e"><span class="pill ' + (isPast ? '' : 'ac') + '">' +
            (isPast ? t('bhandara.past') : days === 0 ? t('bhandara.todayIs') : days + ' ' + t('bhandara.daysLeft')) +
          '</span></div>' +
        '</div>' +
        '<div class="btn-row" style="margin-top:12px">' +
          '<button class="btn sm" data-edit="' + b.id + '">' + I('edit', 15) + t('common.edit') + '</button>' +
          '<button class="btn sm" data-again="' + b.id + '">' + I('share', 15) + t('bhandara.share') + '</button>' +
          '<button class="btn sm danger" data-del="' + b.id + '">' + I('trash', 15) + '</button>' +
        '</div></div>';
    }
    host.innerHTML =
      (up.length ? '<div class="sec-t">' + t('bhandara.upcoming') + '</div>' + up.map(function (b) { return card(b, false); }).join('') : '') +
      (past.length ? '<div class="sec-t">' + t('bhandara.past') + '</div>' + past.map(function (b) { return card(b, true); }).join('') : '');
    UI.paint(host);
    host.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.onclick = function () {
        var b = find(btn.getAttribute('data-edit'));
        bState.data = JSON.parse(JSON.stringify(b));
        bState.tpl = b.tpl || 'saffron';
        bState.editing = b.id;
        bState.tab = 'make';
        bhandara.render();
      };
    });
    host.querySelectorAll('[data-again]').forEach(function (btn) {
      btn.onclick = function () {
        var b = find(btn.getAttribute('data-again'));
        var c = document.createElement('canvas');
        Banner.render(c, b, b.tpl || 'saffron', Banner.W);
        Banner.share(c, 'bhandara-' + b.date + '.png');
      };
    });
    host.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute('data-del');
        UI.confirm(t('seva.deleteAsk'), t('seva.deleteMsg'), true).then(function (ok) {
          if (!ok) return;
          S.db.bhandaras = S.db.bhandaras.filter(function (x) { return x.id !== id; });
          S.save();
          if (S.native) S.N.call('reminderCancel', 'bh-' + id);
          UI.toast(t('toast.deleted'));
          bhandara.render();
        });
      };
    });
    function find(id) { return S.db.bhandaras.filter(function (x) { return x.id === id; })[0]; }
  }

  /* ───────────────────────── PROFILE ───────────────────────── */
  var profile = {
    render: function () {
      var el = document.getElementById('page-profile');
      var p = S.db.profile, st = S.streak(), tot = S.totals();
      var s = S.db.settings;
      var upd = window.Updates && Updates.state ? Updates.state : {};
      el.innerHTML = '<div class="wrap stagger">' +
        '<div class="card" style="margin-top:8px">' +
          '<div class="row" style="background:transparent;border:0;padding:0">' +
            '<div class="avatar" style="width:56px;height:56px;border-radius:19px;font-size:20px">' + U.esc(initials(p.name)) + '</div>' +
            '<div class="row-b"><div class="row-t" style="font-size:17px">' + U.esc(p.name || t('greet.friend')) + '</div>' +
            '<div class="row-s">' + U.esc(p.city || t('profile.member')) +
              (p.initiated ? ' · ' + S.i18n.date(p.initiated) : '') + '</div></div>' +
            '<button class="icon-btn" id="p-edit">' + I('edit', 18) + '</button>' +
          '</div>' +
          '<div class="stats" style="margin-top:16px">' +
            stat(S.db.sevas.length, t('profile.totalSeva'), true) +
            stat(st.current + ' ' + t('home.days'), t('home.streak')) +
            stat(st.best, t('profile.best')) +
            stat(U.num(tot.byType.naam || 0), t('profile.malas')) +
          '</div>' +
        '</div>' +

        '<div class="sec-t">' + t('profile.settings') + '</div>' +
        '<div class="set-group">' +
          setRow('globe', t('profile.language'), t('lang.' + s.lang), 'lang') +
          setRow('palette', t('profile.theme'), t('theme.' + s.theme), 'theme') +
          setRow('clock', t('profile.reminders'), s.reminderOn ? onTime(s) : t('common.off'), 'remind') +
          setRow('bell', t('profile.notifications'), '', 'notif') +
        '</div>' +

        '<div class="set-group">' +
          setRow('cloudDown', t('profile.update'),
            upd.available ? t('update.available') : ('v' + (S.info.versionName || '1.0.0')), 'update',
            upd.available) +
          setRow('shield', t('profile.data'), t('data.enc') + ' · AES-256', 'data') +
          setRow('key', t('profile.permissions'), '', 'perms') +
          setRow('info', t('profile.about'), '', 'about') +
        '</div>' +

        '<div class="card" style="text-align:center;padding:18px">' +
          '<div style="font-size:12px;color:var(--muted)">' + t('about.madeWith') + '</div>' +
          '<div style="font-size:13px;font-weight:700;margin-top:4px">॥ ' + t('greet.line') + ' ॥</div>' +
        '</div>' +
        '</div>';
      UI.paint(el);
      el.querySelector('#p-edit').onclick = Screens.editProfile;
      el.querySelectorAll('[data-set]').forEach(function (r) {
        r.onclick = function () {
          var k = r.getAttribute('data-set');
          if (k === 'lang') Screens.langSheet();
          if (k === 'theme') Screens.themeSheet();
          if (k === 'remind') Screens.reminderSheet();
          if (k === 'notif') Screens.permissionSheet();
          if (k === 'update') Updates.open();
          if (k === 'data') Screens.dataSheet();
          if (k === 'perms') Screens.permissionSheet();
          if (k === 'about') Screens.aboutSheet();
        };
      });
    }
  };
  function onTime(s) { return U.pad(s.reminderHour) + ':' + U.pad(s.reminderMinute); }
  function stat(n, l, ac) {
    return '<div class="stat' + (ac ? ' ac' : '') + '"><div class="stat-n">' + n + '</div><div class="stat-l">' + l + '</div></div>';
  }
  function setRow(ico, title, sub, key, alert) {
    return '<button class="set" data-set="' + key + '" style="width:100%;text-align:left">' +
      '<span class="set-i">' + I(ico, 18) + '</span>' +
      '<span class="set-b"><span class="set-t">' + title + '</span>' +
      (sub ? '<span class="set-s" style="' + (alert ? 'color:var(--ac);font-weight:700' : '') + '">' + U.esc(sub) + '</span>' : '') +
      '</span><span class="chev">' + I('right', 16) + '</span></button>';
  }

  /* ───────────────────────── SHEETS ───────────────────────── */
  function openAdd(type, entry) {
    var isEdit = !!(entry && entry.id);
    var cur = {
      type: type || (entry && entry.type) || 'naam',
      count: entry && entry.count != null ? entry.count : null,
      date: (entry && entry.date) || U.today(),
      note: (entry && entry.note) || '',
      place: (entry && entry.place) || ''
    };
    if (cur.count == null) cur.count = S.type(cur.type).def;

    var sh = UI.sheet({
      title: isEdit ? t('seva.edit') : t('seva.add'),
      body:
        '<div class="field"><label class="label">' + t('seva.type') + '</label>' +
        '<div class="quick" style="grid-template-columns:repeat(3,1fr)" id="ty-grid">' +
          S.types.map(function (ty) {
            return '<button class="qa" data-ty="' + ty.id + '" style="' +
              (ty.id === cur.type ? 'border-color:' + ty.color + ';background:' + hexA(ty.color, .12) : '') + '">' +
              '<span class="qa-i" style="background:' + hexA(ty.color, .18) + ';color:' + ty.color + '">' + I(ty.icon, 20) + '</span>' +
              '<span class="qa-l">' + t('type.' + ty.id) + '</span></button>';
          }).join('') + '</div></div>' +
        '<div class="field"><label class="label">' + t('seva.count') + ' · <span id="unit-l">' +
          t('unit.' + S.type(cur.type).unit) + '</span></label>' +
          '<div class="stepper"><button class="step-b" data-step="-1">−</button>' +
          '<input class="input" id="cnt" type="number" inputmode="numeric" value="' + cur.count + '">' +
          '<button class="step-b" data-step="1">+</button></div></div>' +
        '<div class="field"><label class="label">' + t('seva.date') + '</label>' +
          '<input class="input" id="dt" type="date" value="' + cur.date + '" max="' + U.today() + '"></div>' +
        '<div class="field"><label class="label">' + t('seva.place') + '</label>' +
          '<input class="input" id="pl" type="text" value="' + U.esc(cur.place) + '" placeholder="' + U.esc(t('seva.placePh')) + '"></div>' +
        '<div class="field"><label class="label">' + t('seva.note') + '</label>' +
          '<textarea class="textarea" id="nt" placeholder="' + U.esc(t('seva.notePh')) + '">' + U.esc(cur.note) + '</textarea></div>' +
        '<div class="btn-row">' +
          (isEdit ? '<button class="btn danger" id="del">' + I('trash', 17) + t('common.delete') + '</button>' : '') +
          '<button class="btn primary" id="save">' + I('check', 18) + t('common.save') + '</button>' +
        '</div>',
      onMount: function (el, handle) {
        el.querySelectorAll('[data-ty]').forEach(function (b) {
          b.onclick = function () {
            cur.type = b.getAttribute('data-ty');
            el.querySelectorAll('[data-ty]').forEach(function (x) {
              var ty = S.type(x.getAttribute('data-ty'));
              var on = x.getAttribute('data-ty') === cur.type;
              x.style.borderColor = on ? ty.color : '';
              x.style.background = on ? hexA(ty.color, .12) : '';
            });
            el.querySelector('#unit-l').textContent = t('unit.' + S.type(cur.type).unit);
            var inp = el.querySelector('#cnt');
            if (!isEdit) { inp.value = S.type(cur.type).def; cur.count = +inp.value; }
            S.haptic('light');
          };
        });
        el.querySelectorAll('[data-step]').forEach(function (b) {
          b.onclick = function () {
            var st = S.type(cur.type).step;
            var v = (+el.querySelector('#cnt').value || 0) + st * (+b.getAttribute('data-step'));
            el.querySelector('#cnt').value = Math.max(0, v);
            cur.count = Math.max(0, v);
            S.haptic('light');
          };
        });
        el.querySelector('#save').onclick = function () {
          cur.count = +el.querySelector('#cnt').value || 0;
          cur.date = el.querySelector('#dt').value || U.today();
          cur.place = el.querySelector('#pl').value;
          cur.note = el.querySelector('#nt').value;
          if (isEdit) S.updateSeva(entry.id, cur);
          else S.addSeva(cur.type, cur.count, cur);
          S.haptic('success');
          UI.toast(t('toast.sevaAdded'), 'ok');
          handle.close();
          refresh();
        };
        var del = el.querySelector('#del');
        if (del) del.onclick = function () {
          UI.confirm(t('seva.deleteAsk'), t('seva.deleteMsg'), true).then(function (ok) {
            if (!ok) return;
            S.removeSeva(entry.id);
            handle.close();
            UI.toast(t('toast.deleted'));
            refresh();
          });
        };
      }
    });
    return sh;
  }

  function targetSheet() {
    var v = S.db.settings.dailyTarget;
    UI.sheet({
      title: t('home.target'),
      body: '<div class="field"><label class="label">' + t('home.target') + ' · ' + t('home.days') + '</label>' +
        '<div class="stepper"><button class="step-b" data-s="-1">−</button>' +
        '<input class="input" id="tg" type="number" value="' + v + '" min="1" max="12">' +
        '<button class="step-b" data-s="1">+</button></div></div>' +
        '<button class="btn primary block" id="ok">' + t('common.save') + '</button>',
      onMount: function (el, h) {
        el.querySelectorAll('[data-s]').forEach(function (b) {
          b.onclick = function () {
            var i = el.querySelector('#tg');
            i.value = U.clamp((+i.value || 1) + (+b.getAttribute('data-s')), 1, 12);
          };
        });
        el.querySelector('#ok').onclick = function () {
          S.db.settings.dailyTarget = U.clamp(+el.querySelector('#tg').value || 5, 1, 12);
          S.save(); h.close(); refresh(); UI.toast(t('toast.saved'), 'ok');
        };
      }
    });
  }

  function editProfile() {
    var p = S.db.profile;
    UI.sheet({
      title: t('profile.edit'),
      body: '<div class="field"><label class="label">' + t('profile.name') + '</label>' +
        '<input class="input" id="n" value="' + U.esc(p.name) + '" placeholder="' + U.esc(t('profile.namePh')) + '"></div>' +
        '<div class="field"><label class="label">' + t('profile.city') + '</label>' +
        '<input class="input" id="c" value="' + U.esc(p.city) + '"></div>' +
        '<div class="field"><label class="label">' + t('profile.initiated') + '</label>' +
        '<input class="input" id="i" type="date" value="' + U.esc(p.initiated) + '"></div>' +
        '<button class="btn primary block" id="ok">' + t('common.save') + '</button>',
      onMount: function (el, h) {
        el.querySelector('#ok').onclick = function () {
          S.db.profile.name = el.querySelector('#n').value.trim();
          S.db.profile.city = el.querySelector('#c').value.trim();
          S.db.profile.initiated = el.querySelector('#i').value;
          S.save(); h.close(); refresh(); topbar(); UI.toast(t('toast.saved'), 'ok');
        };
      }
    });
  }

  function langSheet() {
    var langs = ['hi', 'en', 'pa', 'hr'];
    UI.sheet({
      title: t('profile.language'),
      body: '<div class="set-group">' + langs.map(function (l) {
        return '<button class="set" data-l="' + l + '" style="width:100%;text-align:left">' +
          '<span class="set-i">' + I('globe', 18) + '</span>' +
          '<span class="set-b"><span class="set-t">' + S.t('lang.' + l) + '</span></span>' +
          (S.i18n.get() === l ? '<span style="color:var(--ac)">' + I('check', 18) + '</span>' : '') + '</button>';
      }).join('') + '</div>',
      onMount: function (el, h) {
        el.querySelectorAll('[data-l]').forEach(function (b) {
          b.onclick = function () {
            S.i18n.set(b.getAttribute('data-l'));
            localStorage.setItem('seva.lang.set', '1');
            h.close();
            UI.toast(t('toast.langChanged'), 'ok');
            rerenderAll();
          };
        });
      }
    });
  }

  function themeSheet() {
    var themes = ['system', 'light', 'dark', 'amoled'];
    var accents = [['green', '#22C55E'], ['saffron', '#FF9A2E'], ['sky', '#38BDF8'], ['rose', '#FB7185'], ['gold', '#EAB308']];
    UI.sheet({
      title: t('profile.theme'),
      body: '<div class="field"><label class="label">' + t('profile.theme') + '</label>' +
        '<div class="seg" id="th-seg">' + themes.map(function (x) {
          return '<button class="' + (S.db.settings.theme === x ? 'is-on' : '') + '" data-th="' + x + '">' + t('theme.' + x) + '</button>';
        }).join('') + '</div></div>' +
        '<div class="field"><label class="label">' + t('profile.accent') + '</label>' +
        '<div class="swatches">' + accents.map(function (a) {
          return '<button class="sw' + (S.db.settings.accent === a[0] ? ' is-on' : '') + '" data-ac="' + a[0] +
            '" style="background:' + a[1] + '"></button>';
        }).join('') + '</div></div>' +
        '<div class="set-group" style="margin-top:16px">' +
        '<button class="set" id="hap" style="width:100%;text-align:left"><span class="set-i">' + I('zap', 18) + '</span>' +
        '<span class="set-b"><span class="set-t">' + t('common.on') + ' · Vibration</span></span>' +
        '<span class="switch' + (S.db.settings.haptics ? ' is-on' : '') + '"><i></i></span></button></div>',
      onMount: function (el) {
        el.querySelectorAll('[data-th]').forEach(function (b) {
          b.onclick = function () {
            S.db.settings.theme = b.getAttribute('data-th');
            S.save(); S.applyTheme();
            el.querySelectorAll('[data-th]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
          };
        });
        el.querySelectorAll('[data-ac]').forEach(function (b) {
          b.onclick = function () {
            S.db.settings.accent = b.getAttribute('data-ac');
            S.save(); S.applyTheme();
            el.querySelectorAll('[data-ac]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
            S.haptic('light');
          };
        });
        el.querySelector('#hap').onclick = function () {
          S.db.settings.haptics = !S.db.settings.haptics;
          S.save();
          el.querySelector('#hap .switch').classList.toggle('is-on', S.db.settings.haptics);
          S.haptic('success');
        };
      }
    });
  }

  function reminderSheet() {
    var s = S.db.settings;
    UI.sheet({
      title: t('profile.reminders'),
      body: '<div class="set-group">' +
        '<button class="set" id="r-on" style="width:100%;text-align:left"><span class="set-i">' + I('clock', 18) + '</span>' +
        '<span class="set-b"><span class="set-t">' + t('profile.reminders') + '</span>' +
        '<span class="set-s">' + t('profile.remindersSub') + '</span></span>' +
        '<span class="switch' + (s.reminderOn ? ' is-on' : '') + '"><i></i></span></button></div>' +
        '<div class="field"><label class="label">' + t('bhandara.time') + '</label>' +
        '<input class="input" id="r-time" type="time" value="' + U.pad(s.reminderHour) + ':' + U.pad(s.reminderMinute) + '"></div>' +
        '<div class="set-group"><button class="set" id="b-on" style="width:100%;text-align:left">' +
        '<span class="set-i">' + I('banner', 18) + '</span><span class="set-b"><span class="set-t">' +
        t('bhandara.remind') + '</span></span><span class="switch' + (s.bhandaraAlerts ? ' is-on' : '') + '"><i></i></span></button></div>' +
        '<button class="btn primary block" id="ok">' + t('common.save') + '</button>',
      onMount: function (el, h) {
        var on = s.reminderOn, bh = s.bhandaraAlerts;
        el.querySelector('#r-on').onclick = function () {
          on = !on; el.querySelector('#r-on .switch').classList.toggle('is-on', on);
        };
        el.querySelector('#b-on').onclick = function () {
          bh = !bh; el.querySelector('#b-on .switch').classList.toggle('is-on', bh);
        };
        el.querySelector('#ok').onclick = function () {
          var v = (el.querySelector('#r-time').value || '06:00').split(':');
          s.reminderOn = on; s.bhandaraAlerts = bh;
          s.reminderHour = +v[0]; s.reminderMinute = +v[1];
          S.save();
          if (S.native) {
            if (on) {
              S.N.j('reminderUpsert', {
                id: 'daily-seva', hour: s.reminderHour, minute: s.reminderMinute,
                days: [0, 1, 2, 3, 4, 5, 6], title: t('home.today'),
                body: t('home.addSeva') + ' · ' + t('greet.line'), route: 'add', channel: 'seva'
              });
            } else S.N.call('reminderCancel', 'daily-seva');
            ensureNotifPermission();
          }
          h.close(); refresh(); UI.toast(t('toast.reminderSet'), 'ok');
        };
      }
    });
  }

  function ensureNotifPermission() {
    if (!S.native) return;
    var p = S.N.call('permissions');
    if (p.ok && !p.notifications && S.info.sdk >= 33) {
      S.N.call('requestPermissions', JSON.stringify(['android.permission.POST_NOTIFICATIONS']));
    }
  }

  function permissionSheet() {
    var p = S.native ? S.N.call('permissions') : { notifications: false, install: false, storage: false, battery: false, exactAlarm: false };
    var rows = [
      ['notif', 'bell', t('perm.notif'), t('perm.notifSub'), p.notifications],
      ['install', 'download', t('perm.install'), t('perm.installSub'), p.install],
      ['storage', 'image', t('perm.storage'), t('perm.storageSub'), p.storage],
      ['battery', 'zap', t('perm.battery'), t('perm.batterySub'), p.battery],
      ['alarm', 'clock', t('perm.alarm'), t('perm.alarmSub'), p.exactAlarm]
    ];
    UI.sheet({
      title: t('perm.title'),
      body: '<div class="set-group">' + rows.map(function (r) {
        return '<div class="set"><span class="set-i">' + I(r[1], 18) + '</span>' +
          '<span class="set-b"><span class="set-t">' + r[2] + '</span><span class="set-s">' + r[3] + '</span></span>' +
          (r[4] ? '<span class="badge">' + t('perm.granted') + '</span>'
                : '<button class="btn sm" data-p="' + r[0] + '">' + t('perm.grant') + '</button>') + '</div>';
      }).join('') + '</div>' +
      '<div class="card tight" style="margin-top:6px"><div class="card-s">' + t('data.vaultInfo') + '</div></div>',
      onMount: function (el, h) {
        el.querySelectorAll('[data-p]').forEach(function (b) {
          b.onclick = function () {
            var k = b.getAttribute('data-p');
            if (!S.native) { UI.toast('Android only'); return; }
            if (k === 'notif') {
              if (S.info.sdk >= 33) S.N.call('requestPermissions', JSON.stringify(['android.permission.POST_NOTIFICATIONS']));
              else S.N.call('openSettings', 'notifications');
            } else if (k === 'install') S.N.call('openSettings', 'install');
            else if (k === 'storage') {
              if (S.info.sdk >= 33) S.N.call('requestPermissions', JSON.stringify(['android.permission.READ_MEDIA_IMAGES']));
              else S.N.call('requestPermissions', JSON.stringify(['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE']));
            } else if (k === 'battery') S.N.call('openSettings', 'battery');
            else if (k === 'alarm') S.N.call('openSettings', 'alarm');
            setTimeout(function () { h.close(); setTimeout(permissionSheet, 200); }, 700);
          };
        });
      }
    });
  }

  function dataSheet() {
    var st = S.native ? S.N.call('vaultStats') : { cipher: 'AES-256-GCM (native)', compression: 'LZ (browser)', records: 1, stored: S.stats.stored, pin: false };
    var ratio = S.stats.ratio ? Math.round(S.stats.ratio * 100) : 0;
    UI.sheet({
      title: t('profile.data'),
      body:
        '<div class="card tight"><div class="card-h"><div class="card-t">' + t('data.enc') + '</div>' +
          '<span class="badge">' + I('shield', 12) + ' AES-256</span></div>' +
          kv(t('data.enc'), st.cipher || 'AES-256-GCM') +
          kv('KDF', st.kdf || 'AndroidKeyStore') +
          kv(t('data.comp'), st.compression || 'DEFLATE-9') +
          kv(t('data.records'), st.records) +
          kv(t('data.stored'), U.bytes(st.stored)) +
          kv(t('data.savedSpace'), ratio + '%') +
          '<div class="prog" style="margin-top:8px"><i style="width:' + ratio + '%"></i></div>' +
          '<div class="card-s" style="margin-top:10px">' + t('data.vaultInfo') + '</div></div>' +
        '<div class="set-group">' +
          setBtn('lock', st.pin ? t('data.pinRemove') : t('data.pinSet'), t('data.pinSub'), 'pin') +
          setBtn('upload', t('data.backup'), t('data.backupSub'), 'backup') +
          setBtn('download', t('data.restore'), t('data.restoreSub'), 'restore') +
          setBtn('trash', t('data.wipe'), '', 'wipe') +
        '</div>',
      onMount: function (el, h) {
        el.querySelectorAll('[data-set]').forEach(function (b) {
          b.onclick = function () {
            var k = b.getAttribute('data-set');
            if (k === 'pin') return pinFlow(st.pin, h);
            if (k === 'backup') return backupFlow();
            if (k === 'restore') return restoreFlow(h);
            if (k === 'wipe') return wipeFlow(h);
          };
        });
      }
    });
  }
  function kv(k, v) { return '<div class="kv"><span class="k">' + k + '</span><span class="v">' + U.esc(String(v)) + '</span></div>'; }
  function setBtn(ico, title, sub, key) {
    return '<button class="set" data-set="' + key + '" style="width:100%;text-align:left">' +
      '<span class="set-i">' + I(ico, 18) + '</span><span class="set-b"><span class="set-t">' + title + '</span>' +
      (sub ? '<span class="set-s">' + sub + '</span>' : '') + '</span><span class="chev">' + I('right', 16) + '</span></button>';
  }

  function pinFlow(hasPin, h) {
    if (!S.native) { UI.toast('Android only'); return; }
    if (hasPin) {
      UI.prompt(t('data.pinEnter'), '••••', 'password').then(function (pin) {
        if (!pin) return;
        var r = S.N.call('pinRemove', pin);
        if (r.ok) { UI.toast(t('toast.pinRemoved'), 'ok'); h.close(); refresh(); }
        else UI.toast(t('data.pinWrong'), 'err');
      });
    } else {
      UI.prompt(t('data.pinNew'), '••••', 'password').then(function (pin) {
        if (!pin) return;
        if (pin.length < 4) { UI.toast(t('data.pinNew'), 'err'); return; }
        var r = S.N.call('pinSet', pin);
        if (r.ok) { UI.toast(t('toast.pinSet'), 'ok'); h.close(); refresh(); }
        else UI.toast(r.error || t('common.error'), 'err');
      });
    }
  }

  function backupFlow() {
    if (!S.native) {
      var blob = new Blob([JSON.stringify(S.db, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'seva-backup.json'; a.click();
      UI.toast(t('toast.backupDone'), 'ok'); return;
    }
    UI.prompt(t('data.pass'), '••••••', 'password').then(function (pass) {
      if (!pass) return;
      var r = S.N.call('backupExport', pass);
      if (!r.ok) { UI.toast(r.error, 'err'); return; }
      var read = S.N.call('fileReadB64', r.path);
      if (read && read.ok) {
        S.N.j('saveFileAs', { id: 'backup', name: r.name, mime: 'application/octet-stream', base64: read.base64 });
        UI.toast(t('toast.backupDone'), 'ok');
      } else {
        UI.toast(read.error || t('common.error'), 'err');
      }
    });
  }

  function restoreFlow(h) {
    if (!S.native) { UI.toast('Android only'); return; }
    S.events.on('file', function onFile(d) {
      if (d.id !== 'restore') return;
      S.events.off('file', onFile);
      if (!d.ok) return;
      UI.prompt(t('data.pass'), '••••••', 'password').then(function (pass) {
        if (!pass) return;
        var r = S.N.call('backupImport', d.base64, pass, true);
        if (r.ok) { S.load(); UI.toast(t('toast.restoreDone'), 'ok'); h.close(); rerenderAll(); }
        else UI.toast(r.error || t('common.error'), 'err');
      });
    });
    S.N.j('pickFile', { id: 'restore', mime: '*/*', encoding: 'base64' });
  }

  function wipeFlow(h) {
    UI.confirm(t('data.wipeAsk'), t('data.wipeMsg'), true).then(function (ok) {
      if (!ok) return;
      S.db.sevas = []; S.db.bhandaras = [];
      S.save(true);
      UI.toast(t('toast.wiped'));
      h.close(); rerenderAll();
    });
  }

  function aboutSheet() {
    var i = S.info;
    UI.sheet({
      title: t('profile.about'),
      body: '<div style="text-align:center;padding:6px 0 14px">' +
        '<img src="assets/logo-192.png" style="width:76px;height:76px;margin:0 auto 12px;border-radius:22px">' +
        '<div style="font-size:19px;font-weight:800">' + t('app.name') + '</div>' +
        '<div style="font-size:12px;color:var(--muted);margin-top:4px">' + t('app.tag') + '</div></div>' +
        '<div class="card tight"><div class="card-s" style="line-height:1.6">' + t('about.desc') + '</div></div>' +
        '<div class="card tight">' +
        kv(t('about.version'), 'v' + (i.versionName || '1.0.0') + ' (' + (i.versionCode || 1) + ')') +
        kv(t('update.web'), 'v' + (i.webVersion || 1)) +
        kv(t('about.device'), i.device || 'browser') +
        kv('Android', i.release ? i.release + ' · API ' + i.sdk : '—') +
        kv(t('data.enc'), 'AES-256-GCM + DEFLATE-9') +
        '</div>' +
        '<div class="card tight" style="text-align:center"><div class="card-s">' + t('about.privacy') + '</div>' +
        '<div style="margin-top:8px;font-weight:700">॥ ' + t('greet.line') + ' ॥</div></div>' +
        '<button class="btn primary block" id="chk">' + I('cloudDown', 18) + t('update.check') + '</button>',
      onMount: function (el, h) {
        el.querySelector('#chk').onclick = function () { h.close(); Updates.open(); Updates.check(true); };
      }
    });
  }

  /* ───────────────────────── glue ───────────────────────── */
  function refresh() {
    var r = UI.current();
    if (Screens[r] && Screens[r].render) Screens[r].render();
    topbar();
  }
  function rerenderAll() {
    UI.apply && UI.apply();
    S.i18n.apply(document);
    topbar();
    ['home', 'seva', 'bhandara', 'profile'].forEach(function (r) {
      if (Screens[r] && Screens[r].render) Screens[r].render();
    });
  }

  window.Screens = {
    home: home, seva: seva, bhandara: bhandara, profile: profile,
    openAdd: openAdd, targetSheet: targetSheet, editProfile: editProfile,
    langSheet: langSheet, themeSheet: themeSheet, reminderSheet: reminderSheet,
    permissionSheet: permissionSheet, dataSheet: dataSheet, aboutSheet: aboutSheet,
    topbar: topbar, refresh: refresh, rerenderAll: rerenderAll
  };
})();
