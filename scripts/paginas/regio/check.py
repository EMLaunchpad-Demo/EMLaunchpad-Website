# Controle van de gebouwde regio- en stadspagina's (naast overlap.py).
#   py check.py      -> per pagina: title <= 60, description <= 155, één H1, JSON-LD parst, Service + FAQPage + BreadcrumbList,
#                       FAQPage letterlijk gelijk aan de zichtbare FAQ (>= 6 vragen), zoeklijst leeg, links naar Diensten,
#                       Pakketkiezer en Gratis Demo, stadspagina linkt naar de regiopagina, regiopagina linkt naar elke stadspagina,
#                       geen interne links op .html. Eindigt met "OK" of met de fouten (exitcode 1).
import io, os, re, sys, json, glob, html

R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
# zoeklijst (in stukjes, zodat dit script zelf niet op de zoeklijst staat)
ZOEK = [chr(0x2014), chr(0x2013), 'Go' + 'HighLevel', 'G' + 'HL', 'n' + '8n', 'lokale ' + 'bedrijven', 'local ' + 'business',
        'Digitale ' + 'groei', 'gratis ' + 'gesprek', 'Dui' + 'ts', 'op ' + 'aanvraag']

def strip(x):
    return html.unescape(re.sub(r'<[^>]+>', '', x)).strip()

def main():
    pages = sorted(glob.glob(os.path.join(R, 'website-laten-maken-*.html')))
    slugs = [re.match(r'website-laten-maken-(.+)\.html', os.path.basename(p)).group(1) for p in pages]
    fouten = []
    for p, slug in zip(pages, slugs):
        s = io.open(p, encoding='utf-8').read()
        f = lambda m: fouten.append('%s: %s' % (slug, m))
        t = html.unescape(re.search(r'<title>(.*?)</title>', s).group(1))
        d = html.unescape(re.search(r'<meta content="([^"]*)" name="description"/>', s).group(1))
        if len(t) > 60: f('title %d tekens' % len(t))
        if len(d) > 155: f('description %d tekens' % len(d))
        if len(re.findall(r'<h1[ >]', s)) != 1: f('niet precies één H1')
        try:
            data = [json.loads(b) for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)]
        except Exception as e:
            f('JSON-LD parst niet: %s' % e); continue
        nodes = [n for b in data for n in b.get('@graph', [])]
        types = {n.get('@type') for n in nodes}
        for need in ('Service', 'FAQPage', 'BreadcrumbList', 'ProfessionalService'):
            if need not in types: f('schema mist %s' % need)
        faq = next((n for n in nodes if n.get('@type') == 'FAQPage'), {'mainEntity': []})['mainEntity']
        vis = re.findall(r'<span class="rg-q">(.*?)</span>.*?<div class="faq-a-inner">(.*?)</div>', s, re.S)
        if len(vis) < 6: f('maar %d FAQ-vragen' % len(vis))
        if len(vis) != len(faq) or any(q['name'] != strip(a) or q['acceptedAnswer']['text'] != strip(b) for q, (a, b) in zip(faq, vis)):
            f('FAQPage niet letterlijk gelijk aan de zichtbare FAQ')
        main_ = s[s.index('<main'):s.index('</main>')]
        for z in ZOEK:
            if z in main_ or z in t or z in d: f('zoeklijst: %r' % z)
        links = set(re.findall(r'href="([^"#][^"]*)"', main_))
        for need in ('Diensten', 'Pakketkiezer', 'Gratis%20Demo'):
            if need not in links: f('geen link naar %s' % need)
        if any(h.endswith('.html') for h in links): f('interne link op .html')
        if slug == 'limburg':
            for o in slugs:
                if o != 'limburg' and 'website-laten-maken-' + o not in links: f('regiopagina linkt niet naar %s' % o)
        elif 'website-laten-maken-limburg' not in links:
            f('linkt niet naar de regiopagina')
        print('%-10s title %2d  description %3d  FAQ %d  schema %s' % (slug, len(t), len(d), len(vis), ', '.join(sorted(x for x in types if x))))
    print()
    if fouten:
        print('NIET OK:'); [print(' -', x) for x in fouten]; return 1
    print('OK'); return 0

if __name__ == '__main__':
    sys.exit(main())
