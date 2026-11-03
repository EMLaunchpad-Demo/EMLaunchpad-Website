#!/usr/bin/env node
/**
 * Test van de gratis website scan (worker/scan.js) met Node, zonder wrangler of npm.
 *
 *   node scripts/website-scan/test.mjs                       # foute invoer + de standaardlijst echte sites
 *   node scripts/website-scan/test.mjs jouwzaak.be           # alleen deze adressen
 *   node scripts/website-scan/test.mjs --opname <map>        # alle verzoeken bewaren (elke site één keer ophalen)
 *   node scripts/website-scan/test.mjs --offline <map>       # opnieuw analyseren uit de opname, zonder netwerk
 *   node scripts/website-scan/test.mjs --json <bestand>      # ook het volledige resultaat bewaren
 *   node scripts/website-scan/test.mjs --alleen-invoer       # alleen de foute invoer, geen sites ophalen
 *
 * De invoertests halen niets op, behalve een DNS-opzoeking voor het domein dat niet bestaat en voor 127.0.0.1.nip.io.
 * Zet de opnamemap buiten de repo (bv. in een tijdelijke map): ze bevat de HTML van andermans sites.
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { scan, foutAntwoord, normaliseer, ScanFout } from '../../worker/scan.js';

const args = process.argv.slice(2);
const optie = (naam) => { const i = args.indexOf(naam); return i >= 0 ? args.splice(i, 2)[1] : null; };
const jsonUit = optie('--json');
const opname = optie('--opname');
const offline = optie('--offline');
const zonderInvoer = args.includes('--alleen-sites') ? (args.splice(args.indexOf('--alleen-sites'), 1), true) : false;
const alleenInvoer = args.includes('--alleen-invoer') ? (args.splice(args.indexOf('--alleen-invoer'), 1), true) : false;

const SITES = args.length ? args : [
  'emlaunchpad.com', 'emlteam.eu', 'clinic3d.be', 'amakhosi.be', 'bambine.be', 'mett-u.be', 'kleinhof.be', 'bubbeline.be',
];

const FOUT = [
  ['', 'leeg'], ['   ', 'leeg'], ['geen url', 'ongeldig'], ['localhost', 'niet-toegelaten'], ['http://localhost:8777/', 'niet-toegelaten'],
  ['127.0.0.1', 'niet-toegelaten'], ['http://127.0.0.1/', 'niet-toegelaten'], ['http://2130706433/', 'niet-toegelaten'], ['http://0x7f.1/', 'niet-toegelaten'],
  ['http://[::1]/', 'niet-toegelaten'], ['ftp://example.com/', 'niet-toegelaten'], ['javascript:alert(1)', 'niet-toegelaten'],
  ['file:///C:/Windows/win.ini', 'niet-toegelaten'], ['https://emlaunchpad.com:8443/', 'niet-toegelaten'], ['https://user:pw@emlaunchpad.com/', 'niet-toegelaten'],
  ['printer.local', 'niet-toegelaten'], ['intranet', 'niet-toegelaten'], ['server.internal', 'niet-toegelaten'], ['192.168.1.1', 'niet-toegelaten'],
  ['dit-domein-bestaat-zeker-niet-em-launchpad-3112.be', 'bestaat-niet'], ['127.0.0.1.nip.io', 'niet-toegelaten'],
];

/* opname en offline: elk verzoek met status, headers en inhoud */
const LEEG = new Set([101, 204, 205, 304]);
function opnemer(opslag) {
  return async (u, init) => {
    const r = await fetch(u, init);
    const buf = LEEG.has(r.status) ? null : Buffer.from(await r.arrayBuffer());
    opslag[String(u)] = { status: r.status, headers: [...r.headers], body: buf ? buf.toString('base64') : null };
    return new Response(buf, { status: r.status, headers: r.headers });
  };
}
function afspeler(opslag) {
  return async (u) => {
    const x = opslag[String(u)];
    if (!x) throw new TypeError('fetch failed (niet in de opname): ' + u);
    return new Response(x.body ? Buffer.from(x.body, 'base64') : null, { status: x.status, headers: x.headers });
  };
}
const bestand = (map, site) => path.join(map, site.replace(/[^a-z0-9.-]+/gi, '_') + '.json');

let fouten = 0;
if (!zonderInvoer && !offline) {
  console.log('== Foute invoer ==');
  for (const [invoer, verwacht] of FOUT) {
    let code;
    try {
      if (/\.(be|io)$/.test(invoer)) { await scan(invoer); code = 'ok (!)'; }
      else { normaliseer(invoer); code = 'ok (!)'; }
    } catch (e) { code = foutAntwoord(e).fout; }
    const goed = code === verwacht;
    if (!goed) fouten++;
    console.log(`${goed ? 'OK  ' : 'FOUT'} ${JSON.stringify(invoer).padEnd(52)} -> ${code}${goed ? '' : ' (verwacht ' + verwacht + ')'}`);
  }
  console.log(`Invoertests: ${FOUT.length - fouten}/${FOUT.length} goed.`);
}

if (alleenInvoer) process.exit(fouten ? 1 : 0);
console.log('\n== Echte sites ==' + (offline ? ' (offline, uit de opname)' : ''));
if (opname) await mkdir(opname, { recursive: true });
const alles = [];
for (const site of SITES) {
  const t = performance.now();
  let opslag = {};
  let fetchImpl;
  if (offline) {
    try { opslag = JSON.parse(await readFile(bestand(offline, site), 'utf8')); } catch { console.log(`\n${site}: geen opname`); continue; }
    fetchImpl = afspeler(opslag);
  } else if (opname) fetchImpl = opnemer(opslag);
  try {
    const r = await scan(site, { klok: () => performance.now(), ...(fetchImpl ? { fetch: fetchImpl } : {}) });
    alles.push(r);
    const cats = r.categorieen.map((c) => `${c.id} ${c.score}`).join(' · ');
    console.log(`\n${site} -> ${r.url}  score ${r.score}/100 (${r.label})`);
    console.log(`   ${cats}`);
    console.log(`   status ${r.meta.status}, ${r.meta.bytes} bytes, reactie ${r.meta.reactieMs} ms, analyse ${r.meta.analyseMs} ms, totaal ${Math.round(performance.now() - t)} ms, doorverwijzingen ${r.meta.doorverwijzingen.length}, verzoeken ${Object.keys(opslag).length || '?'}`);
    for (const c of r.checks) if (c.status !== 'goed') console.log(`   [${c.status.padEnd(6)}] ${c.cat.padEnd(10)} ${c.titel}: ${c.gezien}`);
  } catch (e) {
    const a = foutAntwoord(e);
    console.log(`\n${site} -> FOUT ${a.fout}${e instanceof ScanFout && e.detail ? ' (' + e.detail + ')' : ''}: ${a.bericht}`);
    if (!(e instanceof ScanFout)) console.log(e);
    alles.push({ site, ...a });
  }
  if (opname) await writeFile(bestand(opname, site), JSON.stringify(opslag), 'utf8');
}
if (jsonUit) await writeFile(jsonUit, JSON.stringify(alles, null, 2), 'utf8');
process.exitCode = fouten ? 1 : 0;
