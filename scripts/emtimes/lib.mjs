/**
 * EM Times — sjablonen + build.
 *
 * Eén bron van waarheid voor alle EM Times-pagina's (hub, categorieën, artikels).
 * Metadata komt uit emtimes-articles.js, de artikeltekst uit de bestaande
 * artikelpagina (tussen de ET:PROSE-markers). `build()` genereert alles opnieuw,
 * dus een restyle = dit bestand + emtimes.css aanpassen en de build draaien.
 *
 * Gebruikt door:
 *   scripts/build-emtimes.mjs          (handmatig: alles opnieuw opbouwen)
 *   scripts/generate-emtimes-post.mjs  (dagelijkse GitHub Action)
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const SITE = "https://emlaunchpad.com";
const ARTICLES_JS = "emtimes-articles.js";
const SITEMAP = "sitemap.xml";

/* Volgorde = volgorde in de tabs + rotatievolgorde van de generator. */
export const CATEGORIES = [
  {
    key: "ai", dir: "ai", label: "AI", name: "AI-chatbots & voice",
    h1: ["AI-chatbots &", "voice agents."],
    lead: "Hoe slimme assistenten je klantcontact overnemen — vragen beantwoorden, leads kwalificeren en afspraken boeken, dag en nacht. Alles wat je moet weten, in gewone taal.",
    desc: "Hoe slimme assistenten vragen beantwoorden, leads kwalificeren en afspraken boeken — 24/7.",
    icon: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  },
  {
    key: "auto", dir: "automatisering", label: "Automatisering", name: "Automatisering",
    h1: ["Automatisering die", "tijd teruggeeft."],
    lead: "Workflows die het saaie, terugkerende werk overnemen: opvolging, afspraken, reviews, facturen en meer. Zodat jij tijd overhoudt voor wat écht telt.",
    desc: "Workflows die het saaie werk overnemen: opvolging, facturen, planning en meer.",
    icon: '<path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.5-5.5-2.8 2.8M9.3 14.7l-2.8 2.8m0-11.3 2.8 2.8m5.4 5.4 2.8 2.8"/>',
  },
  {
    key: "web", dir: "websites", label: "Websites", name: "Websites",
    h1: ["Websites die", "klanten opleveren."],
    lead: "Snelheid, vindbaarheid en conversie hangen samen. We leggen uit hoe je een website bouwt die niet alleen mooi is, maar ook gevonden wordt in Google en bezoekers omzet in klanten.",
    desc: "Snelle, converterende websites die vindbaar zijn in Google en klanten opleveren.",
    icon: '<path d="M3 5h18v14H3zM3 9h18M7 13h6"/>',
  },
  {
    key: "groei", dir: "groei", label: "Groei", name: "Groei & marketing",
    h1: ["Groei &", "marketing."],
    lead: "Google Bedrijfsprofiel, lokale SEO, reviews en reputatie: hoe je beter gevonden wordt in je eigen regio — en meer klanten laat terugkomen.",
    desc: "Lokale SEO, Google Bedrijfsprofiel en reviews: beter gevonden worden in je regio.",
    icon: '<path d="M3 17l6-6 4 4 8-8m0 0h-5m5 0v5"/>',
  },
];
export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

