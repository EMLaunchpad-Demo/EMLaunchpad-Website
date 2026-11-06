# HTML van de Websites-pagina ("Blauwdruk"). body(L, lang, pre, sites) -> str
# Eén bewegend object: de bouwtafel in de hero. Een echte klantensite tekent zich als blauwdruk
# (vakken opgemeten op de live pagina, sites.json), wordt ingekleurd en verschijnt op de gsm.
# Zonder JavaScript en bij minder beweging staat alles meteen in de eindstand.
import json, html, re

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def I(d, sw='1.8', vb='0 0 24 24'):
    return ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
            'stroke-width="%s" viewBox="%s">%s</svg>' % (sw, vb, d))

ARROW = I('<path d="M3 8h10M9 4l4 4-4 4"></path>', '2', '0 0 16 16')
DOWN = I('<path d="M8 3v10M4 9l4 4 4-4"></path>', '2', '0 0 16 16')
OUT = I('<path d="M6 3h7v7M13 3L5 11"></path>', '2', '0 0 16 16')
LOCK = I('<rect x="4.5" y="7" width="7" height="6" rx="1.4"></rect><path d="M6 7V5.6a2 2 0 0 1 4 0V7"></path>', '1.6', '0 0 16 16')
CHECK = I('<path d="M5 12.5l4.5 4.5L19 7.5"></path>', '2.4')
PLAY = ('<svg aria-hidden="true" viewBox="0 0 24 24"><path class="i-play" d="M8 5.5v13l10.5-6.5z" fill="currentColor"></path>'
        '<g class="i-pause" fill="currentColor"><rect height="13" rx="1.2" width="3.6" x="6.6" y="5.5"></rect><rect height="13" rx="1.2" width="3.6" x="13.8" y="5.5"></rect></g></svg>')
AGAIN = I('<path d="M4 12a8 8 0 1 0 2.4-5.7"></path><path d="M4 4.5v4h4"></path>', '2')
GRIP = I('<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"></path>', '2')
DESK = I('<rect x="3" y="4.5" width="18" height="12" rx="1.6"></rect><path d="M9 20h6M12 16.5V20"></path>', '1.7')
GSM = I('<rect x="7" y="2.8" width="10" height="18.4" rx="2.2"></rect><path d="M11 18h2"></path>', '1.7')

DIM = {'desk': (1440, 900), 'gsm': (390, 844)}

def fill(s, v):
    return re.sub(r'\{(\w+)\}', lambda m: str(v.get(m.group(1), m.group(0))), s)

def bp_svg(boxes, mode, labels, cls='ws-bp'):
    """blauwdruk: de vakken van het eerste scherm als lijntekening (aria-hidden).
    Elk vak is een pad met pathLength=1, zodat CSS het kan laten tekenen; foto's krijgen een kruis."""
    W, H = DIM[mode]
    fs = 21 if mode == 'desk' else 17
    out = []
    for i, b in enumerate(boxes):
        x, y, w, h = b['x'] * W / 100, b['y'] * H / 100, b['w'] * W / 100, b['h'] * H / 100
        if w < 4 or h < 4:
            continue
        d = 'M%.1f %.1fh%.1fv%.1fh%.1fZ' % (x, y, w, h, -w)
        k = b['k']
        out.append('<path class="k-%s" d="%s" pathLength="1" style="--i:%d"></path>' % (k, d, i))
        if k == 'foto':
            out.append('<path class="k-x" d="M%.1f %.1fL%.1f %.1fM%.1f %.1fL%.1f %.1f" pathLength="1" style="--i:%d"></path>'
                       % (x, y, x + w, y + h, x + w, y, x, y + h, i))
        lab = labels.get(k, '')
        if lab and w > fs * 2.6 and h > fs * 1.1:
            out.append('<text style="--i:%d" x="%.1f" y="%.1f">%s</text>' % (i, x + 8, y + fs + 4 if h > fs * 1.8 else y + h - 4, esc(lab)))
    return ('<svg aria-hidden="true" class="%s" focusable="false" preserveAspectRatio="none" viewBox="0 0 %d %d" style="--fs:%dpx">%s</svg>'
            % (cls, W, H, fs, ''.join(out)))

