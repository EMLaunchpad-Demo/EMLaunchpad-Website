# HTML van de contactpagina ("Rechtstreeks"). body(L, lang, pre) -> str
# Alle tekst komt uit <taal>.json; niets wordt hier verzonnen. Alle inhoud staat in de HTML,
# zodat de pagina zonder JavaScript volledig leesbaar en bruikbaar is. contact.js tekent alleen
# de dunne lijnen van elke weg naar de werkplekfoto (vanaf 1000 px, niet bij minder beweging).
import html, re

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def I(d, sw='1.8', vb='0 0 24 24', fill='none'):
    return ('<svg aria-hidden="true" fill="%s" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
            'stroke-width="%s" viewBox="%s">%s</svg>' % (fill, sw, vb, d))

ARROW = I('<path d="M3 8h10M9 4l4 4-4 4"></path>', '2', '0 0 16 16')
PLUS = '<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"></path></svg>'
ICONS = {
    'tel': I('<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.1-8.7A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8.1 9.5a16 16 0 006 6l1.1-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z"></path>'),
    'wa': ('<svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-2.9.9.9-2.8-.2-.3A8.2 8.2 0 1112 20.2zm4.7-6.1c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.2-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 01-2-1.2 7.4 7.4 0 01-1.4-1.7c-.1-.3 0-.4.1-.6l.4-.5.3-.5v-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.9 11.9 0 004.6 4 5.2 5.2 0 003.2.7 2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.6-.3z"></path></svg>'),
    'mail': I('<rect height="16" rx="2" width="20" x="2" y="4"></rect><path d="m2 6 10 7L22 6"></path>'),
    'demo': I('<rect height="18" rx="2" width="18" x="3" y="4"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>'),
}

def links(s, rel):
    """[label](href) in een tekst wordt een interne link (nette vorm, in de taal van de pagina)."""
    out, pos = [], 0
    for m in re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', s):
        out.append(esc(s[pos:m.start()]))
        out.append('<a href="%s%s">%s</a>' % (rel, attr(m.group(2)), esc(m.group(1))))
        pos = m.end()
    out.append(esc(s[pos:]))
    return ''.join(out)

