# Bouwt "Contact.html" (+ en/, fr/) opnieuw op als de contactpagina "Rechtstreeks":
# vier wegen (bellen, WhatsApp, mail, gratis demo) die allemaal bij ons uitkomen, de echte werkplekfoto,
# het formulier (eigen GHL-formulier per taal), de FAQ en de slot-CTA. v2-skin met "blauw uur".
# De <head> (laadscript, fonts-preload, #business-blok, canonical, hreflang) komt uit het bestaande bestand;
# de inhoud komt uit <taal>.json + body.py (sjabloon).
# Gebruik: py build_contact.py nl [en fr]
import io, re, json, html, sys, os

# de hoofdmap van de site (drie mappen hoger dan dit script)
R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace(os.sep, '/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
V_CSS, V_JS = '20261102a', '20261102a'      # contact.css, contact.js
V_SKIN = '20260925a'                        # home-redesign.css
V_FX = '20261106a'                          # fx.js (lichtvelden van het blauw uur)
FILE = 'Contact.html'
SLUG = 'Contact'
SITE = 'https://emlaunchpad.com/'
LOCALE = {'nl': 'nl-BE', 'en': 'en-GB', 'fr': 'fr-BE'}

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def plain(s):
    """[label](href) -> label: de FAQ-tekst in de structured data is letterlijk de zichtbare tekst."""
    return re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', s)

def schema(L, lang):
    home = SITE + ('' if lang == 'nl' else lang + '/')
    base = home + SLUG
    h = L['hero']
    return [
        {'@type': 'ContactPage', '@id': base + '#webpage', 'url': base, 'name': L['meta']['ogtitle'],
         'description': L['meta']['desc'], 'inLanguage': LOCALE[lang],
         'about': {'@id': SITE + '#business'}, 'mainEntity': {'@id': SITE + '#business'},
         'breadcrumb': {'@id': base + '#breadcrumb'}},
        {'@type': 'BreadcrumbList', '@id': base + '#breadcrumb', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': h['crumb_home'], 'item': home},
            {'@type': 'ListItem', 'position': 2, 'name': h['crumb'], 'item': base}]},
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
    # stijlbladen: v2-skin + contact.css (pages.css valt weg)
    # idempotent: eerst alle eigen bladen weg, dan precies één keer home-redesign.css + contact.css na home.css
    hd = re.sub(r'<link href="%s(pages|home-redesign|contact)\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), '', hd)
    hc = re.search(r'<link href="%shome\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n' % re.escape(pre), hd)
    hd = hd[:hc.end()] + ('<link href="%shome-redesign.css?v=%s" rel="stylesheet"/>\n<link href="%scontact.css?v=%s" rel="stylesheet"/>\n'
                          % (pre, V_SKIN, pre, V_CSS)) + hd[hc.end():]
    assert hd.count('home-redesign.css') == 1 and hd.count('contact.css') == 1
    # de werkplekfoto is op desktop het grootste beeld boven de vouw: vooraf laden (alleen vanaf 1000 px)
    f = L['hero']['foto']
    hd = re.sub(r'<link as="image"[^>]*hero-werkplek[^>]*/>\n', '', hd)
    pl = ('<link as="image" fetchpriority="high" href="%s" imagesizes="%s" imagesrcset="%s" media="(min-width: 1000px)" rel="preload"/>\n'
          % (attr(pre + f['src720']), attr(f['sizes_desk']), attr('%s%s 720w, %s%s 1086w' % (pre, f['src720'], pre, f['src1086']))))
    fp = re.search(r'<link rel="preload" href="/assets/fonts/archivo-latin\.woff2"[^>]*>\n', hd)
    assert fp, 'fonts-preload ontbreekt'
    hd = hd[:fp.end()] + pl + hd[fp.end():]
    # het laadscherm blijft; de <noscript>-regel hoort erbij (precies één keer)
    NOS = '<noscript><style>#loader{display:none!important}</style></noscript>\n'
    hd = hd.replace(NOS, '').replace('</head>', NOS + '</head>')
    assert 'id="loader"' in hd and hd.count(NOS) == 1, 'laadscherm ontbreekt in het startbestand'
    # body: v2-skin + blauw uur, zonder dubbele attributen bij herbouwen
    tone = L.get('tone')
    body_tag = '<body data-page="contact" data-skin="v2"%s>' % (' data-tone="%s"' % tone if tone else '')
    hd, n = re.subn(r'<body[^>]*>', body_tag, hd); assert n == 1
    # lichtlaag direct na <body> (enkel bij toon blauw)
    hd = re.sub(r'\n<div aria-hidden="true" class="sky"[^>]*>.*?</div>', '', hd)
    if tone == 'blauw':
        keys = attr(json.dumps(L.get('skyKeys') or [], separators=(',', ':')))
        hd = hd.replace(body_tag, body_tag + '\n<div aria-hidden="true" class="sky" data-keys="%s" data-sky=""><i class="sky-a"></i><i class="sky-b"></i></div>' % keys)
    # structured data: #business blijft letterlijk staan, de rest komt uit de json
    mm = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', hd, re.S)
    data = json.loads(mm.group(2))
    g = [x for x in data['@graph'] if x.get('@type') not in ('ContactPage', 'FAQPage', 'BreadcrumbList')]
    assert len(g) == 1 and g[0].get('@id') == SITE + '#business'
    data['@graph'] = g + schema(L, lang)
    return hd[:mm.start(2)] + json.dumps(data, ensure_ascii=False) + hd[mm.end(2):]

def tail(pre, footer='<div id="footer-mount"></div>'):
    # form_embed.js van het formulier blijft vooraan, zoals op de vorige versie van de pagina
    return f'''{footer}
<script src="https://link.msgsndr.com/js/form_embed.js"></script>
<script src="{pre}i18n.js?v=20261103a"></script>
<script src="{pre}i18n-pages.js?v=20261028a"></script>
<script src="{pre}site.js?v=20261106b"></script>
<script src="{pre}fx.js?v={V_FX}"></script>
<script src="{pre}contact.js?v={V_JS}"></script>
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
    assert fm, 'crawl-fallback in #footer-mount niet gevonden'
    out = head(L, lang, pre, s) + B.body(L, lang, pre) + tail(pre, fm.group(0))
    # het formulier moet er precies één keer in staan, met het formulier van deze taal
    fid = L['bericht']['form']['id']
    assert out.count('data-form-id="%s"' % fid) == 1 and out.count('<iframe') == 1, 'formulier ' + fid
    io.open(R + path, 'w', encoding='utf-8', newline='').write(out)
    print(path, 'ok', len(out))

if __name__ == '__main__':
    sys.path.insert(0, HERE)
    for lang in (sys.argv[1:] or ['nl']):
        build(lang)
