# HTML van de pagina advertentiebeheer / Google Ads ("Het spoor"). body(L, lang, pre) -> str
# Metafoor: het spoor van een klik tot bij de klant. Goud = resultaat (de aanvraag of boeking en wat ze werd),
# blauw en groen = actie (advertentie, klik, knoppen). Alle tekst komt uit <taal>.json; niets wordt hier verzonnen.
# Alle inhoud staat in de HTML, zodat de pagina zonder JavaScript volledig leesbaar is. spoor.js voegt alleen
# de keuze in het voorbeeld toe (aanvraag of advertentie kiezen, het spoor tekenen).
# Let op: geen klassen of bestandsnamen met "ad", "ads" of "advert": adblockers verbergen die.
import html, json, re

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def I(d, sw='1.8'):
    return ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
            'stroke-width="%s" viewBox="0 0 24 24">%s</svg>' % (sw, d))

ARROW = ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
         'stroke-width="2" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"></path></svg>')
DOWN = ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
        'stroke-width="2" viewBox="0 0 16 16"><path d="M8 3v10M4 9l4 4 4-4"></path></svg>')
PLUS = ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" '
        'viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"></path></svg>')
CHECK = I('<path d="M5 12.5l4.5 4.5L19 7.5"></path>', '2.4')
CROSS = I('<path d="M7 7l10 10M17 7L7 17"></path>', '2.2')
SEARCH = I('<circle cx="11" cy="11" r="6.5"></circle><path d="M20 20l-4.2-4.2"></path>', '2')
KEY = I('<circle cx="8" cy="15" r="4"></circle><path d="M11 12l9-9M17 6l3 3M14.5 8.5l2 2"></path>')

ICONS = {
    'zoek': I('<circle cx="11" cy="11" r="6.5"></circle><path d="M20 20l-4.2-4.2M8.5 11h5M11 8.5v5"></path>'),
    'meta': I('<rect height="16" rx="4" width="16" x="4" y="4"></rect><circle cx="12" cy="12" r="3.6"></circle><circle cx="16.6" cy="7.4" r=".6" fill="currentColor"></circle>'),
    'pagina': I('<rect height="17" rx="2" width="16" x="4" y="3.5"></rect><path d="M8 8h8M8 11.5h8M8 15h4.5"></path><path d="M14.5 15.5l1.5 1.5 3-3"></path>'),
    'doel': I('<circle cx="12" cy="12" r="8.5"></circle><circle cx="12" cy="12" r="4.5"></circle><circle cx="12" cy="12" r="1" fill="currentColor"></circle>'),
    'week': I('<rect height="16" rx="2" width="18" x="3" y="5"></rect><path d="M3 10h18M8 3v4M16 3v4"></path><path d="M8 15.5c1.2-1.8 2.6-1.8 3.8 0s2.6 1.8 4.2-.5"></path>'),
    'rapport': I('<path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11.5A.5.5 0 0 1 5.5 20V4a.5.5 0 0 1 .5-.5z"></path><path d="M14 3.5V8h4"></path><path d="M9 17v-3M12 17v-5M15 17v-2"></path>'),
}

def links(s, rel=''):
    """[label](href) in een tekst wordt een interne link (nette vorm, in de taal van de pagina)."""
    out, pos = [], 0
    for m in re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', s):
        out.append(esc(s[pos:m.start()]))
        out.append('<a href="%s%s">%s</a>' % (rel, attr(m.group(2)), esc(m.group(1))))
        pos = m.end()
    out.append(esc(s[pos:]))
    return ''.join(out)

