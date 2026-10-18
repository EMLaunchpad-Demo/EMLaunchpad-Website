# HTML van de Pakketkiezer ("Eerlijk gewogen"). body(L, lang, pre) -> str
# Zonder JavaScript: alle zes vragen tegelijk, per gekozen antwoord de uitleg (puur CSS),
# een stilstaande weegschaal en alle secties. Met JavaScript (html.pk-js): één vraag per keer,
# een weegschaal die meeweegt en een weegbriefje als resultaat (pakketkiezer.js).
import json, html, re, math, urllib.parse

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def cap(s):
    s = str(s)
    return s[:1].upper() + s[1:]

def fill(s, v):
    return re.sub(r'\{(\w+)\}', lambda m: str(v.get(m.group(1), m.group(0))), s)

def I(d, sw='1.8', vb='0 0 24 24'):
    return ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
            'stroke-width="%s" viewBox="%s">%s</svg>' % (sw, vb, d))

ARROW = I('<path d="M3 8h10M9 4l4 4-4 4"></path>', '2', '0 0 16 16')
WA = ('<svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-2.9.9.9-2.8-.2-.3A8.2 8.2 0 1112 20.2z"></path>'
      '<path d="M16.7 14.1c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.2-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3a.5.5 0 000-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 2.9 2.9 0 00-.9 2.2 5 5 0 001.1 2.7 11.5 11.5 0 004.4 3.9c1.6.7 2.3.8 3.1.6a2.6 2.6 0 001.7-1.2 2.1 2.1 0 00.1-1.2c0-.1-.2-.2-.5-.3z"></path></svg>')
WA_NR = '32476015451'

# ---------------- de weegschaal (SVG, viewBox 0 0 560 344) ----------------
def pot(w_bot, w_top, h, neck, knob, icon=''):
    """potgewicht met knop, oorsprong = midden onderaan"""
    b, t = w_bot / 2, w_top / 2
    return ('<path class="pk-body" d="M%g 0L%g %gH%gL%g 0Z"></path><path class="pk-ln" d="M%g %gV%gH%gV%g"></path><circle class="pk-ln" cx="0" cy="%g" r="%g"></circle>%s'
            % (-b, -t, -h, t, b, -neck[0], -h, -h - neck[1], neck[0], -h, -h - neck[1] - knob, knob, icon))

ICON = {
    # klein symbool op het gewicht: agenda, telefoon, bericht
    'K1': '<path class="pk-ico" d="M-5 -15h10v8h-10zM-5 -12.5h10M-2.5 -16.5v2.5M2.5 -16.5v2.5"></path>',
    'K2': '<path class="pk-ico" d="M-4.5 -16.5c0 5 4 9 9 9l1.3-2.2-2.6-1.4-1.2 1.2a5 5 0 01-3.1-3.1l1.2-1.2-1.4-2.6z"></path>',
    'K3': '<path class="pk-ico" d="M-5.5 -16h11v6.5h-6l-3 2.4v-2.4h-2z"></path>',
}

def weights_left():
    out = []
    for k in ('K1', 'K2', 'K3'):
        heavy = pot(26, 22, 24, (3, 3), 4, ICON[k])
        light = pot(20, 17, 17, (2.5, 2.5), 3, '<g transform="scale(.74)">%s</g>' % ICON[k].replace('class="pk-ico"', 'class="pk-ico pk-ico-s"'))
        out.append('<g class="pk-w" data-pk-w="%s" opacity="0"><g class="pk-sq"><g class="pk-heavy">%s</g><g class="pk-light">%s</g></g></g>' % (k, heavy, light))
    for i in range(5):
        out.append('<g class="pk-w pk-disc" data-pk-disc="%d" opacity="0"><g class="pk-sq"><rect class="pk-body" height="6" rx="2" width="34" x="-17" y="-6"></rect></g></g>' % i)
    return ''.join(out)

