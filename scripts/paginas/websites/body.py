# HTML van de Websites-pagina ("Blauwdruk"). body(L, lang, pre) -> str
import json, html, re

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def I(d, sw='1.8', vb='0 0 24 24'):
    return ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
            'stroke-width="%s" viewBox="%s">%s</svg>' % (sw, vb, d))

ARROW = I('<path d="M3 8h10M9 4l4 4-4 4"></path>', '2', '0 0 16 16')
OUT = I('<path d="M6 3h7v7M13 3L5 11"></path>', '2', '0 0 16 16')
PLAY = ('<svg aria-hidden="true" viewBox="0 0 24 24"><path class="i-play" d="M8 5.5v13l10.5-6.5z" fill="currentColor"></path>'
        '<g class="i-pause" fill="currentColor"><rect height="13" rx="1.2" width="3.6" x="6.6" y="5.5"></rect><rect height="13" rx="1.2" width="3.6" x="13.8" y="5.5"></rect></g></svg>')
AGAIN = I('<path d="M4 12a8 8 0 1 0 2.4-5.7"></path><path d="M4 4.5v4h4"></path>', '2')
CHECK = I('<path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1"></path>', '2.4')
CROSS = '<svg aria-hidden="true" class="ws-reg" viewBox="0 0 14 14"><path d="M7 0v14M0 7h14"></path><circle cx="7" cy="7" r="3.2"></circle></svg>'

def fill(s, v):
    return re.sub(r'\{(\w+)\}', lambda m: str(v.get(m.group(1), m.group(0))), s)

def unsplash(pid, w=600):
    return 'https://images.unsplash.com/%s?auto=format&amp;fit=crop&amp;q=70&amp;w=%d' % (pid, w)

def site(v, ui, cls=''):
    """de voorbeeldsite (mock). Alle teksten hebben data-f, zodat JS ze per vak kan wisselen."""
    p = v['pal']
    style = '--s-bg:%s;--s-ink:%s;--s-acc:%s;--s-line:%s;--s-card:%s' % (p['bg'], p['ink'], p['acc'], p['line'], p['card'])
    links = ''.join('<i>%s</i>' % esc(x) for x in v['links'])
    return f'''<div aria-hidden="true" class="ws-site{cls}" data-ws-site="" style="{style}">
<div class="ws-s-nav" data-part="nav"><b class="ws-s-logo" data-f="naam" data-part="logo">{esc(v['naam'])}</b><span class="ws-s-links" data-f="links" data-part="links">{links}</span><span class="ws-s-tel"><i></i><span data-f="tel">{esc(v['tel'])}</span><em>{esc(ui['picks'])}</em></span><span class="ws-s-cta" data-f="cta" data-part="cta">{esc(v['cta'])}</span><span class="ws-s-burger" data-part="burger"><i></i><i></i><i></i></span></div>
<div class="ws-s-hero"><div class="ws-s-copy"><b class="ws-s-title" data-f="titel" data-part="titel">{esc(v['titel'])}</b><span class="ws-s-sub" data-f="sub" data-part="sub">{esc(v['sub'])}</span><span class="ws-s-btn" data-f="cta" data-part="knop">{esc(v['cta'])}</span></div>
<div class="ws-s-photo" data-part="foto"><img alt="" data-f="foto" decoding="async" height="390" src="{unsplash(v['foto']['id'])}" style="object-position:{v['foto']['pos']}" width="600"/></div></div>
<div class="ws-s-row"><div class="ws-s-card" data-part="uren"><small>{esc(ui['hours_label'])}</small><b data-f="uren">{esc(v['uren'])}</b><em class="ws-s-closed">{esc(ui['closed'])}</em></div>
<div class="ws-s-card" data-part="review"><small>{esc(ui['review_label'])}</small><b data-f="review">{esc(v['review'])}</b><em class="ws-s-ex">{esc(ui['example'])}</em></div>
<div class="ws-s-card" data-part="adres"><small>{esc(ui['address_label'])}</small><b data-f="adres">{esc(v['adres'])}</b></div></div>
<div class="ws-s-bar" data-part="bar"><b data-f="naam">{esc(v['naam'])}</b><span data-f="cta">{esc(v['cta'])}</span></div>
<div class="ws-s-chat"><i></i></div>
<div class="ws-s-sheet"><div class="ws-s-sheet-in"></div></div>
</div>'''

