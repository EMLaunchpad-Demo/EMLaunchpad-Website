# emlaunchpad.com

Statische site (HTML, CSS, JS) op Cloudflare Workers, Worker `emlaunchpad-website` (zie `wrangler.jsonc`).
Pagina's worden gebouwd met de Python-scripts in `scripts/paginas/<pagina>/`. Bestanden die niet online mogen
(scripts, `*.py`, `*.md`, `worker/`, `controle/`) staan in `.assetsignore`.

## Gratis website scan

Pagina: `https://emlaunchpad.com/gratis-website-scan` (alleen Nederlands). Een bezoeker geeft een webadres in en
krijgt meteen een rapport met meer dan 30 punten in 5 groepen, met een totaalscore op 100. Wie zijn verbeterplan
wil zien, vult een formulier van ons platform in: dat wordt een lead voor Ebert.

### Bestanden

| Bestand | Wat |
|---|---|
| `worker/index.js` | De Worker: `/api/scan` naar de scan, andere `/api/*` geven 404, de rest gaat naar de statische bestanden (`env.ASSETS`). |
| `worker/scan.js` | Ophalen met alle veiligheidscontroles (adres, DNS, doorverwijzingen, tijd, grootte), robots.txt, sitemap, http naar https, favicon, eigen scripts, contact- en boekingspagina. |
| `worker/analyse.js` | De punten zelf (regex, geen DOM) en de score: `analyse(html, ctx)` en `score(checks)`. Gewichten per groep: Vindbaar in Google 30, Klanten binnenhalen 25, Snelheid 15, Op de gsm 15, Veiligheid en vertrouwen 15. |
| `gratis-website-scan.html` | Gebouwd door `scripts/paginas/website-scan/build_scan.py` uit `nl.json`. Niet met de hand aanpassen. |
| `website-scan.css`, `website-scan.js` | Opmaak (prefix `sc-`) en de werking van de pagina (scan starten, rapport tonen, formulier openen). |
| `scripts/paginas/website-scan/nl.json` | Alle teksten van de pagina, de FAQ en de instellingen van het formulier. |
| `scripts/paginas/website-scan/mail-verbeterplan.html` | Bron van de mail met het verbeterplan (staat in de workflow in ons platform). |
| `scripts/paginas/website-scan/og.html`, `scripts/website-scan/maak-og.mjs` | Deelafbeelding `assets/og-website-scan.png` (1200x630). |
| `scripts/website-scan/test.mjs` | Test van de scan in Node (foute invoer en echte sites, ook offline uit een opname). |
| `scripts/website-scan/devserver.mjs` | Lokale server: statische bestanden met nette URL's en 404, plus `/api/scan`. |
| `scripts/website-scan/controle.mjs` | Schermafbeeldingen (390 en 1440 px) en metingen in headless Chrome of Edge, naar `controle/website-scan/` (niet in git, niet online). |

### Het endpoint `/api/scan`

- `POST /api/scan` met `content-type: application/json` en body `{"url": "jouwzaak.be"}` (max. 2000 tekens).
- Antwoord bij succes (200): `{ ok: true, versie, url, host, gescand, duurMs, score, label, categorieen[], plan[], checks[], meta }`.
  Elke check heeft `id`, `cat`, `titel`, `status` (`goed`, `beter`, `slecht` of `info`), `gezien`, `waarom` en `doe`.
- Fout: `{ ok: false, fout, bericht }` met status 400 (foute invoer), 422 (site niet te scannen), 429 (te vaak) of 500.
  Codes: `leeg`, `ongeldig`, `niet-toegelaten`, `bestaat-niet`, `dns-fout`, `onbereikbaar`, `traag`, `geblokkeerd`,
  `niet-gevonden`, `serverfout`, `geen-html`, `te-veel-doorverwijzingen`, `te-vaak`, `intern`.
- Andere methodes dan POST (en OPTIONS) geven 405, een body zonder `content-type: application/json` geeft 415
  (zo kan een andere site het endpoint niet zonder CORS-preflight aanroepen, en die staan we niet toe). Antwoorden worden niet gecachet (`no-store`) en niet geïndexeerd
  (`x-robots-tag: noindex`). Het gescande adres wordt niet gelogd of bewaard.

### Limieten en veiligheid

- Alleen `http` en `https`, alleen poort 80 en 443, geen gebruikersnaam of wachtwoord in het adres.
- Geen IP-adressen (ook geen verkapte vormen zoals `2130706433` of `0x7f.1`), geen `localhost`, geen interne namen
  (`.local`, `.internal`, namen zonder punt). Elke hostnaam wordt eerst opgezocht via DNS over HTTPS
  (cloudflare-dns.com); wijst ze naar een privé- of intern adres, dan scannen we niet (bv. `127.0.0.1.nip.io`).
