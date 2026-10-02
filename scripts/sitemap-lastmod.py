# Zet in sitemap.xml per pagina de echte datum van de laatste INHOUDELIJKE wijziging.
# Inhoud = zichtbare tekst + <title> + meta description (scripts, stijl, laadscherm en
# versienummers tellen niet). Bron: de git-geschiedenis; wat lokaal nog niet gecommit is,
# krijgt de datum van vandaag. Bing gebruikt lastmod om te zien wat er veranderd is.
#   py scripts/sitemap-lastmod.py
import os, re, subprocess, html, datetime, urllib.parse

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

sm_path = os.path.join(ROOT, 'sitemap.xml')
xml = open(sm_path, encoding='utf-8').read()
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