def dg_block():
    ribs_base = ''.join('<path class="pk-rib0" d="M%d -28V-6"></path>' % (-46 + 10 * i - 4) for i in range(1, 10))
    ribs_on = ''.join('<path class="pk-rib" data-rib="%d" d="M%d -28V-6" pathLength="1"></path>' % (i, -46 + 10 * i - 4) for i in range(1, 10))
    return ('<rect class="pk-body pk-ours" height="34" rx="4" width="92" x="-46" y="-34"></rect>' + ribs_base + ribs_on)

def scale_svg(L, u):
    def ang(phi, r):
        a = math.radians(phi)
        return 280 + r * math.sin(a), 150 - r * math.cos(a)
    x1, y1 = ang(-20, 58); x2, y2 = ang(20, 58)
    ticks = ''.join('<path class="pk-aux" d="M%.2f %.2fL%.2f %.2f"></path>' % (ang(p, 58) + ang(p, 62 if p else 66)) for p in (-18, -12, -6, 0, 6, 12, 18))
    pan = lambda cx: ('<path class="pk-ln" d="M%d 150V130"></path><path class="pk-ln" d="M%d 128H%d"></path><path class="pk-aux" d="M%d 128Q%d 142 %d 128"></path>'
                      % (cx, cx - 80, cx + 80, cx - 80, cx, cx + 80))
    eur50, eur150 = fill(L['eur'], {'n': 50}), fill(L['eur'], {'n': 150})
    chat = pot(20, 17, 14, (2.5, 2.5), 2.8, '<path class="pk-ico pk-ico-s" d="M-4.5 -11h9v5h-5l-2.5 2v-2h-1.5z"></path>')
    recep = pot(30, 25, 24, (3.5, 3), 4.5, '<path class="pk-ico" d="M-5 -17c0 5.5 4.5 10 10 10l1.4-2.4-2.8-1.6-1.3 1.3a5.6 5.6 0 01-3.4-3.4l1.3-1.3-1.6-2.8z"></path>')
    return f'''<svg aria-hidden="true" class="pk-svg" data-pk-svg="" focusable="false" viewBox="0 0 560 344">
<defs><linearGradient gradientUnits="userSpaceOnUse" id="pkGrad" x1="0" x2="0" y1="-6" y2="-28"><stop offset="0" stop-color="#2f74e0"></stop><stop offset="1" stop-color="#1f9e5f"></stop></linearGradient>
<clipPath id="pkWin"><rect height="30" rx="5" width="88" x="236" y="262"></rect></clipPath></defs>
<path class="pk-aux" d="M12 326H548"></path><path class="pk-aux pk-faint" d="M12 329H548"></path>
<path class="pk-ln pk-foot" d="M192 326L210 250H350L368 326Z"></path>
<rect class="pk-ln pk-win" height="30" rx="5" width="88" x="236" y="262"></rect>
<g clip-path="url(#pkWin)"><text class="pk-price" data-pk-price="a" x="280" y="283">{esc(u['dash'])}</text><text class="pk-price is-out" data-pk-price="b" x="280" y="283"></text></g>
<text class="pk-cap" x="280" y="304">{esc(u['per_month_caps'])}</text>
<text class="pk-plate" data-pk-plate="" x="280" y="318">{esc(L['gen']['plaat'])}</text>
<rect class="pk-ln" height="100" width="12" x="274" y="150"></rect>
<path class="pk-aux" d="M{x1:.2f} {y1:.2f}A58 58 0 0 1 {x2:.2f} {y2:.2f}"></path>{ticks}
<g data-pk-needle=""><path class="pk-ln pk-needle" d="M280 150V98"></path></g>
<g data-pk-beam=""><rect class="pk-ln pk-beam" height="6" rx="3" width="360" x="100" y="147"></rect><circle class="pk-ln" cx="100" cy="150" r="3"></circle><circle class="pk-ln" cx="460" cy="150" r="3"></circle></g>
<circle class="pk-ln pk-pivot" cx="280" cy="150" r="4.5"></circle>
<g data-pk-pan="L">{pan(100)}</g>
<g data-pk-pan="R">{pan(460)}</g>
<g class="pk-cons" data-pk-cons="" opacity="0"><rect class="pk-aux" height="26" rx="4" width="174" x="18" y="296"></rect><text class="pk-tag" x="105" y="313">{esc(u['tag_cons'])}</text></g>
<g class="pk-cons pk-eml" data-pk-eml="" opacity="0"><rect class="pk-aux" height="26" rx="4" width="174" x="18" y="296"></rect><text class="pk-tag" x="105" y="313">{esc(u['tag_eml'])}</text></g>
<text class="pk-hand" data-pk-note="count" opacity="0" x="62" y="288">? {esc(u['note_count'])}</text>
<g data-pk-layer="">
{weights_left()}
<g class="pk-piece" data-pk-piece="dg" transform="translate(428 326)"><g class="pk-sq">{dg_block()}</g></g>
<g class="pk-piece" data-pk-piece="chat" transform="translate(492 326)"><g class="pk-sq">{chat.replace('class="pk-body"', 'class="pk-body pk-ours"')}</g></g>
<g class="pk-piece" data-pk-piece="recep" transform="translate(526 326)"><g class="pk-sq">{recep.replace('class="pk-body"', 'class="pk-body pk-ours"')}</g></g>
</g>
<text class="pk-tag pk-wide" x="428" y="341">{esc(u['tag_dg'])}</text><text class="pk-tag pk-wide" x="492" y="341">+{esc(eur50)}</text><text class="pk-tag pk-wide" x="526" y="341">+{esc(eur150)}</text>
</svg>'''

