// Meldt pagina's aan bij IndexNow (Bing, Yandex, Seznam, Naver… delen de meldingen onderling).
//
// Gebruik (vanuit de projectmap):
//   node scripts/indexnow.mjs                  → alle URL's uit sitemap.xml
//   node scripts/indexnow.mjs /Diensten /Afsprakensysteem   → alleen deze pagina's
//   node scripts/indexnow.mjs --algemeen       → via api.indexnow.org i.p.v. rechtstreeks naar Bing
//
// Voorwaarde: het sleutelbestand https://emlaunchpad.com/<KEY>.txt staat online
// (het zit in de hoofdmap van deze repo en gaat dus mee met elke deploy).

import { readFileSync } from 'node:fs';

const HOST = 'emlaunchpad.com';
const KEY = '21ba755575c4cb042df70ccb5f4f73be';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
// Rechtstreeks naar Bing: dan verschijnen de meldingen in Bing Webmaster Tools (IndexNow)
// en geeft Bing zelf een duidelijk antwoord. Bing deelt ze door met de andere zoekmachines.
// Met --algemeen gaat het via het gedeelde adres api.indexnow.org.
const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
const ENDPOINT = flags.includes('--algemeen') ? 'https://api.indexnow.org/indexnow' : 'https://www.bing.com/indexnow';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
let urls;
if (args.length) {
  urls = args.map((a) => (a.startsWith('http') ? a : `https://${HOST}${a.startsWith('/') ? '' : '/'}${a}`));
} else {
  const xml = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}
urls = [...new Set(urls)].filter((u) => new URL(u).hostname === HOST);
if (!urls.length) {
  console.error('Geen URL\'s gevonden om aan te melden.');
  process.exit(1);
}

// 1. staat de sleutel online? Anders weigert IndexNow de melding.
const check = await fetch(KEY_LOCATION, { redirect: 'follow' });
const found = (await check.text()).trim();
if (!check.ok || found !== KEY) {
  console.error(`Sleutelbestand niet (juist) online: ${KEY_LOCATION} gaf ${check.status}.`);
  console.error('Zet de site eerst online (push naar GitHub) en probeer opnieuw.');
  process.exit(1);
}

// 2. alles in één keer aanmelden (max. 10.000 URL's per verzoek)
const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
});

const MEANING = {
  200: 'OK: de URL\'s zijn ontvangen.',
  202: 'Aanvaard: ontvangen, de sleutel wordt nog gecontroleerd.',
  400: 'Fout in het verzoek.',
  403: 'Sleutel ongeldig of niet gevonden op de site.',
  422: 'Een of meer URL\'s horen niet bij ' + HOST + '.',
  429: 'Te veel verzoeken: probeer later opnieuw.',
};
console.log(`${res.status} ${MEANING[res.status] || res.statusText} (${urls.length} URL's → ${new URL(ENDPOINT).host})`);
if (res.status >= 400) {
  const body = await res.text();
  if (body) console.log(body.slice(0, 500));
  process.exit(1);
}
