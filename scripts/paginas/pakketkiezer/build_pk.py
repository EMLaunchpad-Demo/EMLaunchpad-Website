# Bouwt "Pakketkiezer.html" (+ en/, fr/): zes vragen, een eerlijk advies en een voorbereid gesprek.
# Inhoud uit <taal>.json + body.py (sjabloon). Bestaat de pagina nog niet, dan dient de kop van
# AI-Automatisering.html (zelfde taal) als vertrekpunt; canonical, hreflang en og:url worden hier gezet.
# Gebruik: py build_pk.py nl [en fr]
import io, re, json, html, sys, os

# de hoofdmap van de site (drie mappen hoger dan dit script)
R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace(os.sep, '/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
V_CSS, V_JS = '20261002a', '20261002a'
V_SKIN = '20260925a'          # home-redesign.css
V_FX = '20261016a'
PRELOAD = '<link rel="preload" href="/assets/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>'
UNSPLASH = '<link href="https://images.unsplash.com" rel="preconnect"/>'
FILE = 'Pakketkiezer.html'
SLUG = 'Pakketkiezer'
SEED = 'AI-Automatisering.html'
SITE = 'https://emlaunchpad.com/'
LOCALE = {'nl': 'nl_BE', 'en': 'en_GB', 'fr': 'fr_BE'}

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def url(lang, slug=SLUG):
    return SITE + ('' if lang == 'nl' else lang + '/') + slug

def head(L, lang, pre, s):
    a = s.index('<div id="nav-mount"></div>') + len('<div id="nav-mount"></div>\n')
    hd = s[:a]
    m = L['meta']
    hd, n = re.subn(r'<title>[^<]*</title>', '<title>%s</title>' % esc(m['title']), hd); assert n == 1
    for at in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        hd, n = re.subn(r'<meta content="[^"]*" %s/>' % re.escape(at), '<meta content="%s" %s/>' % (attr(m['desc']), at), hd); assert n == 1, at
    for at in ('property="og:title"', 'name="twitter:title"'):
        hd, n = re.subn(r'<meta content="[^"]*" %s/>' % re.escape(at), '<meta content="%s" %s/>' % (attr(m['ogtitle']), at), hd); assert n == 1, at
    # eigen adres: canonical, hreflang en og:url
    links = ('<link href="%s" rel="canonical"/><link href="%s" hreflang="x-default" rel="alternate"/>'
             '<link href="%s" hreflang="en" rel="alternate"/><link href="%s" hreflang="fr" rel="alternate"/>'
             '<link href="%s" hreflang="nl" rel="alternate"/>') % (url(lang), url('nl'), url('en'), url('fr'), url('nl'))
    hd, n = re.subn(r'<link href="[^"]*" rel="canonical"/>(?:<link href="[^"]*" hreflang="[^"]*" rel="alternate"/>)*', links, hd); assert n == 1
    hd, n = re.subn(r'<meta content="[^"]*" property="og:url"/>', '<meta content="%s" property="og:url"/>' % url(lang), hd); assert n == 1
    hd, n = re.subn(r'<meta content="[^"]*" property="og:locale"/>', '<meta content="%s" property="og:locale"/>' % LOCALE[lang], hd); assert n == 1
    # stijlbladen: v2-skin + pakketkiezer.css (de stijl van de vertrekpagina eruit)
    hd = re.sub(r'<link href="%s(pages|automation|automatisering|websites|website)\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), '', hd)
    if 'pakketkiezer.css' in hd:
        hd = re.sub(r'pakketkiezer\.css\?v=[0-9a-z]+', 'pakketkiezer.css?v=' + V_CSS, hd)
        hd = re.sub(r'home-redesign\.css\?v=[0-9a-z]+', 'home-redesign.css?v=' + V_SKIN, hd)
    else:
        hd = re.sub(r'<link href="%shome-redesign\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), '', hd)
        hc = re.search(r'<link href="%shome\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), hd)
        hd = hd[:hc.end()] + ('<link href="%shome-redesign.css?v=%s" rel="stylesheet"/>\n<link href="%spakketkiezer.css?v=%s" rel="stylesheet"/>\n'
                              % (pre, V_SKIN, pre, V_CSS)) + hd[hc.end():]
    # lettertypes: zelf gehost via @font-face in home.css (Caveat laadt vanzelf waar het gebruikt wordt)
    if L.get('photos') and UNSPLASH not in hd:
        hd = hd.replace(PRELOAD, UNSPLASH + '\n' + PRELOAD)
    if not L.get('photos'):
        hd = hd.replace('<link href="https://images.unsplash.com" rel="preconnect"/>\n', '')
    # geen laadscherm: de kiezer moet meteen aantikbaar zijn
    if '<!-- LOADER -->' in hd:
        a0 = hd.index('<!-- LOADER -->')
        hd = hd[:a0] + hd[hd.index('<div id="nav-mount"></div>'):]
    assert 'id="loader"' not in hd
    # klasse pk-js vóór de stijlbladen, zodat de versie zonder JS niet even zichtbaar is;
    # start pakketkiezer.js niet binnen 4 s, dan valt de pagina terug op de versie zonder JS
    hd = re.sub(r"<script>document\.documentElement\.classList\.add\('pk-js'\).*?</script>\n", '', hd)
    hc = re.search(r'<link href="%shome\.css' % re.escape(pre), hd)
    hd = hd[:hc.start()] + ("<script>document.documentElement.classList.add('pk-js');setTimeout(function(){var h=document.querySelector('[data-pk-hero]');"
                              "if(h&&!h.classList.contains('is-js'))document.documentElement.classList.remove('pk-js')},4000)</script>\n") + hd[hc.start():]
    # body: v2-skin (+ eventueel toon); data-page="diensten" zet "Diensten" actief in het menu
    tone = L.get('tone')
    body_tag = '<body data-page="diensten" data-skin="v2"%s>' % (' data-tone="%s"' % tone if tone else '')
    hd, n = re.subn(r'<body[^>]*>', body_tag, hd); assert n == 1
    hd = re.sub(r'\n<div aria-hidden="true" class="sky"[^>]*>.*?</div>', '', hd)
    if tone == 'blauw':
        keys = attr(json.dumps(L.get('skyKeys') or [], separators=(',', ':')))
        hd = hd.replace(body_tag, body_tag + '\n<div aria-hidden="true" class="sky" data-keys="%s" data-sky=""><i class="sky-a"></i><i class="sky-b"></i></div>' % keys)
    # structured data: bedrijf (blijft) + kruimelpad + aanbod + FAQ
    mm = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', hd, re.S)
    data = json.loads(mm.group(2))
    bc = L['crumbs']
    g = [x for x in data['@graph'] if x.get('@type') not in ('Service', 'FAQPage', 'BreadcrumbList', 'OfferCatalog', 'WebPage')]
    g.append({'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': bc[0], 'item': SITE + ('' if lang == 'nl' else lang + '/')},
        {'@type': 'ListItem', 'position': 2, 'name': bc[1], 'item': url(lang, 'Diensten')},
        {'@type': 'ListItem', 'position': 3, 'name': bc[2], 'item': url(lang)}]})
    g.append({'@type': 'WebPage', '@id': url(lang) + '#page', 'url': url(lang), 'name': m['title'], 'description': m['desc'],
              'inLanguage': lang, 'about': {'@id': SITE + '#business'}})
    g.append({'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': q['a']}}
                                                 for q in L['sections']['faq']['items']]})
    data['@graph'] = g
    return hd[:mm.start(2)] + json.dumps(data, ensure_ascii=False) + hd[mm.end(2):]

