#!/usr/bin/env node
/**
 * EM Times — dagelijkse blogpost-generator (draait in GitHub Actions).
 *
 * 1. kiest de categorie die het langst geen artikel kreeg (ai → automatisering → websites → groei),
 * 2. laat Claude één nieuw NL-artikel schrijven (structured output → gegarandeerd geldige JSON),
 * 3. haalt een CC0-coverfoto via Openverse (valt terug op og-image.png),
 * 4. voegt het toe aan emtimes-articles.js en bouwt alle EM Times-pagina's, de feed
 *    en de sitemap opnieuw op via scripts/emtimes/lib.mjs.
 *
 * Commit + push gebeurt in de workflow (ingebouwde GITHUB_TOKEN).
 * Vereist: ANTHROPIC_API_KEY  (repo-secret)
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFile, mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { ROOT, CATEGORIES, readArticles, writeArticles, build, shortDate, slugify } from "./emtimes/lib.mjs";

const MODEL = "claude-opus-5";

/* ── datum in Brussel ─────────────────────────────────────────────────── */
function todayIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/* ── categorie: de langst "stille" eerst, bij gelijkstand de vaste volgorde ── */
function pickCategory(arts) {
  const last = (c) => arts.filter((a) => a.topicKey === c.key).map((a) => a.iso).sort().pop() || "";
  return [...CATEGORIES].sort((x, y) => last(x).localeCompare(last(y)) || CATEGORIES.indexOf(x) - CATEGORIES.indexOf(y))[0];
}

/* ── Claude ───────────────────────────────────────────────────────────── */
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["slug", "title", "metaDescription", "excerpt", "subtopic", "imageQuery", "imageAlt", "tags", "proseHtml"],
  properties: {
    slug: { type: "string" },
    title: { type: "string" },
    metaDescription: { type: "string" },
    excerpt: { type: "string" },
    subtopic: { type: "string" },
    imageQuery: { type: "string" },
    imageAlt: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    proseHtml: { type: "string" },
  },
};

const SYSTEM = `Je bent de vaste redacteur van EM Times, de kennishub van EM Launchpad — een Belgisch AI-bureau uit Limburg dat websites, AI-chatbots, voice agents en automatisaties bouwt voor lokale KMO's.

Je schrijft praktische, eerlijke artikels in Belgisch Nederlands voor zaakvoerders zonder technische achtergrond: kappers, tandartsen, garages, aannemers, kinesisten, restaurants. Spreek de lezer aan met "je". Leg uit in gewone taal, met herkenbare voorbeelden uit het dagelijkse werk van een lokaal bedrijf.

Verzin nooit cijfers, percentages, studies, klantnamen of citaten. Heb je geen harde bron, formuleer dan kwalitatief ("vaak", "de meeste zaken die we spreken"). Geen hype, geen beloftes die je niet kunt waarmaken.`;

function prompt(cat, existing) {
  return `Schrijf één nieuw artikel voor de categorie "${cat.name}" (${cat.desc}).

Kies een concreet, nuttig onderwerp dat duidelijk verschilt van deze bestaande artikels:
${existing.map((t) => `- ${t}`).join("\n") || "- (nog geen)"}

Vereisten voor proseHtml (alleen deze elementen, geen andere classes, geen <h1>, geen afbeeldingen of links):
- begin met precies één <p class="et-lead">…</p> van 2 à 4 zinnen
- daarna 4 tot 6 secties: elk een <h2> gevolgd door een of meer <p>
- minstens één <ul> of <ol> met <li>-items
- precies één callout: <div class="et-note"><p class="lbl">▲ goed om te weten</p><p>…</p></div>
- precies één <blockquote>…</blockquote> met een krachtige kernzin (geen verzonnen citaat van een persoon)
- <strong> voor nadruk waar het helpt
- sluit af met een blok veelgestelde vragen: <div class="et-faq"><h2>Veelgestelde vragen</h2> en daarin 3 vragen als <h3> met elk een kort antwoord in <p></div>. Kies vragen die mensen echt in Google typen.
- 750 tot 1100 woorden in totaal

Velden:
- slug: kebab-case van de titel, alleen a-z, 0-9 en koppeltekens
- title: pakkend en zoekvriendelijk, maximaal ~70 tekens
- metaDescription: 140 à 160 tekens, voor Google
- excerpt: één zin van ~150 tekens voor de artikelkaart
- subtopic: 1 à 2 woorden, met hoofdletter (bv. "Reviews", "Opvolging")
- imageQuery: 2 à 4 Engelse zoekwoorden voor een sfeervolle stockfoto (geen tekst of logo's op de foto)
- imageAlt: korte Nederlandse alt-tekst die de foto beschrijft
- tags: 8 à 12 Nederlandse zoektermen in kleine letters`;
}

async function writeArticle(cat, existingTitles) {
  const client = new Anthropic(); // leest ANTHROPIC_API_KEY
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default", // weigert Opus 5, dan neemt Anthropic's aanbevolen fallback-model over
    system: SYSTEM,
    messages: [{ role: "user", content: prompt(cat, existingTitles) }],
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
  });
  if (res.stop_reason === "refusal") throw new Error(`Claude weigerde (${res.stop_details?.category ?? "onbekend"}).`);
  if (res.stop_reason === "max_tokens") throw new Error("Antwoord afgekapt (max_tokens).");
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  console.log(`Model: ${res.model} · ${res.usage.input_tokens} in / ${res.usage.output_tokens} uit`);
  return JSON.parse(text);
}

