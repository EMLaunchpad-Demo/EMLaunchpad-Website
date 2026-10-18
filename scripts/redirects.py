# Maakt _redirects: permanente (301) omleidingen naar de nette URL's.
#
# Drie soorten regels, in deze volgorde:
#   1. Afgeleid uit de bestandsnamen (komen bij elke run terug):
#      - /Diensten.html en /Diensten/      -> /Diensten
#      - /emtimes/index.html en /emtimes   -> /emtimes/
#      - kleine letters: /diensten, /diensten.html, /diensten/, /ai%20chatbots, ...
#      - koppeltekens in plaats van spaties: /AI-Chatbots, /ai-chatbots, /over-ons, /gratis-demo, ...
#      Dezelfde varianten onder /en/ en /fr/.
#   2. De oude URL's van de vorige site (vaste lijst OUD hieronder, bron:
#      onderzoek-seo-2026-10/01-bing-indexatie.md 2.1 en 06-MASTERPLAN.md B1).
#   3. De oude map /lokaal/ (fase 2, taak 2.5), uit scripts/stadspaginas.json. Zolang daar
#      "actief": false staat, blijven de pagina's in lokaal/ gewoon bereikbaar. Met true:
#      - de 12 Limburgse /lokaal/ai-<stad> naar de stadspagina als die bestaat, anders naar
#        de regiopagina /website-laten-maken-limburg;
#      - de 12 Antwerpse naar /Websites;
#      - /lokaal/ (en /lokaal, /lokaal/index.html) naar de regiopagina, plus de splat /lokaal/*.
#      Per oude pagina drie bronnen: /lokaal/ai-<stad>, met .html en met slash. De map lokaal/
#      telt dan niet meer mee voor de afgeleide regels, dus de bestanden mogen weg.
#   4. De splats (/post/*, ...), want Cloudflare wil statische regels voor dynamische.
#
# Cloudflare matcht hoofdlettergevoelig (de regel /diensten raakt /Diensten niet), stuurt
# /Diensten.html zelf alleen met een tijdelijke 307 door, en Bing vraagt een 301 voor
# blijvende adressen. Limieten: 2.000 statische en 100 dynamische regels.
# Het script controleert: elke bestemming bestaat, geen bron is ook een bestemming
# (dus geen lussen en geen kettingen), geen dubbele bronnen, binnen de limieten.
#
# Draai opnieuw na het toevoegen van pagina's:
#   py scripts/redirects.py
import os, sys, json, urllib.parse

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SKIP_DIRS = {'.git', '.github', '.claude', 'node_modules', 'scripts', 'assets', 'demo'}
SKIP_FILES = {'404.html'}
MAX_STATIC, MAX_DYNAMIC = 2000, 100

# Oude URL's van de vorige site (Bing kent ze nog, allemaal 404 sinds juni 2026).
# Bestemmingen volgens rapport 01 2.1, bevestigd door Martijn als B1 (07-BESLISSINGEN.md).
OUD = [
    # diensten
    ('/diensten', '/Diensten'),
    ('/website', '/Websites'),
    ('/ai-voice-assistent', '/AI Voice Agents'),
    ('/conversation-ai', '/AI Chatbots'),
    ('/ai-chatbot-belgie', '/AI Chatbots'),
    ('/automatisaties', '/AI-Automatisering'),
    # over ons en contact
    ('/over-ons', '/Over ons'),
    ('/werkwijze', '/Over ons'),
    ('/contact-us', '/Contact'),
    ('/contact.html', '/Contact'),
    # afspraak en demo
    ('/afspraak-boeken', '/Gratis Demo'),
    ('/booking-page', '/Gratis Demo'),
    ('/start-nu', '/Gratis Demo'),
    ('/demo', '/Gratis Demo'),  # alleen exact /demo; /demo/* zijn de klantdemo's
    # blog
    ('/blog', '/emtimes/'),
    ('/blogs', '/emtimes/'),
    ('/blogs-2057', '/emtimes/'),
    ('/post', '/emtimes/'),
    ('/post/hoe-ai-jobs-verandert-en-nieuwe-kansen-creert', '/emtimes/'),
    ('/post/marketingtips', '/emtimes/'),
    ('/post/hoe-ai-de-wereld-zal-veranderen', '/emtimes/'),
    ('/hoe-ai-de-wereld-zal-veranderen', '/emtimes/'),
    # overige
    ('/privacybeleid', '/privacy'),
    ('/home', '/'),
    ('/main', '/'),
]
# Dynamische regels (splat): de drie bekende /post/-artikels en de 16 URL's in de map
# /hoe-ai-de-wereld-zal-veranderen/ gaan allemaal naar het blogoverzicht.
OUD_SPLAT = [
    ('/post/*', '/emtimes/'),
    ('/hoe-ai-de-wereld-zal-veranderen/*', '/emtimes/'),
]


