# HTML van de Portfolio-pagina ("Door het venster"). body(L, lang, pre) -> str
# Het is blauw uur: bij vier zaken brandt het licht en je kijkt binnen. Het hero-venster
# laat de nieuwe amakhosi.be traag doorscrollen (pure CSS, pauzeerbaar via checkbox + label);
# de andere zaken staan als open composities op de lichtlaag, elk met een naambordje.
import html, re, os

HERE = os.path.dirname(os.path.abspath(__file__))
WERK = os.path.abspath(os.path.join(HERE, '..', '..', '..', 'assets', 'werk'))

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def fill(s, v):
    return re.sub(r'\{(\w+)\}', lambda m: str(v.get(m.group(1), m.group(0))), s)

def I(d, sw='2', vb='0 0 16 16'):
    return ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
            'stroke-width="%s" viewBox="%s">%s</svg>' % (sw, vb, d))

ARROW = I('<path d="M3 8h10M9 4l4 4-4 4"></path>')
OUT = I('<path d="M6 3h7v7M13 3L5 11"></path>')

def dims(name):
    """breedte en hoogte van een webp in assets/werk (zodat de HTML nooit verkeerde maten krijgt)"""
    from PIL import Image
    with Image.open(os.path.join(WERK, name)) as im:
        return im.size

def ext_link(href, label, newtab, cls='pf-open'):
    return '<a class="%s" href="%s" rel="noopener" target="_blank">%s %s<span class="sr-only"> %s</span></a>' % (cls, attr(href), esc(label), OUT, esc(newtab))

def venster(src, gsm, A, alt, extra='', lazy=True):
    """een raam met daarin een lange schermafbeelding; op gsm de gsm-opname"""
    w, h = dims(src)
    gw, gh = dims(gsm)
    load = ' loading="lazy"' if lazy else ' fetchpriority="high"'
    return (f'<div class="pf-venster is-stil"{extra}><div class="pf-glas"><picture><source media="(max-width:760px)" srcset="{A}{gsm}" width="{gw}" height="{gh}"/>'
            f'<img alt="{attr(alt)}" class="pf-lang" decoding="async" height="{h}"{load} src="{A}{src}" width="{w}"/></picture><i aria-hidden="true" class="pf-ruit"></i></div></div>')

def naambord(c, lb, newtab):
    logo = ''
    if c.get('logo'):
        lg = c['logo']
        logo = ('<span class="pf-naambord-logo%s"><img alt="%s" height="%d" loading="lazy" src="%s" width="%d"/></span>'
                % (' is-dark' if lg.get('dark') else '', attr(lg['alt']), lg['h'], attr(lg['src']), lg['w']))
    return (f'<div class="pf-naambord">{logo}<dl>'
            f'<dt class="sr-only">{esc(lb["zaak"])}</dt><dd>{esc(c["soort"])}</dd>'
            f'<dt>{esc(lb["gemaakt"])}</dt><dd class="pf-nb-mono">{esc(c["gemaakt"])}</dd>'
            f'<dt class="sr-only">{esc(lb["website"])}</dt><dd>{ext_link(c["url"], c["domein"], newtab, "pf-nb-link")}</dd>'
            f'</dl></div>')

def beats(items):
    return '<dl class="pf-beats">' + ''.join('<dt>%s</dt><dd>%s</dd>' % (esc(a), esc(b)) for a, b in items) + '</dl>'

def index_line(c):
    pre, b, post = c['index']
    mid = ' · <b>%s</b>' % esc(b) if b else ''
    return '<p class="pf-index">%s%s · %s</p>' % (esc(pre), mid, esc(post))

