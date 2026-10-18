# Bouwt "eml-ai-team.html" (+ en/, fr/) opnieuw op als de dienstpagina EML AI Team ("Een kantoor vol").
# De <head> (laadscript, fonts-preload, #business-blok, canonical, hreflang) komt uit het bestaande bestand;
# de inhoud komt uit <taal>.json + body.py (sjabloon). Model: scripts/paginas/websites/build_ws.py.
# Gebruik: py build_eml.py nl [en fr]
import io, re, json, html, sys, os

# de hoofdmap van de site (drie mappen hoger dan dit script)
R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace(os.sep, '/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
V_CSS, V_JS = '20261018a', '20261018a'
V_SKIN = '20260925a'          # home-redesign.css
V_FX = '20261016a'
FILE = 'eml-ai-team.html'
SLUG = 'eml-ai-team'
HOME_CRUMB = {'nl': 'Home', 'en': 'Home', 'fr': 'Accueil'}

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def schema(L, lang):
    """BreadcrumbList + Service (vier Offers) + FAQPage, naar het model van werkpakket/seo/schema-<taal>.json."""
    m = L['meta']
    site = 'https://emlaunchpad.com/'
    home = site + ('' if lang == 'nl' else lang + '/')
    base = home + SLUG
    h = L['hero']
    rows = L['pakketten']['table']['rows']
    setup_name, month_name = rows[-2][0], rows[-1][0]          # "Setup (eenmalig)", "Per maand"
    be = {'@type': 'Country', 'name': 'BE'}
    offers = []
    for o in m['offers']:
        d = {'@type': 'Offer', 'name': o['name'], 'description': o['desc'], 'priceCurrency': 'EUR', 'url': base + '#pakketten', 'eligibleRegion': be}
        if o['month'] is None:
            d['price'] = str(o['setup'])
        elif o.get('from'):
            d['priceSpecification'] = [
                {'@type': 'UnitPriceSpecification', 'minPrice': str(o['setup']), 'priceCurrency': 'EUR', 'name': setup_name, 'valueAddedTaxIncluded': False},
                {'@type': 'UnitPriceSpecification', 'minPrice': str(o['month']), 'priceCurrency': 'EUR', 'unitCode': 'MON', 'name': month_name, 'valueAddedTaxIncluded': False}]
        else:
            d['price'] = str(o['setup'])
            d['priceSpecification'] = [
                {'@type': 'UnitPriceSpecification', 'price': str(o['setup']), 'priceCurrency': 'EUR', 'name': setup_name, 'valueAddedTaxIncluded': False},
                {'@type': 'UnitPriceSpecification', 'price': str(o['month']), 'priceCurrency': 'EUR', 'unitCode': 'MON', 'name': month_name, 'valueAddedTaxIncluded': False}]
        offers.append(d)
    return [
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': HOME_CRUMB[lang], 'item': home},
            {'@type': 'ListItem', 'position': 2, 'name': h['crumb_home'], 'item': home + 'Diensten'},
            {'@type': 'ListItem', 'position': 3, 'name': h['crumb'], 'item': base}]},
        # @id en provider zoals de andere dienstpagina's sinds fase 0 (de referentie heeft geen @id; dat is een toevoeging)
        {'@type': 'Service', '@id': base + '#service', 'name': m['service'], 'serviceType': m['serviceType'], 'url': base,
         'description': m['desc'], 'provider': {'@id': site + '#business'},
         'areaServed': {'@type': 'Country', 'name': 'Belgium'}, 'offers': offers},
        {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': q['a']}}
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
    # canonical, hreflang en og:url horen bij deze pagina (controle: het startbestand is een kopie van Websites)
    own = 'https://emlaunchpad.com/' + ('' if lang == 'nl' else lang + '/') + SLUG
    assert ('href="%s" rel="canonical"' % own) in hd, 'canonical ontbreekt: ' + own
    assert ('content="%s" property="og:url"' % own) in hd, 'og:url ontbreekt: ' + own
    for l, u in (('x-default', 'https://emlaunchpad.com/' + SLUG), ('nl', 'https://emlaunchpad.com/' + SLUG),
                 ('en', 'https://emlaunchpad.com/en/' + SLUG), ('fr', 'https://emlaunchpad.com/fr/' + SLUG)):
        assert ('href="%s" hreflang="%s" rel="alternate"' % (u, l)) in hd, 'hreflang ontbreekt: ' + l
    # stijlbladen: v2-skin + eml-ai-team.css (geen pages.css, websites.css of website.css)
    # idempotent: eerst alle eigen bladen weg, dan precies één keer home-redesign.css + eml-ai-team.css na home.css
    hd = re.sub(r'<link href="%s(pages|websites|website|home-redesign|eml-ai-team)\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), '', hd)
    hc = re.search(r'<link href="%shome\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), hd)
    hd = hd[:hc.end()] + ('<link href="%shome-redesign.css?v=%s" rel="stylesheet"/>\n<link href="%seml-ai-team.css?v=%s" rel="stylesheet"/>\n'
                          % (pre, V_SKIN, pre, V_CSS)) + hd[hc.end():]
    assert hd.count('home-redesign.css') == 1 and hd.count('eml-ai-team.css') == 1
    # geen foto's van Unsplash op deze pagina
    hd = hd.replace('<link href="https://images.unsplash.com" rel="preconnect"/>\n', '')
    # het laadscherm blijft (anders dan op Websites); de <noscript>-regel hoort erbij
    NOS = '<noscript><style>#loader{display:none!important}</style></noscript>\n'
    hd = hd.replace(NOS, '').replace('</head>', NOS + '</head>')      # precies één keer
    assert 'id="loader"' in hd and hd.count(NOS) == 1, 'laadscherm ontbreekt in het startbestand'
    # body: v2-skin + toon, zonder dubbele attributen bij herbouwen
    tone = L.get('tone')
    body_tag = '<body data-page="diensten" data-skin="v2"%s>' % (' data-tone="%s"' % tone if tone else '')
    hd, n = re.subn(r'<body[^>]*>', body_tag, hd); assert n == 1
    # lichtlaag direct na <body> (enkel bij toon blauw)
    hd = re.sub(r'\n<div aria-hidden="true" class="sky"[^>]*>.*?</div>', '', hd)
    if tone == 'blauw':
        keys = attr(json.dumps(L.get('skyKeys') or [], separators=(',', ':')))
        hd = hd.replace(body_tag, body_tag + '\n<div aria-hidden="true" class="sky" data-keys="%s" data-sky=""><i class="sky-a"></i><i class="sky-b"></i></div>' % keys)
    # structured data: #business blijft, de rest komt uit de json
    mm = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', hd, re.S)
    data = json.loads(mm.group(2))
    g = [x for x in data['@graph'] if x.get('@type') not in ('Service', 'FAQPage', 'BreadcrumbList')]
    assert len(g) == 1 and g[0].get('@id') == 'https://emlaunchpad.com/#business'
    data['@graph'] = g + schema(L, lang)
    return hd[:mm.start(2)] + json.dumps(data, ensure_ascii=False) + hd[mm.end(2):]

def tail(pre, footer='<div id="footer-mount"></div>'):
    return f'''{footer}
<script src="{pre}i18n.js?v=20261018a"></script>
<script src="{pre}i18n-pages.js?v=20261018a"></script>
<script src="{pre}site.js?v=20261018a"></script>
<script src="{pre}fx.js?v={V_FX}"></script>
<script src="{pre}eml-ai-team.js?v={V_JS}"></script>
</body>
</html>
'''

def build(lang):
    import body as B                      # body.py: body(L, lang, pre) -> str
    L = json.load(io.open(os.path.join(HERE, lang + '.json'), encoding='utf-8'))
    path = ('' if lang == 'nl' else lang + '/') + FILE
    pre = '' if lang == 'nl' else '../'
    s = io.open(R + path, encoding='utf-8').read()
    # de linklijst in #footer-mount (crawl-fallback voor zoekmachines) blijft behouden
    fm = re.search(r'<div id="footer-mount">.*?</div>(?=\s*<script)', s, re.S)
    out = head(L, lang, pre, s) + B.body(L, lang, pre) + (tail(pre, fm.group(0)) if fm else tail(pre))
    io.open(R + path, 'w', encoding='utf-8', newline='').write(out)
    print(path, 'ok', len(out))

if __name__ == '__main__':
    sys.path.insert(0, HERE)
    for lang in (sys.argv[1:] or ['nl']):
        build(lang)
