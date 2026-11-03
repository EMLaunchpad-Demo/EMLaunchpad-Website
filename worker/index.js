// Worker van emlaunchpad.com. De site zelf blijft statisch (assets uit de hoofdmap van de repo).
// Dit script draait alleen voor /api/* (run_worker_first in wrangler.jsonc) en voor adressen die geen bestand zijn:
// die laatste gaan meteen door naar de assets, zodat de 404-pagina, de nette URL's en _redirects werken zoals voorheen.
//
// POST /api/scan  {"url": "jouwzaak.be"}  -> JSON met het resultaat van de gratis website scan (worker/scan.js).
// Limiet per IP: binding SCAN_LIMIT (Workers Rate Limiting, zie wrangler.jsonc). Ontbreekt de binding (bv. lokaal),
// dan een eenvoudige teller per isolate. Geen geheimen of sleutels nodig.

import { scan, foutAntwoord, ScanFout } from './scan.js';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'x-robots-tag': 'noindex, nofollow',
  'referrer-policy': 'strict-origin-when-cross-origin',
};

const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } });

// reserve als de Rate Limiting-binding ontbreekt: max. 8 scans per minuut per IP, per isolate
const teller = new Map();
function lokaleLimiet(ip, max = 8, ms = 60000) {
  const nu = Date.now();
  const lijst = (teller.get(ip) || []).filter((t) => nu - t < ms);
  if (lijst.length >= max) { teller.set(ip, lijst); return false; }
  lijst.push(nu); teller.set(ip, lijst);
  if (teller.size > 5000) teller.clear();
  return true;
}

async function magScannen(env, ip) {
  if (env && env.SCAN_LIMIT && typeof env.SCAN_LIMIT.limit === 'function') {
    try { const { success } = await env.SCAN_LIMIT.limit({ key: 'scan:' + ip }); return success; }
    catch { return lokaleLimiet(ip); }
  }
  return lokaleLimiet(ip);
}

export async function handleScan(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { allow: 'POST', 'cache-control': 'no-store' } });
  if (request.method !== 'POST') return json({ ok: false, fout: 'methode', bericht: 'Gebruik POST.' }, 405, { allow: 'POST' });
  // alleen JSON: een andere site kan dit dan niet zonder CORS-preflight aanroepen (en die staan we niet toe)
  if (!/^application\/json\b/i.test(request.headers.get('content-type') || '')) return json({ ok: false, fout: 'type', bericht: 'Verwacht JSON.' }, 415);
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'onbekend';
  if (!(await magScannen(env, ip))) return json(foutAntwoord(new ScanFout('te-vaak')), 429, { 'retry-after': '60' });
  let body;
  try {
    const tekst = await request.text();
    if (tekst.length > 2000) throw new Error('te groot');
    body = JSON.parse(tekst);
  } catch { return json(foutAntwoord(new ScanFout('ongeldig')), 400); }
  try {
    const resultaat = await scan(body && body.url);
    return json(resultaat);
  } catch (e) {
    const antwoord = foutAntwoord(e);
    // het gescande adres komt niet in de logs; alleen de foutcode
    if (antwoord.fout === 'intern') console.error('scan: interne fout', e && e.name, e && e.message);
    const status = ['leeg', 'ongeldig', 'niet-toegelaten'].includes(antwoord.fout) ? 400 : 422;
    return json(antwoord, antwoord.fout === 'intern' ? 500 : status);
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/scan') return handleScan(request, env);
    if (pathname.startsWith('/api/')) return json({ ok: false, fout: 'onbekend', bericht: 'Onbekend adres.' }, 404);
    // al de rest: gewoon de statische site (404-pagina, nette URL's en _redirects blijven werken)
    return env.ASSETS.fetch(request);
  },
};