/* ── helpers ─────────────────────────────────────────────────────────── */
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const unesc = (s) => String(s ?? "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const stripTags = (s) => unesc(String(s).replace(/<[^>]+>/g, "")).trim();

const MONTHS_FULL = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const MONTHS_ABBR = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
export const humanDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS_FULL[m - 1]} ${y}`; };
export const shortDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS_ABBR[m - 1]} ${y}`; };
const isoFromShort = (s) => {
  const m = String(s || "").match(/^(\d{1,2}) ([a-z]{3}) (\d{4})$/);
  if (!m) return null;
  const mi = MONTHS_ABBR.indexOf(m[2]);
  return mi < 0 ? null : `${m[3]}-${String(mi + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
};
const cestOffset = (iso) => { const m = +iso.slice(5, 7); return m >= 4 && m <= 10 ? "+02:00" : "+01:00"; };
export const slugify = (s) => stripTags(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const ARROW = '<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
const SEARCH_ICO = '<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>';
const catIcon = (c) => `<svg fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">${c.icon}</svg>`;
const fb = (a) => (/og-image\./.test(a.img) ? ' class="is-fb"' : "");
const plural = (n) => `${n} ${n === 1 ? "artikel" : "artikels"}`;

/* ── artikels-index lezen/schrijven ──────────────────────────────────── */
export async function readArticles() {
  const src = await readFile(path.join(ROOT, ARTICLES_JS), "utf8");
  const ctx = { window: {} };
  vm.runInNewContext(src, ctx);
  return JSON.parse(JSON.stringify(ctx.window.ET_ARTICLES || []));
}

const FIELDS = ["title", "excerpt", "desc", "topic", "topicKey", "path", "date", "iso", "read", "img", "alt", "tags"];
export async function writeArticles(list) {
  const body = list.map((a) => "  {\n" + FIELDS.filter((f) => a[f] !== undefined)
    .map((f) => `    ${f}: ${JSON.stringify(a[f])}`).join(",\n") + "\n  }").join(",\n");
  const src = `/* EM Times — artikel-index (bron voor zoekfunctie, hubs en gerelateerde artikels).
   Wordt beheerd door scripts/build-emtimes.mjs en de dagelijkse generator.
   Nieuwste bovenaan. 'path' en 'img' zijn relatief t.o.v. de site-root. */
window.ET_ARTICLES = [
${body}
];
`;
  await writeFile(path.join(ROOT, ARTICLES_JS), src);
}

/* Cache-versies: site-assets volgen de homepage, eigen assets krijgen een content-hash. */
async function versions() {
  const home = await readFile(path.join(ROOT, "index.html"), "utf8");
  const v = (file, fallback) => (home.match(new RegExp(file.replace(".", "\\.") + '\\?v=([^"\']+)')) || [])[1] || fallback;
  const hash = async (f) => crypto.createHash("md5").update(await readFile(path.join(ROOT, f))).digest("hex").slice(0, 8);
  return {
    homeCss: v("home.css", "1"), redesignCss: v("home-redesign.css", "1"),
    siteJs: v("site.js", "1"), starsJs: v("stars.js", "1"),
    etCss: await hash("emtimes.css"), etJs: await hash("emtimes.js"), etIdx: await hash(ARTICLES_JS),
  };
}

/* ── prose ───────────────────────────────────────────────────────────── */
export function extractProse(html) {
  const m = html.match(/<!-- ET:PROSE:START -->([\s\S]*?)<!-- ET:PROSE:END -->/);
  if (m) return m[1].trim();
  // oud formaat (vóór de vernieuwing)
  const open = '<div class="et-prose">';
  const s = html.indexOf(open), e = html.indexOf("<!-- auteur + einde -->");
  if (s < 0 || e < 0) return null;
  const inner = html.slice(s + open.length, e);
  return inner.slice(0, inner.lastIndexOf("</div>")).trim();
}

/* Geeft elke <h2> een stabiele id en levert de inhoudstafel. */
function withToc(prose) {
  const toc = [], seen = new Set();
  const html = prose.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g, (all, attrs = "", inner) => {
    const has = attrs.match(/\sid="([^"]+)"/);
    let id = has ? has[1] : slugify(inner) || "sectie";
    if (!has) { let n = 2, base = id; while (seen.has(id)) id = `${base}-${n++}`; }
    seen.add(id);
    toc.push({ id, text: stripTags(inner) });
    return has ? all : `<h2${attrs} id="${id}">${inner}</h2>`;
  });
  return { html, toc };
}

/* Vragen uit een <div class="et-faq"> (h3 = vraag, wat volgt = antwoord) → FAQPage-schema. */
function faqOf(prose) {
  const m = prose.match(/<div class="et-faq">([\s\S]*?)<\/div>/);
  if (!m) return [];
  return m[1].split(/<h3[^>]*>/).slice(1).map((chunk) => {
    const [q, rest = ""] = chunk.split("</h3>");
    return { q: stripTags(q), a: stripTags(rest).replace(/\s+/g, " ") };
  }).filter((f) => f.q && f.a);
}

