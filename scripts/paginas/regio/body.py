# HTML van de regio- en stadspagina's ("De kaart"). body(L, C) -> str
# L = de json van de pagina (limburg.json of steden/<stad>.json), C = context uit build_regio.py:
#   C['klanten'] (klanten.json), C['steden'] (lijst van gebouwde stadspagina's), C['regio'] (de regiopagina), C['slug']
# De pagina bestaat uit een vaste hero met de kaart, daarna de secties in de volgorde van L['secties'],
# dan de FAQ en de slot-CTA. Elke sectie heeft een type: tekst, streken, case, tijdlijn, stappen, prijs, steden, buren.
# In lopende tekst mag [label](href) staan: dat wordt een link. In de FAQ telt voor het schema alleen het label.
import html, re
import kaart as K

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

LINK = re.compile(r'\[([^\]]+)\]\(([^)\s]+)\)')

def href(h):
    """interne links in nette vorm; externe links ongewijzigd"""
    return h

def rich(s):
    """tekst met [label](href) -> veilige HTML met links"""
    out, last = [], 0
    for m in LINK.finditer(s):
        out.append(esc(s[last:m.start()]))
        h = m.group(2)
        ext = h.startswith('http')
        out.append('<a class="rg-link" href="%s"%s>%s</a>' % (attr(h), ' rel="noopener" target="_blank"' if ext else '', esc(m.group(1))))
        last = m.end()
    out.append(esc(s[last:]))
    return ''.join(out)

def plain(s):
    """dezelfde tekst zonder linkopmaak (voor het schema)"""
    return LINK.sub(lambda m: m.group(1), s)

def I(d, sw='1.8', vb='0 0 24 24'):
    return ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
            'stroke-width="%s" viewBox="%s">%s</svg>' % (sw, vb, d))

ARROW = I('<path d="M3 8h10M9 4l4 4-4 4"></path>', '2', '0 0 16 16')
OUT = I('<path d="M6 3h7v7M13 3L5 11"></path>', '2', '0 0 16 16')
CHECK = I('<path d="M5 12.5l4.5 4.5L19 7.5"></path>', '2.2')
PLUS = '<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"></path></svg>'

def a_link(l, cls='rg-link'):
    h = l['href']
    if h.startswith('http'):
        return '<a class="%s" href="%s" rel="noopener" target="_blank">%s %s<span class="sr-only"> (opent in een nieuw venster)</span></a>' % (cls, attr(h), esc(l['label']), OUT)
    return '<a class="%s" href="%s">%s %s</a>' % (cls, attr(h), esc(l['label']), ARROW)

def links(ls, cls='rg-links'):
    if not ls:
        return ''
    return '<p class="%s">%s</p>' % (cls, ''.join(a_link(l) for l in ls))

def sec_head(s, center=False):
    lede = '<p class="lead">%s</p>' % rich(s['lede']) if s.get('lede') else ''
    h2b = ('<br/> <span class="grad">%s</span>' % esc(s['h2b'])) if s.get('h2b') else ''
    return ('<div class="sec-head%s" data-reveal="">\n<span class="eyebrow">%s</span>\n<h2 class="h2">%s%s</h2>\n%s</div>'
            % (' rg-center' if center else '', esc(s['eyebrow']), esc(s['h2a']), h2b, lede))

# ---------------- beelden ----------------
def shot(b, lazy=True):
    """schermafbeelding uit assets/werk in een venster (desk) of een gsm (gsm)"""
    ld = ' loading="lazy"' if lazy else ''
    srcset = (' srcset="%s" sizes="%s"' % (attr(b['srcset']), attr(b.get('sizes', '(max-width: 760px) 92vw, 560px')))) if b.get('srcset') else ''
    img = '<img alt="%s" decoding="async" height="%d"%s src="%s"%s width="%d"/>' % (attr(b['alt']), b['h'], ld, attr(b['src']), srcset, b['w'])
    if b.get('vorm') == 'gsm':
        return '<figure class="rg-shot is-gsm"><div class="rg-gsm">%s</div></figure>' % img
    dom = '<div aria-hidden="true" class="rg-addr"><i></i><i></i><i></i><span>%s</span></div>' % esc(b.get('domein', '')) if b.get('domein') else ''
    return '<figure class="rg-shot is-desk"><div class="rg-win">%s<div class="rg-win-v">%s</div></div></figure>' % (dom, img)

