#!/usr/bin/env node
/**
 * EM Times — dagelijkse blogpost-generator.
 *
 * Draait binnen GitHub Actions. Genereert één nieuw NL-artikel via de Claude API,
 * assembleert de HTML deterministisch uit de bestaande template (correcte paden,
 * meta, JSON-LD, breadcrumb), haalt een CC0-cover op via Openverse, en werkt de
 * zoek-index (emtimes-articles.js), de sitemap en de hub-kaarten bij.
 *
 * v1: publiceert in de categorie "ai" (de enige met een bestaande hub).
 * Categorie-rotatie kan later worden toegevoegd.
 *
 * Vereist env: ANTHROPIC_API_KEY
 * Commit + push gebeurt in de workflow (met de ingebouwde GITHUB_TOKEN).
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MODEL = "claude-sonnet-5";
const CATEGORY = "ai";           // v1: vaste categorie
const SECTION = "AI";            // JSON-LD articleSection / breadcrumb
const TOPIC_KEY = "ai";          // ET_ARTICLES topicKey + data-topic

const ARTICLE_TEMPLATE_PATH = "emtimes/ai/waarom-ai-chatbots-werken-voor-lokale-bedrijven/index.html";
const ARTICLES_JS = "emtimes-articles.js";
const SITEMAP = "sitemap.xml";
const MAIN_HUB = "emtimes/index.html";
const CAT_HUB = `emtimes/${CATEGORY}/index.html`;

const MONTHS_FULL = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
const MONTHS_ABBR = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];

// ── datum (Europe/Brussels) ────────────────────────────────────────────────
function brusselsToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  const y = +get("year"), m = +get("month"), d = +get("day");
  // ruwe CEST/CET-inschatting (apr–okt = zomertijd)
  const offset = m >= 4 && m <= 10 ? "+02:00" : "+01:00";
  return {
    iso: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    published: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T09:00:00${offset}`,
    human: `${d} ${MONTHS_FULL[m - 1]} ${y}`,
    short: `${d} ${MONTHS_ABBR[m - 1]} ${y}`,
  };
}

// ── Claude API ─────────────────────────────────────────────────────────────
async function generateContent({ existingTitles, templateHtml }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY ontbreekt.");

  const system =
    "Je bent de vaste redacteur van 'EM Times', de blog van EM Launchpad, een Belgisch " +
    "AI-bureau uit Limburg. Je schrijft praktische, feitelijke NL-artikels voor lokale " +
    "Belgische KMO's over AI, chatbots, voice agents en automatisatie. Stem: toegankelijk, " +
    "'je'-vorm, geen jargon, concrete voorbeelden. Verzin NOOIT valse cijfers, percentages " +
    "of claims. Antwoord UITSLUITEND met geldige JSON, zonder codeblok of extra tekst.";

  const prompt = `Schrijf één nieuw, uniek blogartikel in de categorie "AI" voor lokale Belgische bedrijven.

BESTAANDE TITELS (kies een DUIDELIJK ANDER onderwerp, geen overlap):
${existingTitles.map((t) => `- ${t}`).join("\n") || "(nog geen)"}

STRUCTUUR VAN DE PROSE (verplicht, exact deze HTML-elementen en classes):
- begin met: <p class="et-lead">…intro van 2-4 zinnen…</p>
- daarna 4 tot 6 secties, elk: <h2>…</h2> gevolgd door een of meer <p>…</p>
- ergens minstens één lijst: <ul><li>…</li></ul> of <ol><li>…</li></ol>
- precies één callout: <div class="et-note"><p class="lbl">▲ goed om te weten</p><p>…</p></div>
- precies één citaat: <blockquote>…</blockquote>
Gebruik <strong> voor nadruk. Geen andere classes, geen <h1>, geen afbeeldingen in de prose.

Lengte: 700–1100 woorden. Belgisch Nederlands.

Antwoord met JSON met exact deze velden:
{
  "slug": "kebab-case-van-de-titel (alleen a-z, 0-9 en koppelstreepjes)",
  "title": "pakkende, SEO-relevante titel (max ~70 tekens)",
  "metaDescription": "meta description, 140–160 tekens",
  "ogDescription": "korte social-omschrijving, ~110 tekens",
  "excerpt": "1 zin voor de kaart/zoekindex, ~160 tekens",
  "kicker": "korte kicker in de vorm 'ai · <subthema>' (kleine letters)",
  "crumbLast": "één woord voor het kruimelpad, bv. 'chatbots'",
  "readMin": 6,
  "wordCount": 950,
  "imageQuery": "2-4 ENGELSE trefwoorden voor een passende sfeerfoto",
  "imageAlt": "korte NL alt-tekst voor de coverfoto",
  "tags": ["8","tot","12","relevante","nl","trefwoorden","lowercase"],
  "proseHtml": "de volledige binnen-HTML van .et-prose volgens bovenstaande structuur"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.content || []).map((b) => b.text || "").join("").trim();
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const out = JSON.parse(json);

  // sanity + normalisatie
  out.slug = String(out.slug || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!out.slug || !out.title || !out.proseHtml) throw new Error("Onvolledige JSON van model: " + json.slice(0, 300));
  out.readMin = Number(out.readMin) || 6;
  out.wordCount = Number(out.wordCount) || 900;
  if (!Array.isArray(out.tags)) out.tags = [];
  return out;
}

// ── Openverse cover (CC0) ──────────────────────────────────────────────────
async function fetchCover(query, slug) {
  try {
    const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license=cc0&per_page=5&mature=false`;
    const r = await fetch(u, { headers: { "User-Agent": "EMTimes-bot/1.0" } });
    if (!r.ok) throw new Error(`Openverse ${r.status}`);
    const j = await r.json();
    const hit = (j.results || []).find((x) => x.url);
    if (!hit) throw new Error("geen resultaat");
    const img = await fetch(hit.url, { headers: { "User-Agent": "EMTimes-bot/1.0" } });
    if (!img.ok) throw new Error(`download ${img.status}`);
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf.length < 3000) throw new Error("bestand te klein");
    await mkdir(path.join(ROOT, "assets/emtimes"), { recursive: true });
    await writeFile(path.join(ROOT, `assets/emtimes/${slug}.jpg`), buf);
    console.log(`Cover opgeslagen: assets/emtimes/${slug}.jpg (${(buf.length / 1024) | 0} KB)`);
    return true;
  } catch (e) {
    console.warn(`Cover ophalen mislukt (${e.message}) — val terug op og-image.png`);
    return false;
  }
}

// ── artikelpagina assembleren ──────────────────────────────────────────────
function buildArticle(c, date, hasCover) {
  const base = `https://emlaunchpad.com/emtimes/${CATEGORY}/${c.slug}/`;
  const cover = hasCover ? `../../../assets/emtimes/${c.slug}.jpg` : `../../../assets/og-image.png`;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const jld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": base + "#article",
        headline: c.title,
        description: c.metaDescription,
        image: "https://emlaunchpad.com/assets/og-image.png",
        datePublished: date.published,
        dateModified: date.published,
        inLanguage: "nl-BE",
        author: { "@id": "https://emlaunchpad.com/#organization" },
        publisher: { "@id": "https://emlaunchpad.com/#organization" },
        mainEntityOfPage: { "@type": "WebPage", "@id": base },
        articleSection: SECTION,
        wordCount: c.wordCount,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://emlaunchpad.com/" },
          { "@type": "ListItem", position: 2, name: "EM Times", item: "https://emlaunchpad.com/emtimes/" },
          { "@type": "ListItem", position: 3, name: SECTION, item: `https://emlaunchpad.com/emtimes/${CATEGORY}/` },
          { "@type": "ListItem", position: 4, name: c.title, item: base },
        ],
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${esc(c.title)} | EM Times</title>
<meta content="${esc(c.metaDescription)}" name="description"/>
<meta content="EM Launchpad" name="author"/>
<meta content="index, follow" name="robots"/>
<meta content="#0a0d14" name="theme-color"/>
<link href="../../../site.webmanifest" rel="manifest"/>
<link href="${base}" rel="canonical"/>
<link href="../../../assets/favicon.ico" rel="icon" sizes="any"/>
<link href="../../../assets/favicon-32.png" rel="icon" sizes="32x32" type="image/png"/>
<link href="../../../assets/favicon-16.png" rel="icon" sizes="16x16" type="image/png"/>
<link href="../../../assets/apple-touch-icon.png" rel="apple-touch-icon"/>
<!-- Open Graph / social -->
<meta content="article" property="og:type"/>
<meta content="EM Launchpad" property="og:site_name"/>
<meta content="nl_BE" property="og:locale"/>
<meta content="${esc(c.title)}" property="og:title"/>
<meta content="${esc(c.ogDescription || c.metaDescription)}" property="og:description"/>
<meta content="${base}" property="og:url"/>
<meta content="https://emlaunchpad.com/assets/og-image.png" property="og:image"/>
<meta content="${date.published}" property="article:published_time"/>
<meta content="EM Launchpad" property="article:author"/>
<meta content="${SECTION}" property="article:section"/>
<meta content="summary_large_image" name="twitter:card"/>
<meta content="${esc(c.title)}" name="twitter:title"/>
<meta content="${esc(c.ogDescription || c.metaDescription)}" name="twitter:description"/>
<meta content="https://emlaunchpad.com/assets/og-image.png" name="twitter:image"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&amp;family=JetBrains+Mono:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..600&amp;display=swap" rel="stylesheet"/>
<link href="../../../home.css?v=20260704b" rel="stylesheet"/>
<link href="../../../emtimes.css?v=3" rel="stylesheet"/>
<script type="application/ld+json">${JSON.stringify(jld)}</script>
</head>
<body data-page="emtimes" data-root="../../../" data-topic="${TOPIC_KEY}">
<a class="skip-link" href="#main">Naar inhoud</a>
<header id="et-nav"></header>

<main class="et-main" id="main" tabindex="-1">
<div class="et-dot"></div>

<article class="et-article">
<div class="et-wrap">

<header class="et-ahead">
<nav class="et-crumb" aria-label="Kruimelpad">
<a href="../../../index.html">home</a><span class="sep">/</span>
<a href="../../index.html">em_times</a><span class="sep">/</span>
<a href="../index.html">${CATEGORY}</a><span class="sep">/</span><b>${esc(c.crumbLast || CATEGORY)}</b>
</nav>
<span class="et-kick"><span class="dot"></span>// ${esc(c.kicker || CATEGORY)}</span>
<h1>${esc(c.title)}</h1>
<div class="et-ainfo">
<span class="who">EM Launchpad</span>
<span class="d"></span>
<time datetime="${date.iso}">${date.human}</time>
<span class="d"></span>
<span>${c.readMin} min lezen</span>
</div>
</header>

<div class="et-cover"><img src="${cover}" alt="${esc(c.imageAlt || c.title)}"/></div>

<div class="et-prose">

${c.proseHtml}

</div>

<!-- auteur + einde -->
<div class="et-abot">
<div class="et-author">
<span class="logo"><img src="../../../assets/logo-em.png" alt="EM Launchpad"/></span>
<div>
<div class="nm">EM Launchpad</div>
<div class="ro">// belgisch ai-bureau uit limburg</div>
</div>
</div>
</div>

</div>
</article>

<!-- CTA -->
<section class="et-wrap">
<div class="et-cta" data-reveal="">
<h2>Wil je zien hoe dit er voor jóuw bedrijf uitziet?</h2>
<p>We bouwen een gratis AI-demo op maat van jouw aanbod. In een gesprek van 30 minuten laten we zien wat het concreet oplevert.</p>
<div class="row">
<a class="btn" data-book="" href="../../../Contact.html">Plan een gratis gesprek <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"></path></svg></a>
<a class="btn-ghost" href="../index.html">Meer uit ${SECTION}</a>
</div>
</div>
</section>

</main>

<footer id="et-foot"></footer>
<script src="../../../site.js?v=20260704b"></script>
<script src="../../../emtimes-articles.js?v=1"></script>
<script src="../../../emtimes.js?v=2"></script>
</body>
</html>
`;
}

// ── kaart-HTML voor de hubs ────────────────────────────────────────────────
function cardHtml(c, date, hasCover, { assetPrefix, href, topic }) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const img = hasCover ? `${assetPrefix}assets/emtimes/${c.slug}.jpg` : `${assetPrefix}assets/og-image.png`;
  return `
<a class="et-card" href="${href}" data-reveal="">
<div class="et-thumb"><img src="${img}" alt="${esc(c.imageAlt || c.title)}" loading="lazy"/></div>
<div class="et-cbody">
<span class="et-tag">${esc(topic)}</span>
<h3>${esc(c.title)}</h3>
<p>${esc(c.excerpt)}</p>
<div class="et-meta"><span>EM Launchpad</span><span class="d"></span><span>${date.short}</span><span class="d"></span><span>${c.readMin} min lezen</span></div>
</div>
</a>
`;
}

// insert direct na de eerste grid-opening
function insertCard(html, card) {
  const anchor = '<div class="et-grid" data-reveal-group="">';
  const i = html.indexOf(anchor);
  if (i === -1) { console.warn("Grid-anchor niet gevonden — kaart overgeslagen."); return html; }
  const at = i + anchor.length;
  return html.slice(0, at) + "\n" + card + html.slice(at);
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  const date = brusselsToday();

  const templateHtml = await readFile(path.join(ROOT, ARTICLE_TEMPLATE_PATH), "utf8");
  const articlesJsRaw = await readFile(path.join(ROOT, ARTICLES_JS), "utf8");

  // bestaande titels + slugs uit ET_ARTICLES halen
  const existingTitles = [...articlesJsRaw.matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]);
  const existingSlugs = [...articlesJsRaw.matchAll(/path:\s*"emtimes\/[^/]+\/([^/"]+)\//g)].map((m) => m[1]);

  console.log(`Genereren… (${existingTitles.length} bestaande artikels)`);
  const c = await generateContent({ existingTitles, templateHtml });
  if (existingSlugs.includes(c.slug)) c.slug = `${c.slug}-${date.iso}`;
  const topicLabel = `${SECTION} · ${(c.kicker || "").split("·").pop().trim() || "praktijk"}`;
  console.log(`Titel: ${c.title}\nSlug:  ${c.slug}`);

  const hasCover = await fetchCover(c.imageQuery || c.title, c.slug);

  // 1) artikelpagina
  const dir = path.join(ROOT, "emtimes", CATEGORY, c.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), buildArticle(c, date, hasCover));

  // 2) zoek-index (emtimes-articles.js) — nieuwste bovenaan
  const obj = `  {
    title: ${JSON.stringify(c.title)},
    excerpt: ${JSON.stringify(c.excerpt)},
    topic: ${JSON.stringify(topicLabel)},
    topicKey: ${JSON.stringify(TOPIC_KEY)},
    path: ${JSON.stringify(`emtimes/${CATEGORY}/${c.slug}/`)},
    date: ${JSON.stringify(date.short)},
    read: ${JSON.stringify(`${c.readMin} min`)},
    tags: ${JSON.stringify(c.tags)}
  },`;
  const articlesJs = articlesJsRaw.replace(/(window\.ET_ARTICLES\s*=\s*\[)/, `$1\n${obj}`);
  await writeFile(path.join(ROOT, ARTICLES_JS), articlesJs);

  // 3) sitemap
  const sitemap = await readFile(path.join(ROOT, SITEMAP), "utf8");
  const urlLine = `  <url><loc>https://emlaunchpad.com/emtimes/${CATEGORY}/${c.slug}/</loc><lastmod>${date.iso}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
  await writeFile(path.join(ROOT, SITEMAP), sitemap.replace("</urlset>", urlLine + "</urlset>"));

  // 4) hub-kaarten (hoofd-hub + categorie-hub)
  const mainHub = await readFile(path.join(ROOT, MAIN_HUB), "utf8");
  await writeFile(
    path.join(ROOT, MAIN_HUB),
    insertCard(mainHub, cardHtml(c, date, hasCover, {
      assetPrefix: "../", href: `${CATEGORY}/${c.slug}/index.html`, topic: topicLabel,
    }))
  );
  if (existsSync(path.join(ROOT, CAT_HUB))) {
    const catHub = await readFile(path.join(ROOT, CAT_HUB), "utf8");
    await writeFile(
      path.join(ROOT, CAT_HUB),
      insertCard(catHub, cardHtml(c, date, hasCover, {
        assetPrefix: "../../", href: `${c.slug}/index.html`, topic: topicLabel,
      }))
    );
  }

  // samenvatting naar Actions-log
  const url = `https://emlaunchpad.com/emtimes/${CATEGORY}/${c.slug}/`;
  const summary = `### EM Times gepubliceerd ✅\n\n- **Titel:** ${c.title}\n- **Categorie:** ${SECTION}\n- **URL:** ${url}\n- **Cover:** ${hasCover ? "Openverse CC0" : "fallback (og-image)"}\n`;
  console.log("\n" + summary);
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, summary, { flag: "a" });
}

main().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