/* ── gedeelde bouwstenen ─────────────────────────────────────────────── */
function page({ R, V, title, desc, canonical, ogType = "website", ogImage, jsonld, topic = "", main }) {
  const img = ogImage || `${SITE}/assets/og-image.png`;
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${esc(title)}</title>
<meta content="${esc(desc)}" name="description"/>
<meta content="EM Launchpad" name="author"/>
<meta content="index, follow, max-image-preview:large" name="robots"/>
<meta content="#0a0b0a" name="theme-color"/>
<link href="${R}site.webmanifest" rel="manifest"/>
<link href="${canonical}" rel="canonical"/>
<link href="${R}assets/favicon.ico" rel="icon" sizes="any"/>
<link href="${R}assets/favicon-32.png" rel="icon" sizes="32x32" type="image/png"/>
<link href="${R}assets/favicon-16.png" rel="icon" sizes="16x16" type="image/png"/>
<link href="${R}assets/apple-touch-icon.png" rel="apple-touch-icon"/>
<link href="${SITE}/emtimes/feed.xml" rel="alternate" title="EM Times" type="application/rss+xml"/>
<!-- Open Graph / social -->
<meta content="${ogType}" property="og:type"/>
<meta content="EM Launchpad" property="og:site_name"/>
<meta content="nl_BE" property="og:locale"/>
<meta content="${esc(title)}" property="og:title"/>
<meta content="${esc(desc)}" property="og:description"/>
<meta content="${canonical}" property="og:url"/>
<meta content="${img}" property="og:image"/>
<meta content="summary_large_image" name="twitter:card"/>
<meta content="${esc(title)}" name="twitter:title"/>
<meta content="${esc(desc)}" name="twitter:description"/>
<meta content="${img}" name="twitter:image"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&amp;family=JetBrains+Mono:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="${R}home.css?v=${V.homeCss}" rel="stylesheet"/>
<link href="${R}home-redesign.css?v=${V.redesignCss}" rel="stylesheet"/>
<link href="${R}emtimes.css?v=${V.etCss}" rel="stylesheet"/>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body data-page="emtimes" data-skin="v2" data-root="${R}" data-topic="${topic}" data-lang-fallback="index.html">
<a class="skip-link" href="#main">Naar inhoud</a>
<div id="nav-mount"></div>
${main}
<div id="footer-mount"></div>
<script src="${R}site.js?v=${V.siteJs}"></script>
<script src="${R}stars.js?v=${V.starsJs}"></script>
<script src="${R}emtimes-articles.js?v=${V.etIdx}"></script>
<script src="${R}emtimes.js?v=${V.etJs}"></script>
<script src="https://widgets.leadconnectorhq.com/loader.js" data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js" data-widget-id="685bcf1cc6f0443168b1c35c"></script>
</body>
</html>
`;
}

const crumb = (items) => `<nav class="emt-crumb" aria-label="Kruimelpad">${items.map(([label, href], i) =>
  (i ? '<span class="sep" aria-hidden="true">/</span>' : "") + (href ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`)).join("")}</nav>`;

const byline = (R, a) => `<span class="emt-meta"><span class="emt-av"><img alt="" src="${R}assets/logo-em.png" width="40" height="40"/></span><span>EM Launchpad</span><i aria-hidden="true"></i><time datetime="${a.iso}">${esc(a.date)}</time><i aria-hidden="true"></i><span>${esc(a.read)} lezen</span></span>`;

export function cardHtml(a, R) {
  return `<a class="et-card" data-reveal="" href="${R}${a.path}">
<span class="et-media"><img${fb(a)} alt="${esc(a.alt)}" height="500" loading="lazy" src="${R}${a.img}" width="800"/></span>
<span class="et-cat">${esc(a.topic)}</span>
<h3 class="et-title">${esc(a.title)}</h3>
<p class="et-excerpt">${esc(a.excerpt)}</p>
<span class="et-meta"><time datetime="${a.iso}">${esc(a.date)}</time> · ${esc(a.read)} lezen</span>
<span class="et-more">Lees artikel ${ARROW}</span>
</a>`;
}

function featHtml(a, R, badge) {
  return `<a class="emt-feat" data-reveal="" href="${R}${a.path}">
<span class="emt-feat-media"><img${fb(a)} alt="${esc(a.alt)}" height="500" src="${R}${a.img}" width="800"/><span class="emt-badge"><span class="dot"></span>${esc(badge)}</span></span>
<span class="emt-feat-body">
<span class="et-cat">${esc(a.topic)}</span>
<h2 class="emt-feat-title">${esc(a.title)}</h2>
<p class="emt-feat-ex">${esc(a.excerpt)}</p>
${byline(R, a)}
<span class="emt-go">Lees artikel ${ARROW}</span>
</span>
</a>`;
}

function tabsHtml(R, active, counts) {
  const tab = (label, href, key, n) => {
    const on = key === active;
    return `<a class="emt-tab${on ? " is-on" : ""}" href="${href}"${on ? ' aria-current="page"' : ""}>${esc(label)}<span class="n">${n}</span></a>`;
  };
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  return `<nav class="emt-tabs" aria-label="Onderwerpen">
<div class="wrap emt-tabs-in">
<div class="emt-tablist">
${tab("Alles", `${R}emtimes/`, "all", total)}
${CATEGORIES.map((c) => counts[c.key]
    ? tab(c.label, `${R}emtimes/${c.dir}/`, c.key, counts[c.key])
    : `<span class="emt-tab is-soon" title="Binnenkort">${esc(c.label)}<span class="n">binnenkort</span></span>`).join("\n")}
</div>
<button class="emt-tabsearch" data-et-search="" type="button" aria-label="Zoek een artikel">${SEARCH_ICO}<span>Zoeken</span><kbd>/</kbd></button>
</div>
</nav>`;
}

function topicsHtml(R, counts, { exclude = null, eyebrow, h2a, h2b } = {}) {
  const cats = CATEGORIES.filter((c) => c.key !== exclude);
  return `<section class="sec emt-topics">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">${esc(eyebrow)}</span>
<h2 class="h2">${esc(h2a)} <span class="grad">${esc(h2b)}</span></h2>
</div>
<div class="emt-topicgrid${cats.length === 3 ? " three" : ""}" data-reveal-group="">
${cats.map((c) => {
    const n = counts[c.key] || 0, idx = String(CATEGORIES.indexOf(c) + 1).padStart(2, "0");
    const inner = `<span class="emt-topic-top"><span class="ic">${catIcon(c)}</span><span class="idx">${idx}/</span></span>
<h3>${esc(c.name)}</h3>
<p>${esc(c.desc)}</p>
<span class="cnt">${n ? `${plural(n)} ${ARROW}` : "binnenkort"}</span>`;
    return n ? `<a class="emt-topic" data-reveal="" href="${R}emtimes/${c.dir}/">\n${inner}\n</a>` : `<div class="emt-topic is-soon" data-reveal="">\n${inner}\n</div>`;
  }).join("\n")}
</div>
</div>
</section>`;
}

const ctaBand = (R) => `<section class="cta-band emt-cta">
<canvas aria-hidden="true" class="starfield" data-stars=""></canvas>
<div class="glow"></div>
<div class="wrap">
<div class="cta-inner" data-reveal="">
<h2>Klaar om AI voor jóú <span class="grad">te laten werken?</span></h2>
<p class="lead">Plan een gratis kennismakingsgesprek van 30 minuten. We bekijken samen welke systemen jouw bedrijf tijd en klanten opleveren. Geen verplichtingen, geen sales-druk.</p>
<div class="row"><a class="btn" data-book="" href="${R}Contact">Plan je gratis gesprek ${ARROW}</a><a class="btn-ghost" href="${R}Diensten">Bekijk onze diensten</a></div>
<div class="badges">
<span>Gratis en vrijblijvend</span>
<span>30 minuten</span>
<span>Direct duidelijkheid</span>
</div>
</div>
</div>
</section>`;

function listSection(R, list, { featBadge, eyebrow, h2a, h2b }) {
  const [first, ...rest] = list;
  return `<section class="sec emt-list">
<div class="wrap">
${featHtml(first, R, featBadge)}
${rest.length ? `<div class="sec-head emt-shead" data-reveal="">
<span class="eyebrow">${esc(eyebrow)}</span>
<h2 class="h2">${esc(h2a)} <span class="grad">${esc(h2b)}</span></h2>
</div>
<div class="et-grid${rest.length === 2 || rest.length === 4 ? " emt-two" : ""}" data-reveal-group="">
${rest.map((a) => cardHtml(a, R)).join("\n")}
</div>` : ""}
</div>
</section>`;
}

const countsOf = (arts) => Object.fromEntries(CATEGORIES.map((c) => [c.key, arts.filter((a) => a.topicKey === c.key).length]));
const breadcrumbLd = (items) => ({ "@type": "BreadcrumbList", itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })) });

/* ── pagina's ────────────────────────────────────────────────────────── */
export function hubPage(arts, V) {
  const R = "../", counts = countsOf(arts);
  const jsonld = { "@context": "https://schema.org", "@graph": [
    { "@type": "Blog", "@id": `${SITE}/emtimes/#blog`, name: "EM Times", url: `${SITE}/emtimes/`,
      description: "Kennishub van EM Launchpad over AI, automatisatie en websites voor Belgische bedrijven.", inLanguage: "nl-BE",
      publisher: { "@id": `${SITE}/#organization` },
      blogPost: arts.map((a) => ({ "@type": "BlogPosting", headline: a.title, url: `${SITE}/${a.path}`, datePublished: a.iso, image: `${SITE}/${a.img}`, author: { "@id": `${SITE}/#organization` } })) },
    breadcrumbLd([["Home", `${SITE}/`], ["EM Times", `${SITE}/emtimes/`]]),
  ] };
  const main = `<header class="emt-hero" id="main" tabindex="-1">
<canvas aria-hidden="true" class="starfield" data-stars=""></canvas>
<div class="glow"></div>
<div class="wrap emt-hero-in">
<span class="eyebrow" data-reveal="">EM Times · kennishub</span>
<h1 class="emt-h1" data-reveal="">AI-inzichten voor <span class="grad">Belgische bedrijven.</span></h1>
<p class="lead" data-reveal="">De kennishub van EM Launchpad — praktische gidsen en uitleg over AI-chatbots, voice agents, automatisatie, websites en lokale SEO. Zonder de technische wollige taal.</p>
<button class="emt-search" data-et-search="" data-reveal="" type="button">${SEARCH_ICO}<span class="ph">Zoek een artikel, onderwerp of trefwoord…</span><span class="keys"><kbd>⌘</kbd><kbd>K</kbd></span></button>
</div>
</header>
${tabsHtml(R, "all", counts)}
<main class="emt-main">
${listSection(R, arts, { featBadge: "Nieuwste artikel", eyebrow: "Alle artikels", h2a: "Nieuw op", h2b: "EM Times." })}
${topicsHtml(R, counts, { eyebrow: "Onderwerpen", h2a: "Ontdek per", h2b: "categorie." })}
${ctaBand(R)}
</main>`;
  return page({ R, V, main, jsonld,
    title: "EM Times — AI-inzichten voor Belgische bedrijven | EM Launchpad",
    desc: "EM Times is de kennishub van EM Launchpad: praktische gidsen over AI-chatbots, automatisatie, websites en lokale SEO voor groeiende Belgische bedrijven.",
    canonical: `${SITE}/emtimes/` });
}

export function categoryPage(c, list, arts, V) {
  const R = "../../", counts = countsOf(arts), url = `${SITE}/emtimes/${c.dir}/`;
  const jsonld = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", "@id": `${url}#page`, name: `${c.name} — EM Times`, url, description: c.lead, inLanguage: "nl-BE",
      isPartOf: { "@id": `${SITE}/emtimes/#blog` },
      hasPart: list.map((a) => ({ "@type": "BlogPosting", headline: a.title, url: `${SITE}/${a.path}`, datePublished: a.iso })) },
    breadcrumbLd([["Home", `${SITE}/`], ["EM Times", `${SITE}/emtimes/`], [c.name, url]]),
  ] };
  const main = `<header class="emt-hero emt-hero--cat" id="main" tabindex="-1">
<canvas aria-hidden="true" class="starfield" data-stars=""></canvas>
<div class="glow"></div>
<div class="wrap emt-hero-in">
${crumb([["Home", `${R}`], ["EM Times", `${R}emtimes/`], [c.name, null]])}
<span class="eyebrow" data-reveal="">Onderwerp · ${plural(list.length)}</span>
<h1 class="emt-h1" data-reveal="">${esc(c.h1[0])} <span class="grad">${esc(c.h1[1])}</span></h1>
<p class="lead" data-reveal="">${esc(c.lead)}</p>
</div>
</header>
${tabsHtml(R, c.key, counts)}
<main class="emt-main">
${listSection(R, list, { featBadge: "Nieuwste in " + c.label, eyebrow: "Meer over " + c.label, h2a: "Alle artikels over", h2b: c.label.toLowerCase() + "." })}
${topicsHtml(R, counts, { exclude: c.key, eyebrow: "Verder lezen", h2a: "Andere", h2b: "onderwerpen." })}
${ctaBand(R)}
</main>`;
  return page({ R, V, main, jsonld, topic: c.key,
    title: `${c.name} — EM Times | EM Launchpad`, desc: c.lead, canonical: url });
}

