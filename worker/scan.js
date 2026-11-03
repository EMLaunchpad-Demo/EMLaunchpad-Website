// Gratis website scan: veilig één pagina ophalen (plus robots.txt, sitemap en de http-doorverwijzing) en analyseren.
// Draait in de Cloudflare Worker (worker/index.js) en in Node (scripts/website-scan/test.mjs en devserver.mjs).
// Geen externe API's voor de analyse. Wel een DNS-opzoeking via DNS-over-HTTPS (cloudflare-dns.com) om te weigeren
// wat naar een intern of privé-adres wijst.
//
// Veiligheid (het endpoint haalt adressen op die een bezoeker ingeeft):
// - alleen http en https, standaardpoorten, geen gebruikersnaam of wachtwoord in het adres;
// - geen IP-adressen, geen localhost en geen interne namen (.local, .internal, ...), een echte topleveldomeinnaam;
// - de DNS-antwoorden mogen niet naar privé-, lokale of gereserveerde adressen wijzen;
// - elke doorverwijzing wordt opnieuw gecontroleerd, maximaal 5;
// - time-out 10 s voor de pagina, 5 s voor de extra's; maximaal 3 MB lezen;
// - een duidelijke User-Agent.

import { analyse, score } from './analyse.js';

export const VERSIE = 1;
export const UA = 'EMLaunchpadScan/1.0 (+https://emlaunchpad.com/gratis-website-scan)';
export const LIMIETEN = {
  doorverwijzingen: 5, paginaMs: 10000, extraMs: 5000, maxBytes: 3 * 1024 * 1024, robotsBytes: 256 * 1024, sitemapBytes: 64 * 1024,
  scriptBytes: 384 * 1024, subBytes: 512 * 1024, scripts: 4, verzoeken: 45, invoer: 500,
};

export const MELDINGEN = {
  'leeg': 'Geef het adres van je website in, bijvoorbeeld jouwzaak.be.',
  'ongeldig': 'Dit is geen geldig webadres. Probeer het zo: jouwzaak.be.',
  'niet-toegelaten': 'Dit adres kunnen we niet scannen. Geef het adres van een openbare website in, bijvoorbeeld jouwzaak.be.',
  'bestaat-niet': 'We vinden dit domein niet. Klopt het adres?',
  'dns-fout': 'We konden dit adres even niet opzoeken. Probeer het zo meteen opnieuw.',
  'onbereikbaar': 'We konden deze site niet bereiken. Misschien is ze even offline, of laat ze onze scan niet toe.',
  'traag': 'De site antwoordde niet binnen 10 seconden. Probeer het later opnieuw.',
  'geblokkeerd': 'Deze site laat geen automatische scans toe (bv. door een beveiliging). Dat is op zich geen fout van je site.',
  'niet-gevonden': 'Dit adres geeft een foutmelding "pagina niet gevonden". Scan het adres van je startpagina.',
  'serverfout': 'De site geeft een serverfout. Probeer het later opnieuw.',
  'geen-html': 'Op dit adres staat geen webpagina (bijvoorbeeld een pdf of een afbeelding).',
  'te-veel-doorverwijzingen': 'Dit adres stuurt meer dan 5 keer door. Daar loopt waarschijnlijk iets in een kring.',
  'te-vaak': 'Je hebt veel scans na elkaar gedaan. Wacht een minuut en probeer het dan opnieuw.',
  'intern': 'Er liep iets mis bij de scan. Probeer het zo meteen opnieuw.',
};

export class ScanFout extends Error {
  constructor(code, detail) { super(code); this.code = code; this.detail = detail || ''; }
}

/* ------------------------------------------------------------------ invoer controleren */

const VERBODEN_EINDE = ['localhost', 'local', 'localdomain', 'internal', 'intranet', 'lan', 'home', 'corp', 'private', 'test', 'example', 'invalid', 'onion', 'arpa', 'alt'];

