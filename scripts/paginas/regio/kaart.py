# De kaart van Limburg ("De kaart"): één projectie voor de SVG en voor de punten op de pagina's.
#   py kaart.py          schrijft assets/kaart-limburg.svg opnieuw
# De vorm is met de hand uitgezet uit lengte- en breedtegraden (vereenvoudigd, niet voor navigatie):
# Kempen in het noorden, de Maas als oostgrens, Haspengouw in het zuiden en Voeren apart.
# body.py gebruikt pos(plaats) om een punt in procenten op de kaart te zetten.
import io, os, math

R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace(os.sep, '/') + '/'
SVG = 'assets/kaart-limburg.svg'

LON0, LAT1 = 4.985, 51.325          # linkerbovenhoek
K = 900.0                            # pixels per graad breedte
COS = math.cos(math.radians(51.0))   # lengtegraden zijn hier korter
PAD = 0
W, H = 580, 590                      # viewBox

def xy(lon, lat):
    return ((lon - LON0) * COS * K + PAD, (LAT1 - lat) * K + PAD)

def pos(p):
    """plaats (lat, lon) -> (left %, top %) op de kaart"""
    x, y = xy(p[1], p[0])
    return round(100 * x / W, 2), round(100 * y / H, 2)

# Plaatsen: (breedte, lengte). Centrum van de gemeente of deelgemeente, afgerond.
PLAATS = {
    'hasselt': (50.931, 5.338), 'genk': (50.965, 5.501), 'lommel': (51.231, 5.313), 'sint-truiden': (50.817, 5.186),
    'tongeren': (50.781, 5.464), 'maasmechelen': (50.966, 5.694), 'beringen': (51.049, 5.226), 'heers': (50.754, 5.302),
    'vechmaal': (50.766, 5.383), 'heks': (50.757, 5.371), 'hamont-achel': (51.250, 5.545), 'pelt': (51.215, 5.420),
    'bilzen': (50.873, 5.518), 'lanaken': (50.893, 5.647), 'borgloon': (50.803, 5.344), 'maaseik': (51.098, 5.789),
    'bree': (51.139, 5.597), 'leopoldsburg': (51.117, 5.257), 'heusden-zolder': (51.031, 5.281),
    'houthalen-helchteren': (51.032, 5.375), 'peer': (51.131, 5.459), 'diepenbeek': (50.908, 5.418),
    'riemst': (50.809, 5.602), 'tessenderlo': (51.065, 5.088), 'herk-de-stad': (50.940, 5.167), 'gingelom': (50.748, 5.135),
    'zonhoven': (50.991, 5.369), 'dilsen-stokkem': (51.030, 5.724), 'voeren': (50.756, 5.803), 'as': (51.008, 5.585),
}

# Provinciegrens, met de klok mee vanaf Lommel (noordwest). (lengte, breedte)
GRENS = [
    (5.232, 51.262), (5.262, 51.290), (5.305, 51.302), (5.360, 51.288), (5.405, 51.272), (5.445, 51.285),
    (5.478, 51.302), (5.515, 51.290), (5.548, 51.276), (5.568, 51.256),
    (5.585, 51.228), (5.630, 51.212), (5.680, 51.196), (5.725, 51.181), (5.775, 51.172), (5.825, 51.160), (5.848, 51.150),
    (5.826, 51.121), (5.806, 51.095), (5.786, 51.066), (5.766, 51.040), (5.748, 51.010), (5.729, 50.980), (5.713, 50.950),
    (5.701, 50.918), (5.695, 50.890), (5.683, 50.862), (5.690, 50.835), (5.682, 50.808),
    (5.640, 50.795), (5.600, 50.785), (5.560, 50.770), (5.520, 50.752), (5.480, 50.731), (5.430, 50.722), (5.380, 50.713),
    (5.330, 50.708), (5.270, 50.712), (5.215, 50.705), (5.160, 50.708), (5.120, 50.722),
    (5.095, 50.748), (5.085, 50.780), (5.095, 50.815), (5.085, 50.850), (5.105, 50.885), (5.090, 50.920), (5.060, 50.955),
    (5.025, 50.985), (5.012, 51.020), (5.035, 51.060), (5.075, 51.090), (5.120, 51.110), (5.170, 51.125), (5.210, 51.140),
    (5.215, 51.175), (5.205, 51.210), (5.218, 51.240),
]
VOEREN = [(5.725, 50.770), (5.770, 50.776), (5.815, 50.771), (5.860, 50.766), (5.895, 50.760), (5.905, 50.741),
          (5.880, 50.726), (5.835, 50.722), (5.790, 50.728), (5.745, 50.738), (5.722, 50.753)]
