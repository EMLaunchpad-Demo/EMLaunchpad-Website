# Bouwt de drie branchepagina's (alleen NL, hreflang-fallback naar een bestaande pagina voor EN/FR):
#   website-voor-schoonheidssalons.html   <- schoonheid.json
#   website-voor-kappers.html             <- kappers.json
#   website-voor-praktijken.html          <- praktijken.json
# Metafoor: "Een dag in de zaak" (één tijdlijn van 8 tot 22 uur, dezelfde component met andere data per branche).
# De <head> (laadscript, fonts-preload, #business-blok) komt uit het bestaande bestand; bestaat dat nog niet,
# dan uit eml-ai-team.html (canonical, hreflang en og:url worden dan voor deze pagina gezet).
# De inhoud komt uit <branche>.json + body.py. Model: scripts/paginas/eml-ai-team/build_eml.py.
# Gebruik: py build_branche.py [schoonheid kappers praktijken]
import io, re, json, html, sys, os

R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace(os.sep, '/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
V_CSS = '20261019a'           # branche.css (de coördinator zet de ?v= in de integratiestap)
V_SKIN = '20260925a'          # home-redesign.css
V_FX = '20261016a'
SITE = 'https://emlaunchpad.com/'
TEMPLATE = 'eml-ai-team.html'
ALL = ['schoonheid', 'kappers', 'praktijken']


def esc(s):
    return html.escape(str(s), quote=False)


def attr(s):
    return html.escape(str(s), quote=True)


def schema(L):
    m, slug = L['meta'], L['slug']
    base = SITE + slug
    be = {'@type': 'Country', 'name': 'BE'}

    def offer(o):
        d = {'@type': 'Offer', 'name': o['name'], 'description': o['desc'], 'priceCurrency': 'EUR', 'url': base + '#bouwstenen', 'eligibleRegion': be}
        specs = [{'@type': 'UnitPriceSpecification', 'price': str(o['month']), 'priceCurrency': 'EUR', 'unitCode': 'MON', 'valueAddedTaxIncluded': False}]
        if o.get('once'):
            specs.insert(0, {'@type': 'UnitPriceSpecification', 'price': str(o['once']), 'priceCurrency': 'EUR', 'name': 'Eenmalig', 'valueAddedTaxIncluded': False})
        d['price'] = str(o['month'])
        d['priceSpecification'] = specs if len(specs) > 1 else specs[0]
        return d

    return [
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE},
            {'@type': 'ListItem', 'position': 2, 'name': 'Websites', 'item': SITE + 'Websites'},
            {'@type': 'ListItem', 'position': 3, 'name': L['hero']['crumb'], 'item': base}]},
        {'@type': 'Service', '@id': base + '#service', 'name': m['service'], 'serviceType': m['serviceType'], 'url': base,
         'description': m['desc'], 'provider': {'@id': SITE + '#business'},
         'audience': {'@type': 'BusinessAudience', 'audienceType': m['audience']},
         'areaServed': {'@type': 'Country', 'name': 'Belgium'},
         'image': SITE + 'assets/werk/branche/' + L['hero']['img']['base'] + '-1200.webp',
         'offers': [offer(o) for o in m['offers']]},
        {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': q['a']}}
                                            for q in L['faq']['items']]}]


