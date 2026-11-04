# Bouwt gratis-website-scan.html (alleen NL, zoals de branchepagina's) uit nl.json.
# De <head> (laadscript, fonts-preload, #business-blok, favicons) komt uit het bestaande bestand; bestaat dat nog niet,
# dan uit website-voor-kappers.html. Titel, beschrijving, canonical, hreflang, og:url, og:image en de JSON-LD worden
# voor deze pagina gezet. Het rapport zelf maakt website-scan.js in de browser, met de JSON van /api/scan (worker/).
# Zonder JavaScript staat er een nette melding en blijven uitleg, FAQ en de knop voor een gratis gesprek bruikbaar.
# Gebruik: py build_scan.py
import io, re, json, html, os

R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace(os.sep, '/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
V_CSS = '20261103a'           # website-scan.css
V_JS = '20261103a'            # website-scan.js
V_SKIN = '20260925a'          # home-redesign.css
V_FX = '20261016a'
V_SITE = '20261104a'          # site.js (menu-item en footerlink naar de scan)
SITE = 'https://emlaunchpad.com/'
TEMPLATE = 'website-voor-kappers.html'


def esc(s):
    return html.escape(str(s), quote=False)


def attr(s):
    return html.escape(str(s), quote=True)


def I(d, sw='1.8', vb='0 0 24 24'):
    return ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
            'stroke-width="%s" viewBox="%s">%s</svg>' % (sw, vb, d))


ARROW = I('<path d="M3 8h10M9 4l4 4-4 4"></path>', '2', '0 0 16 16')
PLUS = '<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"></path></svg>'
ICON = [
    I('<circle cx="11" cy="11" r="6.5"></circle><path d="M20 20l-4.2-4.2"></path>'),                      # vindbaar
    I('<path d="M4 14a8 8 0 0 1 16 0"></path><path d="M12 14l4-5"></path><circle cx="12" cy="14" r="1.2"></circle>'),  # snelheid
    I('<rect height="17" rx="2.5" width="11" x="6.5" y="3.5"></rect><path d="M10.5 17.5h3"></path>'),   # gsm
    I('<path d="M12 3.5l7 3v5c0 4.4-3 7.9-7 9-4-1.1-7-4.6-7-9v-5z"></path><path d="M9 12l2 2 4-4"></path>'),  # veiligheid
    I('<path d="M5 4.5h3.5l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z"></path>'),  # klanten
]


def sec_head(x, hid=None):
    return ('<div class="sec-head" data-reveal="">\n<span class="eyebrow">%s</span>\n<h2 class="h2"%s>%s<br/> <span class="grad">%s</span></h2>\n%s</div>'
            % (esc(x['eyebrow']), (' id="%s"' % hid) if hid else '', esc(x['h2a']), esc(x['h2b']),
               ('<p class="lead">%s</p>\n' % esc(x['lede'])) if x.get('lede') else ''))


def schema(L):
    m, slug = L['meta'], L['slug']
    base = SITE + slug
    return [
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE},
            {'@type': 'ListItem', 'position': 2, 'name': 'Websites', 'item': SITE + 'Websites'},
            {'@type': 'ListItem', 'position': 3, 'name': L['hero']['crumb'], 'item': base}]},
        {'@type': 'WebApplication', '@id': base + '#app', 'name': m['app'], 'url': base, 'description': m['appdesc'],
         'applicationCategory': 'BusinessApplication', 'operatingSystem': 'Alle (in de browser)', 'inLanguage': 'nl-BE',
         'isAccessibleForFree': True, 'browserRequirements': 'JavaScript',
         'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'EUR'},
         'provider': {'@id': SITE + '#business'}, 'image': SITE + m['ogimage']},
        {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': q['a']}}
                                            for q in L['faq']['items']]}]