def body(L, lang, pre):
    h, b, fq, ct = L['hero'], L['bericht'], L['faq'], L['cta']
    rel = ''                      # interne links blijven in de taal van de pagina (/en/Contact -> /en/Diensten)
    home = './'

    # ---------------- de vier wegen ----------------
    ways = []
    for i, w in enumerate(h['wegen']):
        book = ' data-book=""' if w.get('book') else ''
        href = (rel + w['href']) if w.get('book') else w['href']
        cls = 'ct-way is-main' if w.get('book') else 'ct-way'
        ways.append(
            '<li><a class="%s" data-ct-way="%d" href="%s"%s>'
            '<span class="ct-ic">%s</span>'
            '<span class="ct-txt"><span class="ct-k">%s</span><span class="ct-v"%s>%s</span><span class="ct-n">%s</span></span>'
            '<span class="ct-go"><span class="ct-go-t">%s</span>%s</span></a></li>'
            % (cls, i, attr(href), book, ICONS[w['icon']], esc(w['k']),
               ' translate="no"' if w['icon'] in ('tel', 'mail') else '', esc(w['v']), esc(w['n']), esc(w['go']), ARROW))
    ways = '\n'.join(ways)

    n = h['nap']
    streek = ('<a class="ct-link" href="%s%s">%s %s</a>' % (rel, attr(n['streek_href']), esc(n['streek']), ARROW)) if n.get('streek') else ''
    f = h['foto']

    # ---------------- wat er daarna gebeurt ----------------
    steps = '\n'.join('<li><span class="ct-num" aria-hidden="true">%02d</span><div><strong>%s</strong><p>%s</p></div></li>'
                      % (i + 1, esc(s['t']), esc(s['d'])) for i, s in enumerate(b['stappen']))
    fm = b['form']

    faqs = '\n'.join(
        '<div class="faq-item">\n<button class="faq-q">%s<span class="ic">%s</span></button>\n'
        '<div class="faq-a"><div class="faq-a-inner">%s</div></div>\n</div>' % (esc(q['q']), PLUS, links(q['a'], rel))
        for q in fq['items'])

    return f'''<main class="ct-main" id="main" tabindex="-1">
<!-- ════════ HERO: Rechtstreeks. Elke weg komt bij ons uit ════════ -->
<header class="ct-hero">
<div class="wrap">
<div class="ct-crumb"><a href="{home}">{esc(h['crumb_home'])}</a> <span aria-hidden="true">/</span> <span>{esc(h['crumb'])}</span></div>
<div class="ct-stage" data-ct-stage="">
<div class="ct-copy">
<span class="eyebrow">{esc(h['eyebrow'])}</span>
<h1 class="ct-h1">{esc(h['h1a'])} <span class="grad">{esc(h['h1b'])}</span></h1>
<p class="lead ct-lede">{esc(h['lede'])}</p>
<p class="ct-label" id="ctWegen">{esc(h['wegen_label'])}</p>
<ul aria-labelledby="ctWegen" class="ct-ways">
{ways}
</ul>
<p class="ct-fast"><span aria-hidden="true" class="ct-dot"></span>{esc(h['snel'])}</p>
</div>
<figure class="ct-photo" data-ct-photo="">
<div class="ct-frame"><img alt="{attr(f['alt'])}" decoding="async" fetchpriority="high" height="1448" loading="eager" sizes="{attr(f['sizes'])}" src="{pre}{attr(f['src1086'])}" srcset="{pre}{attr(f['src720'])} 720w, {pre}{attr(f['src1086'])} 1086w" width="1086"/></div>
<i aria-hidden="true" class="ct-socket"></i>
<figcaption class="ct-cap"><span class="ct-cap-k"><span aria-hidden="true" class="ct-dot"></span>{esc(f['label'])}</span><span class="ct-cap-t">{esc(f['tekst'])}</span></figcaption>
</figure>
<svg aria-hidden="true" class="ct-wires" data-ct-wires="" focusable="false"></svg>
</div>
<address class="ct-nap">
<div class="ct-nap-i"><span class="ct-k">{esc(n['adres_k'])}</span><span class="ct-v">{esc(n['adres'])}</span><span class="ct-n">{esc(n['adres_s'])}</span>{streek}</div>
<div class="ct-nap-i"><span class="ct-k">{esc(n['btw_k'])}</span><span class="ct-v" translate="no">{esc(n['btw'])}</span><span class="ct-n">{esc(n['btw_s'])}</span></div>
</address>
</div>
</header>
<!-- ════════ BERICHT: het formulier ════════ -->
<section class="sec ct-msg" id="bericht">
<div class="wrap">
<div class="ct-msg-grid">
<div class="ct-msg-copy" data-reveal="">
<span class="eyebrow">{esc(b['eyebrow'])}</span>
<h2 class="h2">{esc(b['h2a'])} <span class="grad">{esc(b['h2b'])}</span></h2>
<p class="lead">{esc(b['sub'])}</p>
<ol class="ct-next">
{steps}
</ol>
</div>
<div class="ct-form">
<div class="ct-embed">
<iframe loading="lazy" data-activation-type="alwaysActivated" data-activation-value="" data-deactivation-type="neverDeactivate" data-deactivation-value="" data-form-id="{attr(fm['id'])}" data-form-name="{attr(fm['name'])}" data-height="{attr(fm['height'])}" data-layout="{{'id':'INLINE'}}" data-layout-iframe-id="inline-{attr(fm['id'])}" data-trigger-type="alwaysShow" data-trigger-value="" id="inline-{attr(fm['id'])}" src="https://api.leadconnectorhq.com/widget/form/{attr(fm['id'])}" style="width:100%;height:100%;border:none;border-radius:0px" title="{attr(fm['title'])}">
</iframe>
</div>
<p class="form-note">{esc(b['note'])} <a href="mailto:ebert@emlaunchpad.com">ebert@emlaunchpad.com</a></p>
</div>
</div>
</div>
</section>
<!-- ════════ FAQ ════════ -->
<section class="sec ct-faq" id="faq">
<div class="wrap">
<div class="ct-faq-grid">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(fq['eyebrow'])}</span>
<h2 class="h2">{esc(fq['h2a'])} <span class="grad">{esc(fq['h2b'])}</span></h2>
</div>
<div class="faq-list">
{faqs}
</div>
</div>
</div>
</section>
<!-- ════════ CTA ════════ -->
<section class="cta-band">
<div class="glow"></div>
<div class="wrap">
<div class="cta-inner">
<h2>{esc(ct['h2a'])} <span class="grad">{esc(ct['h2b'])}</span></h2>
<p class="lead">{esc(ct['text'])}</p>
<div class="row"><a class="btn" data-book="" href="{rel}Contact">{esc(ct['btn'])} {ARROW}</a></div>
</div>
</div>
</section>
</main>
'''
