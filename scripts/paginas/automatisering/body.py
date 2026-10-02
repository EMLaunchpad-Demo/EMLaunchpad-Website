# HTML van de automatiseringspagina ("Als een uurwerk"). body(L, lang, pre) -> str
import json, html, re, math

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def I(d, sw='1.8', vb='0 0 24 24'):
    return ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
            'stroke-width="%s" viewBox="%s">%s</svg>' % (sw, vb, d))

ARROW = I('<path d="M3 8h10M9 4l4 4-4 4"></path>', '2', '0 0 16 16')
PLAY = ('<svg aria-hidden="true" viewBox="0 0 24 24"><path class="i-play" d="M8 5.5v13l10.5-6.5z" fill="currentColor"></path>'
        '<g class="i-pause" fill="currentColor"><rect height="13" rx="1.2" width="3.6" x="6.6" y="5.5"></rect><rect height="13" rx="1.2" width="3.6" x="13.8" y="5.5"></rect></g></svg>')
AGAIN = I('<path d="M4 12a8 8 0 1 0 2.4-5.7"></path><path d="M4 4.5v4h4"></path>', '2')
CHECK = '<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1"></path></svg>'

# icoontjes: chips (gebeurtenis) en hulpmiddelen
IC = {
    'cal': '<rect height="16" rx="2" width="18" x="3" y="5"></rect><path d="M3 10h18M8 3v4M16 3v4M8.5 15l2 2 4-4"></path>',
    'bill': '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"></path><path d="M9 8h6M9 12h6M9 16h3"></path>',
    'call': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"></path><path d="M15 3l6 6M21 3l-6 6"></path>',
    'form': '<rect height="18" rx="2" width="16" x="4" y="3"></rect><path d="M8 8h8M8 12h8M8 16h5"></path>',
    'mail': '<rect height="14" rx="2" width="18" x="3" y="5"></rect><path d="m3 7 9 6 9-6"></path>',
    'sms': '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5z"></path>',
    'crm': '<circle cx="9" cy="8" r="3.2"></circle><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 8h4M17 12h4M18 16h3"></path>',
    'inbox': '<path d="M3 13h5l1.5 3h5L16 13h5"></path><path d="M5.5 5h13L21 13v6H3v-6z"></path>',
}
LOGO = {'agenda': 'assets/logos/google-agenda.svg', 'stripe': 'assets/logos/stripe.svg', 'google': 'assets/logos/google-bedrijfsprofiel.png'}

def fill(s, v):
    return re.sub(r'\{(\w+)\}', lambda m: str(v.get(m.group(1), m.group(0))), s)

def tools_html(tools, ui, pre):
    out = []
    for t in tools or []:
        name = ui['tools'][t]
        if t in LOGO:
            ic = '<img alt="" decoding="async" height="14" src="%s%s" width="14"/>' % (pre, LOGO[t])
        else:
            ic = I(IC[t])
        out.append('<li class="am-tool" data-t="%s">%s<span>%s</span></li>' % (t, ic, esc(name)))
    return '<ul class="am-tools">%s</ul>' % ''.join(out)

# ---------- geometrie (zelfde rekenwerk als automatisering.js) ----------
def geo(g):
    p, n, a = g['p'], g['n'], g['a']
    r = [k * p / (2 * math.pi) for k in n]
    C = [tuple(g['c0'])]
    for i in range(1, len(n)):
        ang = math.radians(a[i])
        x, y = C[-1]
        C.append((x + (r[i - 1] + r[i]) * math.cos(ang), y + (r[i - 1] + r[i]) * math.sin(ang)))
    return r, C

