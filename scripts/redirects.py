# Maakt _redirects: permanente (301) omleidingen naar de nette URL's.
# Cloudflare stuurt /Diensten.html, /index.html en /Diensten/ zelf met een tijdelijke 307
# door; Bing vraagt een 301 voor blijvende adressen. Draai opnieuw na het toevoegen van pagina's:
#   py scripts/redirects.py
import os, urllib.parse

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SKIP_DIRS = {'.git', '.github', '.claude', 'node_modules', 'scripts', 'assets', 'demo'}
SKIP_FILES = {'404.html'}

def enc(path):
    return urllib.parse.quote(path, safe="/-_.~'")

rules = []
for d, dirs, files in os.walk(ROOT):
    dirs[:] = sorted(x for x in dirs if x not in SKIP_DIRS)
    rel = os.path.relpath(d, ROOT).replace(os.sep, '/')
    base = '/' if rel == '.' else '/' + rel + '/'
    for f in sorted(files):
        if not f.endswith('.html') or (base == '/' and f in SKIP_FILES):
            continue
        if f == 'index.html':
            rules.append((base + 'index.html', base))
            if base != '/':
                rules.append((base.rstrip('/'), base))
        else:
            clean = base + f[:-5]
            rules.append((clean + '.html', clean))
            rules.append((clean + '/', clean))

out = ['# Gemaakt door scripts/redirects.py: nette URL\'s met een permanente omleiding (301).']
out += ['%s %s 301' % (enc(a), enc(b)) for a, b in rules]
open(os.path.join(ROOT, '_redirects'), 'w', encoding='utf-8', newline='\n').write('\n'.join(out) + '\n')
print(len(rules), 'regels')