def tail(pre, footer='<div id="footer-mount"></div>'):
    return f'''{footer}
<script src="{pre}i18n.js?v=20261016a"></script>
<script src="{pre}i18n-pages.js?v=20261016a"></script>
<script src="{pre}site.js?v=20261016a"></script>
<script src="{pre}stars.js?v=1"></script>
<script src="{pre}fx.js?v={V_FX}"></script>
<script src="{pre}pakketkiezer.js?v={V_JS}"></script>
</body>
</html>
'''

def build(lang):
    import body as B                      # body.py: body(L, lang, pre) -> str
    L = json.load(io.open(os.path.join(HERE, lang + '.json'), encoding='utf-8'))
    path = ('' if lang == 'nl' else lang + '/') + FILE
    pre = '' if lang == 'nl' else '../'
    src = R + path if os.path.exists(R + path) else R + ('' if lang == 'nl' else lang + '/') + SEED
    s = io.open(src, encoding='utf-8').read()
    # de linklijst in #footer-mount (crawl-fallback voor zoekmachines) blijft behouden
    fm = re.search(r'<div id="footer-mount">.*?</div>(?=\s*<script)', s, re.S)
    out = head(L, lang, pre, s) + B.body(L, lang, pre) + (tail(pre, fm.group(0)) if fm else tail(pre))
    io.open(R + path, 'w', encoding='utf-8', newline='').write(out)
    print(path, 'ok', len(out))

if __name__ == '__main__':
    sys.path.insert(0, HERE)
    for lang in (sys.argv[1:] or ['nl']):
        build(lang)
