# Bouwt "AI Chatbots.html" (+ en/, fr/) opnieuw op als de pagina van de AI-chatbot.
# De URL blijft (bestaande links en Google), de inhoud komt uit <taal>.json + body.py (sjabloon).
# De <head> (meta, fonts, laadscript, #business-blok) komt uit de bestaande HTML; alleen title,
# description, og/twitter, de versie van ai-chatbot.css en de knopen BreadcrumbList, Service en FAQPage
# in de JSON-LD worden uit de json gezet.
# Gebruik: py build_chatbot.py nl [en fr]
import io, re, json, html, sys, os

# de hoofdmap van de site (drie mappen hoger dan dit script)
R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace(os.sep, '/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
V_CSS, V_JS = '20261018a', '20260924d'
V_SKIN = '20260925a'          # home-redesign.css
FILE = 'AI Chatbots.html'
SLUG = 'AI%20Chatbots'

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
    # stijlbladen: v2-skin + ai-chatbot.css
    if 'ai-chatbot.css' in hd:
        hd = re.sub(r'ai-chatbot\.css\?v=[0-9a-z]+', 'ai-chatbot.css?v=' + V_CSS, hd)
        hd = re.sub(r'home-redesign\.css\?v=[0-9a-z]+', 'home-redesign.css?v=' + V_SKIN, hd)
    else:
        hc = re.search(r'<link href="%shome\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), hd)
        hd = hd[:hc.end()] + ('<link href="%shome-redesign.css?v=%s" rel="stylesheet"/>\n<link href="%sai-chatbot.css?v=%s" rel="stylesheet"/>\n'
                              % (pre, V_SKIN, pre, V_CSS)) + hd[hc.end():]
    hd, n = re.subn(r'<body[^>]*>', '<body data-page="diensten" data-skin="v2">', hd); assert n == 1
    # structured data: kruimelpad, dienst met prijs (patroon fase 0) en FAQ
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
    g.append({'@type': 'Service', '@id': base + '#service', 'name': m['service'], 'serviceType': 'AI chatbot', 'url': base,
              'description': m['desc'], 'provider': {'@id': site + '#business'},
              'offers': {'@type': 'Offer', 'name': m['offer'], 'price': '50', 'priceCurrency': 'EUR', 'url': base,
                         'eligibleRegion': {'@type': 'Country', 'name': 'BE'},
                         'priceSpecification': {'@type': 'UnitPriceSpecification', 'price': '50', 'priceCurrency': 'EUR', 'unitCode': 'MON',
                                                'name': m['offer_unit'], 'valueAddedTaxIncluded': False}},
              'areaServed': {'@type': 'Country', 'name': 'Belgium'}})
    g.append({'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': q['a']}}
                                                 for q in L['faq']['items']]})
    data['@graph'] = g
    return hd[:mm.start(2)] + json.dumps(data, ensure_ascii=False) + hd[mm.end(2):]

def tail(pre, footer='<div id="footer-mount"></div>'):
    return f'''{footer}
<script src="{pre}i18n.js?v=20261018a"></script>
<script src="{pre}i18n-pages.js?v=20261018a"></script>
<script src="{pre}site.js?v=20261018a"></script>
<script src="{pre}stars.js?v=1"></script>
<script src="{pre}ai-chatbot.js?v={V_JS}"></script>
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
