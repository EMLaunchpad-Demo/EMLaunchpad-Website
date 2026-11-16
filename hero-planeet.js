/* hero-planeet.js: de hero van de home, ontwerp C-C "Teken voor teken". Gekozen door Martijn op 15/11/2026.
   Productie (15/11/2026), gemaakt uit de goedgekeurde voorvertoning hero-c-c.js (ronde 2). Gebruikt op index.html, en/ en fr/ (taal uit <html lang>).
   Vanilla JS, geen bibliotheek. Werkt ook los (solo, zonder site.js en zonder laadscherm).
   1) wisselwoord: elk teken gaat de tekenladder van de planeet af en weer op ( # + :  dan  . - + # ) tot het nieuwe woord er staat
   2) planeet: één bol in monospace-tekens op een 2D-canvas (vooraf getekende tekens), die traag draait, 14 beelden per seconde
   3) klok: de echte tijd in België (Europe/Brussels, uit de klok van de browser), HH:MM, springt op de minuut
   Alles pauzeert buiten beeld, in een verborgen tabblad en als de boekingspopup open is. Op de gsm stopt de draai na 60 s zonder interactie.
   Fix 1 (15/11/2026): de tekst wijkt voor de chatballon van ons platform (transform), en in liggende stand past de planeet zich aan de tekst aan.
   Fix 2 (16/11/2026): de doorzichtige houder van die widget laat tikken door (alleen de ballon en de chatknop zelf zijn klikbaar); op lage
   gsm-schermen mag het tekstblok compacter worden zolang de ballon open is, en liggend mag het iets zakken, zodat de knop en de link vrij blijven.
   16/11/2026: de pauzeknop (rechts op de bovenregel) is weg, op vraag van Martijn. Op de gsm stopt de planeet nog altijd na 60 s.
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
  /* ───── chatwidget van ons platform (rechtsonder, geladen door site.js; fix 1 en 2, 15 en 16/11/2026) ─────
     a) De doorzichtige houder rond de begroetingsballon en de chatknop (#lc_text-widget) laat tikken door: alleen de ballon en de chatknop
        zelf blijven klikbaar (pointer-events, met een eigen <style> in de shadow root van de widget). Zo werken de knop en de link die onder
        dat onzichtbare vak liggen gewoon, ook op een liggende gsm. Alleen zolang de houder zelf niets toont (geen achtergrond, rand of schaduw).
     b) Valt de ballon (of de chatknop) over de groene knop, de link, de microregel, de kop of de zin, dan schuift de tekst omhoog en sluiten
        de tussenruimtes iets, net genoeg om vrij te komen; weer terug als de ballon dicht gaat. Met transform: geen layoutverschuiving.
        Eerst met de gewone kleinste tussenruimtes (MIN); lukt het zo niet, dan mag het blok compacter (KRAP). Staat de planeet naast de tekst
        (liggende gsm, breed scherm), dan mag het hele blok ook iets zakken, onder de ballon uit. De bovenregel (het label) blijft
        12 px onder het menu. Gekozen wordt de stand die het belangrijkste vrijhoudt (eerst de knop, dan de link, de kop,
        de microregel en de zin; een belangrijker deel wordt nooit slechter voor een minder belangrijk), met zo weinig mogelijk beweging.
        Helpt schuiven niet, dan beweegt er niets. Ook bij minder beweging en hoog contrast. */
  (function () {
    var top = root.querySelector('.hc-c-top'), h1 = root.querySelector('.hc-c-h1'), zin = root.querySelector('.hc-c-zin');
    var btn = root.querySelector('.hc-c-btn'), micro = root.querySelector('.hc-c-micro'), link = root.querySelector('.hc-c-link');
    var wis = root.querySelector('.hc-c-wissel');
    if (!window.MutationObserver || !top || !h1 || !zin || !acties || !btn || !micro || !link) return;
    /* kleinste tussenruimte (px): bovenregel en kop, kop en zin, zin en knop, knop en microregel, microregel en de tekst van de link.
       KRAP: alleen als het met MIN niet lukt (lage gsm, ballon open). STAART: het puntje onder de ballon. */
    var MIN = [12, 14, 16, 8, 8], KRAP = [8, 10, 12, 6, 6], MARGE = 8, STAART = 10, ONDER_MENU = 12;
    var DOOR = '#lc_text-widget{pointer-events:none!important}:where(#lc_text-widget)>*{pointer-events:auto}';
    var LANGST = 0;
    (wis ? (wis.getAttribute('data-woorden') || '').split('|') : []).forEach(function (s) { LANGST = Math.max(LANGST, s.length); });
    var sr = null, raf = 0, nog = 0, nu = '', stijl = null;
    function zie(e) {
      if (!e) return null; var r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return null;
      var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return null; return r;
    }
    /* plaats zonder transform, ten opzichte van de hero (offsetTop negeert transforms) */
    function y(el) { var t = 0; for (var e = el; e && e !== root; e = e.offsetParent) t += e.offsetTop; return t; }
    function breed(el) { var g = document.createRange(); g.selectNodeContents(el); return g.getBoundingClientRect(); }
    /* tekstregels van een element zonder verschuiving: de plaats binnen het element plus de plaats van het element zelf (basis) */
    function regels(el, basis, behalve) {
      var uit = [], eb = el.getBoundingClientRect(), tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
      while ((n = tw.nextNode())) {
        if (!n.nodeValue.trim() || (behalve && n.parentElement && n.parentElement.closest(behalve))) continue;
        var g = document.createRange(); g.selectNodeContents(n);
        var rs = g.getClientRects();
        for (var i = 0; i < rs.length; i++) if (rs[i].width > 0.5) uit.push({ l: rs[i].left, r: rs[i].right, t: basis + rs[i].top - eb.top, b: basis + rs[i].bottom - eb.top });
      }
      return uit;
    }
    function leeg(c) { return !c || c === 'transparent' || /^rgba\(.*,\s*0\)$/.test(c); }
    /* a) de houder laat tikken door zolang hij zelf niets toont; geeft terug of dat nu zo is */
    function doorlaat(h) {
      var cs = h ? getComputedStyle(h) : null;
      var aan = !!cs && leeg(cs.backgroundColor) && cs.backgroundImage === 'none' && cs.boxShadow === 'none' &&
        !((parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0) + (parseFloat(cs.borderLeftWidth) || 0) > 0);
      if (!stijl || !sr.contains(stijl)) { stijl = document.createElement('style'); sr.appendChild(stijl); }
      var t = aan ? DOOR : '';
      if (stijl.textContent !== t) stijl.textContent = t;
      return aan && getComputedStyle(h).pointerEvents === 'none';
    }
    /* s: verschuiving per deel (px, positief = omhoog): bovenregel, kop, zin, knoprij, microregel, link. De microregel en de link zitten in
       de knoprij en schuiven daar nog wat bij (--hc-k4, --hc-k5). null: alles terug. */
    function zet(s) {
      var k = s ? [s[0], s[1], s[2], s[3], s[4] - s[3], s[5] - s[3]].map(function (v) { return -Math.round(v) || 0; }) : null;
      if (k && !k.some(function (v) { return v; })) k = null;
      var sleutel = k ? k.join(',') : '';
      if (sleutel === nu) return;
      nu = sleutel;
      if (!sleutel) root.classList.remove('hc-c-chat');
      else { for (var i = 0; i < 6; i++) root.style.setProperty('--hc-k' + i, k[i] + 'px'); root.classList.add('hc-c-chat'); }
      /* de planeet (liggende stand) houdt ook afstand van de verschoven tekst: laat haar opnieuw passen */
      try { root.dispatchEvent(new CustomEvent('hc-c-chat')); } catch (e) {}
    }
    function reken() {
      raf = 0;
      if (!sr) return;
      /* wat in de weg kan liggen: de ballon (met zijn puntje), de ronde chatknop en, als hij toch tikken opvangt, de houder */
      var hd = sr.querySelector('#lc_text-widget'), door = doorlaat(hd), obs = [];
      var o1 = zie(sr.querySelector('.lc_text-widget_prompt--msg-bubble')), o2 = zie(sr.querySelector('#lc_text-widget--btn')), o3 = door ? null : zie(hd);
      if (o1) obs.push({ l: o1.left, r: o1.right, t: o1.top, b: o1.bottom + STAART, b0: o1.bottom });
      if (o2) obs.push({ l: o2.left, r: o2.right, t: o2.top, b: o2.bottom, b0: o2.bottom });
      if (o3) obs.push({ l: o3.left, r: o3.right, t: o3.top, b: o3.bottom, b0: o3.bottom });
      if (!obs.length) { zet(null); return; }
      /* alles als stond de pagina bovenaan: de chat staat vast in beeld, de tekst op zijn plaats zonder verschuiving */
      var rb = root.getBoundingClientRect(), Y = rb.top + window.scrollY;
      var menu = parseFloat(getComputedStyle(root).paddingTop) || 0;
      var tTop = Y + y(top), bTop = tTop + top.offsetHeight, tH1 = Y + y(h1), bH1 = tH1 + h1.offsetHeight;
      var tZin = Y + y(zin), bZin = tZin + zin.offsetHeight, tBtn = Y + y(btn), bBtn = tBtn + btn.offsetHeight;
      var tMic = Y + y(micro), bMic = tMic + micro.offsetHeight;
      var lk = Y + y(link), tLnk = lk + (parseFloat(getComputedStyle(link).paddingTop) || 0), bLnk = lk + link.offsetHeight - 11; /* tekst en onderlijn, niet de tikruimte */
      var stapel = tLnk > bMic; /* gsm: de link staat onder de microregel; anders naast de knop */
      function ruimte(m) {
        return [
          Math.max(0, tTop - (Y + menu + ONDER_MENU)), Math.max(0, tH1 - bTop - m[0]), Math.max(0, tZin - bH1 - m[1]),
          Math.max(0, tBtn - bZin - m[2]), Math.max(0, tMic - bBtn - m[3]), stapel ? Math.max(0, tLnk - bMic - m[4]) : 0
        ];
      }
      /* de doelen, zonder verschuiving. k: welke verschuiving geldt (0 bovenregel, 1 kop, 2 zin, 3 knoprij, 4 microregel, 5 link) */
      var live = root.classList.contains('hc-c-live'), kop = regels(h1, tH1, live ? '.hc-c-vast' : null);
      if (live && wis && wis.getClientRects().length) {
        /* het wisselwoord: de regel zo breed als het langste woord (0,565 em per teken) */
        var rw = wis.getBoundingClientRect(), hb = h1.getBoundingClientRect(), fs = parseFloat(getComputedStyle(h1).fontSize) || 0;
        kop.push({ l: rw.left, r: rw.left + Math.max(rw.width, LANGST * fs * 0.565), t: tH1 + rw.top - hb.top, b: tH1 + rw.bottom - hb.top });
      }
      var rk = btn.getBoundingClientRect(), rm = breed(micro), rl = link.getBoundingClientRect();
      var doelen = [
        { n: 'knop', k: 3, q: [{ l: rk.left, r: rk.right, t: tBtn, b: bBtn }] },
        { n: 'link', k: stapel ? 5 : 3, q: [{ l: rl.left, r: rl.right, t: tLnk, b: bLnk }] },
        { n: 'kop', k: 1, q: kop },
        { n: 'micro', k: 4, q: [{ l: rm.left, r: rm.right, t: tMic, b: bMic }] },
        { n: 'zin', k: 2, q: regels(zin, tZin) }
      ];
      /* verschuiving omhoog per deel bij fractie f van de vrije ruimte a; alles in verhouding, dus elk deel schuift f maal zijn eigen maximum */
      function schuif(a, f) {
        var s0 = f * a[0], s1 = s0 + f * a[1], s2 = s1 + f * a[2], s3 = s2 + f * a[3], s4 = s3 + f * a[4];
        return [s0, s1, s2, s3, s4, stapel ? s4 + f * a[5] : s3];
      }
      function botst(q, s) {
        for (var j = 0; j < obs.length; j++) {
          var o = obs[j];
          if (o.l < q.r && q.l < o.r && o.t < q.b - s + MARGE && q.t - s - MARGE < o.b) return true;
        }
        return false;
      }
      /* hoe een doel erbij staat: lv 0 = vrij met marge, 1 = vrij maar binnen de marge, 2 = (deels) bedekt;
         d = het deel van zijn oppervlak dat echt onder de ballon of de chatknop ligt */
      function graad(d, s) {
        var zacht = false, opp = 0, bed = 0;
        for (var j = 0; j < d.q.length; j++) {
          var q = d.q[j], t = q.t - s, b = q.b - s, a = (q.r - q.l) * (b - t), x = 0;
          if (botst(q, s)) zacht = true;
          for (var o = 0; o < obs.length; o++) {
            var ob = obs[o], w = Math.min(q.r, ob.r) - Math.max(q.l, ob.l), h = Math.min(b, ob.b0) - Math.max(t, ob.t);
            if (w > 0 && h > 0) x += w * h;
          }
          opp += a; bed += Math.min(a, x);
        }
        var deel = opp > 0 ? bed / opp : 0;
        return { lv: deel > 0.001 ? 2 : zacht ? 1 : 0, d: deel };
      }
      function staat(s) { return doelen.map(function (d) { return graad(d, s[d.k]); }); }
      /* beter: de doelen in volgorde van belang (knop, link, kop, microregel, zin). Wordt een doel vrij of juist bedekt, dan beslist dat.
         Komt een bedekt doel dieper onder de ballon, dan nooit (bv. de link niet dieper om de zin vrij te maken). Wat alleen wat minder
         bedekt raakt of wat meer marge krijgt, beslist pas als er verder niets verschilt (het eerste zulke verschil telt). */
      function beter(x, z) {
        var wat = 0;
        for (var i = 0; i < x.length; i++) {
          var xb = x[i].lv === 2, zb = z[i].lv === 2;
          if (xb !== zb) return zb;
          if (xb) {
            if (x[i].d > z[i].d + 0.05) return false;
            if (!wat && x[i].d < z[i].d - 0.05) wat = 1;
          } else if (!wat && x[i].lv !== z[i].lv) wat = x[i].lv < z[i].lv ? 1 : -1;
        }
        return wat > 0;
      }
      /* omhoog: per doel net genoeg om boven een ballon of chatknop uit te komen, of zo ver als het kan */
      function omhoog(m) {
        var a = ruimte(m), heel = schuif(a, 1), fr = [1], uit = [];
        for (var i = 0; i < doelen.length; i++) {
          var d = doelen[i], A = heel[d.k];
          if (!(A > 0)) continue;
          for (var j = 0; j < d.q.length; j++) {
            for (var o = 0; o < obs.length; o++) {
              var q = d.q[j], ob = obs[o], nodig = q.b + MARGE + 1 - ob.t;
              if (ob.l < q.r && q.l < ob.r && nodig > 0 && nodig <= A) fr.push(nodig / A);
            }
          }
        }
        fr.sort(function (x, z) { return x - z; });
        for (i = 0; i < fr.length; i++) uit.push(schuif(a, fr[i]));
        return uit;
      }
      /* omlaag (alleen waar de planeet naast de tekst staat: liggende gsm en breed scherm): het hele blok, zonder de tussenruimtes te
         veranderen, net genoeg om onder de ballon uit te komen. Alles blijft op het eerste scherm en boven de statusregel. */
      function omlaag() {
        var st = root.querySelector('.hc-c-stage'), uit = [];
        if (!st || getComputedStyle(st).position !== 'absolute') return uit;
        var voet = root.querySelector('.hc-c-voet'), grens = Math.min(window.innerHeight, Y + root.offsetHeight) - MARGE;
        if (voet && voet.offsetHeight) grens = Math.min(grens, Y + voet.offsetTop - MARGE);
        var max = grens - Math.max(bBtn, bMic, lk + link.offsetHeight), ds = [];
        if (!(max > 0)) return uit;
        for (var i = 0; i < doelen.length; i++) {
          for (var j = 0; j < doelen[i].q.length; j++) {
            for (var o = 0; o < obs.length; o++) {
              var q = doelen[i].q[j], ob = obs[o], nodig = ob.b + MARGE + 1 - q.t;
              if (ob.l < q.r && q.l < ob.r && q.b + MARGE > ob.t && nodig > 0 && nodig <= max) ds.push(nodig);
            }
          }
        }
        ds.sort(function (x, z) { return x - z; });
        for (i = 0; i < ds.length; i++) uit.push([-ds[i], -ds[i], -ds[i], -ds[i], -ds[i], -ds[i]]);
        return uit;
      }
      /* kandidaten in volgorde van voorkeur: niet schuiven, omhoog met MIN, omlaag, omhoog met KRAP. Bij gelijkspel wint de eerste. */
      var nul = [0, 0, 0, 0, 0, 0], best = { v: staat(nul), s: null };
      [function () { return omhoog(MIN); }, omlaag, function () { return omhoog(KRAP); }].forEach(function (maak) {
        if (!best.v.some(function (c) { return c.lv > 0; })) return;
        var lijst = maak();
        for (var i = 0; i < lijst.length; i++) { var v = staat(lijst[i]); if (beter(v, best.v)) best = { v: v, s: lijst[i] }; }
      });
      zet(best.s);
    }
    function plan() {
      if (!raf) raf = requestAnimationFrame(reken);
      /* nog eens als de ballon klaar is met invliegen of uitfaden */
      clearTimeout(nog); nog = setTimeout(function () { reken(); nog = setTimeout(reken, 1000); }, 400);
    }
    function koppel() {
      var cw = document.querySelector('chat-widget'); if (!cw || !cw.shadowRoot) return false;
      sr = cw.shadowRoot;
      new MutationObserver(plan).observe(sr, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
      sr.addEventListener('animationend', plan); sr.addEventListener('transitionend', plan);
      window.addEventListener('resize', plan);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(plan, function () {});
      plan(); return true;
    }
    /* de widget komt pas na de eerste interactie of na 5 s: rustig peilen tot hij er is (hooguit 3 minuten) */
    var keer = 0, zoek = setInterval(function () { if (koppel() || ++keer > 360) clearInterval(zoek); }, 500);
  })();

  if (forced) return; /* hoog contrast: geen beeld en geen beweging, de CSS toont de vaste tekst */

  /* ───── zichtbaarheid: één bron voor het woord, de planeet en de klok ───── */
  var zicht = true, popup = null, luisteraars = [];
  function popupOpen() { return !!(popup && popup.classList.contains('open')); }
  function actief() { return zicht && !document.hidden && !popupOpen(); }
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
         Een letter die blijft staan, blijft gewoon staan. De laatste trede voor de letter is groen: één puls die door het woord loopt.
         Wordt het woord korter, dan blijft een plaats die leeg wordt een spatie tot de golf voorbij is: de tekens erachter schuiven niet op
         (geen layoutverschuiving); aan het eind gaan de lege plaatsen samen weg. */
      function maakPlan(van, nw) {
        var n = Math.max(van.length, nw.length), p = [];
        for (var k = 0; k < n; k++) {
          var a = van.charAt(k), b = nw.charAt(k), q;
          if (a && a === b) { p.push(null); continue; }
          q = a ? ['#', '+', ':'] : ['', '', ''];
          if (b) q.push('.', '-', '+', '#', b); else q.push(' ');
          q.letter = !!b;
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
          else { c = q[j]; klaar = false; kl += (q.letter && j === q.length - 2) ? ' is-kop' : ' is-ruis'; }
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

    /* ── liggende gsm en lage vensters (tot 520 px hoog, vanaf 561 px breed; fix 1, 15/11/2026) ──
       Daar staat de planeet naast de tekst. Ze krimpt en schuift in de hoogte tot ze overal VRIJ px vrij blijft van de tekst:
       bovenregel, kop (met het langste wisselwoord), zin, knop, microregel en link. Eerst zo groot mogelijk, dan zo dicht mogelijk
       bij het midden (de plaats uit de CSS). Zonder JS geldt de maat uit de CSS. Op andere schermen doet dit niets. */
    var LIGGEND = '(max-height: 520px) and (min-width: 561px)', VRIJ = 48, DMIN = 96, pasSleutel = '';
    var LANGST = 0;
    (function () { var w = root.querySelector('.hc-c-wissel'), l = w ? (w.getAttribute('data-woorden') || '').split('|') : []; for (var i = 0; i < l.length; i++) LANGST = Math.max(LANGST, l[i].length); })();
    /* verschuiving (translateY) van een element en zijn ouders binnen de hero: de chatroutine kan de tekst met transform verplaatsen */
    function tY(el) {
      var t = 0;
      for (var e = el; e && e !== root; e = e.parentElement) {
        var m = getComputedStyle(e).transform, p = m && m !== 'none' ? m.match(/matrix(3d)?\(([^)]+)\)/) : null;
        if (p) { var v = p[2].split(','); t += +(p[1] ? v[13] : v[5]) || 0; }
      }
      return t;
    }
    function tekstBlokken(rb) {
      var uit = [], K = [0, 0, 0, 0, 0, 0], kk;
      /* staat de tekst opzij voor de chatballon, dan telt ook die plaats (eindstand van de verschuiving, zie --hc-k0 tot --hc-k5) */
      if (root.classList.contains('hc-c-chat')) for (kk = 0; kk < 6; kk++) K[kk] = parseFloat(root.style.getPropertyValue('--hc-k' + kk)) || 0;
      function zet(el, r, k, t, b) {
        if (!r || !(r.width > 0)) return;
        var d = tY(el), q = { l: r.left - rb.left, r: r.right - rb.left, t: (t == null ? r.top : t) - d - rb.top, b: (b == null ? r.bottom : b) - d - rb.top };
        uit.push(q);
        if (k) uit.push({ l: q.l, r: q.r, t: q.t + k, b: q.b + k });
      }
      function regels(el, k, behalve) {
        if (!el) return;
        var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
        while ((n = tw.nextNode())) {
          if (!n.nodeValue.trim() || (behalve && n.parentElement && n.parentElement.closest(behalve))) continue;
          var g = document.createRange(); g.selectNodeContents(n);
          var rs = g.getClientRects(); for (var i = 0; i < rs.length; i++) zet(el, rs[i], k);
        }
      }
      function inhoud(el, k) { if (!el || !el.getClientRects().length) return; var g = document.createRange(); g.selectNodeContents(el); zet(el, g.getBoundingClientRect(), k); }
      var h1 = root.querySelector('.hc-c-h1'), w = root.querySelector('.hc-c-wissel'), live = root.classList.contains('hc-c-live');
      inhoud(root.querySelector('.hc-c-eyebrow'), K[0]);
      if (h1) {
        regels(h1, K[1], live ? '.hc-c-vast' : null);
        /* het wisselwoord: de regel zo breed als het langste woord (0,565 em per teken) */
        if (live && w && w.getClientRects().length) {
          var rw = w.getBoundingClientRect(), fs = parseFloat(getComputedStyle(h1).fontSize) || 0;
          zet(h1, { left: rw.left, right: rw.left + LANGST * fs * 0.565, top: rw.top, bottom: rw.bottom, width: 1 }, K[1]);
        }
      }
      regels(root.querySelector('.hc-c-zin'), K[2]);
      var b = root.querySelector('.hc-c-btn'); if (b && b.getClientRects().length) zet(b, b.getBoundingClientRect(), K[3]);
      inhoud(root.querySelector('.hc-c-micro'), K[3] + K[4]);
      var lk = root.querySelector('.hc-c-link');
      if (lk && lk.getClientRects().length) { var rl = lk.getBoundingClientRect(); zet(lk, rl, K[3] + K[5], rl.top + (parseFloat(getComputedStyle(lk).paddingTop) || 0), rl.bottom - 11); }
      return uit;
    }
    function pas() {
      if (!mq(LIGGEND)) {
        if (pasSleutel) { root.style.removeProperty('--hc-fit-d'); root.style.removeProperty('--hc-fit-top'); pasSleutel = ''; }
        return;
      }
      var rb = root.getBoundingClientRect(), W = rb.width, H = rb.height, vw = window.innerWidth, vh = window.innerHeight;
      if (!W || !H) return;
      var menu = parseFloat(getComputedStyle(root).paddingTop) || 0;
      var blok = tekstBlokken(rb), rechts = Math.max(16, vw * 0.03), dMax = Math.floor(Math.min(vh * 0.74, vw * 0.34));
      var boven = menu + 8, onder = Math.min(H, vh - (rb.top + window.scrollY)) - 8;
      /* de inkt van de bol: tot ongeveer een halve tekenhoogte binnen het vak (zie maat()); 4 px is aan de veilige kant */
      function vrij(cx, cy, r) {
        var m = Infinity;
        for (var i = 0; i < blok.length; i++) {
          var q = blok[i], dx = Math.max(q.l - cx, 0, cx - q.r), dy = Math.max(q.t - cy, 0, cy - q.b);
          m = Math.min(m, Math.sqrt(dx * dx + dy * dy) - r);
        }
        return m;
      }
      var best = null, d, cy, k;
      for (d = dMax; d >= DMIN && !best; d -= 2) {
        var cx = W - rechts - d / 2, r = d / 2 - 4, lo = boven + d / 2, hi = onder - d / 2, cy0 = menu + (H - menu) / 2;
        if (hi < lo) continue;
        cy0 = Math.min(hi, Math.max(lo, cy0));
        for (k = 0; k <= hi - lo + 2 && !best; k += 2) {
          for (var z = -1; z <= 1; z += 2) {
            cy = cy0 + z * k;
            if (cy < lo || cy > hi) continue;
            if (vrij(cx, cy, r) >= VRIJ) { best = { d: d, top: cy - d / 2 }; break; }
          }
        }
      }
      if (!best) {
        /* past nergens: de kleinste maat, op de hoogte met de meeste ruimte */
        d = DMIN; var cx2 = W - rechts - d / 2, lo2 = boven + d / 2, hi2 = Math.max(lo2, onder - d / 2), bestV = -Infinity;
        for (cy = lo2; cy <= hi2; cy += 2) { var v = vrij(cx2, cy, d / 2 - 4); if (v > bestV) { bestV = v; best = { d: d, top: cy - d / 2 }; } }
      }
      var sl = best.d + '|' + Math.round(best.top);
      if (sl === pasSleutel) return;
      pasSleutel = sl;
      root.style.setProperty('--hc-fit-d', best.d + 'px'); root.style.setProperty('--hc-fit-top', Math.round(best.top) + 'px');
    }

    /* het canvas krijgt een maat en plaats op hele pixels: zo blijven de tekens scherp */
    function maat() {
      pas();
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
    /* de tekst schuift opzij voor de chatballon (of terug): opnieuw passen (alleen liggend verandert er iets) */
    root.addEventListener('hc-c-chat', rz);
    /* lettertypes later geladen (Archivo van de zin en de knoppen): de tekst wordt iets breder of smaller, dus opnieuw passen */
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(rz, function () {});
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', rz);
    }

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
            if (!raf) { introKlaar = true; teken(tijd, -1); } /* stil gestart (buiten beeld, verborgen tabblad of popup open): toch één volledig beeld */
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