- Max. 5 doorverwijzingen; elke nieuwe bestemming wordt opnieuw gecontroleerd.
- Tijd: 10 s voor de pagina, 5 s voor elk extra verzoek. Grootte: max. 3 MB voor de pagina (daarna afgekapt),
  256 KB robots.txt, 64 KB sitemap, 384 KB per script, 512 KB voor contact- of boekingspagina.
- Max. 45 verzoeken per scan (in de praktijk 7 tot 12), max. 4 eigen scripts.
- User-Agent: `EMLaunchpadScan/1.0 (+https://emlaunchpad.com/gratis-website-scan)`.
- Per IP-adres: 8 scans per minuut, via de Rate Limiting-binding `SCAN_LIMIT` in `wrangler.jsonc`
  (namespace `1103`). Zonder binding (lokaal) telt de Worker zelf per isolate.
- `run_worker_first: ["/api/*"]`: alleen `/api/*` gaat eerst langs de Worker. De rest blijft gewoon statisch,
  dus `_redirects`, de 404-pagina en de nette URL's werken zoals voorheen.

Wat de scan niet doet: geen browser, dus geen Core Web Vitals en niet de score van PageSpeed Insights; alleen de
startpagina (plus de contact- of boekingspagina als we die nodig hebben); inhoud die pas met JavaScript verschijnt,
zien we niet (de pagina zegt dat dan ook).

### Leads: formulier en workflow in ons platform

Sub-account EM Launchpad (`2tBkltDEdjuF6a2ULx8o`).

- Formulier "Website scan · Verbeterplan" (`r5N5NSQ8ocdaCAHLXIPh`): voornaam, e-mail, bedrijfsnaam, telefoon
  (niet verplicht), website, privacy-akkoord (met link naar /privacy). De score en de samenvatting zijn verborgen velden.
  Opmaak: de CSS van het EML-formulier plus een extra blok onderaan (knoptekst "Stuur mijn verbeterplan", volgorde
  van de velden, verborgen velden onzichtbaar), in de instellingen van het formulier zelf.
- De pagina vult het formulier vooraf in via de URL (query-sleutels uit `nl.json`): `website_scan_url`,
  `website_scan_score`, `website_scan_samenvatting`. Eigen velden: `contact.website_scan_url` (tekst),
  `contact.website_scan_score` (getal), `contact.website_scan_samenvatting` (lange tekst).
- Het verbeterplan (wat je eraan kunt doen) blijft dicht tot het formulier verstuurd is
  (`set-sticky-contacts`-bericht van het formulier). De punten zelf en hun status ziet iedereen.
- Workflow "Website scan - verbeterplan per mail en opvolging" (`eb83d724-6989-4aad-9b47-ceae911792d2`, staat in
  **Concept**): tag `website-scan`, opportunity in Outreach process / Nieuwe lead, notitie met de scan, mail met het
  verbeterplan, melding aan Ebert, na 24 uur zonder afspraak (tag `cc-meeting`) een taak voor Ebert om te bellen.
- De link in de mail (`/gratis-website-scan?url=...&plan=1`) start de scan opnieuw en opent het plan meteen.

### Werken aan de scan

```
py scripts/paginas/website-scan/build_scan.py               # pagina opnieuw bouwen na een wijziging in nl.json
node scripts/website-scan/test.mjs --alleen-invoer          # foute invoer (haalt niets op, op 2 DNS-opzoekingen na)
node scripts/website-scan/test.mjs jouwzaak.be              # één site echt scannen
node scripts/website-scan/test.mjs --opname <map>           # sites één keer ophalen en bewaren (map buiten de repo)
node scripts/website-scan/test.mjs --offline <map>          # opnieuw analyseren zonder netwerk
node scripts/website-scan/devserver.mjs 8795                # lokaal: http://localhost:8795/gratis-website-scan
node scripts/website-scan/controle.mjs http://localhost:8795 emlaunchpad.com
node scripts/website-scan/maak-og.mjs                       # deelafbeelding opnieuw maken
```

Verander je `website-scan.css`, `website-scan.js`, `site.js` of `i18n.js`, verhoog dan de `?v=` in de HTML
(cachebusting). Na een nieuwe of gewijzigde pagina: `scripts/crawl-fallback.mjs`, de sitemap en IndexNow.

### Na een deploy controleren

- `/gratis-website-scan` laadt, een scan van `emlaunchpad.com` geeft een rapport.
- `POST /api/scan` met `{"url":"localhost"}` geeft 400 `niet-toegelaten`; `GET /api/scan` geeft 405.
- `/bestaat-niet` geeft de 404-pagina, een oude URL uit `_redirects` geeft 301, `/Diensten` geeft 200.
- CPU-tijd van de Worker in de logs: de analyse duurt 2 tot 6 ms (de eerste keer na een koude start meer).
  Op het gratis plan is de grens 10 ms per verzoek.
