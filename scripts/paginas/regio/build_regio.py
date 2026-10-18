# Bouwt de regiopagina Limburg en de stadspagina's ("De kaart"). Alleen NL; de taalknop gaat voor EN en FR
# naar /en/Websites en /fr/Websites (data-lang-fallback op <body>), en de hreflang noemt alleen nl en x-default.
#   limburg.json            -> website-laten-maken-limburg.html
#   steden/<stad>.json      -> website-laten-maken-<stad>.html   (alleen met "klaar": true)
# De <head> (laadscript, fonts-preload, #business-blok) komt uit het bestaande bestand, of bij een nieuwe pagina
# uit eml-ai-team.html. Model: scripts/paginas/websites/build_ws.py en eml-ai-team/build_eml.py.
# Gebruik (vanuit deze map of de repo):
#   py build_regio.py                 alles (regio + alle steden met "klaar": true)
#   py build_regio.py limburg hasselt alleen die pagina's (de links tussen de pagina's komen altijd uit alle json's)
# Daarna: py overlap.py   (woorden en overlap meten; moet "OK" geven)
import io, re, json, html, sys, os, glob, subprocess

R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace(os.sep, '/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
V_CSS, V_JS = '20261019a', '20261019a'
V_SKIN = '20260925a'          # home-redesign.css
V_FX = '20261016a'
TEMPLATE = 'eml-ai-team.html'   # bron van de <head> voor een pagina die nog niet bestaat
SITE = 'https://emlaunchpad.com/'
NOS = '<noscript><style>#loader{display:none!important}</style></noscript>\n'
# lichtlaag voor data-tone="blauw" (zelfde verloop als EML AI Team)
SKY = [{"p": 0, "ax": 74, "ay": 34, "bx": 10, "by": 96, "ao": 0.9, "bo": 0.4}, {"p": 0.18, "ax": 24, "ay": 40, "bx": 82, "by": 70, "ao": 0.6, "bo": 0.7},
       {"p": 0.4, "ax": 78, "ay": 58, "bx": 18, "by": 30, "ao": 0.7, "bo": 0.6}, {"p": 0.62, "ax": 30, "ay": 46, "bx": 72, "by": 60, "ao": 0.8, "bo": 0.6},
       {"p": 1, "ax": 46, "ay": 36, "bx": 56, "by": 42, "ao": 1, "bo": 1}]

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def load(p):
    return json.load(io.open(p, encoding='utf-8'))

def url_of(slug):
    return SITE + 'website-laten-maken-' + slug

def schema(L, C):
    import body as B
    m = L['meta']
    base = url_of(L['slug'])
    crumbs = [('Home', SITE), ('Websites', SITE + 'Websites')]
    if L['type'] == 'stad':
        crumbs.append((C['regio']['naam'], url_of(C['regio']['slug'])))
    crumbs.append((L['crumb'], base))
    return [
        {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(crumbs)]},
        {'@type': 'Service', '@id': base + '#service', 'name': m['service'], 'serviceType': 'Web design', 'url': base,
         'description': m['desc'], 'provider': {'@id': SITE + '#business'}, 'areaServed': m['areaServed'],
         'offers': {'@type': 'Offer', 'name': 'Online groeien', 'url': base + '#prijs', 'price': '150', 'priceCurrency': 'EUR',
                    'eligibleRegion': {'@type': 'Country', 'name': 'BE'},
                    'priceSpecification': {'@type': 'UnitPriceSpecification', 'price': '150', 'priceCurrency': 'EUR', 'unitCode': 'MON',
                                           'valueAddedTaxIncluded': False}}},
        {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': B.plain(q['a'])}}
                                            for q in L['faq']['items']]}]

def head(L, C, s):
    a = s.index('<div id="nav-mount"></div>') + len('<div id="nav-mount"></div>\n')
    hd = s[:a]
    m = L['meta']
    assert len(m['title']) <= 60, 'title te lang (%d): %s' % (len(m['title']), m['title'])
    assert len(m['desc']) <= 155, 'description te lang (%d): %s' % (len(m['desc']), m['desc'])
    hd, n = re.subn(r'<title>[^<]*</title>', '<title>%s</title>' % esc(m['title']), hd); assert n == 1
    for at in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        hd, n = re.subn(r'<meta content="[^"]*" %s/>' % re.escape(at), '<meta content="%s" %s/>' % (attr(m['desc']), at), hd); assert n == 1, at
    for at in ('property="og:title"', 'name="twitter:title"'):
        hd, n = re.subn(r'<meta content="[^"]*" %s/>' % re.escape(at), '<meta content="%s" %s/>' % (attr(m['ogtitle']), at), hd); assert n == 1, at
    own = url_of(L['slug'])
    # canonical + hreflang: alleen NL (en x-default); EN en FR bestaan niet, de taalknop valt terug op Websites
    hd, n = re.subn(r'<link href="[^"]*" rel="canonical"/>(<link href="[^"]*" hreflang="[^"]*" rel="alternate"/>)*',
                    '<link href="%s" rel="canonical"/><link href="%s" hreflang="x-default" rel="alternate"/><link href="%s" hreflang="nl" rel="alternate"/>' % (own, own, own), hd)
    assert n == 1, 'canonical'
    hd, n = re.subn(r'<meta content="[^"]*" property="og:url"/>', '<meta content="%s" property="og:url"/>' % own, hd); assert n == 1
    assert 'property="og:locale"' in hd and 'nl_BE' in hd, 'het startbestand moet NL zijn'
    # stijlbladen: home.css + v2-skin + regio.css (idempotent)
    hd = re.sub(r'<link href="(pages|websites|website|home-redesign|eml-ai-team|regio)\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n', '', hd)
    hc = re.search(r'<link href="home\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n', hd)
    hd = hd[:hc.end()] + ('<link href="home-redesign.css?v=%s" rel="stylesheet"/>\n<link href="regio.css?v=%s" rel="stylesheet"/>\n' % (V_SKIN, V_CSS)) + hd[hc.end():]
    assert hd.count('home-redesign.css') == 1 and hd.count('regio.css') == 1
    hd = hd.replace('<link href="https://images.unsplash.com" rel="preconnect"/>\n', '')
    # laadscherm blijft, met precies één noscript-regel
    hd = hd.replace(NOS, '').replace('</head>', NOS + '</head>')
    assert 'id="loader"' in hd and hd.count(NOS) == 1, 'laadscherm ontbreekt in het startbestand'
    body_tag = '<body data-lang-fallback="Websites.html" data-page="regio" data-skin="v2" data-tone="blauw">'
    hd, n = re.subn(r'<body[^>]*>', body_tag, hd); assert n == 1
    hd = re.sub(r'\n<div aria-hidden="true" class="sky"[^>]*>.*?</div>', '', hd)
    keys = attr(json.dumps(SKY, separators=(',', ':')))
    hd = hd.replace(body_tag, body_tag + '\n<div aria-hidden="true" class="sky" data-keys="%s" data-sky=""><i class="sky-a"></i><i class="sky-b"></i></div>' % keys)
    # structured data: #business blijft, de rest komt uit de json
    mm = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', hd, re.S)
    data = json.loads(mm.group(2))
    g = [x for x in data['@graph'] if x.get('@type') not in ('Service', 'FAQPage', 'BreadcrumbList')]
    assert len(g) == 1 and g[0].get('@id') == SITE + '#business'
    data['@graph'] = g + schema(L, C)
    return hd[:mm.start(2)] + json.dumps(data, ensure_ascii=False) + hd[mm.end(2):]