# de Maas (oostgrens), iets verder door naar boven en beneden
MAAS = [(5.872, 51.205), (5.860, 51.172), (5.848, 51.150), (5.826, 51.121), (5.806, 51.095), (5.786, 51.066),
        (5.766, 51.040), (5.748, 51.010), (5.729, 50.980), (5.713, 50.950), (5.705, 50.918), (5.700, 50.885),
        (5.694, 50.850), (5.690, 50.812), (5.692, 50.775), (5.698, 50.735)]

def smooth(pts, closed=True, t=0.38):
    """Catmull-Rom door de punten, als kubische bezier (afgerond op 0,1 px)"""
    P = [xy(*p) for p in pts]
    n = len(P)
    f = lambda v: ('%.1f' % v).rstrip('0').rstrip('.')
    d = 'M%s %s' % (f(P[0][0]), f(P[0][1]))
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = P[(i - 1) % n] if closed or i > 0 else P[0]
        p1, p2 = P[i], P[(i + 1) % n]
        p3 = P[(i + 2) % n] if closed or i + 2 < n else P[-1]
        c1 = (p1[0] + (p2[0] - p0[0]) * t / 3, p1[1] + (p2[1] - p0[1]) * t / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * t / 3, p2[1] - (p3[1] - p1[1]) * t / 3)
        d += 'C%s %s %s %s %s %s' % (f(c1[0]), f(c1[1]), f(c2[0]), f(c2[1]), f(p2[0]), f(p2[1]))
    return d + ('Z' if closed else '')

def svg():
    grens, voeren, maas = smooth(GRENS), smooth(VOEREN), smooth(MAAS, closed=False)
    # een stil raster van puntjes (elke 0,05 graad), alleen binnen het kader
    dots = []
    lat = 51.30
    while lat > 50.69:
        lon = 5.00
        while lon < 5.92:
            x, y = xy(lon, lat)
            if 6 < x < W - 6 and 6 < y < H - 6:
                dots.append('M%.0f %.0fh.01' % (x, y))
            lon += 0.05
        lat -= 0.05
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-labelledby="t">
<title id="t">Vereenvoudigde kaart van de provincie Limburg (België)</title>
<defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f74e0" stop-opacity=".16"/><stop offset="1" stop-color="#1f9e5f" stop-opacity=".07"/></linearGradient></defs>
<path d="{''.join(dots)}" stroke="#c9d8f2" stroke-opacity=".16" stroke-width="2.4" stroke-linecap="round" fill="none"/>
<path d="{grens}" fill="url(#f)" stroke="#e2ecff" stroke-opacity=".62" stroke-width="1.6" stroke-linejoin="round"/>
<path d="{voeren}" fill="url(#f)" stroke="#e2ecff" stroke-opacity=".5" stroke-width="1.3" stroke-linejoin="round"/>
<path d="{maas}" fill="none" stroke="#4b8df0" stroke-opacity=".75" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1 0"/>
<g fill="none" stroke="#e2ecff" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M548 54v-26M541 37l7-9 7 9"/></g>
<text x="548" y="70" fill="#e2ecff" fill-opacity=".55" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="11" text-anchor="middle">N</text>
</svg>
'''

if __name__ == '__main__':
    out = svg()
    io.open(R + SVG, 'w', encoding='utf-8', newline='\n').write(out)
    print(SVG, 'ok', len(out), 'bytes')
    for k in ('hasselt', 'lommel', 'vechmaal', 'hamont-achel', 'voeren'):
        print(k, pos(PLAATS[k]))
