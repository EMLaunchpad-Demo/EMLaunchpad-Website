# HTML van de pagina EML AI Team ("Een kantoor vol"). body(L, lang, pre) -> str
# Alle tekst komt uit <taal>.json; niets wordt hier verzonnen. Alle inhoud staat in de HTML
# (ook de drie voorbeeldsectoren), zodat de pagina zonder JavaScript volledig leesbaar is.
import json, html, re

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
CHECK = I('<path d="M5 12.5l4.5 4.5L19 7.5"></path>', '2.4')
CLOCK = I('<circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path>', '2')
PERSON = I('<circle cx="12" cy="8" r="3.6"></circle><path d="M5 20a7 7 0 0 1 14 0"></path>', '1.9')
STAR = I('<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.5l-5.1 2.8 1.1-5.8-4.3-4 5.8-.7z"></path>', '1.7')
PLUS = '<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"></path></svg>'
BARS = [6, 10, 15, 9, 17, 12, 7, 14, 18, 11, 8, 13, 16, 9, 6, 12, 10, 7]

def fill(s, v):
    return re.sub(r'\{(\w+)\}', lambda m: str(v.get(m.group(1), m.group(0))), s)

def make_eur(lang):
    # nl: €3.500 · en: €3,500 · fr: 3 500 € (smalle vaste spatie in het duizendtal, vaste spatie voor het euroteken)
    if lang == 'fr':
        return lambda n: '%s €' % format(n, ',').replace(',', ' ')
    if lang == 'en':
        return lambda n: '€%s' % format(n, ',')
    return lambda n: '€%s' % format(n, ',').replace(',', '.')

def sec_head(x, cls=''):
    return ('<div class="sec-head%s" data-reveal="">\n<span class="eyebrow">%s</span>\n<h2 class="h2">%s<br/> <span class="grad">%s</span></h2>\n%s</div>'
            % (cls, esc(x['eyebrow']), esc(x['h2a']), esc(x['h2b']), ('<p class="lead">%s</p>\n' % esc(x['lede'])) if x.get('lede') else ''))