# ---------------- de vragen ----------------
def questions(L, u):
    out = []
    n = len(L['q'])
    for qi, q in enumerate(L['q']):
        opts = q.get('opts') or [{'c': v['c'], 'label': v['label'], 'kort': v['kort'], 'eff': ''} for v in L['vak']]
        typ = 'checkbox' if q['type'] == 'check' else 'radio'
        rows = []
        for o in opts:
            iid = 'pk-%s-%s' % (q['id'], o['c'])
            eff = '<p class="pk-eff">%s</p>' % esc(o['eff']) if o.get('eff') else ''
            rows.append('<div class="pk-opt"><input id="%s" name="pk-%s" type="%s" value="%s"/><label for="%s"><span class="pk-mark" aria-hidden="true"></span><span class="pk-ot">%s</span></label>%s</div>'
                        % (iid, q['id'], typ, o['c'], iid, esc(o['label']), eff))
        hint = '<p class="pk-hint" id="pk-h-%s">%s</p>' % (q['id'], esc(q['hint'])) if q.get('hint') else ''
        legend = fill(q['legend'], L['gen'])
        desc = ' aria-describedby="pk-h-%s"' % q['id'] if q.get('hint') else ''
        out.append('<fieldset class="pk-q" data-pk-q="%s" data-i="%d"%s><legend class="pk-legend" tabindex="-1"><span class="pk-qn">%s</span> <span class="pk-qt" data-pk-qt="">%s</span></legend>%s<div class="pk-opts">%s</div></fieldset>'
                   % (q['id'], qi, desc, esc(fill(u['q_of'], {'n': qi + 1, 't': n})), esc(legend), hint, ''.join(rows)))
    return ''.join(out)

