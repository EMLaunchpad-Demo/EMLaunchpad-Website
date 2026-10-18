# HTML van de receptioniste-pagina. body(L, lang, pre) -> str
# Overgenomen uit kennis/sessiescripts/rc/body.py (sessie 25/9) en bijgewerkt in fase 1 (17/10/2026).
import json, html, re

def esc(s):
    return html.escape(str(s), quote=False)

def attr(s):
    return html.escape(str(s), quote=True)

def I(d, sw='1.8', vb='0 0 24 24'):
    return ('<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" '
            'stroke-width="%s" viewBox="%s">%s</svg>' % (sw, vb, d))

ARROW = I('<path d="M3 8h10M9 4l4 4-4 4"></path>', '2', '0 0 16 16')
SPEAKER = I('<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"></path><path class="w1" d="M15.5 9a4 4 0 0 1 0 6"></path><path class="w2" d="M18.3 6.5a7.6 7.6 0 0 1 0 11"></path>')
PLAY = '<svg aria-hidden="true" viewBox="0 0 24 24"><path class="i-play" d="M8 5.5v13l10.5-6.5z" fill="currentColor"></path><g class="i-pause" fill="currentColor"><rect height="13" rx="1.2" width="3.6" x="6.6" y="5.5"></rect><rect height="13" rx="1.2" width="3.6" x="13.8" y="5.5"></rect></g></svg>'
AGAIN = I('<path d="M4 12a8 8 0 1 0 2.4-5.7"></path><path d="M4 4.5v4h4"></path>', '2')
CHECK = '<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1"></path></svg>'

# icoontjes voor kaartjes en de lijst in #fiche
IC = {
    'cal': '<rect height="16" rx="2" width="18" x="3" y="5"></rect><path d="M3 10h18M8 3v4M16 3v4M8.5 15l2 2 4-4"></path>',
    'sms': '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5z"></path>',
    'crm': '<circle cx="9" cy="8" r="3.2"></circle><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 8h4M17 12h4M18 16h3"></path>',
    'lead': '<path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.4 7.2 17.9l.9-5.4L4.2 8.7l5.4-.8z"></path>',
    'call': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"></path><path d="M15 3a6 6 0 0 1 6 6M15 7a2 2 0 0 1 2 2"></path>',
    'lang': '<path d="M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8"></path><path d="M11 5c0 3-2.5 6.5-6 8"></path><path d="M13 21l4-9 4 9M14.5 18h5"></path>',
    'clock': '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    'moon': '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"></path>',
    'hand': '<path d="M4 12h12M12 6l6 6-6 6"></path>',
    'note': '<path d="M6 3h9l4 4v14H6z"></path><path d="M14 3v5h5M9 12h7M9 16h5"></path>',
    'phone': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"></path>',
    # sectoren (fase 2)
    'scissors': '<circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M8.1 8.1L12 12M20 4L8.1 15.9M14.8 14.8L20 20"></path>',
    'leaf': '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"></path><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12"></path>',
    'steth': '<path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M5 2v2M11 2v2"></path><path d="M8 15a6 6 0 0 0 12 0v-3"></path><circle cx="20" cy="10" r="2"></circle>',
    'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"></path>',
}

# ---------- tijdlijn (zelfde formule als compile() in receptioniste.js) ----------
def fill(s, v):
    return re.sub(r'\{(\w+)\}', lambda m: str(v.get(m.group(1), m.group(0))), s)

def compile_dur(lines, vars, ring):
    t = ring + 0.5
    start = t
    prev = None
    last_end = t
    for ln in lines:
        if prev:
            t += 0.25 if prev == ln['who'] else (0.35 if prev == 'b' else 0.5)
        for w in fill(ln['t'], vars).split():
            n = sum(1 for c in w if c.isalnum())
            d = max(0.16, 0.10 + 0.055 * n)
            t += d
            last_end = t
            if re.search(r'[,;:]$', w): t += 0.18
            elif re.search(r'[.?!]$', w): t += 0.34
        t = last_end
        prev = ln['who']
    dur = last_end + 1.0
    return dur, last_end - start

