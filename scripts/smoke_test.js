/* Headless smoke test: boots the real app bundle, captures console errors,
   drives every screen and writes screenshots. Optionally injects a mock
   SevaNative bridge so the native code paths are exercised too. */
const puppeteer = require('/usr/local/lib/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const OUT = path.join(__dirname, '..', 'build', 'shots');
const MOCK = process.argv.includes('--mock');

const MOCK_BRIDGE = `
(function(){
  const store = {};
  const j = o => JSON.stringify(o);
  window.SevaNative = {
    info: () => j({ok:true,app:'Seva Sagar',package:'com.satlok.seva',versionName:'1.0.0',versionCode:1,
      webVersion:1,baseWebVersion:1,sdk:34,release:'14',device:'Pixel 7 (mock)',brand:'google',locale:'hi_IN',
      language:'hi',dark:true,channel:'stable',firstRun:false,notifications:true,canInstall:true,
      vaultPin:false,vaultUnlocked:true,runtime:'native'}),
    vaultRead: k => j({ok:true, found: !!store[k], data: store[k]||null}),
    vaultWrite: (k,v) => { store[k]=v; const stored=Math.round(v.length*0.22);
      return j({ok:true,raw:v.length,stored:stored,deflated:true,ratio:1-stored/v.length}); },
    vaultStats: () => j({records:Object.keys(store).length,stored:1234,cipher:'AES-256-GCM',
      kdf:'AndroidKeyStore (hardware)',compression:'DEFLATE-9',pin:false,unlocked:true}),
    vaultDelete: k => { delete store[k]; return j({ok:true}); },
    kvGet: k => j({ok:true,value:null}), kvSet: () => j({ok:true}),
    permissions: () => j({ok:true,notifications:true,install:true,storage:true,allFiles:false,exactAlarm:true,battery:false}),
    requestPermissions: () => j({ok:true}),
    openSettings: () => j({ok:true}),
    setBars: () => j({ok:true}), haptic: () => j({ok:true}), toast: () => j({ok:true}),
    log: m => { console.log('[native]', m); return j({ok:true}); },
    notify: o => j({ok:true,id:1}), notifyCancel: () => j({ok:true}),
    notifyState: () => j({ok:true,enabled:true}),
    reminderUpsert: () => j({ok:true}), reminderCancel: () => j({ok:true}),
    reminders: () => j({ok:true,items:[]}),
    markFirstRunDone: () => j({ok:true}),
    restart: () => { console.log('[native] restart'); return j({ok:true}); },
    share: () => j({ok:true,path:'/cache/x.png',bytes:1234}),
    saveImage: () => j({ok:true,path:'Pictures/Seva Sagar/x.png',bytes:1234}),
    updateState: () => j({ok:true,active:1,base:1,prev:-1,dir:'assets',versions:[],bytes:0,busy:false}),
    updateCheck: () => j({ok:false,error:'mock offline',status:0}),
    updatePlan: () => j({ok:true,target:1,current:1,changed:[],deleted:[],all:[],bytes:0,unchanged:12,total:12,upToDate:true}),
    updateApply: () => j({ok:true}), updateCancel: () => j({ok:true}),
    updateRollback: () => j({ok:false,active:1}), updateReset: () => j({ok:true}),
    apkState: () => j({ok:true,canInstall:true,downloaded:false,path:'',bytes:0}),
    apkDownload: () => j({ok:true}), apkInstall: () => j({ok:true}),
    http: () => j({ok:false,error:'mock'}),
    pinStatus: () => j({ok:true,pin:false,unlocked:true}),
    backupExport: () => j({ok:true,path:'/cache/b.svbak',bytes:900,name:'b.svbak'}),
    fileReadB64: () => j({ok:true,base64:'AAEC',bytes:3,name:'b.svbak'}),
    saveFileAs: () => j({ok:true}), pickFile: () => j({ok:true}), exit: () => j({ok:true})
  };
})();`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  const errors = [], logs = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => {
    const txt = m.text();
    logs.push(m.type() + ': ' + txt);
    if (m.type() === 'error') errors.push('CONSOLE: ' + txt);
  });
  page.on('requestfailed', r => {
    if (!r.url().includes('manifest.json')) errors.push('REQFAIL: ' + r.url() + ' ' + r.failure().errorText);
  });
  if (MOCK) await page.evaluateOnNewDocument(MOCK_BRIDGE);

  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2200));

  // dismiss onboarding if present
  const skipped = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.dlg-a .btn')].find(x => /skip|अभी नहीं|Not now/i.test(x.textContent));
    if (b) { b.click(); return true; } return false;
  });
  await new Promise(r => setTimeout(r, 700));
  const notifDismiss = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.dlg-a .btn')].find(x => /skip|अभी नहीं|Not now/i.test(x.textContent));
    if (b) { b.click(); return true; } return false;
  });
  await new Promise(r => setTimeout(r, 500));

  const shot = async (name) => { await page.screenshot({ path: path.join(OUT, name + '.png') }); };
  await shot('01-home');

  // seed some data through the app's own API, then re-render
  await page.evaluate(() => {
    Seva.db.profile.name = 'रामदास';
    Seva.db.profile.city = 'हिसार';
    Seva.db.meta.onboarded = true;
    const d = n => Seva.u.key(Seva.u.addDays(new Date(), -n));
    Seva.addSeva('naam', 5, { date: d(0), note: 'प्रातःकालीन जप' });
    Seva.addSeva('satsang', 45, { date: d(0) });
    Seva.addSeva('path', 12, { date: d(0) });
    Seva.addSeva('naam', 3, { date: d(1) });
    Seva.addSeva('bhandara', 4, { date: d(2), place: 'सत्लोकाश्रम' });
    Seva.addSeva('naam', 7, { date: d(3) });
    Seva.addSeva('prachar', 2, { date: d(4) });
    Seva.addSeva('naam', 4, { date: d(5) });
    Seva.addSeva('daan', 1, { date: d(6) });
    Screens.rerenderAll();
  });
  await new Promise(r => setTimeout(r, 900));
  await shot('02-home-data');

  await page.evaluate(() => UI.go('seva'));
  await new Promise(r => setTimeout(r, 700));
  await shot('03-seva');

  await page.evaluate(() => UI.go('bhandara'));
  await new Promise(r => setTimeout(r, 1200));
  await shot('04-bhandara');

  await page.evaluate(() => {
    const el = document.querySelector('[data-b="venue"]');
    if (el) { el.value = 'सतलोकाश्रम, मैन रोड, हिसार'; el.dispatchEvent(new Event('input')); }
    const ph = document.querySelector('[data-b="phone"]');
    if (ph) { ph.value = '+91 98765 43210'; ph.dispatchEvent(new Event('input')); }
  });
  await new Promise(r => setTimeout(r, 900));
  await shot('05-banner-filled');

  await page.evaluate(() => UI.go('profile'));
  await new Promise(r => setTimeout(r, 700));
  await shot('06-profile');

  await page.evaluate(() => Screens.openAdd('naam'));
  await new Promise(r => setTimeout(r, 700));
  await shot('07-add-sheet');
  await page.evaluate(() => UI.closeTopSheet());
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => Screens.themeSheet());
  await new Promise(r => setTimeout(r, 600));
  await shot('08-theme-sheet');
  // switch to light + saffron
  await page.evaluate(() => {
    document.querySelector('[data-th="light"]').click();
    document.querySelector('[data-ac="saffron"]').click();
  });
  await new Promise(r => setTimeout(r, 700));
  await shot('09-light-saffron');
  await page.evaluate(() => { UI.closeTopSheet(); UI.go('home'); });
  await new Promise(r => setTimeout(r, 800));
  await shot('10-home-light');

  // back to dark green
  await page.evaluate(() => {
    Seva.db.settings.theme = 'dark'; Seva.db.settings.accent = 'green';
    Seva.save(); Seva.applyTheme(); Screens.rerenderAll();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => Updates.open());
  await new Promise(r => setTimeout(r, 1500));
  await shot('11-update');
  await page.evaluate(() => UI.closeTopSheet());
  await new Promise(r => setTimeout(r, 400));

  await page.evaluate(() => Screens.dataSheet());
  await new Promise(r => setTimeout(r, 700));
  await shot('12-data');
  await page.evaluate(() => UI.closeTopSheet());

  const state = await page.evaluate(() => ({
    sevas: Seva.db.sevas.length, streak: Seva.streak(), route: UI.current(),
    stats: Seva.stats, theme: document.documentElement.getAttribute('data-theme'),
    native: Seva.native
  }));

  console.log(JSON.stringify({ mock: MOCK, skipped, notifDismiss, state, errors, logCount: logs.length }, null, 2));
  fs.writeFileSync(path.join(OUT, 'console.log'), logs.join('\n'));
  await browser.close();
  if (errors.length) process.exitCode = 1;
})().catch(e => { console.error('FATAL', e); process.exit(2); });