def body(L, lang, pre):
    h, u, r, S = L['hero'], L['ui'], L['result'], L['sections']
    rel = '' if lang == 'nl' else '../'
    eur = lambda n: fill(L['eur'], {'n': n})
    W, RU, PR, PF, ST, FQ, CT = S['weights'], S['rules'], S['prices'], S['proof'], S['steps'], S['faq'], S['cta']

    prog = ''.join('<li><span class="sr-only">%s</span></li>' % esc(fill(u['q_of'], {'n': i + 1, 't': len(L['q'])})) for i in range(len(L['q'])))
    incl = ''.join('<li data-pk-rib="%d"><span>%s</span> <em class="pk-tagx" hidden="">%s</em></li>' % (i + 1, esc(t), esc(u['for_you'])) for i, t in enumerate(L['ribs']))
    # de receptioniste kost ook €750 eenmalig: aparte vermelding, niet in de maandprijs
    sw = ''.join('<button aria-pressed="false" class="pk-k" data-pk-k="%s" type="button"><span class="pk-k-dot" aria-hidden="true"></span><b>%s</b><span class="pk-k-p">%s</span>%s</button>'
                 % (k, esc(cap(u[k])), esc(p), '<span class="pk-k-p pk-k-once">%s</span>' % esc(u['once']) if k == 'recep' else '')
                 for k, p in (('dg', eur(150)), ('chat', '+' + eur(50)), ('recep', '+' + eur(150))))

    # ---- secties ----
    def links(it):
        return ''.join('<a class="pk-link" href="%s%s">%s %s</a>' % (rel, h_, esc(t), ARROW) for h_, t in it.get('links', []))
    g1 = ''.join('<li class="pk-wrow" data-pk-row="rib-%d"><span class="pk-wn">%02d</span><div><b>%s</b><p>%s</p>%s</div><em class="pk-tagx" hidden=""></em></li>'
                 % (i + 1, i + 1, esc(it['t']), esc(it['d']), links(it)) for i, it in enumerate(W['items']))
    g2 = ''.join('<li class="pk-wrow" data-pk-row="%s"><span class="pk-wn">+%s%s</span><div><b>%s</b><p>%s</p><a class="pk-link" href="%s%s">%s %s</a></div><em class="pk-tagx" hidden=""></em></li>'
                 % (k, esc(eur(p)), '<span class="pk-wonce">%s</span>' % esc(u['once']) if k == 'recep' else '', esc(cap(u[k])), esc(W[k + '_d']), rel, W[k + '_href'], esc(W[k + '_more']), ARROW)
                 for k, p in (('chat', 50), ('recep', 150)))
    # naast de schaal: AI Consulting (€200 per maand) en EML AI Team (vanaf €3.500); het prijslabel staat boven de naam
    g3 = ''.join('<li class="pk-wrow pk-wrow-side" data-pk-row="%s"><div><span class="pk-wn">%s</span><b>%s</b><p>%s</p><a class="pk-link" href="%s%s">%s %s</a></div><em class="pk-tagx" hidden=""></em></li>'
                 % (k, esc(u[lbl]), esc(u[k]), esc(W[k + '_d']), rel, W[k + '_href'], esc(W[k + '_more']), ARROW)
                 for k, lbl in (('cons', 'on_request'), ('eml', 'eml_from')))
    rules = ''.join('<tr><th scope="row">%s</th><td>%s</td></tr>' % (esc(a), esc(b)) for a, b in RU['rows'])
    prices = ''.join('<li class="pk-pw" data-pk-pw="%d"><span class="pk-pw-win">%s</span><span class="pk-pw-t">%s</span><em class="pk-tagx" hidden="">%s</em></li>'
                     % (it['p'], esc(eur(it['p'])), esc(it['t']), esc(u['your_advice'])) for it in PR['items'])
    stats = ''.join('<div class="pk-stat"><b>%s</b><span>%s</span></div>' % (esc(a), esc(b)) for a, b in PF['stats'])
    steps = ''.join('<li><span class="pk-sn">%02d</span><h3>%s</h3><p>%s</p></li>' % (i + 1, esc(a), esc(b)) for i, (a, b) in enumerate(ST['items']))
    faqs = ''.join('<div class="faq-item"><button class="faq-q" type="button"><span class="pk-fq">%s</span><span class="ic"><svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"></path></svg></span></button><div class="faq-a"><div class="faq-a-inner">%s</div></div></div>'
                   % (esc(q['q']), esc(q['a'])) for q in FQ['items'])
    badges = ''.join('<span>%s</span>' % esc(b) for b in CT['badges'])
    wa_generic = attr('https://wa.me/%s?text=%s' % (WA_NR, urllib.parse.quote(L['wa']['generic'])))

    # ---- data voor JS ----
    keys = ('eur', 'ui', 'gen', 'vak', 'q', 'needs', 'fb', 'ribs', 'result', 'why', 'not', 'talk', 'talk_short', 'proof', 'brief', 'wa')
    data = {k: L[k] for k in keys}
    data.update({'lang': lang, 'rel': rel, 'wa_nr': WA_NR, 'cta': {k: CT[k] for k in ('h2a', 'h2b', 'h2a_r', 'h2b_r')}})
    djson = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

    return f'''<!-- ════════ HERO: de weegschaal ════════ -->
<section aria-labelledby="pkH1" class="pk-hero" data-pk-hero="" id="main" tabindex="-1">
<div class="wrap pk-grid">
<div class="pk-head">
<div class="pk-crumb"><a href="{rel}Diensten">{esc(h['crumb_home'])}</a> <span>/</span> <span>{esc(h['crumb'])}</span></div>
<span class="eyebrow">{esc(h['eyebrow'])}</span>
<h1 class="pk-h1" id="pkH1">{esc(h['h1a'])}<br/> <span class="grad">{esc(h['h1b'])}</span></h1>
<p class="lead pk-lede">{esc(h['lede'])}</p>
<p class="pk-facts">{esc(h['facts'])}</p>
<noscript><p class="pk-nojs">{esc(h['noscript'])}</p></noscript>
</div>
<div class="pk-main">
<div class="pk-card" data-pk-card="">
<p class="pk-welcome" data-pk-welcome="" hidden=""><span data-pk-welcomet=""></span> <button class="pk-tl" data-pk-restart="" type="button">{esc(u['restart'])}</button></p>
<ol aria-hidden="true" class="pk-prog" data-pk-prog="" hidden="">{prog}</ol>
<div class="pk-qs">{questions(L, u)}</div>
<p class="pk-fb" data-pk-fb="" hidden=""></p>
<p class="pk-err" data-pk-err="" hidden="" role="alert">{esc(u['pick_one'])}</p>
<div class="pk-nav" data-pk-nav="" hidden=""><button class="pk-back" data-pk-back="" type="button">{esc(u['back'])}</button><button class="btn pk-next" data-pk-next="" type="button">{esc(u['next'])} {ARROW}</button><button class="pk-tl pk-tores" data-pk-tores="" hidden="" type="button">{esc(u['to_result'])}</button></div>
</div>
<section aria-labelledby="pkResH" class="pk-ticket" data-pk-ticket="" hidden="">
<p class="pk-kick" data-pk-kick=""></p>
<h2 class="pk-rh" data-pk-rh="" id="pkResH" tabindex="-1"></h2>
<p class="pk-voor" data-pk-voor=""></p>
<div class="pk-pricebox">
<p class="pk-mode" data-pk-mode="">{esc(r['advice_label'])}</p>
<p class="pk-big" data-pk-big=""></p>
<p class="pk-once" data-pk-once="" hidden=""></p>
<p class="pk-opb" data-pk-opb=""></p>
<p class="pk-mono" data-pk-mono="">{esc(r['mono'])}</p>
<div class="pk-alt" data-pk-alt=""></div>
<p class="pk-ptxt" data-pk-ptxt=""></p>
<a class="pk-link" data-pk-elink="" hidden="" href="{rel}{r['eml_href']}">{esc(r['eml_link'])} {ARROW}</a>
</div>
<div class="pk-acts"><a class="btn pk-book" data-book="" href="{rel}Contact">{esc(r['book'])} {ARROW}</a><a class="btn-ghost pk-wa" data-pk-wa="" href="{wa_generic}" rel="noopener" target="_blank">{WA}{esc(r['wa'])}</a></div>
<p class="pk-micro">{esc(r['book_micro'])} {esc(r['wa_micro'])}</p>
<div class="pk-blk" data-pk-whyw=""><h3>{esc(r['why_h'])}</h3><ul class="pk-why" data-pk-why=""></ul></div>
<div class="pk-blk" data-pk-notw=""><h3>{esc(r['not_h'])}</h3><ul class="pk-not" data-pk-not=""></ul></div>
<div class="pk-blk" data-pk-talkw=""><h3>{esc(r['talk_h'])}</h3><ul class="pk-talk" data-pk-talk=""></ul></div>
<p class="pk-proof" data-pk-proof=""><span>{esc(r['proof_pre'])}</span> <b data-pk-proofv=""></b> <a class="pk-link" href="{rel}Clinic3D">{esc(r['proof_link'])} {ARROW}</a></p>
</section>
</div>
<div class="pk-side">
<figure class="pk-stage" data-pk-stage="">
<div aria-hidden="true" class="pk-lamp"></div>
{scale_svg(L, u)}
<figcaption class="pk-figcap">{esc(h['figcap'])}</figcaption>
</figure>
<button aria-controls="pkLists" aria-expanded="false" class="pk-sum" data-pk-sum="" hidden="" type="button"><span data-pk-sumt="">{esc(u['sum_none'])}</span><i aria-hidden="true"></i></button>
<div class="pk-lists" data-pk-lists="" hidden="" id="pkLists">
<p class="pk-start" data-pk-start="">{esc(h['start'])}</p>
<div class="pk-lcols">
<div class="pk-lcol"><p class="pk-lh">{esc(u['need_h'])}</p><ul data-pk-needs=""></ul></div>
<div class="pk-lcol"><p class="pk-lh">{esc(u['catch_h'])}</p><ul data-pk-catch=""></ul></div>
</div>
<div class="pk-off" data-pk-offw="" hidden=""><p class="pk-lh">{esc(u['off_h'])}</p><ul data-pk-off=""></ul></div>
</div>
<div class="pk-ticket pk-ticket-b" data-pk-ticketb="" hidden="">
<div class="pk-blk pk-try"><h3>{esc(r['try_h'])}</h3><p class="pk-tt">{esc(r['try_txt'])}</p><div aria-label="{attr(r['try_h'])}" class="pk-sw" role="group">{sw}</div>
<p class="pk-dev" data-pk-dev="" hidden=""><span data-pk-devt=""></span> <button class="pk-tl" data-pk-kreset="" type="button">{esc(r['dev_back'])}</button></p></div>
<details class="pk-incl"><summary>{esc(r['incl_h'])}</summary><ul data-pk-incl="">{incl}</ul></details>
<div class="pk-blk pk-brief"><h3>{esc(r['talk_cta_h'])}</h3>
<label class="pk-nl" for="pkName">{esc(r['name_label'])}</label><input autocomplete="organization" class="pk-name" id="pkName" maxlength="60" type="text"/>
<p class="pk-bh">{esc(r['brief_h'])}</p><pre class="pk-pre" data-pk-pre=""></pre>
<div class="pk-blinks"><button class="pk-tl" data-pk-copy="" type="button">{esc(r['copy'])}</button><button class="pk-tl" data-pk-share="" hidden="" type="button">{esc(r['share'])}</button><span class="pk-status" data-pk-status="" role="status"></span></div>
<p class="pk-foot">{esc(r['foot'])}</p></div>
<div class="pk-blk pk-edit"><h3>{esc(r['edit_h'])}</h3><div class="pk-chips" data-pk-chips=""></div><button class="pk-tl" data-pk-again="" type="button">{esc(r['again'])}</button></div>
</div>
</div>
</div>
<p aria-atomic="true" aria-live="polite" class="sr-only" data-pk-live="" id="pkLive"></p>
</section>
<!-- ════════ DE GEWICHTEN ════════ -->
<section class="sec pk-weights" id="gewichten">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(W['eyebrow'])}</span>
<h2 class="h2">{esc(W['h2a'])} <span class="grad">{esc(W['h2b'])}</span></h2>
<p class="lead">{esc(W['lede'])}</p>
</div>
<div class="pk-wgrid">
<div class="pk-wg pk-wg1"><h3>{esc(W['g1'])} <span>{esc(eur(150))}</span></h3><p class="pk-wsub">{esc(W['g1_sub'])}</p><ol class="pk-wl">{g1}</ol></div>
<div class="pk-wcol">
<div class="pk-wg"><h3>{esc(W['g2'])}</h3><p class="pk-wsub">{esc(W['g2_sub'])}</p><ul class="pk-wl">{g2}</ul></div>
<div class="pk-wg"><h3>{esc(W['g3'])}</h3><ul class="pk-wl">{g3}</ul></div>
</div>
</div>
</div>
</section>
<!-- ════════ ZO WEGEN WE ════════ -->
<section class="sec pk-rules" id="regels">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(RU['eyebrow'])}</span>
<h2 class="h2">{esc(RU['h2a'])} <span class="grad">{esc(RU['h2b'])}</span></h2>
<p class="lead">{esc(RU['lede'])}</p>
</div>
<div class="pk-table"><table><thead><tr><th scope="col">{esc(RU['th1'])}</th><th scope="col">{esc(RU['th2'])}</th></tr></thead><tbody>{rules}</tbody></table></div>
</div>
</section>
<!-- ════════ VIER PRIJZEN ════════ -->
<section class="sec sec--tight pk-prices" id="prijzen">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(PR['eyebrow'])}</span>
<h2 class="h2">{esc(PR['h2a'])} <span class="grad">{esc(PR['h2b'])}</span></h2>
<p class="lead">{esc(PR['lede'])}</p>
</div>
<ul class="pk-pws">{prices}</ul>
<p class="pk-pcons">{esc(PR['cons'])}</p>
<p class="pk-pcons">{esc(PR['eml'])}</p>
</div>
</section>
<!-- ════════ BEWIJS ════════ -->
<section class="sec pk-proofs" id="bewijs">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(PF['eyebrow'])}</span>
<h2 class="h2">{esc(PF['h2a'])} <span class="grad">{esc(PF['h2b'])}</span></h2>
<p class="lead">{esc(PF['lede'])}</p>
</div>
<div class="pk-stats">{stats}</div>
<a class="pk-link" href="{rel}Clinic3D">{esc(PF['link'])} {ARROW}</a>
</div>
</section>
<!-- ════════ NA HET WEGEN ════════ -->
<section class="sec sec--tight pk-steps" id="stappen">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(ST['eyebrow'])}</span>
<h2 class="h2">{esc(ST['h2a'])} <span class="grad">{esc(ST['h2b'])}</span></h2>
</div>
<ol class="pk-stl">{steps}</ol>
</div>
</section>
<!-- ════════ FAQ ════════ -->
<section class="sec pk-faq" id="faq">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(FQ['eyebrow'])}</span>
<h2 class="h2">{esc(FQ['h2a'])} <span class="grad">{esc(FQ['h2b'])}</span></h2>
</div>
<div class="faq-list" data-reveal="">{faqs}</div>
</div>
</section>
<!-- ════════ CTA ════════ -->
<section class="cta-band pk-cta" id="contact">
<div class="glow"></div>
<div class="wrap">
<div class="cta-inner" data-reveal="">
<h2 data-pk-ctah="">{esc(CT['h2a'])} <span class="grad">{esc(CT['h2b'])}</span></h2>
<p class="lead" data-pk-ctat="">{esc(CT['text'])}</p>
<div class="row"><a class="btn pk-book" data-book="" href="{rel}Contact">{esc(CT['btn'])} {ARROW}</a><a class="btn-ghost pk-wa" data-pk-wa="" href="{wa_generic}" rel="noopener" target="_blank">{WA}{esc(CT['wa'])}</a></div>
<div class="badges">{badges}</div>
</div>
</div>
</section>
<script data-no-i18n="" id="pkData" type="application/json">{djson}</script>
'''