def mmss(s):
    s = int(round(s))
    return '%02d:%02d' % (s // 60, s % 60)

def zaak(L, m, name=''):
    return fill(L['zaak_named'], {'naam': name}) if name else fill(L['zaak_anon'], {'x': m['noName']})

def card(e, slot, cls='rc-card'):
    return ('<li class="%s" data-k="%s"><span class="rc-ic">%s</span><span class="rc-ct"><b>%s</b><small>%s</small></span><span class="rc-slot">%s</span></li>'
            % (cls, e['k'], I(IC[e['k']]), esc(e['title']), esc(e['sub']), esc(slot.get(e['k'], ''))))

def body(L, lang, pre):
    h, u, lu, fi, bw, pr, lv, fq, ct = (L['hero'], L['ui'], L['luister'], L['fiche'], L['bewijs'],
                                         L['prijs'], L['live'], L['faq'], L['cta'])
    case = ('' if lang == 'nl' else '../') + 'Clinic3D'
    hc = L['heroCall']
    greet_mid = [g for g in L['greet'] if g[0] == 12][0][1]
    hero_lines = [fill(x['t'], {'groet': greet_mid}) for x in hc['lines']]

    # ---------------- HERO ----------------
    foot = ''.join('<span>%s</span>' % esc(f) for f in h['foot'])
    dock = ''.join(card(e, u['slot']) for e in hc['events'])
    trail = ''.join('<i data-k="%s">%s</i>' % (k, I(IC[k])) for k in ('cal', 'sms', 'crm'))
    sr_hero = ''.join('<li>%s: %s</li>' % (esc(u['who_r'] if x['who'] == 'r' else u['who_b']), esc(t))
                      for x, t in zip(hc['lines'], hero_lines))
    sr_hero += ''.join('<li>%s: %s</li>' % (esc(e['title']), esc(e['sub'])) for e in hc['events'])
    static_path = ('M0 60 C 60 60, 90 60, 120 60 S 180 38, 220 60 S 280 84, 320 60 S 380 30, 420 60 S 480 92, 520 60 '
                   'S 580 34, 620 60 S 680 80, 720 60 S 780 46, 820 60 S 880 60, 1000 60')

    # ---------------- LUISTER ----------------
    ticks = ''.join('<span class="rc-tick" style="left:%.4f%%">%02d</span>' % (hh / 24 * 100, hh) for hh in range(0, 25, 3))
    o0, o1 = L['open']
    moms = L['moments']
    default = [m for m in moms if m['id'] == 'm1412'][0]
    dots = ''.join('<span class="rc-dot%s" data-dot="%s" style="left:%.3f%%"></span>' % (' on' if m is default else '', m['id'], m['min'] / 1440 * 100)
                   for m in moms)
    mo_btns = ''.join(
        '<button aria-pressed="%s" class="rc-mo%s" data-mo="%s" type="button"><b>%s</b><span>%s</span></button>'
        % ('true' if m is default else 'false', ' on' if m is default else '', m['id'], esc(m['time']), esc(m['title']))
        for m in moms)
    ph = default['photo']
    def src(pid, w):
        return 'https://images.unsplash.com/%s?auto=format&fit=crop&w=%d&q=72' % (pid, w)
    def srcset(pid):
        return ', '.join('%s %dw' % (src(pid, w), w) for w in (720, 1000, 1400))
    d_vars = {'zaak': zaak(L, default)}
    d_dur, d_len = compile_dur(default['lines'], d_vars, 2.4)
    d_lines = [fill(x['t'], d_vars) for x in default['lines']]
    def tr_items(m, vars):
        out = []
        for x in m['lines']:
            t = fill(x['t'], vars)
            la = ' lang="%s"' % x['lang'] if x.get('lang') and x['lang'] != lang else ''
            trn = '<br/><small>%s</small>' % esc(x['tr']) if x.get('tr') else ''
            out.append('<li><b>%s</b> <span%s>%s</span>%s</li>' % (esc(u['who_r'] if x['who'] == 'r' else u['who_b']), la, esc(t), trn))
        return ''.join(out)
    last_line = d_lines[-1]
    static_cards = ''.join(card(e, u['slot']) for e in default['events'][-3:])

    # ---------------- FICHE ----------------
    caps = ''.join(
        '<li><button aria-pressed="false" class="rc-cap" data-cap="%d" type="button"><span class="rc-cap-ic">%s</span><span class="rc-cap-t"><b>%s</b><span>%s</span></span></button></li>'
        % (i, I(IC[c['ic']]), esc(c['t']), esc(c['d'])) for i, c in enumerate(fi['caps']))
    F = fi['fields']
    df = default['fiche']
    fiche_rows = (
        '<div class="rc-row" data-f="tijd"><dt>%s</dt><dd>%s · %s</dd></div>' % (esc(F['tijd']), esc(fi['today']), esc(default['time'])) +
        '<div class="rc-row" data-f="duur"><dt>%s</dt><dd>%s</dd></div>' % (esc(F['duur']), mmss(d_len)) +
        '<div class="rc-row" data-f="beller"><dt>%s</dt><dd>%s</dd></div>' % (esc(F['beller']), esc(df['beller'])) +
        '<div class="rc-row" data-f="taal"><dt>%s</dt><dd>%s</dd></div>' % (esc(F['taal']), esc(df['taal'])) +
        '<div class="rc-row rc-row-wide" data-f="uitkomst"><dt>%s</dt><dd><span class="rc-out">%s</span></dd></div>' % (esc(F['uitkomst']), esc(df['uitkomst'])) +
        '<div class="rc-row" data-f="sms"><dt>%s</dt><dd>%s</dd></div>' % (esc(F['sms']), esc(df['sms'])) +
        '<div class="rc-row rc-row-wide" data-f="samenvatting"><dt>%s</dt><dd data-sum="">%s</dd></div>' % (esc(F['samenvatting']), esc(df['samenvatting'])) +
        '<div class="rc-row rc-row-wide" data-f="transcript"><dt>%s</dt><dd><details class="rc-ftr"><summary>%s</summary><ol data-ftr="">%s</ol></details></dd></div>'
        % (esc(F['transcript']), esc(fi['transcript_open']), tr_items(default, d_vars)))

    # ---------------- SECTOREN (fase 2) ----------------
    # Vier blokken (kapsalon, schoonheidssalon, praktijk, garage). Links met "nl": true gaan naar een NL-pagina
    # (branchepagina's en regiopagina bestaan alleen in het Nederlands); vanuit en/ en fr/ dus met ../
    sc = L['sectoren']
    def sc_href(it):
        return attr((pre + it['href']) if it.get('nl') else it['href'])
    sc_cards = ''
    for it in sc['items']:
        dos = ''.join('<li>%s</li>' % esc(d) for d in it['do'])
        sc_cards += ('<article class="rc-sector" data-reveal="" id="sector-%s"><span class="rc-sector-k"><span class="rc-sector-ic">%s</span>%s</span>'
                     '<h3>%s</h3><p class="rc-sector-q"><span>%s</span> <q>%s</q></p><ul class="rc-sector-l">%s</ul>'
                     '<a class="rc-link" href="%s">%s %s</a></article>'
                     % (it['k'], I(IC[it['ic']]), esc(it['label']), esc(it['h']), esc(sc['q_label']), esc(it['q']), dos,
                        sc_href(it['link']), esc(it['link']['t']), ARROW))
    rg = sc['region']
    sc_region = '%s<a href="%s">%s</a>%s' % (esc(rg['pre']), sc_href(rg), esc(rg['t']), esc(rg.get('post', '')))

    # ---------------- BEWIJS ----------------
    H = [.72, .9, .62, 1, .8, .68, .94, .76, .6, .88, .7, .98, .66, .84, .74, .92, .64, .86, .78, 1, .7, .9, .62, .82, .96, .68, .8, .72, .9, .64, .86,
         .78, .6, .92, .7, .84, .66, .88, .74]
    kinds = ['a'] * 31 + ['m'] * 6 + ['v'] * 2
    strip = ''.join('<i class="%s" style="--i:%d;--h:%.2f"></i>' % (k, i, H[i]) for i, k in enumerate(kinds))

    # ---------------- PRIJS ----------------
    bill = ''
    for i, (lab, amt) in enumerate(pr['bill']):
        cls = 'rc-bl' + (' is-sum' if i == 2 else '') + (' is-note' if not amt else '')
        amt_html = ('<b class="grad">%s</b>' % esc(amt)) if i == 2 else ('<b>%s</b>' % esc(amt) if amt else '')
        bill += '<div class="%s" style="--d:%d"><span>%s</span><i></i>%s</div>' % (cls, i, esc(lab), amt_html)
    points = ''.join('<li style="--d:%d">%s<span>%s</span></li>' % (i, CHECK, esc(p)) for i, p in enumerate(pr['points']))

    # ---------------- LIVE ----------------
    steps = ''
    for i, s in enumerate(lv['steps']):
        extra = ''
        if i == 2:
            extra = '<span class="rc-node-ic">%s</span>' % I(IC['phone'], '2')
        if i == 3:
            extra = '<span class="rc-live-tag">%s</span>' % esc(lv['live_label'])
        steps += ('<li class="rc-step" style="--d:%d"><span class="rc-node%s"><i></i>%s</span><span class="s-n">0%d</span><h3>%s</h3><p>%s</p></li>'
                  % (i, ' is-phone' if i == 2 else (' is-live' if i == 3 else ''), extra, i + 1, esc(s['t']), esc(s['d'])))

    # ---------------- FAQ ----------------
    faqs = ''.join('<div class="faq-item"><button class="faq-q" type="button">%s<span class="ic"><svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"></path></svg></span></button><div class="faq-a"><div class="faq-a-inner">%s</div></div></div>'
                   % (esc(q['q']), esc(q['a'])) for q in fq['items'])
    # kruislinks onder de FAQ: [{pre, t, href, post, ext}]; ext = NL-pad (EM Times), vanuit en/ en fr/ met ../
    more = ' '.join('%s<a href="%s">%s</a>%s' % (esc(it.get('pre', '')), attr((pre + it['href']) if it.get('ext') else it['href']), esc(it['t']), esc(it.get('post', '')))
                    for it in fq['more'])
    badges = ''.join('<span>%s</span>' % esc(b) for b in ct['badges'])

    # ---------------- DATA voor JS ----------------
    data = {k: L[k] for k in ('ui', 'greet', 'open', 'zaak_named', 'zaak_anon', 'voices', 'heroCall', 'moments')}
    data['lang'] = lang
    data['photoBase'] = 'https://images.unsplash.com/'
    data['name'] = {k: lu[k] for k in ('name_preview', 'name_default')}
    data['fiche'] = {k: fi[k] for k in ('caps', 'sub', 'announce', 'today', 'fields', 'transcript_open')}
    djson = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')

    return f'''<!-- ════════ HERO: de lijn ════════ -->
<header class="rc-hero" data-rc-hero="" id="main" tabindex="-1">
<div class="wrap rc-top">
<div class="rc-copy">
<div class="rc-crumb"><a href="Diensten">{esc(h['crumb_parent'])}</a> <span>/</span> <span>{esc(h['crumb'])}</span></div>
<span class="eyebrow rc-in">{esc(h['eyebrow'])}</span>
<h1 class="rc-h1">{esc(h['h1a'])}<br/> <span class="grad">{esc(h['h1b'])}</span></h1>
<p class="lead rc-lede rc-in">{esc(h['lede'])}</p>
<div class="rc-cta rc-in"><a class="btn" data-book="" href="Contact">{esc(h['cta'])} {ARROW}</a><button class="rc-listen" data-listen="" data-on="{attr(h['listen_off'])}" data-off="{attr(h['listen'])}" type="button">{SPEAKER}<span>{esc(h['listen'])}</span></button></div>
</div>
<div aria-hidden="true" class="rc-dockwrap"><p class="rc-dock-h">{esc(h['dock_label'])}</p><ol class="rc-dock" data-dock="">{dock}</ol></div>
</div>
<div class="rc-stage">
<div class="wrap rc-stage-top">
<span class="rc-status" data-status=""><i></i><span data-status-t="">{esc(u['now'])} 21:14</span></span>
<button aria-label="{attr(u['pause'])}" class="rc-pause" data-pause="" type="button" hidden>{PLAY}<span class="rc-again">{AGAIN}</span></button>
<span class="rc-vnote" data-vnote="" hidden>{esc(h['voice_note'])}</span>
</div>
<div aria-hidden="true" class="rc-band"><canvas class="rc-line" data-line=""></canvas><svg class="rc-line-static" preserveAspectRatio="none" viewBox="0 0 1000 120"><path class="g" d="{static_path}"></path><path class="l" d="{static_path}"></path></svg></div>
<div aria-hidden="true" class="wrap rc-subwrap">
<p class="rc-prev" data-prev="">{esc(hero_lines[-2])}</p>
<div class="rc-who is-r" data-who="">{esc(u['who_r'])}</div>
<div class="rc-subs" data-subs=""><p class="rc-sub cur">{esc(hero_lines[-1])}</p></div>
<div class="rc-trail" data-trail="">{trail}<span data-trail-t="">{esc(hc['events'][-1]['title'])}</span></div>
</div>
<div class="wrap rc-static-play"><button class="rc-pbtn" data-play-static="" hidden type="button">{PLAY} {esc(h['play_static'])}</button></div>
</div>
<ol class="sr-only" aria-label="{attr(h['sr_title'])}">{sr_hero}</ol>
<div class="wrap"><div class="rc-foot">{foot}</div></div>
</header>
<!-- ════════ EEN DAG AAN DE LIJN ════════ -->
<section class="sec rc-luister" id="luister">
<div class="wrap">
<div class="sec-head center" data-reveal="">
<span class="eyebrow">{esc(lu['eyebrow'])}</span>
<h2 class="h2">{esc(lu['h2a'])}<br/> <span class="grad">{esc(lu['h2b'])}</span></h2>
<p class="lead">{esc(lu['lede'])}</p>
</div>
<div class="rc-day" data-day="" data-reveal="">
<div aria-hidden="true" class="rc-axis">
<span class="rc-ax-line"></span>
<span class="rc-ax-hours" style="left:{o0 / 24 * 100:.4f}%;width:{(o1 - o0) / 24 * 100:.4f}%"><em>{esc(lu['axis_hours'])}</em></span>
<span class="rc-ax-her"><em>{esc(lu['axis_her'])}</em></span>
<span class="rc-ax-now" data-now="" hidden><em></em></span>
{ticks}{dots}
</div>
<div aria-label="{attr(lu['group'])}" class="rc-moments" role="group">{mo_btns}</div>
</div>
<div class="rc-frame" data-frame="">
<img alt="{attr(ph['alt'])}" class="rc-ph on" data-ph="" decoding="async" height="788" loading="lazy" sizes="(max-width:760px) 92vw, 1120px" src="{src(ph['id'], 1000)}" srcset="{srcset(ph['id'])}" style="--pos:{ph['pos']};--posM:{ph['posM']}" width="1400"/>
<img alt="" class="rc-ph" data-ph="" decoding="async" height="788" loading="lazy" sizes="(max-width:760px) 92vw, 1120px" width="1400"/>
<div class="rc-night"></div><div class="rc-veil"></div>
<span class="rc-chip rc-chip-l" data-fchip=""><i></i><span>{esc(u['incoming'])} · {esc(default['time'])}</span></span>
<span class="rc-chip rc-chip-r" data-fyou="">{esc(default['you'])}</span>
<ol aria-hidden="true" class="rc-cards" data-cards="">{static_cards}</ol>
<div aria-hidden="true" class="rc-fstage">
<canvas class="rc-line" data-line=""></canvas>
<div class="rc-fsub"><span class="rc-note" data-note=""></span><p class="rc-prev" data-prev="">{esc(d_lines[-2])}</p><div class="rc-who is-r" data-who="">{esc(u['who_r'])}</div><div class="rc-subs" data-subs=""><p class="rc-sub cur">{esc(last_line)}</p></div></div>
</div>
</div>
<div class="rc-player" data-player="">
<div class="rc-pl-row">
<button aria-label="{attr(u['play'])}" class="rc-play" data-play="" type="button">{PLAY}</button>
<button class="rc-pbtn" data-restart="" type="button">{AGAIN}<span>{esc(u['restart'])}</span></button>
<button class="rc-pbtn" data-sound="" type="button">{SPEAKER}<span>{esc(u['sound_on'])}</span></button>
<span class="rc-tc" data-tc="">00:00 / {mmss(d_dur)}</span>
<span class="rc-done" data-done="" hidden><span data-done-t=""></span> · <a data-tofiche="" href="#fiche">{esc(u['to_fiche'])}</a></span>
</div>
<div class="rc-wave" data-wave="">
<svg aria-hidden="true" class="rc-bars" data-bars="" preserveAspectRatio="none" viewBox="0 0 1000 40"></svg>
<svg aria-hidden="true" class="rc-bars rc-bars-on" data-bars-on="" preserveAspectRatio="none" viewBox="0 0 1000 40"></svg>
<div class="rc-marks" data-marks=""></div>
<input aria-label="{attr(u['seek'])}" class="rc-seek" data-seek="" max="{int(d_dur * 1000)}" min="0" step="500" type="range" value="0"/>
</div>
<p class="rc-novoice" data-novoice="" hidden>{esc(u['no_voice'])}</p>
<details class="rc-transcript"><summary>{esc(u['transcript'])}</summary><ol data-transcript="">{tr_items(default, d_vars)}</ol></details>
</div>
<div class="rc-under">
<div class="rc-name">
<h3>{esc(lu['name_h'])}</h3>
<label for="rcName">{esc(lu['name_label'])}</label>
<input autocomplete="off" data-name="" id="rcName" maxlength="32" placeholder="{attr(lu['name_ph'])}" spellcheck="false" type="text"/>
<p class="rc-preview" data-preview="">{esc(fill(lu['name_preview'], {'groet': greet_mid, 'zaak': fill(L['zaak_anon'], {'x': lu['name_default']})}))}</p>
<p class="rc-hint">{esc(lu['name_hint'])}</p>
</div>
<p class="rc-caption">{esc(lu['caption'])}</p>
</div>
<div class="sr-only" aria-live="polite" data-srlog="" role="log"></div>
</div>
</section>
<!-- ════════ NA ELK GESPREK ════════ -->
<section class="sec is-aurora rc-fiche-sec" id="fiche">
<div class="wrap rc-fiche-grid">
<div class="rc-fiche-copy">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(fi['eyebrow'])}</span>
<h2 class="h2">{esc(fi['h2a'])}<br/> <span class="grad">{esc(fi['h2b'])}</span></h2>
<p class="lead">{esc(fi['lede'])}</p>
</div>
<ul class="rc-caps" data-reveal-group="">{caps}</ul>
</div>
<article aria-labelledby="rcFicheH" class="rc-fiche" data-fiche="" data-id="{default['id']}" data-reveal="">
<header class="rc-fiche-h"><h3 id="rcFicheH">{esc(fi['head'])}</h3><span class="rc-tag">{esc(fi['tag'])}</span><p aria-live="polite" class="rc-fsubline" data-fsub="">{esc(fill(fi['sub'], {'tijd': default['time']}))}</p></header>
<dl class="rc-dl">{fiche_rows}</dl>
<a class="rc-flink" data-again="" href="#luister">{AGAIN}<span>{esc(fi['again'])}</span></a>
</article>
</div>
</section>
<!-- ════════ PER SECTOR ════════ -->
<section class="sec rc-sectoren" id="sectoren">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(sc['eyebrow'])}</span>
<h2 class="h2">{esc(sc['h2a'])}<br/> <span class="grad">{esc(sc['h2b'])}</span></h2>
<p class="lead">{esc(sc['lede'])}</p>
</div>
<div class="rc-sectors" data-reveal-group="">{sc_cards}</div>
<p class="rc-sector-note">{esc(sc['note'])}</p>
<p class="rc-more rc-sector-region">{sc_region}</p>
</div>
</section>
<!-- ════════ BEWIJS ════════ -->
<section class="sec rc-bewijs" id="bewijs">
<div class="wrap">
<div class="rc-proof" data-reveal="">
<div class="rc-proof-copy">
<span class="eyebrow">{esc(bw['eyebrow'])}</span>
<h2 class="h2">{esc(bw['h2a'])}<br/> <span class="grad">{esc(bw['h2b'])}</span></h2>
<p class="lead">{esc(bw['lede'])}</p>
<p class="rc-kern">{esc(bw['kern'])}</p>
<a class="rc-link" href="{case}">{esc(bw['link'])} {ARROW}</a>
</div>
<div class="rc-strip-wrap">
<div aria-label="{attr(bw['strip_label'])}" class="rc-strip" data-strip="" role="img">{strip}</div>
<p class="rc-strip-cap">{esc(bw['caption'])}</p>
<div class="rc-legend">
<button class="rc-lg" data-grp="a" type="button"><i class="a"></i><b data-count="31">31</b> {esc(bw['leg_a'])}</button>
<button class="rc-lg" data-grp="m" type="button"><i class="m"></i><b data-count="6">6</b> {esc(bw['leg_m'])}</button>
<button class="rc-lg" data-grp="v" type="button"><i class="v"></i><b data-count="2">2</b> {esc(bw['leg_v'])}</button>
<span class="rc-lg-time">{esc(bw['leg_time'])}</span>
</div>
<p class="rc-proof-note">{esc(bw['note'])}</p>
</div>
</div>
</div>
</section>
<!-- ════════ PRIJS ════════ -->
<section class="sec rc-prijs" id="prijs">
<div class="wrap rc-price">
<div class="rc-price-copy" data-reveal="">
<span class="eyebrow">{esc(pr['eyebrow'])}</span>
<h2 class="h2">{esc(pr['h2a'])}<br/> <span class="grad">{esc(pr['h2b'])}</span></h2>
<p class="lead">{esc(pr['lede'])}</p>
</div>
<div class="rc-bill" data-bill="" data-once="750">
<div class="rc-amount"><b>{esc(pr['amount'])}</b><span>{esc(pr['per'])}</span></div>
<p class="rc-plus">{esc(pr['plus'])}</p>
<p class="rc-plus rc-once">{esc(pr['once'])}</p>
<div class="rc-lines">{bill}</div>
<ul class="rc-points">{points}</ul>
<div class="rc-price-cta"><a class="btn" data-book="" href="Contact">{esc(pr['cta'])} {ARROW}</a><a class="btn-ghost" href="Diensten#pakket-1">{esc(pr['cta2'])}</a></div>
</div>
</div>
</section>
<!-- ════════ ZO STAAT ZE LIVE ════════ -->
<section class="sec rc-live" id="live">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(lv['eyebrow'])}</span>
<h2 class="h2">{esc(lv['h2a'])}<br/> <span class="grad">{esc(lv['h2b'])}</span></h2>
<p class="lead">{esc(lv['sub'])}</p>
</div>
<div class="rc-steps" data-steps="">
<div aria-hidden="true" class="rc-rail"><i></i></div>
<ol>{steps}</ol>
</div>
</div>
</section>
<!-- ════════ FAQ ════════ -->
<section class="sec rc-faq" id="faq">
<div class="wrap">
<div class="sec-head" data-reveal="">
<span class="eyebrow">{esc(fq['eyebrow'])}</span>
<h2 class="h2">{esc(fq['h2a'])}<br/> <span class="grad">{esc(fq['h2b'])}</span></h2>
</div>
<div class="faq-list" data-reveal="">{faqs}</div>
<p class="rc-more">{esc(fq['more_label'])} {more}</p>
</div>
</section>
<!-- ════════ CTA ════════ -->
<section class="cta-band" id="contact">
<canvas aria-hidden="true" class="starfield" data-stars=""></canvas>
<div class="glow"></div>
<div class="wrap">
<div class="cta-inner" data-reveal="">
<div aria-hidden="true" class="rc-cta-line"><canvas class="rc-line" data-line=""></canvas></div>
<h2>{esc(ct['h2a'])} <span class="grad">{esc(ct['h2b'])}</span></h2>
<p class="lead">{esc(ct['text'])}</p>
<div class="row"><a class="btn" data-book="" data-cta-btn="" href="Contact">{esc(ct['btn'])} {ARROW}</a><a class="btn-ghost rc-demo" href="{attr(ct['demo_href'])}">{esc(ct['demo'])}</a></div>
<div class="badges">{badges}</div>
</div>
</div>
</section>
<script data-no-i18n="" id="rcData" type="application/json">{djson}</script>
'''
