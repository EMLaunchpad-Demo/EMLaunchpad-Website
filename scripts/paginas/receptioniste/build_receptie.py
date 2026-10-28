# Bouwt "AI Voice Agents.html" (+ en/, fr/) opnieuw op als de pagina van de AI-receptioniste.
# De URL blijft (bestaande links en Google), de inhoud komt uit <taal>.json + body.py (sjabloon).
# De <head> (meta, fonts, laadscript, #business-blok) komt uit de bestaande HTML; alleen title,
# description, og/twitter, de versie van receptioniste.css en de knopen BreadcrumbList, Service en FAQPage
# in de JSON-LD worden uit de json gezet.
# Gebruik: py build_receptie.py nl [en fr]
import io, re, json, html, sys, os

# de hoofdmap van de site (drie mappen hoger dan dit script)
R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace(os.sep, '/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
V_CSS, V_JS = '20261019a', '20261028a'
V_SKIN = '20260925a'          # home-redesign.css
V_FX = '20261016a'
FILE = 'AI Voice Agents.html'
SLUG = 'AI%20Voice%20Agents'

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
    # stijlbladen: v2-skin + receptioniste.css
    if 'receptioniste.css' in hd:
        hd = re.sub(r'receptioniste\.css\?v=[0-9a-z]+', 'receptioniste.css?v=' + V_CSS, hd)
        hd = re.sub(r'home-redesign\.css\?v=[0-9a-z]+', 'home-redesign.css?v=' + V_SKIN, hd)
    else:
        hc = re.search(r'<link href="%shome\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), hd)
        hd = hd[:hc.end()] + ('<link href="%shome-redesign.css?v=%s" rel="stylesheet"/>\n<link href="%sreceptioniste.css?v=%s" rel="stylesheet"/>\n'
                              % (pre, V_SKIN, pre, V_CSS)) + hd[hc.end():]
    # body: v2-skin (+ eventueel toon), zonder dubbele attributen bij herbouwen
    tone = L.get('tone')
    body_tag = '<body data-page="diensten" data-skin="v2"%s>' % (' data-tone="%s"' % tone if tone else '')
    hd, n = re.subn(r'<body[^>]*>', body_tag, hd); assert n == 1
    # sterrenhemel/lichtlaag direct na <body> (enkel bij toon blauw)
    hd = re.sub(r'\n<div aria-hidden="true" class="sky"[^>]*>.*?</div>', '', hd)
    if tone == 'blauw':
        keys = attr(json.dumps(L.get('skyKeys') or [], separators=(',', ':')))
        hd = hd.replace(body_tag, body_tag + '\n<div aria-hidden="true" class="sky" data-keys="%s" data-sky=""><i class="sky-a"></i><i class="sky-b"></i></div>' % keys)
    # structured data: kruimelpad, dienst met prijs (€750 eenmalig + €150 per maand, excl. btw; patroon fase 0) en FAQ
    mm = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', hd, re.S)
    data = json.loads(mm.group(2))
    site = 'https://emlaunchpad.com/'
    home = site + ('' if lang == 'nl' else lang + '/')
    base = home + SLUG
    g = [x for x in data['@graph'] if x.get('@type') not in ('Service', 'FAQPage', 'BreadcrumbList')]
    bc = L['crumbs']
    g.append({'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': bc[0], 'item': home},
        {'@type': 'ListItem', 'position': 2, 'name': bc[1], 'item': home + 'Diensten'},
        {'@type': 'ListItem', 'position': 3, 'name': bc[2], 'item': base}]})
    svc = {'@type': 'Service', '@id': base + '#service', 'name': m['service']}
    if m.get('alt_names'):                # fase 2: synoniemen (AI-telefoniste, standard téléphonique IA)
        svc['alternateName'] = m['alt_names']
    g.append(dict(svc, **{'serviceType': 'AI voice agent', 'url': base,
              'description': m['desc'], 'provider': {'@id': site + '#business'},
              'areaServed': {'@type': 'Country', 'name': 'Belgium'},
              'offers': {'@type': 'Offer', 'name': m['offer'], 'priceCurrency': 'EUR', 'url': base,
                         'eligibleRegion': {'@type': 'Country', 'name': 'BE'},
                         'priceSpecification': [
                             {'@type': 'UnitPriceSpecification', 'price': '750', 'priceCurrency': 'EUR', 'name': m['offer_setup'], 'valueAddedTaxIncluded': False},
                             {'@type': 'UnitPriceSpecification', 'price': '150', 'priceCurrency': 'EUR', 'unitCode': 'MON', 'name': m['offer_month'], 'valueAddedTaxIncluded': False}]}}))
    g.append({'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': q['a']}}
                                                 for q in L['faq']['items']]})
    data['@graph'] = g
    return hd[:mm.start(2)] + json.dumps(data, ensure_ascii=False) + hd[mm.end(2):]

def tail(pre, footer='<div id="footer-mount"></div>'):
    return f'''{footer}
<script src="{pre}i18n.js?v=20261028a"></script>
<script src="{pre}i18n-pages.js?v=20261028a"></script>
<script src="{pre}site.js?v=20261028a"></script>
<script src="{pre}stars.js?v=1"></script>
<script src="{pre}fx.js?v={V_FX}"></script>
<script src="{pre}receptioniste.js?v={V_JS}"></script>
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