def plate_static(g):
    """zonder JS: een rustige tekening met de steekcirkels, de wijzerplaat en de onrust"""
    r, C = geo(g)
    out = ['<circle class="am-dial" cx="500" cy="500" r="%d"></circle>' % g['dial']]
    for i in range(60):
        an = i / 60 * 2 * math.pi
        r2 = 470 if i % 5 == 0 else 482
        out.append('<line class="am-tk" x1="%.1f" x2="%.1f" y1="%.1f" y2="%.1f"></line>' % (
            500 + 490 * math.cos(an), 500 + r2 * math.cos(an), 500 + 490 * math.sin(an), 500 + r2 * math.sin(an)))
    for i, (c, rr) in enumerate(zip(C, r)):
        out.append('<circle class="am-nojs" cx="%.1f" cy="%.1f" r="%.1f"></circle><circle class="am-nojs-hub" cx="%.1f" cy="%.1f" r="6"></circle>' % (c[0], c[1], rr, c[0], c[1]))
    ox, oy, orr = g['onrust']
    out.append('<circle class="am-nojs" cx="%d" cy="%d" r="%d"></circle>' % (ox, oy, orr))
    return ''.join(out)

def arc_ticks(cx, cy, r, a0, a1, n, long_every=0):
    out = []
    for i in range(n + 1):
        an = math.radians(a0 + (a1 - a0) * i / n)
        L = 14 if (long_every and i % long_every == 0) else 7
        out.append('<line x1="%.1f" x2="%.1f" y1="%.1f" y2="%.1f"></line>' % (
            cx + r * math.cos(an), cx + (r - L) * math.cos(an), cy + r * math.sin(an), cy + (r - L) * math.sin(an)))
    return ''.join(out)

def resolve(ev):
    """de standaardweg door een reeks (voor de statische lijst zonder JS)"""
    out = []
    for s in ev['steps']:
        out.append(s)
        f = s.get('fork')
        if f:
            o = f['opts'][f['def']]
            if o.get('then'):
                out.extend(o['then'])
                break
    return out

