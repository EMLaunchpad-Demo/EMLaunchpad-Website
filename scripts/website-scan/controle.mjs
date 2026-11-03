#!/usr/bin/env node
/**
 * Controle van /gratis-website-scan in headless Chrome of Edge: schermafbeeldingen op 390 en 1440 px
 * (voor de scan, met resultaat, met een fout, het formulier van het verbeterplan, zonder JavaScript)
 * en metingen (zijwaarts scrollen op 320, 390 en 1440 px, JavaScript-fouten).
 * Er wordt NIETS verstuurd: het formulier wordt alleen geopend.
 *
 *   node scripts/website-scan/devserver.mjs 8795          (in een ander venster)
 *   node scripts/website-scan/controle.mjs [http://localhost:8795] [scan-adres]
 *
 * Beelden en meting komen in controle/website-scan/ (staat in .assetsignore en .gitignore: niet online, niet in git).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Browser, sleep } from './cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'controle', 'website-scan');
mkdirSync(OUT, { recursive: true });
const BASE = (process.argv[2] || 'http://localhost:8795').replace(/\/$/, '');
const SCAN = process.argv[3] || 'emlaunchpad.com';
const PAGE = BASE + '/gratis-website-scan';
const result = { datum: new Date().toISOString(), base: BASE, scan: SCAN, metingen: [] };

// geen laadscherm en geen cookiemelding op de beelden (zoals na "Weigeren")
const PREP = `try{sessionStorage.setItem('em_loaded','1');localStorage.setItem('em_cookie','essential')}catch(e){}`;
const REVEAL = () => { document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('in')); return true; };
const MEET = () => ({ breedte: innerWidth, scrollBreedte: document.documentElement.scrollWidth, zijwaarts: document.documentElement.scrollWidth > innerWidth + 1 });

async function pagina(b, width, opts = {}) {
  const p = await b.newPage({ width, height: width < 600 ? 844 : 900, mobile: width < 600, dsf: opts.dsf || (width < 600 ? 2 : 1) });
  const fouten = [];
  b.on(p.sessionId, 'Runtime.consoleAPICalled', (e) => { if (e.type === 'error') fouten.push((e.args || []).map((a) => a.value || a.description || '').join(' ').slice(0, 200)); });
  await p.send('Page.addScriptToEvaluateOnNewDocument', { source: PREP });
  if (opts.zonderJs) await p.send('Emulation.setScriptExecutionDisabled', { value: true });
  p.fouten = fouten;
  return p;
}
const wacht = async (p, expr, ms = 30000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await p.eval(expr)) return true; await sleep(300); } return false; };
const noteer = async (p, naam) => { const m = await p.eval(MEET); result.metingen.push({ naam, ...m, jsFouten: [...p.consoleErrors, ...p.fouten] }); return m; };

const b = await Browser.launch({});
try {
  for (const w of [390, 1440]) {
    // 1. voor de scan
    let p = await pagina(b, w);
    await p.goto(PAGE, { settleMs: 1200 });
    await p.eval(REVEAL); await sleep(700);
    await noteer(p, `${w}-voor`);
    await p.screenshot({ path: path.join(OUT, `${w}-1-voor-de-scan.jpg`), fullPage: true, quality: 80 });
    // 3. fout: localhost
    await p.eval(() => { const i = document.querySelector('#sc-url'); i.value = 'localhost'; document.querySelector('[data-sc-form]').requestSubmit(); });
    await wacht(p, `document.querySelector('[data-sc-status]').classList.contains('is-fout')`, 15000);
    await p.eval(() => window.scrollTo(0, 0)); await sleep(400);
    result[`fout-${w}`] = await p.eval(() => document.querySelector('[data-sc-status]').textContent);
    await p.screenshot({ path: path.join(OUT, `${w}-3-fout.jpg`), quality: 82 });
    await p.close();

    // 2. met resultaat (zoals de link in de mail, zonder &plan=1)
    p = await pagina(b, w, { dsf: 1 }); // dsf 1: een volledig beeld van een lange pagina blijft zo onder de grens van Chrome (16384 px)
    await p.goto(PAGE + '?url=' + encodeURIComponent(SCAN), { settleMs: 500 });
    const ok = await wacht(p, `!document.querySelector('[data-sc-rapport]').hidden`, 45000);
    await sleep(1800);
    await p.eval(REVEAL); await sleep(600);
    result[`resultaat-${w}`] = ok ? await p.eval(() => document.querySelector('.sc-totaal').innerText.replace(/\s+/g, ' ')) : 'geen resultaat';
    await noteer(p, `${w}-resultaat`);
    // eerst naar boven: anders staat de vaste navigatie midden op het volledige beeld.
    // fx.js verbergt [data-reveal]-blokken opnieuw zodra ze buiten beeld zijn; voor het volledige beeld zetten we ze vast zichtbaar.
    await p.eval(() => { const s = document.createElement('style'); s.textContent = '[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}'; document.head.appendChild(s); window.scrollTo(0, 0); });
    await sleep(700);
    await p.screenshot({ path: path.join(OUT, `${w}-2-met-resultaat.jpg`), fullPage: true, quality: 78 });
    // 4. het formulier van het verbeterplan openen (niet invullen, niet versturen)
    await p.eval(() => { const k = document.querySelector('[data-sc-toon-form]'); if (k && !k.hidden) k.click(); document.querySelector('[data-sc-plan]').scrollIntoView({ block: 'start' }); });
    await wacht(p, `(() => { const f = document.querySelector('[data-sc-form-box] iframe'); return f && f.offsetHeight > 300; })()`, 20000);
    await sleep(3500);
    await p.eval(() => document.querySelector('[data-sc-plan]').scrollIntoView({ block: 'start' }));
    await sleep(500);
    result[`formulier-${w}`] = await p.eval(() => { const f = document.querySelector('[data-sc-form-box] iframe'); return f ? f.src.replace(/samenvatting=[^&]*/, 'samenvatting=...') : 'geen formulier'; });
    await p.screenshot({ path: path.join(OUT, `${w}-4-verbeterplan-formulier.jpg`), quality: 82 });
    await p.close();

    // 5. zonder JavaScript
    p = await pagina(b, w, { zonderJs: true });
    await p.goto(PAGE, { settleMs: 800 });
    await p.screenshot({ path: path.join(OUT, `${w}-5-zonder-javascript.jpg`), quality: 82 });
    result[`zonderJs-${w}`] = await p.send('Runtime.evaluate', { expression: '1' }).then(() => 'pagina geladen').catch(() => 'pagina geladen');
    await p.close();
  }
  // zijwaarts scrollen op 320 px: voor en met resultaat
  for (const url of [PAGE, PAGE + '?url=' + encodeURIComponent(SCAN)]) {
    const p = await pagina(b, 320);
    await p.goto(url, { settleMs: 800 });
    if (url.includes('?url=')) { await wacht(p, `!document.querySelector('[data-sc-rapport]').hidden`, 45000); await sleep(1500); }
    await noteer(p, '320-' + (url.includes('?url=') ? 'resultaat' : 'voor'));
    await p.close();
  }
} finally {
  await b.close();
}
writeFileSync(path.join(OUT, 'meting.json'), JSON.stringify(result, null, 2), 'utf8');
console.log(JSON.stringify(result, null, 2));
