#!/usr/bin/env node
/**
 * Maakt elke pagina leesbaar voor zoekmachines die geen (of weinig) JavaScript uitvoeren.
 *
 *   node scripts/crawl-fallback.mjs
 *
 * 1. Menu en footer worden door site.js ingevoegd. Zonder JavaScript staan er dus
 *    bijna geen interne links in de HTML, en dan ziet Bing veel pagina's als "wees".
 *    Daarom zetten we in <div id="footer-mount"> een gewone lijst met links (zelfde
 *    pagina's als menu/footer + de andere taalversies). site.js vervangt die div bij het
 *    laden, bezoekers zien er dus niets van.
 * 2. Het laadscherm (#loader) bedekt de hele pagina tot site.js het weghaalt. Een
 *    <noscript>-regel verbergt het als er geen JavaScript draait.
 *
 * 3. "Voor wie" (fase 2): de drie branchepagina's en de regiopagina Limburg. Ze bestaan alleen
 *    in het Nederlands; op de EN- en FR-pagina's staat de link er ook, met hreflang="nl".
 *    Een link komt er pas bij als het bestand bestaat, dus het script maakt nooit een dode link.
 *    De stadspagina's (/website-laten-maken-<stad>) staan hier niet: die hangen aan de regiopagina.
 *
 * Veilig om vaker te draaien. Draai het opnieuw na het toevoegen of herbouwen van pagina's;
 * de EM Times-build doet het zelf.
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set([".git", ".github", ".claude", "node_modules", "scripts", "assets", "demo"]);

const LABELS = {
  nl: { nav: "Sitemap", home: "Home", services: "Diensten", pk: "Pakketkiezer", eml: "EML AI Team", s1: "AI Chatbots", s2: "AI Voice Agents", s3: "Websites", s4: "AI-automatisering", s5: "Online afsprakensysteem", portfolio: "Portfolio", case: "Case: Clinic3D", about: "Over ons", contact: "Contact", demo: "Gratis demo", privacy: "Privacy", emtimes: "EM Times (blog)" },
  en: { nav: "Sitemap", home: "Home", services: "Services", pk: "Package finder", eml: "EML AI Team", s1: "AI Chatbots", s2: "AI Voice Agents", s3: "Websites", s4: "AI automation", s5: "Online booking system", portfolio: "Portfolio", case: "Case: Clinic3D", about: "About us", contact: "Contact", demo: "Free demo", privacy: "Privacy" },
  fr: { nav: "Plan du site", home: "Accueil", services: "Services", pk: "Choix du pack", eml: "EML AI Team", s1: "Chatbots IA", s2: "Agents vocaux IA", s3: "Sites web", s4: "Automatisation IA", s5: "Prise de rendez-vous en ligne", portfolio: "Portfolio", case: "Étude de cas : Clinic3D", about: "À propos", contact: "Contact", demo: "Démo gratuite", privacy: "Confidentialité" },
};
/** Voor wie: [bestand in de hoofdmap zonder .html, label]. Labels blijven Nederlands, want de pagina's zijn Nederlands. */
const VOOR_WIE = [
  ["website-voor-schoonheidssalons", "Website voor schoonheidssalons en wellness"],
  ["website-voor-kappers", "Website voor kappers"],
  ["website-voor-praktijken", "Website voor praktijken"],
  ["website-laten-maken-limburg", "Website laten maken in Limburg"],
];
const voorWie = () => VOOR_WIE.filter(([slug]) => existsSync(path.join(ROOT, `${slug}.html`)));
const LANG_NAMES = { nl: "Nederlands", en: "English", fr: "Français" };
/** NAP (naam, adres, telefoon) zoals in de footer van site.js; zo staat het ook zonder JavaScript op elke pagina. */
const NAP = { name: "EM Launchpad", street: "Brugstraat 2A", postal: "3870", city: "Vechmaal", tel: "+32 476 01 54 51", telHref: "+32476015451", email: "ebert@emlaunchpad.com" };

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** De vaste linklijst voor in #footer-mount. `alternates` = { nl: url, en: url, fr: url } uit de hreflang-tags. */
export function staticFooter(lang = "nl", alternates = {}) {
  const T = LABELS[lang] || LABELS.nl;
  const pre = lang === "nl" ? "/" : `/${lang}/`;
  const links = [
    [pre, T.home], [`${pre}Diensten`, T.services], [`${pre}Pakketkiezer`, T.pk], [`${pre}eml-ai-team`, T.eml], [`${pre}AI%20Chatbots`, T.s1], [`${pre}AI%20Voice%20Agents`, T.s2],
    [`${pre}Websites`, T.s3], [`${pre}AI-Automatisering`, T.s4], [`${pre}Afsprakensysteem`, T.s5], [`${pre}Portfolio`, T.portfolio],
    [`${pre}Clinic3D`, T.case], [`${pre}Over%20ons`, T.about], [`${pre}Contact`, T.contact], [`${pre}Gratis%20Demo`, T.demo],
  ];
  if (lang === "nl") links.push(["/emtimes/", T.emtimes]);
  links.push([`${pre}privacy`, T.privacy]);
  const li = (href, label, attrs = "") => `<li><a href="${esc(href)}"${attrs}>${esc(label)}</a></li>`;
  const nlAttr = lang === "nl" ? "" : ` hreflang="nl" lang="nl"`;
  const forLinks = voorWie().map(([slug, label]) => li(`/${slug}`, label, nlAttr)).join("");
  const langs = Object.keys(LANG_NAMES).filter((l) => alternates[l])
    .map((l) => li(alternates[l], LANG_NAMES[l], ` hreflang="${l}" lang="${l}"`)).join("");
  return `<!-- crawl-fallback: wordt door site.js vervangen --><nav class="crawl-fallback" aria-label="${esc(T.nav)}" style="padding:48px 24px">`
    + `<ul style="list-style:none;display:flex;flex-wrap:wrap;gap:8px 24px;margin:0;padding:0">${links.map(([h, l]) => li(h, l)).join("")}</ul>`
    + (forLinks ? `<ul style="list-style:none;display:flex;flex-wrap:wrap;gap:8px 24px;margin:16px 0 0;padding:0">${forLinks}</ul>` : "")
    + (langs ? `<ul style="list-style:none;display:flex;gap:8px 24px;margin:16px 0 0;padding:0">${langs}</ul>` : "")
    + `<p style="margin:16px 0 0">${NAP.name} · ${NAP.street}, ${NAP.postal} ${NAP.city} · <a href="tel:${NAP.telHref}">${NAP.tel}</a> · <a href="mailto:${NAP.email}">${NAP.email}</a></p>`
    + `</nav>`;
}

