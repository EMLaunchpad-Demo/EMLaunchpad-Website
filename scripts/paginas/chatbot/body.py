# HTML van de chatbotpagina. body(L, lang, pre) -> str
# Overgenomen uit kennis/sessiescripts/cb/build_chatbot.py (sessie 24/9) en bijgewerkt in fase 1 (17/10/2026).
import json, html, re

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

ARROW = ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
         'stroke-width="2" viewbox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"></path></svg>')
DOWN = ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
        'stroke-width="2" viewbox="0 0 16 16"><path d="M8 3v10M4 9l4 4 4-4"></path></svg>')

def I(d, sw='1.8'):
    return ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
            'stroke-width="%s" viewbox="0 0 24 24">%s</svg>' % (sw, d))

WEB = I('<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"></path>')
FEAT_IC = [
    I('<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5z"></path>'),
    I('<path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"></path>'),
    I('<rect height="16" rx="2" width="18" x="3" y="5"></rect><path d="M3 10h18M8 3v4M16 3v4M8.5 15l2 2 4-4"></path>'),
    I('<circle cx="9" cy="8" r="3.2"></circle><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"></path><path d="M16 11l3 3-3 3M19 14h-6" transform="translate(1 -2)"></path>'),
    I('<path d="M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8"></path><path d="M11 5c0 3-2.5 6.5-6 8"></path><path d="M13 21l4-9 4 9M14.5 18h5"></path>'),
    I('<path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.5-.8z"></path>'),
]
CHECK = I('<path d="M5 12.5l4.5 4.5L19 7.5"></path>', '2.4')

def logo(pre, ch, cls='', alt=None):
    """alt=None: kanaalnaam als alt; alt='': decoratief (zichtbare tekst noemt het kanaal al)."""
    if ch == 'web':
        if alt:
            return '<span aria-label="%s" class="%s cb-webic" role="img">%s</span>' % (html.escape(alt, quote=True), cls, WEB)
        return '<span class="%s cb-webic">%s</span>' % (cls, WEB)
    name = {'whatsapp': 'WhatsApp', 'instagram': 'Instagram', 'messenger': 'Messenger'}[ch]
    return '<img alt="%s" class="%s" height="22" src="%sassets/logos/%s.svg" width="22"/>' % (name if alt is None else alt, cls, pre, ch)

def links_par(items, cls):
    """Kruislinks onder de FAQ: [{pre, t, href, post, ext?}]. ext = een NL-pad (EM Times) dat vanuit en/ en fr/ met ../ begint."""
    out = []
    for it in items:
        href = it['href']
        out.append('%s<a href="%s">%s</a>%s' % (esc(it.get('pre', '')), attr(href), esc(it['t']), esc(it.get('post', ''))))
    return '<p class="%s">%s</p>\n' % (cls, ' '.join(out)) if out else ''