# Oude map /lokaal/ (fase 2): de vaste lijst staat in stadspaginas.json, zodat de coördinator
# de stadspagina's kan aanvullen zonder dit script aan te passen.
LOKAAL_JSON = os.path.join(ROOT, 'scripts', 'stadspaginas.json')
LOKAAL_DIR = os.path.join(ROOT, 'lokaal')


def lokaal_regels(fouten, meldingen):
    """Geeft (actief, statische regels, dynamische regels) voor de oude map /lokaal/."""
    cfg = json.load(open(LOKAAL_JSON, encoding='utf-8'))
    bestanden = sorted(f for f in os.listdir(LOKAAL_DIR) if f.endswith('.html')) if os.path.isdir(LOKAAL_DIR) else []
    if not cfg.get('actief'):
        if not any(f.startswith('ai-') for f in bestanden):
            fouten.append('lokaal/ is leeg of weg, maar de 301\'s staan uit: zet "actief": true in scripts/stadspaginas.json')
        meldingen.append('lokaal: 301\'s staan nog uit ("actief": false in scripts/stadspaginas.json), %d pagina\'s blijven bereikbaar' % len(bestanden))
        return False, [], []
    regio = cfg['regiopagina']
    if not os.path.isfile(target_file(regio)):
        fouten.append('lokaal: de regiopagina %s bestaat niet; zet "actief" pas op true als ze er is' % regio)
        return False, [], []
    doelen = {}
    for stad, stadspagina in cfg['limburg'].items():
        if stadspagina and os.path.isfile(target_file(stadspagina)):
            doelen[stad] = stadspagina
        else:
            if stadspagina:
                meldingen.append('lokaal: %s bestaat (nog) niet, /lokaal/ai-%s gaat naar %s' % (stadspagina, stad, regio))
            doelen[stad] = regio
    for stad in cfg['antwerpen']['steden']:
        if stad in doelen:
            fouten.append('lokaal: %s staat zowel bij limburg als bij antwerpen' % stad)
        doelen[stad] = cfg['antwerpen']['doel']
    static = [('/lokaal/', regio), ('/lokaal', regio), ('/lokaal/index.html', regio)]
    for stad, doel in doelen.items():
        bron = '/lokaal/ai-' + stad
        static += [(bron, doel), (bron + '.html', doel), (bron + '/', doel)]
    # elk bestand dat nog in lokaal/ staat, moet een regel hebben
    for f in bestanden:
        if f != 'index.html' and f[:-5][3:] not in doelen:
            fouten.append('lokaal: geen bestemming voor lokaal/%s in scripts/stadspaginas.json' % f)
    return True, static, [('/lokaal/*', regio)]


def enc(path):
    return urllib.parse.quote(path, safe="/-_.~'*")


def variants(clean):
    """Alle varianten van een nette pagina-URL (zonder .html): kleine letters en koppeltekens,
    telkens ook met .html en met slash op het einde."""
    base, name = clean.rsplit('/', 1)
    stems = {name.lower(), name.replace(' ', '-'), name.replace(' ', '-').lower()} - {name}
    out = []
    for s in sorted(stems):
        v = base + '/' + s
        out += [v, v + '.html', v + '/']
    return out