/** Controleert een URL-object; gooit ScanFout als het adres niet mag. */
export function controleerUrl(u) {
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new ScanFout('niet-toegelaten', 'protocol ' + u.protocol);
  if (u.username || u.password) throw new ScanFout('niet-toegelaten', 'gebruikersnaam in adres');
  if (u.port !== '') throw new ScanFout('niet-toegelaten', 'poort ' + u.port);
  const h = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!h || h.length > 253) throw new ScanFout('ongeldig', 'host');
  if (h.startsWith('[') || /^[\d.]+$/.test(h) || /^0x/i.test(h)) throw new ScanFout('niet-toegelaten', 'IP-adres');
  const delen = h.split('.');
  if (delen.length < 2) throw new ScanFout('niet-toegelaten', 'geen domeinnaam');
  if (delen.some((d) => !d || d.length > 63 || !/^[a-z0-9-]+$/.test(d) || d.startsWith('-') || d.endsWith('-'))) throw new ScanFout('ongeldig', 'host');
  const tld = delen[delen.length - 1];
  if (!/^([a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(tld)) throw new ScanFout('ongeldig', 'tld');
  if (VERBODEN_EINDE.includes(tld) || h === 'localhost' || VERBODEN_EINDE.some((e) => h.endsWith('.' + e + '.arpa'))) throw new ScanFout('niet-toegelaten', 'interne naam');
  return u;
}

/** Maakt van wat de bezoeker intypt een URL (zonder #). Zonder schema: https. */
export function normaliseer(invoer) {
  let s = String(invoer == null ? '' : invoer).trim().replace(/^["'<]+|["'>]+$/g, '');
  if (!s) throw new ScanFout('leeg');
  if (s.length > LIMIETEN.invoer) throw new ScanFout('ongeldig', 'te lang');
  if (/\s/.test(s)) throw new ScanFout('ongeldig', 'spatie');
  if (/^(javascript|data|file|mailto|ftp|ftps|sftp|ws|wss|tel|blob|about|chrome|view-source|gopher|ldap|smb|ssh):/i.test(s)) throw new ScanFout('niet-toegelaten', 'protocol');
  const metSchema = /^[a-z][a-z0-9+.-]*:\/\//i.test(s);
  if (!metSchema) s = 'https://' + s.replace(/^\/+/, '');
  let u;
  try { u = new URL(s); } catch { throw new ScanFout('ongeldig', 'URL'); }
  controleerUrl(u);
  u.hash = '';
  return { url: u, metSchema };
}

/* ------------------------------------------------------------------ DNS (DNS-over-HTTPS) */

function v4Prive(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((x) => !(x >= 0 && x <= 255))) return true;
  const [a, b] = p;
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && p[2] === 100) || (a === 203 && b === 0 && p[2] === 113) || (a === 192 && b === 88 && p[2] === 99);
}
export function isPriveIp(ip) {
  const s = String(ip).toLowerCase().trim();
  if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) return v4Prive(s);
  if (!s.includes(':')) return true;
  if (s === '::' || s === '::1') return true;
  const m = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (m) return v4Prive(m[1]);
  return /^(fc|fd|fe8|fe9|fea|feb|ff|2001:db8|64:ff9b|100::|2002:)/.test(s);
}

async function dnsCheck(host, fetchImpl, cache) {
  if (cache.has(host)) return cache.get(host);
  const p = (async () => {
    const vraag = (type) => fetchImpl(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, {
      headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(4000),
    }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('DoH ' + r.status))));
    const res = await Promise.allSettled([vraag('A'), vraag('AAAA')]);
    if (res.every((r) => r.status === 'rejected')) throw new ScanFout('dns-fout');
    const ips = [];
    for (const r of res) if (r.status === 'fulfilled') for (const an of r.value.Answer || []) if (an.type === 1 || an.type === 28) ips.push(an.data);
    if (!ips.length) throw new ScanFout('bestaat-niet', host);
    if (ips.some(isPriveIp)) throw new ScanFout('niet-toegelaten', 'privé-adres');
    return ips;
  })();
  cache.set(host, p);
  p.catch(() => {});
  return p;
}