def tail(footer):
    return f'''{footer}
<script src="i18n.js?v=20261019a"></script>
<script src="site.js?v=20261019a"></script>
<script src="fx.js?v={V_FX}"></script>
<script src="regio.js?v={V_JS}"></script>
</body>
</html>
'''

def check_text(L, path):
    """huisregels op de zichtbare tekst van de json"""
    raw = json.dumps(L, ensure_ascii=False)
    # zoeklijst (opgebouwd uit stukjes, zodat dit script zelf niet op de zoeklijst staat)
    for bad in (chr(0x2014), chr(0x2013), 'Go' + 'HighLevel', 'G' + 'HL', 'n' + '8n', 'lokale ' + 'bedrijven', 'Digitale ' + 'groei'):
        assert bad not in raw, '%s: verboden tekst %r' % (path, bad)

def context(only=None):
    C = {'klanten': load(os.path.join(HERE, 'klanten.json'))}
    regio = load(os.path.join(HERE, 'limburg.json'))
    C['regio'] = {'slug': regio['slug'], 'naam': regio['naam']}
    steden = []
    for p in sorted(glob.glob(os.path.join(HERE, 'steden', '*.json'))):
        S = load(p)
        if S.get('klaar', True):
            steden.append((p, S))
    steden.sort(key=lambda x: (x[1].get('volgorde', 99), x[1]['naam']))
    C['steden'] = [{'slug': S['slug'], 'naam': S['naam'], 'kort': S['kort'], 'plaats': S['plaats']} for _, S in steden]
    # welke stadspagina hoort bij een plaats (voor de links in de streken van de regiopagina)
    C['stad_van'] = {x['plaats']: x for x in C['steden']}
    for x in list(C['steden']):
        for extra in next(S for _, S in steden if S['slug'] == x['slug']).get('ook_plaatsen', []):
            C['stad_van'].setdefault(extra, x)
    C['plaatsnamen'] = load(os.path.join(HERE, 'plaatsnamen.json'))
    return C, [(os.path.join(HERE, 'limburg.json'), regio)] + steden

def build_one(path, L, C):
    import body as B
    check_text(L, path)
    C = dict(C, slug=L['slug'])
    out_rel = 'website-laten-maken-%s.html' % L['slug']
    src = R + out_rel if os.path.exists(R + out_rel) else R + TEMPLATE
    s = io.open(src, encoding='utf-8').read()
    fm = re.search(r'<div id="footer-mount">.*?</div>(?=\s*<script)', s, re.S)
    footer = fm.group(0) if fm else '<div id="footer-mount"></div>'
    out = head(L, C, s) + B.body(L, C) + tail(footer)
    io.open(R + out_rel, 'w', encoding='utf-8', newline='').write(out)
    return out_rel

def crawl_fallback(files):
    """de linklijst zonder JavaScript (#footer-mount) alleen voor onze eigen bestanden, met scripts/crawl-fallback.mjs"""
    js = ("import(process.argv[1]).then(async m=>{const fs=await import('node:fs');for(const f of process.argv.slice(2)){"
          "const h=fs.readFileSync(f,'utf8');const n=m.applyFallback(h,f.split('/').pop());if(n!==h)fs.writeFileSync(f,n);}})")
    url = 'file:///' + (R + 'scripts/crawl-fallback.mjs').replace(' ', '%20')
    try:
        subprocess.run(['node', '-e', js, url] + [R + f for f in files], check=True)
    except Exception as e:
        print('  (crawl-fallback overgeslagen: %s; draai later node scripts/crawl-fallback.mjs)' % e)

if __name__ == '__main__':
    sys.path.insert(0, HERE)
    want = set(sys.argv[1:])
    C, pages = context()
    done = []
    for p, L in pages:
        if want and L['slug'] not in want:
            continue
        done.append(build_one(p, L, C))
        print(done[-1], 'ok')
    if done:
        crawl_fallback(done)