export const LOADER_NOSCRIPT = `<noscript><style>#loader{display:none!important}</style></noscript>`;

const langOf = (rel) => (/^(en|fr)\//.exec(rel.replace(/\\/g, "/")) || [, "nl"])[1];

function alternatesOf(html) {
  const out = {};
  for (const m of html.matchAll(/<link\b[^>]*>/g)) {
    const tag = m[0];
    if (!/rel="alternate"/.test(tag)) continue;
    const hl = (tag.match(/hreflang="([^"]+)"/) || [])[1];
    const href = (tag.match(/href="([^"]+)"/) || [])[1];
    if (hl && href && LANG_NAMES[hl]) out[hl] = href;
  }
  return out;
}

/** Past één HTML-string aan; geeft de nieuwe string terug (ongewijzigd als er niets te doen is). */
export function applyFallback(html, rel) {
  let out = html.replace(/<div id="footer-mount">[\s\S]*?<\/div>/,
    `<div id="footer-mount">${staticFooter(langOf(rel), alternatesOf(html))}</div>`);
  if (/id="loader"/.test(out) && !out.includes(LOADER_NOSCRIPT)) out = out.replace("</head>", `${LOADER_NOSCRIPT}\n</head>`);
  return out;
}

async function* htmlFiles(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) yield* htmlFiles(path.join(dir, e.name)); }
    else if (e.name.endsWith(".html")) yield path.join(dir, e.name);
  }
}

export async function run({ log = console.log } = {}) {
  let changed = 0, total = 0;
  for await (const file of htmlFiles(ROOT)) {
    const rel = path.relative(ROOT, file);
    const html = await readFile(file, "utf8");
    if (!html.includes('id="footer-mount"')) continue;
    total++;
    const next = applyFallback(html, rel);
    if (next !== html) { await writeFile(file, next); changed++; }
  }
  log(`crawl-fallback: ${changed} van ${total} pagina's bijgewerkt.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
}
