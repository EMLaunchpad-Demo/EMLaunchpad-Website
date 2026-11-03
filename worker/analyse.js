// Gratis website scan (emlaunchpad.com/gratis-website-scan): analyse van één opgehaalde pagina.
// Puur JavaScript zonder DOM en zonder afhankelijkheden: draait in de Cloudflare Worker en in Node (tests).
// We meten alleen wat in de HTML, de headers, robots.txt, de sitemap en de http-doorverwijzing echt te zien is.
// Elke check geeft: status ("goed", "beter", "slecht" of "info"), wat we zagen, waarom het telt en wat je kunt doen.
// Alle teksten volgen de schrijfstijl van EM Launchpad: "je", gewone woorden, geen beloftes over resultaat.

export const CATEGORIEEN = [
  { id: 'seo', naam: 'Vindbaar in Google', gewicht: 30 },
  { id: 'klanten', naam: 'Klanten binnenhalen', gewicht: 25 },
  { id: 'snelheid', naam: 'Snelheid', gewicht: 15 },
  { id: 'gsm', naam: 'Op de gsm', gewicht: 15 },
  { id: 'veiligheid', naam: 'Veiligheid en vertrouwen', gewicht: 15 },
];

/* ------------------------------------------------------------------ hulpjes */

const ENT = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', trade: '™', euro: '€',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', aacute: 'á', agrave: 'à', acirc: 'â', auml: 'ä', iuml: 'ï', icirc: 'î',
  oacute: 'ó', ocirc: 'ô', ouml: 'ö', uacute: 'ú', ugrave: 'ù', ucirc: 'û', uuml: 'ü', ccedil: 'ç', ntilde: 'ñ',
  ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
  laquo: '«', raquo: '»', middot: '·', bull: '•', shy: '', zwj: '', zwnj: '', thinsp: ' ', ensp: ' ', emsp: ' ',
};

export function decode(s) {
  if (!s || s.indexOf('&') < 0) return s || '';
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+[0-9]*);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m; } catch { return m; }
    }
    const v = ENT[e.toLowerCase()];
    return v === undefined ? m : v;
  });
}