/* Alleen de toegestane artikel-HTML doorlaten (modeluitvoer = onbetrouwbare invoer). */
function sanitize(html) {
  const OK = new Set(["p", "h2", "h3", "ul", "ol", "li", "strong", "em", "blockquote", "div", "br"]);
  return String(html)
    .replace(/<(script|style|iframe|object|embed|svg)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (tag, raw) => {
      let name = raw.toLowerCase();
      if (name === "h1") name = "h2";
      if (!OK.has(name)) return "";
      if (tag.startsWith("</")) return `</${name}>`;
      const cls = (tag.match(/\sclass="([^"]*)"/) || [])[1];
      const keep = (name === "p" || name === "div") && /^(et-lead|et-note|et-faq|lbl)$/.test(cls || "") ? ` class="${cls}"` : "";
      return `<${name}${keep}>`;
    })
    .trim();
}

/* ── Openverse-cover (CC0) ────────────────────────────────────────────── */
async function fetchCover(query, slug) {
  const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  for (const source of ["&source=stocksnap", ""]) {
    try {
      const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license=cc0&mature=false&page_size=8${source}`;
      const r = await fetch(u, { headers: { "User-Agent": "EMTimes-bot/1.0 (+https://emlaunchpad.com/emtimes/)" } });
      if (!r.ok) throw new Error(`Openverse ${r.status}`);
      for (const hit of (await r.json()).results || []) {
        if (!hit.url) continue;
        const img = await fetch(hit.url, { headers: { "User-Agent": "EMTimes-bot/1.0" } }).catch(() => null);
        const type = (img?.headers.get("content-type") || "").split(";")[0];
        if (!img?.ok || !EXT[type]) continue;
        const buf = Buffer.from(await img.arrayBuffer());
        if (buf.length < 20_000 || buf.length > 2_500_000) continue; // te klein = icoon, te groot = traag
        const rel = `assets/emtimes/${slug}.${EXT[type]}`;
        await mkdir(path.join(ROOT, "assets/emtimes"), { recursive: true });
        await writeFile(path.join(ROOT, rel), buf);
        console.log(`Cover: ${rel} (${(buf.length / 1024) | 0} KB, ${hit.source || "openverse"})`);
        return rel;
      }
    } catch (e) {
      console.warn(`Cover zoeken mislukt (${e.message})`);
    }
  }
  console.warn("Geen bruikbare cover gevonden — val terug op og-image.png");
  return "assets/og-image.png";
}

/* ── main ─────────────────────────────────────────────────────────────── */
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY ontbreekt (zet 'm als repo-secret).");
  const iso = todayIso();
  const arts = await readArticles();
  const cat = pickCategory(arts);
  console.log(`Categorie: ${cat.name} · ${arts.length} bestaande artikels`);

  const c = await writeArticle(cat, arts.map((a) => a.title));
  const prose = sanitize(c.proseHtml);
  if (!/class="et-lead"/.test(prose) || (prose.match(/<h2>/g) || []).length < 3) throw new Error("Artikel voldoet niet aan de structuur.");

  let slug = slugify(c.slug || c.title) || `artikel-${iso}`;
  if (arts.some((a) => a.path === `emtimes/${cat.dir}/${slug}/`)) slug = `${slug}-${iso}`;
  const articlePath = `emtimes/${cat.dir}/${slug}/`;
  const words = prose.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

  const img = await fetchCover(c.imageQuery || c.title, slug);

  // Minimale pagina met enkel de tekst; build() maakt er de volledige pagina van.
  await mkdir(path.join(ROOT, articlePath), { recursive: true });
  await writeFile(path.join(ROOT, articlePath, "index.html"), `<!-- ET:PROSE:START -->\n${prose}\n<!-- ET:PROSE:END -->\n`);

  arts.unshift({
    title: c.title.trim(),
    excerpt: c.excerpt.trim(),
    desc: c.metaDescription.trim(),
    topic: `${cat.label} · ${c.subtopic.trim()}`,
    topicKey: cat.key,
    path: articlePath,
    date: shortDate(iso),
    iso,
    read: `${Math.max(3, Math.round(words / 220))} min`,
    img,
    alt: (c.imageAlt || c.title).trim(),
    tags: [...new Set((c.tags || []).map((t) => String(t).toLowerCase().trim()).filter(Boolean))].slice(0, 12),
  });
  await writeArticles(arts);
  await build();

  const url = `https://emlaunchpad.com/${articlePath}`;
  const summary = `### EM Times: nieuw artikel ✅\n\n- **Titel:** ${c.title}\n- **Categorie:** ${cat.name}\n- **URL:** ${url}\n- **Woorden:** ${words}\n- **Cover:** ${img}\n`;
  console.log("\n" + summary);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `path=/${articlePath}\ntitle=${c.title.replace(/\n/g, " ")}\n`);
}

main().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