def body(L, lang, pre):
    h, u, dt, wk, mt, pr, st, fq, ct = L['hero'], L['ui'], L['doet'], L['werk'], L['meet'], L['prijs'], L['stappen'], L['faq'], L['cta']
    rel = '' if lang == 'nl' else '../'
    v0 = L['vak'][0]

    # ---------------- HERO ----------------
    chips = ''.join('<button aria-pressed="%s" class="ws-chip" data-ws-vak="%d" type="button">%s</button>'
                    % ('true' if i == 0 else 'false', i, esc(v['chip'])) for i, v in enumerate(L['vak']))
    chaps = ''.join('<button aria-pressed="false" class="ws-chap" data-ws-ch="%d" type="button"><span>%s</span><i aria-hidden="true"></i></button>'
                    % (i, esc(c)) for i, c in enumerate(h['chapters']))
    foot = ''.join('<span>%s</span>' % esc(f) for f in h['foot'])

    # ---------------- DOET ----------------
    lenses = ''.join('<button aria-pressed="%s" class="ws-lensb" data-ws-lens="%d" type="button"><b>%s</b><span class="ws-lens-t">%s</span><i aria-hidden="true"></i></button>'
                     % ('true' if i == 0 else 'false', i, esc(x['titel']), esc(fill(x['tekst'], {'vak': v0['chip'].lower(), 'cta': v0['cta']})))
                     for i, x in enumerate(dt['lenses']))
    dlinks = ''.join('<a href="%s%s">%s %s</a>' % (rel, x['href'], esc(x['label']), ARROW) for x in dt['links'])

    # ---------------- WERK ----------------
    tags = ''.join('<span>%s</span>' % esc(t) for t in wk['tags'])
    pins_sr = ''.join('<li>%s</li>' % esc(p['t']) for p in wk['pins']['desk'])
    def card(c):
        nums = ''.join('<div><b>%s</b><span>%s</span></div>' % (esc(n[0]), esc(n[1])) for n in c.get('nums', []))
        cls = ' is-wide' if c.get('nums') else (' is-site' if c.get('site') else '')
        logo = ''
        if c.get('logo'):
            lg = c['logo']
            logo = '<img alt="%s" class="ws-card-logo" decoding="async" height="%d" loading="lazy" src="%s" width="%d"/>' % (attr(lg['alt']), lg['h'], lg['src'], lg['w'])
        out = '<article class="ws-card%s">%s<p class="ws-card-k">%s</p><h3>%s</h3><p>%s</p>' % (cls, logo, esc(c['k']), esc(c['t']), esc(c['txt']))
        if nums: out += '<div class="ws-nums">%s</div><p class="ws-note-s">%s</p>' % (nums, esc(c['note']))
        if c.get('quote'): out += '<blockquote class="ws-quote"><p>“%s”</p><cite>%s</cite></blockquote>' % (esc(c['quote']), esc(c['cite']))
        if c.get('link'):
            if c['href'].startswith('http'):
                out += '<a class="ws-link" href="%s" rel="noopener" target="_blank">%s %s<span class="sr-only"> %s</span></a>' % (attr(c['href']), esc(c['link']), OUT, esc(wk['newtab']))
            else:
                href = c['href'] if c['href'].startswith('#') else rel + c['href']
                out += '<a class="ws-link" href="%s">%s %s</a>' % (href, esc(c['link']), ARROW)
        return out + '</article>'
    cards = ''.join(card(c) for c in wk['cards'])

    # ---------------- METING ----------------
    rows = ''.join(
        '<div class="ws-mrow" data-ws-m="%s"><dt>%s</dt><dd><span class="ws-mval" data-ws-v="">…</span>'
        '<svg aria-hidden="true" class="ws-ruler-m" preserveAspectRatio="none" viewBox="0 0 1000 24"><path class="ws-rb" d="M0 6v12M1000 6v12M0 12h1000"></path>'
        '%s<path class="ws-rv" d="M0 12h1000" pathLength="1"></path></svg>%s</dd></div>'
        % (r['k'], esc(r['label']),
           ('<path class="ws-rt" d="M%d 2v20"></path>' % round(1000 * r['tick'] / r['max'])) if r.get('tick') else '',
           ('<span class="ws-tick-l" style="--t:%.1f%%">%s</span>' % (100 * r['tick'] / r['max'], esc(r['tick_l']))) if r.get('tick') else '')
        for r in mt['rows'])

    # ---------------- PRIJS ----------------
    prow = ''.join('<li><span class="ws-pos">%02d</span><div><b>%s</b>%s</div></li>' % (i + 1, esc(r[0]), ('<span>%s</span>' % esc(r[1])) if r[1] else '')
                   for i, r in enumerate(pr['rows']))
    extra = ''.join('<li class="ws-extra" data-ws-row="%s" hidden=""><span class="ws-pos">%02d</span><div><b>%s</b><span>€%d / %s</span></div></li>'
                    % (a['id'], len(pr['rows']) + 1 + i, esc(a['row']), a['price'], esc(re.sub(r'^\S+\s', '', u['per']))) for i, a in enumerate(pr['addons']))
    tb = ''.join('<div><dt>%s</dt><dd%s>%s</dd></div>' % (esc(a), ' data-ws-tbp=""' if i == 1 else '', esc(b)) for i, (a, b) in enumerate(pr['tb']))
    addons = ''.join('<button aria-pressed="false" class="ws-addon" data-price="%d" data-ws-add="%s" type="button"><span class="ws-plus" aria-hidden="true"></span><b>%s</b><span class="ws-ap">+ €%d %s</span><span class="ws-at">%s</span></button>'
                     % (a['price'], a['id'], esc(a['label']), a['price'], esc(u['per']), esc(a['txt'])) for a in pr['addons'])

    # ---------------- STAPPEN ----------------
    SK = [
        '<rect x="6" y="6" width="108" height="68" rx="3"></rect><path class="ws-cur" d="M20 22v14"></path>',
        '<rect x="6" y="6" width="108" height="68" rx="3"></rect><path d="M6 18h108"></path><rect x="14" y="26" width="44" height="8"></rect><rect x="14" y="40" width="30" height="5"></rect><rect x="66" y="26" width="40" height="28"></rect><path d="M66 26l40 28M106 26L66 54"></path><rect x="14" y="60" width="92" height="8"></rect>',
        '<rect x="6" y="6" width="108" height="68" rx="3"></rect><path d="M6 18h108"></path><rect class="ws-fillw" x="66" y="26" width="40" height="28"></rect><rect x="14" y="26" width="44" height="8"></rect><rect class="ws-fillg" x="14" y="40" width="26" height="8" rx="4"></rect><circle class="ws-dotg" cx="30" cy="64" r="2.5"></circle><circle class="ws-dotg" cx="42" cy="64" r="2.5"></circle><circle class="ws-dotg" cx="54" cy="64" r="2.5"></circle>',
        '<rect x="40" y="4" width="40" height="72" rx="8"></rect><path d="M52 10h16"></path><rect x="46" y="16" width="28" height="20"></rect><rect x="46" y="62" width="28" height="8" rx="2"></rect><circle class="ws-live" cx="96" cy="20" r="4"></circle><text x="92" y="34">LIVE</text>',
    ]
    steps = ''.join('<li class="ws-step"><svg aria-hidden="true" class="ws-sk" viewBox="0 0 120 80">%s</svg><span class="ws-snum">%02d</span><h3>%s</h3><p>%s</p></li>'
                    % (SK[i], i + 1, esc(s[0]), esc(s[1])) for i, s in enumerate(st['items']))

    # ---------------- FAQ + CTA ----------------
    faqs = ''.join('<div class="faq-item"><button class="faq-q" type="button"><span class="ws-q">%s</span><span class="ic"><svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"></path></svg></span></button><div class="faq-a"><div class="faq-a-inner">%s</div></div></div>'
                   % (esc(q['q']), esc(q['a'])) for q in fq['items'])
    more = ' · '.join('<a href="%s%s">%s</a>' % (rel, m['href'], esc(m['title'])) for m in fq['more'])
    badges = ''.join('<span>%s</span>' % esc(b) for b in ct['badges'])

    # ---------------- DATA voor JS ----------------
    data = {'lang': lang, 'rel': rel, 'ui': u, 'vak': L['vak'], 'chapters': h['chapters'],
            'lenses': dt['lenses'], 'bp': wk['bp'], 'pins': wk['pins'], 'meet': mt, 'base': 150,
            'hero': {'chip_wait': h['chip_wait'], 'chip_fallback': h['chip_fallback']}, 'cta': {'micro': ct['micro'], 'micro_fb': ct['micro_fb']}}
    djson = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

    return f'''<svg aria-hidden="true" class="ws-defs" focusable="false" height="0" width="0"><defs><linearGradient gradientUnits="userSpaceOnUse" id="wsPen" x1="0" x2="1000" y1="0" y2="0"><stop offset="0" stop-color="#2f74e0"></stop><stop offset="1" stop-color="#2fbf86"></stop></linearGradient></defs></svg>
<!-- ════════ HERO: het tekenblad ════════ -->
<header class="ws-hero" data-ws-hero="" id="main" tabindex="-1">
<div class="wrap ws-hero-grid">
<div class="ws-copy">
<div class="ws-crumb"><a href="{rel}Diensten">{esc(h['crumb_home'])}</a> <span>/</span> <span>{esc(h['crumb'])}</span></div>
<span class="eyebrow">{esc(h['eyebrow'])}</span>
<h1 class="ws-h1">{esc(h['h1a'])}<br/> <span class="grad">{esc(h['h1b'])}</span></h1>
<p class="lead ws-lede">{esc(h['lede'])}</p>
<div class="ws-cta"><a class="btn" data-book="" href="{rel}Contact">{esc(h['cta'])} {ARROW}</a><a class="btn-ghost" href="#werk">{esc(h['cta2'])}</a></div>
<div class="ws-pick">
<p class="ws-label" id="wsPickL">{esc(h['pick'])}</p>
<div aria-labelledby="wsPickL" class="ws-chips" role="group">{chips}</div>
<button aria-controls="wsNameBox" aria-expanded="false" class="ws-namebtn" data-ws-namebtn="" type="button">{esc(h['name_btn'])}</button>
<div class="ws-namebox" hidden="" id="wsNameBox"><label for="wsName">{esc(h['name_label'])}</label><input autocomplete="off" id="wsName" maxlength="28" placeholder="{attr(h['name_ph'])}" spellcheck="false" type="text"/><small>{esc(h['name_hint'])}</small></div>
</div>
</div>
<div class="ws-sheetcol">
<div class="ws-sheet" data-ws-sheet="">
<div aria-hidden="true" class="ws-grid"></div>
{CROSS.replace('class="ws-reg"', 'class="ws-reg tl"')}{CROSS.replace('class="ws-reg"', 'class="ws-reg tr"')}{CROSS.replace('class="ws-reg"', 'class="ws-reg bl"')}{CROSS.replace('class="ws-reg"', 'class="ws-reg br"')}
<span aria-hidden="true" class="ws-tag">{esc(u['example'])}</span>
<div aria-hidden="true" class="ws-ruler"><i></i><span data-ws-rulen="">1280 px</span><i></i></div>
<div class="ws-stage" data-ws-stage="">
<div class="ws-frame" data-ws-frame=""><div aria-hidden="true" class="ws-addr"><i></i><i></i><i></i><span data-f="domein">{esc(v0['domein'])}</span></div>
<div class="ws-view" data-ws-view=""><div class="ws-scale" data-ws-scale="">{site(v0, u)}</div></div></div>
</div>
<div aria-hidden="true" class="ws-labels" data-ws-labels=""></div>
<div aria-hidden="true" class="ws-notes" data-ws-notes=""></div>
<div aria-hidden="true" class="ws-dim"></div>
<div aria-hidden="true" class="ws-clock" data-ws-clock=""><b data-ws-clockt="">{esc(u['clock_a'])}</b><span>{esc(u['clock_sub'])}</span></div>
<div aria-hidden="true" class="ws-toast" data-ws-toast=""><i></i><b></b><span></span></div>
</div>
<div class="ws-ctrl">
<div aria-label="{attr(h['chapters_label'])}" class="ws-chaps" role="group">{chaps}</div>
<div class="ws-ctrl-r"><button aria-label="{attr(u['pause_aria'])}" class="ws-pbtn" data-state="playing" data-ws-pause="" type="button">{PLAY}<span>{esc(u['pause'])}</span></button><button aria-label="{attr(u['again_aria'])}" class="ws-pbtn" data-ws-again="" type="button">{AGAIN}<span>{esc(u['again'])}</span></button></div>
</div>
<p class="ws-cap">{esc(h['caption'])}</p>
<p class="sr-only" data-ws-herosr="">{esc(fill(u['sr_hero'], {'naam': v0['naam'], 'wat': u['sr_boek']}))}</p>
<p aria-live="polite" class="sr-only" data-ws-herolive=""></p>
</div>
</div>
<div class="wrap"><div class="ws-foot">{foot}<a class="ws-meetchip" data-ws-chip="" href="#gemeten"><i aria-hidden="true"></i><span>{esc(h['chip_wait'])}</span></a></div></div>
</header>
<!-- ════════ WAT JE SITE DOET ════════ -->
<section class="sec ws-doet" id="doet">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(dt['eyebrow'])}</span>
<h2 class="h2">{esc(dt['h2a'])}<br/> <span class="grad">{esc(dt['h2b'])}</span></h2>
<p class="lead">{esc(dt['lede'])}</p>
</div>
<div class="ws-doet-grid">
<div class="ws-doet-l">
<div aria-label="{attr(dt['group'])}" class="ws-lenses" role="group">{lenses}</div>
<p class="ws-dlinks">{dlinks}</p>
</div>
<div class="ws-lenscol">
<div class="ws-lens" data-ws-lens-root="">
<div aria-hidden="true" class="ws-grid"></div>
<div class="ws-lview" data-ws-lview=""><div class="ws-scale" data-ws-lscale="">{site(v0, u)}</div></div>
<svg aria-hidden="true" class="ws-lbox" data-ws-lbox=""><path d="M0 0" pathLength="1"></path></svg>
<div aria-hidden="true" class="ws-over" data-ws-over=""></div>
<span aria-hidden="true" class="ws-tag">{esc(u['example'])}</span>
</div>
<button aria-label="{attr(u['lens_pause'])}" class="ws-pbtn ws-lpause" data-state="playing" data-ws-lpause="" type="button">{PLAY}<span>{esc(u['pause'])}</span></button>
</div>
</div>
</div>
</section>
<!-- ════════ ECHT WERK: de doorsnede ════════ -->
<section class="sec ws-werk" id="werk">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(wk['eyebrow'])}</span>
<h2 class="h2">{esc(wk['h2a'])}<br/> <span class="grad">{esc(wk['h2b'])}</span></h2>
<p class="lead">{esc(wk['lede'])}</p>
</div>
<div class="ws-werk-grid">
<div class="ws-cutcol">
<div class="ws-cut" data-mode="desk" data-ws-cut="">
<div class="ws-cut-frame" data-ws-cutframe="">
<div aria-hidden="true" class="ws-cut-addr"><i></i><i></i><i></i><span>amakhosi.be</span></div>
<div class="ws-cut-view">
<div aria-hidden="true" class="ws-bp" data-ws-bp=""></div>
<img alt="{attr(wk['alt_desk'])}" class="ws-shot ws-shot-d" decoding="async" height="900" loading="lazy" sizes="(max-width: 760px) 92vw, (max-width: 1099px) 88vw, 640px" src="{rel}assets/werk/amakhosi-desk-960.webp" srcset="{rel}assets/werk/amakhosi-desk-960.webp 960w, {rel}assets/werk/amakhosi-desk-1440.webp 1440w" width="1440"/>
<img alt="{attr(wk['alt_gsm'])}" class="ws-shot ws-shot-m" decoding="async" height="1688" loading="lazy" sizes="300px" src="{rel}assets/werk/amakhosi-gsm-390.webp" srcset="{rel}assets/werk/amakhosi-gsm-390.webp 390w, {rel}assets/werk/amakhosi-gsm-780.webp 780w" width="780"/>
<div aria-hidden="true" class="ws-pins" data-ws-pins=""></div>
</div>
</div>
<div aria-label="{attr(u['slider'])}" aria-valuemax="100" aria-valuemin="0" aria-valuenow="56" aria-valuetext="{attr(u['slider_none'])}" class="ws-knife" data-ws-knife="" role="slider" tabindex="0"><span class="ws-knife-l"></span><span aria-hidden="true" class="ws-grip"><svg viewBox="0 0 24 24"><path d="M8 9l4-4 4 4M8 15l4 4 4-4"></path></svg></span><span aria-hidden="true" class="ws-knife-t">{esc(wk['line'])}</span></div>
</div>
<p class="ws-pincap" data-ws-pincap="">{esc(u['slider_none'])}</p>
<ul class="sr-only">{pins_sr}</ul>
</div>
<div class="ws-werk-txt">
<p class="ws-card-k">{esc(wk['k1'])}</p>
<h3>{esc(wk['name'])}</h3>
<p>{esc(wk['text'])}</p>
<p class="ws-tags">{tags}</p>
<div aria-label="{attr(u['desk'])} / {attr(u['gsm'])}" class="ws-toggle" role="group"><button aria-pressed="true" data-ws-mode="desk" type="button">{esc(u['desk'])}</button><button aria-pressed="false" data-ws-mode="gsm" type="button">{esc(u['gsm'])}</button></div>
<a class="ws-link" href="https://amakhosi.be" rel="noopener" target="_blank">{esc(wk['visit'])} {OUT}<span class="sr-only"> {esc(wk['newtab'])}</span></a>
<p class="ws-note-s">{esc(wk['caption'])}</p>
</div>
</div>
<div class="ws-cards">{cards}</div>
</div>
</section>
<!-- ════════ GEMETEN ════════ -->
<section class="sec ws-meet" id="gemeten">
<div class="wrap ws-meet-grid">
<div class="ws-meet-l">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(mt['eyebrow'])}</span>
<h2 class="h2">{esc(mt['h2a'])}<br/> <span class="grad">{esc(mt['h2b'])}</span></h2>
<p class="lead">{esc(mt['lede'])}</p>
</div>
<p class="ws-stamp" data-ws-stamp=""></p>
<p class="ws-verdict" data-ws-verdict="">{esc(mt['wait'])}</p>
<button class="ws-pbtn ws-reload" data-ws-reload="" type="button">{AGAIN}<span>{esc(mt['reload'])}</span></button>
<p class="ws-note-s">{esc(mt['foot'])}</p>
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
</section>
<!-- ════════ PRIJS: stuklijst ════════ -->
<section class="sec ws-prijs" id="prijs">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(pr['eyebrow'])}</span>
<h2 class="h2">{esc(pr['h2a'])}<br/> <span class="grad">{esc(pr['h2b'])}</span></h2>
<p class="lead">{esc(pr['lede'])}</p>
</div>
<div class="ws-prijs-grid">
<div class="ws-prijs-l">
<p class="ws-slhead">{esc(pr['head'])}</p>
<ol class="ws-sl" data-ws-sl="">{prow}{extra}</ol>
<dl class="ws-tb" data-ws-tb="">{tb}</dl>
</div>
<div class="ws-prijs-r">
<div class="ws-mini" data-ws-mini=""><div class="ws-mini-dev"><div class="ws-scale" data-ws-mscale="">{site(v0, u, ' is-gsm')}</div></div><span aria-hidden="true" class="ws-tag">{esc(u['example'])}</span></div>
<div class="ws-prijs-side">
<p class="ws-addl">{esc(pr['addons_label'])}</p>
<div aria-label="{attr(pr['addons_label'])}" class="ws-addons" role="group">{addons}</div>
<div class="ws-total"><span>{esc(pr['total_label'])}</span><b><span class="ws-eur">€</span><span class="ws-amt" data-ws-amt=""><span aria-hidden="true" class="ws-amt-d">150</span><span class="sr-only">150</span></span></b><em data-ws-per="">{esc(u['per'])}</em></div>
<p aria-live="polite" class="sr-only" data-ws-totsr=""></p>
</div>
</div>
</div>
<div class="ws-prijs-cta"><a class="btn" data-book="" href="{rel}Contact">{esc(pr['cta'])} {ARROW}</a><a class="btn-ghost" href="{rel}Diensten#pakket-1">{esc(pr['cta2'])}</a></div>
<p class="ws-cons">{esc(pr['cons'])} <a class="ws-link" href="{rel}Diensten#pakket-2">{esc(pr['cons_link'])} {ARROW}</a></p>
</div>
</section>
<!-- ════════ STAPPEN ════════ -->
<section class="sec ws-stap" id="stappen">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(st['eyebrow'])}</span>
<h2 class="h2">{esc(st['h2a'])}<br/> <span class="grad">{esc(st['h2b'])}</span></h2>
<p class="lead">{esc(st['lede'])}</p>
</div>
<ol class="ws-steps" data-ws-steps="">{steps}</ol>
</div>
</section>
<!-- ════════ FAQ ════════ -->
<section class="sec ws-faq" id="faq">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(fq['eyebrow'])}</span>
<h2 class="h2">{esc(fq['h2a'])}<br/> <span class="grad">{esc(fq['h2b'])}</span></h2>
</div>
<div class="faq-list" data-reveal="">{faqs}</div>
<p class="ws-more">{esc(fq['more_label'])} {more}</p>
</div>
</section>
<!-- ════════ CTA ════════ -->
<section class="cta-band" id="contact">
<canvas aria-hidden="true" class="starfield" data-stars=""></canvas>
<div class="glow"></div>
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
