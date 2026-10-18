# HTML van een branchepagina ("Een dag in de zaak"). body(L) -> str
# Alle tekst komt uit <branche>.json; hier wordt niets verzonnen. Alles staat in de HTML en is zonder
# JavaScript leesbaar: de tijdlijn staat dan stil met alle momenten zichtbaar, de FAQ staat open.
# Geen eigen JavaScript: de tijdlijn speelt met CSS zodra site.js de klasse "in" zet (data-reveal).
import html, re


def esc(s):
    return html.escape(str(s), quote=False)


def attr(s):
    return html.escape(str(s), quote=True)


def I(d, sw='1.8', vb='0 0 24 24'):
    return ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
            'stroke-width="%s" viewBox="%s">%s</svg>' % (sw, vb, d))


ARROW = I('<path d="M3 8h10M9 4l4 4-4 4"></path>', '2', '0 0 16 16')
PLUS = '<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"></path></svg>'
ICON = {
    'boek': I('<rect height="15" rx="2.5" width="17" x="3.5" y="5"></rect><path d="M3.5 10h17M8 3v4M16 3v4"></path><path d="M9 15l2 2 4-4"></path>'),
    'herinner': I('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"></path><path d="M10 20.5a2 2 0 0 0 4 0"></path>'),
    'review': I('<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.5l-5.1 2.8 1.1-5.8-4.3-4 5.8-.7z"></path>'),
    'bel': I('<path d="M5 4.5h3.5l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z"></path>'),
    'chat': I('<path d="M4 5.5h16v10H9l-5 4z"></path><path d="M8 10h8"></path>'),
    'cadeau': I('<rect height="11" rx="1.5" width="16" x="4" y="9"></rect><path d="M3 9h18v3H3zM12 9v11"></path><path d="M12 9c-1.5-4-6-4-5-1s5 1 5 1zM12 9c1.5-4 6-4 5-1s-5 1-5 1z"></path>'),
    'betaal': I('<rect height="13" rx="2" width="18" x="3" y="5.5"></rect><path d="M3 10h18M7 15h4"></path>'),
    'vrij': I('<rect height="15" rx="2.5" width="17" x="3.5" y="5"></rect><path d="M3.5 10h17M8 3v4M16 3v4M9.5 13.5l5 5M14.5 13.5l-5 5"></path>'),
    'dag': I('<circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path>'),
}


def sec_head(x, hid=None):
    return ('<div class="sec-head" data-reveal="">\n<span class="eyebrow">%s</span>\n<h2 class="h2"%s>%s<br/> <span class="grad">%s</span></h2>\n%s</div>'
            % (esc(x['eyebrow']), (' id="%s"' % hid) if hid else '', esc(x['h2a']), esc(x['h2b']),
               ('<p class="lead">%s</p>\n' % esc(x['lede'])) if x.get('lede') else ''))


def link(l, cls='br-link'):
    ext = l['href'].startswith('http')
    return '<a class="%s" href="%s"%s>%s %s</a>' % (cls, attr(l['href']), ' rel="noopener" target="_blank"' if ext else '', esc(l['t']), ARROW)


def picture(im, base_cls, lazy):
    b = 'assets/werk/branche/' + im['base']
    return ('<img alt="%s" class="%s" decoding="async" height="900" %s sizes="%s" src="%s-1200.webp" srcset="%s-600.webp 600w, %s-1200.webp 1200w" width="1200"/>'
            % (attr(im['alt']), base_cls, 'loading="lazy"' if lazy else 'fetchpriority="high"', attr(im['sizes']), b, b, b))


def p_of(t):
    h, m = t.split(':')
    return max(0.0, min(1.0, (int(h) + int(m) / 60 - 8) / 14))


