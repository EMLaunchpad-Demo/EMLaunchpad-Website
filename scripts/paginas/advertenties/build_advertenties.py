# Bouwt "advertenties.html" (+ en/, fr/): de dienstpagina advertentiebeheer / Google Ads ("Het spoor").
# v2-skin met "blauw uur". De inhoud komt uit <taal>.json + body.py (sjabloon).
# De <head> (laadscript, fonts-preload, #business-blok, favicons) komt uit het bestaande bestand. Bestaat de pagina
# nog niet, dan start het script van Contact.html in dezelfde taal en zet het canonical, hreflang en og:url op deze
# pagina. Daarna zet het title, description, og/twitter, de stijlbladen, de body-tag en de JSON-LD
# (BreadcrumbList, Service met prijs, FAQPage) zelf.
# Let op: geen bestandsnamen of klassen met "ad", "ads" of "advert" (adblockers): daarom spoor.css en spoor.js.
# Gebruik: py build_advertenties.py nl [en fr]
import io, re, json, html, sys, os

# de hoofdmap van de site (drie mappen hoger dan dit script)
R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace(os.sep, '/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
V_CSS, V_JS = '20261106a', '20261106a'      # spoor.css, spoor.js
V_SKIN = '20260925a'                        # home-redesign.css
V_FX = '20261106a'                          # fx.js (lichtvelden van het blauw uur)
FILE = 'advertenties.html'
SLUG = 'advertenties'
SEED = 'Contact.html'                       # startbestand als de pagina nog niet bestaat
SITE = 'https://emlaunchpad.com/'
PRICE = '200'                               # Ebert 02/03 (GOEDGEKEURD): advertentiebeheer €200 per maand, excl. btw

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def plain(s):
    """[label](href) -> label: de FAQ-tekst in de structured data is letterlijk de zichtbare tekst."""
    return re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', s)

def seed(lang):
    """Startbestand voor een nieuwe pagina: Contact.html van dezelfde taal, met de URL's van deze pagina."""
    path = ('' if lang == 'nl' else lang + '/') + SEED
    s = io.open(R + path, encoding='utf-8').read()
    for l in ('', 'en/', 'fr/'):
        s = s.replace('"%s%sContact"' % (SITE, l), '"%s%s%s"' % (SITE, l, SLUG))
    return s

def schema(L, lang):
    home = SITE + ('' if lang == 'nl' else lang + '/')
    base = home + SLUG
    m, h = L['meta'], L['hero']
    return [
        {'@type': 'BreadcrumbList', '@id': base + '#breadcrumb', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': h['crumb_home'], 'item': home},
            {'@type': 'ListItem', 'position': 2, 'name': h['crumb_parent'], 'item': home + 'Diensten'},
            {'@type': 'ListItem', 'position': 3, 'name': h['crumb'], 'item': base}]},
        {'@type': 'Service', '@id': base + '#service', 'name': m['service'], 'serviceType': m['service_type'], 'url': base,
         'description': m['desc'], 'provider': {'@id': SITE + '#business'},
         'offers': {'@type': 'Offer', 'name': m['offer'], 'price': PRICE, 'priceCurrency': 'EUR', 'url': base,
                    'eligibleRegion': {'@type': 'Country', 'name': 'BE'},
                    'priceSpecification': {'@type': 'UnitPriceSpecification', 'price': PRICE, 'priceCurrency': 'EUR', 'unitCode': 'MON',
                                           'name': m['offer_unit'], 'valueAddedTaxIncluded': False}},
         'areaServed': {'@type': 'Country', 'name': 'Belgium'}},
        {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': plain(q['a'])}}
                                            for q in L['faq']['items']]}]