def body(L, lang, pre):
    h, lb, C, E, ct = L['hero'], L['labels'], L['cases'], L['eerlijk'], L['cta']
    rel = '' if lang == 'nl' else '../'
    A = rel + 'assets/werk/'
    nt = lb['newtab']
    a0 = C[0]
    lw, lh = dims(h['img']['lang']); gw, gh = dims(h['img']['glang'])

    spring = ''.join('<a href="#%s">%s</a>' % (c['id'], esc(c['naam'])) for c in C)
    caps = ''.join('<li>%s</li>' % esc(t) for t in h['caps'])
    feiten = ''.join('<span>%s</span>' % esc(f) for f in h['feiten'])

    # ---------------- HERO: het venster ----------------
    hero = f'''<!-- ════════ HERO: door het venster ════════ -->
<header class="pf-hero" id="main" tabindex="-1">
<div class="wrap pf-hero-grid">
<div class="pf-copy" data-reveal="">
<span class="eyebrow">{esc(h['eyebrow'])}</span>
<h1 class="pf-h1">{esc(h['h1a'])} <span class="grad">{esc(h['h1b'])}</span></h1>
<p class="lead pf-lede">{esc(h['lede'])}</p>
<nav aria-label="{attr(h['spring_label'])}" class="pf-spring">{spring}</nav>
<p class="pf-feiten">{feiten}</p>
</div>
<div class="pf-venster-blok" data-pf-blok="">
<input class="pf-pauze-in" id="pfPauze" type="checkbox"/>
<div class="pf-venster">
<div aria-label="{attr(h['glas_aria'])}" class="pf-glas" role="img"><picture><source media="(max-width:760px)" srcset="{A}{h['img']['glang']}" width="{gw}" height="{gh}"/><img alt="" class="pf-lang" decoding="async" fetchpriority="high" height="{lh}" src="{A}{h['img']['lang']}" width="{lw}"/></picture><i aria-hidden="true" class="pf-ruit"></i></div>
<div aria-hidden="true" class="pf-gsm"><img alt="" class="pf-lang" decoding="async" height="{gh}" loading="lazy" src="{A}{h['img']['glang']}" width="{gw}"/><i class="pf-ruit"></i></div>
<ul aria-label="{attr(h['caps_label'])}" class="pf-bijschriften">{caps}</ul>
</div>
<div class="pf-venster-rij">
<span class="pf-domein"><i aria-hidden="true" class="pf-dot"></i>{esc(a0['domein'])} · {esc(h['live'])}</span>
<label class="pf-pauze" for="pfPauze"><span aria-hidden="true" class="is-aan">{esc(h['pauze'])}</span><span aria-hidden="true" class="is-uit">{esc(h['verder'])}</span><span class="sr-only">{esc(h['pauze_sr'])}</span></label>
{ext_link(a0['url'], fill(h['open'], {'d': a0['domein']}), nt)}
</div>
</div>
</div>
<section aria-labelledby="pfH2-{a0['id']}" class="pf-hero-voet pf-zaak-01" id="{a0['id']}">
<div class="wrap pf-voet-grid" data-reveal="">
<div class="pf-voet-kol">
{index_line(a0)}
<h2 class="pf-h2" id="pfH2-{a0['id']}">{esc(a0['naam'])}</h2>
<p class="pf-kop">{esc(a0['kop_a'])} <span class="grad">{esc(a0['kop_b'])}</span></p>
{naambord(a0, lb, nt)}
</div>
<div class="pf-voet-kol">{beats(a0['beats'][:2])}</div>
<div class="pf-voet-kol">{beats(a0['beats'][2:])}{ext_link(a0['url'], fill(lb['open'], {'d': a0['domein']}), nt, 'btn-ghost pf-ghost')}</div>
</div>
</section>
</header>
'''

    # ---------------- CASES 02 tot 04 ----------------
    secs = []
    for c in C[1:]:
        extra = ''
        if c.get('schema'):
            extra = '<p class="pf-schema">' + '<i aria-hidden="true" class="pf-pijl"></i>'.join('<span>%s</span>' % esc(x) for x in c['schema']) + '</p>'
        if c.get('producten'):
            extra = '<p class="pf-producten">' + ' · '.join(esc(x) for x in c['producten']) + '</p>'
        link = ''
        if c.get('case'):
            link = '<a class="btn-ghost pf-ghost" href="%s%s">%s %s</a>' % (rel, c['case'], esc(lb['case_link']), ARROW)
        meet = ''
        if c.get('meet'):
            cells = ''.join('<div><dd>%s</dd><dt>%s</dt></div>' % (esc(n), esc(l)) for n, l in c['meet'])
            meet = '<dl class="pf-meet">%s</dl><p class="pf-meet-noot">%s</p>' % (cells, esc(c['meet_noot']))
        quote = ''
        if c.get('quote'):
            quote = '<figure class="pf-citaat"><blockquote><p>%s</p></blockquote><figcaption>%s</figcaption></figure>' % (esc(c['quote']['text']), esc(c['quote']['cite']))
        secs.append(f'''<!-- ════════ {c['naam'].upper()} ════════ -->
<section aria-labelledby="pfH2-{c['id']}" class="pf-zaak is-{c['side']}" id="{c['id']}">
<div class="wrap pf-zaak-grid" data-reveal="">
<figure class="pf-zaak-venster">
{venster(c['slug'] + '-lang-1200.webp', c['slug'] + '-gsm-780.webp', A, c['alt'])}
<figcaption class="pf-onder">{esc(fill(lb['shot'], {'d': c['domein']}))}</figcaption>
</figure>
<div class="pf-zaak-tekst">
{index_line(c)}
<h2 class="pf-h2" id="pfH2-{c['id']}">{esc(c['naam'])}</h2>
<p class="pf-kop">{esc(c['kop_a'])} <span class="grad">{esc(c['kop_b'])}</span></p>
{naambord(c, lb, nt)}
{beats(c['beats'])}
{extra}
</div>
{meet}
{quote}
{('<div class="pf-zaak-link">' + link + '</div>') if link else ''}
</div>
</section>
''')

    badges = ''.join('<span>%s</span>' % esc(b) for b in ct['badges'])
    return hero + ''.join(secs) + f'''<!-- ════════ EERLIJK ════════ -->
<section class="pf-eerlijk">
<div class="wrap"><div class="pf-eerlijk-in" data-reveal=""><p>{esc(E['text'])}</p><span>{esc(E['sub'])}</span></div></div>
</section>
<!-- ════════ CTA ════════ -->
<section class="cta-band" id="contact">
<canvas aria-hidden="true" class="starfield" data-stars=""></canvas>
<div class="glow"></div>
<div class="wrap">
<div class="cta-inner" data-reveal="">
<h2>{esc(ct['h2a'])} <span class="grad">{esc(ct['h2b'])}</span></h2>
<p class="lead">{esc(ct['text'])}</p>
<div class="row"><a class="btn" data-book="" href="{rel}Contact">{esc(ct['btn'])} {ARROW}</a></div>
<div class="badges">{badges}</div>
</div>
</div>
</section>
'''
