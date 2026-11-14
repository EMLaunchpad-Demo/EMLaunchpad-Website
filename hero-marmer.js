/* hero-marmer.js: de hero van de home, ontwerp A "Vloeibaar marmer". Gekozen door Martijn op 13/11/2026.
   Gemaakt uit het goedgekeurde voorbeeld hero-v2-a.js. Vanilla JS, geen bibliotheek.
   1) tekstwissel (één woord, als geheel)  2) WebGL-marmer (domain-warped fbm) met een gouden ader rechtsboven
   Pauzeert buiten beeld, in een verborgen tabblad, als de boekingspopup open is en met de pauzeknop.
   window.__hvFrames = aantal getekende frames. */
(function () {
  'use strict';
  var root = document.querySelector('.hv-a');
  window.__hvFrames = 0;
  if (!root) return;
  var doc = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* hoog contrast (forced-colors): geen marmer en geen pauzeknop, dus ook geen wisselend woord (WCAG 2.2.2) */
  var forced = window.matchMedia && matchMedia('(forced-colors: active)').matches;

  /* zichtbaarheid: één bron voor de tekstwissel en het canvas */
  var inBeeld = true, gepauzeerd = false, popup = null, luisteraars = [];
  function actief() { return inBeeld && !document.hidden && !gepauzeerd && !(popup && popup.classList.contains('open')); }
  function meld() { var a = actief(); for (var i = 0; i < luisteraars.length; i++) luisteraars[i](a); }
  var acties = root.querySelector('.hv-a-acties');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      inBeeld = e[e.length - 1].isIntersecting; meld();
    }, { threshold: 0.02 }).observe(root);
    /* menuknop: een omlijning zolang de groene heroknop onder het menu zichtbaar is, daarna weer gevuld */
    if (acties) {
      var menuH = Math.round(parseFloat(getComputedStyle(root).paddingTop) || 86);
      new IntersectionObserver(function (e) {
        doc.classList.toggle('hv-a-weg', !e[e.length - 1].isIntersecting);
      }, { rootMargin: '-' + menuH + 'px 0px 0px 0px' }).observe(acties);
    }
  }

  /* ───── chatwidget van ons platform (rechtsonder, geladen door site.js) ─────
     Het ontwerp blijft zoals het is. Alleen zolang de begroetingsballon (of de chatknop) over de groene knop of de link zou vallen,
     schuift de tekst net genoeg omhoog, en weer terug als de ballon dicht gaat. Met transform: geen layoutverschuiving (CLS 0).
     Nooit tot tegen het menu of de pauzeknop. Is het scherm daarvoor te laag, dan toont de pauzeknop even alleen zijn icoon. */
  (function () {
    var blok = root.querySelector('.hv-a-in');
    var h1 = root.querySelector('.hv-a-h1');
    var doelen = [root.querySelector('.hv-a-btn'), root.querySelector('.hv-a-link')];
    if (!blok || !h1 || !window.MutationObserver) return;
    var sr = null, raf = 0, nog = 0, nu = 0, krap = false, MARGE = 8, LUCHT = 16, ICOON = 24;
    function zie(e) {
      if (!e) return null; var r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return null;
      var cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity < 0.05) return null; return r;
    }
    function verschuiving() { var t = getComputedStyle(blok).transform, m = t && t !== 'none' ? t.match(/matrix\(([^)]+)\)/) : null; return m ? +m[1].split(',')[5] || 0 : 0; }
    /* de eerste regel van de kop: hangt niet af van het wisselwoord */
    function regel1() {
      var g = document.createRange(); g.selectNodeContents(h1);
      var rs = g.getClientRects(), top = Infinity, l = Infinity, r = -Infinity, i;
      for (i = 0; i < rs.length; i++) if (rs[i].width > 2 && rs[i].height > 2 && rs[i].top < top) top = rs[i].top;
      for (i = 0; i < rs.length; i++) if (rs[i].width > 2 && rs[i].height > 2 && rs[i].top < top + 4) { l = Math.min(l, rs[i].left); r = Math.max(r, rs[i].right); }
      return top < Infinity ? { top: top, left: l, right: r } : null;
    }
    function reken() {
      raf = 0;
      var obs = [], i, j, q;
      if (sr) {
        /* ballon, de doorzichtige houder eromheen (vangt ook tikken op) en de ronde chatknop */
        q = [sr.querySelector('#lc_text-widget'), sr.querySelector('.lc_text-widget_prompt--msg-bubble'), sr.querySelector('#lc_text-widget--btn')];
        for (i = 0; i < q.length; i++) { var o0 = zie(q[i]); if (o0) obs.push(o0); }
      }
      var l1 = regel1(); if (!l1) return;
      var d = window.scrollY - verschuiving(), kop = l1.top + d; /* plaats zonder verschuiving, met de pagina bovenaan */
      var nodig = [], schuif = 0, klein = false;
      for (i = 0; i < doelen.length; i++) {
        var r = doelen[i] && doelen[i].getBoundingClientRect(); if (!r || !r.width) continue;
        var bod = r.bottom + d - (i ? (parseFloat(getComputedStyle(doelen[i]).paddingBottom) || 0) * 0.7 : 0); /* bij de link telt de tekst met de onderlijn, niet de tikruimte eronder */
        /* alles wat onder de kop over de knop of de link valt (of erop zou vallen als de tekst omhoog schuift) */
        var n = 0;
        for (j = 0; j < obs.length; j++) {
          var o = obs[j];
          if (o.left < r.right && r.left < o.right && o.top < bod + MARGE && o.top > kop) n = Math.max(n, bod + MARGE - o.top);
        }
        if (n > 0) nodig.push(n);
      }
      if (nodig.length) {
        var grens = root.getBoundingClientRect().top + window.scrollY + (parseFloat(getComputedStyle(root).paddingTop) || 0) + 12; /* onder het menu */
        var ruimte = kop - grens, metIcoon = ruimte;
        var pz = root.querySelector('.hv-a-pauze');
        if (pz && pz.offsetWidth && zie(pz)) {
          /* de plaats van de pauzeknop zonder zijn eigen verschuiving (offset*, niet getBoundingClientRect) */
          var rb = root.getBoundingClientRect(), pl = rb.left + pz.offsetLeft, pr = pl + pz.offsetWidth, pb = rb.top + pz.offsetTop + pz.offsetHeight;
          if (pl < l1.right + 12 && l1.left < pr) { /* de pauzeknop staat boven de eerste regel van de kop */
            ruimte = kop - Math.max(grens, pb + window.scrollY + LUCHT);
            if (pr - ICOON < l1.right + 12) metIcoon = ruimte; /* ook alleen het icoon zou in de weg staan */
          }
        }
        /* alleen schuiven voor wat er echt helemaal vrij kan komen (liggende gsm: niet voor niets bewegen) */
        var beste = function (a) { var b = 0; for (var k = 0; k < nodig.length; k++) if (nodig[k] <= a && nodig[k] > b) b = nodig[k]; return b; };
        schuif = beste(ruimte);
        var s2 = beste(metIcoon);
        if (s2 > schuif) { schuif = s2; klein = true; }
      }
      schuif = Math.round(schuif);
      if (klein !== krap) {
        krap = klein; root.classList.toggle('hv-a-krap', krap);
        /* alleen het icoon: de knop schuift met transform naar rechts tot enkel het icoon in beeld is (de tekst blijft de naam van de knop) */
        if (krap) root.style.setProperty('--hv-a-ico', (pz.offsetWidth - ICOON) + 'px'); else root.style.removeProperty('--hv-a-ico');
      }
      if (schuif !== nu) {
        nu = schuif; doc.classList.toggle('hv-a-chat', nu > 0);
        if (nu > 0) root.style.setProperty('--hv-a-chat', -nu + 'px'); else root.style.removeProperty('--hv-a-chat');
      }
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
      /* na de intro (kop, zin en knoppen schuiven 24 px) opnieuw meten */
      root.addEventListener('transitionend', function (e) { if (e.target === h1 || e.target === acties) plan(); });
      plan(); return true;
    }
    /* de widget komt pas na de eerste interactie of na 5 s: rustig peilen tot hij er is (hooguit 3 minuten) */
    var keer = 0, zoek = setInterval(function () { if (koppel() || ++keer > 360) clearInterval(zoek); }, 500);
  })();

  if (reduce || forced) return; // stil beeld en vaste tekst uit de CSS
  document.addEventListener('visibilitychange', meld);
  /* boekingspopup (div.ghl-overlay.open): beweging stil zolang hij open is */
  document.addEventListener('click', function () {
    if (popup) return;
    setTimeout(function () {
      popup = document.querySelector('.ghl-overlay'); if (!popup) return;
      new MutationObserver(meld).observe(popup, { attributes: true, attributeFilter: ['class'] }); meld();
    }, 120);
  }, true);

  function naLoader(l, fn) {
    var ok = false, mo, go = function () { if (ok) return; ok = true; mo && mo.disconnect(); setTimeout(fn, 200); };
    mo = new MutationObserver(function () { if (!document.body.contains(l) || l.classList.contains('done')) go(); });
    mo.observe(l, { attributes: true, attributeFilter: ['class'] });
    mo.observe(document.body, { childList: true });
    setTimeout(go, 6000);
  }

  /* ───── 1. tekstwissel ─────
     De woorden staan niet als tekst in de h1: ze worden getekend via een pseudo-element (attr(data-w)).
     Schermlezers en Google lezen alleen de vaste zin. */
  var wissel = root.querySelector('.hv-a-wissel');
  var startWissel = function () {};
  if (wissel) {
    var lijst = (wissel.getAttribute('data-woorden') || '').split('|').filter(Boolean);
    if (lijst.length > 1) {
      var maak = function (w) { var s = document.createElement('span'); s.className = 'hv-a-w'; s.setAttribute('data-w', w); return s; };
      var nu = 0, huidig = maak(lijst[0]), timer = 0, loopt = false, TUSSEN = 4200;
      huidig.classList.add('is-in'); wissel.appendChild(huidig); root.classList.add('hv-a-live');
      var volgende = function () {
        var oud = huidig; nu = (nu + 1) % lijst.length; huidig = maak(lijst[nu]);
        oud.classList.add('is-uit'); wissel.appendChild(huidig);
        void huidig.offsetWidth; huidig.classList.add('is-in');
        setTimeout(function () { if (oud.parentNode) oud.parentNode.removeChild(oud); }, 420);
        timer = setTimeout(volgende, TUSSEN);
      };
      var zet = function (aan) { clearTimeout(timer); timer = 0; if (aan && loopt) timer = setTimeout(volgende, TUSSEN); };
      luisteraars.push(zet);
      startWissel = function () { loopt = true; zet(actief()); };
    }
  }

  /* ───── pauzeknop (WCAG 2.2.2) ───── */
  /* De zichtbare tekst is de naam van de knop (WCAG 2.5.3): wie "Pauzeer" zegt, raakt hem. Geen aria-pressed,
     want de tekst wisselt al mee met de toestand. */
  var knop = document.createElement('button');
  knop.type = 'button'; knop.className = 'hv-a-pauze';
  /* teksten volgens de taal van de pagina (lang op <html>) */
  var TXT = {
    nl: { pauze: 'Pauzeer', speel: 'Speel af' },
    en: { pauze: 'Pause', speel: 'Play' },
    fr: { pauze: 'Pause', speel: 'Lecture' }
  };
  TXT = TXT[(doc.getAttribute('lang') || 'nl').slice(0, 2).toLowerCase()] || TXT.nl;
  knop.innerHTML = '<i aria-hidden="true"></i><span></span>';
  knop.lastChild.textContent = TXT.pauze;
  knop.addEventListener('click', function () {
    gepauzeerd = !gepauzeerd; knop.classList.toggle('is-stil', gepauzeerd);
    knop.lastChild.textContent = gepauzeerd ? TXT.speel : TXT.pauze; meld();
  });
  /* vóór de tekst in de tabvolgorde: eerst de bediening van de beweging, dan de inhoud (de plaats op het scherm blijft rechtsboven) */
  root.insertBefore(knop, root.querySelector('.hv-a-in'));

  function straks(fn, ms) {
    setTimeout(function () { if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 1200 }); else fn(); }, ms);
  }

  /* ───── intro: alleen als het laadscherm er staat (anders staat de tekst er al en blijft hij staan) ───── */
  var loader = document.getElementById('loader');
  if (loader && document.body.contains(loader) && !loader.classList.contains('done')) {
    root.classList.add('hv-a-wacht');
    naLoader(loader, function () {
      root.classList.add('hv-a-kom'); root.classList.remove('hv-a-wacht');
      setTimeout(function () { root.classList.remove('hv-a-kom'); }, 2400);
      startWissel(); straks(startGL, 500);
    });
  } else { startWissel(); straks(startGL, 60); }

  /* ───── 2. marmer ───── */
  var herstart = 0;
  function startGL() {
    var cv = root.querySelector('.hv-a-cv'); if (!cv) return;
    if (window.matchMedia && matchMedia('(forced-colors: active)').matches) return;
    var gl = null, opt = { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false };
    try { gl = cv.getContext('webgl', opt) || cv.getContext('experimental-webgl', opt); } catch (e) { gl = null; }
    if (!gl) return; // het stille beeld blijft staan
    var deriv = !!gl.getExtension('OES_standard_derivatives');
    var par = gl.getExtension('KHR_parallel_shader_compile');
    var hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT); hp = hp && hp.precision > 0;

    var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    var FS = (deriv ? '#extension GL_OES_standard_derivatives : enable\n#define DV\n' : '') +
      'precision ' + (hp ? 'highp' : 'mediump') + ' float;' +
      'uniform vec2 uR;uniform float uT;uniform vec2 uM;uniform float uW;' +
      'const vec3 NAVY=vec3(.035,.070,.132);const vec3 BLAUW=vec3(.106,.306,.596);const vec3 SAF=vec3(.114,.373,.722);' +
      'const vec3 PETROL=vec3(.047,.262,.330);const vec3 SMAR=vec3(.067,.369,.278);const vec3 GROEN=vec3(.122,.620,.373);' +
      'const vec3 GOUD=vec3(.851,.722,.400);' +
      'float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}' +
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);' +
      'return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}' +
      'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p+7.3;a*=.5;}return s/.9375;}' +
      'float fb3(vec2 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p+7.3;a*=.5;}return s/.875;}' +
      'float ader(float c,float c0,float w,float fw){return 1.-smoothstep(w,w+1.1,abs(c-c0)/fw);}' +
      'void main(){' +
      'vec2 uv=gl_FragCoord.xy/uR;' +
      'vec2 p=(gl_FragCoord.xy-.5*uR)/min(uR.x,uR.y);' +
      'float por=clamp(uR.y/uR.x-1.,0.,1.);' +
      'p.y-=.24*por;p+=uM*.03;' +
      /* r0.x loopt mee met de stroom (linksboven naar rechtsonder), r0.y staat er dwars op */
      'vec2 r0=vec2(.848*p.x-.530*p.y,.530*p.x+.848*p.y);' +
      'float t=uT;' +
      'vec2 s=vec2(r0.x*.5,r0.y*1.5)+vec2(t*.010,3.1);' +
      'vec2 q=vec2(fbm(s+vec2(0.,t*.016)),fbm(s+vec2(5.2,1.3)-vec2(t*.013,0.)));' +
      'vec2 r=vec2(fbm(s+3.*q+vec2(1.7,9.2)+t*.017),fbm(s+3.*q+vec2(8.3,2.8)-t*.014));' +
      'r+=uM.yx*vec2(.05,-.05);' +
      'float f=fbm(s+3.2*r);' +
      /* c = de verwrongen dwarscoördinaat: de kleurbanden en de steenaders volgen zijn hoogtelijnen */
      'float c=r0.y+(f-.5)*.8+(r.x-.5)*.42+(q.y-.5)*.25;' +
      'float e=exp(-pow((c-.36)/.34,2.));' +
      'float b=exp(-pow((c+.10)/.27,2.));' +
      'float lagen=sin((c*5.+f*2.5)*6.2832)*.5+.5;' +
      'float fijn=sin((c*20.+r.y*4.+q.x*3.)*6.2832)*.5+.5;' +
      'vec3 col=mix(NAVY,BLAUW,smoothstep(.30,.86,f)*.50+.10);' +
      'col=mix(col,BLAUW,smoothstep(.55,1.3,c)*.55);' +
      'col=mix(col,SAF,b*(.16+.40*smoothstep(.25,.85,lagen)*smoothstep(.3,.75,f)));' +
      'col=mix(col,PETROL,smoothstep(.10,.70,e));' +
      'col=mix(col,SMAR,smoothstep(.42,.92,e));' +
      'col=mix(col,GROEN,smoothstep(.72,1.,e)*smoothstep(.45,.9,lagen)*smoothstep(.35,.75,f)*.32);' +
      'float diep=.45+.55*smoothstep(.05,.6,e);col*=1.-.12*diep*(1.-lagen);col*=1.-.05*diep*(1.-fijn);' +
      /* steen: dunne donkere en lichte minerale aders, en een vaste korrel */
      'float kreuk=pow(1.-abs(sin((c*3.2+f*2.2+r.x)*3.1416)),7.);col*=1.-.16*kreuk;' +
      'float mv=fb3(s*2.1+2.2*r+vec2(11.3,5.7));' +
      'float mn=pow(1.-abs(2.*mv-1.),22.);' +
      'col+=vec3(.20,.30,.31)*mn*(.25+.75*max(e,b))*.55;' +
      'col+=(h(floor(gl_FragCoord.xy/max(1.,uW*1.1))+.5)-.5)*.022;' +
      /* gouden ader: alleen rechtsboven (weg van de tekst), wisselende dikte, één zwakke vertakking */
      'float cn=fb3(vec2(r0.x*.45,r0.y*.9)+1.1*q+vec2(4.4,t*.008));' +
      'float cg=r0.y+(cn-.5)*.78;' +
      '\n#ifdef DV\nfloat fw=fwidth(cg)+1e-5;\n#else\nfloat fw=2.6/min(uR.x,uR.y);\n#endif\n' +
      'float mk=mix(smoothstep(.50,.65,uv.x),1.,por)*smoothstep(mix(.36,.52,por),mix(.51,.67,por),uv.y);' +
      'float blad=.6+.4*n(r0*vec2(34.,90.)+f*8.);' +
      'float glans=.78+.22*sin(r0.x*5.-t*.22+f*4.);' +
      'float dik=.35+1.1*n(vec2(r0.x*2.6+t*.02,8.1));' +
      'float tak=.13*smoothstep(-.05,.55,r0.x+(q.x-.5)*.4);' +
      'float g=ader(cg,.24,uW*dik*.8,fw)*.70+ader(cg,.24+tak,uW*.4,fw)*.30*smoothstep(.004,.03,tak);' +
      'g*=mk*blad*glans*smoothstep(.22,.62,fw*min(uR.x,uR.y));' +
      'col=mix(col,GOUD*(.80+.36*blad),clamp(g,0.,1.));' +
      'gl_FragColor=vec4(col,1.);}';

    var v = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(v, VS); gl.compileShader(v);
    var fsh = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fsh, FS); gl.compileShader(fsh);
    var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, fsh); gl.linkProgram(pr);
    /* niet wachten op de compiler op de hoofdthread: peilen tot hij klaar is */
    var pogingen = 0;
    (function klaar() {
      if (par && !gl.getProgramParameter(pr, par.COMPLETION_STATUS_KHR) && pogingen++ < 200) return setTimeout(klaar, 40);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
      verder();
    })();

    function verder() {
      gl.useProgram(pr);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var uR = gl.getUniformLocation(pr, 'uR'), uT = gl.getUniformLocation(pr, 'uT'), uM = gl.getUniformLocation(pr, 'uM'), uW = gl.getUniformLocation(pr, 'uW');

      var klein = matchMedia('(max-width: 820px), (pointer: coarse)').matches;
      var kwal = 1, plafond = 1, schaal = 1, W = 0, H = 0;
      function maat() {
        var b = root.getBoundingClientRect(); if (!b.width || !b.height) return;
        var dpr = Math.min(window.devicePixelRatio || 1, klein ? 1 : 1.5);
        schaal = dpr * kwal;
        var px = b.width * b.height * schaal * schaal, MAX = 1.15e6;
        if (px > MAX) schaal *= Math.sqrt(MAX / px);
        var w = Math.max(2, Math.round(b.width * schaal)), hh = Math.max(2, Math.round(b.height * schaal));
        if (w !== W || hh !== H) { W = w; H = hh; cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); }
      }
      maat();
      var rz = 0, opMaat = function () { clearTimeout(rz); rz = setTimeout(function () { maat(); if (!raf && !weg) teken(0); }, 150); };
      window.addEventListener('resize', opMaat);

      /* muis of vinger: het marmer geeft heel licht mee (luistert alleen als de hero in beeld is) */
      var mx = 0, my = 0, tx = 0, ty = 0, luistert = false;
      function beweeg(e) {
        var b = root.getBoundingClientRect();
        tx = (e.clientX - b.left) / b.width * 2 - 1; ty = -((e.clientY - b.top) / b.height * 2 - 1);
      }

      var raf = 0, vorige = 0, laatst = 0, tekende = false, tijd = 37, eerste = true, weg = false;
      var som = 0, tel = 0, rustig = 0, pas = 0, meetVanaf = 0, traag = 0;
      function teken(dt) {
        tijd += dt * 0.45; mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
        gl.uniform2f(uR, W, H); gl.uniform1f(uT, tijd); gl.uniform2f(uM, mx, my); gl.uniform1f(uW, Math.max(0.55, schaal * 0.9));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        window.__hvFrames++;
        if (eerste) { eerste = false; cv.classList.add('is-aan'); }
      }
      function lus(nu) {
        raf = requestAnimationFrame(lus);
        if (!vorige) { vorige = laatst = nu; if (!meetVanaf) meetVanaf = nu + 1500; teken(0); tekende = false; return; }
        var ruw = nu - vorige; vorige = nu;
        /* te traag toestel: resolutie omlaag, en weer omhoog als er ruimte is. Gemeten op het interval na een getekend frame,
           tegen 42 ms: een scherm op 30 Hz (33 ms per beeld) telt dus niet als traag. */
        if (tekende && nu > meetVanaf && ruw < 250) {
          som += ruw; tel++;
          if (tel >= 20) {
            var gem = som / tel; som = 0; tel = 0;
            if (gem > 42 && kwal > 0.4) {
              if (pas > 0) plafond = kwal * 0.9; /* net verhoogd en meteen te traag: niet opnieuw proberen */
              kwal = Math.max(0.4, kwal * (gem > 70 ? 0.62 : 0.82)); rustig = 0; maat();
            } else if (gem > 42) {
              /* ook op de laagste resolutie drie keer na elkaar te traag (toestel zonder grafische kaart): stoppen, het stille beeld komt terug */
              if (++traag >= 3) { stop(); window.__hvTraag = true; return; }
            } else if (gem < 36) {
              if (++rustig >= 4 && kwal < plafond) { kwal = Math.min(plafond, kwal * 1.2); rustig = 0; pas = 3; maat(); }
            } else rustig = 0;
            if (gem <= 42) traag = 0;
            if (pas > 0) pas--;
          }
        }
        tekende = false;
        /* de stroming is traag: ongeveer 30 beelden per seconde volstaat */
        var dt = nu - laatst; if (dt < 24) return;
        laatst = nu; teken(Math.min(dt, 80) / 1000); tekende = true;
      }
      function zetLus(aan) {
        if (weg) return;
        if (aan && !raf) { vorige = 0; raf = requestAnimationFrame(lus); }
        else if (!aan && raf) { cancelAnimationFrame(raf); raf = 0; }
        if (aan !== luistert) { luistert = aan; window[(aan ? 'add' : 'remove') + 'EventListener']('pointermove', beweeg, { passive: true }); }
      }
      luisteraars.push(zetLus);
      /* stoppen: lus weg, alle luisteraars van deze ronde opruimen, het stille beeld komt terug (een herstart zet nieuwe) */
      function stop() {
        if (raf) cancelAnimationFrame(raf); raf = 0; weg = true; cv.classList.remove('is-aan');
        clearTimeout(rz); window.removeEventListener('resize', opMaat);
        if (luistert) { luistert = false; window.removeEventListener('pointermove', beweeg, { passive: true }); }
        var k = luisteraars.indexOf(zetLus); if (k > -1) luisteraars.splice(k, 1);
      }
      cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); stop(); });
      /* context terug (bv. na een gpu-reset): één keer opnieuw opbouwen op een vers canvas */
      cv.addEventListener('webglcontextrestored', function () { if (herstart++) return; var n = cv.cloneNode(false); n.classList.remove('is-aan'); cv.parentNode.replaceChild(n, cv); startGL(); });
      if (actief()) zetLus(true); else teken(0); /* gepauzeerd of buiten beeld gestart: toch één beeld */
    }
  }
})();
