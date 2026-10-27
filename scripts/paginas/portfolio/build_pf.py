# Bouwt "Portfolio.html" (+ en/, fr/) opnieuw op: echte websites van echte bedrijven.
# De kop (meta, canonical, hreflang, laadscherm) komt van de bestaande pagina; de inhoud
# uit <taal>.json + body.py (sjabloon). Dezelfde achtergrond als de homepage ("blauw uur").
# Gebruik: py build_pf.py nl [en fr]
import io, re, json, html, sys, os

# de hoofdmap van de site (drie mappen hoger dan dit script)
R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace(os.sep, '/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
V_CSS, V_JS = '20261019a', '20261007a'
V_SKIN = '20260925a'          # home-redesign.css
V_FX = '20261016a'
FILE = 'Portfolio.html'
SITE = 'https://emlaunchpad.com/'

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
    # stijlbladen: v2-skin + portfolio.css
    hd = re.sub(r'<link href="%spages\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), '', hd)
    if 'portfolio.css' in hd:
        hd = re.sub(r'portfolio\.css\?v=[0-9a-z]+', 'portfolio.css?v=' + V_CSS, hd)
    else:
        hc = re.search(r'<link href="%shome-redesign\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), hd)
        hd = hd[:hc.end()] + '<link href="%sportfolio.css?v=%s" rel="stylesheet"/>\n' % (pre, V_CSS) + hd[hc.end():]
    hd = re.sub(r'home-redesign\.css\?v=[0-9a-z]+', 'home-redesign.css?v=' + V_SKIN, hd)
    # (optioneel) extra lettertype
    # body: v2-skin met de blauwe toon van de homepage, zonder dubbele attributen bij herbouwen
    tone = L.get('tone')
    body_tag = '<body data-page="portfolio" data-skin="v2"%s>' % (' data-tone="%s"' % tone if tone else '')
    hd, n = re.subn(r'<body[^>]*>', body_tag, hd); assert n == 1
    # lichtlaag direct na <body> (enkel bij toon blauw)
    hd = re.sub(r'\n<div aria-hidden="true" class="sky"[^>]*>.*?</div>', '', hd)
    if tone == 'blauw':
        keys = attr(json.dumps(L.get('skyKeys') or [], separators=(',', ':')))
        hd = hd.replace(body_tag, body_tag + '\n<div aria-hidden="true" class="sky" data-keys="%s" data-sky=""><i class="sky-a"></i><i class="sky-b"></i></div>' % keys)
    # structured data: bedrijf + kruimelpad (blijven) + de lijst met cases
    mm = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', hd, re.S)
    data = json.loads(mm.group(2))
    base = SITE + ('' if lang == 'nl' else lang + '/') + 'Portfolio'
    g = [x for x in data['@graph'] if x.get('@type') not in ('ItemList', 'CollectionPage')]
    items = []
    for i, c in enumerate(L['cases']):
        it = {'@type': 'ListItem', 'position': i + 1, 'item': {'@type': 'WebSite', 'name': c['naam'], 'url': c['url'],
              'description': c['kort'], 'creator': {'@id': SITE + '#business'}}}
        if c.get('case'):
            it['item']['mainEntityOfPage'] = SITE + ('' if lang == 'nl' else lang + '/') + c['case']
        items.append(it)
    g.append({'@type': 'ItemList', '@id': base + '#werk', 'name': m['service'], 'itemListOrder': 'https://schema.org/ItemListOrderDescending',
              'numberOfItems': len(items), 'itemListElement': items})
    data['@graph'] = g
    return hd[:mm.start(2)] + json.dumps(data, ensure_ascii=False) + hd[mm.end(2):]

def tail(pre, footer='<div id="footer-mount"></div>'):
    return f'''{footer}
<script src="{pre}i18n.js?v=20261027a"></script>
<script src="{pre}i18n-pages.js?v=20261019a"></script>
<script src="{pre}site.js?v=20261027a"></script>
<script src="{pre}stars.js?v=1"></script>
<script src="{pre}fx.js?v={V_FX}"></script>
<script src="{pre}portfolio.js?v={V_JS}"></script>
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
