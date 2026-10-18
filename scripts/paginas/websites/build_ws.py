# Bouwt "Websites.html" (+ en/, fr/) opnieuw op als de nieuwe dienstpagina Websites.
# De URL blijft (bestaande links en Google), de inhoud komt uit <taal>.json + body.py (sjabloon).
# Gebruik: py build_auto.py nl [en fr]
import io, re, json, html, sys, os

# de hoofdmap van de site (drie mappen hoger dan dit script)
R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace(os.sep, '/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
V_CSS, V_JS = '20261018a', '20261018a'
V_SKIN = '20260925a'          # home-redesign.css
V_FX = '20261016a'
FILE = 'Websites.html'
PRELOAD = '<link rel="preload" href="/assets/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>'
UNSPLASH = '<link href="https://images.unsplash.com" rel="preconnect"/>'

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def head(L, lang, pre, s):
    a = s.index('<div id="nav-mount"></div>') + len('<div id="nav-mount"></div>\n')
    hd = s[:a]
    m = L['meta']
    hd, n = re.subn(r'<title>[^<]*</title>', '<title>%s</title>' % esc(m['title']), hd); assert n == 1
    for at in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        hd, n = re.subn(r'<meta content="[^"]*" %s/>' % re.escape(at), '<meta content="%s" %s/>' % (attr(m['desc']), at), hd); assert n == 1, at
    for at in ('property="og:title"', 'name="twitter:title"'):
        hd, n = re.subn(r'<meta content="[^"]*" %s/>' % re.escape(at), '<meta content="%s" %s/>' % (attr(m['ogtitle']), at), hd); assert n == 1, at
    # stijlbladen: v2-skin + website.css i.p.v. pages.css en automation.css
    hd = re.sub(r'<link href="%s(pages|websites)\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), '', hd)
    if 'website.css' in hd:
        hd = re.sub(r'website\.css\?v=[0-9a-z]+', 'website.css?v=' + V_CSS, hd)
        hd = re.sub(r'home-redesign\.css\?v=[0-9a-z]+', 'home-redesign.css?v=' + V_SKIN, hd)
    else:
        hc = re.search(r'<link href="%shome\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), hd)
        hd = hd[:hc.end()] + ('<link href="%shome-redesign.css?v=%s" rel="stylesheet"/>\n<link href="%swebsite.css?v=%s" rel="stylesheet"/>\n'
                              % (pre, V_SKIN, pre, V_CSS)) + hd[hc.end():]
    # lettertypes: zelf gehost via @font-face in home.css (Caveat laadt vanzelf waar het gebruikt wordt);
    # sneller naar de foto's: preconnect vóór de font-preload
    if UNSPLASH not in hd:
        hd = hd.replace(PRELOAD, UNSPLASH + '\n' + PRELOAD)
    # geen laadscherm op deze pagina: ze meet zichzelf, dus er mag niets kunstmatig tussen zitten
    if '<!-- LOADER -->' in hd:
        a0 = hd.index('<!-- LOADER -->')
        hd = hd[:a0] + hd[hd.index('<div id="nav-mount"></div>'):]
    assert 'id="loader"' not in hd
    # body: v2-skin (+ eventueel toon), zonder dubbele attributen bij herbouwen
    tone = L.get('tone')
    body_tag = '<body data-page="diensten" data-skin="v2"%s>' % (' data-tone="%s"' % tone if tone else '')
    hd, n = re.subn(r'<body[^>]*>', body_tag, hd); assert n == 1
    # lichtlaag direct na <body> (enkel bij toon blauw)
    hd = re.sub(r'\n<div aria-hidden="true" class="sky"[^>]*>.*?</div>', '', hd)
    if tone == 'blauw':
        keys = attr(json.dumps(L.get('skyKeys') or [], separators=(',', ':')))
        hd = hd.replace(body_tag, body_tag + '\n<div aria-hidden="true" class="sky" data-keys="%s" data-sky=""><i class="sky-a"></i><i class="sky-b"></i></div>' % keys)
    # structured data: dienst (zit in Online groeien) + FAQ
    mm = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', hd, re.S)
    data = json.loads(mm.group(2))
    base = 'https://emlaunchpad.com/' + ('' if lang == 'nl' else lang + '/') + 'Websites'
    site = 'https://emlaunchpad.com/'
    home = site + ('' if lang == 'nl' else lang + '/')
    g = [x for x in data['@graph'] if x.get('@type') not in ('Service', 'FAQPage', 'BreadcrumbList')]
    # kruimelpad in de taal van de pagina (crumbs in de json), met de URL's van die taal
    bc = L['crumbs']
    g.append({'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': bc[0], 'item': home},
        {'@type': 'ListItem', 'position': 2, 'name': bc[1], 'item': home + 'Diensten'},
        {'@type': 'ListItem', 'position': 3, 'name': bc[2], 'item': base}]})
    # dienst: eigen @id, aanbieder = het bedrijf (#business), prijs per maand excl. btw (patroon werkpakket/seo/schema-nl.json)
    g.append({'@type': 'Service', '@id': base + '#service', 'name': m['service'], 'serviceType': 'Web design', 'url': base,
              'description': m['desc'], 'provider': {'@id': site + '#business'},
              'areaServed': {'@type': 'Country', 'name': 'Belgium'},
              'offers': {'@type': 'Offer', 'name': m['offer'], 'url': base + '#prijs', 'price': '150', 'priceCurrency': 'EUR',
                         'eligibleRegion': {'@type': 'Country', 'name': 'BE'},
                         'priceSpecification': {'@type': 'UnitPriceSpecification', 'price': '150', 'priceCurrency': 'EUR', 'unitCode': 'MON',
                                                'valueAddedTaxIncluded': False}}})
    g.append({'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': q['a']}}
                                                 for q in L['faq']['items']]})
    data['@graph'] = g
    return hd[:mm.start(2)] + json.dumps(data, ensure_ascii=False) + hd[mm.end(2):]

def tail(pre, footer='<div id="footer-mount"></div>'):
    return f'''{footer}
<script src="{pre}i18n.js?v=20261019a"></script>
<script src="{pre}i18n-pages.js?v=20261019a"></script>
<script src="{pre}site.js?v=20261019a"></script>
<script src="{pre}stars.js?v=1"></script>
<script src="{pre}fx.js?v={V_FX}"></script>
<script src="{pre}website.js?v={V_JS}"></script>
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