export function articlePage(a, proseRaw, related, V) {
  const R = "../../../", c = CAT[a.topicKey], url = `${SITE}/${a.path}`, img = `${SITE}/${a.img}`;
  const { html: prose, toc } = withToc(proseRaw);
  const words = stripTags(prose).split(/\s+/).filter(Boolean).length;
  const published = `${a.iso}T09:00:00${cestOffset(a.iso)}`;
  const jsonld = { "@context": "https://schema.org", "@graph": [
    { "@type": "BlogPosting", "@id": `${url}#article`, headline: a.title, description: a.desc, image: img,
      datePublished: published, dateModified: published, inLanguage: "nl-BE",
      author: { "@id": `${SITE}/#organization` }, publisher: { "@id": `${SITE}/#organization` },
      mainEntityOfPage: { "@type": "WebPage", "@id": url }, articleSection: c.name, keywords: (a.tags || []).join(", "), wordCount: words },
    breadcrumbLd([["Home", `${SITE}/`], ["EM Times", `${SITE}/emtimes/`], [c.name, `${SITE}/emtimes/${c.dir}/`], [a.title, url]]),
  ] };
  const faq = faqOf(prose);
  if (faq.length) jsonld["@graph"].push({ "@type": "FAQPage", "@id": `${url}#faq`,
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  const share = encodeURIComponent(url), shareText = encodeURIComponent(a.title);
  const main = `<header class="emt-ahead" id="main" tabindex="-1">
<canvas aria-hidden="true" class="starfield" data-stars=""></canvas>
<div class="glow"></div>
<div class="wrap emt-ahead-in">
${crumb([["Home", `${R}`], ["EM Times", `${R}emtimes/`], [c.name, `${R}emtimes/${c.dir}/`]])}
<span class="eyebrow">${esc(a.topic)}</span>
<h1 class="emt-atitle">${esc(a.title)}</h1>
<p class="emt-adek">${esc(a.excerpt)}</p>
${byline(R, a)}
</div>
</header>
<main class="emt-main">
<figure class="wrap emt-cover"><img${fb(a)} alt="${esc(a.alt)}" fetchpriority="high" height="500" src="${R}${a.img}" width="800"/></figure>
<div class="wrap emt-layout">
<article class="et-prose" id="artikel">
<!-- ET:PROSE:START -->
${prose}
<!-- ET:PROSE:END -->
<div class="emt-authorbox">
<span class="emt-av lg"><img alt="" src="${R}assets/logo-em.png" width="56" height="56"/></span>
<div><b>Geschreven door EM Launchpad</b><p>Belgisch AI-bureau uit Limburg. We bouwen websites, chatbots, voice agents en automatisaties die lokale bedrijven laten groeien — en schrijven hier op wat we onderweg leren.</p></div>
</div>
</article>
<aside class="emt-aside" aria-label="Artikel-hulpmiddelen">
${toc.length > 1 ? `<nav class="emt-toc" aria-label="In dit artikel">
<span class="emt-lbl">In dit artikel</span>
<ol>
${toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join("\n")}
</ol>
</nav>` : ""}
<div class="emt-share">
<span class="emt-lbl">Delen</span>
<div class="emt-share-row">
<button class="emt-sh" data-copy="${url}" type="button" aria-label="Kopieer link"><svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span>Kopieer link</span></button>
<a class="emt-sh" href="https://www.linkedin.com/sharing/share-offsite/?url=${share}" rel="noopener" target="_blank" aria-label="Deel op LinkedIn"><svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.3 21 14.7V21h-4v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V21H9z"/></svg></a>
<a class="emt-sh" href="https://wa.me/?text=${shareText}%20${share}" rel="noopener" target="_blank" aria-label="Deel via WhatsApp"><svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-2.9.9.9-2.8-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.1.7a2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg></a>
</div>
</div>
<div class="emt-minicta">
<span class="emt-lbl">Gratis demo</span>
<b>Wat levert dit op voor jóúw bedrijf?</b>
<p>We bouwen een demo op maat en tonen in 30 minuten wat het concreet oplevert.</p>
<a class="btn" data-book="" href="${R}Contact">Plan een gesprek ${ARROW}</a>
</div>
</aside>
</div>
${related.length ? `<section class="sec emt-related">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">Lees verder</span>
<h2 class="h2">Meer uit <span class="grad">EM Times.</span></h2>
</div>
<div class="et-grid" data-reveal-group="">
${related.map((r) => cardHtml(r, R)).join("\n")}
</div>
</div>
</section>` : ""}
${ctaBand(R)}
</main>`;
  return page({ R, V, main, jsonld, topic: a.topicKey, ogType: "article", ogImage: img,
    title: `${a.title} | EM Times`, desc: a.desc, canonical: url });
}

/* Max. 3: eerst uit dezelfde categorie, dan de nieuwste andere. */
function relatedOf(a, arts) {
  const others = arts.filter((x) => x.path !== a.path);
  const same = others.filter((x) => x.topicKey === a.topicKey);
  return [...same, ...others.filter((x) => x.topicKey !== a.topicKey)].slice(0, 3);
}

/* ── RSS-feed ────────────────────────────────────────────────────────── */
function feedXml(arts) {
  const x = (s) => esc(s).replace(/'/g, "&apos;");
  const rfc = (iso) => new Date(`${iso}T09:00:00${cestOffset(iso)}`).toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>EM Times — EM Launchpad</title>
<link>${SITE}/emtimes/</link>
<atom:link href="${SITE}/emtimes/feed.xml" rel="self" type="application/rss+xml"/>
<description>Praktische inzichten over AI, automatisatie en websites voor Belgische bedrijven.</description>
<language>nl-BE</language>
<lastBuildDate>${rfc(arts[0].iso)}</lastBuildDate>
${arts.map((a) => `<item>
<title>${x(a.title)}</title>
<link>${SITE}/${a.path}</link>
<guid isPermaLink="true">${SITE}/${a.path}</guid>
<pubDate>${rfc(a.iso)}</pubDate>
<category>${x(CAT[a.topicKey].name)}</category>
<description>${x(a.excerpt)}</description>
</item>`).join("\n")}
</channel>
</rss>
`;
}

/* ── sitemap: EM Times-URL's toevoegen/bijwerken, de rest ongemoeid laten ── */
async function syncSitemap(arts) {
  const file = path.join(ROOT, SITEMAP);
  let xml = await readFile(file, "utf8");
  const want = new Map([[`${SITE}/emtimes/`, { lastmod: arts[0].iso, freq: "weekly", prio: "0.8" }]]);
  for (const c of CATEGORIES) {
    const list = arts.filter((a) => a.topicKey === c.key);
    if (list.length) want.set(`${SITE}/emtimes/${c.dir}/`, { lastmod: list[0].iso, freq: "weekly", prio: "0.7" });
  }
  for (const a of arts) want.set(`${SITE}/${a.path}`, { lastmod: a.iso, freq: "monthly", prio: "0.7", keep: true });
  for (const [loc, m] of want) {
    const re = new RegExp(`(<url><loc>${loc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</loc><lastmod>)([^<]+)(</lastmod>)`);
    if (re.test(xml)) { if (!m.keep) xml = xml.replace(re, `$1${m.lastmod}$3`); }
    else xml = xml.replace("</urlset>", `  <url><loc>${loc}</loc><lastmod>${m.lastmod}</lastmod><changefreq>${m.freq}</changefreq><priority>${m.prio}</priority></url>\n</urlset>`);
  }
  await writeFile(file, xml);
}

async function put(rel, content) {
  const file = path.join(ROOT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}

/* ── build: alles opnieuw opbouwen ───────────────────────────────────── */
export async function build({ log = console.log } = {}) {
  const arts = await readArticles();
  if (!arts.length) throw new Error("emtimes-articles.js is leeg.");
  const prose = new Map();

  for (const a of arts) {
    if (!CAT[a.topicKey]) throw new Error(`Onbekende topicKey "${a.topicKey}" bij ${a.path}`);
    const file = path.join(ROOT, a.path, "index.html");
    if (!existsSync(file)) throw new Error(`Artikelpagina ontbreekt: ${a.path}index.html`);
    const html = await readFile(file, "utf8");
    const p = extractProse(html);
    if (!p) throw new Error(`Geen artikeltekst gevonden in ${a.path}`);
    prose.set(a.path, p);
    // metadata aanvullen vanuit de pagina (eenmalige migratie van oude artikels)
    a.iso ||= (html.match(/content="(\d{4}-\d{2}-\d{2})T[^"]*" property="article:published_time"/) || [])[1] || isoFromShort(a.date);
    if (!a.iso) throw new Error(`Geen datum voor ${a.path}`);
    a.date = shortDate(a.iso);
    if (!a.img) {
      const m = html.match(/class="et-cover"><img src="([^"]+)" alt="([^"]*)"/);
      if (m) { a.img = m[1].replace(/^(\.\.\/)+/, ""); a.alt ||= unesc(m[2]); }
    }
    a.img ||= "assets/og-image.png";
    a.alt ||= a.title;
    a.desc ||= unesc((html.match(/<meta content="([^"]*)" name="description"/) || [])[1] || "") || a.excerpt;
  }
  arts.sort((x, y) => y.iso.localeCompare(x.iso)); // stabiel: zelfde dag = volgorde uit de index
  await writeArticles(arts);
  const V = await versions(); // ná writeArticles, zodat de index-hash klopt

  for (const a of arts) await put(`${a.path}index.html`, articlePage(a, prose.get(a.path), relatedOf(a, arts), V));
  for (const c of CATEGORIES) {
    const list = arts.filter((a) => a.topicKey === c.key);
    if (list.length) await put(`emtimes/${c.dir}/index.html`, categoryPage(c, list, arts, V));
  }
  await put("emtimes/index.html", hubPage(arts, V));
  await put("emtimes/feed.xml", feedXml(arts));
  await syncSitemap(arts);
  log(`EM Times opgebouwd: ${arts.length} artikels, ${CATEGORIES.filter((c) => arts.some((a) => a.topicKey === c.key)).length} categorieën.`);
  return arts;
}