def target_file(dest):
    """Bestand dat bij een bestemming hoort (voor de controle dat ze bestaat)."""
    p = urllib.parse.unquote(dest)
    rel = p + 'index.html' if p.endswith('/') else p + '.html'
    return os.path.join(ROOT, rel.lstrip('/').replace('/', os.sep))


fouten, meldingen = [], []
lokaal_actief, LOKAAL, LOKAAL_SPLAT = lokaal_regels(fouten, meldingen)

afgeleid, extra = [], []
for d, dirs, files in os.walk(ROOT):
    dirs[:] = sorted(x for x in dirs if x not in SKIP_DIRS and not (lokaal_actief and d == ROOT and x == 'lokaal'))
    rel = os.path.relpath(d, ROOT).replace(os.sep, '/')
    base = '/' if rel == '.' else '/' + rel + '/'
    for f in sorted(files):
        if not f.endswith('.html') or (base == '/' and f in SKIP_FILES):
            continue
        if f == 'index.html':
            afgeleid.append((base + 'index.html', base))
            if base != '/':
                afgeleid.append((base.rstrip('/'), base))
        else:
            clean = base + f[:-5]
            afgeleid.append((clean + '.html', clean))
            afgeleid.append((clean + '/', clean))
            extra += [(v, clean) for v in variants(clean)]

# Samenvoegen: afgeleide regels eerst, dan varianten, dan de oude URL's; dubbele bronnen
# (bv. /diensten en /over-ons komen ook uit de varianten) tellen één keer.
static, seen = [], set()
for a, b in afgeleid + extra + OUD + LOKAAL:
    if a in seen:
        continue
    seen.add(a)
    static.append((a, b))
dynamic = list(OUD_SPLAT) + LOKAAL_SPLAT

# Controles
bronnen = {a for a, _ in static} | {a for a, _ in dynamic}
for a, b in static + dynamic:
    if a == b:
        fouten.append('bron en bestemming gelijk: %s' % a)
    if b in bronnen:
        fouten.append('bestemming %s is zelf een bron (lus of ketting): %s -> %s' % (b, a, b))
    if not os.path.isfile(target_file(b)):
        fouten.append('bestemming bestaat niet: %s -> %s' % (a, b))
if len(static) > MAX_STATIC:
    fouten.append('te veel statische regels: %d (max %d)' % (len(static), MAX_STATIC))
if len(dynamic) > MAX_DYNAMIC:
    fouten.append('te veel dynamische regels: %d (max %d)' % (len(dynamic), MAX_DYNAMIC))
for m in meldingen:
    print('NB: ' + m)
if fouten:
    print('\n'.join('FOUT: ' + f for f in fouten))
    sys.exit(1)

out = ["# Gemaakt door scripts/redirects.py: nette URL's met een permanente omleiding (301).",
       '# Niet met de hand bewerken: pas scripts/redirects.py aan en draai het opnieuw.']
out += ['%s %s 301' % (enc(a), enc(b)) for a, b in static]
out += ['# Oude blog-URL\'s van de vorige site%s (dynamische regels komen na de statische).' % (
    ' en de oude map /lokaal/' if lokaal_actief else '')]
out += ['%s %s 301' % (enc(a), enc(b)) for a, b in dynamic]
open(os.path.join(ROOT, '_redirects'), 'w', encoding='utf-8', newline='\n').write('\n'.join(out) + '\n')
n_var = len({a for a, _ in extra} - {a for a, _ in afgeleid})
n_lok = len(LOKAAL) + len(LOKAAL_SPLAT)
n_oud = len(static) - len(afgeleid) - n_var + len(dynamic) - n_lok
print('%d regels (%d statisch, %d dynamisch): %d afgeleid, %d varianten, %d oude URL\'s, %d lokaal' % (
    len(static) + len(dynamic), len(static), len(dynamic), len(afgeleid), n_var, n_oud, n_lok))