def head(L, s, fresh):
    a = s.index('<div id="nav-mount"></div>') + len('<div id="nav-mount"></div>\n')
    hd = s[:a]
    m, slug = L['meta'], L['slug']
    own = SITE + slug
    hd, n = re.subn(r'<title>[^<]*</title>', '<title>%s</title>' % esc(m['title']), hd); assert n == 1
    for at in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        hd, n = re.subn(r'<meta content="[^"]*" %s/>' % re.escape(at), '<meta content="%s" %s/>' % (attr(m['desc']), at), hd); assert n == 1, at
    for at in ('property="og:title"', 'name="twitter:title"'):
        hd, n = re.subn(r'<meta content="[^"]*" %s/>' % re.escape(at), '<meta content="%s" %s/>' % (attr(m['ogtitle']), at), hd); assert n == 1, at
    # canonical + hreflang: alleen NL bestaat; x-default en nl wijzen naar deze pagina (EN/FR: data-lang-fallback op <body>)
    links = ('<link href="%s" rel="canonical"/><link href="%s" hreflang="x-default" rel="alternate"/><link href="%s" hreflang="nl" rel="alternate"/>'
             % (own, own, own))
    hd, n = re.subn(r'<link href="[^"]*" rel="canonical"/>(<link href="[^"]*" hreflang="[^"]*" rel="alternate"/>)*', links, hd); assert n == 1
    hd, n = re.subn(r'<meta content="[^"]*" property="og:url"/>', '<meta content="%s" property="og:url"/>' % own, hd); assert n == 1
    # stijlbladen: home.css + v2-skin + branche.css (idempotent)
    hd = re.sub(r'<link href="(pages|websites|website|home-redesign|eml-ai-team|branche)\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n', '', hd)
    hc = re.search(r'<link href="home\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n', hd)
    hd = hd[:hc.end()] + ('<link href="home-redesign.css?v=%s" rel="stylesheet"/>\n<link href="branche.css?v=%s" rel="stylesheet"/>\n'
                          % (V_SKIN, V_CSS)) + hd[hc.end():]
    assert hd.count('home-redesign.css') == 1 and hd.count('branche.css') == 1
    # het heldenbeeld is het LCP-beeld: vooraf laden (idempotent)
    im = L['hero']['img']['base']
    hd = re.sub(r'<link as="image"[^>]*data-br=""/>\n', '', hd)
    pre = ('<link as="image" fetchpriority="high" href="assets/werk/branche/%s-1200.webp" imagesizes="%s" '
           'imagesrcset="assets/werk/branche/%s-600.webp 600w, assets/werk/branche/%s-1200.webp 1200w" rel="preload" data-br=""/>\n'
           % (im, attr(L['hero']['img']['sizes']), im, im))
    hc = re.search(r'<link href="home\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n', hd)
    hd = hd[:hc.start()] + pre + hd[hc.start():]
    assert hd.count('data-br=""') == 1
    NOS = '<noscript><style>#loader{display:none!important}</style></noscript>\n'
    hd = hd.replace(NOS, '').replace('</head>', NOS + '</head>')
    assert 'id="loader"' in hd and hd.count(NOS) == 1, 'laadscherm ontbreekt in het startbestand'
    # body: v2-skin, toon blauw, taalknop naar een bestaande pagina in EN/FR
    body_tag = '<body data-lang-fallback="%s" data-page="diensten" data-skin="v2" data-tone="blauw">' % attr(L['fallback'])
    hd, n = re.subn(r'<body[^>]*>', body_tag, hd); assert n == 1
    hd = re.sub(r'\n<div aria-hidden="true" class="sky"[^>]*>.*?</div>', '', hd)
    keys = attr(json.dumps(L['skyKeys'], separators=(',', ':')))
    hd = hd.replace(body_tag, body_tag + '\n<div aria-hidden="true" class="sky" data-keys="%s" data-sky=""><i class="sky-a"></i><i class="sky-b"></i></div>' % keys)
    # structured data: #business blijft, de rest komt uit de json
    mm = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', hd, re.S)
    data = json.loads(mm.group(2))
    g = [x for x in data['@graph'] if x.get('@type') not in ('Service', 'FAQPage', 'BreadcrumbList')]
    assert len(g) == 1 and g[0].get('@id') == SITE + '#business'
    data['@graph'] = g + schema(L)
    return hd[:mm.start(2)] + json.dumps(data, ensure_ascii=False) + hd[mm.end(2):]


def tail(footer):
    return f'''{footer}
<script src="i18n.js?v=20261019a"></script>
<script src="i18n-pages.js?v=20261019a"></script>
<script src="site.js?v=20261019a"></script>
<script src="fx.js?v={V_FX}"></script>
</body>
</html>
'''


def build(name):
    import body as B
    L = json.load(io.open(os.path.join(HERE, name + '.json'), encoding='utf-8'))
    path = L['slug'] + '.html'
    fresh = not os.path.exists(R + path)
    s = io.open(R + (TEMPLATE if fresh else path), encoding='utf-8').read()
    fm = re.search(r'<div id="footer-mount">.*?</div>(?=\s*<script)', s, re.S)
    out = head(L, s, fresh) + B.body(L) + tail(fm.group(0) if fm else '<div id="footer-mount"></div>')
    io.open(R + path, 'w', encoding='utf-8', newline='').write(out)
    print(path, 'nieuw' if fresh else 'ok', len(out))


if __name__ == '__main__':
    sys.path.insert(0, HERE)
    for n in (sys.argv[1:] or ALL):
        build(n)