def body(L):
    h, dg, cs, bs, gs, ex, fq, ct = (L['hero'], L['dag'], L['case'], L['bouwstenen'], L['gesprek'], L['extra'], L['faq'], L['cta'])

    # ---------------- HERO ----------------
    feiten = ''.join('<li>%s</li>' % esc(f) for f in h['feiten'])
    tag = ('<span class="br-tag">%s</span>' % esc(h['img']['tag'])) if h['img'].get('tag') else ''
    hero = f'''<header class="br-hero">
<div class="wrap br-hero-grid">
<div class="br-copy">
<nav aria-label="Kruimelpad" class="br-crumb"><a href="./">Home</a> <span aria-hidden="true">/</span> <a href="Websites">Websites</a> <span aria-hidden="true">/</span> <span aria-current="page">{esc(h['crumb'])}</span></nav>
<span class="eyebrow">{esc(h['eyebrow'])}</span>
<h1 class="br-h1">{esc(h['h1a'])}<br/> <span class="grad">{esc(h['h1b'])}</span></h1>
<p class="lead br-lede">{esc(h['lede'])}</p>
<div class="br-cta"><a class="btn" data-book="" href="Contact">Plan een gratis demo {ARROW}</a><a class="btn-ghost" href="{attr(h['cta2_href'])}">{esc(h['cta2'])}</a></div>
<ul class="br-feiten">{feiten}</ul>
</div>
<figure class="br-fig">
<div class="br-frame">{tag}{picture(h['img'], 'br-img', False)}</div>
<figcaption>{esc(h['img']['cap'])}</figcaption>
</figure>
</div>
</header>'''

    # ---------------- EEN DAG IN DE ZAAK ----------------
    hours = ''.join('<span style="--p:%.4f">%02d:00</span>' % ((x - 8) / 14, x) for x in range(8, 23, 2))
    dots = ''.join('<i class="br-dot is-%s" style="--p:%.4f"></i>' % (attr(e['soort']), p_of(e['t'])) for e in dg['momenten'])
    evs = ''.join(
        '<li class="br-ev is-%s" style="--p:%.4f"><span class="br-ev-ic">%s</span><time>%s</time><b>%s</b><span class="br-ev-t">%s</span></li>'
        % (attr(e['soort']), p_of(e['t']), ICON.get(e['soort'], ICON['dag']), esc(e['t']), esc(e['kop']), esc(e['tekst']))
        for e in dg['momenten'])
    dag = f'''<section class="sec br-dagsec" id="dag">
<div class="wrap">
{sec_head(dg)}
<div class="br-day" data-reveal="">
<p class="br-day-top"><span class="br-tag">Voorbeeld</span> {esc(dg['label'])}</p>
<div aria-hidden="true" class="br-track"><i class="br-rail"></i><i class="br-prog"></i>{dots}<div class="br-hours">{hours}</div></div>
<ol class="br-evs">{evs}</ol>
<p class="br-day-note">{esc(dg['noot'])}</p>
</div>
</div>
</section>'''

    # ---------------- DE CASE (of de eerlijke demo) ----------------
    parts = []
    if cs.get('kaarten'):
        cards = ''
        for k in cs['kaarten']:
            beats = ''.join('<div class="br-beat"><dt>%s</dt><dd>%s</dd></div>' % (esc(b[0]), esc(b[1])) for b in k['beats'])
            links = ''.join(link(l) for l in k.get('links', []))
            cards += ('<article class="br-case" data-reveal=""><p class="br-case-where">%s</p><h3>%s</h3><dl class="br-beats">%s</dl><div class="br-links">%s</div></article>'
                      % (esc(k['waar']), esc(k['naam']), beats, links))
        parts.append('<div class="br-cases">%s</div>' % cards)
    if cs.get('cijfers'):
        st = ''.join('<li><b>%s</b><span>%s</span></li>' % (esc(c[0]), esc(c[1])) for c in cs['cijfers'])
        parts.append('<ul class="br-stats" data-reveal="">%s</ul>' % st)
        if cs.get('cijfers_noot'):
            parts.append('<p class="br-small">%s</p>' % esc(cs['cijfers_noot']))
    if cs.get('quote'):
        parts.append('<blockquote class="br-quote" data-reveal=""><p>&ldquo;%s&rdquo;</p><footer>%s</footer></blockquote>'
                     % (esc(cs['quote']['text']), esc(cs['quote']['cite'])))
    if cs.get('demo'):
        d = cs['demo']
        items = ''.join('<li><b>%s</b> %s</li>' % (esc(x[0]), esc(x[1])) for x in d['stappen'])
        parts.append('''<div class="br-demo" data-reveal="">
<figure class="br-demo-fig"><div class="br-frame"><span class="br-tag">Voorbeeld</span>%s</div><figcaption>%s</figcaption></figure>
<div class="br-demo-txt"><h3>%s</h3><ol class="br-flow">%s</ol>%s</div>
</div>''' % (picture(d['img'], 'br-img', True), esc(d['img']['cap']), esc(d['kop']), items, link(d['link'])))
    if cs.get('slot'):
        parts.append('<p class="br-case-slot">%s</p>' % esc(cs['slot']))
    if cs.get('links'):
        parts.append('<div class="br-links">%s</div>' % ''.join(link(l) for l in cs['links']))
    case = '''<section class="sec br-casesec" id="werk">
<div class="wrap">
%s
%s
</div>
</section>''' % (sec_head(cs), '\n'.join(parts))

    # ---------------- VIER BOUWSTENEN ----------------
    blocks = ''
    for i, b in enumerate(bs['items']):
        once = ('<span class="br-once">%s</span>' % esc(b['eenmalig'])) if b.get('eenmalig') else ''
        blocks += ('<article class="br-block" data-reveal=""><span aria-hidden="true" class="br-bnum">%02d</span><h3>%s</h3>'
                   '<p class="br-price"><b>%s</b> <small>%s</small>%s</p><p class="br-pnote">%s</p><p>%s</p>%s</article>'
                   % (i + 1, esc(b['naam']), esc(b['prijs']), esc(b['per']), once, esc(b['noot']), esc(b['tekst']), link(b['link'])))
    som = ''.join('<li><span>%s</span><b>%s</b></li>' % (esc(r[0]), esc(r[1])) for r in bs['som'])
    bouw = f'''<section class="sec br-bouw" id="bouwstenen">
<div class="wrap">
{sec_head(bs)}
<div class="br-blocks" data-reveal-group="">{blocks}</div>
<div class="br-sum" data-reveal=""><ul>{som}</ul><p>{esc(bs['voet'])}</p></div>
</div>
</section>'''

    # ---------------- VOORBEELDGESPREK ----------------
    WHO = {'ai': gs['wie_ai'], 'beller': gs['wie_beller']}
    lines = ''
    for r in gs['lijnen']:
        if r[0] == 'actie':
            lines += '<li class="br-line is-actie"><p>%s</p></li>' % esc(r[1])
        else:
            lines += '<li class="br-line is-%s"><span class="br-who">%s</span><p>%s</p></li>' % (r[0], esc(WHO[r[0]]), esc(r[1]))
    na = ''.join('<li>%s</li>' % esc(x) for x in gs['daarna'])
    niet = ''.join('<li>%s</li>' % esc(x) for x in gs['niet'])
    gesprek = f'''<section class="sec br-gsec" id="gesprek">
<div class="wrap">
{sec_head(gs)}
<div class="br-g-grid">
<div class="br-call" data-reveal="">
<div class="br-call-top"><span class="br-tag">Voorbeeld</span><b>{esc(gs['titel'])}</b><span>{esc(gs['sub'])}</span></div>
<ol class="br-lines">{lines}</ol>
</div>
<div class="br-g-side" data-reveal="">
<h3>{esc(gs['daarna_kop'])}</h3><ul class="br-checks">{na}</ul>
<h3>{esc(gs['niet_kop'])}</h3><ul class="br-nots">{niet}</ul>
{link(gs['link'])}
</div>
</div>
</div>
</section>'''

    # ---------------- EIGEN SECTIE PER BRANCHE ----------------
    paras = ''.join('<p>%s</p>' % esc(p) for p in ex.get('alineas', []))
    items = ''.join('<li data-reveal=""><h3>%s</h3><p>%s</p></li>' % (esc(x[0]), esc(x[1])) for x in ex.get('items', []))
    extra = f'''<section class="sec br-extra" id="{attr(ex['id'])}">
<div class="wrap">
{sec_head(ex)}
{('<div class="br-paras" data-reveal="">%s</div>' % paras) if paras else ''}
{('<ul class="br-items">%s</ul>' % items) if items else ''}
{('<p class="br-small">%s</p>' % esc(ex['noot'])) if ex.get('noot') else ''}
</div>
</section>'''

    # ---------------- FAQ + CTA ----------------
    faqs = ''.join('<div class="faq-item"><button class="faq-q" type="button"><span class="br-q">%s</span><span class="ic">%s</span></button>'
                   '<div class="faq-a"><div class="faq-a-inner">%s</div></div></div>' % (esc(q['q']), PLUS, esc(q['a'])) for q in fq['items'])
    more = ' · '.join('<a href="%s">%s</a>' % (attr(m['href']), esc(m['t'])) for m in fq['meer'])
    badges = ''.join('<span>%s</span>' % esc(b) for b in ct['badges'])
    faq = f'''<section class="sec br-faq" id="faq">
<div class="wrap">
{sec_head(fq)}
<div class="faq-list" data-reveal="">{faqs}</div>
<p class="br-more">{esc(fq['meer_label'])} {more}</p>
</div>
</section>'''
    cta = f'''<section class="cta-band" id="contact">
<div class="glow"></div>
<div class="wrap">
<div class="cta-inner" data-reveal="">
<h2>{esc(ct['h2a'])} <span class="grad">{esc(ct['h2b'])}</span></h2>
<p class="lead">{esc(ct['tekst'])}</p>
<div class="row"><a class="btn" data-book="" href="Contact">Plan een gratis demo {ARROW}</a><a class="btn-ghost" href="Gratis%20Demo">{esc(ct['demo'])}</a></div>
<p class="br-cta-links"><a href="Diensten">Alle diensten en prijzen</a> · <a href="Pakketkiezer">Pakketkiezer</a> · <a href="Gratis%20Demo">Gratis demo</a></p>
<div class="badges">{badges}</div>
</div>
</div>
</section>'''

    out = '<main class="br-main" id="main" tabindex="-1">\n' + '\n'.join([hero, dag, case, bouw, gesprek, extra, faq, cta]) + '\n</main>\n'
    assert '—' not in out and '–' not in out, 'gedachtestreepje in de tekst'
    return out
