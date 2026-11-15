/* hero-planeet.js: de hero van de home, ontwerp C-C "Teken voor teken". Gekozen door Martijn op 15/11/2026.
   Productie (15/11/2026), gemaakt uit de goedgekeurde voorvertoning hero-c-c.js (ronde 2). Gebruikt op index.html, en/ en fr/ (taal uit <html lang>).
   Vanilla JS, geen bibliotheek. Werkt ook los (solo, zonder site.js en zonder laadscherm).
   1) wisselwoord: elk teken gaat de tekenladder van de planeet af en weer op ( # + :  dan  . - + # ) tot het nieuwe woord er staat
   2) planeet: één bol in monospace-tekens op een 2D-canvas (vooraf getekende tekens), die traag draait, 14 beelden per seconde
   3) klok: de echte tijd in België (Europe/Brussels, uit de klok van de browser), HH:MM, springt op de minuut
   Alles pauzeert buiten beeld, in een verborgen tabblad, als de boekingspopup open is en met de pauzeknop. Op de gsm stopt de draai na 60 s zonder interactie.
   Minder beweging: één stil beeld van de planeet, het vaste woord, geen klok. Hoog contrast (forced-colors): geen planeet, vast woord, geen klok.
   Voor tests: window.__hcFrames (getekende beelden), window.__hcMs (gemiddelde tekentijd per beeld, ms), window.__hcTex (opbouw van de textuur, ms),
   window.__hcCellen (tekens op de bol), window.__hcSlaapt (planeet stil na 60 s op de gsm). */