def body(L, lang, pre):
    h, pb, sp, dn, ro, st, ee, vw, pr, fq, ct = (L['hero'], L['probleem'], L['spoor'], L['doen'], L['rollen'],
                                                  L['stappen'], L['eerlijk'], L['voorwie'], L['prijs'], L['faq'], L['cta'])
    v = h['vis']
    lb = sp['lbl']
    home = './'

    # ---------------- hero ----------------
    facts = ''.join('<li>%s</li>' % esc(f) for f in h['facts'])
    h1a = '<br/> '.join(esc(x) for x in h['h1a'].split('|'))      # "|" = vaste regelbreuk in de h1

    # ---------------- probleem ----------------
    p_rows = ''.join('<li><span>%s</span><i aria-hidden="true" style="--w:%d%%"></i></li>' % (esc(r), w)
                     for r, w in zip(pb['links']['rows'], (88, 54, 36, 62)))
    r_rows = ''.join(
        '<li><span class="sp-dot" aria-hidden="true"></span><span class="sp-who"><b>%s</b><span>%s</span></span>'
        '<span class="sp-src%s">%s</span></li>' % (esc(r['who']), esc(r['what']), '' if r['ad'] else ' is-other', esc(r['src']))
        for r in pb['rechts']['rows'])

    # ---------------- het spoor (voorbeeld) ----------------
    ads_by = {a['id']: a for a in sp['ads']}
    ads = ''.join(
        '<li><button aria-pressed="false" class="sp-res" data-sp-res="%s" type="button">'
        '<span class="sp-res-top"><span class="sp-spons">%s</span><span class="sp-url" translate="no">%s</span></span>'
        '<span class="sp-res-t">%s</span><span class="sp-res-d">%s</span>'
        '<span class="sp-res-c"><span>%s</span><b class="sp-count" data-sp-count="%s"></b></span></button></li>'
        % (attr(a['id']), esc(sp['sponsored']), esc(a['url']), esc(a['title']), esc(a['text']), esc(a['camp']), attr(a['id']))
        for a in sp['ads'])
    leads = []
    for d in sp['leads']:
        kind = lb['kind_a'] if d['kind'] == 'a' else lb['kind_b']
        if d.get('ad'):
            src = '%s %s' % (lb['via'], ads_by[d['ad']]['camp'])
            cls = ''
        else:
            src = d['other']
            cls = ' is-other'
        leads.append(
            '<li><button aria-pressed="false" class="sp-lead%s" data-sp-lead="%s" type="button">'
            '<span class="sp-dot" aria-hidden="true"></span>'
            '<span class="sp-lead-main"><span class="sp-lead-top"><b>%s</b><span class="sp-kind">%s</span><time>%s</time></span>'
            '<span class="sp-lead-what">%s</span>'
            '<span class="sp-lead-src">%s · %s</span></span></button></li>'
            % (cls, attr(d['id']), esc(d['name']), esc(kind), esc(d['when']), esc(d['what']), esc(src), esc(d['stage'])))
    leads = ''.join(leads)
    sp_json = json.dumps({'ads': sp['ads'], 'leads': sp['leads'], 'lbl': lb, 'hint': sp['hint']},
                         ensure_ascii=False).replace('</', '<\\/')

    # ---------------- wat we doen ----------------
    doen = ''.join('<article class="sp-card" data-reveal=""><span class="sp-ic">%s</span><h3>%s</h3><p>%s</p></article>'
                   % (ICONS[it['ic']], esc(it['t']), esc(it['d'])) for it in dn['items'])

    # ---------------- rollen ----------------
    jij = ''.join('<li>%s<span>%s</span></li>' % (CHECK, esc(x)) for x in ro['jij']['items'])
    wij = ''.join('<li>%s<span>%s</span></li>' % (CHECK, esc(x)) for x in ro['wij']['items'])

    # ---------------- stappen ----------------
    steps = ''.join('<li data-reveal=""><span class="sp-n">%02d</span><h3>%s</h3><p>%s</p></li>' % (i + 1, esc(s['t']), esc(s['d']))
                    for i, s in enumerate(st['items']))

    # ---------------- eerlijk ----------------
    punten = ''.join('<li><span class="sp-gold-dot" aria-hidden="true"></span>%s</li>' % esc(p) for p in ee['punten'])

    # ---------------- voor wie ----------------
    wel = ''.join('<li>%s<span>%s</span></li>' % (CHECK, esc(x)) for x in vw['wel']['items'])
    niet = ''.join('<li>%s<span>%s</span></li>' % (CROSS, esc(x)) for x in vw['niet']['items'])

    # ---------------- prijs ----------------
    points = ''.join('<li>%s<span>%s</span></li>' % (CHECK, esc(p)) for p in pr['points'])

    # ---------------- faq ----------------
    faqs = '\n'.join(
        '<div class="faq-item">\n<button class="faq-q" type="button">%s<span class="ic">%s</span></button>\n'
        '<div class="faq-a"><div class="faq-a-inner">%s</div></div>\n</div>' % (esc(q['q']), PLUS, links(q['a']))
        for q in fq['items'])
    more = ' <span aria-hidden="true">·</span> '.join('<a href="%s">%s</a>' % (attr(m['href']), esc(m['t'])) for m in fq['more'])
    badges = ''.join('<span>%s</span>' % esc(b) for b in ct['badges'])

    return f'''<main class="sp-main" id="main" tabindex="-1">
<!-- ════════ HERO: Google Ads, met een spoor tot bij de klant ════════ -->
<header class="sp-hero">
<div class="wrap">
<div class="sp-crumb"><a href="{home}">{esc(h['crumb_home'])}</a> <span aria-hidden="true">/</span> <a href="Diensten">{esc(h['crumb_parent'])}</a> <span aria-hidden="true">/</span> <span>{esc(h['crumb'])}</span></div>
<div class="sp-hero-grid">
<div class="sp-hero-copy">
<span class="eyebrow">{esc(h['eyebrow'])}</span>
<h1 class="sp-h1">{h1a}<br/> <span class="grad">{esc(h['h1b'])}</span></h1>
<p class="lead sp-lede">{esc(h['lede'])}</p>
<div class="sp-cta"><a class="btn" data-book="" href="Contact">{esc(h['cta1'])} {ARROW}</a><a class="btn-ghost" href="#spoor">{esc(h['cta2'])} {DOWN}</a></div>
<ul class="sp-facts">{facts}</ul>
</div>
<figure class="sp-trail" aria-label="{attr(v['label'])}">
<span class="sp-label">{esc(v['label'])}</span>
<div class="sp-q"><span class="sp-q-ic">{SEARCH}</span><span class="sp-q-t">{esc(v['q'])}</span></div>
<div class="sp-res sp-res-hero">
<span class="sp-res-top"><span class="sp-spons">{esc(v['sponsored'])}</span><span class="sp-url" translate="no">{esc(v['url'])}</span></span>
<span class="sp-res-t">{esc(v['title'])}</span>
<span class="sp-res-d">{esc(v['desc'])}</span>
</div>
<div class="sp-rail">
<div class="sp-line" aria-hidden="true"><i class="sp-line-dot"></i></div>
<ol class="sp-stops">
<li><span class="sp-stop-dot" aria-hidden="true"></span>{esc(v['stop1'])}</li>
<li><span class="sp-stop-dot" aria-hidden="true"></span>{esc(v['stop2'])}</li>
</ol>
</div>
<div class="sp-lead-hero">
<span class="sp-lead-hero-top"><span class="sp-dot" aria-hidden="true"></span><span class="sp-k">{esc(v['lead_k'])}</span><time>{esc(v['lead_t'])}</time></span>
<b>{esc(v['lead_name'])}</b>
<span class="sp-lead-what">{esc(v['lead_txt'])}</span>
<span class="sp-tag"><span class="sp-k">{esc(v['tag_k'])}</span>{esc(v['tag'])}</span>
</div>
</figure>
</div>
</div>
</header>
<!-- ════════ PROBLEEM: klikken zijn nog geen klanten ════════ -->
<section class="sec sp-prob" id="probleem">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(pb['eyebrow'])}</span>
<h2 class="h2">{esc(pb['h2a'])} <span class="grad">{esc(pb['h2b'])}</span></h2>
<p class="lead">{esc(pb['lede'])}</p>
</div>
<div class="sp-vs">
<div class="sp-vs-card is-old" data-reveal="">
<p class="sp-vs-k">{esc(pb['links']['k'])}</p>
<ul class="sp-bars">{p_rows}</ul>
<p class="sp-vs-note">{esc(pb['links']['note'])}</p>
</div>
<div class="sp-vs-card is-new" data-reveal="">
<p class="sp-vs-k">{esc(pb['rechts']['k'])}</p>
<ul class="sp-names">{r_rows}</ul>
<p class="sp-vs-note">{esc(pb['rechts']['note'])}</p>
</div>
</div>
</div>
</section>
<!-- ════════ HET SPOOR: kies een aanvraag of een advertentie ════════ -->
<section class="sec sp-demo-sec" id="spoor">
<div class="wrap">
<div class="sec-head center" data-reveal="">
<span class="eyebrow">{esc(sp['eyebrow'])}</span>
<h2 class="h2">{esc(sp['h2a'])} <span class="grad">{esc(sp['h2b'])}</span></h2>
<p class="lead">{esc(sp['lede'])}</p>
</div>
<div class="sp-board" data-sp-board="">
<p class="sp-board-label"><span class="sp-label">{esc(sp['voorbeeld'])}</span><span class="sp-hint" data-sp-hint="">{esc(sp['nojs'])}</span></p>
<div class="sp-cols">
<div class="sp-col">
<p class="sp-col-k" id="spAdsK">{esc(sp['ads_k'])}</p>
<ul aria-labelledby="spAdsK" class="sp-list">{ads}</ul>
</div>
<div class="sp-col">
<p class="sp-col-k" id="spLeadsK">{esc(sp['leads_k'])}</p>
<ul aria-labelledby="spLeadsK" class="sp-list">{leads}</ul>
</div>
</div>
<div aria-live="polite" class="sp-strip" data-sp-strip="" hidden></div>
<svg aria-hidden="true" class="sp-wire" data-sp-wire="" focusable="false"></svg>
</div>
<p class="sp-voet">{esc(sp['voet'])}</p>
</div>
<script id="spData" type="application/json">{sp_json}</script>
</section>
<!-- ════════ WAT WE DOEN ════════ -->
<section class="sec sp-do">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(dn['eyebrow'])}</span>
<h2 class="h2">{esc(dn['h2a'])} <span class="grad">{esc(dn['h2b'])}</span></h2>
</div>
<div class="sp-cards" data-reveal-group="">{doen}</div>
</div>
</section>
<!-- ════════ WIE DOET WAT ════════ -->
<section class="sec sp-roles">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(ro['eyebrow'])}</span>
<h2 class="h2">{esc(ro['h2a'])} <span class="grad">{esc(ro['h2b'])}</span></h2>
</div>
<div class="sp-two">
<div class="sp-role" data-reveal=""><h3>{esc(ro['jij']['k'])}</h3><ul class="sp-checks">{jij}</ul></div>
<div class="sp-role is-wij" data-reveal=""><h3>{esc(ro['wij']['k'])}</h3><ul class="sp-checks">{wij}</ul></div>
</div>
<p class="sp-keynote" data-reveal=""><span class="sp-key">{KEY}</span><span>{esc(ro['note'])}</span></p>
</div>
</section>
<!-- ════════ ZO STARTEN WE ════════ -->
<section class="sec sp-how">
<div class="wrap">
<h2 class="sp-how-h" data-reveal=""><span class="sp-slash">//</span>{esc(st['h'])}</h2>
<ol class="sp-steps" data-reveal-group="">{steps}</ol>
</div>
</section>
<!-- ════════ EERLIJK: geen beloftes vooraf, wel de echte cijfers ════════ -->
<section class="sec sp-honest">
<div class="wrap">
<div class="sp-honest-grid">
<div class="sp-honest-copy" data-reveal="">
<span class="eyebrow">{esc(ee['eyebrow'])}</span>
<h2 class="h2">{esc(ee['h2a'])} <span class="sp-goud">{esc(ee['h2b'])}</span></h2>
<p class="lead">{esc(ee['text'])}</p>
</div>
<div class="sp-honest-card" data-reveal="">
<p class="sp-vs-k">{esc(ee['k'])}</p>
<ul class="sp-gold-list">{punten}</ul>
</div>
</div>
</div>
</section>
<!-- ════════ VOOR WIE ════════ -->
<section class="sec sp-fit">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(vw['eyebrow'])}</span>
<h2 class="h2">{esc(vw['h2a'])} <span class="grad">{esc(vw['h2b'])}</span></h2>
</div>
<div class="sp-two">
<div class="sp-role" data-reveal=""><h3>{esc(vw['wel']['k'])}</h3><ul class="sp-checks">{wel}</ul></div>
<div class="sp-role is-niet" data-reveal=""><h3>{esc(vw['niet']['k'])}</h3><ul class="sp-checks is-x">{niet}</ul></div>
</div>
<p class="sp-tip" data-reveal="">{links(vw['tip'])}</p>
</div>
</section>
<!-- ════════ PRIJS ════════ -->
<section class="sec sp-price-sec" id="prijs">
<div class="wrap sp-price" data-reveal="">
<div class="sp-price-copy">
<span class="eyebrow">{esc(pr['eyebrow'])}</span>
<h2 class="h2">{esc(pr['h2a'])} <span class="grad">{esc(pr['h2b'])}</span></h2>
<p class="lead">{esc(pr['text'])}</p>
</div>
<div class="sp-price-card">
<div class="sp-amount"><b>{esc(pr['amount'])}</b><span>{esc(pr['per'])}</span></div>
<p class="sp-plus">{esc(pr['plus'])}</p>
<ul class="sp-checks">{points}</ul>
<p class="sp-samen">{esc(pr['samen'])}</p>
<div class="sp-price-cta"><a class="btn" data-book="" href="Contact">{esc(pr['cta'])} {ARROW}</a><a class="btn-ghost" href="Diensten#pakket-1">{esc(pr['cta2'])}</a></div>
</div>
</div>
</section>
<!-- ════════ FAQ ════════ -->
<section class="sec sp-faq" id="faq">
<div class="wrap">
<div class="sp-faq-grid">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(fq['eyebrow'])}</span>
<h2 class="h2">{esc(fq['h2a'])} <span class="grad">{esc(fq['h2b'])}</span></h2>
</div>
<div>
<div class="faq-list">
{faqs}
</div>
<p class="sp-more">{esc(fq['more_k'])} {more}</p>
</div>
</div>
</div>
</section>
<!-- ════════ CTA ════════ -->
<section class="cta-band" id="contact">
<div class="glow"></div>
<div class="wrap">
<div class="cta-inner" data-reveal="">
<h2>{esc(ct['h2a'])} <span class="grad">{esc(ct['h2b'])}</span></h2>
<p class="lead">{esc(ct['text'])}</p>
<div class="row"><a class="btn" data-book="" href="Contact">{esc(ct['btn'])} {ARROW}</a></div>
<div class="badges">{badges}</div>
</div>
</div>
</section>
</main>
'''