def body(L, lang, pre):
    h, u, g = L['hero'], L['ui'], L['geo']
    ls, er, bw, pr, st, fq, ct = L['lijst'], L['erin'], L['bewijs'], L['prijs'], L['stappen'], L['faq'], L['cta']
    rel = '' if lang == 'nl' else '../'
    case = rel + 'Clinic3D'
    # Frans: bedrag voor het €-teken (150 €), nl/en: €150
    eur = (lambda n: '%s €' % n) if lang == 'fr' else (lambda n: '€%s' % n)

    # ---------------- HERO ----------------
    chips = ''.join(
        '<button aria-pressed="%s" class="am-chip" data-am-ev="%s" type="button">%s<span>%s</span></button>'
        % ('true' if k == L['order'][0] else 'false', k, I(IC[L['events'][k]['icon']]), esc(L['events'][k]['chip']))
        for k in L['order'])
    ev0 = L['events'][L['order'][0]]
    v0 = ev0.get('vars', {})
    s0 = ev0['steps'][0]
    first_body = ('<p class="am-kop">%s</p>' % esc(s0['kop'])
                  + ('<p class="am-msg">%s</p>' % esc(fill(s0['msg'], v0)) if s0.get('msg') else '<p class="am-txt">%s</p>' % esc(fill(s0.get('txt', ''), v0)))
                  + ('<p class="am-extra">%s</p>' % esc(fill(s0['extra'], v0)) if s0.get('extra') else '')
                  + tools_html(s0.get('tools'), u, pre))
    seq = ''.join('<li><b>%s</b> %s: %s</li>' % (esc(s['grav'].capitalize()), esc(s['kop']), esc(fill(s.get('msg') or s.get('txt', ''), v0)))
                  for s in resolve(ev0))
    foot = ''.join('<span>%s</span>' % esc(f) for f in h['foot'])

    # ---------------- LIJSTJE ----------------
    def img(ph, first):
        base = 'https://images.unsplash.com/%s?auto=format&amp;fit=crop&amp;q=72&amp;w=' % ph['id']
        srcset = ', '.join('%s%d %dw' % (base, w, w) for w in (720, 1000, 1400))
        style = '--pos:%s;--posM:%s' % (ph['pos'], ph['posM'])
        if first:
            return ('<img alt="%s" class="am-ph is-on" data-am-ph="0" decoding="async" height="%d" loading="lazy" sizes="(max-width: 760px) 92vw, (max-width: 1099px) 88vw, 760px" src="%s1000" srcset="%s" style="%s" width="%d"/>'
                    % (attr(ph['alt']), ph['h'], base, srcset, style, ph['w']))
        return ('<img alt="%s" class="am-ph" data-am-ph="" data-src="%s1000" data-srcset="%s" decoding="async" height="%d" sizes="(max-width: 760px) 92vw, (max-width: 1099px) 88vw, 760px" style="%s" width="%d"/>'
                % (attr(ph['alt']), base, srcset, ph['h'], style, ph['w']))
    tr0 = ls['trades'][0]
    photos = ''.join(img(t['photo'], i == 0).replace('data-am-ph=""', 'data-am-ph="%d"' % i) for i, t in enumerate(ls['trades']))
    tabs = ''.join('<button aria-pressed="%s" class="am-tab" data-am-tab="%d" type="button">%s</button>'
                   % ('true' if i == 0 else 'false', i, esc(t['label'])) for i, t in enumerate(ls['trades']))
    tasks = ''.join('<li><span class="am-task">%s</span><span class="sr-only">: </span><span class="am-how">%s</span></li>'
                    % (esc(t['t']), esc(t['how'])) for t in tr0['tasks'])

    # ---------------- ERIN ----------------
    parts = ''.join(
        '<button aria-pressed="false" class="am-part" data-am-w="%d" type="button"><span class="am-badge" aria-hidden="true">%d</span>'
        '<span class="am-plabel">%s</span><b>%s</b><span class="am-ptxt">%s</span></button>'
        % (p['w'], p['w'] + 1, esc(p['label']), esc(p['kop']), esc(p['txt'])) for p in er['parts'])
    elinks = ' '.join('<a href="%s%s">%s %s</a>' % (rel, l['href'], esc(l['label']), ARROW) for l in er['links'])
    screws = ''.join('<circle class="am-scr" cx="%.1f" cy="%.1f" r="2.2"></circle>' % (40 * math.cos(k * math.pi / 4), 40 * math.sin(k * math.pi / 4)) for k in range(8))
    ONRUST = ('<svg aria-hidden="true" class="am-mini" viewBox="-50 -50 100 100"><g class="am-bal"><circle r="40"></circle><circle r="35" class="am-thin"></circle>'
              '<path d="M-35 0L35 0"></path>' + screws + '<circle class="am-hubm" r="5"></circle></g>'
              '<path class="am-thin" d="M0 0m3 0a3 3 0 1 1 -3 -3a6 6 0 1 1 -6 6a9 9 0 1 1 9 -9a12 12 0 1 1 -12 12"></path></svg>')

    # ---------------- BEWIJS ----------------
    def nl_num(n):
        s = '{:,}'.format(n)
        return s.replace(',', {'nl': '.', 'en': ',', 'fr': ' '}.get(lang, '.'))
    legend = ''.join(
        '<button aria-pressed="false" class="am-lg" data-am-lg="%s" type="button"><i class="am-sw %s"></i><span>%s</span> <b data-am-n="%d">%s</b>%s</button>'
        % (x['k'], x['k'], esc(x['label']), x['n'], nl_num(x['n']), (' <small>(%s)</small>' % esc(x['pct']) if x.get('pct') else ''))
        for x in bw['legend'])
    dl = ''.join('<div><dt>%s</dt><dd>%s%s</dd></div>' % (esc(x['label']), nl_num(x['n']), (' (%s)' % esc(x['pct']) if x.get('pct') else '')) for x in bw['legend'])
    wins = ''.join(
        '<div class="am-wbox%s"><span class="am-wnum" data-am-roll="%d"><span class="sr-only">%s</span><span aria-hidden="true" class="am-wdig">%s</span></span>'
        '<span class="am-wlab">%s</span>%s</div>'
        % (' is-zero' if w['n'] == 0 else '', w['n'], nl_num(w['n']), nl_num(w['n']), esc(w['label']),
           ('<span class="am-wsub">%s</span>' % esc(w['sub']) if w.get('sub') else '')) for w in bw['windows'])
    report = ''.join('<span>%s</span>' % esc(x) for x in bw['report'])

    # ---------------- PRIJS ----------------
    checks = ''.join('<li>%s<span>%s</span></li>' % (CHECK, esc(x)) for x in pr['list'])
    addons = ''.join(
        '<button aria-pressed="false" class="am-addon" data-am-add="%s" data-price="%d" type="button"><span class="am-plus" aria-hidden="true"></span>'
        '<span class="am-aname">%s</span><span class="am-aprice">+ %s %s</span></button>'
        % (a['id'], a['price'], esc(a['label']), eur(a['price']), esc(u['per'])) for a in pr['addons'])
    alinks = ' '.join('<a href="%s%s">%s %s</a>' % (rel, a['href'], esc(a['more']), ARROW) for a in pr['addons'])
    kast_ticks = arc_ticks(210, 210, 160, 0, 354, 59, 5)
    KAST = f'''<svg class="am-kast-svg" viewBox="0 0 420 420">
<defs><path d="M210 210m-184 0a184 184 0 1 1 368 0a184 184 0 1 1 -368 0" id="amRimP"></path><path d="M78 210a132 132 0 0 0 264 0" id="amArcP"></path></defs>
<circle class="am-k-out" cx="210" cy="210" r="200"></circle>
<g class="am-rim"><text class="am-k-rim"><textPath href="#amRimP" textLength="1150">{esc(pr['rim'] * 2)}</textPath></text></g>
<g class="am-k-ticks">{kast_ticks}</g>
<circle class="am-k-acc" cx="210" cy="210" r="150"></circle>
<circle class="am-k-add" cx="210" cy="210" data-am-ring="chatbot" pathLength="1" r="140"></circle>
<circle class="am-k-add" cx="210" cy="210" data-am-ring="receptie" pathLength="1" r="131"></circle>
<text class="am-k-arc"><textPath href="#amArcP" startOffset="50%" text-anchor="middle">{esc(pr['arc'])}</textPath></text>
</svg>'''

    # ---------------- STAPPEN ----------------
    gauge_ticks = arc_ticks(300, 300, 250, 200, 340, 28, 7)
    pos = [205, 250, 295, 335]
    glabels = ''
    for i, (pdeg, it) in enumerate(zip(pos, st['items'])):
        an = math.radians(pdeg)
        x, y = 300 + 214 * math.cos(an), 300 + 214 * math.sin(an)
        glabels += ('<g class="am-gpos" data-am-gp="%d"><circle cx="%.1f" cy="%.1f" r="4"></circle><text x="%.1f" y="%.1f">%02d %s</text></g>'
                    % (i, 300 + 250 * math.cos(an), 300 + 250 * math.sin(an), x, y + 5, i + 1, esc(it['lab'])))
    a0, a1 = math.radians(205), math.radians(335)
    live_arc = 'M%.1f %.1f A250 250 0 0 1 %.1f %.1f' % (300 + 250 * math.cos(a0), 300 + 250 * math.sin(a0), 300 + 250 * math.cos(a1), 300 + 250 * math.sin(a1))
    GAUGE = f'''<svg class="am-gauge-svg" viewBox="0 20 600 310">
<path class="am-g-base" d="M{300 + 250 * math.cos(math.radians(200)):.1f} {300 + 250 * math.sin(math.radians(200)):.1f} A250 250 0 0 1 {300 + 250 * math.cos(math.radians(340)):.1f} {300 + 250 * math.sin(math.radians(340)):.1f}"></path>
<g class="am-g-ticks">{gauge_ticks}</g>
<path class="am-g-live" d="{live_arc}" pathLength="1"></path>
{glabels}
<g class="am-needle" data-am-needle><line x1="300" x2="300" y1="300" y2="128"></line><circle class="am-n-tip" cx="300" cy="132" r="5"></circle></g>
<circle class="am-n-hub" cx="300" cy="300" r="9"></circle>
</svg>'''
    steps = ''.join(
        '<li><button aria-pressed="false" class="am-step" data-am-i="%d" type="button"><span class="am-snum">%02d</span><b>%s</b><span class="am-stxt">%s</span></button></li>'
        % (i, i + 1, esc(it['kop']), esc(it['txt'])) for i, it in enumerate(st['items']))

    # ---------------- FAQ + CTA ----------------
    faqs = ''.join('<div class="faq-item"><button class="faq-q" type="button"><span class="am-q">%s</span><span class="ic"><svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"></path></svg></span></button><div class="faq-a"><div class="faq-a-inner">%s</div></div></div>'
                   % (esc(q['q']), esc(q['a'])) for q in fq['items'])
    more = ' · '.join('<a href="%s%s">%s</a>' % (rel, m['href'], esc(m['title'])) for m in fq['more'])
    badges = ''.join('<span>%s</span>' % esc(b) for b in ct['badges'])

    # ---------------- DATA voor JS ----------------
    data = {k: L[k] for k in ('ui', 'geo', 'order', 'events')}
    data['lang'] = lang
    data['rel'] = rel
    data['trades'] = [{'tasks': t['tasks'], 'rest': t['rest']} for t in ls['trades']]
    data['legend'] = [{'k': x['k'], 'n': x['n']} for x in bw['legend']]
    data['base'] = 150
    data['stapPos'] = pos
    djson = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

    return f'''<svg aria-hidden="true" class="am-defs" focusable="false" height="0" width="0"><defs>
<linearGradient id="amPen" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#2f74e0"></stop><stop offset="1" stop-color="#2fbf86"></stop></linearGradient>
<linearGradient gradientUnits="userSpaceOnUse" id="amSig" x1="0" x2="1000" y1="0" y2="1000"><stop offset="0" stop-color="#4b8df0"></stop><stop offset="1" stop-color="#3fb27a"></stop></linearGradient>
</defs></svg>
<!-- ════════ HERO: het uurwerk ════════ -->
<header class="am-hero" data-am-hero="" id="main" tabindex="-1">
<div class="wrap am-hero-grid">
<div class="am-copy">
<div class="am-crumb"><a href="{rel}Diensten">{esc(h['crumb_home'])}</a> <span>/</span> <span>{esc(h['crumb'])}</span></div>
<span class="eyebrow am-in">{esc(h['eyebrow'])}</span>
<h1 class="am-h1"><span class="am-h1a" data-am-h1="">{esc(h['h1a'])}</span><br/> <span class="grad">{esc(h['h1b'])}</span></h1>
<p class="lead am-lede am-in">{esc(h['lede'])}</p>
<div class="am-cta am-in"><a class="btn" data-book="" href="{rel}Contact">{esc(h['cta'])} {ARROW}</a><a class="btn-ghost" href="#erin">{esc(h['cta2'])}</a></div>
<div class="am-pick am-in">
<p class="am-label" id="amPickL">{esc(h['label'])}</p>
<div aria-labelledby="amPickL" class="am-chips" role="group">{chips}</div>
</div>
</div>
<div class="am-stage" data-am-stage="">
<div class="am-podium" data-am-podium="">
<svg aria-hidden="true" class="am-plate" viewBox="0 0 1000 1000">{plate_static(g)}</svg>
<div aria-hidden="true" class="am-window"><span class="am-ex">{esc(u['example'])}</span><span class="am-win"><span class="am-win-t" data-am-win="">{esc(s0['win'])}</span></span><span class="am-jij" data-am-jij="">{esc(s0['jij'])}</span></div>
<button aria-label="{attr(u['pause'])}" class="am-pause" data-am-pause="" data-state="playing" type="button">{PLAY}</button>
</div>
<div class="am-stepbar"><div aria-label="{attr(u['steps_label'])}" class="am-dots-nav" data-am-steps="" role="group"></div><button class="am-restart" data-am-restart="" type="button">{AGAIN}<span>{esc(u['again'])}</span></button></div>
<div aria-label="{attr(h['read_label'])}" class="am-read" data-am-read="" role="region">
<p class="am-read-top"><span class="am-tag">{esc(u['example'])}</span><span class="am-moment" data-am-moment="">{esc(s0['grav'])}</span></p>
<div class="am-read-body" data-am-body="">{first_body}</div>
<p aria-live="polite" class="sr-only" data-am-live=""></p>
</div>
<details class="am-seq"><summary>{esc(u['seq'])}</summary><ol data-am-seq="">{seq}</ol></details>
</div>
</div>
<div class="wrap"><div class="am-foot">{foot}<a href="#bewijs">{esc(h['foot_link'])} {ARROW}</a></div></div>
</header>
<!-- ════════ HET BRIEFJE ════════ -->
<section class="sec am-lijst" id="lijstje">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(ls['eyebrow'])}</span>
<h2 class="h2">{esc(ls['h2a'])}<br/> <span class="grad">{esc(ls['h2b'])}</span></h2>
<p class="lead">{esc(ls['lede'])}</p>
</div>
<div aria-label="{attr(u['tab_label'])}" class="am-tabs" role="group">{tabs}</div>
<div class="am-lfig" data-am-lijst="">
<div class="am-photo">{photos}</div>
<div class="am-note" data-am-note="">
<p class="am-note-h"><span data-am-nh="">{esc(ls['head'])}</span><span aria-hidden="true" class="am-count" data-am-count="">0</span></p>
<ul class="am-tasks" data-am-tasks="">{tasks}</ul>
<p class="am-rest" data-am-rest="">{esc(tr0['rest'])}</p>
<span aria-hidden="true" class="am-tag am-note-tag">{esc(u['example'])}</span>
</div>
</div>
<div class="am-lfoot"><button class="am-again" data-am-again="" type="button">{AGAIN}<span>{esc(u['nogeens'])}</span></button><p class="am-cap">{esc(ls['caption'])}</p></div>
</div>
</section>
<!-- ════════ WAT ERIN ZIT ════════ -->
<section class="sec am-erin" id="erin">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(er['eyebrow'])}</span>
<h2 class="h2">{esc(er['h2a'])}<br/> <span class="grad">{esc(er['h2b'])}</span></h2>
<p class="lead">{esc(er['lede'])}</p>
</div>
<div class="am-erin-grid">
<div aria-hidden="true" class="am-explode" data-am-explode=""></div>
<div class="am-parts">{parts}</div>
</div>
<p class="am-onrust-line" data-am-onrust="">{ONRUST}<span>{esc(er['onrust'])}</span></p>
<p class="am-links">{elinks}</p>
</div>
</section>
<!-- ════════ BEWIJS ════════ -->
<section class="sec am-bewijs" id="bewijs">
<div class="wrap">
<div class="am-proof">
<div class="am-proof-copy" data-reveal="">
<span class="eyebrow">{esc(bw['eyebrow'])}</span>
<h2 class="h2">{esc(bw['h2a'])}<br/> <span class="grad">{esc(bw['h2b'])}</span></h2>
<p class="lead">{esc(bw['lede'])}</p>
<blockquote class="am-quote"><p>“{esc(bw['quote'])}”</p><cite>{esc(bw['cite'])}</cite></blockquote>
<p class="am-pnote">{esc(bw['note'])}</p>
<a class="am-link" href="{case}">{esc(bw['link'])} {ARROW}</a>
</div>
<div class="am-proof-viz" data-am-proof="">
<div aria-label="{attr(bw['legend_label'])}" class="am-legend" role="group">{legend}</div>
<div class="am-dots-wrap"><canvas aria-label="{attr(bw['dots_label'])}" class="am-dots" data-am-dots="" role="img"></canvas></div>
<dl class="am-dl">{dl}</dl>
<p class="am-dots-cap">{esc(bw['caption'])}</p>
<div class="am-wins">{wins}</div>
<p class="am-report">{report}</p>
</div>
</div>
</div>
</section>
<!-- ════════ PRIJS ════════ -->
<section class="sec am-prijs" id="prijs">
<div class="wrap">
<div class="am-price">
<div class="am-price-copy">
<div data-reveal="">
<span class="eyebrow">{esc(pr['eyebrow'])}</span>
<h2 class="h2">{esc(pr['h2a'])}<br/> <span class="grad">{esc(pr['h2b'])}</span></h2>
<p class="lead">{esc(pr['lede'])}</p>
</div>
<ul class="am-checks" data-am-checks="">{checks}</ul>
<div class="am-price-cta"><a class="btn" data-book="" href="{rel}Contact">{esc(pr['cta'])} {ARROW}</a><a class="btn-ghost" href="{rel}Diensten#pakket-1">{esc(pr['cta2'])}</a></div>
</div>
<div class="am-kast-col">
<div class="am-kast" data-am-kast="">
<div aria-hidden="true" class="am-kast-art">{KAST}</div>
<div class="am-amount"><span class="am-amtrow">{'' if lang == 'fr' else '<span class="am-eur">€</span>'}<span class="am-amt" data-am-amt=""><span class="sr-only">150</span><span aria-hidden="true" class="am-amt-d">150</span></span>{'<span class="am-eur">€</span>' if lang == 'fr' else ''}</span>
<span class="am-per" data-am-per="">{esc(u['per'])}</span><span class="am-cancel">{esc(pr['cancel'])}</span></div>
</div>
<p aria-live="polite" class="sr-only" data-am-total=""></p>
<p class="am-addon-l">{esc(pr['addons_label'])}</p>
<div class="am-addons">{addons}</div>
<p class="am-alinks">{alinks}</p>
</div>
</div>
<div class="am-cons">
<div><span class="eyebrow">{esc(pr['cons_eyebrow'])}</span><h3>{esc(pr['cons_h'])}</h3></div>
<div><p>{esc(pr['cons_txt'])}</p><a class="am-link" href="{rel}Diensten#pakket-2">{esc(pr['cons_link'])} {ARROW}</a></div>
</div>
</div>
</section>
<!-- ════════ STAPPEN ════════ -->
<section class="sec am-stap" id="stappen">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(st['eyebrow'])}</span>
<h2 class="h2">{esc(st['h2a'])}<br/> <span class="grad">{esc(st['h2b'])}</span></h2>
<p class="lead">{esc(st['lede'])}</p>
</div>
<div aria-hidden="true" class="am-gauge" data-am-gauge="">{GAUGE}</div>
<ol class="am-steplist" data-am-steplist="">{steps}</ol>
</div>
</section>
<!-- ════════ FAQ ════════ -->
<section class="sec am-faq" id="faq">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(fq['eyebrow'])}</span>
<h2 class="h2">{esc(fq['h2a'])}<br/> <span class="grad">{esc(fq['h2b'])}</span></h2>
</div>
<div class="faq-list" data-reveal="">{faqs}</div>
<p class="am-more">{esc(fq['more_label'])} {more}</p>
</div>
</section>
<!-- ════════ CTA ════════ -->
<section class="cta-band" id="contact">
<canvas aria-hidden="true" class="starfield" data-stars=""></canvas>
<div class="glow"></div>
<div class="wrap">
<div class="cta-inner" data-reveal="">
<div class="am-cta-bal" data-am-ctabal="">{ONRUST}</div>
<h2>{esc(ct['h2a'])} <span class="grad">{esc(ct['h2b'])}</span></h2>
<p class="lead">{esc(ct['text'])}</p>
<div class="row"><a class="btn" data-am-ctabtn="" data-book="" href="{rel}Contact">{esc(ct['btn'])} {ARROW}</a><a class="btn-ghost" href="{rel}{attr(ct['demo_href'])}">{esc(ct['demo'])}</a></div>
<p class="am-micro">{esc(ct['micro'])}</p>
<div class="badges">{badges}</div>
</div>
</div>
</section>
<script data-no-i18n="" id="amData" type="application/json">{djson}</script>
'''