(function () {
  'use strict';
  var root = document.querySelector('.hc-c-c');
  window.__hcFrames = 0; window.__hcMs = 0;
  if (!root) return;
  var doc = document.documentElement;
  var mq = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var forced = mq('(forced-colors: active)');
  var lang = (doc.getAttribute('lang') || 'nl').slice(0, 2).toLowerCase();
  var IO = 'IntersectionObserver' in window;

  /* menuknop (alleen op de echte pagina): een omlijning zolang de groene heroknop onder het menu zichtbaar is, daarna weer gevuld */
  var acties = root.querySelector('.hc-c-acties');
  if (IO && acties) {
    var menuH = Math.round(parseFloat(getComputedStyle(root).paddingTop) || 86);
    new IntersectionObserver(function (e) { doc.classList.toggle('hc-c-weg', !e[e.length - 1].isIntersecting); },
      { rootMargin: '-' + menuH + 'px 0px 0px 0px' }).observe(acties);
  }
  if (forced) return; /* hoog contrast: geen beeld en geen beweging, de CSS toont de vaste tekst */

  /* ───── zichtbaarheid: één bron voor het woord, de planeet en de klok ───── */
  var zicht = true, gepauzeerd = false, popup = null, luisteraars = [];
  function popupOpen() { return !!(popup && popup.classList.contains('open')); }
  function actief() { return zicht && !document.hidden && !gepauzeerd && !popupOpen(); }
  function meld() { var a = actief(); for (var i = 0; i < luisteraars.length; i++) luisteraars[i](a); }
  if (IO) new IntersectionObserver(function (e) { zicht = e[e.length - 1].isIntersecting; meld(); }, { threshold: 0 }).observe(root);
  document.addEventListener('visibilitychange', meld);
  /* boekingspopup (div.ghl-overlay.open van site.js): bestaat pas na de eerste klik. Bestaat hij niet (solo), dan gebeurt er niets. */
  if (window.MutationObserver) {
    var zoek = new MutationObserver(function () {
      var p = document.querySelector('.ghl-overlay'); if (!p) return;
      popup = p; zoek.disconnect();
      new MutationObserver(meld).observe(p, { attributes: true, attributeFilter: ['class'] }); meld();
    });
    zoek.observe(document.body, { childList: true });
  }

  function naLoader(l, fn) {
    var ok = false, mo, go = function () { if (ok) return; ok = true; if (mo) mo.disconnect(); setTimeout(fn, 200); };
    mo = new MutationObserver(function () { if (!document.body.contains(l) || l.classList.contains('done')) go(); });
    mo.observe(l, { attributes: true, attributeFilter: ['class'] });
    mo.observe(document.body, { childList: true });
    setTimeout(go, 6000);
  }
  function later(fn, ms) { var t = 0; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  /* ───── 1. wisselwoord ─────
     De tekens staan niet als tekst in de h1: elk teken wordt getekend via een pseudo-element (attr(data-c)).
     document.querySelector('h1').textContent blijft altijd "Wij brengen AI in je team."; schermlezers lezen "team.". */
  var wissel = root.querySelector('.hc-c-wissel');
  var startWissel = function () {};
  if (wissel && !reduce) {
    var lijst = (wissel.getAttribute('data-woorden') || '').split('|').filter(Boolean);
    if (lijst.length > 1) (function () {
      var MAX = 0, i;
      for (i = 0; i < lijst.length; i++) MAX = Math.max(MAX, lijst[i].length);
      var cel = [], nuC = [], nuK = [];
      for (i = 0; i < MAX; i++) { var s = document.createElement('span'); s.className = 'hc-c-t'; s.setAttribute('data-c', ''); wissel.appendChild(s); cel.push(s); nuC.push(''); nuK.push('hc-c-t'); }
      function zetCel(k, c, kl) {
        if (nuC[k] !== c) { nuC[k] = c; cel[k].setAttribute('data-c', c); }
        if (nuK[k] !== kl) { nuK[k] = kl; cel[k].className = kl; }
      }
      /* STAP: tijd per tekentrede, SCHUIF: elke volgende letter begint iets later, HOUD: zo lang staat elk woord stil (4,2 s) */
      var STAP = 42, SCHUIF = 30, HOUD = 4200;
      var nu = 0, toon = lijst[0], naar = '', plan = null, t0 = 0, raf = 0, timer = 0, loopt = false;
      function schrijf(w) { for (var k = 0; k < MAX; k++) zetCel(k, w.charAt(k), 'hc-c-t'); }
      schrijf(toon);
      root.classList.add('hc-c-live');
      /* per positie: het oude teken zakt de ladder af (# + :), daarna klimt het nieuwe op (. - + #) tot de letter.
         Een lege plaats wacht even lang, zodat alle letters in hetzelfde ritme lopen: één strakke golf van links naar rechts.
         Een letter die blijft staan, blijft gewoon staan. De laatste trede voor de letter is groen: één puls die door het woord loopt. */
      function maakPlan(van, nw) {
        var n = Math.max(van.length, nw.length), p = [];
        for (var k = 0; k < n; k++) {
          var a = van.charAt(k), b = nw.charAt(k), q;
          if (a && a === b) { p.push(null); continue; }
          q = a ? ['#', '+', ':'] : ['', '', ''];
          if (b) q.push('.', '-', '+', '#', b); else q.push('');
          p.push(q);
        }
        return p;
      }
      function stap(tNu) {
        raf = 0;
        var t = tNu - t0, klaar = true;
        for (var k = 0; k < plan.length; k++) {
          var q = plan[k]; if (!q) continue;
          var j = Math.floor((t - k * SCHUIF) / STAP), c, kl = 'hc-c-t';
          if (j < 0) { c = toon.charAt(k); klaar = false; }
          else if (j >= q.length - 1) c = q[q.length - 1];
          else { c = q[j]; klaar = false; kl += (q[q.length - 1] && j === q.length - 2) ? ' is-kop' : ' is-ruis'; }
          zetCel(k, c, kl);
        }
        if (klaar) { toon = naar; plan = null; schrijf(toon); volgende(); return; }
        raf = requestAnimationFrame(stap);
      }
      function wissel1() {
        timer = 0;
        if (!loopt || !actief()) return;
        nu = (nu + 1) % lijst.length; naar = lijst[nu];
        plan = maakPlan(toon, naar); t0 = performance.now();
        raf = requestAnimationFrame(stap);
      }
      function volgende() { clearTimeout(timer); timer = 0; if (loopt && actief()) timer = setTimeout(wissel1, HOUD); }
      luisteraars.push(function (aan) {
        if (aan) { if (loopt && !timer && !plan) volgende(); return; }
        clearTimeout(timer); timer = 0;
        /* pauze midden in een wissel: meteen het nieuwe woord, geen halve tekens laten staan */
        if (plan) { if (raf) cancelAnimationFrame(raf); raf = 0; plan = null; toon = naar; schrijf(toon); }
      });
      startWissel = function () { loopt = true; volgende(); };
    })();
  }

  /* ───── pauzeknop (WCAG 2.2.2), rechts op de bovenregel ─────
     De zichtbare tekst is de naam van de knop (WCAG 2.5.3); geen aria-pressed, want de tekst wisselt al mee. */
  if (!reduce) {
    var TXT = { nl: ['Pauzeer', 'Speel af'], en: ['Pause', 'Play'], fr: ['Pause', 'Lecture'] }[lang] || ['Pauzeer', 'Speel af'];
    var knop = document.createElement('button');
    knop.type = 'button'; knop.className = 'hc-c-pauze';
    knop.innerHTML = '<i aria-hidden="true"></i><span></span>';
    knop.lastChild.textContent = TXT[0];
    knop.addEventListener('click', function () {
      gepauzeerd = !gepauzeerd; knop.classList.toggle('is-stil', gepauzeerd);
      knop.lastChild.textContent = gepauzeerd ? TXT[1] : TXT[0]; meld();
    });
    var top = root.querySelector('.hc-c-top');
    if (top) top.appendChild(knop); else root.insertBefore(knop, root.firstChild);
  }

  /* ───── 3. klok: uur en minuut in België. Springt op de minuut, staat stil zodra de rest stilstaat.
     Op de gsm alleen als de statusregel op één regel blijft (eerst zonder CET, anders weg). ───── */
  (function () {
    var el = root.querySelector('.hc-c-tijd'), voet = root.querySelector('.hc-c-voet');
    if (reduce || !el || !voet || !window.Intl || !Intl.DateTimeFormat) return;
    var fmt;
    try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' }); } catch (e) { return; }
    if (!fmt.formatToParts) return;
    var timer = 0, nu = new Date();
    function tekst(kort) {
      var p = fmt.formatToParts(nu), u = '', m = '', z = '';
      for (var i = 0; i < p.length; i++) {
        if (p[i].type === 'hour') u = p[i].value; else if (p[i].type === 'minute') m = p[i].value; else if (p[i].type === 'timeZoneName') z = p[i].value;
      }
      if (!u || !m) return '';
      return u + ':' + m + (!kort && z ? ' ' + z.replace(/^GMT/, 'UTC') : '');
    }
    function past() { var a = voet.firstElementChild; return !a || el.offsetTop - a.offsetTop < 4; }
    /* toont de laatst gelezen tijd; bij een andere schermbreedte of na het laden van het font opnieuw gemeten, zonder de tijd te verzetten */
    function zet() {
      var t = tekst(false); if (!t) { el.hidden = true; return; }
      el.textContent = t; el.hidden = false;
      if (!past()) { el.textContent = tekst(true); if (!past()) el.hidden = true; }
    }
    function tik() { timer = 0; nu = new Date(); zet(); if (actief()) timer = setTimeout(tik, 60000 - Date.now() % 60000 + 40); }
    luisteraars.push(function (aan) { if (aan) { if (!timer) tik(); } else { clearTimeout(timer); timer = 0; } });
    window.addEventListener('resize', later(zet, 200));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(zet, function () {});
    tik();
  })();

  /* ───── 2. de planeet ───── */
  var planeet = (function () {
    var stage = root.querySelector('.hc-c-stage'), cv = root.querySelector('.hc-c-cv');
    if (!stage || !cv || !cv.getContext) return null;
    var ctx = cv.getContext('2d');
    if (!ctx) return null;

    /* de tekenladder, van ijl naar dicht: . : - = + * (de # bovenaan is alleen voor het felste land; door de randdonkerte komt hij zo goed als niet voor) */
    var GLYF = ' .:-=+*#';
    /* grijstinten per helderheid: donker, en de lichtste (#8f98a3) blijft ver onder het wit van de titel */
    var TONEN = ['#1d232b', '#2a3039', '#3a414b', '#4f5761', '#6b747f', '#8f98a3'];
    var VLOER = 0.11;                                     /* nachtzijde: overal een fijn, donker punt, zodat de bol rond blijft */
    var ZEE = 0.42, LAND = 0.95, IJS = 0.98;              /* albedo: zee donker en ijl ( : - ), land dichter ( + * ) */
    var RAND = 0.35;                                      /* randdonkerte: ook de verlichte rand dooft, zodat je een bol leest en geen harde halve maan */
    var L = norm(0.70, 0.40, 0.59);                       /* licht van rechtsboven, van opzij: de nachtzijde kijkt naar de tekst */
    var TZ = 0.36, TX = 0.30;                             /* as: 20° naar rechts gekanteld, 17° naar de kijker */
    var SPIN = (2 * Math.PI) / 120;                       /* één omwenteling per 2 minuten */
    var FPS = 14, STAPMS = 1000 / FPS;                    /* 14 beelden per seconde: de tekens springen toch per cel */

    function norm(x, y, z) { var l = Math.sqrt(x * x + y * y + z * z); return [x / l, y / l, z / l]; }
    function sm(a, b, x) { x = (x - a) / (b - a); x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }

    /* ── textuur: albedo van continenten, zee en poolkappen uit 3D-ruis op de bol (naadloos), één keer berekend, in kleine stukken ── */
    var TW = 192, TH = 96, tex = null;
    function hash(x, y, z) {
      var h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(z | 0, 0x1b873593) ^ 0x5bd1e995;
      h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    }
    function ruis(x, y, z) {
      var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
      var a = hash(xi, yi, zi), b = hash(xi + 1, yi, zi), c = hash(xi, yi + 1, zi), d = hash(xi + 1, yi + 1, zi);
      var e = hash(xi, yi, zi + 1), f = hash(xi + 1, yi, zi + 1), g = hash(xi, yi + 1, zi + 1), h = hash(xi + 1, yi + 1, zi + 1);
      var x1 = a + (b - a) * u, x2 = c + (d - c) * u, x3 = e + (f - e) * u, x4 = g + (h - g) * u;
      var y1 = x1 + (x2 - x1) * v, y2 = x3 + (x4 - x3) * v;
      return y1 + (y2 - y1) * w;
    }
    function fbm(x, y, z, o) {
      var s = 0, a = 0.5, n = 0;
      for (var i = 0; i < o; i++) { s += a * ruis(x, y, z); n += a; x = x * 2.03 + 17.1; y = y * 2.03 - 9.7; z = z * 2.03 + 3.3; a *= 0.5; }
      return s / n;
    }
    /* per stuk van 12 rijen een eigen taak: ook op een trage gsm blijft elke taak ruim onder 50 ms */
    function maakTextuur(klaar) {
      tex = new Float32Array(TW * TH);
      var v = 0, ms = 0;
      (function stuk() {
        var t0 = performance.now(), eind = Math.min(TH, v + 12);
        for (; v < eind; v++) {
          var lat = (0.5 - (v + 0.5) / TH) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
          for (var u = 0; u < TW; u++) {
            var lon = ((u + 0.5) / TW - 0.5) * 2 * Math.PI;
            var x = cl * Math.sin(lon), y = sl, z = cl * Math.cos(lon);
            var n = fbm(x * 1.7 + 5.2, y * 1.7 + 1.3, z * 1.7 - 3.1, 4);
            var d = fbm(x * 5.3 - 2.4, y * 5.3 + 7.7, z * 5.3 + 0.9, 2);
            var land = sm(0.497, 0.53, n);
            /* zee donker en vlak, land twee treden lichter; kleine variatie, geen ruis die als tekstblok leest */
            var a = ZEE + 0.06 * d + land * (LAND - ZEE);
            var ijs = sm(0.93, 0.97, Math.abs(sl) + 0.04 * (d - 0.5));
            a += (IJS - a) * ijs;
            tex[v * TW + u] = a;
          }
        }
        ms += performance.now() - t0;
        if (v < TH) { setTimeout(stuk, 0); return; }
        window.__hcTex = Math.round(ms);
        klaar();
      })();
    }

    /* ── raster en vooraf berekende cellen ── */
    var W = 0, H = 0, dpr = 1, cw = 8, lh = 15, cwD = 8, lhD = 15, R = 0, pcx = 0, pcy = 0, ox = 0, oy = 0, S = 0;
    var atlas = document.createElement('canvas');
    var N = 0, X, Y, U0, RIJ, LAM, VERT;

    function bouwAtlas() {
      var fs = cw / 0.6;
      atlas.width = cwD * GLYF.length; atlas.height = lhD * TONEN.length;
      var a = atlas.getContext('2d');
      a.clearRect(0, 0, atlas.width, atlas.height);
      a.font = '400 ' + (fs * dpr).toFixed(2) + 'px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
      a.textAlign = 'center'; a.textBaseline = 'middle';
      for (var t = 0; t < TONEN.length; t++) {
        a.fillStyle = TONEN[t];
        for (var g = 1; g < GLYF.length; g++) a.fillText(GLYF[g], g * cwD + cwD / 2, t * lhD + lhD / 2 + 0.5 * dpr);
      }
    }

    /* het canvas krijgt een maat en plaats op hele pixels: zo blijven de tekens scherp */
    function maat() {
      var sb = stage.getBoundingClientRect();
      if (!sb.width || !sb.height) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      S = Math.floor(Math.min(sb.width, sb.height));
      var lx = Math.round(sb.left + (sb.width - S) / 2) - sb.left, ly = Math.round(sb.top + (sb.height - S) / 2) - sb.top;
      cv.style.width = S + 'px'; cv.style.height = S + 'px'; cv.style.left = lx.toFixed(2) + 'px'; cv.style.top = ly.toFixed(2) + 'px';
      /* celgrootte volgt de planeet: van 48 kolommen over een kleine bol (gsm) geleidelijk naar 60 over een grote, tekens tussen 6 en 10 px breed */
      var kol = Math.max(48, Math.min(60, 48 + (S - 260) / 20));
      cw = Math.max(6, Math.min(10, Math.round(S / kol)));
      lh = Math.round(cw * 1.86);
      cwD = Math.round(cw * dpr); lhD = Math.round(lh * dpr);
      var w = Math.round(S * dpr);
      if (w !== W) { W = H = w; cv.width = W; cv.height = H; }
      var cols = Math.floor(S / cw), rows = Math.floor(S / lh);
      ox = (S - cols * cw) / 2; oy = (S - rows * lh) / 2;
      pcx = S / 2; pcy = S / 2;
      /* straal: de buitenste tekens blijven volledig binnen het canvas */
      R = S / 2 - lh / 2 - 1;
      bouwAtlas();
      bouwCellen(cols, rows);
      return true;
    }

    function bouwCellen(cols, rows) {
      var ct = Math.cos(TZ), st = Math.sin(TZ), cx = Math.cos(TX), sx = Math.sin(TX);
      var lx = [], ly = [], lu = [], lr = [], ll = [], lv = [];
      for (var r = 0; r < rows; r++) {
        var py = oy + (r + 0.5) * lh, dy = (pcy - py) / R;
        for (var c = 0; c < cols; c++) {
          var px = ox + (c + 0.5) * cw, dx = (px - pcx) / R, d2 = dx * dx + dy * dy;
          if (d2 > 1) continue;                           /* alleen binnen de straal: een strak, rond silhouet */
          var nz = Math.sqrt(1 - d2), nx = dx, ny = dy;
          /* van beeld naar planeet: eerst de kanteling in beeld terug, dan de kanteling naar de kijker */
          var mx = nx * ct - ny * st, my = nx * st + ny * ct, mz = nz;
          var qx = mx, qy = my * cx + mz * sx, qz = -my * sx + mz * cx;
          var lat = Math.asin(Math.max(-1, Math.min(1, qy))), lon = Math.atan2(qx, qz);
          var v = Math.min(TH - 1, Math.max(0, ((0.5 - lat / Math.PI) * TH) | 0));
          var ndl = nx * L[0] + ny * L[1] + nz * L[2];
          lx.push(Math.round((ox + c * cw) * dpr)); ly.push(Math.round((oy + r * lh) * dpr));
          lu.push((lon / (2 * Math.PI) + 0.5) * TW);
          lr.push(v * TW);
          ll.push(ndl > 0 ? ndl * (1 - RAND + RAND * nz) : 0);
          /* opbouw: de verlichte kant eerst, de nachtzijde als laatste, met wat toeval */
          lv.push(700 * (1 - (ndl + 1) / 2) + 300 * hash(c, r, 3));
        }
      }
      N = lx.length;
      X = new Int32Array(lx); Y = new Int32Array(ly); U0 = new Float32Array(lu); RIJ = new Int32Array(lr);
      LAM = new Float32Array(ll); VERT = new Float32Array(lv);
      window.__hcCellen = N;
    }

    function sprite(g, t, x, y) { ctx.drawImage(atlas, g * cwD, t * lhD, cwD, lhD, x, y, cwD, lhD); }

    /* één beeld. tijd in s (draait de planeet), intro in ms sinds de start (of -1: geen intro) */
    var hoek0 = 1.6, msSom = 0;                          /* beginstand: een continent aan de verlichte kant (ook het stille beeld) */
    function teken(tijd, intro) {
      var tStart = performance.now();
      ctx.clearRect(0, 0, W, H);
      var opb = intro >= 0;
      var du = ((hoek0 + tijd * SPIN) / (2 * Math.PI)) * TW;
      for (var i = 0; i < N; i++) {
        var u = (U0[i] - du) % TW; if (u < 0) u += TW;
        var al = tex[RIJ[i] + (u | 0)];
        /* b kiest het teken (land dichter dan zee), bt de grijstint: half licht, half land, zodat de bol als één vorm leest */
        var b = VLOER + (1 - VLOER) * LAM[i] * al;
        var bt = VLOER + (1 - VLOER) * LAM[i] * (0.5 * al + 0.35);
        if (opb) {
          /* opbouw: elk teken verschijnt als punt en klimt de ladder op tot zijn eigen trede */
          var f = (intro - VERT[i]) / 480; if (f <= 0) continue;
          if (f < 1) { f = f * f * (3 - 2 * f); b = VLOER + (b - VLOER) * f; bt = VLOER + (bt - VLOER) * f; }
        }
        var g = (b * 7.3) | 0; if (g < 1) g = 1; else if (g > 7) g = 7;
        var tn = (bt * 7.4) | 0; if (tn > 5) tn = 5;          /* alleen het felste land haalt de lichtste tint */
        sprite(g, tn, X[i], Y[i]);
      }
      window.__hcFrames++;
      msSom += performance.now() - tStart; window.__hcMs = Math.round(msSom / window.__hcFrames * 100) / 100;
    }

    /* ── lus: 14 beelden per seconde, ook tijdens de opbouw. Alleen als de bol zelf in beeld is. ── */
    var raf = 0, volgend = 0, vorige = 0, tijd = 0, introStart = -1, introKlaar = false, klaar = false, slaapt = false, zichtBol = true, stilBeeld = false;
    var INTRO = 1500;
    function lus(t) {
      raf = requestAnimationFrame(lus);
      if (t < volgend) return;
      volgend = (t - volgend > STAPMS) ? t + STAPMS : volgend + STAPMS;
      if (vorige) tijd += Math.min(t - vorige, 200) / 1000;
      vorige = t;
      var intro = -1;
      if (!introKlaar) { if (introStart < 0) introStart = t; intro = t - introStart; if (intro >= INTRO) { introKlaar = true; intro = -1; } }
      teken(tijd, intro);
    }
    function zet(a) {
      /* minder beweging: één stil beeld en nooit een lus, ook niet als de IntersectionObserver hieronder later meldt
         (bv. na een scroll weg en terug). Productie 15/11/2026: in de voorvertoning ging de bol dan alsnog draaien. */
      if (!klaar || stilBeeld) return;
      a = a && zichtBol && !slaapt;
      if (a && !raf) { vorige = 0; volgend = 0; raf = requestAnimationFrame(lus); }
      else if (!a && raf) {
        cancelAnimationFrame(raf); raf = 0;
        /* stil midden in de opbouw: meteen de volledige bol, geen halve planeet laten staan */
        if (!introKlaar) { introKlaar = true; teken(tijd, -1); }
      }
    }
    if (IO) new IntersectionObserver(function (e) { zichtBol = e[e.length - 1].isIntersecting; zet(actief()); }, { threshold: 0 }).observe(stage);
    var rz = later(function () { if (klaar && maat()) teken(tijd, -1); }, 160);
    window.addEventListener('resize', rz);

    /* op de gsm: de draai stopt na 60 s zonder interactie en gaat verder bij de eerste aanraking, scroll of toets */
    function slaap() {
      if (!(mq('(max-width: 820px)') || mq('(pointer: coarse)'))) return;
      var st = 0;
      function wek() {
        clearTimeout(st); st = setTimeout(function () { slaapt = true; window.__hcSlaapt = true; zet(actief()); }, 60000);
        if (slaapt) { slaapt = false; window.__hcSlaapt = false; zet(actief()); }
      }
      ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'].forEach(function (n) { window.addEventListener(n, wek, { passive: true }); });
      wek();
    }

    return {
      /* stil: één beeld zonder opbouw (minder beweging) */
      start: function (stil) {
        stilBeeld = !!stil;
        var bezig = false, go = function () {
          if (klaar || bezig) return;
          bezig = true;
          maakTextuur(function () {
            bezig = false;
            if (!maat()) return;
            klaar = true;
            if (stil) { teken(0, -1); return; }
            luisteraars.push(zet);
            slaap();
            zet(actief());
            if (!raf) { introKlaar = true; teken(tijd, -1); } /* gepauzeerd of buiten beeld gestart: toch één volledig beeld */
          });
        };
        /* wachten op het lettertype (anders tekent de atlas het reservefont), hooguit 1,5 s */
        var gedaan = false, eens = function () { if (gedaan) return; gedaan = true; go(); };
        if (document.fonts && document.fonts.load) { document.fonts.load('400 12px "JetBrains Mono"').then(eens, eens); setTimeout(eens, 1500); }
        else eens();
      }
    };
  })();

  /* ───── start: na het laadscherm (als het er staat), anders meteen ───── */
  function start() {
    if (planeet) planeet.start(reduce);
    startWissel();
  }
  var loader = document.getElementById('loader');
  if (!reduce && loader && document.body.contains(loader) && !loader.classList.contains('done')) naLoader(loader, start);
  else start();
})();