def head(L, lang, pre, s):
    a = s.index('<div id="nav-mount"></div>') + len('<div id="nav-mount"></div>\n')
    hd = s[:a]
    m = L['meta']
    hd, n = re.subn(r'<title>[^<]*</title>', '<title>%s</title>' % esc(m['title']), hd); assert n == 1
    for at in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        hd, n = re.subn(r'<meta content="[^"]*" %s/>' % re.escape(at), '<meta content="%s" %s/>' % (attr(m['desc']), at), hd); assert n == 1, at
    for at in ('property="og:title"', 'name="twitter:title"'):
        hd, n = re.subn(r'<meta content="[^"]*" %s/>' % re.escape(at), '<meta content="%s" %s/>' % (attr(m['ogtitle']), at), hd); assert n == 1, at
    # canonical, hreflang en og:url horen bij deze pagina
    own = SITE + ('' if lang == 'nl' else lang + '/') + SLUG
    assert ('href="%s" rel="canonical"' % own) in hd, 'canonical ontbreekt: ' + own
    assert ('content="%s" property="og:url"' % own) in hd, 'og:url ontbreekt: ' + own
    for l, u in (('x-default', SITE + SLUG), ('nl', SITE + SLUG), ('en', SITE + 'en/' + SLUG), ('fr', SITE + 'fr/' + SLUG)):
        assert ('href="%s" hreflang="%s" rel="alternate"' % (u, l)) in hd, 'hreflang ontbreekt: ' + l
    assert 'Contact"' not in re.sub(r'<script type="application/ld\+json">.*?</script>', '', hd, flags=re.S), 'nog een Contact-URL in de head'
    # stijlbladen: idempotent, eerst alle eigen bladen weg, dan precies één keer home-redesign.css + spoor.css na home.css
    hd = re.sub(r'<link href="%s(pages|home-redesign|contact|spoor)\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), '', hd)
    hc = re.search(r'<link href="%shome\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), hd)
    hd = hd[:hc.end()] + ('<link href="%shome-redesign.css?v=%s" rel="stylesheet"/>\n<link href="%sspoor.css?v=%s" rel="stylesheet"/>\n'
                          % (pre, V_SKIN, pre, V_CSS)) + hd[hc.end():]
    assert hd.count('home-redesign.css') == 1 and hd.count('spoor.css') == 1
    # geen vooraf geladen werkplekfoto (die hoort bij Contact)
    hd = re.sub(r'<link as="image"[^>]*hero-werkplek[^>]*/>\n', '', hd)
    # het laadscherm blijft; de <noscript>-regel hoort erbij (precies één keer)
    NOS = '<noscript><style>#loader{display:none!important}</style></noscript>\n'
    hd = hd.replace(NOS, '').replace('</head>', NOS + '</head>')
    assert 'id="loader"' in hd and hd.count(NOS) == 1, 'laadscherm ontbreekt in het startbestand'
    # body: v2-skin + blauw uur; data-page="diensten" zet Diensten actief in het menu
    tone = L.get('tone')
    body_tag = '<body data-page="diensten" data-skin="v2"%s>' % (' data-tone="%s"' % tone if tone else '')
    hd, n = re.subn(r'<body[^>]*>', body_tag, hd); assert n == 1
    # lichtlaag direct na <body> (enkel bij toon blauw)
    hd = re.sub(r'\n<div aria-hidden="true" class="sky"[^>]*>.*?</div>', '', hd)
    if tone == 'blauw':
        keys = attr(json.dumps(L.get('skyKeys') or [], separators=(',', ':')))
        hd = hd.replace(body_tag, body_tag + '\n<div aria-hidden="true" class="sky" data-keys="%s" data-sky=""><i class="sky-a"></i><i class="sky-b"></i></div>' % keys)
    # structured data: #business blijft letterlijk staan, de rest komt uit de json
    mm = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', hd, re.S)
    data = json.loads(mm.group(2))
    g = [x for x in data['@graph'] if x.get('@id') == SITE + '#business']
    assert len(g) == 1, '#business ontbreekt'
    data['@graph'] = g + schema(L, lang)
    return hd[:mm.start(2)] + json.dumps(data, ensure_ascii=False) + hd[mm.end(2):]

def tail(pre, footer='<div id="footer-mount"></div>'):
    # zoals de branchepagina's: geen i18n-pages.js nodig, de tekst staat al vertaald in de HTML
    return f'''{footer}
<script src="{pre}i18n.js?v=20261103a"></script>
<script src="{pre}site.js?v=20261106a"></script>
<script src="{pre}fx.js?v={V_FX}"></script>
<script src="{pre}spoor.js?v={V_JS}"></script>
</body>
</html>
'''

def build(lang):
    import body as B                      # body.py: body(L, lang, pre) -> str
    L = json.load(io.open(os.path.join(HERE, lang + '.json'), encoding='utf-8'))
    path = ('' if lang == 'nl' else lang + '/') + FILE
    pre = '' if lang == 'nl' else '../'
    s = io.open(R + path, encoding='utf-8').read() if os.path.exists(R + path) else seed(lang)
    # de linklijst in #footer-mount (crawl-fallback voor zoekmachines) blijft behouden
    fm = re.search(r'<div id="footer-mount">.*?</div>(?=\s*<script)', s, re.S)
    assert fm, 'crawl-fallback in #footer-mount niet gevonden'
    out = head(L, lang, pre, s) + B.body(L, lang, pre) + tail(pre, fm.group(0))
    # vaste controles: één h1, geen em-dash in de zichtbare tekst, geen "GoHighLevel"
    vis = re.sub(r'<(script|style)\b.*?</\1>', '', out[out.index('<main'):], flags=re.S)
    assert vis.count('<h1') == 1, 'precies één h1'
    assert '—' not in re.sub(r'<!--.*?-->', '', vis, flags=re.S), 'em-dash in de tekst'
    assert 'gohighlevel' not in out.lower() and 'GHL' not in vis, 'naam van het platform in de tekst'
    io.open(R + path, 'w', encoding='utf-8', newline='').write(out)
    print(path, 'ok', len(out))

if __name__ == '__main__':
    sys.path.insert(0, HERE)
    for lang in (sys.argv[1:] or ['nl']):
        build(lang)