def head(L, s):
    a = s.index('<div id="nav-mount"></div>') + len('<div id="nav-mount"></div>\n')
    hd = s[:a]
    m, slug = L['meta'], L['slug']
    own = SITE + slug
    hd, n = re.subn(r'<title>[^<]*</title>', '<title>%s</title>' % esc(m['title']), hd); assert n == 1
    for at in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        hd, n = re.subn(r'<meta content="[^"]*" %s/>' % re.escape(at), '<meta content="%s" %s/>' % (attr(m['desc']), at), hd); assert n == 1, at
    for at in ('property="og:title"', 'name="twitter:title"'):
        hd, n = re.subn(r'<meta content="[^"]*" %s/>' % re.escape(at), '<meta content="%s" %s/>' % (attr(m['ogtitle']), at), hd); assert n == 1, at
    for at in ('property="og:image"', 'name="twitter:image"'):
        hd, n = re.subn(r'<meta content="[^"]*" %s/>' % re.escape(at), '<meta content="%s" %s/>' % (attr(SITE + m['ogimage']), at), hd); assert n == 1, at
    links = ('<link href="%s" rel="canonical"/><link href="%s" hreflang="x-default" rel="alternate"/><link href="%s" hreflang="nl" rel="alternate"/>'
             % (own, own, own))
    hd, n = re.subn(r'<link href="[^"]*" rel="canonical"/>(<link href="[^"]*" hreflang="[^"]*" rel="alternate"/>)*', links, hd); assert n == 1
    hd, n = re.subn(r'<meta content="[^"]*" property="og:url"/>', '<meta content="%s" property="og:url"/>' % own, hd); assert n == 1
    # stijlbladen: home.css + v2-skin + website-scan.css (idempotent); geen heldenbeeld om vooraf te laden
    hd = re.sub(r'<link href="(pages|websites|website|home-redesign|eml-ai-team|branche|website-scan)\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n', '', hd)
    hd = re.sub(r'<link as="image"[^>]*data-br=""/>\n', '', hd)
    hc = re.search(r'<link href="home\.css\?v=[0-9a-z]+" rel="stylesheet"/>\n', hd)
    hd = hd[:hc.end()] + ('<link href="home-redesign.css?v=%s" rel="stylesheet"/>\n<link href="website-scan.css?v=%s" rel="stylesheet"/>\n'
                          % (V_SKIN, V_CSS)) + hd[hc.end():]
    assert hd.count('home-redesign.css') == 1 and hd.count('website-scan.css') == 1
    NOS = '<noscript><style>#loader{display:none!important}</style></noscript>\n'
    hd = hd.replace(NOS, '').replace('</head>', NOS + '</head>')
    body_tag = '<body data-lang-fallback="%s" data-page="scan" data-skin="v2" data-tone="blauw">' % attr(L['fallback'])  # data-page="scan": het menu-item Gratis website scan staat dan actief
    hd, n = re.subn(r'<body[^>]*>', body_tag, hd); assert n == 1
    hd = re.sub(r'\n<div aria-hidden="true" class="sky"[^>]*>.*?</div>', '', hd)
    keys = attr(json.dumps(L['skyKeys'], separators=(',', ':')))
    hd = hd.replace(body_tag, body_tag + '\n<div aria-hidden="true" class="sky" data-keys="%s" data-sky=""><i class="sky-a"></i><i class="sky-b"></i></div>' % keys)
    mm = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', hd, re.S)
    data = json.loads(mm.group(2))
    g = [x for x in data['@graph'] if x.get('@type') not in ('Service', 'FAQPage', 'BreadcrumbList', 'WebApplication')]
    assert len(g) == 1 and g[0].get('@id') == SITE + '#business'
    data['@graph'] = g + schema(L)
    return hd[:mm.start(2)] + json.dumps(data, ensure_ascii=False) + hd[mm.end(2):]


