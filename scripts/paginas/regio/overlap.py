# Meet de regio- en stadspagina's tegen elkaar (voorwaarden B20, 14-FASE2-AGENTS.md punt 2):
#   - minstens 800 eigen woorden per pagina;
#   - minder dan 30% gelijke tekst met elke andere stads- of regiopagina.
# Gebruik (vanuit deze map of de repo):
#   py overlap.py                 alle website-laten-maken-*.html in de repo
#   py overlap.py --ook           ook ter info tegen Websites.html en de oude lokaal/*.html
#   py overlap.py --detail a b    toon de gedeelde zinsdelen tussen twee pagina's (slugs, bv. hasselt lommel)
# Methode: alleen de zichtbare tekst in <main> telt (geen menu, footer, scripts, JSON-LD, alt-teksten of
# aria-hidden-labels op de kaart). Woorden in kleine letters; shingles van 5 opeenvolgende woorden.
#   overlap(A, B) = deel van de shingles van A die ook in B staan. We tonen per paar het maximum van A->B en B->A.
#   eigen woorden = woorden van een pagina die in geen enkele shingle staan die ze met een andere pagina deelt.
# Eindigt met "OK" (exitcode 0) of met de lijst van wat niet klopt (exitcode 1).
import io, os, re, sys, glob
from html.parser import HTMLParser

R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
N = 5
MAX_OVERLAP = 0.30
MIN_EIGEN = 800
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}

class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.out, self.in_main = [], [], False
        self.main_seen = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'main':
            self.in_main = self.main_seen = True
        if tag in VOID:
            return
        skip = tag in ('script', 'style', 'svg', 'noscript', 'template') or a.get('aria-hidden') == 'true'
        self.stack.append((tag, skip))
    def handle_endtag(self, tag):
        if tag == 'main':
            self.in_main = False
        if tag in VOID:
            return
        while self.stack:
            t, _ = self.stack.pop()
            if t == tag:
                break
    def handle_data(self, d):
        if self.in_main and not any(s for _, s in self.stack):
            self.out.append(d)

def words_of(path):
    p = Text()
    p.feed(io.open(path, encoding='utf-8').read())
    src = ' '.join(p.out) if p.main_seen else ''
    if not p.main_seen:            # oude pagina's zonder <main>: dan de hele body
        q = Text(); q.in_main = q.main_seen = True; q.feed(io.open(path, encoding='utf-8').read()); src = ' '.join(q.out)
    return re.findall(r"[0-9a-zà-ÿ€]+(?:['’.,-][0-9a-zà-ÿ]+)*", src.lower())

def shingles(w):
    return [' '.join(w[i:i + N]) for i in range(max(0, len(w) - N + 1))]

def label(path):
    b = os.path.basename(path)
    m = re.match(r'website-laten-maken-(.+)\.html$', b)
    return m.group(1) if m else os.path.relpath(path, R).replace(os.sep, '/')

def main(argv):
    pages = sorted(glob.glob(os.path.join(R, 'website-laten-maken-*.html')))
    if not pages:
        print('Geen pagina\'s gevonden. Eerst: py build_regio.py'); return 1
    W = {label(p): words_of(p) for p in pages}
    S = {k: shingles(w) for k, w in W.items()}
    SET = {k: set(v) for k, v in S.items()}
    names = list(W)

    if argv[:1] == ['--detail'] and len(argv) == 3:
        a, b = argv[1], argv[2]
        common = [s for s in S[a] if s in SET[b]]
        # aaneengesloten stukken samenvoegen
        runs, cur = [], []
        for i, s in enumerate(S[a]):
            if s in SET[b]:
                cur.append(i)
            elif cur:
                runs.append(cur); cur = []
        if cur: runs.append(cur)
        for r in runs:
            print('-', ' '.join(W[a][r[0]:r[-1] + N]))
        print('%d van %d shingles van %s staan ook in %s' % (len(common), len(S[a]), a, b))
        return 0

    fouten = []
    print('Pagina\'s: %d. Shingles van %d woorden. Grens: < %d%% overlap, >= %d eigen woorden.\n' % (len(names), N, MAX_OVERLAP * 100, MIN_EIGEN))
    # eigen woorden
    print('%-14s %8s %8s' % ('pagina', 'woorden', 'eigen'))
    for k in names:
        shared = set()
        for o in names:
            if o != k:
                shared |= SET[k] & SET[o]
        cover = [False] * len(W[k])
        for i, s in enumerate(S[k]):
            if s in shared:
                for j in range(i, i + N):
                    cover[j] = True
        eigen = cover.count(False)
        flag = '' if eigen >= MIN_EIGEN else '   <-- te weinig eigen woorden'
        print('%-14s %8d %8d%s' % (k, len(W[k]), eigen, flag))
        if eigen < MIN_EIGEN:
            fouten.append('%s: %d eigen woorden (minstens %d)' % (k, eigen, MIN_EIGEN))
    # overlap per paar
    print('\nOverlap per paar (max van beide richtingen):')
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            ab = len(SET[a] & SET[b]) / max(1, len(SET[a]))
            ba = len(SET[a] & SET[b]) / max(1, len(SET[b]))
            m = max(ab, ba)
            flag = '' if m < MAX_OVERLAP else '   <-- te veel'
            print('  %-12s %-12s %5.1f%%%s' % (a, b, 100 * m, flag))
            if m >= MAX_OVERLAP:
                fouten.append('%s en %s: %.1f%% gelijke tekst' % (a, b, 100 * m))
    if '--ook' in argv:
        extra = [os.path.join(R, 'Websites.html')] + sorted(glob.glob(os.path.join(R, 'lokaal', '*.html')))
        print('\nTer info, tegen bestaande pagina\'s (telt niet mee voor OK):')
        for e in extra:
            if not os.path.exists(e):
                continue
            es = set(shingles(words_of(e)))
            worst = max(names, key=lambda k: len(SET[k] & es) / max(1, len(SET[k])))
            m = len(SET[worst] & es) / max(1, len(SET[worst]))
            print('  %-28s hoogst met %-10s %5.1f%%' % (label(e), worst, 100 * m))
    print()
    if fouten:
        print('NIET OK:'); [print(' -', f) for f in fouten]
        return 1
    print('OK')
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
