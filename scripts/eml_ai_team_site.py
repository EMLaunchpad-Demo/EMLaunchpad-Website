# Het adres van de eigen website van EML AI Team. De pagina /eml-ai-team (nl, en, fr) is op 2026-11-02
# van emlaunchpad.com gehaald; de dienst blijft op de home en op Diensten staan, met een link naar die site.
#
# EML_SITE is de enige plek waar het adres staat:
#   - scripts/redirects.py leest het voor de 301's van /eml-ai-team, /en/eml-ai-team en /fr/eml-ai-team;
#   - in de pagina's en de bronbestanden staat dezelfde waarde letterlijk, want de home, Diensten en
#     Gratis demo hebben geen bouwscript. Dit script vervangt ze allemaal in één keer, ook EML_SITE zelf.
# Zolang het domein niet gekozen is, staat er een tijdelijke waarde die nergens bestaat. Niet pushen zolang ze er staat.
#
# Livegang, zodra het domein er is (en de site daar echt antwoordt):
#   py scripts/eml_ai_team_site.py https://<domein>     vervangt de tijdelijke waarde in alle bestanden
#   py scripts/eml_ai_team_site.py                      toont alleen waar de tijdelijke waarde nog staat
# Daarna de pagina's met een bouwscript opnieuw bouwen en redirects.py draaien (zie de stappen in de oplevering).
import os, re, sys, urllib.request

EML_SITE = 'https://emlteam.eu'

# De tijdelijke waarde, in twee stukken, zodat dit script ze bij het vervangen niet zelf kwijtraakt.
TIJDELIJK = 'https://' + 'NIEUW-EML-AI-TEAM-DOMEIN'

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SKIP_DIRS = {'.git', '.claude', '.wrangler', 'node_modules', '__pycache__'}
EXT = ('.html', '.js', '.mjs', '.json', '.py', '.xml', '.txt', '.css', '.md')
EXTRA = {'_redirects', '_headers'}


def bestanden():
    for d, dirs, files in os.walk(ROOT):
        dirs[:] = sorted(x for x in dirs if x not in SKIP_DIRS)
        for f in sorted(files):
            if f.endswith(EXT) or f in EXTRA:
                yield os.path.join(d, f)


def lees(p):
    with open(p, 'rb') as fh:
        return fh.read()


def waar():
    """Bestanden waarin de tijdelijke waarde staat, met het aantal keer."""
    t = TIJDELIJK.encode()
    return [(os.path.relpath(p, ROOT).replace(os.sep, '/'), n) for p in bestanden() for n in [lees(p).count(t)] if n]


def main(argv):
    if not argv:
        lijst = waar()
        if EML_SITE == TIJDELIJK:
            print('EML_SITE is nog de tijdelijke waarde %s' % TIJDELIJK)
        print('\n'.join('  %3d x %s' % (n, p) for p, n in lijst) or '  nergens meer')
        return 0
    forceer = '--forceer' in argv
    nieuw = [a for a in argv if not a.startswith('--')][0].rstrip('/')
    if not re.match(r'^https://[a-z0-9.-]+\.[a-z]{2,}$', nieuw):
        print('FOUT: geef het adres als https://<domein>, zonder pad, bv. https://voorbeeld.be')
        return 1
    if not forceer:
        try:
            with urllib.request.urlopen(urllib.request.Request(nieuw + '/', headers={'User-Agent': 'emlaunchpad-check'}), timeout=15) as r:
                code = r.status
        except Exception as e:
            code = str(e)
        if code != 200:
            print('FOUT: %s/ antwoordt niet met 200 (%s). Zet eerst de site online, of gebruik --forceer.' % (nieuw, code))
            return 1
    t, n_tot, gewijzigd = TIJDELIJK.encode(), 0, []
    for p in bestanden():
        b = lees(p)
        n = b.count(t)
        if n:
            with open(p, 'wb') as fh:
                fh.write(b.replace(t, nieuw.encode()))
            n_tot += n
            gewijzigd.append(os.path.relpath(p, ROOT).replace(os.sep, '/'))
    print('%d keer vervangen in %d bestanden:' % (n_tot, len(gewijzigd)))
    print('\n'.join('  ' + g for g in gewijzigd))
    rest = waar()
    if rest:
        print('FOUT: de tijdelijke waarde staat nog in: ' + ', '.join(p for p, _ in rest))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