/* ------------------------------------------------------------------ ophalen */

function netwerkFout(e) {
  if (e instanceof ScanFout) return e;
  const n = (e && (e.name || '')) + ' ' + (e && e.message || '');
  if (/timeout|abort/i.test(n)) return new ScanFout('traag');
  return new ScanFout('onbereikbaar', n.trim().slice(0, 200));
}

/** Eén verzoek, zonder doorverwijzingen te volgen. */
async function stap(u, ctx, signal, extraHeaders) {
  controleerUrl(u);
  await dnsCheck(u.hostname.toLowerCase(), ctx.fetch, ctx.dns);
  const t = ctx.now();
  let res;
  try {
    res = await ctx.fetch(u.href, {
      method: 'GET', redirect: 'manual', signal,
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        'accept-language': 'nl-BE,nl;q=0.9,fr;q=0.6,en;q=0.5',
        ...(extraHeaders || {}),
      },
    });
  } catch (e) { throw netwerkFout(e); }
  return { res, ms: ctx.now() - t };
}

/** Volgt doorverwijzingen (max 5), elke stap opnieuw gecontroleerd. */
async function volg(start, ctx, signal, max = LIMIETEN.doorverwijzingen) {
  let u = start;
  const hops = [];
  for (let i = 0; ; i++) {
    const { res, ms } = await stap(u, ctx, signal);
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      try { await res.body?.cancel(); } catch { /* niets */ }
      if (i >= max) throw new ScanFout('te-veel-doorverwijzingen');
      let next;
      try { next = new URL(res.headers.get('location'), u); } catch { throw new ScanFout('onbereikbaar', 'ongeldige doorverwijzing'); }
      next.hash = '';
      hops.push({ url: u.href, status: res.status, naar: next.href });
      u = next;
      continue;
    }
    return { res, url: u, hops, ms };
  }
}

async function lees(res, max) {
  if (!res.body) return { bytes: new Uint8Array(0), afgekapt: false };
  const reader = res.body.getReader();
  const delen = [];
  let n = 0, afgekapt = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (n + value.byteLength > max) {
      delen.push(value.subarray(0, max - n)); n = max; afgekapt = true;
      try { await reader.cancel(); } catch { /* niets */ }
      break;
    }
    delen.push(value); n += value.byteLength;
  }
  const out = new Uint8Array(n);
  let o = 0;
  for (const d of delen) { out.set(d, o); o += d.byteLength; }
  return { bytes: out, afgekapt };
}

