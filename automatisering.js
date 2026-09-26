/* =============================================================
   EM Launchpad — AI-automatisering ("Als een uurwerk")
   1. geometrie : raderen die echt in elkaar grijpen (steek 11)
   2. Movement  : bouwt een uurwerk in SVG (hero + opengewerkt)
   3. hero      : kies een gebeurtenis, het uurwerk loopt, elk rad
                  dat bovenkomt is een bericht dat vanzelf vertrekt
   4. briefje   : een lijstje dat zichzelf doorstreept
   5. open het uurwerk · 6. bewijs (puntjes + vensters)
   7. prijs (kast + add-ons) · 8. gangreserve · 9. slot-CTA
   Zonder JS of met minder beweging blijft alles leesbaar.
   ============================================================= */
(function () {
  'use strict';

  var src = document.getElementById('amData');
  if (!src) return;
  var D;
  try { D = JSON.parse(src.textContent); } catch (e) { return; }
  var U = D.ui;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia('(max-width: 760px)');
  var hasIO = 'IntersectionObserver' in window;
  var LOC = ({ nl: 'nl-BE', en: 'en-GB', fr: 'fr-BE' })[D.lang] || 'nl-BE';
  var NS = 'http://www.w3.org/2000/svg';
  var PI = Math.PI, TAU = PI * 2;

  /* ---------- hulpjes ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function mk(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function sv(tag, at, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in at) if (at.hasOwnProperty(k)) e.setAttribute(k, at[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function fill(s, v) { return String(s == null ? '' : s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; }); }
  function f1(n) { return Math.round(n * 10) / 10; }
  var NF = null;
  try { NF = new Intl.NumberFormat(LOC); } catch (e) {}
  function num(n) { return NF ? NF.format(n) : String(n); }
  function easeIO(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  /* 'in beeld' = echt minstens th zichtbaar (Safari en Firefox melden al bij 1 pixel) */
  function watch(el, fn, th) {
    if (!el) return;
    th = th || 0;
    if (!hasIO) { fn(true, 1); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { fn(e.isIntersecting && e.intersectionRatio >= th * 0.98, e.intersectionRatio); });
    }, { threshold: th ? [0, th] : [0] }).observe(el);
  }
  function once(el, fn, th) {
    if (!el) return;
    th = th || 0.3;
    if (!hasIO) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        /* een element dat hoger is dan het scherm haalt th nooit: dan volstaat 90% van de schermhoogte */
        var need = Math.min(th, 0.9 * window.innerHeight / Math.max(1, e.boundingClientRect.height));
        if (e.isIntersecting && e.intersectionRatio >= need * 0.98) { io.disconnect(); fn(); }
      });
    }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5] });
    io.observe(el);
  }
  function afterLoader(fn) {
    var loader = document.getElementById('loader');
    if (!loader) { setTimeout(fn, 80); return; }
    var started = false, mo = null;
    var go = function () { if (started) return; started = true; if (mo) mo.disconnect(); setTimeout(fn, 200); };
    if ('MutationObserver' in window) {
      mo = new MutationObserver(function () { if (!document.body.contains(loader) || loader.classList.contains('done')) go(); });
      mo.observe(loader, { attributes: true, attributeFilter: ['class'] });
      mo.observe(document.body, { childList: true });
    }
    setTimeout(go, 6000);
  }
  function safe(fn) { try { fn(); } catch (err) { setTimeout(function () { throw err; }); } }

  /* één gedeelde rAF-planner: draait alleen als er iets beweegt */
  var Loop = (function () {
    var fns = [], raf = 0, last = 0;
    function frame(ts) {
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 1 / 60;
      last = ts;
      var list = fns; fns = [];
      try {
        for (var i = 0; i < list.length; i++) {
          var keep = false;
          try { keep = list[i](dt); } catch (err) { setTimeout(function () { throw err; }); }
          if (keep && fns.indexOf(list[i]) < 0) fns.push(list[i]);
        }
      } finally {
        if (fns.length) raf = requestAnimationFrame(frame); else { raf = 0; last = 0; }
      }
    }
    return { add: function (fn) { if (fns.indexOf(fn) < 0) fns.push(fn); if (!raf) raf = requestAnimationFrame(frame); } };
  })();

  /* pauzeerbare timer (resterende tijd blijft bewaard) */
  function Timer(fn, ms) { this.fn = fn; this.left = ms; this.id = 0; this.t0 = 0; this.done = false; }
  Timer.prototype.start = function () {
    if (this.done || this.id) return;
    var self = this;
    this.t0 = Date.now();
    this.id = setTimeout(function () { self.id = 0; self.done = true; self.fn(); }, Math.max(0, this.left));
  };
  Timer.prototype.pause = function () { if (!this.id) return; clearTimeout(this.id); this.id = 0; this.left -= Date.now() - this.t0; };
  Timer.prototype.kill = function () { if (this.id) clearTimeout(this.id); this.id = 0; this.done = true; };

  /* cijferrollen: elk cijfer is een strook 0-9 die naar zijn plaats schuift */
  function Roll(box, value, extra) {
    this.box = box; this.extra = extra || 0; this.set(value, true);
  }
  Roll.prototype.set = function (value, instant, ms) {
    var s = num(value), box = this.box, self = this;
    if (s.length !== (this.len || 0)) {
      box.textContent = '';
      this.cols = [];
      for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        if (/\d/.test(ch)) {
          var wrap = mk('span', 'am-roll'), strip = mk('span');
          for (var r = 0; r < 2; r++) for (var d = 0; d < 10; d++) strip.appendChild(mk('i', null, d));
          wrap.appendChild(strip); box.appendChild(wrap);
          this.cols.push({ strip: strip, pos: 0 });
        } else { box.appendChild(mk('span', null, ch)); this.cols.push(null); }
      }
      this.len = s.length;
      if (!instant && !reduce) { void box.offsetWidth; }
    }
    var k = 0;
    for (var j = 0; j < s.length; j++) {
      var c = this.cols[j];
      if (!c) continue;
      var dgt = +s.charAt(j);
      /* de laatste cijfers draaien een extra toer, zoals een teller */
      var target = dgt + ((!instant && this.extra && j >= s.length - 2) ? 10 : 0);
      c.strip.style.transition = instant || reduce ? 'none' : 'transform ' + (ms || 1400) + 'ms cubic-bezier(.2,.8,.2,1) ' + (k * 120) + 'ms';
      c.strip.style.transform = 'translateY(' + (-target * 1.15) + 'em)';
      c.pos = target; k++;
    }
    if (!instant && !reduce) {
      /* na afloop terug naar de eerste strook (zonder beweging), zodat de volgende rol weer kan */
      clearTimeout(this.tt);
      this.tt = setTimeout(function () {
        self.cols.forEach(function (c) { if (c && c.pos >= 10) { c.strip.style.transition = 'none'; c.pos -= 10; c.strip.style.transform = 'translateY(' + (-c.pos * 1.15) + 'em)'; } });
      }, (ms || 1400) + k * 120 + 60);
    }
  };

  /* ============================================================
     1. GEOMETRIE
     ============================================================ */
  var G = (function (g) {
    var p = g.p, n = g.n, r = [], C = [], a = [], d = [], th0 = [], s = [];
    for (var i = 0; i < n.length; i++) { r[i] = n[i] * p / TAU; s[i] = TAU / n[i]; }
    C[0] = [g.c0[0], g.c0[1]]; d[0] = 1; th0[0] = 0; a[0] = null;
    for (i = 1; i < n.length; i++) {
      a[i] = g.a[i] * PI / 180;
      C[i] = [C[i - 1][0] + (r[i - 1] + r[i]) * Math.cos(a[i]), C[i - 1][1] + (r[i - 1] + r[i]) * Math.sin(a[i])];
      d[i] = -d[i - 1];
      /* tandfase: een tand van het vorige rad valt in een tussenruimte van dit rad */
      var phi = (a[i] - th0[i - 1]) / s[i - 1]; phi -= Math.floor(phi);
      var delta = (phi - 0.45) * p;
      th0[i] = a[i] + PI + delta / r[i] - 0.95 * s[i];
    }
    return { p: p, n: n, r: r, C: C, a: a, d: d, th0: th0, dial: g.dial, onrust: g.onrust };
  })(D.geo);
  function angleAt(i, sArc) { return G.th0[i] + G.d[i] * sArc / G.r[i]; }

  function teethPath(i) {
    var r = G.r[i], n = G.n[i], st = TAU / n, h = 2.5, out = '';
    for (var k = 0; k < n; k++) {
      var a0 = k * st;
      var pts = [[a0, r - h], [a0 + st * 0.2, r + h], [a0 + st * 0.5, r + h], [a0 + st * 0.7, r - h]];
      for (var j = 0; j < pts.length; j++) {
        out += (k === 0 && j === 0 ? 'M' : 'L') + f1(pts[j][1] * Math.cos(pts[j][0])) + ' ' + f1(pts[j][1] * Math.sin(pts[j][0]));
      }
    }
    return out + 'Z';
  }
  function spiral(r0, r1, turns) {
    var out = '';
    for (var t = 0; t <= 1.0001; t += 0.004) {
      var an = t * TAU * turns, rr = r0 + t * (r1 - r0);
      out += (t ? 'L' : 'M') + f1(rr * Math.cos(an)) + ' ' + f1(rr * Math.sin(an));
    }
    return out;
  }
  function arcD(cx, cy, r, from, to, dir) {
    /* boog van hoek from naar to; dir +1 = met de klok (zoals de SVG-hoeken) */
    var span = dir > 0 ? to - from : from - to;
    span = ((span % TAU) + TAU) % TAU;
    var x1 = cx + r * Math.cos(to), y1 = cy + r * Math.sin(to);
    return ' A' + f1(r) + ' ' + f1(r) + ' 0 ' + (span > PI ? 1 : 0) + ' ' + (dir > 0 ? 1 : 0) + ' ' + f1(x1) + ' ' + f1(y1);
  }

  /* ============================================================
     2. MOVEMENT: een uurwerk in SVG
     ============================================================ */
  function Movement(root, o) {
    o = o || {};
    var self = this;
    this.root = root; this.slots = []; this.svgs = []; this.dotG = []; this.s = 0;
    var plate = sv('svg', { 'class': 'am-plate am-plate-js', viewBox: '0 0 1000 1000', 'aria-hidden': 'true' });
    sv('circle', { 'class': 'am-dial', cx: 500, cy: 500, r: G.dial }, plate);
    var tk = sv('g', {}, plate);
    for (var t = 0; t < 60; t++) {
      var an = t / 60 * TAU, r2 = t % 5 ? 482 : 470;
      sv('line', { 'class': 'am-tk', x1: f1(500 + 490 * Math.cos(an)), y1: f1(500 + 490 * Math.sin(an)), x2: f1(500 + r2 * Math.cos(an)), y2: f1(500 + r2 * Math.sin(an)) }, tk);
    }
    var old = $('.am-plate', root);
    if (old) root.insertBefore(plate, old.nextSibling); else root.insertBefore(plate, root.firstChild);
    /* de onrust (tikt via CSS) */
    if (o.onrust !== false) {
      var on = G.onrust, bg = sv('g', {}, plate);
      var bal = sv('g', { 'class': 'am-bal' }, bg);
      sv('circle', { cx: on[0], cy: on[1], r: on[2], 'class': 'am-o-rim', fill: 'none', stroke: 'rgba(236,232,222,.62)', 'stroke-width': 1.1 }, bal);
      sv('circle', { cx: on[0], cy: on[1], r: on[2] - 6, fill: 'none', stroke: 'rgba(236,232,222,.18)', 'stroke-width': 1 }, bal);
      /* twee armen en schroefjes op de rand, zoals een echte onrust */
      sv('line', { x1: f1(on[0] - on[2] + 6), y1: on[1], x2: f1(on[0] + on[2] - 6), y2: on[1], stroke: 'rgba(236,232,222,.4)', 'stroke-width': 1.2 }, bal);
      for (var k = 0; k < 8; k++) {
        var aa = k / 8 * TAU;
        sv('circle', { cx: f1(on[0] + on[2] * Math.cos(aa)), cy: f1(on[1] + on[2] * Math.sin(aa)), r: 3, fill: '#0c1829', stroke: 'rgba(236,232,222,.55)', 'stroke-width': 1 }, bal);
      }
      var hair = sv('path', { 'class': 'am-hair', d: spiral(5, 34, 7).replace(/([ML])(-?[\d.]+) (-?[\d.]+)/g, function (m, c, x, y) { return c + f1(+x + on[0]) + ' ' + f1(+y + on[1]); }),
        fill: 'none', stroke: 'rgba(236,232,222,.45)', 'stroke-width': 0.9 }, bg);
      sv('circle', { cx: on[0], cy: on[1], r: 7, fill: '#0c1829', stroke: 'rgba(236,232,222,.55)', 'stroke-width': 1.1 }, bg);
      this.hair = hair;
    }
    for (var i = 0; i < G.n.length; i++) {
      var R = G.r[i] + 4, c = G.C[i];
      var slot = mk('div', 'am-wslot');
      slot.style.left = ((c[0] - R) / 10) + '%'; slot.style.top = ((c[1] - R) / 10) + '%';
      slot.style.width = slot.style.height = (2 * R / 10) + '%';
      var svg = sv('svg', { 'class': 'am-wheel', viewBox: [-R, -R, 2 * R, 2 * R].map(f1).join(' ') });
      slot.appendChild(svg);
      sv('path', { 'class': 'rim', d: teethPath(i), pathLength: 1 }, svg);
      sv('circle', { 'class': 'rin', r: f1(G.r[i] - (i ? 16 : 14)), pathLength: 1 }, svg);
      if (i === 0) {
        var sp = spiral(24, G.r[i] - 20, 6.5);
        sv('path', { 'class': 'spr', d: sp, pathLength: 1 }, svg);
        this.spring = sv('path', { 'class': 'spr-lit', d: sp, pathLength: 1 }, svg);
      } else {
        for (var q = 0; q < 5; q++) {
          var a1 = q / 5 * TAU + i, r0 = 22, rr1 = G.r[i] - 16;
          sv('path', { 'class': 'spk', pathLength: 1, d: 'M' + f1(r0 * Math.cos(a1)) + ' ' + f1(r0 * Math.sin(a1)) +
            ' Q' + f1(rr1 * 0.6 * Math.cos(a1 + 0.05)) + ' ' + f1(rr1 * 0.6 * Math.sin(a1 + 0.05)) + ' ' + f1(rr1 * Math.cos(a1 + 0.5)) + ' ' + f1(rr1 * Math.sin(a1 + 0.5)) }, svg);
        }
      }
      sv('circle', { 'class': 'hub', r: i ? 20 : 22 }, svg);
      sv('circle', { 'class': 'pin', r: 4 }, svg);
      this.dotG[i] = sv('g', {}, svg);
      slot.style.setProperty('--d', (i * 0.08) + 's');
      $$('.rim,.rin,.spk,.spr', svg).forEach(function (e) { e.style.setProperty('--d', (i * 0.08) + 's'); });
      root.appendChild(slot);
      this.slots.push(slot); this.svgs.push(svg);
    }
    this.setS(0);
  }
  Movement.prototype.setS = function (s) {
    this.s = s;
    for (var i = 0; i < this.svgs.length; i++) {
      var deg = angleAt(i, s) * 180 / PI;
      this.svgs[i].style.transform = 'rotate(' + deg.toFixed(3) + 'deg)';
    }
  };
  Movement.prototype.wheelAngle = function (i) { return angleAt(i, this.s); };

  /* ============================================================
     3. HERO
     ============================================================ */
  var Hero = (function () {
    var root = $('[data-am-hero]');
    if (!root) return null;
    var podium = $('[data-am-podium]', root), stage = $('[data-am-stage]', root);
    if (!podium || !stage) return null;
    root.classList.add('is-js');
    var M = new Movement(podium, {});
    var bridge = sv('svg', { 'class': 'am-bridge', viewBox: '0 0 1000 1000', 'aria-hidden': 'true' });
    podium.insertBefore(bridge, $('.am-window', podium));
    var defs = sv('defs', {}, bridge);
    var sigPath = sv('path', { 'class': 'am-sig', d: 'M0 0', pathLength: 1 }, bridge);
    var sigHead = sv('circle', { 'class': 'am-sighead', r: 5 }, bridge);
    var gravG = sv('g', {}, bridge), fxG = sv('g', {}, bridge);
    var evIcon = sv('g', { 'class': 'am-evic' }, bridge);

    var winEl = $('[data-am-win]', root), jijEl = $('[data-am-jij]', root);
    var h1a = $('[data-am-h1]', root), chips = $$('.am-chip', root);
    var pauseB = $('[data-am-pause]', root), restartB = $('[data-am-restart]', root);
    var navEl = $('[data-am-steps]', root), read = $('[data-am-read]', root);
    var momentEl = $('[data-am-moment]', root), bodyEl = $('[data-am-body]', root), liveEl = $('[data-am-live]', root);
    var seqEl = $('[data-am-seq]', root), seqDet = $('.am-seq', root);

    /* gravures: één boog per rad, vast op de brug */
    var grav = [], chk = [];
    for (var i = 1; i < G.n.length; i++) {
      var c = G.C[i], rr = G.r[i] - 34;
      sv('path', { id: 'amGp' + i, d: 'M' + f1(c[0] - rr) + ' ' + f1(c[1]) + ' A' + f1(rr) + ' ' + f1(rr) + ' 0 0 1 ' + f1(c[0] + rr) + ' ' + f1(c[1]) }, defs);
      var txt = sv('text', { 'class': 'am-grav is-off' }, gravG);
      var tp = sv('textPath', { href: '#amGp' + i, startOffset: '50%', 'text-anchor': 'middle' }, txt);
      var nm = sv('text', { 'class': 'am-num is-off', x: f1(c[0]), y: f1(c[1] - rr + 30) }, gravG);
      var ck = sv('path', { 'class': 'am-chk', pathLength: 1, d: 'M' + f1(c[0] - 9) + ' ' + f1(c[1] - G.r[i] - 20) + ' l6 6 l12 -13' }, fxG);
      grav[i] = { t: txt, tp: tp, n: nm, arc: PI * rr };
      chk[i] = ck;
    }
    function setGrav(w, text, on) {
      var g = grav[w]; if (!g) return;
      g.tp.textContent = text;
      /* lange gravures iets kleiner, zodat ze op de boog passen */
      var need = text.length * 12.6;
      g.t.style.fontSize = need > g.arc * 0.86 ? Math.max(12, Math.floor(17 * g.arc * 0.86 / need)) + 'px' : '';
    }

    var ICONS = {
      cal: '<rect x="-17" y="-14" width="34" height="30" rx="4"/><path d="M-17 -4h34M-9 -20v8M9 -20v8M-6 7l4 4 8-8"/>',
      bill: '<path d="M-12 -20h24v40l-6-4-6 4-6-4-6 4z"/><path d="M-6 -10h12M-6 -2h12M-6 6h6"/>',
      call: '<path d="M-14 -16h7l4 9-5 3a21 21 0 0 0 9 9l3-5 9 4v7a4 4 0 0 1-4 4A30 30 0 0 1-18 -12a4 4 0 0 1 4-4"/><path d="M6 -18l10 10M16 -18l-10 10"/>',
      form: '<rect x="-15" y="-19" width="30" height="38" rx="4"/><path d="M-8 -9h16M-8 -1h16M-8 7h10"/>'
    };
    function setIcon(key) {
      var c0 = G.C[0];
      evIcon.innerHTML = '<g transform="translate(' + c0[0] + ' ' + c0[1] + ')" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[key] || '') + '</g>';
    }

    /* ---------- toestand ---------- */
    var S = { ev: null, vars: {}, list: [], choices: {}, k: -1, phase: 'idle', s: 0, s0: 0, user: false, userPaused: false, off: true, hidden: false,
              run: null, fork: null, timers: [], ticked: false, started: false, dots: [], hot: false };
    function paused() { return S.userPaused || S.off || S.hidden; }
    function later(fn, ms) { var t = new Timer(fn, ms); S.timers.push(t); if (!paused()) t.start(); return t; }
    function killTimers() { S.timers.forEach(function (t) { t.kill(); }); S.timers = []; }
    function syncPause() {
      var p = paused();
      stage.classList.toggle('is-paused', S.userPaused);
      stage.classList.toggle('is-off', S.off || S.hidden);
      S.timers = S.timers.filter(function (t) { return !t.done; });
      S.timers.forEach(function (t) { if (p) t.pause(); else t.start(); });
      if (!p && (S.run || S.fork)) Loop.add(tick);
    }

    function resolve(evKey, choices) {
      var ev = D.events[evKey], out = [], gotoOpt = null;
      for (var i = 0; i < ev.steps.length; i++) {
        var st = ev.steps[i];
        out.push(st);
        if (st.fork) {
          var ci = choices[out.length - 1]; if (ci == null) ci = st.fork.def;
          var opt = st.fork.opts[ci];
          if (opt.then) { out = out.concat(opt.then); break; }
          if (opt.goto) { gotoOpt = opt; break; }
        }
      }
      return { list: out, gotoOpt: gotoOpt };
    }
    function sAt(j) { return S.s0 + 150 * (j + 1); }

    /* ---------- dots op de raderen (één per stap) ---------- */
    function placeDots() {
      S.dots.forEach(function (d) { if (d.parentNode) d.parentNode.removeChild(d); });
      S.dots = [];
      S.list.forEach(function (st, j) {
        var w = st.w, r = G.r[w] - 9;
        /* lokale hoek zodat het puntje bovenaan staat als s = sAt(j) */
        var mu = -PI / 2 - G.th0[w] - G.d[w] * sAt(j) / G.r[w];
        var g = sv('g', {}, M.dotG[w]);
        var back = mu - G.d[w] * 0.5;
        sv('path', { 'class': 'tail', d: 'M' + f1(r * Math.cos(back)) + ' ' + f1(r * Math.sin(back)) + arcD(0, 0, r, back, mu, G.d[w]) }, g);
        sv('circle', { 'class': 'dot', r: 6, cx: f1(r * Math.cos(mu)), cy: f1(r * Math.sin(mu)) }, g);
        S.dots.push(g);
        var dl = reduce ? 0 : 40 * j;
        setTimeout(function () { $$('.dot,.tail', g).forEach(function (e) { e.classList.add('is-on'); }); }, dl);
      });
    }

    /* ---------- gravures, raderen en stappenbalk voor de huidige reeks ---------- */
    function wheelsFor() {
      var used = {};
      S.list.forEach(function (st, j) { if (used[st.w] == null) used[st.w] = j; });
      for (var w = 1; w < G.n.length; w++) {
        var j = used[w];
        M.slots[w].classList.toggle('is-dim', j == null);
        var g = grav[w];
        if (j == null) { g.t.classList.add('is-off'); g.n.classList.add('is-off'); continue; }
        var st = S.list[j], ch = S.choices[j], ci = ch == null ? null : st.fork.opts[ch];
        setGrav(w, ci && ci.grav ? ci.grav : st.grav);
        g.n.textContent = String(j + 1);
        var small = mobile.matches;
        g.t.classList.toggle('is-off', small); g.n.classList.toggle('is-off', !small);
        var done = j <= S.k && S.k >= 0 && (j < S.k || S.phase !== 'run');
        g.t.classList.toggle('is-on', done); g.n.classList.toggle('is-on', done);
        chk[w].classList.toggle('is-on', done);
      }
    }
    function buildNav() {
      navEl.textContent = '';
      S.list.forEach(function (st, j) {
        var b = mk('button', 'am-sd'); b.type = 'button';
        b.setAttribute('aria-label', fill(U['goto'], { m: st.grav.toLowerCase() }));
        b.appendChild(mk('i')); b.appendChild(mk('span', 'l', st.grav)); b.appendChild(mk('span', 'n', String(j + 1)));
        b.addEventListener('click', function () { S.user = true; jumpTo(j); });
        navEl.appendChild(b);
      });
      markNav();
    }
    function markNav() {
      $$('.am-sd', navEl).forEach(function (b, j) {
        var cur = j === S.k && S.phase !== 'end';
        if (cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        b.classList.toggle('is-done', j < S.k || (j === S.k && S.phase !== 'run') || S.phase === 'end');
      });
    }
    function buildSeq() {
      seqEl.textContent = '';
      var ev = D.events[S.ev];
      function add(st, pre) {
        var li = mk('li'); li.appendChild(mk('b', null, (pre || '') + st.grav.charAt(0) + st.grav.slice(1).toLowerCase()));
        li.appendChild(document.createTextNode(' ' + st.kop + ': ' + fill(st.msg || st.txt || '', S.vars)));
        seqEl.appendChild(li);
        return li;
      }
      ev.steps.forEach(function (st) {
        add(st);
        if (!st.fork) return;
        st.fork.opts.forEach(function (op) {
          var li = mk('li'); li.appendChild(mk('b', null, fill(st.fork.q, S.vars) + ' ' + op.label + '.'));
          if (op.res) li.appendChild(document.createTextNode(' ' + fill(op.res, S.vars)));
          seqEl.appendChild(li);
          (op.then || []).forEach(function (t) { add(t, '↳ '); });
        });
      });
    }

    /* ---------- uitleesvenster ---------- */
    function toolsList(tools) {
      var ul = mk('ul', 'am-tools');
      (tools || []).forEach(function (t) {
        var li = mk('li', 'am-tool'); li.setAttribute('data-t', t);
        var logo = { agenda: 'google-agenda.svg', stripe: 'stripe.svg', google: 'google-bedrijfsprofiel.png' }[t];
        if (logo) { var im = mk('img'); im.alt = ''; im.width = 14; im.height = 14; im.decoding = 'async'; im.src = D.rel + 'assets/logos/' + logo; li.appendChild(im); }
        else li.appendChild(toolIcon(t));
        li.appendChild(mk('span', null, U.tools[t] || t));
        ul.appendChild(li);
      });
      return ul;
    }
    var TI = {
      mail: '<rect height="14" rx="2" width="18" x="3" y="5"/><path d="m3 7 9 6 9-6"/>',
      sms: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5z"/>',
      crm: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 8h4M17 12h4M18 16h3"/>',
      inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 5h13L21 13v6H3v-6z"/>'
    };
    function toolIcon(t) {
      var s = sv('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' });
      s.innerHTML = TI[t] || '';
      return s;
    }
    function swapBody(build, momentText) {
      var apply = function () {
        bodyEl.textContent = '';
        build(bodyEl);
        if (momentText != null) momentEl.textContent = momentText;
        bodyEl.classList.remove('is-out');
        if (!reduce) { bodyEl.classList.remove('is-in'); void bodyEl.offsetWidth; bodyEl.classList.add('is-in'); }
      };
      if (reduce) { apply(); return; }
      bodyEl.classList.add('is-out');
      setTimeout(apply, 120);
    }
    function stepBody(st, el) {
      el.appendChild(mk('p', 'am-kop', st.kop));
      if (st.msg) el.appendChild(mk('p', 'am-msg', fill(st.msg, S.vars)));
      else if (st.txt) el.appendChild(mk('p', 'am-txt', fill(st.txt, S.vars)));
      if (st.extra) el.appendChild(mk('p', 'am-extra', fill(st.extra, S.vars)));
      el.appendChild(toolsList(st.tools));
    }
    function say(t) { if (!liveEl) return; liveEl.textContent = ''; setTimeout(function () { liveEl.textContent = t; }, 60); }

    /* ---------- venster linksboven ---------- */
    function roll(el, text, cls) {
      if (el.textContent === text) return;
      if (reduce) { el.textContent = text; return; }
      if (el === jijEl) {
        el.classList.add('is-swap');
        setTimeout(function () { el.textContent = text; el.classList.remove('is-swap'); }, 200);
        return;
      }
      var box = el.parentNode, old = el.cloneNode(true);
      old.removeAttribute('data-am-win'); old.classList.remove('is-in');
      box.appendChild(old);
      el.textContent = text; el.classList.remove('is-in'); void el.offsetWidth; el.classList.add('is-in');
      requestAnimationFrame(function () { old.classList.add('is-out'); });
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 360);
    }

    /* ---------- signaal: licht dat langs de tanden naar het rad reist ---------- */
    function signalD(w) {
      var C = G.C, r = G.r, from = G.a[1] - 1.2;
      var dstr = 'M' + f1(C[0][0] + r[0] * Math.cos(from)) + ' ' + f1(C[0][1] + r[0] * Math.sin(from));
      dstr += arcD(C[0][0], C[0][1], r[0], from, G.a[1], 1);
      for (var i = 1; i <= w; i++) {
        var st = G.a[i] + PI, en = i < w ? G.a[i + 1] : -PI / 2;
        /* kortste weg rond het rad */
        var dd = ((en - st) % TAU + TAU) % TAU;
        dstr += arcD(C[i][0], C[i][1], r[i], st, en, dd <= PI ? 1 : -1);
      }
      return dstr;
    }
    var sigLen = 0;
    function prepSignal(w) {
      sigPath.setAttribute('d', signalD(w));
      sigPath.classList.remove('is-fade');
      sigPath.style.strokeDashoffset = '1';
      try { sigLen = sigPath.getTotalLength(); } catch (e) { sigLen = 0; }
    }
    function drawSignal(u) {
      sigPath.style.strokeDashoffset = String(1 - u);
      if (sigLen && !mobile.matches) {
        try {
          var pt = sigPath.getPointAtLength(sigLen * u);
          sigHead.setAttribute('cx', f1(pt.x)); sigHead.setAttribute('cy', f1(pt.y));
          sigHead.style.opacity = u > 0.02 && u < 0.995 ? '1' : '0';
        } catch (e) {}
      }
    }

    /* ---------- de trein: één Loop-functie voor draaien en de aftelbalk ---------- */
    function tick(dt) {
      if (paused()) return false;
      if (S.run) {
        var R = S.run;
        R.t += dt * 1000;
        var u = clamp(R.t / R.dur, 0, 1), e = easeIO(u);
        S.s = R.from + (R.to - R.from) * e;
        M.setS(S.s);
        if (R.sig) drawSignal(e);
        if (u >= 1) { S.run = null; sigHead.style.opacity = '0'; if (R.sig) sigPath.classList.add('is-fade'); R.done(); }
      }
      if (S.fork && S.fork.auto) {
        var F = S.fork;
        if (!F.hold) F.t += dt * 1000;
        var p = clamp(F.t / F.dur, 0, 1);
        if (F.bar) F.bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
        if (p >= 1) { choose(F.def, true); }
      }
      return !!(S.run || (S.fork && S.fork.auto));
    }
    function runTo(sTarget, dur, sig, done) {
      S.run = { from: S.s, to: sTarget, dur: dur, t: 0, sig: sig, done: done };
      if (reduce) { S.s = sTarget; M.setS(S.s); S.run = null; done(); return; }
      if (!paused()) Loop.add(tick);
    }

    /* ---------- een reeks afspelen ---------- */
    function setChips(key) {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-am-ev') === key ? 'true' : 'false'); });
    }
    function setH1(text) {
      if (!h1a || h1a.textContent === text) return;
      if (reduce) { h1a.textContent = text; return; }
      h1a.classList.add('is-swap');
      setTimeout(function () { h1a.textContent = text; h1a.classList.remove('is-swap'); }, 200);
    }
    function spring(f) { if (M.spring) M.spring.style.strokeDashoffset = String(1 - clamp(f, 0, 1)); }

    function startEvent(key, o) {
      o = o || {};
      killTimers(); S.run = null; S.fork = null;
      var ev = D.events[key];
      S.ev = key; S.choices = {}; S.k = -1; S.phase = 'wind';
      S.vars = {}; var k;
      for (k in (ev.vars || {})) S.vars[k] = ev.vars[k];
      for (k in (o.vars || {})) S.vars[k] = o.vars[k];
      S.first = o.first || null;
      S.s0 = S.s;
      S.list = resolve(key, S.choices).list;
      setChips(key);
      setH1(ev.h1);
      setIcon(ev.icon);
      for (var w = 1; w < G.n.length; w++) chk[w].classList.remove('is-on');
      wheelsFor(); placeDots(); buildNav(); buildSeq();
      if (!o.keepBody) swapBody(function (el) { stepBody(S.list[0], el); }, S.list[0].grav);
      /* het veerhuis windt zich op */
      if (M.spring) {
        M.spring.style.transition = 'none'; spring(0); void M.spring.getBoundingClientRect();
        M.spring.style.transition = ''; spring(1);
      }
      if (reduce) { S.phase = 'hold'; showStep(0, true); return; }
      later(function () { goStep(0); }, o.delay != null ? o.delay : 700);
    }
    function goStep(j) {
      var st = S.list[j];
      S.k = j; S.phase = 'run'; markNav(); wheelsFor();
      var win = j === 0 && S.first ? S.first.win : st.win, jij = j === 0 && S.first ? S.first.jij : st.jij;
      roll(winEl, win); roll(jijEl, jij);
      prepSignal(st.w);
      runTo(sAt(j), 1200, true, function () { showStep(j); });
    }
    function pulse(w) {
      if (reduce) return;
      var c = G.C[w];
      var ring = sv('circle', { 'class': 'am-pulse', cx: f1(c[0]), cy: f1(c[1] - G.r[w]), r: 8 }, fxG);
      ring.style.transformBox = 'fill-box'; ring.style.transformOrigin = 'center';
      if (ring.animate) {
        var an = ring.animate([{ opacity: 0.9, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(3.2)' }], { duration: 500, easing: 'ease-out' });
        an.onfinish = function () { if (ring.parentNode) ring.parentNode.removeChild(ring); };
      } else setTimeout(function () { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 520);
    }
    function showStep(j, quiet) {
      var st = S.list[j];
      S.k = j; S.phase = 'hold';
      if (!S.ticked) { S.ticked = true; root.classList.add('is-ticked'); }
      pulse(st.w);
      wheelsFor(); markNav();
      spring(1 - (j + 1) / S.list.length);
      swapBody(function (el) { stepBody(st, el); if (st.fork && S.choices[j] == null) forkUI(j, el); else if (st.fork) resUI(j, el); }, st.grav);
      if (!quiet) say(st.sr || st.kop);
      if (reduce) { if (!st.fork || S.choices[j] != null) nextBtn(j); return; }   /* bij minder beweging stapt de bezoeker zelf verder */
      if (st.fork && S.choices[j] == null) return;           /* forkUI start de aftelbalk */
      later(function () { next(j); }, 2800);
    }
    function next(j) {
      var st = S.list[j];
      if (st.fork) {
        var opt = st.fork.opts[S.choices[j] != null ? S.choices[j] : st.fork.def];
        if (opt.goto) {
          startEvent(opt.goto, { vars: opt.vars, first: opt.first, delay: 500 });
          return;
        }
      }
      if (j + 1 < S.list.length) goStep(j + 1); else endUI();
    }
    function forkUI(j, el) {
      var st = S.list[j], f = st.fork;
      var box = mk('div', 'am-fork');
      box.appendChild(mk('p', 'am-fork-q', fill(f.q, S.vars)));
      var row = mk('div', 'am-fork-b'), bar = null;
      f.opts.forEach(function (op, i) {
        var b = mk('button', null, op.label); b.type = 'button';
        if (i === f.def && !reduce) { bar = mk('span', 'am-cd'); bar.setAttribute('aria-hidden', 'true'); b.appendChild(bar); }
        b.addEventListener('click', function () { S.user = true; choose(i, false); });
        row.appendChild(b);
      });
      box.appendChild(row);
      if (!reduce) box.appendChild(mk('p', 'am-fork-hint', U.auto));
      el.appendChild(box);
      S.phase = 'fork';
      S.fork = { j: j, def: f.def, t: 0, dur: 6000, bar: bar, auto: !reduce, hold: false };
      if (!reduce && !paused()) Loop.add(tick);
    }
    function resUI(j, el) {
      var st = S.list[j], op = st.fork.opts[S.choices[j]];
      if (op.res) el.appendChild(mk('p', 'am-res', fill(op.res, S.vars)));
      if (op.tools) el.appendChild(toolsList(op.tools));
    }
    function choose(i, auto) {
      var F = S.fork; if (!F) return;
      var j = F.j, st = S.list[j], op = st.fork.opts[i];
      S.fork = null;
      S.choices[j] = i;
      var keepFocus = read.contains(document.activeElement);
      /* de rest van de reeks kan veranderen */
      if (op.then) {
        S.list = resolve(S.ev, S.choices).list;
        S.dots.slice(j + 1).forEach(function (d) { if (d.parentNode) d.parentNode.removeChild(d); });
        S.dots = S.dots.slice(0, j + 1);
        S.list.slice(j + 1).forEach(function (st2, jj) {
          var idx = j + 1 + jj, w = st2.w, r = G.r[w] - 9;
          var mu = -PI / 2 - G.th0[w] - G.d[w] * sAt(idx) / G.r[w];
          var g = sv('g', {}, M.dotG[w]);
          var back = mu - G.d[w] * 0.5;
          sv('path', { 'class': 'tail is-on', d: 'M' + f1(r * Math.cos(back)) + ' ' + f1(r * Math.sin(back)) + arcD(0, 0, r, back, mu, G.d[w]) }, g);
          sv('circle', { 'class': 'dot is-on', r: 6, cx: f1(r * Math.cos(mu)), cy: f1(r * Math.sin(mu)) }, g);
          S.dots.push(g);
        });
        buildNav();
      }
      wheelsFor();
      var body = bodyEl;
      var fk = $('.am-fork', body); if (fk) fk.parentNode.removeChild(fk);
      if (op.res) body.appendChild(mk('p', 'am-res', fill(op.res, S.vars)));
      if (op.tools) body.appendChild(toolsList(op.tools));
      say(fill(U.choice, { c: op.label }) + (op.res ? ' ' + fill(op.res, S.vars) : ''));
      if (keepFocus) { read.setAttribute('tabindex', '-1'); read.focus({ preventScroll: true }); }
      if (reduce) { nextBtn(j); return; }
      later(function () { next(j); }, op.goto ? 1600 : 2200);
    }
    function nextBtn(j) {
      var row = mk('div', 'am-end-b'), last = j + 1 >= S.list.length && !(S.list[j].fork && S.list[j].fork.opts[S.choices[j] != null ? S.choices[j] : S.list[j].fork.def].goto);
      var b = mk('button', null, last ? U.finish : U.next); b.type = 'button';
      b.addEventListener('click', function () { S.user = true; next(j); });
      row.appendChild(b);
      setTimeout(function () { bodyEl.appendChild(row); }, reduce ? 0 : 130);
    }
    function endUI() {
      S.phase = 'end'; S.k = S.list.length - 1;
      markNav(); wheelsFor(); spring(0);
      var ev = D.events[S.ev], e = ev.end;
      swapBody(function (el) {
        el.appendChild(mk('p', 'am-kop', e.txt));
        if (e.note) el.appendChild(mk('p', 'am-extra', e.note));
        if (e.link) {
          var a = mk('a', 'am-link', e.link.label + ' →'); a.href = D.rel + e.link.href; el.appendChild(a);
        }
        var row = mk('div', 'am-end-b');
        var b1 = mk('button', null, U.again); b1.type = 'button';
        b1.addEventListener('click', function () { S.user = true; startEvent(S.ev); });
        var b2 = mk('button', null, U.other); b2.type = 'button';
        b2.addEventListener('click', function () {
          S.user = true;
          var i = D.order.indexOf(S.ev), nx = chips[(i + 1) % chips.length] || chips[0];
          nx.focus();
        });
        row.appendChild(b1); row.appendChild(b2); el.appendChild(row);
      }, U.done_sr.replace(/\.$/, ''));
      say(e.txt);
    }
    function jumpTo(j) {
      if (j < 0 || j >= S.list.length) return;
      killTimers(); S.run = null; S.fork = null;
      /* keuzes na deze stap vervallen */
      Object.keys(S.choices).forEach(function (k) { if (+k >= j) delete S.choices[k]; });
      S.list = resolve(S.ev, S.choices).list;
      placeDots(); buildNav();
      var st = S.list[j];
      S.k = j; S.phase = 'run'; markNav(); wheelsFor();
      roll(winEl, j === 0 && S.first ? S.first.win : st.win); roll(jijEl, j === 0 && S.first ? S.first.jij : st.jij);
      prepSignal(st.w);
      runTo(sAt(j), 450, true, function () { showStep(j); });
    }

    /* ---------- bediening ---------- */
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        S.user = true;
        if (S.userPaused) { S.userPaused = false; setPauseBtn(); syncPause(); }
        startEvent(c.getAttribute('data-am-ev'));
        /* op gsm: toon het podium als het amper in beeld is */
        var r = podium.getBoundingClientRect(), vis = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
        if (vis < r.height * 0.6 && stage.scrollIntoView) stage.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    function setPauseBtn() {
      pauseB.setAttribute('data-state', S.userPaused ? 'paused' : 'playing');
      pauseB.setAttribute('aria-label', S.userPaused ? U.play : U.pause);
    }
    pauseB.addEventListener('click', function () {
      S.user = true;
      S.userPaused = !S.userPaused; setPauseBtn(); syncPause();
    });
    restartB.addEventListener('click', function () {
      S.user = true;
      if (S.userPaused) { S.userPaused = false; setPauseBtn(); syncPause(); }
      startEvent(S.ev || D.order[0]);
    });
    /* de aftelbalk van de wissel bevriest zolang je er met muis of focus bent */
    function holdFork(on) { if (S.fork) S.fork.hold = on; }
    read.addEventListener('pointerenter', function () { holdFork(true); });
    read.addEventListener('pointerleave', function () { holdFork(read.contains(document.activeElement)); });
    read.addEventListener('focusin', function () { holdFork(true); });
    read.addEventListener('focusout', function () { setTimeout(function () { holdFork(read.contains(document.activeElement) || read.matches(':hover')); }, 0); });
    mobile.addEventListener && mobile.addEventListener('change', function () { wheelsFor(); });

    watch(stage, function (vis) { S.off = !vis; syncPause(); }, 0.15);
    document.addEventListener('visibilitychange', function () { S.hidden = document.hidden; syncPause(); });
    window.addEventListener('pagehide', function () { S.hidden = true; syncPause(); });
    window.addEventListener('pageshow', function () { S.hidden = document.hidden; syncPause(); });

    /* ---------- lichtbolletje van de chip naar het veerhuis ---------- */
    function ball(chip) {
      if (reduce || mobile.matches || !chip || !document.body.animate) return;
      var a = chip.getBoundingClientRect(), p = podium.getBoundingClientRect();
      if (a.bottom < 0 || a.top > innerHeight || p.bottom < 0 || p.top > innerHeight) return;
      var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
      var x1 = p.left + p.width * G.C[0][0] / 1000, y1 = p.top + p.height * G.C[0][1] / 1000;
      var b = mk('div', 'am-ball'); b.setAttribute('aria-hidden', 'true'); document.body.appendChild(b);
      var an = b.animate([
        { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.6)', opacity: 0 },
        { transform: 'translate(' + ((x0 + x1) / 2) + 'px,' + (Math.min(y0, y1) - 60) + 'px) scale(1)', opacity: 1, offset: 0.5 },
        { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(.8)', opacity: 0 }
      ], { duration: 600, easing: 'cubic-bezier(.3,.6,.3,1)' });
      an.onfinish = function () { if (b.parentNode) b.parentNode.removeChild(b); };
    }

    /* ---------- begin ---------- */
    S.ev = D.order[0];
    S.list = resolve(S.ev, {}).list;
    S.vars = {}; for (var vk in (D.events[S.ev].vars || {})) S.vars[vk] = D.events[S.ev].vars[vk];
    setIcon(D.events[S.ev].icon);
    wheelsFor(); buildNav();
    if (reduce) {
      root.classList.add('is-live', 'is-ticked');
      S.off = false;
      startEvent(S.ev, { keepBody: true });
      if (seqDet) seqDet.open = true;
      return { M: M };
    }
    podium.classList.add('is-pre');
    afterLoader(function () {
      root.classList.add('is-live');
      once(stage, function () {
        podium.classList.remove('is-pre');
        podium.classList.add('is-drawing');
        setTimeout(function () {
          podium.classList.remove('is-drawing');
          stage.classList.add('is-ticking');
        }, 1200 + 5 * 80 + 100);
        setTimeout(function () {
          if (S.user) return;
          ball(chips[0]);
          startEvent(S.ev, { keepBody: true, delay: 600 });
        }, 1800);
      }, 0.35);
    });
    return { M: M };
  })();

  /* ============================================================
     4. HET BRIEFJE: een lijstje dat zichzelf doorstreept
     ============================================================ */
  safe(function () {
    var root = $('[data-am-lijst]');
    if (!root) return;
    var sec = root.closest('section') || root;
    sec.classList.add('is-js');
    var note = $('[data-am-note]', root), ul = $('[data-am-tasks]', root), countEl = $('[data-am-count]', root), restEl = $('[data-am-rest]', root);
    var tabs = $$('.am-tab', sec), photos = $$('.am-ph', root), againB = $('[data-am-again]', sec);
    var cur = 0, timers = [], seedBase = 1;
    function T(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearT() { timers.forEach(clearTimeout); timers = []; }
    function wrapRest() { var t = restEl.textContent; restEl.textContent = ''; restEl.appendChild(mk('span', null, t)); }
    wrapRest();
    function lcg(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
    /* per tekstregel één handgetrokken streep, gemeten met een Range */
    function build(li, i) {
      var old = $('.am-ink', li); if (old) li.removeChild(old);
      var task = $('.am-task', li);
      var lr = li.getBoundingClientRect(), rg = document.createRange();
      rg.selectNodeContents(task);
      var rects = Array.prototype.slice.call(rg.getClientRects()).filter(function (r) { return r.width > 2; });
      var svg = sv('svg', { 'class': 'am-ink', 'aria-hidden': 'true', width: f1(lr.width), height: f1(lr.height) });
      var rnd = lcg(seedBase * 97 + i * 13 + cur * 7);
      var total = 0, paths = [];
      rects.forEach(function (r) {
        var x0 = r.left - lr.left - 3, x1 = r.right - lr.left + 4, y = r.top - lr.top + r.height * 0.56, w = x1 - x0;
        var j1 = (rnd() - 0.5) * 2, j2 = (rnd() - 0.5) * 2, j3 = (rnd() - 0.5) * 2;
        var p = sv('path', { d: 'M' + f1(x0) + ' ' + f1(y + j1) + ' C' + f1(x0 + 0.3 * w) + ' ' + f1(y - 1.2 + j2) + ' ' + f1(x0 + 0.62 * w) + ' ' + f1(y + 1.4 + j3) + ' ' + f1(x1) + ' ' + f1(y - 1 + j1), pathLength: 1 }, svg);
        paths.push({ el: p, w: w }); total += w;
      });
      li.appendChild(svg);
      li._ink = { paths: paths, total: total };
      if (li.classList.contains('is-struck')) paths.forEach(function (p) { p.el.style.strokeDashoffset = '0'; });
    }
    function buildAll() { $$('li', ul).forEach(build); }
    function strike(li, ms) {
      var ink = li._ink; if (!ink) return;
      var t = 0;
      ink.paths.forEach(function (p) {
        var d = ms * (p.w / Math.max(1, ink.total));
        if (p.el.animate && !reduce) {
          p.el.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: d, delay: t, easing: 'cubic-bezier(.6,.1,.3,1)', fill: 'forwards' });
        }
        p.el.style.strokeDashoffset = '0';
        t += d;
      });
    }
    function unstrike(li) {
      var ink = li._ink; if (!ink) return;
      ink.paths.forEach(function (p) {
        if (p.el.getAnimations) p.el.getAnimations().forEach(function (a) { a.cancel(); });
        p.el.style.strokeDashoffset = '1';
      });
    }
    function setCount(n, anim) {
      if (!countEl) return;
      if (!anim || reduce) { countEl.textContent = String(n); return; }
      countEl.classList.add('is-tick');
      setTimeout(function () { countEl.textContent = String(n); countEl.classList.remove('is-tick'); }, 180);
    }
    function reset() {
      clearT();
      $$('li', ul).forEach(function (li) { li.classList.remove('is-struck'); unstrike(li); });
      restEl.classList.remove('is-on', 'is-drawn');
      setCount($$('li', ul).length);
    }
    function finalState() {
      clearT();
      $$('li', ul).forEach(function (li) { li.classList.add('is-struck'); if (li._ink) li._ink.paths.forEach(function (p) { p.el.style.strokeDashoffset = '0'; }); });
      restEl.classList.add('is-on', 'is-drawn'); setCount(0);
    }
    function play() {
      if (reduce) { finalState(); return; }
      reset();
      var lis = $$('li', ul), n = lis.length;
      lis.forEach(function (li, i) {
        T(function () {
          strike(li, 450);
          T(function () { li.classList.add('is-struck'); setCount(n - i - 1, true); }, 300);
        }, 300 + 700 * i);
      });
      T(function () { restEl.classList.add('is-on'); }, 300 + 700 * n + 100);
      T(function () { restEl.classList.add('is-drawn'); }, 300 + 700 * n + 450);
    }
    function loadPhoto(i) {
      var im = photos[i]; if (!im || !im.getAttribute('data-src')) return;
      im.srcset = im.getAttribute('data-srcset'); im.src = im.getAttribute('data-src');
      im.removeAttribute('data-src'); im.removeAttribute('data-srcset');
    }
    function setTab(i) {
      if (i === cur) { play(); return; }
      cur = i; seedBase++;
      tabs.forEach(function (t, k) { t.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      loadPhoto(i);
      photos.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
      clearT();
      var tr = D.trades[i];
      var swap = function () {
        ul.textContent = '';
        tr.tasks.forEach(function (t) {
          var li = mk('li');
          li.appendChild(mk('span', 'am-task', t.t));
          li.appendChild(mk('span', 'sr-only', ': '));
          li.appendChild(mk('span', 'am-how', t.how));
          ul.appendChild(li);
        });
        restEl.textContent = tr.rest; wrapRest();
        buildAll(); reset();
        note.classList.remove('is-swap');
        play();
      };
      if (reduce) { swap(); return; }
      note.classList.add('is-swap');
      setTimeout(swap, 200);
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { setTab(k); });
      t.addEventListener('pointerenter', function () { loadPhoto(k); });
      t.addEventListener('focus', function () { loadPhoto(k); });
    });
    if (againB) againB.addEventListener('click', function () {
      if (reduce) { finalState(); return; }
      var lis = $$('li', ul).reverse();
      lis.forEach(function (li, i) { setTimeout(function () { unstrike(li); li.classList.remove('is-struck'); }, i * 40); });
      restEl.classList.remove('is-on', 'is-drawn');
      clearT();
      setTimeout(play, 250 + lis.length * 40);
    });
    var fontsReady = (document.fonts && document.fonts.load) ? Promise.race([
      document.fonts.load('600 23px Caveat'), new Promise(function (r) { setTimeout(r, 1500); })]) : Promise.resolve();
    fontsReady.then(function () {
      buildAll();
      setCount(0);
      if (reduce) finalState(); else { reset(); once(note, play, 0.45); }
      /* opnieuw meten bij een andere breedte of een laat lettertype */
      var rt = 0;
      var re = function () { clearTimeout(rt); rt = setTimeout(buildAll, 120); };
      if ('ResizeObserver' in window) new ResizeObserver(re).observe(note); else window.addEventListener('resize', re);
      if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', re);
      if ('requestIdleCallback' in window) once(sec, function () { requestIdleCallback(function () { loadPhoto(1); loadPhoto(2); }); }, 0.2);
    });
  });

  /* ============================================================
     5. OPEN HET UURWERK
     ============================================================ */
  safe(function () {
    var root = $('[data-am-explode]');
    if (!root) return;
    var sec = root.closest('section');
    var M = new Movement(root, { onrust: false });
    M.setS(0);
    var base = [];
    M.slots.forEach(function (slot, i) {
      var c = G.C[i], R = G.r[i] + 4;
      /* radiale vector vanaf het midden, in procent van het eigen slot */
      var vx = (c[0] - 500) * 0.16, vy = (c[1] - 540) * 0.16;
      slot.style.setProperty('--dx', (vx / (2 * R) * 100).toFixed(2) + '%');
      slot.style.setProperty('--dy', (vy / (2 * R) * 100).toFixed(2) + '%');
      slot.style.setProperty('--sd', (i * 0.06) + 's');
      var b = mk('span', 'am-bdg', String(i + 1)); b.setAttribute('aria-hidden', 'true');
      slot.appendChild(b);
      base[i] = angleAt(i, 0) * 180 / PI;
    });
    var parts = $$('.am-part', sec), pinned = -1;
    function hot(i) {
      M.slots.forEach(function (slot, k) {
        var on = k === i;
        slot.classList.toggle('is-hot', on);
        M.svgs[k].style.transform = 'rotate(' + (base[k] + (on && !reduce ? 90 * G.d[k] : 0)).toFixed(2) + 'deg)';
      });
      root.classList.toggle('has-hot', i >= 0);
      parts.forEach(function (p) { p.setAttribute('aria-pressed', +p.getAttribute('data-am-w') === i ? 'true' : 'false'); });
    }
    parts.forEach(function (p) {
      var w = +p.getAttribute('data-am-w');
      p.addEventListener('pointerenter', function () { if (pinned < 0) hot(w); });
      p.addEventListener('pointerleave', function () { if (pinned < 0) hot(-1); });
      p.addEventListener('focus', function () { if (pinned < 0) hot(w); });
      p.addEventListener('blur', function () { if (pinned < 0) hot(-1); });
      p.addEventListener('click', function () { pinned = pinned === w ? -1 : w; hot(pinned); });
    });
    M.svgs.forEach(function (s) { s.style.transition = 'transform .7s cubic-bezier(.65,0,.35,1)'; });
    if (reduce) { root.classList.add('is-open'); return; }
    once(root, function () { root.classList.add('is-open'); }, 0.35);
    var line = $('[data-am-onrust]', sec);
    if (line) once(line, function () { line.classList.add('is-tick'); setTimeout(function () { line.classList.remove('is-tick'); }, 5000); }, 0.6);
  });

  /* ============================================================
     6. BEWIJS: 3.250 puntjes, één per e-mail
     ============================================================ */
  safe(function () {
    var viz = $('[data-am-proof]');
    if (!viz) return;
    var canvas = $('[data-am-dots]', viz);
    viz.classList.add('is-js');
    var ctx = canvas && canvas.getContext && canvas.getContext('2d');
    var L = {}; D.legend.forEach(function (x) { L[x.k] = x.n; });
    var N = L.sent;
    function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function shuffle(n, rnd) { var a = []; for (var i = 0; i < n; i++) a.push(i); for (i = n - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    var rnd = mulberry(N);
    var order = shuffle(N, rnd), cat = new Uint8Array(N), openRank = new Int32Array(N).fill(-1);
    /* 0 verstuurd · 1 geopend · 2 geklikt · 3 antwoord · 4 uitgeschreven (disjunct binnen de geopende) */
    for (var i = 0; i < L.opened; i++) { cat[order[i]] = 1; openRank[order[i]] = i; }
    var o2 = shuffle(L.opened, rnd), c = 0;
    [[2, L.clicked], [3, L.replies], [4, L.unsub]].forEach(function (g) { for (var k = 0; k < g[1]; k++) cat[order[o2[c++]]] = g[0]; });
    var groupOf = { sent: [0, 1, 2, 3, 4], opened: [1, 2, 3, 4], clicked: [2], replies: [3], unsub: [4] };
    var COL = ['rgba(243,246,250,A)', 'rgba(75,141,240,A)', 'rgba(63,178,122,A)', null, null];
    var W = 0, H = 0, cols = 65, pitch = 8, dpr = 1;
    var st = { wave: reduce ? 1 : 0, rip: reduce ? 1 : 0, sel: reduce ? 'opened' : null, selT: 1, prevSel: null };
    function size() {
      var w = canvas.parentNode.getBoundingClientRect().width;
      if (!w) return;
      cols = w >= 520 ? 65 : 50;
      pitch = w / cols;
      var rows = Math.ceil(N / cols);
      W = w; H = rows * pitch;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.height = H + 'px';
      draw();
    }
    function inSel(k, sel) { return !sel || groupOf[sel].indexOf(k) >= 0; }
    function draw() {
      if (!ctx || !W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var rows = Math.ceil(N / cols), rad = pitch * 0.28;
      /* per groep en per alfastap één pad: weinig tekenwerk */
      var buckets = {};
      for (var idx = 0; idx < N; idx++) {
        var col = idx % cols, row = (idx / cols) | 0;
        var appear = clamp((st.wave * 1600 - ((col + row) / (cols + rows)) * 1300) / 300, 0, 1);
        if (appear <= 0) continue;
        var k = cat[idx];
        /* tijdens de rimpel worden de geopende één voor één blauw */
        var eff = k;
        if (k >= 1 && openRank[idx] >= 0 && openRank[idx] / L.opened > st.rip) eff = 0;
        if (k >= 1 && openRank[idx] < 0) eff = k;
        var a = appear;
        if (st.sel) {
          var on = inSel(eff, st.sel), was = inSel(eff, st.prevSel);
          var fa = on ? 1 : 0.16, fb = was ? 1 : 0.16;
          a *= fb + (fa - fb) * st.selT;
        }
        var base = eff === 0 ? 0.5 : 1;
        var q = Math.round(a * base * 10) / 10;
        if (q <= 0) continue;
        var key = eff + '|' + q;
        (buckets[key] || (buckets[key] = [])).push(idx);
      }
      Object.keys(buckets).forEach(function (key) {
        var parts = key.split('|'), k = +parts[0], a = +parts[1];
        ctx.beginPath();
        buckets[key].forEach(function (idx) {
          var x = (idx % cols + 0.5) * pitch, y = (((idx / cols) | 0) + 0.5) * pitch;
          ctx.moveTo(x + rad, y); ctx.arc(x, y, rad, 0, TAU);
        });
        if (k === 3) { ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.lineWidth = Math.max(1, rad * 0.7); ctx.stroke(); }
        else if (k === 4) { ctx.strokeStyle = 'rgba(174,188,203,' + a + ')'; ctx.lineWidth = 1; ctx.stroke(); }
        else { ctx.fillStyle = COL[k].replace('A', a); ctx.fill(); }
      });
    }
    var legend = $$('.am-lg', viz);
    function nums(el, to, ms) {
      var t0 = 0;
      Loop.add(function f(dt) {
        t0 += dt * 1000;
        var u = clamp(t0 / ms, 0, 1);
        el.textContent = num(Math.round(to * easeOut(u)));
        return u < 1;
      });
    }
    function select(k) {
      legend.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-am-lg') === k ? 'true' : 'false'); });
      if (reduce) { st.prevSel = k; st.sel = k; st.selT = 1; draw(); return; }
      st.prevSel = st.sel; st.sel = k; st.selT = 0;
      var t = 0;
      Loop.add(function f(dt) { t += dt * 1000; st.selT = clamp(t / 250, 0, 1); draw(); return st.selT < 1; });
    }
    legend.forEach(function (b) { b.addEventListener('click', function () { select(b.getAttribute('data-am-lg')); }); });
    if ('ResizeObserver' in window) new ResizeObserver(function () { size(); }).observe(canvas.parentNode);
    else window.addEventListener('resize', size);
    size();

    /* vensters: cijferstroken */
    var rolls = $$('[data-am-roll]', viz).map(function (el) {
      var n = +el.getAttribute('data-am-roll'), box = $('.am-wdig', el);
      return { el: el, n: n, r: n ? new Roll(box, reduce ? n : 0, 1) : null, box: el.closest('.am-wbox') };
    });
    function playWins() {
      rolls.forEach(function (x) { if (x.r) x.r.set(x.n, false, 1400); });
      setTimeout(function () { rolls.forEach(function (x) { if (!x.r) x.box.classList.add('is-lined'); }); }, reduce ? 0 : 1800);
    }
    if (reduce) {
      legend.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-am-lg') === 'opened' ? 'true' : 'false'); });
      playWins(); draw();
      return;
    }
    var numEls = {}; legend.forEach(function (b) { numEls[b.getAttribute('data-am-lg')] = $('b', b); });
    Object.keys(numEls).forEach(function (k) { if (numEls[k]) numEls[k].textContent = '0'; });
    once(viz, function () {
      var t = 0;
      nums(numEls.sent, L.sent, 1600);
      Loop.add(function f(dt) {
        t += dt * 1000;
        st.wave = clamp(t / 1600, 0, 1);
        if (t > 2200) st.rip = clamp((t - 2200) / 1200, 0, 1);
        draw();
        if (t >= 2200 && !f.ripStarted) { f.ripStarted = true; nums(numEls.opened, L.opened, 1200); }
        if (t >= 3400 && !f.rest) {
          f.rest = true;
          ['clicked', 'replies', 'unsub'].forEach(function (k) { if (numEls[k]) nums(numEls[k], L[k], 600); });
          select('opened');
        }
        return t < 3400;
      });
      setTimeout(playWins, 400);
    }, 0.4);
  });

  /* ============================================================
     7. PRIJS: de kast en de add-ons
     ============================================================ */
  safe(function () {
    var kast = $('[data-am-kast]');
    if (!kast) return;
    var sec = kast.closest('section');
    var amt = $('[data-am-amt]', kast), amtD = $('.am-amt-d', amt), amtSr = $('.sr-only', amt), per = $('[data-am-per]', kast);
    var total = $('[data-am-total]', sec), checks = $('[data-am-checks]', sec);
    var R = new Roll(amtD, D.base, 0);
    var btns = $$('.am-addon', sec), on = {};
    function update() {
      var t = D.base, any = false;
      btns.forEach(function (b) { if (on[b.getAttribute('data-am-add')]) { t += +b.getAttribute('data-price'); any = true; } });
      R.set(t, false, 500);
      amtSr.textContent = String(t);
      per.textContent = any ? U.per_sum : U.per;
      if (total) total.textContent = fill(U.total_sr, { t: t });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-am-add');
        on[id] = !on[id];
        b.setAttribute('aria-pressed', on[id] ? 'true' : 'false');
        var ring = $('[data-am-ring="' + id + '"]', kast);
        if (ring) ring.classList.toggle('is-on', !!on[id]);
        update();
      });
    });
    watch(kast, function (v) { kast.classList.toggle('is-vis', v && !reduce); }, 0.1);
    if (checks) {
      checks.classList.add('is-js');
      $$('li', checks).forEach(function (li, i) { var p = $('path', li); if (p) p.style.transitionDelay = (i * 70) + 'ms'; });
      if (reduce) checks.classList.add('is-on'); else once(checks, function () { checks.classList.add('is-on'); }, 0.3);
    }
  });

  /* ============================================================
     8. GANGRESERVE: de wijzer loopt van gesprek tot live
     ============================================================ */
  safe(function () {
    var gauge = $('[data-am-gauge]');
    if (!gauge) return;
    var sec = gauge.closest('section');
    var needle = $('[data-am-needle]', gauge), gps = $$('.am-gpos', gauge), steps = $$('.am-step', sec);
    var POS = D.stapPos, timers = [], ran = false;
    function point(deg, ms) {
      needle.style.transitionDuration = reduce ? '0ms' : (ms || 900) + 'ms';
      needle.style.transform = 'rotate(' + (deg - 270) + 'deg)';
    }
    function mark(i, done) {
      gps.forEach(function (g, k) { g.classList.toggle('is-on', k === i); g.classList.toggle('is-done', k < i || (done && k <= i)); });
      steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); s.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    }
    function T(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function run() {
      ran = true;
      var t = 0;
      POS.forEach(function (deg, i) {
        T(function () { point(deg, i ? 900 : 600); }, t);
        t += i ? 900 : 600;
        T(function () { mark(i); if (i === POS.length - 1) gauge.classList.add('is-live'); }, t);
        t += i ? 500 : 700;
      });
    }
    steps.forEach(function (s, i) {
      var go = function () { if (!ran) return; timers.forEach(clearTimeout); timers = []; point(POS[i], 500); mark(i); };
      s.addEventListener('pointerenter', go);
      s.addEventListener('focus', go);
      s.addEventListener('click', go);
    });
    if (reduce) { ran = true; point(POS[POS.length - 1]); mark(POS.length - 1); gauge.classList.add('is-live'); return; }
    once(gauge, run, 0.4);
  });

  /* ============================================================
     9. SLOT-CTA: de kleine onrust
     ============================================================ */
  safe(function () {
    var bal = $('[data-am-ctabal]');
    if (!bal || reduce) return;
    once(bal, function () { bal.classList.add('is-tick'); setTimeout(function () { bal.classList.remove('is-tick'); }, 5000); }, 0.6);
    var btn = $('[data-am-ctabtn]');
    var nudge = function () { if (bal.classList.contains('is-tick')) return; bal.classList.remove('is-nudge'); void bal.offsetWidth; bal.classList.add('is-nudge'); };
    if (btn) { btn.addEventListener('pointerenter', nudge); btn.addEventListener('focus', nudge); }
  });
})();
