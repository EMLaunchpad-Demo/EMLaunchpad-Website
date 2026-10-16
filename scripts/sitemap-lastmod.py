# Zet in sitemap.xml per pagina de echte datum van de laatste INHOUDELIJKE wijziging.
# Inhoud = zichtbare tekst + <title> + meta description (scripts, stijl, laadscherm en
# versienummers tellen niet). Bron: de git-geschiedenis; wat lokaal nog niet gecommit is,
# krijgt de datum van vandaag. Bing gebruikt lastmod om te zien wat er veranderd is.
#   py scripts/sitemap-lastmod.py
# Controleert ook dat elke URL in de sitemap thuishoort: het bestand bestaat, de pagina heeft
# geen noindex (meta robots of X-Robots-Tag in _headers) en de URL staat er maar één keer.
# Bij een probleem stopt het script met een foutcode, zodat /lokaal/ of een noindex-pagina
# niet opnieuw in de sitemap sluipt.
import os, re, sys, subprocess, html, datetime, urllib.parse, fnmatch

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SITE = 'https://emlaunchpad.com'
TODAY = datetime.date.today().isoformat()

def git(*a):
    r = subprocess.run(['git', *a], cwd=ROOT, capture_output=True)
    return r.stdout.decode('utf-8', 'replace') if r.returncode == 0 else None

def content(s):
    if s is None: return None
    t = re.search(r'<title>(.*?)</title>', s, re.S)
    d = re.search(r'<meta content="([^"]*)" name="description"', s) or re.search(r'<meta name="description" content="([^"]*)"', s)
    b = re.sub(r'<head>.*?</head>', ' ', s, flags=re.S)
    b = re.sub(r'<(script|style|svg|noscript)\b.*?</\1>', ' ', b, flags=re.S)
    b = re.sub(r'<div class="(emld|loader)" id="loader".*?<div id="nav-mount">', ' ', b, flags=re.S)
    b = re.sub(r'<div id="footer-mount">.*?</div>', ' ', b, flags=re.S)
    b = html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', b))).strip()
    return ((t.group(1).strip() if t else ''), (d.group(1) if d else ''), b)

def file_for(loc):
    p = urllib.parse.unquote(loc[len(SITE):]) or '/'
    if p.endswith('/'): p += 'index.html'
    else: p += '.html'
    return p.lstrip('/')

def lastmod(rel):
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path): return None
    cur = content(open(path, encoding='utf-8').read())
    head = git('show', 'HEAD:' + rel)
    if head is None or content(head) != cur:
        return TODAY
    log = git('log', '--format=%H %cs', '--', rel) or ''
    commits = [l.split() for l in log.splitlines() if l.strip()]
    for i, (h, day) in enumerate(commits):
        now = content(git('show', h + ':' + rel))
        before = content(git('show', h + '^:' + rel)) if i + 1 <= len(commits) else None
        if now != before:
            return day
    return commits[-1][1] if commits else TODAY

def noindex_patterns():
    """Paden uit _headers die een X-Robots-Tag met noindex krijgen (als glob, * = splat)."""
    pats, cur = [], None
    for line in open(os.path.join(ROOT, '_headers'), encoding='utf-8'):
        if line.startswith('#') or not line.strip():
            continue
        if not line[0].isspace():
            cur = line.strip()
        elif cur and re.match(r'\s*X-Robots-Tag\s*:.*noindex', line, re.I):
            pats.append(cur)
    return pats

def controleer(locs):
    fouten = []
    pats = noindex_patterns()
    for loc in locs:
        if locs.count(loc) > 1 and loc not in fouten:
            fouten.append('staat dubbel in de sitemap: ' + loc)
        rel = file_for(loc)
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            fouten.append('bestand ontbreekt: %s (%s)' % (loc, rel)); continue
        if re.search(r'<meta[^>]+robots[^>]+noindex|<meta[^>]+noindex[^>]+robots', open(path, encoding='utf-8').read(), re.I):
            fouten.append('pagina heeft meta noindex: ' + loc)
        p = urllib.parse.unquote(loc[len(SITE):]) or '/'
        for pat in pats:
            if fnmatch.fnmatchcase(p, pat):
                fouten.append('krijgt noindex via _headers (%s): %s' % (pat, loc))
    return sorted(set(fouten))

sm_path = os.path.join(ROOT, 'sitemap.xml')
xml = open(sm_path, encoding='utf-8').read()
fouten = controleer(re.findall(r'<loc>([^<]+)</loc>', xml))
if fouten:
    print('\n'.join('FOUT: ' + f for f in fouten))
    sys.exit(1)
changed = 0
def fix(m):
    global changed
    loc, old = m.group(1), m.group(2)
    new = lastmod(file_for(loc)) or old
    if new != old: changed += 1
    return m.group(0).replace('<lastmod>%s</lastmod>' % old, '<lastmod>%s</lastmod>' % new)
xml = re.sub(r'<url><loc>([^<]+)</loc><lastmod>([^<]+)</lastmod>', fix, xml)
open(sm_path, 'w', encoding='utf-8', newline='\n').write(xml)
print(changed, 'datums aangepast')