def body(L):
    h, rp, ck, ni, fq, ct, fm = L['hero'], L['rapport'], L['checken'], L['niet'], L['faq'], L['cta'], L['form']
    vb = h['voorbeeld']
    feiten = ''.join('<li>%s</li>' % esc(f) for f in h['feiten'])
    cats = ''.join('<li><span>%s</span><i style="--w:%d%%"></i><b>%d</b></li>' % (esc(c[0]), c[1], c[1]) for c in vb['cats'])
    hero = f'''<header class="sc-hero">
<div class="wrap sc-hero-grid">
<div class="sc-copy">
<nav aria-label="Kruimelpad" class="sc-crumb"><a href="./">Home</a> <span aria-hidden="true">/</span> <a href="Websites">Websites</a> <span aria-hidden="true">/</span> <span aria-current="page">{esc(h['crumb'])}</span></nav>
<span class="eyebrow">{esc(h['eyebrow'])}</span>
<h1 class="sc-h1">{esc(h['h1a'])}<br/> <span class="grad">{esc(h['h1b'])}</span></h1>
<p class="lead sc-lede">{esc(h['lede'])}</p>
<form action="#rapport" class="sc-form" data-sc-form="" method="get" novalidate="">
<label class="sc-label" for="sc-url">{esc(h['label'])}</label>
<div class="sc-field">
<input autocapitalize="off" autocomplete="url" class="sc-input" enterkeyhint="go" id="sc-url" inputmode="url" maxlength="500" name="url" placeholder="{attr(h['placeholder'])}" required="" spellcheck="false" type="text"/>
<button class="btn sc-go" data-bezig="{attr(h['bezig'])}" type="submit"><span class="sc-go-t">{esc(h['knop'])}</span> {ARROW}</button>
</div>
<p aria-live="polite" class="sc-status" data-sc-status="" role="status"></p>
</form>
<noscript><p class="sc-noscript">{esc(h['noscript'])} <a href="Contact">Plan een gratis gesprek</a></p></noscript>
<p class="sc-noot">{esc(h['noot'])}</p>
<ul class="sc-feiten">{feiten}</ul>
</div>
<figure aria-label="{attr(vb['titel'])}" class="sc-voorbeeld" data-sc-voorbeeld="">
<div class="sc-vb-top"><span class="sc-tag">{esc(vb['tag'])}</span><b>{esc(vb['titel'])}</b></div>
<div class="sc-vb-score"><div class="sc-dial" style="--s:{vb['score']}"><svg aria-hidden="true" viewBox="0 0 120 120"><circle class="sc-dial-bg" cx="60" cy="60" r="52"></circle><circle class="sc-dial-fg" cx="60" cy="60" pathLength="100" r="52"></circle></svg><span class="sc-dial-n">{vb['score']}<small>/100</small></span></div><p>{esc(vb['label'])}</p></div>
<ul class="sc-vb-cats">{cats}</ul>
<figcaption>{esc(vb['noot'])}</figcaption>
</figure>
</div>
</header>'''

    legende = ''.join('<li class="is-%s"><span aria-hidden="true" class="sc-dot"></span>%s</li>' % (attr(k), esc(t)) for k, t in rp['legende'])
    rapport = f'''<section aria-labelledby="sc-rapport-kop" class="sec sc-rapport" data-sc-rapport="" hidden="" id="rapport">
<div class="wrap">
<div class="sc-r-head">
<h2 class="h2" id="sc-rapport-kop" tabindex="-1">{esc(rp['kop'])}</h2>
<button class="btn-ghost sc-opnieuw" data-sc-opnieuw="" type="button">{esc(rp['opnieuw'])}</button>
</div>
<div data-sc-uitkomst=""></div>
<ul aria-label="Legende" class="sc-legende">{legende}</ul>
<p class="sc-jsnoot" data-sc-jsnoot="" hidden="">{esc(rp['jsnoot'])}</p>
<div class="sc-groepen" data-sc-groepen=""></div>
<section aria-labelledby="sc-plan-kop" class="sc-plan" data-sc-plan="">
<div class="sc-plan-head">
<h3 id="sc-plan-kop">{esc(rp['plan_kop'])}</h3>
<p>{esc(rp['plan_lede'])}</p>
</div>
<ol class="sc-plan-lijst" data-sc-plan-lijst=""></ol>
<div class="sc-slot" data-sc-slot="">
<p class="sc-slot-t">{esc(rp['plan_slot'])}</p>
<button class="btn" data-sc-toon-form="" type="button">{esc(rp['plan_knop'])} {ARROW}</button>
<div class="sc-form-box" data-sc-form-box="" hidden=""></div>
</div>
<p class="sc-klaar" data-sc-klaar="" hidden="" tabindex="-1">{esc(rp['plan_klaar'])}</p>
<div class="sc-gesprek">
<div><b>{esc(rp['gesprek_kop'])}</b><p>{esc(rp['gesprek_tekst'])}</p></div>
<a class="btn-ghost" data-book="" href="Contact">{esc(rp['gesprek_knop'])} {ARROW}</a>
</div>
</section>
</div>
</section>'''

    groepen = ''
    for i, g in enumerate(ck['groepen']):
        items = ''.join('<li>%s</li>' % esc(x) for x in g['items'])
        groepen += ('<article class="sc-check" data-reveal=""><span class="sc-check-ic">%s</span><h3>%s</h3><p>%s</p><ul>%s</ul></article>'
                    % (ICON[i % len(ICON)], esc(g['naam']), esc(g['tekst']), items))
    checken = f'''<section class="sec sc-checken" id="wat-we-checken">
<div class="wrap">
{sec_head(ck)}
<div class="sc-checks" data-reveal-group="">{groepen}</div>
</div>
</section>'''

    niets = ''.join('<li data-reveal=""><h3>%s</h3><p>%s</p></li>' % (esc(x[0]), esc(x[1])) for x in ni['items'])
    niet = f'''<section class="sec sc-niet" id="wat-de-scan-niet-doet">
<div class="wrap">
{sec_head(ni)}
<ul class="sc-niet-lijst">{niets}</ul>
</div>
</section>'''

    def antwoord(q):
        a = esc(q['a'])
        return a.replace('ons privacybeleid', '<a href="privacy">ons privacybeleid</a>')

    faqs = ''.join('<div class="faq-item"><button class="faq-q" type="button"><span class="sc-q">%s</span><span class="ic">%s</span></button>'
                   '<div class="faq-a"><div class="faq-a-inner">%s</div></div></div>' % (esc(q['q']), PLUS, antwoord(q)) for q in fq['items'])
    more = ' · '.join('<a href="%s">%s</a>' % (attr(m['href']), esc(m['t'])) for m in fq['meer'])
    faq = f'''<section class="sec sc-faq" id="faq">
<div class="wrap">
{sec_head(fq)}
<div class="faq-list" data-reveal="">{faqs}</div>
<p class="sc-more">{esc(fq['meer_label'])} {more}</p>
</div>
</section>'''
    badges = ''.join('<span>%s</span>' % esc(b) for b in ct['badges'])
    cta = f'''<section class="cta-band" id="contact">
<div class="glow"></div>
<div class="wrap">
<div class="cta-inner" data-reveal="">
<h2>{esc(ct['h2a'])} <span class="grad">{esc(ct['h2b'])}</span></h2>
<p class="lead">{esc(ct['tekst'])}</p>
<div class="row"><a class="btn" data-book="" href="Contact">{esc(ct['knop'])} {ARROW}</a><a class="btn-ghost" href="{attr(ct['knop2_href'])}">{esc(ct['knop2'])}</a></div>
<div class="badges">{badges}</div>
</div>
</div>
</section>'''

    cfg = {'formId': fm['ghl_form_id'], 'formName': fm['ghl_form_name'], 'query': fm['query'],
           'teksten': {k: rp[k] for k in ('uitleg_knop', 'plan_verborgen', 'plan_leeg')}}
    data = '<script id="scData" type="application/json">%s</script>' % json.dumps(cfg, ensure_ascii=False).replace('</', '<\\/')
    out = ('<main class="sc-main" id="main" tabindex="-1">\n' + '\n'.join([hero, rapport, checken, niet, faq, cta]) + '\n</main>\n' + data + '\n')
    assert '—' not in out and '–' not in out, 'gedachtestreepje in de tekst'
    low = out.lower()
    assert 'gohighlevel' not in low and 'ghl' not in re.sub(r'data-[a-z-]+|ghl_form', '', low), 'naam van het platform in de tekst'
    return out


def tail(footer):
    return f'''{footer}
<script src="i18n.js?v=20261103a"></script>
<script src="site.js?v={V_SITE}"></script>
<script src="fx.js?v={V_FX}"></script>
<script src="website-scan.js?v={V_JS}"></script>
</body>
</html>
'''


def build():
    L = json.load(io.open(os.path.join(HERE, 'nl.json'), encoding='utf-8'))
    path = L['slug'] + '.html'
    fresh = not os.path.exists(R + path)
    s = io.open(R + (TEMPLATE if fresh else path), encoding='utf-8').read()
    fm = re.search(r'<div id="footer-mount">.*?</div>(?=\s*<script)', s, re.S)
    out = head(L, s) + body(L) + tail(fm.group(0) if fm else '<div id="footer-mount"></div>')
    io.open(R + path, 'w', encoding='utf-8', newline='').write(out)
    print(path, 'nieuw' if fresh else 'ok', len(out))


if __name__ == '__main__':
    build()