def body(L, lang, pre):
    h, u, N, wt, af, st, pk, vw, fq, ct = (L['hero'], L['ui'], L['niches'], L['wat'], L['afdelingen'], L['stappen'],
                                           L['pakketten'], L['voorwaarden'], L['faq'], L['cta'])
    # interne links blijven in de taal van de pagina: /en/eml-ai-team -> /en/Diensten (alle doelen bestaan x3)
    rel = ''
    eur = make_eur(lang)
    n0 = N[0]
    agents_of = lambda n: sum(len(d['agents']) for d in n['afdelingen'])

    def chips(label_id):
        return '<div aria-labelledby="%s" class="et-chips" role="group">%s</div>' % (label_id, ''.join(
            '<button aria-pressed="%s" class="et-chip" data-et-niche="%s" type="button">%s</button>'
            % ('true' if i == 0 else 'false', attr(n['id']), esc(n['chip'])) for i, n in enumerate(N)))

    # ---------------- HERO: de Telegram-groep ----------------
    def msg(m, i):
        van = m['van']
        cls = 'et-msg is-' + van
        who = m.get('wie') or u['you'] if van != 'owner' else u['you']
        if van == 'cos':
            av = '<span aria-hidden="true" class="et-av is-cos">%s</span>' % STAR
        elif van == 'owner':
            av = '<span aria-hidden="true" class="et-av is-you">%s</span>' % PERSON
        else:
            av = '<span aria-hidden="true" class="et-av">%s</span>' % esc(who[:1])
        body_ = ''
        if m.get('voice'):
            bars = ''.join('<i style="height:%dpx"></i>' % b for b in BARS)
            body_ += ('<span class="et-voice"><span class="sr-only">%s, </span><span aria-hidden="true" class="et-vbars">%s</span><em>%s</em></span>'
                      '<p class="et-vtxt">%s</p>' % (esc(u['voice']), bars, esc(m['voice']), esc(m['tekst'])))
        else:
            body_ += '<p>%s</p>' % esc(m['tekst'])
        ask = ''
        if m.get('ask'):
            ask = ('<div class="et-ask" data-et-ask=""><button class="et-ok" data-et-ok="" type="button">%s %s</button>'
                   '<button class="et-wait" data-et-wait="" type="button">%s</button>'
                   '<span class="et-done" data-et-done="" hidden=""></span></div>' % (CHECK, esc(u['approve']), esc(u['wait'])))
        return ('<li class="%s" data-et-msg="%d"%s>%s<div class="et-bubble"><span class="et-who">%s</span>%s%s</div></li>'
                % (cls, i, ' data-et-askmsg=""' if m.get('ask') else '', av, esc(who), body_, ask))

    threads = ''.join(
        '<div class="et-thread%s" data-et-thread="%s"><p class="et-th-name">%s</p><ol class="et-msgs">%s</ol></div>'
        % (' is-on' if i == 0 else '', attr(n['id']), esc(fill(u['group'], {'bedrijf': n['bedrijf']})),
           ''.join(msg(m, j) for j, m in enumerate(n['thread'])))
        for i, n in enumerate(N))
    foot = ''.join('<span>%s</span>' % esc(f) for f in h['foot'])

    # ---------------- WAT ----------------
    cards = ''.join('<article class="et-wcard" data-reveal=""><span aria-hidden="true" class="et-cnum">%02d</span><h3>%s</h3><p>%s</p></article>'
                    % (i + 1, esc(c[0]), esc(c[1])) for i, c in enumerate(wt['items']))

    # ---------------- AFDELINGEN: het organigram ----------------
    def chart(n, i):
        # op gsm open/dicht (eml-ai-team.js maakt van de kop een knop); de eerste afdeling staat open
        depts = ''.join(
            '<section class="et-dept%s" data-et-dept=""><h4 class="et-dh">%s</h4><ul>%s</ul></section>'
            % (' is-open' if j == 0 else '', esc(d['naam']),
               ''.join('<li><b>%s</b><span>%s</span></li>' % (esc(a[0]), esc(a[1])) for a in d['agents']))
            for j, d in enumerate(n['afdelingen']))
        return ('<div class="et-chart%s" data-et-chart="%s"><h3 class="et-chart-name">%s</h3>'
                '<div class="et-tree" style="--n:%d">'
                '<div class="et-node is-owner"><span aria-hidden="true" class="et-av is-you">%s</span><b>%s</b></div>'
                '<div class="et-node is-cos"><span aria-hidden="true" class="et-av is-cos">%s</span><b>%s</b><span class="et-tagx">%s</span></div>'
                '<div class="et-depts">%s</div></div></div>'
                % (' is-on' if i == 0 else '', attr(n['id']), esc(n['bedrijf']), len(n['afdelingen']),
                   PERSON, esc(u['org_owner']), STAR, esc(u['cos']), esc(u['org_cos_tag']), depts))
    charts = ''.join(chart(n, i) for i, n in enumerate(N))

    # ---------------- STAPPEN ----------------
    steps = ''.join('<li class="et-step" data-reveal=""><span class="et-snum">%02d</span><h3>%s</h3><p>%s</p></li>'
                    % (i + 1, esc(s[0]), esc(s[1])) for i, s in enumerate(st['items']))

    # ---------------- PAKKETTEN ----------------
    picks = ''.join('<button aria-pressed="false" class="et-pick" data-et-pick="%s" type="button">%s</button>' % (attr(o[1]), esc(o[0])) for o in pk['kies_opts'])
    def plan(p):
        if p['month'] is None:
            price = '<p class="et-price"><b>%s</b></p>' % esc(u['free'])
        else:
            frm = ('<em>%s</em> ' % esc(u['from'])) if p.get('from') else ''
            price = ('<p class="et-price"><span>%s<b>%s</b> <small>%s</small></span><span>%s<b>%s</b> <small>%s</small></span></p>'
                     % (frm, eur(p['setup']), esc(u['setup']), frm, eur(p['month']), esc(u['per'])))
        items = ''.join('<li>%s</li>' % esc(w) for w in p['wat'])
        note = ('<p class="et-pnote">%s</p>' % esc(p['note'])) if p.get('note') else '<p class="et-pnote">%s</p>' % esc(u['excl'])
        return ('<article class="et-plan" data-et-plan="%s"><h3>%s</h3><p class="et-voor">%s</p>%s<ul>%s</ul>%s</article>'
                % (attr(p['id']), esc(p['naam']), esc(p['voor']), price, items, note))
    plans = ''.join(plan(p) for p in pk['items'])
    cols = [p['id'] for p in pk['items'] if p['month'] is not None]   # start, groei, volledig = kolommen 1..3
    th = pk['table']['head']
    thead = '<tr><td></td>%s</tr>' % ''.join('<th data-et-col="%s" scope="col">%s</th>' % (attr(cols[i]), esc(c)) for i, c in enumerate(th[1:]))
    # data-l = de kolomkop, zodat de gsm-weergave (kolommen onder elkaar) het pakket bij elke waarde toont
    rows = ''.join('<tr><th scope="row">%s</th>%s</tr>' % (esc(r[0]), ''.join('<td data-et-col="%s" data-l="%s">%s</td>' % (attr(cols[i]), attr(th[i + 1]), esc(c)) for i, c in enumerate(r[1:])))
                   for r in pk['table']['rows'])

    # ---------------- VOORWAARDEN ----------------
    terms = ''.join('<li data-reveal=""><span aria-hidden="true" class="et-tnum">%02d</span><h3>%s</h3><p>%s</p></li>'
                    % (i + 1, esc(t[0]), esc(t[1])) for i, t in enumerate(vw['items']))

    # ---------------- FAQ + CTA ----------------
    faqs = ''.join('<div class="faq-item"><button class="faq-q" type="button"><span class="et-q">%s</span><span class="ic">%s</span></button><div class="faq-a"><div class="faq-a-inner">%s</div></div></div>'
                   % (esc(q['q']), PLUS, esc(q['a'])) for q in fq['items'])
    more = ' · '.join('<a href="%s%s">%s</a>' % (rel, m['href'], esc(m['title'])) for m in fq['more'])
    badges = ''.join('<span>%s</span>' % esc(b) for b in ct['badges'])

    # ---------------- DATA voor JS ----------------
    data = {'lang': lang, 'ui': u, 'niches': [{'id': n['id'], 'bedrijf': n['bedrijf'], 'wat': n['wat'], 'n': agents_of(n)} for n in N]}
    djson = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

    return f'''<script>document.documentElement.classList.add('et-js')</script>
<main class="et-main" id="main" tabindex="-1">
<!-- ════════ HERO: de Telegram-groep ════════ -->
<header class="et-hero" data-et-hero="">
<div class="wrap et-hero-grid">
<div class="et-copy">
<div class="et-crumb"><a href="{rel}Diensten">{esc(h['crumb_home'])}</a> <span>/</span> <span>{esc(h['crumb'])}</span></div>
<span class="eyebrow">{esc(h['eyebrow'])}</span>
<h1 class="et-h1">{esc(h['h1a'])}<br/> <span class="grad">{esc(h['h1b'])}</span></h1>
<p class="lead et-lede">{esc(h['lede'])}</p>
<div class="et-cta"><a class="btn" data-book="" href="{rel}Contact">{esc(h['cta'])} {ARROW}</a><a class="btn-ghost" href="{attr(h['cta2_href'])}">{esc(h['cta2'])}</a></div>
<div class="et-pick-wrap">
<p class="et-label" id="etPickL">{esc(h['pick'])}</p>
{chips('etPickL')}
</div>
</div>
<div class="et-phonecol">
<div class="et-phone" data-et-phone="">
<div class="et-ph-top"><span aria-hidden="true" class="et-ph-ico"></span><div class="et-ph-t"><b data-et-group="">{esc(fill(u['group'], {'bedrijf': n0['bedrijf']}))}</b><span data-et-members="">{esc(fill(u['members'], {'n': agents_of(n0)}))}</span></div><span class="et-tag">{esc(u['example'])}</span></div>
<p aria-hidden="true" class="et-ph-status" data-et-status=""><span></span></p>
<div class="et-threads" data-et-threads="">{threads}</div>
</div>
<div class="et-ctrl"><button aria-label="{attr(u['pause_aria'])}" class="et-pbtn" data-et-pause="" data-state="playing" type="button">{PLAY}<span>{esc(u['pause'])}</span></button><button aria-label="{attr(u['again_aria'])}" class="et-pbtn" data-et-again="" type="button">{AGAIN}<span>{esc(u['again'])}</span></button></div>
<p class="et-cap">{esc(h['caption'])}</p>
<p class="sr-only" data-et-sr="">{esc(fill(u['sr_hero'], {'bedrijf': n0['bedrijf'], 'wat': n0['wat']}))}</p>
<p aria-live="polite" class="sr-only" data-et-live=""></p>
</div>
</div>
<div class="wrap"><div class="et-foot">{foot}</div></div>
</header>
<!-- ════════ WAT HET IS ════════ -->
<section class="sec et-wat" id="wat">
<div class="wrap">
{sec_head(wt)}
<div class="et-cards" data-reveal-group="">{cards}</div>
<p class="et-note">{esc(wt['note'])}</p>
</div>
</section>
<!-- ════════ PER AFDELING: het organigram ════════ -->
<section class="sec et-org" id="afdelingen">
<div class="wrap">
{sec_head(af)}
<p class="et-label" id="etOrgL">{esc(u['tab_label'])}</p>
{chips('etOrgL')}
<div class="et-charts" data-et-charts="">{charts}</div>
<p class="et-afmore">{esc(af['more'])}</p>
</div>
</section>
<!-- ════════ HOE HET WERKT ════════ -->
<section class="sec et-stap" id="stappen">
<div class="wrap">
{sec_head(st)}
<ol class="et-steps" data-reveal-group="">{steps}</ol>
</div>
</section>
<!-- ════════ PAKKETTEN EN PRIJZEN ════════ -->
<section class="sec et-pak" id="pakketten">
<div class="wrap">
{sec_head(pk)}
<div class="et-kies" data-et-kies="">
<p class="et-kies-q" id="etKiesL">{esc(pk['kies'])}</p>
<div aria-labelledby="etKiesL" class="et-picks" role="group">{picks}</div>
</div>
<div class="et-plans" data-et-plans="">{plans}</div>
<div class="et-table" data-et-table=""><table>
<thead>{thead}</thead>
<tbody>{rows}</tbody>
</table></div>
<p class="et-tfoot">{esc(pk['foot'])}</p>
<div class="et-pak-cta"><a class="btn" data-book="" href="{rel}Contact">{esc(pk['cta'])} {ARROW}</a></div>
<p class="et-small">{esc(pk['small'])} <a class="et-link" href="{rel}{attr(pk['small_href'])}">{esc(pk['small_link'])} {ARROW}</a></p>
</div>
</section>
<!-- ════════ VOORWAARDEN: zwart op wit ════════ -->
<section class="sec et-vw" id="voorwaarden">
<div class="wrap">
{sec_head(vw)}
<ol class="et-terms" data-reveal-group="">{terms}</ol>
</div>
</section>
<!-- ════════ FAQ ════════ -->
<section class="sec et-faq" id="faq">
<div class="wrap">
{sec_head(fq)}
<div class="faq-list" data-et-faq="" data-reveal="">{faqs}</div>
<p class="et-moreq">{esc(fq['more_label'])} {more}</p>
</div>
</section>
<!-- ════════ CTA ════════ -->
<section class="cta-band" id="contact">
<div class="glow"></div>
<div class="wrap">
<div class="cta-inner" data-reveal="">
<h2>{esc(ct['h2a'])} <span class="grad">{esc(ct['h2b'])}</span></h2>
<p class="lead">{esc(ct['text'])}</p>
<div class="row"><a class="btn" data-book="" href="{rel}Contact">{esc(ct['btn'])} {ARROW}</a><a class="btn-ghost" href="{rel}{attr(ct['demo_href'])}">{esc(ct['demo'])}</a></div>
<div class="badges">{badges}</div>
</div>
</div>
</section>
</main>
<script data-no-i18n="" id="etData" type="application/json">{djson}</script>
'''