def svg_inline(alt):
    """de kaart uit assets/kaart-limburg.svg, inline in de pagina (geen extra verzoek, en geen beeld dat de LCP ophoudt)"""
    import io, os, re
    src = io.open(os.path.join(K.R, K.SVG), encoding='utf-8').read().strip()
    src = re.sub(r'<title id="t">.*?</title>\n?', '', src)
    src = src.replace('aria-labelledby="t"', 'aria-label="%s"' % attr(alt))
    src = src.replace('xmlns="http://www.w3.org/2000/svg" ', '').replace(' width="%d" height="%d"' % (K.W, K.H), '')
    src = src.replace('id="f"', 'id="rgKf"').replace('url(#f)', 'url(#rgKf)')
    return src.replace('<svg ', '<svg class="rg-map-img" focusable="false" ', 1)

# ---------------- de kaart ----------------
def kaart(L, C):
    kd = L['kaart']
    KL = C['klanten']
    zs = kd.get('zoom', 1)
    fx, fy = K.pos(kd['focus']) if kd.get('focus') else (50, 50)
    if zs == 1:
        fx, fy = 50, 50
    over = []
    for s in kd.get('streken', []):
        x, y = K.pos(s['plaats'])
        over.append('<span aria-hidden="true" class="rg-streek" style="left:%.2f%%;top:%.2f%%">%s</span>' % (x, y, esc(s['t'])))
    # plaatsen met een klantpunt: het label schuift rechts van het punt
    bezet = {KL[p if isinstance(p, str) else p['klant']]['plaats'] for p in kd['punten']}
    for st in kd.get('steden', []):
        x, y = K.pos(K.PLAATS[st])
        naam = C['plaatsnamen'].get(st, st.title())
        on = (' is-focus' if st == L.get('plaats') else '') + (' has-pt' if st in bezet else '')
        over.append('<span aria-hidden="true" class="rg-stad%s" style="left:%.2f%%;top:%.2f%%"><i></i>%s</span>' % (on, x, y, esc(naam)))
    pts, legend = [], []
    n = 0
    for p in kd['punten']:
        p = p if isinstance(p, dict) else {'klant': p}
        k = KL[p['klant']]
        x, y = K.pos(K.PLAATS[k['plaats']])
        thuis = p['klant'] == 'thuis'
        if not thuis:
            n += 1
        lab = 'EM' if thuis else str(n)
        pts.append('<span aria-hidden="true" class="rg-pt%s" data-rg-pt="%s" style="left:%.2f%%;top:%.2f%%;--dx:%dpx;--dy:%dpx"><b>%s</b></span>'
                   % (' is-thuis' if thuis else '', p['klant'], x, y, k.get('dx', 0), k.get('dy', 0), lab))
        naam = '<b>%s</b>' % esc(k['naam'])
        if p.get('href'):
            naam = '<a href="%s">%s</a>' % (attr(p['href']), naam)
        legend.append('<li data-rg-li="%s"><span aria-hidden="true" class="rg-num%s">%s</span><span class="rg-lt">%s <span class="rg-lg">%s</span><small>%s</small></span></li>'
                      % (p['klant'], ' is-thuis' if thuis else '', lab, naam, esc(k['gemeente']), esc(p.get('soort', k['soort']))))
    style = '--zs:%s;--zx:%.2f%%;--zy:%.2f%%' % (zs, fx, fy)
    return f'''<figure class="rg-kaart{' is-zoom' if zs != 1 else ''}" data-rg-kaart="" style="{style}">
<div class="rg-map"><div class="rg-map-in">
{svg_inline(kd['alt'])}
{''.join(over)}
{''.join(pts)}
</div></div>
<figcaption class="rg-cap">
<p class="rg-cap-t">{esc(kd['titel'])}</p>
<ol class="rg-legend">{''.join(legend)}</ol>
<p class="rg-cap-n">{esc(kd['bijschrift'])}</p>
</figcaption>
</figure>'''

# ---------------- secties ----------------
def s_tekst(s, C):
    paras = ''.join('<p>%s</p>' % rich(a) for a in s.get('alineas', []))
    lijst = ''
    if s.get('lijst'):
        lijst = '<ul class="rg-list">%s</ul>' % ''.join('<li>%s<span>%s</span></li>' % (CHECK, rich(x)) for x in s['lijst'])
    side = ''
    if s.get('beeld'):
        side = '<div class="rg-side">%s</div>' % shot(s['beeld'])
    elif s.get('kader'):
        kd = s['kader']
        side = '<aside class="rg-kader"><p class="rg-k">%s</p>%s</aside>' % (esc(kd['k']), ''.join('<p>%s</p>' % rich(x) for x in kd['tekst']))
    grid = ' rg-split' if side else ''
    return f'''{sec_head(s)}
<div class="rg-body{grid}"><div class="rg-txt">{paras}{lijst}{links(s.get('links'))}</div>{side}</div>'''