function naarTekst(bytes, contentType) {
  let cs = (/charset=["']?([\w-]+)/i.exec(contentType || '') || [])[1];
  if (!cs) {
    const kop = String.fromCharCode(...bytes.subarray(0, 2048)); // alleen ASCII nodig om de meta-tag te vinden
    cs = (/<meta[^>]+charset=["']?([\w-]+)/i.exec(kop) || [])[1];
  }
  try { return new TextDecoder((cs || 'utf-8').toLowerCase(), { fatal: false }).decode(bytes); }
  catch { return new TextDecoder('utf-8').decode(bytes); }
}

/** Extra ophalen (robots, sitemap): fouten worden null, nooit een crash. */
async function extra(u, ctx, max) {
  try {
    const { res, url } = await volg(u, ctx, AbortSignal.timeout(LIMIETEN.extraMs), 3);
    const { bytes } = res.status < 400 ? await lees(res, max) : (await res.body?.cancel(), { bytes: new Uint8Array(0) });
    return { status: res.status, url, type: res.headers.get('content-type') || '', tekst: new TextDecoder('utf-8').decode(bytes) };
  } catch (e) {
    return { status: 0, fout: e instanceof ScanFout ? e.code : 'onbereikbaar' };
  }
}

function robotsBlokkeertAlles(txt) {
  const regels = txt.split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim()).filter(Boolean);
  let inSter = false, vorigeWasAgent = false, blok = false, allowRoot = false;
  for (const l of regels) {
    const m = l.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') { inSter = vorigeWasAgent ? inSter || v === '*' : v === '*'; vorigeWasAgent = true; continue; }
    vorigeWasAgent = false;
    if (!inSter) continue;
    if (k === 'disallow' && v === '/') blok = true;
    if (k === 'allow' && (v === '/' || v === '/$')) allowRoot = true;
  }
  return blok && !allowRoot;
}

const zelfdeSite = (a, b) => a.hostname.toLowerCase().replace(/^www\./, '') === b.hostname.toLowerCase().replace(/^www\./, '');

/** De eerste link naar een boekingspagina en naar een contactpagina op dezelfde site (of null). */
export function kandidaatLinks(html, base) {
  const out = { boeken: null, contact: null };
  const re = /<a\b([^>]*)>([\s\S]{0,600}?)<\/a\s*>/gi;
  let m;
  while ((m = re.exec(html)) && (!out.boeken || !out.contact)) {
    const href = (/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(m[1]) || []).slice(1).find((x) => x !== undefined);
    if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href.trim())) continue;
    let u;
    try { u = new URL(href.trim().replace(/&amp;/g, '&'), base); } catch { continue; }
    if (!/^https?:$/.test(u.protocol) || !zelfdeSite(u, base) || u.port !== '') continue;
    u.hash = '';
    if (u.pathname === base.pathname && u.search === base.search) continue;
    const tekst = (m[2].replace(/<[^>]*>/g, ' ') + ' ' + (/\b(?:title|aria-label)\s*=\s*"([^"]*)"/i.exec(m[1]) || [])[1]).toLowerCase();
    let pad = u.pathname.toLowerCase();
    try { pad = decodeURIComponent(pad); } catch { /* laten zoals het is */ }
    if (!out.boeken && (/\b(boek|boeken|book|booking|afspraak|afspraken|reserveer|reserveren|reservatie|reservation|rendez-vous|réserver)\b/.test(tekst) || /(boek|book|afspraak|reserv|rendez-vous|agenda)/.test(pad))) out.boeken = u;
    else if (!out.contact && (/(^|\/)(contact|contacteer|contactez|kontakt)/.test(pad) || /^\s*(contact|contacteer ons|neem contact op)\s*$/.test(tekst))) out.contact = u;
  }
  return out;
}

/** Tot 4 eigen scripts van de site (geen bekende bibliotheken): daar zitten chat- en agendawidgets vaak in. */
export function eigenScripts(html, base) {
  const out = [];
  const re = /<script\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let m;
  while ((m = re.exec(html)) && out.length < LIMIETEN.scripts) {
    const src = (m[1] ?? m[2] ?? m[3] ?? '').trim().replace(/&amp;/g, '&');
    let u;
    try { u = new URL(src, base); } catch { continue; }
    if (!/^https?:$/.test(u.protocol) || !zelfdeSite(u, base) || u.port !== '') continue;
    if (/(jquery|bootstrap|wp-includes|polyfill|gtag|analytics|recaptcha|swiper|slick|lodash|gsap|three|aos|fontawesome|font-awesome|lazysizes|modernizr|cookie|consent|webpack-runtime|vendor)/i.test(u.pathname)) continue;
    if (!out.some((x) => x.href === u.href)) out.push(u);
  }
  return out;
}

/* ------------------------------------------------------------------ de scan */

/**
 * @param {string} invoer  wat de bezoeker intypte
 * @param {{fetch?: Function, now?: () => number}} opties
 * @returns {Promise<object>} resultaat (ok: true) of gooit ScanFout
 */
export async function scan(invoer, opties = {}) {
  const basis = opties.fetch || globalThis.fetch.bind(globalThis);
  let verzoeken = 0; // het gratis Workers-plan laat 50 externe verzoeken per aanroep toe: wij stoppen bij 45
  const ctx = {
    fetch: (u, init) => (++verzoeken > LIMIETEN.verzoeken ? Promise.reject(new ScanFout('onbereikbaar', 'te veel verzoeken')) : basis(u, init)),
    now: opties.now || (() => Date.now()), dns: new Map(),
  };
  const t0 = ctx.now();
  const { url: start, metSchema } = normaliseer(invoer);

  // 1. de pagina, met doorverwijzingen; zonder schema eerst https, lukt dat niet (geen verbinding), dan http
  let pagina;
  const signaal = AbortSignal.timeout(LIMIETEN.paginaMs);
  try {
    pagina = await volg(start, ctx, signaal);
  } catch (e) {
    const f = netwerkFout(e);
    if (!metSchema && start.protocol === 'https:' && f.code === 'onbereikbaar') {
      const http = new URL(start.href); http.protocol = 'http:';
      pagina = await volg(http, ctx, AbortSignal.timeout(LIMIETEN.paginaMs)).catch((e2) => { throw netwerkFout(e2); });
    } else throw f;
  }
  const { res, url, hops } = pagina;
  if (res.status >= 400) {
    try { await res.body?.cancel(); } catch { /* niets */ }
    const challenge = res.headers.get('cf-mitigated') || /captcha|challenge/i.test(res.headers.get('server') || '');
    if (res.status === 401 || res.status === 403 || res.status === 429 || challenge) throw new ScanFout('geblokkeerd', String(res.status));
    if (res.status === 404 || res.status === 410) throw new ScanFout('niet-gevonden', String(res.status));
    if (res.status === 503 && /cloudflare/i.test(res.headers.get('server') || '')) throw new ScanFout('geblokkeerd', '503');
    throw new ScanFout(res.status >= 500 ? 'serverfout' : 'onbereikbaar', String(res.status));
  }
  if (res.status >= 300) throw new ScanFout('onbereikbaar', 'doorverwijzing zonder adres');
  const type = res.headers.get('content-type') || '';
  if (type && !/html|xhtml/i.test(type)) { try { await res.body?.cancel(); } catch { /* niets */ } throw new ScanFout('geen-html', type); }
  let gelezen;
  try { gelezen = await lees(res, LIMIETEN.maxBytes); } catch (e) { throw netwerkFout(e); }
  const html = naarTekst(gelezen.bytes, type);
  if (!type && !/<html|<head|<body|<title/i.test(html.slice(0, 5000))) throw new ScanFout('geen-html', 'geen html');

  // 2. de extra's, tegelijk: robots.txt, de http-variant, eventueel /favicon.ico, de eigen scripts van de site
  //    (widgets zoals een chat of agenda worden vaak via een script geladen) en de boekings- en contactpagina
  //    als de startpagina daar alleen naar linkt
  const origin = url.origin;
  const heeftIcoon = /<link\b[^>]*rel=["']?[^"'>]*\bicon\b/i.test(html);
  const links = kandidaatLinks(html, url);
  const scriptUrls = eigenScripts(html, url);
  const leesTekst = (u, max) => extra(u, ctx, max).then((r) => (r.status === 200 && /html|javascript|ecmascript|text\/plain|^$/i.test(r.type) ? r : null));
  const [robots, http, favicon, scripts, boekPagina, contactPagina] = await Promise.all([
    extra(new URL('/robots.txt', origin), ctx, LIMIETEN.robotsBytes),
    url.protocol === 'https:'
      ? stap(new URL('http://' + url.host + '/'), ctx, AbortSignal.timeout(LIMIETEN.extraMs))
        .then(async ({ res: r }) => { try { await r.body?.cancel(); } catch { /* niets */ } return { status: r.status, location: r.headers.get('location') ? new URL(r.headers.get('location'), 'http://' + url.host + '/').href : '' }; })
        .catch(() => 'fout')
      : Promise.resolve(null),
    heeftIcoon ? Promise.resolve(true)
      : extra(new URL('/favicon.ico', origin), ctx, 64 * 1024).then((r) => r.status === 200 && (/image|icon|octet/i.test(r.type) || !r.type)),
    Promise.all(scriptUrls.map((u) => leesTekst(u, LIMIETEN.scriptBytes))),
    links.boeken ? leesTekst(links.boeken, LIMIETEN.subBytes) : Promise.resolve(null),
    links.contact ? leesTekst(links.contact, LIMIETEN.subBytes) : Promise.resolve(null),
  ]);
  const scriptTeksten = scripts.filter(Boolean).map((r) => r.tekst);
  const sub = (r, u) => (r ? { pad: u.pathname, html: r.tekst } : u ? { pad: u.pathname, html: null } : null);
  const robotsOk = robots.status >= 200 && robots.status < 300 && !/html/i.test(robots.type);
  const robotsInfo = { status: robots.status && !robotsOk && robots.status < 400 ? 404 : robots.status, blokkeertAlles: robotsOk && robotsBlokkeertAlles(robots.tekst) };

  // sitemap: eerst wat robots.txt aangeeft, dan /sitemap.xml en /sitemap_index.xml
  let sitemap = { gevonden: false, waar: '' };
  const kandidaten = [];
  if (robotsOk) for (const m of robots.tekst.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)) { try { kandidaten.push(new URL(m[1], origin)); } catch { /* niets */ } }
  kandidaten.push(new URL('/sitemap.xml', origin), new URL('/sitemap_index.xml', origin));
  const gezien = new Set();
  for (const k of kandidaten.slice(0, 4)) {
    if (gezien.has(k.href)) continue;
    gezien.add(k.href);
    const r = await extra(k, ctx, LIMIETEN.sitemapBytes);
    if (r.status === 200 && (/<(urlset|sitemapindex)\b/i.test(r.tekst) || /gzip|xml/i.test(r.type) && !/html/i.test(r.type) && /\.gz$/i.test(k.pathname))) {
      sitemap = { gevonden: true, waar: r.url.href }; break;
    }
  }

  // 3. analyse en score (opties.klok: alleen in de Node-tests, om de rekentijd van de analyse te meten)
  const tA = opties.klok ? opties.klok() : 0;
  const a = analyse(html, {
    url, headers: res.headers, bytes: gelezen.bytes.byteLength, truncated: gelezen.afgekapt, responseMs: pagina.ms, hops,
    robots: robotsInfo, sitemap, http, favicon, jaar: new Date(ctx.now()).getFullYear(),
    scripts: scriptTeksten, boekPagina: sub(boekPagina, links.boeken), contactPagina: sub(contactPagina, links.contact),
  });
  const s = score(a.checks);
  const analyseMs = opties.klok ? Math.round((opties.klok() - tA) * 10) / 10 : undefined;
  return {
    ok: true, versie: VERSIE,
    invoer: start.href, url: url.href, host: url.hostname,
    gescand: new Date(t0).toISOString(), duurMs: ctx.now() - t0,
    score: s.totaal, label: s.label, categorieen: s.categorieen, plan: s.plan, checks: a.checks,
    meta: { status: res.status, doorverwijzingen: hops, bytes: gelezen.bytes.byteLength, afgekapt: gelezen.afgekapt, reactieMs: Math.round(pagina.ms), weinigTekst: a.weinigTekst, jsSite: a.jsSite, analyseMs },
  };
}

/** Nette foutmelding voor de bezoeker. */
export function foutAntwoord(e) {
  const code = e instanceof ScanFout ? e.code : 'intern';
  return { ok: false, fout: code, bericht: MELDINGEN[code] || MELDINGEN.intern };
}