const ATTR = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
function attrs(s) {
  const o = {};
  if (!s) return o;
  ATTR.lastIndex = 0;
  let m;
  while ((m = ATTR.exec(s))) {
    const k = m[1].toLowerCase();
    if (!(k in o)) o[k] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return o;
}

function tags(html, name) {
  const re = new RegExp('<' + name + '\\b([^>]*)>', 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(attrs(m[1]));
  return out;
}

const plat = (s) => decode(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const kort = (s, n = 90) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const kb = (b) => (b >= 1024 * 1024 ? (b / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
const relList = (v) => String(v || '').toLowerCase().split(/\s+/).filter(Boolean);
const zonderWww = (h) => String(h || '').toLowerCase().replace(/^www\./, '');

/* Gratis adressen van websitebouwers en hosting (eigen domein = beter vertrouwen). */
const GRATIS_DOMEIN = [
  ['wixsite.com', 'Wix'], ['wixstudio.io', 'Wix'], ['editorx.io', 'Wix'], ['weebly.com', 'Weebly'], ['wordpress.com', 'WordPress.com'],
  ['wpcomstaging.com', 'WordPress.com'], ['blogspot.com', 'Blogger'], ['blogspot.be', 'Blogger'], ['jimdosite.com', 'Jimdo'],
  ['jimdofree.com', 'Jimdo'], ['jimdo.com', 'Jimdo'], ['webnode.be', 'Webnode'], ['webnode.nl', 'Webnode'], ['webnode.com', 'Webnode'],
  ['webnode.page', 'Webnode'], ['site123.me', 'SITE123'], ['squarespace.com', 'Squarespace'], ['godaddysites.com', 'GoDaddy'],
  ['business.site', 'Google'], ['sites.google.com', 'Google Sites'], ['webflow.io', 'Webflow'], ['framer.website', 'Framer'],
  ['framer.app', 'Framer'], ['framer.ai', 'Framer'], ['carrd.co', 'Carrd'], ['github.io', 'GitHub Pages'], ['netlify.app', 'Netlify'],
  ['vercel.app', 'Vercel'], ['pages.dev', 'Cloudflare Pages'], ['workers.dev', 'Cloudflare Workers'], ['strikingly.com', 'Strikingly'],
  ['mystrikingly.com', 'Strikingly'], ['simplesite.com', 'SimpleSite'], ['ueniweb.com', 'UENI'], ['hostingersite.com', 'Hostinger'],
  ['zyrosite.com', 'Hostinger'], ['myshopify.com', 'Shopify'], ['odoo.com', 'Odoo'], ['firebaseapp.com', 'Firebase'], ['web.app', 'Firebase'],
  ['glitch.me', 'Glitch'], ['000webhostapp.com', '000webhost'], ['square.site', 'Square'], ['mailchimpsites.com', 'Mailchimp'],
  ['yolasite.com', 'Yola'], ['tilda.ws', 'Tilda'], ['webador.be', 'Webador'], ['webador.nl', 'Webador'], ['webador.com', 'Webador'],
  ['lovable.app', 'Lovable'], ['replit.app', 'Replit'], ['onrender.com', 'Render'], ['herokuapp.com', 'Heroku'],
  ['azurewebsites.net', 'Azure'], ['canva.site', 'Canva'], ['my.canva.site', 'Canva'], ['notion.site', 'Notion'], ['super.site', 'Super'],
  ['b12sites.com', 'B12'], ['gamma.site', 'Gamma'], ['durable.co', 'Durable'], ['one-website.be', 'one.com'],
];

/* Herkenning van widgets (agenda, chat, formulier). Om rekentijd te sparen zoeken we niet in de hele pagina, maar in:
   - de adressen (host + pad) die in de pagina en in haar scripts staan ("tokens"): termen zonder soort;
   - de waarden van class-, id- en data-attributen en het begin van de inline scripts: termen met soort 'k'.
   [zoekterm, naam, soort?] */
const BOEKING = [
  ['calendly.com', 'Calendly'], ['salonized.com', 'Salonized'], ['treatwell.', 'Treatwell'], ['planity.com', 'Planity'],
  ['fresha.com', 'Fresha'], ['setmore.com', 'Setmore'], ['simplybook.', 'SimplyBook.me'], ['acuityscheduling.com', 'Acuity'],
  ['squarespacescheduling.com', 'Acuity'], ['booksy.com', 'Booksy'], ['connect.shore.com', 'Shore'], ['timify.com', 'TIMIFY'],
  ['bookings.zoho', 'Zoho Bookings'], ['zohobookings.', 'Zoho Bookings'], ['outlook.office365.com/owa/calendar', 'Microsoft Bookings'],
  ['outlook.office.com/bookwithme', 'Microsoft Bookings'], ['outlook.office.com/book/', 'Microsoft Bookings'], ['bookings.cloud.microsoft', 'Microsoft Bookings'],
  ['calendar.google.com/calendar/appointments', 'Google Agenda'], ['calendar.app.google', 'Google Agenda'], ['doctena.', 'Doctena'],
  ['doctoranytime.', 'Doctoranytime'], ['mobminder.com', 'Mobminder'], ['rosa.be', 'Rosa'], ['progenda.be', 'Progenda'],
  ['leadconnectorhq.com/widget/booking', 'LeadConnector'], ['leadconnectorhq.com/booking/', 'LeadConnector'],
  ['msgsndr.com/widget/booking', 'LeadConnector'], ['msgsndr.com/booking/', 'LeadConnector'], ['/widget/booking/', 'LeadConnector'], ['/widget/bookings/', 'LeadConnector'],
  ['tidycal.com', 'TidyCal'], ['bookeo.com', 'Bookeo'], ['resengo.', 'Resengo'],
  ['zenchef.', 'Zenchef'], ['thefork.', 'TheFork'], ['formitable.com', 'Formitable'], ['opentable.', 'OpenTable'],
  ['tablebooker.', 'Tablebooker'], ['youcanbook.me', 'YouCanBookMe'], ['supersaas.', 'SuperSaaS'], ['picktime.com', 'Picktime'],
  ['appointy.com', 'Appointy'], ['squareup.com/appointments', 'Square'], ['book.squareup.com', 'Square'], ['square.site/book', 'Square'],
  ['mindbodyonline.com', 'Mindbody'], ['healcode.com', 'Mindbody'], ['eversports.', 'Eversports'], ['bsport.io', 'bsport'], ['momoyoga.com', 'Momoyoga'],
  ['bookingkit.', 'bookingkit'], ['regiondo.', 'Regiondo'], ['lodgify.com', 'Lodgify'], ['cubilis.', 'Cubilis'], ['app.mews.com', 'Mews'],
  ['mews.com/distributor', 'Mews'], ['smoobu.com', 'Smoobu'], ['beds24.com', 'Beds24'], ['sirvoy.com', 'Sirvoy'], ['littlehotelier.com', 'Little Hotelier'],
  ['cloudbeds.com', 'Cloudbeds'], ['onlineafspraken.nl', 'Onlineafspraken.nl'], ['agendize.com', 'Agendize'], ['phorest.com', 'Phorest'],
  ['vagaro.com', 'Vagaro'], ['salonkee.', 'Salonkee'], ['flexbooker.com', 'FlexBooker'], ['ameliabooking', 'Amelia'], ['/bookly', 'Bookly'],
  ['savvycal.com', 'SavvyCal'], ['koalendar.com', 'Koalendar'], ['zcal.co', 'zcal'], ['hubspot.com/meetings', 'HubSpot'],
  ['meetings.hubspot.com', 'HubSpot'], ['meetings-eu1.hubspot.com', 'HubSpot'], ['app.cal.com', 'Cal.com'],
  ['bookly-form', 'Bookly', 'k'], ['amelia-app-booking', 'Amelia', 'k'], ['wix-bookings', 'Wix Bookings', 'k'],
];

const CHAT = [
  ['widgets.leadconnectorhq.com/loader.js', 'LeadConnector'], ['leadconnectorhq.com/chat-widget', 'LeadConnector'],
  ['code.tidio.co', 'Tidio'], ['widget.intercom.io', 'Intercom'], ['js.intercomcdn.com', 'Intercom'], ['client.crisp.chat', 'Crisp'],
  ['embed.tawk.to', 'tawk.to'], ['js.driftt.com', 'Drift'], ['usemessages.com', 'HubSpot'], ['static.zdassets.com', 'Zendesk'],
  ['zopim.com', 'Zendesk'], ['cdn.livechatinc.com', 'LiveChat'], ['smartsuppchat.com', 'Smartsupp'], ['smartsupp.com', 'Smartsupp'],
  ['chatra.io', 'Chatra'], ['olark.com', 'Olark'], ['freshchat.com', 'Freshchat'], ['code.jivosite.com', 'JivoChat'],
  ['userlike-cdn', 'Userlike'], ['userlike.com', 'Userlike'], ['trengo.eu', 'Trengo'], ['trengo.com', 'Trengo'],
  ['chatwoot', 'Chatwoot'], ['botpress.cloud', 'Botpress'], ['landbot.io', 'Landbot'], ['voiceflow.com', 'Voiceflow'],
  ['chatbase.co', 'Chatbase'], ['purechat.com', 'Pure Chat'], ['gorgias.chat', 'Gorgias'],
  ['reamaze.com', 'Re:amaze'], ['helpcrunch.com', 'HelpCrunch'], ['kommunicate.io', 'Kommunicate'], ['manychat.com', 'ManyChat'],
  ['watermelon.ai', 'Watermelon'], ['salesiq.zoho', 'Zoho SalesIQ'], ['crisp.chat', 'Crisp'],
  ['fb-customerchat', 'Messenger', 'k'],
];

const FORMULIER = [
  ['leadconnectorhq.com/widget/form', 'LeadConnector'], ['msgsndr.com/widget/form', 'LeadConnector'], ['leadconnectorhq.com/widget/survey', 'LeadConnector'],
  ['form.typeform.com', 'Typeform'], ['embed.typeform.com', 'Typeform'], ['jotform', 'Jotform'], ['docs.google.com/forms', 'Google Forms'], ['forms.gle', 'Google Forms'],
  ['hsforms', 'HubSpot'], ['tally.so', 'Tally'], ['formspree.io', 'Formspree'], ['forms.zohopublic', 'Zoho Forms'], ['cognitoforms.com', 'Cognito Forms'],
  ['paperform.co', 'Paperform'], ['formstack.com', 'Formstack'], ['forms.office.com', 'Microsoft Forms'], ['getform.io', 'Getform'],
  ['usebasin.com', 'Basin'], ['web3forms.com', 'Web3Forms'],
  ['wpcf7', 'Contact Form 7', 'k'], ['gform_wrapper', 'Gravity Forms', 'k'], ['elementor-form', 'Elementor', 'k'], ['wpforms', 'WPForms', 'k'],
  ['nf-form-cont', 'Ninja Forms', 'k'], ['fluentform', 'Fluent Forms', 'k'], ['forminator', 'Forminator', 'k'], ['hbspt.forms', 'HubSpot', 'k'],
  ['wixui-form', 'Wix', 'k'],
];

const URLRE = /(?:\/\/|\\\/\\\/)([a-z0-9-]+(?:\.[a-z0-9-]+)+)((?:(?:\/|\\\/)[\w.~%@+-]*){0,4})/gi;
const KLASRE = /\s(?:class|id|data-[\w-]+)\s*=\s*["']([^"']{1,300})["']/gi;

/** Bron om in te zoeken: tokens (adressen) en klassen (class/id/data + begin van inline scripts). */
function nieuweBron() { return { tokens: new Set(), klassen: [] }; }
function voegToe(bron, tekst, { klassen = true, inline = false } = {}) {
  if (!tekst) return bron;
  URLRE.lastIndex = 0;
  let m;
  while ((m = URLRE.exec(tekst))) bron.tokens.add((m[1] + m[2].replace(/\\\//g, '/')).toLowerCase());
  if (inline) bron.klassen.push(tekst.slice(0, 20000).toLowerCase());
  else if (klassen) {
    KLASRE.lastIndex = 0;
    while ((m = KLASRE.exec(tekst))) bron.klassen.push(m[1].toLowerCase());
  }
  return bron;
}
function zoek(lijst, bron) {
  if (!bron) return null;
  let klas = null;
  for (const [term, naam, soort] of lijst) {
    if (soort === 'k') { klas ??= bron.klassen.join(' '); if (klas.includes(term)) return naam; }
    else for (const t of bron.tokens) if (t.includes(term)) return naam;
  }
  return null;
}
/** Bron voor een volledige (sub)pagina: adressen en klassen uit de hele HTML. */
function bronVanPagina(html) { return voegToe(nieuweBron(), html); }

/** Een echt formulier in de HTML (geen zoekveld, minstens een tekstvak of 3 velden) of een ingebed formulier. */
function vindFormulier(html, bron) {
  const fre = /<form\b([^>]*)>([\s\S]*?)<\/form\s*>/gi;
  let m;
  while ((m = fre.exec(html))) {
    const a = attrs(m[1]), inner = m[2];
    if ((a.role || '') === 'search' || /search|zoek/i.test((a.class || '') + (a.id || '') + (a.action || ''))) continue;
    const velden = tags(inner, 'input').filter((i) => !/^(hidden|submit|button|image|reset|search|checkbox|radio)$/i.test(i.type || 'text'));
    if (/<textarea\b/i.test(inner) || velden.length >= 3) return 'eigen';
  }
  return zoek(FORMULIER, bron);
}

const LOKAAL_TYPE = /(LocalBusiness|Service|Business|Store|Shop|Salon|Spa|Restaurant|Clinic|Contractor|Agency|Dentist|Physician|Hotel|Bakery|Electrician|Plumber|Locksmith|Notary|Attorney|Gym|Optician|Pharmacy|Winery|Brewery|BarOrPub|CafeOrCoffeeShop|Hostel|Resort|BedAndBreakfast|AutoRepair|AutoDealer|AutoBodyShop|AutoWash|HousePainter|MovingCompany|ChildCare|DryCleaningOrLaundry|Physiotherapy|VeterinaryCare|Campground|ExerciseGym|HealthClub|Florist|Library|Museum|Optometric|Psychologist|Podiatric|MedicalBusiness|LegalService|FinancialService|RealEstateAgent|InsuranceAgency|TravelAgency|EmploymentAgency|SelfStorage|TouristInformationCenter)$/;

/* Sites die hun inhoud pas met JavaScript zetten (dan ziet een scan van de HTML minder dan Google na het renderen). */
const JS_SITE = /__NUXT__|window\.__NUXT|ng-version=|data-reactroot|id="__next"|id="root"\s*>\s*<\/div>|id="app"\s*>\s*<\/div>|data-server-rendered/;

/* ------------------------------------------------------------------ voorbereiden */

function voorbereid(raw, scriptTeksten) {
  let html = raw.replace(/<!--[\s\S]*?-->/g, ' ');
  const scripts = [];
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (m, a, c) => { scripts.push({ a: attrs(a), c }); return ' '; });
  html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ');
  const zonderNoscript = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/gi, ' ');
  const cut = zonderNoscript.search(/<\/head\s*>|<body\b/i);
  const head = cut > 0 ? zonderNoscript.slice(0, cut) : zonderNoscript;
  const body = cut > 0 ? zonderNoscript.slice(cut) : zonderNoscript;
  const zonderSvg = body.replace(/<svg\b[\s\S]*?<\/svg\s*>/gi, ' ');
  const tekst = plat(zonderSvg);
  // waar we widgets zoeken: de pagina zonder stijlen, de script-adressen, het begin van de inline scripts, de eigen scripts
  const bron = voegToe(nieuweBron(), zonderNoscript);
  let inline = 0;
  for (const s of scripts) {
    if (s.a.src) voegToe(bron, ' src="' + s.a.src + '"', { klassen: false });
    else if (!/json/i.test(s.a.type || '') && inline < 200000) { voegToe(bron, s.c, { inline: true }); inline += Math.min(s.c.length, 20000); }
  }
  for (const t of scriptTeksten || []) voegToe(bron, t, { klassen: false });
  const jsSite = JS_SITE.test(raw.length > 400000 ? raw.slice(0, 400000) : raw);
  return { html: zonderNoscript, head, body: zonderSvg, scripts, tekst, bron, jsSite };
}

/* JSON-LD: alle @type-waarden, ook in @graph en geneste objecten. */
function schemaTypes(scripts) {
  const types = new Set();
  let blokken = 0, ongeldig = 0;
  const walk = (x, d = 0) => {
    if (!x || typeof x !== 'object' || d > 8) return;
    if (Array.isArray(x)) { x.forEach((y) => walk(y, d + 1)); return; }
    const t = x['@type'];
    (Array.isArray(t) ? t : t ? [t] : []).forEach((v) => types.add(String(v).replace(/^https?:\/\/schema\.org\//, '')));
    for (const k of Object.keys(x)) if (k !== '@context') walk(x[k], d + 1);
  };
  for (const s of scripts) {
    if (!/ld\+json/i.test(s.a.type || '')) continue;
    blokken++;
    try { walk(JSON.parse(s.c.trim())); } catch { ongeldig++; }
  }
  return { types: [...types], blokken, ongeldig };
}

/* ------------------------------------------------------------------ de checks */

const JSNOOT = " Je site zet die waarschijnlijk pas met JavaScript. Google kan dat meestal lezen, maar andere zoekmachines en apps (zoals WhatsApp bij het delen) niet altijd.";

function maak(id, cat, gewicht, titel, uitleg, advies) {
  return (status, gezien) => ({ id, cat, status, titel, gezien, uitleg, advies: status === 'goed' || status === 'info' ? '' : advies, gewicht });
}

/**
 * @param {string} raw  de HTML (al gedecodeerd naar tekst)
 * @param {object} ctx  { url: URL van de pagina, headers: Headers, bytes, truncated, responseMs, hops: [{url,status}],
 *                        robots: {status, text}|null, sitemap: {gevonden, waar}|null, http: {status, location}|null|'fout',
 *                        favicon: boolean|null, jaar: number }
 */
export function analyse(raw, ctx) {
  const P = voorbereid(raw, ctx.scripts);
  const url = ctx.url;
  const host = url.hostname.toLowerCase();
  const isHttps = url.protocol === 'https:';
  const metas = tags(P.html, 'meta');
  const links = tags(P.html, 'link');
  const meta = (k) => {
    const m = metas.find((x) => (x.name || '').toLowerCase() === k || (x.property || '').toLowerCase() === k);
    return m ? (m.content || '').trim() : null;
  };
  const anchors = tags(P.body, 'a');
  const hrefs = anchors.map((a) => (a.href || '').trim());
  const imgs = tags(P.body, 'img').filter((a) => !(String(a.width) === '1' && String(a.height) === '1') && !/display\s*:\s*none/i.test(a.style || ''));
  const iframes = tags(P.body, 'iframe');
  const out = [];

  /* ===== Vindbaar in Google ===== */
  {
    const m = P.head.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i) || P.html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i);
    const t = m ? plat(m[1]) : '';
    const n = [...t].length;
    const c = maak('titel', 'seo', 3, 'Titel van je pagina',
      'Dit is de blauwe, klikbare regel in Google en de tekst op het tabblad. Google toont er ongeveer 50 tot 60 tekens van.',
      'Schrijf een titel van 50 tot 60 tekens met wat je doet en waar, en je bedrijfsnaam achteraan. Bijvoorbeeld: Schilderwerken in Genk en omgeving | Naam van je zaak.');
    if (!n) out.push(P.jsSite ? c('beter', 'We vonden geen titel in de HTML.' + JSNOOT) : c('slecht', 'We vonden geen titel.'));
    else if (/^(home|homepage|start|startpagina|welkom|welcome|index|untitled|nieuwe pagina|new page|accueil)$/i.test(t)) out.push(c('beter', `"${kort(t)}" zegt niet wat je doet.`));
    else if (n < 25) out.push(c('beter', `"${kort(t)}" (${n} tekens): wat kort.`));
    else if (n > 65) out.push(c('beter', `"${kort(t)}" (${n} tekens): Google knipt hem af.`));
    else out.push(c('goed', `"${t}" (${n} tekens).`));
  }
  {
    const d = meta('description') || '';
    const n = [...d].length;
    const c = maak('beschrijving', 'seo', 2, 'Beschrijving in Google',
      'De korte tekst onder je titel in Google. Een goede beschrijving zorgt dat meer mensen doorklikken. Zonder beschrijving kiest Google zelf een stukje tekst.',
      'Schrijf een beschrijving van 120 tot 155 tekens: wat je aanbiedt, voor wie, en een reden om te klikken.');
    if (!n) out.push(P.jsSite ? c('beter', 'We vonden geen beschrijving (meta description) in de HTML.' + JSNOOT) : c('slecht', 'We vonden geen beschrijving (meta description).'));
    else if (n < 70) out.push(c('beter', `${n} tekens: wat kort. "${kort(d, 110)}"`));
    else if (n > 165) out.push(c('beter', `${n} tekens: Google knipt ze af.`));
    else out.push(c('goed', `${n} tekens: "${kort(d, 110)}"`));
  }
  const koppen = [];
  {
    const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi;
    let m;
    while ((m = re.exec(P.body))) koppen.push({ n: +m[1], t: plat(m[2]) });
  }
  {
    const h1 = koppen.filter((k) => k.n === 1);
    const c = maak('h1', 'seo', 3, 'Hoofdtitel (H1)',
      'Elke pagina heeft één duidelijke hoofdtitel. Google en schermlezers gebruiken die om te begrijpen waar de pagina over gaat.',
      'Zet bovenaan precies één H1 met wat je doet, bijvoorbeeld "Elektricien voor renovatie en nieuwbouw". Gebruik voor de andere titels H2 en H3.');
    if (!h1.length) out.push(P.jsSite ? c('beter', 'We vonden geen H1 in de HTML.' + JSNOOT) : c('slecht', 'We vonden geen H1 op de pagina.'));
    else if (h1.length > 1) out.push(c('beter', `${h1.length} hoofdtitels gevonden, bv. "${kort(h1[0].t || '(zonder tekst)', 60)}" en "${kort(h1[1].t || '(zonder tekst)', 60)}".`));
    else if (!h1[0].t) out.push(c('beter', 'De H1 bevat geen tekst (misschien alleen een logo).'));
    else out.push(c('goed', `"${kort(h1[0].t)}"`));
  }
  {
    const c = maak('koppen', 'seo', 1, 'Opbouw van de tussentitels',
      'Tussentitels (H2, H3) delen je tekst op in blokken. Zo lezen bezoekers en Google makkelijker wat er op de pagina staat.',
      'Geef elk blok op de pagina een H2 en gebruik H3 alleen binnen zo\'n blok. Sla geen niveau over.');
    const h2 = koppen.filter((k) => k.n === 2).length;
    let sprong = null;
    for (let i = 1; i < koppen.length; i++) if (koppen[i].n > koppen[i - 1].n + 1) { sprong = `H${koppen[i - 1].n} naar H${koppen[i].n}`; break; }
    const tel = [1, 2, 3].map((n) => `${koppen.filter((k) => k.n === n).length}x H${n}`).join(', ');
    if (!koppen.length) out.push(c('beter', 'We vonden geen titels in de HTML.'));
    else if (!h2) out.push(c('beter', `Geen H2-tussentitels (${tel}).`));
    else if (sprong) out.push(c('beter', `Er wordt een niveau overgeslagen (${sprong}). ${tel}.`));
    else out.push(c('goed', `${tel}, netjes op volgorde.`));
  }
  {
    const l = links.find((x) => relList(x.rel).includes('canonical'));
    const c = maak('canonical', 'seo', 1, 'Voorkeursadres (canonical)',
      'Hiermee zeg je aan Google welk adres de echte versie van de pagina is. Dat voorkomt dubbele pagina\'s, bijvoorbeeld met en zonder www.',
      'Zet in de head van elke pagina een canonical-link naar het volledige adres van die pagina zelf.');
    if (!l || !l.href) out.push(c('beter', 'Er staat geen canonical-link op de pagina.'));
    else {
      let cu = null;
      try { cu = new URL(l.href, url); } catch { /* ongeldig */ }
      if (!cu) out.push(c('beter', `De canonical "${kort(l.href, 80)}" is geen geldig adres.`));
      else if (zonderWww(cu.hostname) !== zonderWww(host)) out.push(c('beter', `De canonical verwijst naar een ander domein: ${kort(cu.href, 80)}`));
      else out.push(c('goed', kort(cu.href, 90)));
    }
  }
  {
    const r = [meta('robots'), meta('googlebot')].filter(Boolean).join(', ').toLowerCase();
    const x = (ctx.headers.get('x-robots-tag') || '').toLowerCase();
    const c = maak('index', 'seo', 3, 'Zichtbaar voor Google',
      'Een "noindex" vertelt Google dat de pagina niet in de zoekresultaten mag. Soms blijft dat per vergissing staan na het bouwen van een site.',
      'Haal de noindex weg uit de pagina (meta robots) of uit de instellingen van je websitebouwer, bijvoorbeeld "Zoekmachines ontmoedigen" in WordPress.');
    if (/noindex|\bnone\b/.test(r)) out.push(c('slecht', 'De pagina vraagt Google om ze niet op te nemen (meta robots: noindex).'));
    else if (/noindex|\bnone\b/.test(x)) out.push(c('slecht', 'Je server vraagt Google om de pagina niet op te nemen (X-Robots-Tag: noindex).'));
    else out.push(c('goed', 'Er staat geen noindex: Google mag de pagina opnemen.'));
  }
  {
    const c = maak('robots', 'seo', 1, 'robots.txt',
      'Een klein bestand dat zoekmachines vertelt welke delen van je site ze mogen bekijken.',
      'Zet een robots.txt in de hoofdmap van je site die alles toelaat en naar je sitemap verwijst.');
    const rb = ctx.robots;
    if (!rb || rb.status === 0) out.push(c('beter', 'We konden robots.txt niet ophalen.'));
    else if (rb.status === 404 || rb.status === 410) out.push(c('beter', 'Er is geen robots.txt (404).'));
    else if (rb.status >= 400) out.push(c('beter', `robots.txt geeft een fout (${rb.status}).`));
    else if (rb.blokkeertAlles) {
      const s = c('slecht', 'robots.txt blokkeert je hele site voor zoekmachines ("Disallow: /").');
      s.advies = 'Verwijder de regel "Disallow: /" onder "User-agent: *", zodat Google je site kan lezen.';
      out.push(s);
    } else out.push(c('goed', 'robots.txt is aanwezig en laat zoekmachines toe.'));
  }
  {
    const c = maak('sitemap', 'seo', 2, 'Sitemap',
      'Een lijst van al je pagina\'s voor Google. Zo vindt Google nieuwe en gewijzigde pagina\'s sneller.',
      'Maak een sitemap.xml (de meeste websitebouwers doen dat automatisch), zet de link in robots.txt en dien ze in bij Google Search Console.');
    const sm = ctx.sitemap;
    if (sm && sm.gevonden) out.push(c('goed', `Gevonden: ${kort(sm.waar, 80)}`));
    else out.push(c('beter', 'We vonden geen sitemap (niet in robots.txt en niet op /sitemap.xml).'));
  }
  {
    const m = P.html.match(/<html\b([^>]*)>/i);
    const lang = m ? (attrs(m[1]).lang || attrs(m[1])['xml:lang'] || '').trim() : '';
    const c = maak('taal', 'seo', 1, 'Taal van de pagina',
      'Het lang-attribuut vertelt browsers en Google in welke taal je pagina geschreven is. Dat helpt bij voorlezen en vertalen.',
      'Zet lang="nl" (of nl-BE) op de html-tag van je pagina.');
    const nl = (P.tekst.match(/s(de|het|een|en|van|voor|je|jouw|met|niet|ook|wij|onze)s/gi) || []).length;
    const en = (P.tekst.match(/s(the|and|you|your|for|with|our|we|are|not)s/gi) || []).length;
    if (!lang) out.push(c('beter', 'Er staat geen taal op de pagina.'));
    else if (/^en/i.test(lang) && nl > 30 && nl > en * 3) out.push(c('beter', `lang="${kort(lang, 20)}" (Engels), maar de tekst lijkt Nederlands.`));
    else out.push(c('goed', `lang="${kort(lang, 20)}"`));
  }
  {
    const s = schemaTypes(P.scripts);
    const micro = /itemtype\s*=\s*["']https?:\/\/schema\.org\/([A-Za-z]+)/gi;
    let mm;
    while ((mm = micro.exec(P.html))) s.types.push(mm[1]);
    const lokaal = s.types.filter((t) => LOKAAL_TYPE.test(t) && !/^(WebSite|WebPage|Offer|Service)$/.test(t));
    const org = s.types.filter((t) => /^(Organization|Corporation|NGO|EducationalOrganization|MedicalOrganization)$/.test(t));
    const c = maak('schema', 'seo', 2, 'Bedrijfsgegevens voor Google',
      'Met gestructureerde gegevens (JSON-LD) geef je Google je naam, adres, telefoon en openingsuren in een vaste vorm. Zo moet Google niet raden.',
      'Voeg op je startpagina een JSON-LD-blok van het type LocalBusiness toe (of een specifieker type zoals HairSalon of Electrician), met dezelfde naam, hetzelfde adres en telefoonnummer als op je Google Bedrijfsprofiel.');
    if (lokaal.length) out.push(c('goed', `Gevonden: ${[...new Set(lokaal)].slice(0, 3).join(', ')}.`));
    else if (org.length) out.push(c('beter', `We zagen ${[...new Set(org)].join(', ')}. Voor een zaak met een adres is LocalBusiness specifieker.`));
    else if (s.types.length) out.push(c('beter', `Wel gestructureerde gegevens (${[...new Set(s.types)].slice(0, 3).join(', ')}), maar geen bedrijfsgegevens.`));
    else if (s.ongeldig) out.push(c('beter', 'Er staat een JSON-LD-blok, maar het is geen geldige JSON.'));
    else out.push(c('beter', 'We vonden geen gestructureerde gegevens.'));
  }
  {
    const has = { titel: !!meta('og:title'), tekst: !!meta('og:description'), foto: !!meta('og:image') };
    const mist = Object.entries(has).filter(([, v]) => !v).map(([k]) => k);
    const c = maak('opengraph', 'seo', 1, 'Voorbeeld bij delen (Open Graph)',
      'Deelt iemand je site via WhatsApp, Facebook of LinkedIn, dan toont die app een titel, tekst en foto. Die komen uit de Open Graph-tags.',
      'Voeg og:title, og:description en og:image toe (een foto van 1200 x 630 pixels). Veel websitebouwers hebben daar een veld voor bij "delen op sociale media".');
    if (!mist.length) out.push(c('goed', 'Titel, tekst en foto voor het delen staan klaar.'));
    else if (mist.length === 3) out.push(c('beter', 'Er staan geen Open Graph-tags op de pagina.'));
    else out.push(c('beter', `Er ontbreekt: ${mist.map((k) => ({ titel: 'og:title', tekst: 'og:description', foto: 'og:image' })[k]).join(', ')}.`));
  }
  {
    const n = imgs.length;
    const zonder = imgs.filter((a) => !('alt' in a)).length;
    const c = maak('alt', 'seo', 2, 'Beschrijving bij foto\'s (alt-tekst)',
      'Een korte beschrijving per foto. Google begrijpt je foto\'s zo beter, en wie slecht ziet, hoort wat erop staat.',
      'Geef elke foto een korte beschrijving van wat erop staat, bijvoorbeeld "Badkamer na renovatie". Puur decoratieve beelden krijgen een lege alt.');
    if (!n) out.push(c('info', 'We vonden geen foto\'s in de HTML (misschien laden ze later via JavaScript).'));
    else if (!zonder) out.push(c('goed', `${n} foto${n === 1 ? '' : '\'s'}, allemaal met een alt-tekst (of bewust leeg).`));
    else if (zonder > 3 && zonder / n > 0.5) out.push(c('slecht', `${zonder} van de ${n} foto's hebben geen alt-tekst.`));
    else out.push(c('beter', `${zonder} van de ${n} foto's ${zonder === 1 ? 'heeft' : 'hebben'} geen alt-tekst.`));
  }

  /* ===== Snelheid ===== */
  {
    const ms = Math.round(ctx.responseMs);
    const c = maak('reactietijd', 'snelheid', 3, 'Reactietijd van je server',
      'Hoe snel je server begint te antwoorden als iemand je site opent. We maten het één keer, tijdens deze scan. Dit is niet de snelheidsscore van Google.',
      'Een trage reactie ligt meestal aan de hosting, een zware installatie (bv. veel WordPress-plugins) of geen cache. Vraag je hostingpartij naar caching of een snellere server.');
    const s = ms < 600 ? 'goed' : ms < 1500 ? 'beter' : 'slecht';
    out.push(c(s, `${ms.toLocaleString('nl-BE')} ms${s === 'goed' ? '' : s === 'beter' ? ': kan sneller.' : ': traag.'}`));
  }
  {
    const n = ctx.hops.length;
    const c = maak('doorverwijzingen', 'snelheid', 1, 'Doorverwijzingen',
      'Elke doorverwijzing (bv. van http naar https en dan naar www) kost een extra rondje voor je pagina begint te laden.',
      'Laat alle varianten van je adres (met en zonder www, http en https) in één stap naar het juiste adres doorsturen.');
    const keten = ctx.hops.map((h) => `${h.status}`).join(', ');
    if (!n) out.push(c('goed', 'Geen doorverwijzing: de pagina laadt meteen.'));
    else if (n === 1) out.push(c('goed', `1 doorverwijzing (${keten}) naar ${kort(url.href, 70)}.`));
    else out.push(c(n === 2 ? 'beter' : 'slecht', `${n} doorverwijzingen na elkaar (${keten}) voor je op ${kort(url.href, 60)} komt.`));
  }
  {
    const b = ctx.bytes;
    const c = maak('grootte', 'snelheid', 2, 'Grootte van de pagina',
      'Hoeveel code je browser eerst moet binnenhalen. Dit is de HTML zelf, zonder foto\'s, scripts en stylesheets.',
      'Een zware pagina komt vaak door een page builder of door veel code in de pagina zelf. Een lichter thema of een opkuis van plugins helpt.');
    if (ctx.truncated) out.push(c('slecht', `Meer dan ${kb(b)}: zeer zwaar. We lazen alleen het begin.`));
    else out.push(c(b <= 150 * 1024 ? 'goed' : b <= 500 * 1024 ? 'beter' : 'slecht', `${kb(b)} HTML.`));
  }
  {
    const n = P.scripts.filter((s) => s.a.src && !/json/i.test(s.a.type || '')).length;
    const c = maak('scripts', 'snelheid', 2, 'Aantal scripts',
      'Elk script is een extra bestand dat je browser moet laden en uitvoeren. Te veel scripts maken je site trager, vooral op een gsm.',
      'Kijk welke plugins, trackers en widgets je echt nodig hebt en zet de rest uit.');
    out.push(c(n <= 12 ? 'goed' : n <= 25 ? 'beter' : 'slecht', `${n} externe script${n === 1 ? '' : 's'}.`));
  }
  {
    const n = links.filter((l) => relList(l.rel).includes('stylesheet')).length;
    const c = maak('stylesheets', 'snelheid', 1, 'Aantal stylesheets',
      'Stylesheets bepalen hoe je site eruitziet. De browser wacht vaak tot ze allemaal binnen zijn voor hij iets toont.',
      'Bundel je stylesheets of laat ongebruikte plugins weg. Veel cacheplugins kunnen ze samenvoegen.');
    out.push(c(n <= 6 ? 'goed' : n <= 12 ? 'beter' : 'slecht', `${n} stylesheet${n === 1 ? '' : 's'}.`));
  }
  {
    const enc = (ctx.headers.get('content-encoding') || '').toLowerCase();
    const c = maak('compressie', 'snelheid', 2, 'Compressie',
      'Met compressie (gzip of Brotli) stuurt je server de pagina kleiner door. Dat scheelt laadtijd.',
      'Zet gzip- of Brotli-compressie aan bij je hosting. Bij de meeste hostingpartijen is dat een instelling.');
    // Een site achter Cloudflare stuurt naar onze scan (zelf een Cloudflare Worker) geen gecomprimeerde versie,
    // maar Cloudflare comprimeert HTML standaard voor browsers. Dan zeggen we dat, in plaats van "geen compressie".
    const viaCloudflare = /cloudflare/i.test(ctx.headers.get('server') || '') || !!ctx.headers.get('cf-ray');
    if (/br|gzip|zstd|deflate/.test(enc)) out.push(c('goed', `Aan (${enc === 'br' ? 'Brotli' : enc}).`));
    else if (viaCloudflare) out.push(c('goed', 'Je site loopt via Cloudflare, dat je pagina standaard comprimeert voor browsers.'));
    else out.push(c('beter', 'We zagen geen compressie.'));
  }

  /* ===== Op de gsm ===== */
  const vp = (meta('viewport') || '').toLowerCase().replace(/\s+/g, '');
  {
    const c = maak('viewport', 'gsm', 3, 'Aangepast aan gsm',
      'De viewport-tag zorgt dat je site zich aanpast aan het scherm van een gsm. Zonder die tag zie je op een gsm een verkleinde desktopsite.',
      'Zet <meta name="viewport" content="width=device-width, initial-scale=1"> in de head van je pagina\'s.');
    if (!vp) out.push(c('slecht', 'Er staat geen viewport-tag op de pagina.'));
    else if (vp.includes('width=device-width')) out.push(c('goed', 'De pagina past zich aan de breedte van het scherm aan.'));
    else if (/width=\d+/.test(vp)) out.push(c('slecht', `De pagina heeft een vaste breedte (${kort(vp, 40)}).`));
    else out.push(c('beter', `De viewport-tag staat er, maar zonder width=device-width (${kort(vp, 40)}).`));
  }
  {
    const c = maak('zoom', 'gsm', 1, 'Inzoomen op gsm',
      'Sommige sites blokkeren inzoomen. Dat is lastig voor wie slecht ziet, en de richtlijnen voor toegankelijkheid raden het af.',
      'Haal user-scalable=no en maximum-scale weg uit de viewport-tag.');
    const max = vp.match(/maximum-scale=([\d.]+)/);
    if (!vp) out.push(c('info', 'Niet te beoordelen zonder viewport-tag.'));
    else if (/user-scalable=(no|0)/.test(vp) || (max && parseFloat(max[1]) < 2)) out.push(c('beter', 'Inzoomen is geblokkeerd.'));
    else out.push(c('goed', 'Bezoekers kunnen inzoomen.'));
  }
  {
    const inhoud = imgs.filter((a) => !/\.svg(\?|$)/i.test(a.src || '') && !/^data:/i.test(a.src || ''));
    const srcset = inhoud.filter((a) => a.srcset || a['data-srcset']).length + (/<picture\b/i.test(P.body) ? 1 : 0);
    const c = maak('srcset', 'gsm', 1, 'Foto\'s op maat van het scherm',
      'Met srcset kiest een gsm zelf een kleinere versie van je foto\'s. Zonder dat laadt ook een gsm de grote foto.',
      'Laat je websitebouwer of thema meerdere formaten per foto maken (srcset). WordPress doet dat standaard voor foto\'s uit de mediabibliotheek.');
    if (inhoud.length < 3) out.push(c('info', 'Te weinig foto\'s in de HTML om te beoordelen.'));
    else if (srcset) out.push(c('goed', `Foto's hebben verschillende formaten (srcset of picture).`));
    else out.push(c('beter', `${inhoud.length} foto's, geen enkele met een kleinere versie voor gsm.`));
  }
  {
    const ok = links.some((l) => relList(l.rel).some((r) => r === 'apple-touch-icon' || r === 'apple-touch-icon-precomposed' || r === 'manifest'));
    const c = maak('icoon', 'gsm', 1, 'Icoon voor op het beginscherm',
      'Bewaart iemand je site op het beginscherm van zijn gsm, dan toont de gsm dit icoon.',
      'Voeg een apple-touch-icon van 180 x 180 pixels toe: je logo op een effen achtergrond.');
    out.push(ok ? c('goed', 'Er is een icoon voor het beginscherm.') : c('beter', 'We vonden geen apple-touch-icon of webmanifest.'));
  }

  /* ===== Veiligheid en vertrouwen ===== */
  {
    const c = maak('https', 'veiligheid', 3, 'Beveiligde verbinding (https)',
      'Met https is de verbinding versleuteld. Zonder https toont de browser "Niet beveiligd" naast je adres.',
      'Vraag je hostingpartij om een SSL-certificaat (bij de meeste hosting gratis, via Let\'s Encrypt) en zet https aan.');
    out.push(isHttps ? c('goed', 'Je site laadt via https.') : c('slecht', 'Je site laadt zonder https.'));
  }
  {
    const c = maak('http', 'veiligheid', 2, 'Van http naar https',
      'Wie je adres zonder https intypt, moet automatisch op de beveiligde versie terechtkomen.',
      'Stel een permanente doorverwijzing (301) in van http naar https. Bij veel hostingpartijen heet dat "HTTPS forceren".');
    const h = ctx.http;
    if (!isHttps) out.push(c('info', 'Niet van toepassing: je site heeft nog geen https.'));
    else if (!h || h === 'fout') out.push(c('beter', 'De http-versie van je adres reageert niet.'));
    else if (h.status >= 300 && h.status < 400 && /^https:/i.test(h.location || '')) {
      out.push(h.status === 301 || h.status === 308 ? c('goed', `http stuurt permanent door (${h.status}) naar https.`)
        : c('beter', `http stuurt door naar https, maar tijdelijk (${h.status}). Een 301 is beter voor Google.`));
    } else if (h.status >= 300 && h.status < 400) out.push(c('beter', `http stuurt door (${h.status}), maar niet naar https.`));
    else out.push(c('slecht', `De http-versie toont je site zonder doorverwijzing (${h.status}).`));
  }
  {
    const c = maak('hsts', 'veiligheid', 1, 'Altijd https (HSTS)',
      'Met HSTS onthoudt de browser dat je site alleen via https mag laden.',
      'Zet de header Strict-Transport-Security aan bij je hosting (of in Cloudflare, als je dat gebruikt).');
    if (!isHttps) out.push(c('info', 'Niet van toepassing zonder https.'));
    else out.push(ctx.headers.get('strict-transport-security') ? c('goed', 'De header Strict-Transport-Security staat aan.') : c('beter', 'De header Strict-Transport-Security ontbreekt.'));
  }
  {
    const c = maak('gemengd', 'veiligheid', 2, 'Onbeveiligde onderdelen',
      'Laadt een https-pagina foto\'s of scripts via gewone http, dan blokkeert de browser ze soms of verdwijnt het slotje.',
      'Vervang http:// door https:// in de adressen van die foto\'s en scripts.');
    if (!isHttps) out.push(c('info', 'Niet van toepassing zonder https.'));
    else {
      const bronnen = [
        ...imgs.map((a) => a.src), ...P.scripts.map((s) => s.a.src), ...iframes.map((a) => a.src),
        ...links.filter((l) => relList(l.rel).includes('stylesheet')).map((l) => l.href),
        ...tags(P.body, 'source').map((a) => a.src), ...tags(P.body, 'video').map((a) => a.src), ...tags(P.body, 'audio').map((a) => a.src),
      ].filter((s) => s && /^http:\/\//i.test(s.trim()));
      out.push(bronnen.length ? c('beter', `${bronnen.length} onderde${bronnen.length === 1 ? 'el laadt' : 'len laden'} via http, bv. ${kort(bronnen[0], 70)}`)
        : c('goed', 'Alle foto\'s, scripts en stylesheets laden via https.'));
    }
  }
  {
    const ok = links.some((l) => relList(l.rel).some((r) => r === 'icon' || r === 'shortcut')) || ctx.favicon === true;
    const c = maak('favicon', 'veiligheid', 1, 'Favicon',
      'Het kleine logo op het tabblad en naast je site in de zoekresultaten van Google.',
      'Voeg een favicon toe: je logo als vierkant beeld van minstens 48 x 48 pixels.');
    out.push(ok ? c('goed', 'Er is een favicon.') : c('beter', 'We vonden geen favicon.'));
  }
  {
    const c = maak('jaartal', 'veiligheid', 1, 'Jaartal in de footer',
      'Een oud jaartal onderaan geeft bezoekers de indruk dat de site niet meer bijgehouden wordt.',
      'Zet het huidige jaar in je footer, of laat het automatisch aanpassen.');
    const re = /(?:©|\(c\)|copyright)[^0-9]{0,40}((?:19|20)\d{2})(?:\s*[-–—/]\s*((?:19|20)\d{2}))?/gi;
    let m, jaar = 0;
    while ((m = re.exec(P.tekst))) jaar = Math.max(jaar, +m[1], m[2] ? +m[2] : 0);
    if (!jaar) out.push(c('info', 'We vonden geen jaartal bij het ©-teken.'));
    else if (jaar >= ctx.jaar) out.push(c('goed', `© ${jaar}: up-to-date.`));
    else out.push(c('beter', `© ${jaar}: dat lijkt niet bijgewerkt.`));
  }
  {
    const g = GRATIS_DOMEIN.find(([d]) => host === d || host.endsWith('.' + d));
    const c = maak('domein', 'veiligheid', 3, 'Eigen domeinnaam',
      'Een eigen adres (zoals jouwzaak.be) wekt meer vertrouwen dan een gratis adres van een websitebouwer, en is makkelijker te onthouden.',
      'Registreer een eigen domeinnaam (bv. jouwzaak.be) en koppel die aan je site.');
    out.push(g ? c('slecht', `Je site draait op een gratis adres van ${g[1]} (${host}).`) : c('goed', `Eigen domein: ${host}.`));
  }

  /* ===== Klanten binnenhalen ===== */
  {
    const tel = hrefs.find((h) => /^tel:/i.test(h));
    const c = maak('telefoon', 'klanten', 3, 'Klikbaar telefoonnummer',
      'Op een gsm wil je met één tik kunnen bellen. Dat werkt alleen als je nummer een tel:-link is.',
      'Maak van je telefoonnummer een link (<a href="tel:+32...">) en zet het bovenaan en in de footer.');
    const re = /(?:\+|00)\s?\d{2}[\s.\-/]?(?:\(0\)[\s.\-/]?)?\d{1,4}(?:[\s.\-/]?\d{2,4}){2,4}|\b0\d{1,3}(?:[\s.\-/]?\d{2,3}){2,4}\b/g;
    let nummer = null, m;
    while ((m = re.exec(P.tekst))) {
      const voor = P.tekst.slice(Math.max(0, m.index - 30), m.index).toLowerCase();
      const cijfers = m[0].replace(/\D/g, '').length;
      if (cijfers < 9 || cijfers > 13 || /(btw|vat|tva|kbo|ondernemingsnr|ondernemingsnummer|be\s?$|iban|bic|rpr)/.test(voor)) continue;
      nummer = m[0].trim(); break;
    }
    if (tel) out.push(c('goed', `Klikbaar: ${kort(decodeURIComponentVeilig(tel.replace(/^tel:/i, '')), 30)}.`));
    else if (nummer) out.push(c('beter', `We zagen ${nummer}, maar je kunt er niet op klikken om te bellen.`));
    else out.push(c('beter', 'We vonden geen telefoonnummer op deze pagina.'));
  }
  {
    const mail = hrefs.find((h) => /^mailto:/i.test(h));
    const cf = /data-cfemail|\/cdn-cgi\/l\/email-protection/i.test(P.html);
    const tekstMail = (P.tekst.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).find((x) => !/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(x));
    const c = maak('email', 'klanten', 2, 'E-mailadres',
      'Sommige klanten mailen liever dan te bellen, zeker voor een offerte.',
      'Zet je e-mailadres als klikbare link (mailto:) in de footer of op je contactpagina.');
    if (mail) out.push(c('goed', `Klikbaar: ${kort(mail.replace(/^mailto:/i, '').split('?')[0], 50)}.`));
    else if (cf) out.push(c('goed', 'Er staat een (beveiligd) e-mailadres op de pagina.'));
    else if (tekstMail) out.push(c('beter', `We zagen ${tekstMail}, maar het is geen klikbare link.`));
    else out.push(c('beter', 'We vonden geen e-mailadres op deze pagina.'));
  }
  {
    const c = maak('formulier', 'klanten', 2, 'Contactformulier',
      'Met een formulier kan iemand je ook buiten de openingsuren iets vragen.',
      'Zet een kort formulier op je contactpagina of onderaan je pagina\'s: naam, e-mail of telefoon en een vraag. Hoe korter, hoe meer mensen het invullen.');
    const hier = vindFormulier(P.body, P.bron);
    const cp = ctx.contactPagina;
    const daar = cp && cp.html ? vindFormulier(cp.html, bronVanPagina(cp.html)) : null;
    if (hier) out.push(c('goed', hier === 'eigen' ? 'Er staat een formulier op deze pagina.' : `We zagen een formulier (${hier}).`));
    else if (daar) out.push(c('goed', `We zagen een formulier op je contactpagina (${kort(cp.pad, 40)}).`));
    else if (cp && cp.html) out.push(c('beter', `We zagen je contactpagina (${kort(cp.pad, 40)}), maar daar vonden we geen formulier.`));
    else if (cp) out.push(c('goed', `We zagen een link naar je contactpagina (${kort(cp.pad, 40)}). Het formulier daar konden we niet controleren.`));
    else out.push(c('beter', 'We vonden geen formulier en geen link naar een contactpagina.'));
  }
  {
    const bp = ctx.boekPagina;
    const naam = zoek(BOEKING, P.bron) || (hrefs.some((h) => /\/book-online\b/i.test(h)) ? 'Wix Bookings' : null);
    const daar = !naam && bp && bp.html ? zoek(BOEKING, bronVanPagina(bp.html)) : null;
    const knop = /\b(afspraak maken|maak een afspraak|maak je afspraak|boek nu|boek online|online boeken|online afspraak|reserveer|reserveren|plan een afspraak|book now|book online|réserver|prendre rendez-vous)\b/i.test(P.tekst);
    const c = maak('boeken', 'klanten', 2, 'Online afspraak maken',
      'Werk je met afspraken of reservaties? Dan boeken klanten liefst meteen online, ook \'s avonds.',
      'Koppel een online agenda aan je site, zodat klanten zelf een moment kiezen en automatisch een bevestiging krijgen.');
    if (naam) out.push(c('goed', `We herkenden een online agenda (${naam}).`));
    else if (daar) out.push(c('goed', `We herkenden een online agenda (${daar}) op ${kort(bp.pad, 40)}.`));
    else if (knop || bp) out.push(c('beter', 'We zagen een knop of pagina om te boeken, maar herkenden geen online agenda.'));
    else out.push(c('beter', 'We vonden geen manier om online een afspraak te maken.'));
  }
  {
    const wa = hrefs.some((h) => /(wa\.me\/|api\.whatsapp\.com\/send|web\.whatsapp\.com\/send|^whatsapp:|wa\.link\/)/i.test(h))
      || !!zoek([['wa.me/', 'x'], ['api.whatsapp.com/send', 'x'], ['wa.link/', 'x'], ['getbutton.io', 'x'], ['joinchat', 'x', 'k']], P.bron);
    const c = maak('whatsapp', 'klanten', 1, 'WhatsApp',
      'Veel klanten sturen liever even een berichtje dan te bellen.',
      'Voeg een WhatsApp-knop toe met een link van de vorm wa.me/32 gevolgd door je gsm-nummer zonder de eerste 0.');
    out.push(wa ? c('goed', 'Er staat een WhatsApp-link op de pagina.') : c('beter', 'We vonden geen WhatsApp-link.'));
  }
  {
    const naam = zoek(CHAT, P.bron);
    const c = maak('chat', 'klanten', 1, 'Chat op je site',
      'Met een chat (of chatbot) kan een bezoeker meteen iets vragen terwijl hij op je site is.',
      'Zet een chat op je site. Een chatbot kan veelgestelde vragen beantwoorden, ook buiten de openingsuren.');
    out.push(naam ? c('goed', `We herkenden een chat (${naam}).`) : c('beter', 'We vonden geen chat op de pagina.'));
  }

  return { checks: out, weinigTekst: P.tekst.length < 250, jsSite: P.jsSite, tekstLengte: P.tekst.length };
}

function decodeURIComponentVeilig(s) { try { return decodeURIComponent(s); } catch { return s; } }

/* ------------------------------------------------------------------ score */

const PUNT = { goed: 1, beter: 0.5, slecht: 0 };

export function score(checks) {
  const cats = CATEGORIEEN.map((c) => {
    const lijst = checks.filter((x) => x.cat === c.id && x.status in PUNT);
    const w = lijst.reduce((s, x) => s + x.gewicht, 0);
    const p = lijst.reduce((s, x) => s + x.gewicht * PUNT[x.status], 0);
    const tel = (st) => checks.filter((x) => x.cat === c.id && x.status === st).length;
    return { id: c.id, naam: c.naam, gewicht: c.gewicht, score: w ? Math.round((p / w) * 100) : null, goed: tel('goed'), beter: tel('beter'), slecht: tel('slecht') };
  });
  const geldig = cats.filter((c) => c.score !== null);
  const tw = geldig.reduce((s, c) => s + c.gewicht, 0);
  const totaal = tw ? Math.round(geldig.reduce((s, c) => s + c.score * c.gewicht, 0) / tw) : 0;
  const label = totaal >= 80 ? 'Sterk: je site staat er goed voor.'
    : totaal >= 60 ? 'Goed op weg, maar je laat punten liggen.'
      : totaal >= 40 ? 'Hier ligt duidelijk winst.'
        : 'Hier is veel te winnen.';
  // verbeterplan: eerst de rode punten, dan de oranje, telkens de zwaarste eerst
  const plan = checks.filter((x) => x.status === 'slecht' || x.status === 'beter')
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'slecht' ? -1 : 1) || b.gewicht - a.gewicht)
    .map((x) => x.id);
  return { totaal, label, categorieen: cats, plan };
}