def body(L, lang, pre):
    h, ib, d, pr, ft, pc, hw, fq, ct = (L['hero'], L['inbox'], L['demo'], L['proof'], L['feats'],
                                       L['price'], L['how'], L['faq'], L['cta'])
    case = ('' if lang == 'nl' else '../') + 'Clinic3D'
    chips = ''.join('<li>%s</li>' % esc(c) for c in h['chips'])
    weblabel = [c['label'] for c in d['channels'] if c['key'] == 'web'][0]
    rows = ''.join(
        '<li class="ib-row" data-kind="%s"><span class="ib-ch">%s</span><span class="ib-body">'
        '<span class="ib-top"><b>%s</b><time>%s</time></span><span class="ib-msg">%s</span>'
        '<span class="ib-status"><span class="ib-typing"><i></i><i></i><i></i>%s</span><span class="ib-done">%s</span></span>'
        '</span></li>' % (r['kind'], logo(pre, r['ch'], alt=weblabel if r['ch'] == 'web' else None), esc(r['who']), r['time'], esc(r['msg']), esc(ib['typing']), esc(r['status']))
        for r in ib['rows'])
    seg_sector = ''.join('<button aria-pressed="%s" class="%s" data-v="%d" type="button">%s</button>'
                         % ('true' if i == 0 else 'false', 'on' if i == 0 else '', i, esc(s['label'])) for i, s in enumerate(d['sectors']))
    seg_tone = ''.join('<button aria-pressed="%s" class="%s" data-v="%d" type="button">%s</button>'
                       % ('true' if i == 0 else 'false', 'on' if i == 0 else '', i, esc(t['label'])) for i, t in enumerate(d['tones']))
    seg_ch = ''.join('<button aria-pressed="%s" class="%s" data-v="%s" type="button">%s%s</button>'
                     % ('true' if i == 0 else 'false', 'on' if i == 0 else '', c['key'], logo(pre, c['key'], 'seg-logo', alt=''), esc(c['label']))
                     for i, c in enumerate(d['channels']))
    demo_json = {k: d[k] for k in ('you', 'log_now', 'log_book', 'sectors', 'online', 'channels')}
    demo_json['logos'] = {c['key']: ('' if c['key'] == 'web' else pre + 'assets/logos/%s.svg' % c['key']) for c in d['channels']}
    djson = json.dumps(demo_json, ensure_ascii=False).replace('</', '<\\/')
    s0 = d['sectors'][0]
    greet0 = re.sub(r'\{([^{}|]*)\|[^{}]*\}', lambda m: m.group(1), s0['greet'])
    feats = ''.join(
        '<article class="cb-feat" tabindex="0"><span class="f-ic">%s</span><h3>%s</h3><p>%s</p><span class="cb-ex">%s</span></article>'
        % (FEAT_IC[i], esc(it['t']), esc(it['d']), esc(it['ex'])) for i, it in enumerate(ft['items']))
    chlogos = ''.join('<span class="cb-chl">%s<b>%s</b></span>' % (logo(pre, c['key'], alt=''), esc(c['label'])) for c in d['channels'])
    points = ''.join('<li>%s%s</li>' % (CHECK, esc(p)) for p in pc['points'])
    steps = ''.join('<li><span class="s-n">0%d</span><h3>%s</h3><p>%s</p></li>' % (i + 1, esc(s['t']), esc(s['d'])) for i, s in enumerate(hw['steps']))
    faqs = ''.join('<div class="faq-item"><button class="faq-q" type="button">%s<span class="ic"><svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" viewbox="0 0 16 16"><path d="M8 3v10M3 8h10"></path></svg></span></button><div class="faq-a"><div class="faq-a-inner">%s</div></div></div>'
                   % (esc(q['q']), esc(q['a'])) for q in fq['items'])
    more = links_par(fq.get('more', []), 'cb-more')
    badges = ''.join('<span>%s</span>' % esc(b) for b in ct['badges'])
    return f'''<!-- ════════ HERO ════════ -->
<header class="cb-hero" id="main" tabindex="-1">
<div class="glow"></div>
<div class="wrap cb-hero-grid">
<div class="cb-hero-copy">
<div class="cb-crumb"><a href="Diensten">{esc(h['crumb_parent'])}</a> <span>/</span> <span>{esc(h['crumb'])}</span></div>
<p class="cb-live"><i></i><span data-live="" data-now="{esc(h['live_now'])}" data-post="{esc(h['live_post'])}">{esc(h['live_static'])}</span></p>
<h1 class="cb-h1">{esc(h['h1a'])}<br/> <span class="grad">{esc(h['h1b'])}</span></h1>
<p class="lead cb-lede">{esc(h['lede'])}</p>
<ul class="cb-chips">{chips}</ul>
<div class="cb-cta"><a class="btn" data-book="" href="Contact">{esc(h['cta1'])} {ARROW}</a><a class="btn-ghost" href="#demo">{esc(h['cta2'])} {DOWN}</a></div>
</div>
<div class="cb-inbox" data-inbox="">
<div class="ib-head"><span class="ib-title"><b>{esc(ib['title'])}</b><span>{esc(ib['sub'])}</span></span><span class="ib-tag">{esc(ib['tag'])}</span></div>
<ol class="ib-list">{rows}</ol>
<p class="ib-sum">{esc(ib['sum'])}</p>
</div>
</div>
</header>
<!-- ════════ DEMO ════════ -->
<section class="sec cb-demo-sec" id="demo">
<div class="wrap">
<div class="sec-head center" data-reveal="">
<span class="eyebrow">{esc(d['eyebrow'])}</span>
<h2 class="h2">{esc(d['h2a'])}<br/> <span class="grad">{esc(d['h2b'])}</span></h2>
<p class="lead">{esc(d['lede'])}</p>
</div>
<div class="cb-demo" data-demo="">
<div class="cb-ctrls">
<div class="cb-ctrl"><span class="cb-ctrl-l">{esc(d['lbl_sector'])}</span><div aria-label="{esc(d['lbl_sector'])}" class="cb-seg" data-seg="sector" role="group">{seg_sector}</div></div>
<div class="cb-ctrl"><span class="cb-ctrl-l">{esc(d['lbl_tone'])}</span><div aria-label="{esc(d['lbl_tone'])}" class="cb-seg" data-seg="tone" role="group">{seg_tone}</div></div>
<div class="cb-ctrl"><span class="cb-ctrl-l">{esc(d['lbl_channel'])}</span><div aria-label="{esc(d['lbl_channel'])}" class="cb-seg" data-seg="ch" role="group">{seg_ch}</div></div>
</div>
<div class="cb-stage">
<div class="cb-chat ch-web" data-chat="">
<div class="cc-head"><span class="cc-ava" data-ava="">{esc(s0['biz'][0].upper())}</span><span class="cc-id"><b data-biz="">{esc(s0['biz'])}</b><span><i class="cc-dot"></i>{esc(d['online'])}</span></span><span class="cc-ch" data-chname="">{logo(pre, 'web', 'cc-chlogo')}<span>{esc(d['channels'][0]['label'])}</span></span></div>
<div aria-label="{esc(d['chat_label'])}" aria-live="polite" class="cc-body" data-body="" role="log" tabindex="0"><div class="cc-msg bot">{esc(greet0)}</div></div>
<div class="cc-quick" data-quick="">{''.join('<button type="button" disabled>%s</button>' % esc(it['q']) for it in s0['intents'])}</div>
<div class="cc-input"><span>{esc(d['input'])}</span><i aria-hidden="true">{ARROW}</i></div>
</div>
<aside class="cb-log">
<div class="cl-head"><b>{esc(d['log_title'])}</b><button class="cl-restart" data-restart="" type="button">{esc(d['restart'])}</button></div>
<ol aria-live="polite" class="cl-list" data-log=""><li class="cl-empty">{esc(d['log_empty'])}</li></ol>
<p class="cb-note">{esc(d['note'])}</p>
</aside>
</div>
</div>
</div>
<script id="cbDemo" type="application/json">{djson}</script>
</section>
<!-- ════════ BEWIJS ════════ -->
<section class="sec cb-proof-sec">
<div class="wrap">
<div class="cb-proof" data-reveal="">
<div class="cb-proof-copy">
<span class="eyebrow">{esc(pr['eyebrow'])}</span>
<h2 class="h2">{esc(pr['h2a'])}<br/> <span class="grad">{esc(pr['h2b'])}</span></h2>
<p class="lead">{esc(pr['text'])}</p>
<a class="cb-link" href="{case}">{esc(pr['link'])} {ARROW}</a>
</div>
<div class="cb-bars" data-bars="">
<div class="cb-bar-row"><div class="lbl"><b data-to="{pr['bar_a_n']}">{pr['bar_a_n']}</b><span>{esc(pr['bar_a'])}</span></div><div class="cb-bar"><i class="a" style="--w:100%"></i></div></div>
<div class="cb-bar-row"><div class="lbl"><b data-to="{pr['bar_b_n']}">{pr['bar_b_n']}</b><span>{esc(pr['bar_b'])}</span></div><div class="cb-bar"><i class="b" style="--w:{pr['bar_b_w']}"></i></div></div>
<p class="cb-proof-note">{esc(pr['note'])}</p>
</div>
</div>
</div>
</section>
<!-- ════════ WAT HIJ DOET ════════ -->
<section class="sec cb-feat-sec">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(ft['eyebrow'])}</span>
<h2 class="h2">{esc(ft['h2a'])}<br/> <span class="grad">{esc(ft['h2b'])}</span></h2>
<p class="lead cb-hint">{esc(ft['hint'])}</p>
</div>
<div class="cb-feats" data-reveal-group="">{feats}</div>
<div class="cb-channels" data-reveal=""><span class="cb-chan-l">{esc(ft['channels_lbl'])}</span><span class="cb-chan-row">{chlogos}</span></div>
</div>
</section>
<!-- ════════ PRIJS ════════ -->
<section class="sec cb-price-sec">
<div class="wrap cb-price" data-reveal="">
<div class="cb-price-copy">
<span class="eyebrow">{esc(pc['eyebrow'])}</span>
<h2 class="h2">{esc(pc['h2a'])}<br/> <span class="grad">{esc(pc['h2b'])}</span></h2>
<p class="lead">{esc(pc['text'])}</p>
</div>
<div class="cb-price-card">
<div class="cp-amount"><b>{esc(pc['amount'])}</b><span>{esc(pc['per'])}</span></div>
<p class="cp-plus">{esc(pc['plus'])}</p>
<ul class="cp-points">{points}</ul>
<div class="cp-cta"><a class="btn" data-book="" href="Contact">{esc(pc['cta2'])} {ARROW}</a><a class="btn-ghost" href="Diensten#pakket-1">{esc(pc['cta'])}</a></div>
</div>
</div>
</section>
<!-- ════════ HOE HET WERKT ════════ -->
<section class="sec cb-how-sec">
<div class="wrap">
<h2 class="cb-how-h" data-reveal=""><span class="cb-slash">//</span>{esc(hw['h'])}</h2>
<ol class="cb-steps" data-reveal-group="">{steps}</ol>
</div>
</section>
<!-- ════════ FAQ ════════ -->
<section class="sec cb-faq-sec">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(fq['eyebrow'])}</span>
<h2 class="h2">{esc(fq['h2a'])} <span class="grad">{esc(fq['h2b'])}</span></h2>
</div>
<div class="faq-list" data-reveal="">{faqs}</div>
{more}</div>
</section>
<!-- ════════ CTA ════════ -->
<section class="cta-band" id="contact">
<canvas aria-hidden="true" class="starfield" data-stars=""></canvas>
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
'''
