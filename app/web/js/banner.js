/* ══════════════════════════════════════════════════════════════
   Seva Sagar · banner studio — offline canvas banner generator
   1080×1350 print-ready posters, 5 designs, Devanagari aware
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var S = window.Seva, U = S.u;
  var W = 1080, H = 1350;

  var TPL = [
    { id: 'saffron', name: 'केसरिया', bg: ['#FF8A1F', '#F4511E'], ink: '#2A0C00', sub: 'rgba(42,12,0,.72)', card: 'rgba(255,255,255,.92)', accent: '#7A2E00' },
    { id: 'satlok',  name: 'सतलोक',   bg: ['#0B3D2C', '#06231A'], ink: '#F4FBF6', sub: 'rgba(244,251,246,.72)', card: 'rgba(255,255,255,.08)', accent: '#4ADE80' },
    { id: 'royal',   name: 'शाही',    bg: ['#5B1220', '#2B0710'], ink: '#FFF6E5', sub: 'rgba(255,246,229,.72)', card: 'rgba(255,215,140,.12)', accent: '#FFD27A' },
    { id: 'clean',   name: 'स्वच्छ',  bg: ['#FFFFFF', '#EEF4F0'], ink: '#0C1B14', sub: 'rgba(12,27,20,.62)', card: '#F4F8F5', accent: '#16A34A' },
    { id: 'night',   name: 'रात्रि',  bg: ['#0B1220', '#050810'], ink: '#EAF2FF', sub: 'rgba(234,242,255,.68)', card: 'rgba(255,255,255,.07)', accent: '#38BDF8' }
  ];

  function font(weight, size, dev) {
    return weight + ' ' + size + 'px "Noto Sans Devanagari","Nirmala UI",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrap(ctx, text, maxW) {
    var words = String(text || '').split(/\s+/), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  function fitTitle(ctx, text, maxW, maxLines, start, min) {
    var size = start;
    while (size > min) {
      ctx.font = font('800', size);
      var lines = wrap(ctx, text, maxW);
      if (lines.length <= maxLines) return { size: size, lines: lines };
      size -= 4;
    }
    ctx.font = font('800', min);
    return { size: min, lines: wrap(ctx, text, maxW).slice(0, maxLines) };
  }

  /* brand mark drawn straight onto the canvas (same geometry as the app icon) */
  function mark(ctx, cx, cy, scale, mono) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-54, -54);
    function bez(pts, fill) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length - 2; i += 3)
        ctx.bezierCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], pts[i + 2][0], pts[i + 2][1]);
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
    }
    var g1 = mono || '#16A34A', g2 = mono || '#22C55E', g3 = mono || '#4ADE80';
    if (!mono) {
      var lg = ctx.createLinearGradient(49, 46, 59, 66);
      lg.addColorStop(0, '#6EE7A0'); lg.addColorStop(1, '#16A34A'); g3 = lg;
    }
    bez([[31,59],[40,59],[49.5,62],[54,66],[45,68.5],[36,66],[31,59]], g1);
    bez([[77,59],[68,59],[58.5,62],[54,66],[63,68.5],[72,66],[77,59]], g1);
    bez([[41,50],[48,53],[52.5,59],[54,66],[46.5,64],[42,58],[41,50]], g2);
    bez([[67,50],[60,53],[55.5,59],[54,66],[61.5,64],[66,58],[67,50]], g2);
    bez([[54,46],[58.5,53],[58.5,60],[54,66],[49.5,60],[49.5,53],[54,46]], g3);
    if (!mono) {
      var fg = ctx.createLinearGradient(47, 24, 61, 44);
      fg.addColorStop(0, '#FFD166'); fg.addColorStop(1, '#FF7A18');
      bez([[54,24],[57.5,30],[61,32.5],[61,36.5],[61,40.6],[57.9,44],[54,44],[50.1,44],[47,40.6],[47,36.5],[47,32.5],[50.5,30],[54,24]], fg);
    } else {
      bez([[54,24],[57.5,30],[61,32.5],[61,36.5],[61,40.6],[57.9,44],[54,44],[50.1,44],[47,40.6],[47,36.5],[47,32.5],[50.5,30],[54,24]], mono);
    }
    ctx.beginPath();
    ctx.moveTo(32, 74);
    ctx.bezierCurveTo(37.3, 70.5, 42.7, 77.5, 48, 74);
    ctx.bezierCurveTo(53.3, 70.5, 58.7, 77.5, 64, 74);
    ctx.bezierCurveTo(69.3, 70.5, 74.7, 77.5, 79, 74);
    ctx.strokeStyle = mono || '#4ADE80'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
  }

  function lotusWatermark(ctx, cx, cy, scale, color, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    mark(ctx, cx, cy, scale, color);
    ctx.restore();
  }

  function render(canvas, data, tplId, size) {
    var scale = (size || W) / W;
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    var ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(scale, scale);
    var t = TPL.filter(function (x) { return x.id === tplId; })[0] || TPL[0];
    var dark = t.id !== 'clean' && t.id !== 'saffron';

    /* background */
    var bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
    bg.addColorStop(0, t.bg[0]); bg.addColorStop(1, t.bg[1]);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    /* texture / decoration per template */
    if (t.id === 'night') {
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      for (var i = 0; i < 70; i++) {
        var sx = (i * 137.5) % W, sy = (i * 311.7) % (H * 0.55);
        var r = (i % 3) * 0.7 + 0.6;
        ctx.globalAlpha = 0.15 + (i % 5) * 0.12;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.284); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (t.id === 'saffron') {
      ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 2;
      for (var k = 0; k < 16; k++) {
        ctx.beginPath(); ctx.arc(W / 2, -180, 300 + k * 46, 0, Math.PI * 2); ctx.stroke();
      }
    }
    if (t.id === 'royal') {
      ctx.strokeStyle = t.accent; ctx.globalAlpha = .55; ctx.lineWidth = 3;
      rr(ctx, 34, 34, W - 68, H - 68, 34); ctx.stroke();
      ctx.lineWidth = 1; ctx.globalAlpha = .35;
      rr(ctx, 46, 46, W - 92, H - 92, 26); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (t.id === 'satlok') {
      var rg = ctx.createRadialGradient(W / 2, 250, 40, W / 2, 250, 620);
      rg.addColorStop(0, 'rgba(74,222,128,.22)'); rg.addColorStop(1, 'rgba(74,222,128,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    }
    if (t.id === 'clean') {
      ctx.fillStyle = 'rgba(22,163,74,.08)';
      ctx.beginPath(); ctx.arc(W - 90, 120, 260, 0, 6.284); ctx.fill();
      ctx.fillStyle = 'rgba(255,138,31,.10)';
      ctx.beginPath(); ctx.arc(60, H - 160, 220, 0, 6.284); ctx.fill();
    }

    lotusWatermark(ctx, W / 2, H * 0.52, 7.4, dark ? '#FFFFFF' : t.accent, dark ? 0.045 : 0.05);

    /* header mark + blessing */
    mark(ctx, W / 2, 132, 1.55, null);
    ctx.textAlign = 'center';
    ctx.fillStyle = t.sub;
    ctx.font = font('600', 30);
    ctx.fillText(S.t('bhandara.blessings'), W / 2, 232);

    /* title */
    var title = (data.title || S.t('bhandara.defaultTitle')).trim();
    var fit = fitTitle(ctx, title, W - 190, 2, 96, 56);
    ctx.fillStyle = t.ink;
    ctx.font = font('800', fit.size);
    var ty = 330;
    fit.lines.forEach(function (ln) { ctx.fillText(ln, W / 2, ty); ty += fit.size * 1.16; });

    /* subtitle ribbon */
    var subY = ty + 6;
    ctx.font = font('700', 32);
    var sub = S.t('bhandara.free');
    var sw = ctx.measureText(sub).width + 64;
    ctx.fillStyle = t.id === 'clean' ? 'rgba(22,163,74,.12)' : 'rgba(255,255,255,.14)';
    if (t.id === 'saffron') ctx.fillStyle = 'rgba(255,255,255,.85)';
    rr(ctx, (W - sw) / 2, subY, sw, 60, 30); ctx.fill();
    ctx.fillStyle = t.id === 'saffron' ? '#7A2E00' : t.accent;
    ctx.fillText(sub, W / 2, subY + 41);

    /* info card */
    var cardY = subY + 108;
    var cardH = 372;
    ctx.fillStyle = t.card;
    rr(ctx, 84, cardY, W - 168, cardH, 36); ctx.fill();
    if (dark) { ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.stroke(); }

    var dateStr = '—', dayStr = '';
    if (data.date) {
      var d = U.parseKey(data.date);
      dateStr = S.i18n.date(data.date);
      dayStr = S.i18n.days()[d.getDay()];
    }
    var rows = [
      { k: S.t('bhandara.date'), v: dateStr + (dayStr ? '  ·  ' + dayStr : ''), big: true },
      { k: S.t('bhandara.time'), v: data.time ? formatTime(data.time) : '—', big: true },
      { k: S.t('bhandara.venue'), v: data.venue || '—' }
    ];
    var ry = cardY + 66;
    rows.forEach(function (r, idx) {
      ctx.textAlign = 'left';
      ctx.fillStyle = t.sub; ctx.font = font('600', 26);
      ctx.fillText(r.k.toUpperCase(), 130, ry);
      ctx.fillStyle = t.ink;
      var vfit = fitTitle(ctx, r.v, W - 300, 1, r.big ? 46 : 38, 26);
      ctx.font = font('700', vfit.size);
      ctx.fillText(vfit.lines[0] || '—', 130, ry + (r.big ? 54 : 46));
      if (idx < rows.length - 1) {
        ctx.strokeStyle = dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.07)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(130, ry + 78); ctx.lineTo(W - 130, ry + 78); ctx.stroke();
      }
      ry += 112;
    });

    /* message */
    var my = cardY + cardH + 62;
    if (data.message) {
      ctx.textAlign = 'center';
      ctx.fillStyle = t.sub; ctx.font = font('500', 30);
      var ml = wrap(ctx, data.message, W - 220).slice(0, 2);
      ml.forEach(function (ln) { ctx.fillText(ln, W / 2, my); my += 42; });
      my += 10;
    }

    /* organiser + phone */
    var oy = Math.max(my + 24, H - 250);
    ctx.textAlign = 'center';
    if (data.organizer) {
      ctx.fillStyle = t.ink; ctx.font = font('700', 34);
      ctx.fillText(data.organizer, W / 2, oy);
      oy += 46;
    }
    if (data.phone) {
      ctx.fillStyle = t.accent; ctx.font = font('700', 32);
      ctx.fillText('☎  ' + data.phone, W / 2, oy);
      oy += 44;
    }

    /* footer */
    ctx.fillStyle = t.sub; ctx.font = font('600', 27);
    ctx.fillText(S.t('bhandara.allWelcome') + '  ·  ' + S.t('bhandara.invite'), W / 2, H - 96);
    ctx.font = font('700', 24);
    ctx.fillStyle = t.accent;
    ctx.fillText('॥ ' + S.t('greet.line') + ' ॥', W / 2, H - 54);

    ctx.restore();
    return canvas;
  }

  function formatTime(hhmm) {
    var p = String(hhmm).split(':');
    var h = +p[0], m = p[1] || '00';
    var lang = S.i18n.get();
    var ampm = h < 12 ? (lang === 'en' ? 'AM' : 'पूर्वाह्न') : (lang === 'en' ? 'PM' : 'अपराह्न');
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ':' + m + ' ' + ampm;
  }

  function toBase64(canvas) {
    var url = canvas.toDataURL('image/png');
    return url.split(',')[1];
  }

  window.Banner = {
    templates: TPL,
    render: render,
    base64: toBase64,
    W: W, H: H,
    share: function (canvas, name) {
      var b64 = toBase64(canvas);
      if (!S.native) { downloadDataUrl(canvas.toDataURL('image/png'), name); return { ok: true, browser: true }; }
      return S.N.j('share', { name: name, mime: 'image/png', base64: b64, title: S.t('bhandara.share') });
    },
    save: function (canvas, name) {
      var b64 = toBase64(canvas);
      if (!S.native) { downloadDataUrl(canvas.toDataURL('image/png'), name); return { ok: true, browser: true }; }
      return S.N.j('saveImage', { name: name, base64: b64, album: 'Seva Sagar' });
    }
  };

  function downloadDataUrl(url, name) {
    var a = document.createElement('a');
    a.href = url; a.download = name; a.click();
  }
})();