def img_desk(rel, sid, alt, cls, eager=False, sizes='(max-width: 760px) 92vw, (max-width: 1180px) 56vw, 680px'):
    return ('<img alt="%s" class="%s" decoding="async" height="900"%s sizes="%s" src="%sassets/werk/websites/%s-desk-960.webp" '
            'srcset="%sassets/werk/websites/%s-desk-960.webp 960w, %sassets/werk/websites/%s-desk-1440.webp 1440w" width="1440"/>'
            % (attr(alt), cls, ' fetchpriority="high"' if eager else ' loading="lazy"', sizes, rel, sid, rel, sid, rel, sid))

def img_gsm(rel, sid, alt, cls, sizes, lazy=True):
    return ('<img alt="%s" class="%s" decoding="async" height="1688"%s sizes="%s" src="%sassets/werk/websites/%s-gsm-390.webp" '
            'srcset="%sassets/werk/websites/%s-gsm-390.webp 390w, %sassets/werk/websites/%s-gsm-780.webp 780w" width="780"/>'
            % (attr(alt), cls, ' loading="lazy"' if lazy else '', sizes, rel, sid, rel, sid, rel, sid))

def body(L, lang, pre, SITES):
    h, u, dt, pf, wk, mt, pr, st, fq, ct = (L['hero'], L['ui'], L['doet'], L['platform'], L['werk'], L['meet'],
                                            L['prijs'], L['stappen'], L['faq'], L['cta'])
    rel = '' if lang == 'nl' else '../'
    eur = (lambda n: '%s €' % n) if lang == 'fr' else (lambda n: '€%s' % n)
    labels = u['labels']
    sites = L['sites']
    s0 = sites[0]
    B = lambda sid: SITES[sid]

    def link(href, text, extra=''):
        if href.startswith('#'):
            return '<a class="ws-link"%s href="%s">%s %s</a>' % (extra, href, esc(text), ARROW)
        return '<a class="ws-link"%s href="%s%s">%s %s</a>' % (extra, rel, href, esc(text), ARROW)

    def ext(url, text):
        return '<a class="ws-link" href="%s" rel="noopener" target="_blank">%s %s<span class="sr-only"> %s</span></a>' % (attr(url), esc(text), OUT, esc(u['newtab']))

    # ═════════════════ HERO ═════════════════
    lede = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', lambda m: '<a href="%s%s">%s</a>' % (rel, m.group(2), m.group(1)), esc(h['lede']))
    facts = ''.join('<li><span class="ws-vink">%s</span>%s</li>' % (CHECK, esc(f)) for f in h['foot'])
    stages = ''.join('<span class="s%d">%s%s</span>' % (i, '<i></i>' if i == 3 else '', esc(s)) for i, s in enumerate(h['stages']))
    who = ''.join('<button aria-pressed="%s" class="ws-who-b" data-ws-who="%d" type="button"><span>%s</span><i aria-hidden="true"></i></button>'
                  % ('true' if i == 0 else 'false', i, esc(s['domein'])) for i, s in enumerate(sites))

    # ═════════════════ DOET: anatomie op een echte gsm ═════════════════
    an_site = 'clinic3d'
    an_parts = {'gevonden': 'titel', 'vertrouwen': 'foto', 'boeken': 'knop', 'alles': 'scherm'}
    def an_item(i, x):
        more = ('<a class="ws-an-more" href="#platform">%s %s</a>' % (esc(dt['more']), DOWN)) if x['id'] == 'alles' else ''
        return ('<li class="ws-an-i" data-ws-an="%d"><button aria-pressed="%s" class="ws-an-b" data-part="%s" type="button"><b>%s</b></button>'
                '<p>%s</p>%s</li>' % (i, 'true' if i == 0 else 'false', an_parts.get(x['id'], ''), esc(x['titel']), esc(x['tekst']), more))
    items = dt['items']
    an_l = ''.join(an_item(i, x) for i, x in enumerate(items[:2]))
    an_r = ''.join(an_item(i + 2, x) for i, x in enumerate(items[2:]))

    # ═════════════════ PLATFORM ═════════════════
    ph, pn = pf['phone'], pf['panel']
    days = ''.join('<span%s>%s</span>' % (' class="is-pick"' if i == ph['pick'] else '', esc(d)) for i, d in enumerate(ph['dagen']))
    chips = ''.join('<span>%s</span>' % esc(c) for c in u['pay_chips'])
    ICON = {'wa': 'WA', 'ig': 'IG', 'mail': '@', 'tel': 'T'}
    inbox = ''.join('<li class="ws-ib-%s"><span class="ws-ib-ic" aria-hidden="true">%s</span><div><b>%s</b><span>%s</span></div></li>'
                    % (x[0], ICON.get(x[0], ''), esc(x[1]), esc(x[2])) for x in pf['inbox'])
    flow = ''.join('<li><span class="ws-fl-ic">%s</span><div><b>%s</b><span>%s</span></div></li>' % (CHECK, esc(a), esc(b)) for a, b in pn['flow'])
    plinks = ''.join('<li>%s</li>' % link(x['href'], x['label']) for x in pf['links'])
    moment = ph['dagen'][ph['pick']]

    # ═════════════════ WERK: blauwdruk naast live ═════════════════
    def case(i, s):
        nums = ''
        if s.get('nums'):
            nums = ('<div class="ws-nums">%s</div><p class="ws-note-s">%s</p>'
                    % (''.join('<div><b>%s</b><span>%s</span></div>' % (esc(n[0]), esc(n[1])) for n in s['nums']), esc(s['note'])))
        quote = ('<blockquote class="ws-quote"><p>“%s”</p><cite>%s</cite></blockquote>' % (esc(s['quote']), esc(s['cite']))) if s.get('quote') else ''
        tags = ''.join('<span>%s</span>' % esc(t) for t in s['tags'])
        return ('<article class="ws-case%s" data-ws-case="%d" id="werk-%s">'
                '<h3><button aria-expanded="%s" aria-controls="werk-%s-in" class="ws-case-b" data-ws-caseb="%d" type="button"><b>%s</b><span>%s · %s</span><i aria-hidden="true"></i></button></h3>'
                '<div class="ws-case-in" id="werk-%s-in"><p>%s</p><p class="ws-tags">%s</p>%s%s<p class="ws-case-l">%s%s</p></div></article>'
                % (' is-on' if i == 0 else '', i, s['id'], 'true' if i == 0 else 'false', s['id'], i, esc(s['naam']), esc(s['plaats']), esc(s['soort']),
                   s['id'], esc(s['wat']), tags, nums, quote, ext(s['url'], fill(wk['visit'], s)), link(s['link']['href'], s['link']['label'])))
    cases = ''.join(case(i, s) for i, s in enumerate(sites))
    also = ' · '.join('<a href="%s%s">%s</a> <span>(%s)</span>' % ('' if a['href'].startswith('#') else rel, a['href'], esc(a['t']), esc(a['s'])) for a in wk['also'])
    sect = [x for x in wk.get('sectors', []) if x['href'].startswith('website-voor-')]
    regio = [x for x in wk.get('sectors', []) if x['href'] == 'website-laten-maken-limburg']
    sector_html = ''
    if sect:
        sector_html += '<p class="ws-also"><b>%s</b> %s</p>' % (esc(wk['sector_label']), ' · '.join('<a href="%s%s">%s</a>' % (rel, x['href'], esc(x['label'])) for x in sect))
    if regio:
        sector_html += '<p class="ws-also">%s</p>' % link(regio[0]['href'], regio[0]['label'])

    # ═════════════════ METING ═════════════════
    rows = ''.join(
        '<div class="ws-mrow" data-ws-m="%s"><dt>%s</dt><dd><span class="ws-mval" data-ws-v="">…</span>'
        '<svg aria-hidden="true" class="ws-ruler-m" preserveAspectRatio="none" viewBox="0 0 1000 24"><path class="ws-rb" d="M0 12h1000"></path>'
        '%s<path class="ws-rv" d="M0 12h1000" pathLength="1"></path></svg>%s</dd></div>'
        % (r['k'], esc(r['label']),
           ('<path class="ws-rt" d="M%d 3v18"></path>' % round(1000 * r['tick'] / r['max'])) if r.get('tick') else '',
           ('<span class="ws-tick-l" style="--t:%.1f%%">%s</span>' % (100 * r['tick'] / r['max'], esc(r['tick_l']))) if r.get('tick') else '')
        for r in mt['rows'])

    # ═════════════════ PRIJS ═════════════════
    prow = ''.join('<li><div><b>%s</b>%s</div></li>' % (esc(r[0]), ('<span>%s</span>' % esc(r[1])) if r[1] else '') for r in pr['rows'])
    once_s = lambda a: (' + %s %s' % (eur(a['once']), esc(u['once_word']))) if a.get('once') else ''
    extra = ''.join('<li class="ws-extra" data-ws-row="%s" hidden=""><div><b>%s</b><span>%s / %s%s</span></div></li>'
                    % (a['id'], esc(a['row']), eur(a['price']), esc(re.sub(r'^\S+\s', '', u['per'])), once_s(a)) for a in pr['addons'])
    tb = ''.join('<div><dt>%s</dt><dd%s>%s</dd></div>' % (esc(a), ' data-ws-tbp=""' if i == 1 else '', esc(b)) for i, (a, b) in enumerate(pr['tb']))
    addons = ''.join('<button aria-pressed="false" class="ws-addon" data-once="%d" data-price="%d" data-ws-add="%s" type="button"><span class="ws-plus" aria-hidden="true"></span><span class="ws-ad-t"><b>%s</b><span>%s</span></span><span class="ws-ap">+ %s %s%s</span></button>'
                     % (a.get('once', 0), a['price'], a['id'], esc(a['label']), esc(a['txt']), eur(a['price']), esc(u['per']),
                        (', %s %s' % (eur(a['once']), esc(u['once_word']))) if a.get('once') else '') for a in pr['addons'])
    onces = ''.join('<p class="ws-once" data-ws-once="%s" hidden="">%s</p>' % (a['id'], esc(fill(u['once_line'], {'once': eur(a['once']), 'label': a['label']})))
                    for a in pr['addons'] if a.get('once'))

    # ═════════════════ STAPPEN ═════════════════
    SK = [
        '<rect x="6" y="6" width="108" height="68" rx="3"></rect><path class="ws-cur" d="M20 22v14"></path>',
        '<rect x="6" y="6" width="108" height="68" rx="3"></rect><path d="M6 18h108"></path><rect x="14" y="26" width="44" height="8"></rect><rect x="14" y="40" width="30" height="5"></rect><rect x="66" y="26" width="40" height="28"></rect><path d="M66 26l40 28M106 26L66 54"></path><rect x="14" y="60" width="92" height="8"></rect>',
        '<rect x="6" y="6" width="108" height="68" rx="3"></rect><path d="M6 18h108"></path><rect class="ws-fillw" x="66" y="26" width="40" height="28"></rect><rect x="14" y="26" width="44" height="8"></rect><rect class="ws-fillg" x="14" y="40" width="26" height="8" rx="4"></rect><circle class="ws-dotg" cx="30" cy="64" r="2.5"></circle><circle class="ws-dotg" cx="42" cy="64" r="2.5"></circle><circle class="ws-dotg" cx="54" cy="64" r="2.5"></circle>',
        '<rect x="40" y="4" width="40" height="72" rx="8"></rect><path d="M52 10h16"></path><rect x="46" y="16" width="28" height="20"></rect><rect x="46" y="62" width="28" height="8" rx="2"></rect><circle class="ws-live" cx="96" cy="20" r="4"></circle>',
    ]
    steps = ''.join('<li class="ws-step"><svg aria-hidden="true" class="ws-sk" viewBox="0 0 120 80">%s</svg><h3>%s</h3><p>%s</p></li>'
                    % (SK[i], esc(s[0]), esc(s[1])) for i, s in enumerate(st['items']))

    # ═════════════════ FAQ + CTA ═════════════════
    faqs = ''.join('<div class="faq-item"><button class="faq-q" type="button"><span class="ws-q">%s</span><span class="ic"><svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"></path></svg></span></button><div class="faq-a"><div class="faq-a-inner">%s</div></div></div>'
                   % (esc(q['q']), esc(q['a'])) for q in fq['items'])
    more = ''.join('<li><a href="%s%s">%s</a></li>' % (rel, m['href'], esc(m['title'])) for m in fq['more'])
    badges = ''.join('<span>%s</span>' % esc(b) for b in ct['badges'])

    # ═════════════════ DATA voor JS ═════════════════
    jsites = []
    for s in sites:
        jsites.append({'id': s['id'], 'naam': s['naam'], 'domein': s['domein'], 'alt_desk': s['alt_desk'], 'alt_gsm': s['alt_gsm'],
                       'desk': B(s['id'])['desk'], 'gsm': B(s['id'])['gsm']})
    data = {'lang': lang, 'rel': rel, 'ui': u, 'sites': jsites, 'h2b_t': wk['h2b_t'], 'sr_hero': h['sr'],
            'an': {'site': an_site, 'gsm': B(an_site)['gsm'], 'hl': [x['hl'] for x in items]},
            'plat': {'done': ph['done'], 'btn': ph['btn'], 'again': pf['again'], 'sr_done': pf['sr_done']},
            'meet': mt, 'base': 150, 'hero': {'chip_wait': h['chip_wait'], 'chip_fallback': h['chip_fallback']},
            'cta': {'micro': ct['micro'], 'micro_fb': ct['micro_fb']}}
    djson = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

    return f'''<!-- ════════ HERO: de bouwtafel ════════ -->
<header class="ws-hero" id="main" tabindex="-1">
<div class="wrap">
<nav aria-label="Breadcrumb" class="ws-crumb"><a href="{rel}Diensten">{esc(h['crumb_home'])}</a> <span aria-hidden="true">/</span> <span aria-current="page">{esc(h['crumb'])}</span></nav>
<div class="ws-hero-grid">
<div class="ws-copy">
<h1 class="ws-h1">{esc(h['h1a'])}<br/> <span class="grad">{esc(h['h1b'])}</span></h1>
<div class="ws-side">
<p class="ws-lede">{lede}</p>
<div class="ws-cta"><a class="btn" data-book="" href="{rel}Contact">{esc(h['cta'])} {ARROW}</a><a class="btn-ghost" href="#werk">{esc(h['cta2'])}</a></div>
<ul class="ws-facts">{facts}</ul>
<a class="ws-meetchip" data-ws-chip="" href="#gemeten"><i aria-hidden="true"></i><span>{esc(h['chip_wait'])}</span></a>
</div>
</div>
<figure class="ws-build is-run" data-site="{s0['id']}" data-ws-build="">
<div class="ws-stage">
<div class="ws-desk">
<div class="ws-bar" aria-hidden="true"><i></i><i></i><i></i><span class="ws-url">{LOCK}<b data-ws-dom="">{esc(s0['domein'])}</b></span><span class="ws-state">{stages}</span></div>
<div class="ws-view">
{img_desk(rel, s0['id'], s0['alt_desk'], 'ws-ink', eager=True)}
<div class="ws-paper" aria-hidden="true">{bp_svg(B(s0['id'])['desk'], 'desk', labels)}</div>
<i aria-hidden="true" class="ws-scan"></i>
</div>
</div>
<div class="ws-phone">
<div class="ws-phone-in">
{img_gsm(rel, s0['id'], s0['alt_gsm'], 'ws-ink', '(max-width: 760px) 34vw, 190px', lazy=False)}
<div class="ws-paper" aria-hidden="true">{bp_svg(B(s0['id'])['gsm'], 'gsm', labels)}</div>
<i aria-hidden="true" class="ws-scan"></i>
</div>
</div>
</div>
<figcaption class="ws-buildcap">
<div aria-label="{attr(h['sites_label'])}" class="ws-who" role="group">{who}<button aria-label="{attr(u['pause_aria'])}" class="ws-pbtn" data-state="playing" data-ws-pause="" type="button">{PLAY}<span>{esc(u['pause'])}</span></button></div>
<p class="ws-cap">{esc(h['caption'])}</p>
<p class="sr-only" data-ws-buildsr="">{esc(fill(h['sr'], s0))}</p>
</figcaption>
</figure>
</div>
</div>
</header>
<!-- ════════ WAAROM: anatomie van een site die boekt ════════ -->
<section class="sec ws-doet" id="doet">
<div class="wrap">
<div class="ws-head ws-head-w" data-reveal="">
<h2 class="h2">{esc(dt['h2a'])}<br/> <span class="grad">{esc(dt['h2b'])}</span></h2>
<p class="lead">{esc(dt['lede'])}</p>
</div>
<div aria-label="{attr(dt['group'])}" class="ws-anat" data-ws-anat="" role="group">
<ul class="ws-an-col ws-an-l">{an_l}</ul>
<figure class="ws-an-phone">
<div class="ws-an-dev"><div class="ws-an-scr">
{img_gsm(rel, an_site, dt['phone_alt'], 'ws-an-img', '(max-width: 760px) 64vw, 300px')}
<span aria-hidden="true" class="ws-an-hl" data-ws-hl=""><em></em></span>
</div></div>
<figcaption class="ws-cap">{esc(dt['phone_cap'])}</figcaption>
</figure>
<ul class="ws-an-col ws-an-r">{an_r}</ul>
<svg aria-hidden="true" class="ws-an-lines" data-ws-lines=""></svg>
</div>
</div>
</section>
<!-- ════════ ONS PLATFORM: van je site naar je CRM ════════ -->
<section class="sec ws-plat" id="platform">
<div class="wrap">
<div class="ws-head" data-reveal="">
<h2 class="h2">{esc(pf['h2a'])}<br/> <span class="grad">{esc(pf['h2b'])}</span></h2>
<p class="lead">{esc(pf['lede'])}</p>
</div>
<div class="ws-plat-grid">
<div class="ws-plat-demo is-done" data-ws-plat="">
<div class="ws-bk" data-ui="">
<p class="ws-bk-zaak">{esc(ph['zaak'])}</p>
<p class="ws-bk-kop">{esc(ph['kop'])}</p>
<div class="ws-bk-row"><span>{esc(ph['dienst_l'])}</span><b>{esc(ph['dienst'])}</b></div>
<div class="ws-bk-row"><span>{esc(ph['dag_l'])}</span><div class="ws-bk-days">{days}</div></div>
<div class="ws-bk-row"><span>{esc(ph['pay_l'])}</span><div class="ws-bk-pay">{chips}</div></div>
<button class="ws-bk-btn" data-ws-bk="" type="button"><span class="t-a">{esc(ph['btn'])}</span><span class="t-b">{CHECK}{esc(ph['done'])}</span></button>
</div>
<div aria-hidden="true" class="ws-wire"><i></i></div>
<div class="ws-crm" data-ui="">
<p class="ws-crm-t"><span>{esc(pn['title'])}</span><em>CRM</em></p>
<p class="ws-crm-h">{esc(pn['inbox'])}</p>
<ul class="ws-ib"><li class="ws-ib-web ws-ib-new" data-ws-new=""><span class="ws-ib-ic" aria-hidden="true">W</span><div><b>{esc(pn['boek_t'])}</b><span>{esc(ph['dienst'])} · {esc(moment)}</span></div><em>{esc(pn['nieuw'])}</em></li>{inbox}</ul>
<p class="ws-crm-h">{esc(pn['flow_t'])}</p>
<ol class="ws-fl" data-ws-flow="">{flow}</ol>
</div>
<p class="ws-tag">{esc(u['example'])}</p>
<button class="ws-pbtn ws-again" data-ws-again="" hidden="" type="button">{AGAIN}<span>{esc(pf['again'])}</span></button>
<p aria-live="polite" class="sr-only" data-ws-platsr=""></p>
</div>
<div class="ws-plat-side">
<p class="ws-plat-note">{esc(pf['note'])}</p>
<ul class="ws-plinks">{plinks}</ul>
</div>
</div>
</div>
</section>
<!-- ════════ ECHT WERK: blauwdruk naast de live site ════════ -->
<section class="sec ws-werk" id="werk">
<div class="wrap">
<div class="ws-head" data-reveal="">
<h2 class="h2">{esc(wk['h2a'])}<br/> <span class="grad" data-ws-wh="">{esc(fill(wk['h2b_t'], s0))}</span></h2>
<p class="lead">{esc(wk['lede'])}</p>
</div>
<div class="ws-werk-grid">
<div class="ws-cmp" data-mode="desk" data-ws-cmp="" style="--cut:50">
<div class="ws-cmp-frame">
<div class="ws-cmp-bar" aria-hidden="true"><i></i><i></i><i></i><span class="ws-url">{LOCK}<b data-ws-cdom="">{esc(s0['domein'])}</b></span></div>
<div class="ws-cmp-view" data-ws-cview="">
{img_desk(rel, s0['id'], s0['alt_desk'], 'ws-cmp-img ws-cmp-d', sizes='(max-width: 760px) 92vw, (max-width: 1180px) 60vw, 700px')}
{img_gsm(rel, s0['id'], s0['alt_gsm'], 'ws-cmp-img ws-cmp-m', '(max-width: 760px) 70vw, 320px')}
<div class="ws-cmp-bp" aria-hidden="true" data-ws-cbp="">{bp_svg(B(s0['id'])['desk'], 'desk', labels, 'ws-bp ws-cbp-d')}{bp_svg(B(s0['id'])['gsm'], 'gsm', labels, 'ws-bp ws-cbp-m')}</div>
<span aria-hidden="true" class="ws-cmp-tag l">{esc(u['bp'])}</span><span aria-hidden="true" class="ws-cmp-tag r">{esc(u['live'])}</span>
<div aria-label="{attr(u['slider'])}" aria-valuemax="100" aria-valuemin="0" aria-valuenow="50" aria-valuetext="{attr(fill(u['slider_v'], {'p': 50}))}" class="ws-knife" data-ws-knife="" role="slider" tabindex="0"><span class="ws-grip">{GRIP}</span></div>
</div>
</div>
<div class="ws-cmp-ctrl"><div aria-label="{attr(u['desk'])} / {attr(u['gsm'])}" class="ws-toggle" role="group"><button aria-pressed="true" data-ws-mode="desk" type="button">{DESK}<span>{esc(u['desk'])}</span></button><button aria-pressed="false" data-ws-mode="gsm" type="button">{GSM}<span>{esc(u['gsm'])}</span></button></div><p class="ws-cap">{esc(wk['caption'])}</p></div>
</div>
<div class="ws-cases" data-ws-cases="">
{cases}
</div>
</div>
<div class="ws-werk-foot">
<p class="ws-also"><b>{esc(wk['also_label'])}</b> {also}</p>
{sector_html}
</div>
</div>
</section>
<!-- ════════ GEMETEN ════════ -->
<section class="sec ws-meet" id="gemeten">
<div class="wrap">
<div class="ws-head" data-reveal="">
<h2 class="h2">{esc(mt['h2a'])}<br/> <span class="grad">{esc(mt['h2b'])}</span></h2>
<p class="lead">{esc(mt['lede'])}</p>
</div>
<div class="ws-meet-grid">
<div class="ws-meet-l">
<p class="ws-stamp" data-ws-stamp=""></p>
<p class="ws-verdict" data-ws-verdict="">{esc(mt['wait'])}</p>
<button class="ws-pbtn ws-reload" data-ws-reload="" type="button">{AGAIN}<span>{esc(mt['reload'])}</span></button>
<p class="ws-note-s">{esc(mt['foot'])}</p>
{('<p class="ws-scanlink">%s %s</p>' % (esc(mt['scan']['tekst']), link(mt['scan']['href'], mt['scan']['t']))) if mt.get('scan') else ''}
</div>
<div class="ws-meet-r">
<dl class="ws-rulers" data-ws-rulers="">{rows}</dl>
<p class="ws-lcpnote" data-ws-lcpnote="" hidden="">{esc(mt['lcp_note'])}</p>
<p class="ws-others" data-ws-others=""></p>
<p class="ws-loadl" data-ws-load=""></p>
<p class="ws-slot">{esc(mt['slot'])}</p>
<p aria-live="polite" class="sr-only" data-ws-meetsr=""></p>
</div>
</div>
</div>
</section>
<!-- ════════ PRIJS: het titelblok van de tekening ════════ -->
<section class="sec ws-prijs" id="prijs">
<div class="wrap">
<div class="ws-head" data-reveal="">
<h2 class="h2">{esc(pr['h2a'])}<br/> <span class="grad">{esc(pr['h2b'])}</span></h2>
<p class="lead">{esc(pr['lede'])}</p>
</div>
<div class="ws-prijs-grid">
<div class="ws-tblock">
<div class="ws-total"><span class="ws-total-l">{esc(pr['total_label'])}</span><b>{'' if lang == 'fr' else '<span class="ws-eur">€</span>'}<span class="ws-amt" data-ws-amt=""><span aria-hidden="true" class="ws-amt-d">150</span><span class="sr-only">150</span></span>{'<span class="ws-eur">€</span>' if lang == 'fr' else ''}</b><em data-ws-per="">{esc(u['per'])}</em></div>
<p class="ws-addl">{esc(pr['addons_label'])}</p>
<div aria-label="{attr(pr['addons_label'])}" class="ws-addons" role="group">{addons}</div>
{onces}
<p aria-live="polite" class="sr-only" data-ws-totsr=""></p>
<div class="ws-prijs-cta"><a class="btn" data-book="" href="{rel}Contact">{esc(pr['cta'])} {ARROW}</a><a class="btn-ghost" href="{rel}Diensten#pakket-1">{esc(pr['cta2'])}</a></div>
<dl class="ws-tb" data-ws-tb="">{tb}</dl>
</div>
<div class="ws-slwrap">
<p class="ws-slhead">{esc(pr['head'])}</p>
<ol class="ws-sl" data-ws-sl="">{prow}{extra}</ol>
</div>
</div>
<p class="ws-cons">{esc(pr['cons'])} {link('Diensten#pakket-2', pr['cons_link'])}</p>
</div>
</section>
<!-- ════════ STAPPEN ════════ -->
<section class="sec ws-stap" id="stappen">
<div class="wrap">
<div class="ws-head" data-reveal="">
<h2 class="h2">{esc(st['h2a'])}<br/> <span class="grad">{esc(st['h2b'])}</span></h2>
<p class="lead">{esc(st['lede'])}</p>
</div>
<ol class="ws-steps" data-ws-steps="">{steps}</ol>
</div>
</section>
<!-- ════════ FAQ ════════ -->
<section class="sec ws-faq" id="faq">
<div class="wrap">
<div class="ws-head" data-reveal="">
<h2 class="h2">{esc(fq['h2a'])}<br/> <span class="grad">{esc(fq['h2b'])}</span></h2>
</div>
<div class="ws-faq-grid">
<div class="ws-faq-l">
<p class="ws-more-l">{esc(fq['more_label'])}</p>
<ul class="ws-more">{more}</ul>
</div>
<div class="faq-list">{faqs}</div>
</div>
</div>
</section>
<!-- ════════ CTA ════════ -->
<section class="cta-band ws-ctab" id="contact">
<div class="wrap">
<div class="cta-inner" data-reveal="">
<svg aria-hidden="true" class="ws-blank" data-ws-blank="" viewBox="0 0 140 90"><path class="ws-bl-c" d="M4 10V4h6M130 4h6v6M136 80v6h-6M10 86H4v-6"></path><path class="ws-bl-f" d="M22 18h96v56H22zM22 28h96" pathLength="1"></path><path class="ws-cur" d="M34 40v12"></path></svg>
<h2>{esc(ct['h2a'])} <span class="grad">{esc(ct['h2b'])}</span></h2>
<p class="lead">{esc(ct['text'])}</p>
<div class="row"><a class="btn" data-book="" data-ws-ctabtn="" href="{rel}Contact">{esc(ct['btn'])} {ARROW}</a><a class="btn-ghost" href="{rel}{attr(ct['demo_href'])}">{esc(ct['demo'])}</a></div>
<p class="ws-micro" data-ws-micro="">{esc(ct['micro_fb'])}</p>
<div class="badges">{badges}</div>
</div>
</div>
</section>
<script data-no-i18n="" id="wsData" type="application/json">{djson}</script>
'''