def s_streken(s, C):
    KL = C['klanten']
    out = []
    for st in s['streken']:
        cases = []
        for it in st['klanten']:
            k = KL[it['klant']]
            ls = list(it.get('links', []))
            stad = C['stad_van'].get(k['plaats'])
            if stad and stad['slug'] != C['slug']:
                ls.append({'label': 'Website laten maken in %s' % stad['naam'], 'href': 'website-laten-maken-' + stad['slug']})
            cases.append('<article class="rg-case" id="k-%s">%s<div class="rg-case-t"><p class="rg-k">%s · %s</p><h4>%s</h4><p>%s</p>%s</div></article>'
                         % (it['klant'], shot(it['beeld']), esc(k['gemeente']), esc(k['soort']), esc(k['naam']), rich(it['tekst']), links(ls)))
        out.append('<div class="rg-streek-blk" id="%s"><h3 class="rg-h3">%s <small>%s</small></h3><div class="rg-cases">%s</div></div>'
                   % (attr(st['id']), esc(st['naam']), esc(st['sub']), ''.join(cases)))
    return sec_head(s) + '\n' + ''.join(out)

def s_case(s, C):
    paras = ''.join('<p>%s</p>' % rich(a) for a in s['alineas'])
    nums = ''
    if s.get('cijfers'):
        c = s['cijfers']
        nums = ('<div class="rg-nums">%s</div><p class="rg-note">%s</p>'
                % (''.join('<div><b>%s</b><span>%s</span></div>' % (esc(a), esc(b)) for a, b in c['rijen']), esc(c['noot'])))
    quote = ''
    if s.get('citaat'):
        q = s['citaat']
        quote = '<blockquote class="rg-quote"><p>“%s”</p><cite>%s</cite></blockquote>' % (esc(q['tekst']), esc(q['wie']))
    return f'''{sec_head(s)}
<div class="rg-body rg-split is-case"><div class="rg-txt">{paras}{links(s.get('links'))}</div><div class="rg-side">{shot(s['beeld'])}</div></div>
{nums}{quote}'''

def s_tijdlijn(s, C):
    items = ''.join('<li><span class="rg-tl-t">%s</span><p>%s</p></li>' % (esc(t), rich(x)) for t, x in s['items'])
    paras = ''.join('<p>%s</p>' % rich(a) for a in s.get('alineas', []))
    return f'''{sec_head(s)}
<ol class="rg-tl" data-reveal-group="">{items}</ol>
{('<div class="rg-txt rg-after">%s</div>' % paras) if paras else ''}'''

def s_stappen(s, C):
    items = ''.join('<li class="rg-step" data-reveal=""><span class="rg-snum">%02d</span><h3>%s</h3><p>%s</p></li>' % (i + 1, esc(t), rich(x))
                    for i, (t, x) in enumerate(s['items']))
    return f'''{sec_head(s)}
<ol class="rg-steps">{items}</ol>'''

def s_prijs(s, C):
    rows = ''.join('<li>%s<span>%s</span></li>' % (CHECK, rich(r)) for r in s['rijen'])
    return f'''{sec_head(s)}
<div class="rg-prijs">
<div class="rg-pcard"><p class="rg-k">{esc(s['pakket'])}</p><p class="rg-bedrag"><b>€150</b><span>{esc(s['per'])}</span></p><p class="rg-pvw">{esc(s['voorwaarden'])}</p></div>
<div class="rg-prows"><ul class="rg-list">{rows}</ul><p class="rg-extra">{rich(s['extra'])}</p>{links(s.get('links'))}</div>
</div>'''

def s_steden(s, C):
    ls = [x for x in C['steden'] if x['slug'] != C['slug']]
    if not ls:
        return ''
    items = ''.join('<li><a class="rg-stadlink" href="website-laten-maken-%s"><b>%s</b><span>%s</span>%s</a></li>'
                    % (x['slug'], esc(x['naam']), esc(x['kort']), ARROW) for x in ls)
    return f'''{sec_head(s)}
<ul class="rg-steden">{items}</ul>'''

