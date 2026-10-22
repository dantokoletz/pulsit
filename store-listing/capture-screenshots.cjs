// Genera las 6 capturas de la ficha de Play Store (1080×2400) en store-listing/screenshots/,
// con Chrome headless sobre el servidor de desarrollo.
// Uso: npm run dev (en otra terminal), npm install --no-save puppeteer-core,
//      node store-listing/capture-screenshots.cjs
// Requiere Google Chrome instalado (ruta en CHROME_PATH o la default de Windows).
const puppeteer = require('puppeteer-core');
const OUT = require('node:path').join(__dirname, 'screenshots');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await b.newPage();
  await p.setViewport({ width: 360, height: 800, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` });
  const fresh = async (progress, best) => {
    await p.goto('http://127.0.0.1:8080');
    await p.evaluate((progress, best) => {
      localStorage.clear();
      localStorage.setItem('pulsit.colorblindMode', 'true');
      localStorage.setItem('pulsit.campaignProgress', String(progress));
      if (best) localStorage.setItem('pulsit.bestScores', JSON.stringify(best));
    }, progress, best);
    await p.reload();
    await sleep(900);
  };
  const waitMsg = (t) => p.waitForFunction((t) => document.getElementById('game-message').textContent.includes(t), { timeout: 20000 }, t);

  await fresh(1);
  await shot('screenshot-1-inicio');

  await p.click('#btn-play');
  await p.waitForSelector('.game-button--active', { timeout: 10000 });
  await sleep(120);
  await shot('screenshot-2-secuencia');
  await waitMsg('Tu turno');
  await sleep(300);
  await shot('screenshot-3-tablero');

  await fresh(1);
  await p.click('#btn-custom-open');
  await sleep(600);
  await shot('screenshot-4-personalizado');

  await fresh(26, { 'campaign:26': 7 });
  await p.click('#btn-play');
  await waitMsg('Tu turno');
  await sleep(300);
  await shot('screenshot-5-tablero9');

  await fresh(1);
  await p.click('#btn-about-open');
  await sleep(600);
  await shot('screenshot-6-acerca');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
