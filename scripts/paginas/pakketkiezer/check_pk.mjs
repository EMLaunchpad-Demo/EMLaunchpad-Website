// Rekent alle antwoordcombinaties van de pakketkiezer door (het vak telt niet mee) en
// controleert de regels. Draai na elke wijziging aan de advieslogica in pakketkiezer.js:
//   node scripts/paginas/pakketkiezer/check_pk.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const PK = createRequire(import.meta.url)(path.join(ROOT, 'pakketkiezer.js'));

const BOEK = ['bel', 'bericht', 'online', 'binnen'];
const OPR = ['dag', 'week', 'zelden', 'onbekend'];
const BER = ['avond', 'werk', 'paar', 'zelden'];
const INB = ['reviews', 'facturen', 'herinneren', 'kanalen'];
const DOEL = ['klanten', 'eenplek', 'intern', 'team', 'horen'];
// maandprijzen op de schaal (excl. btw); de €750 eenmalig van de receptioniste staat er los van
const PRICES = new Set([0, 150, 200, 300, 350]);

const fails = [];
const tally = {};
let n = 0;
const fail = (a, msg) => { if (fails.length < 20) fails.push(msg + '  ' + JSON.stringify(a)); };

for (const boek of BOEK) for (const opr of OPR) for (const ber of BER) for (let m = 0; m < 16; m++) for (const doel of DOEL) {
  const inb = INB.filter((_, i) => m & (1 << i));
  const a = { vak: 'kapper', boek, opr, ber, inb: inb.length ? inb : ['niets'], doel };
  const r = PK.advies(a);
  n++;
  const key = r.outcome + ' ' + (r.outcome === 'A' ? 'AI Consulting' : r.outcome === 'E' ? 'EML AI Team' : '€' + r.price);
  tally[key] = (tally[key] || 0) + 1;
  if (!PRICES.has(r.price)) fail(a, 'prijs ' + r.price);
  if ((r.C === 'ja' || r.R === 'ja') && !r.DG) fail(a, 'uitbreiding zonder Online groeien');
  if (r.CONS !== (doel === 'intern')) fail(a, 'AI Consulting zonder doel intern');
  if (r.EML !== (doel === 'team')) fail(a, 'EML AI Team zonder doel team');
  if (r.CONS && r.EML) fail(a, 'AI Consulting en EML AI Team tegelijk');
  if ((r.outcome === 'E' || r.outcome === 'F') !== r.EML) fail(a, 'uitkomst E/F klopt niet met EML');
  if (r.outcome === 'E' && r.price !== 0) fail(a, 'E niet €0 op de schaal');
  if (r.outcome === 'F' && !r.DG) fail(a, 'F zonder Online groeien');
  if (r.price === 350 && !(opr === 'dag' && r.C === 'ja')) fail(a, '€350 zonder dagelijkse oproepen en chatbot');
  if (r.price === 300 && !(opr === 'dag' && r.C !== 'ja')) fail(a, '€300 zonder dagelijkse oproepen');
  if (r.k.r !== (r.price >= 300)) fail(a, 'receptioniste (en dus €750 eenmalig) klopt niet met de prijs');
  if (r.price !== PK.prijs(r.k)) fail(a, 'prijs advies ≠ prijs(k)');
  if (r.alt.length && r.alt.some((x) => x.p === r.price)) fail(a, 'twijfel telt mee in de prijs');
  if (r.R === 'twijfel' && !(opr === 'week' && boek === 'bel')) fail(a, 'twijfel receptioniste zonder week + bellen');
  if (r.C === 'twijfel' && !(ber === 'werk' && boek !== 'bericht')) fail(a, 'twijfel chatbot verkeerd');
  if (r.outcome === 'D' && r.price !== 0) fail(a, 'D niet €0');
  if (r.talk.length > 3) fail(a, 'te veel gesprekspunten');
  if (r.why.length > 4) fail(a, 'te veel redenen');
  if ((r.outcome === 'B' || r.outcome === 'C') !== !!r.proof) fail(a, 'bewijsregel klopt niet met de uitkomst');
}

console.log(n + ' combinaties');
Object.keys(tally).sort().forEach((k) => console.log('  ' + k.padEnd(18) + String(tally[k]).padStart(5) + '  (' + (100 * tally[k] / n).toFixed(1) + '%)'));
if (!tally['D €0']) fails.push('uitkomst D (nu niets) komt nooit voor');
if (!tally['E EML AI Team']) fails.push('uitkomst E (EML AI Team) komt nooit voor');
if (!tally['C €350']) fails.push('uitkomst C €350 komt nooit voor');
if (fails.length) { console.log('\nFOUTEN:\n' + fails.join('\n')); process.exit(1); }
console.log('\nAlle regels kloppen.');