def s_buren(s, C):
    r = C['regio']
    others = [x for x in C['steden'] if x['slug'] != C['slug']]
    items = '<li><a class="rg-stadlink is-regio" href="website-laten-maken-%s"><b>%s</b><span>%s</span>%s</a></li>' % (r['slug'], esc(r['naam']), esc(s['regio_kort']), ARROW)
    items += ''.join('<li><a class="rg-stadlink" href="website-laten-maken-%s"><b>%s</b><span>%s</span>%s</a></li>'
                     % (x['slug'], esc(x['naam']), esc(x['kort']), ARROW) for x in others)
    paras = ''.join('<p>%s</p>' % rich(a) for a in s.get('alineas', []))
    return f'''{sec_head(s)}
{('<div class="rg-txt">%s</div>' % paras) if paras else ''}
<ul class="rg-steden">{items}</ul>'''

TYPES = {'tekst': s_tekst, 'streken': s_streken, 'case': s_case, 'tijdlijn': s_tijdlijn, 'stappen': s_stappen,
         'prijs': s_prijs, 'steden': s_steden, 'buren': s_buren}

def body(L, C):
    h, fq, ct = L['hero'], L['faq'], L['cta']
    crumbs = '<a href="Websites">Websites</a> <span>/</span> '
    if L['type'] == 'stad':
        crumbs += '<a href="website-laten-maken-%s">%s</a> <span>/</span> ' % (C['regio']['slug'], esc(C['regio']['naam']))
    crumbs += '<span aria-current="page">%s</span>' % esc(L['crumb'])
    foot = ''.join('<span>%s</span>' % esc(f) for f in h['feiten'])
    secs = []
    for s in L['secties']:
        inner = TYPES[s['type']](s, C)
        if not inner:
            continue
        secs.append('<!-- ════════ %s ════════ -->\n<section class="sec rg-sec rg-s-%s" id="%s">\n<div class="wrap">\n%s\n</div>\n</section>'
                    % (s['id'].upper(), s['type'], attr(s['id']), inner))
    faqs = ''.join('<div class="faq-item"><button class="faq-q" type="button"><span class="rg-q">%s</span><span class="ic">%s</span></button><div class="faq-a"><div class="faq-a-inner">%s</div></div></div>'
                   % (esc(q['q']), PLUS, rich(q['a'])) for q in fq['items'])
    badges = ''.join('<span>%s</span>' % esc(b) for b in ct['badges'])
    nl = '\n'
    return f'''<script>document.documentElement.classList.add('rg-js')</script>
<main class="rg-main" id="main" tabindex="-1">
<!-- ════════ HERO: de kaart ════════ -->
<header class="rg-hero">
<div class="wrap rg-hero-grid">
<div class="rg-copy">
<nav aria-label="Kruimelpad" class="rg-crumb">{crumbs}</nav>
<span class="eyebrow">{esc(h['eyebrow'])}</span>
<h1 class="rg-h1">{esc(h['h1a'])}<br/> <span class="grad">{esc(h['h1b'])}</span></h1>
<p class="lead rg-lede">{rich(h['lede'])}</p>
<div class="rg-cta"><a class="btn" data-book="" href="Contact">{esc(h['cta'])} {ARROW}</a><a class="btn-ghost" href="{attr(h['cta2_href'])}">{esc(h['cta2'])}</a></div>
</div>
<div class="rg-mapcol">
{kaart(L, C)}
</div>
</div>
<div class="wrap"><div class="rg-foot">{foot}</div></div>
</header>
{nl.join(secs)}
<!-- ════════ FAQ ════════ -->
<section class="sec rg-sec rg-faq" id="faq">
<div class="wrap">
{sec_head(fq)}
<div class="faq-list" data-reveal="">{faqs}</div>
</div>
</section>
<!-- ════════ CTA ════════ -->
<section class="cta-band" id="contact">
<div class="glow"></div>
<div class="wrap">
<div class="cta-inner" data-reveal="">
<h2>{esc(ct['h2a'])} <span class="grad">{esc(ct['h2b'])}</span></h2>
<p class="lead">{rich(ct['text'])}</p>
<div class="row"><a class="btn" data-book="" href="Contact">{esc(ct['btn'])} {ARROW}</a><a class="btn-ghost" href="{attr(ct['demo_href'])}">{esc(ct['demo'])}</a></div>
<div class="badges">{badges}</div>
</div>
</div>
</section>
</main>
'''
