/* =============================================================
   EM Launchpad — Websites ("Blauwdruk"), vernieuwd op 6/11/2026
   1. meting    : hoe snel deze pagina bij de bezoeker laadde (lokaal)
   2. blauwdruk : de vakken van een echte klantensite als lijntekening
   3. hero      : de bouwtafel (blauwdruk, inkleuren, op je gsm, live)
   4. waarom    : anatomie op een echte gsm-site (clinic3d.be)
   5. platform  : een boeking op je site komt binnen in je CRM (voorbeeld)
   6. echt werk : blauwdruk naast de live site, per klant, computer of gsm
   7. meetlijnen · 8. stuklijst en add-ons · 9. stappen · 10. slot-CTA
   Er wordt niets verstuurd of bewaard. Zonder JS of met minder
   beweging blijft alles leesbaar en staat alles in de eindstand.
   ============================================================= */
(function () {
  'use strict';

  /* ============================================================
     1. METING — zo vroeg mogelijk, zodat niets gemist wordt
     ============================================================ */
  var M = { fcp: null, lcp: null, lcpEl: null, cls: 0, clsOk: false, lcpOk: false, fcpOk: false, load: null,
            own: 0, other: 0, unknown: 0, cache: false, bf: false, bg: document.visibilityState === 'hidden', frozen: false, at: null };
  var nav = null, act = 0;
  try { nav = performance.getEntriesByType('navigation')[0] || null; act = (nav && nav.activationStart) || 0; } catch (e) {}
  function t0(t) { return Math.max(0, t - act); }
  function po(type, cb) {
    try {
      if (!('PerformanceObserver' in window)) return false;
      var sup = PerformanceObserver.supportedEntryTypes;
      if (sup && sup.indexOf(type) < 0) return false;
      new PerformanceObserver(function (l) { l.getEntries().forEach(cb); }).observe({ type: type, buffered: true });
      return true;
    } catch (e) { return false; }
  }
  M.fcpOk = po('paint', function (e) { if (e.name === 'first-contentful-paint' && !M.frozen) M.fcp = t0(e.startTime); });
  M.lcpOk = po('largest-contentful-paint', function (e) { if (M.frozen) return; M.lcp = t0(e.renderTime || e.startTime); M.lcpEl = e.element || null; });
  var sess = 0, sFirst = 0, sLast = 0;
  M.clsOk = po('layout-shift', function (e) {
    if (M.frozen || e.hadRecentInput) return;
    /* sessievensters: gat < 1 s, venster <= 5 s; het grootste venster telt */
    if (sess && e.startTime - sLast < 1000 && e.startTime - sFirst < 5000) { sess += e.value; sLast = e.startTime; }
    else { sess = e.value; sFirst = sLast = e.startTime; }
    if (sess > M.cls) M.cls = sess;
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) M.bf = true; });
  function weigh() {
    var own = 0, other = 0, unknown = 0, host = location.host;
    try {
      if (nav) { own += nav.transferSize || 0; M.cache = nav.transferSize === 0 && nav.decodedBodySize > 0; }
      performance.getEntriesByType('resource').forEach(function (r) {
        var same = false;
        try { same = new URL(r.name).host === host; } catch (e) {}
        if (same) own += r.transferSize || 0;
        else if (r.transferSize > 0) other += r.transferSize;
        else unknown++;
      });
    } catch (e) {}
    M.own = own; M.other = other; M.unknown = unknown;
  }

  var src = document.getElementById('wsData');
  if (!src) return;
  var D;
  try { D = JSON.parse(src.textContent); } catch (e) { return; }
  var U = D.ui;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia('(max-width: 760px)');
  var hasIO = 'IntersectionObserver' in window;
  var LOC = ({ nl: 'nl-BE', en: 'en-GB', fr: 'fr-BE' })[D.lang] || 'nl-BE';
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- hulpjes ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function sv(tag, at, parent) { var e = document.createElementNS(NS, tag); for (var k in at) if (at.hasOwnProperty(k)) e.setAttribute(k, at[k]); if (parent) parent.appendChild(e); return e; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function fill(s, v) { return String(s == null ? '' : s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; }); }
  function f1(n) { return Math.round(n * 10) / 10; }
  function easeIO(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function safe(fn) { try { fn(); } catch (err) { setTimeout(function () { throw err; }); } }
  function anim(el, kf, opt) { if (el && el.animate && !reduce) return el.animate(kf, opt); if (el) { var last = kf[kf.length - 1]; for (var k in last) if (k !== 'offset' && k !== 'easing') el.style[k] = last[k]; } return null; }
  function watch(el, fn, th) {
    if (!el) return;
    th = th || 0;
    if (!hasIO) { fn(true, 1); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting && e.intersectionRatio >= th * 0.98, e.intersectionRatio); }); }, { threshold: th ? [0, th] : [0] }).observe(el);
  }
  function once(el, fn, th) {
    if (!el) return;
    th = th || 0.3;
    if (!hasIO) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var need = Math.min(th, 0.9 * window.innerHeight / Math.max(1, e.boundingClientRect.height));
        if (e.isIntersecting && e.intersectionRatio >= need * 0.98) { io.disconnect(); fn(); }
      });
    }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5] });
    io.observe(el);
  }
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
      } finally { if (fns.length) raf = requestAnimationFrame(frame); else { raf = 0; last = 0; } }
    }
    return { add: function (fn) { if (fns.indexOf(fn) < 0) fns.push(fn); if (!raf) raf = requestAnimationFrame(frame); } };
  })();
  function Timer(fn, ms) { this.fn = fn; this.left = ms; this.id = 0; this.t0 = 0; this.done = false; }
  Timer.prototype.start = function () { if (this.done || this.id) return; var s = this; this.t0 = Date.now(); this.id = setTimeout(function () { s.id = 0; s.done = true; s.fn(); }, Math.max(0, this.left)); };
  Timer.prototype.pause = function () { if (!this.id) return; clearTimeout(this.id); this.id = 0; this.left -= Date.now() - this.t0; };
  Timer.prototype.kill = function () { if (this.id) clearTimeout(this.id); this.id = 0; this.done = true; };
  var NF = null, NF1 = null, NF2 = null;
  try { NF = new Intl.NumberFormat(LOC); NF1 = new Intl.NumberFormat(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); NF2 = new Intl.NumberFormat(LOC, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } catch (e) {}
  function num(n) { return NF ? NF.format(n) : String(n); }
  function sec(ms) { if (ms < 100) return D.meet.less; return (NF1 ? NF1.format(ms / 1000) : (ms / 1000).toFixed(1)) + ' s'; }
  function Roll(box, value) { this.box = box; this.set(value, true); }
  Roll.prototype.set = function (value, instant) {
    var s = num(value), box = this.box;
    if (s.length !== this.len) {
      box.textContent = ''; this.cols = [];
      for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        if (/\d/.test(ch)) {
          var w = mk('span', 'ws-roll'), st = mk('span');
          for (var d = 0; d < 10; d++) st.appendChild(mk('i', null, d));
          w.appendChild(st); box.appendChild(w); this.cols.push(st);
        } else { box.appendChild(mk('span', null, ch)); this.cols.push(null); }
      }
      this.len = s.length; void box.offsetWidth;
    }
    for (var j = 0; j < s.length; j++) {
      var c = this.cols[j]; if (!c) continue;
      c.style.transition = instant || reduce ? 'none' : 'transform .5s cubic-bezier(.2,.8,.2,1) ' + (j * 60) + 'ms';
      c.style.transform = 'translateY(' + (-(+s.charAt(j)) * 1.1) + 'em)';
    }
  };

  /* ============================================================
     2. BLAUWDRUK — zelfde tekening als body.py (bp_svg)
     ============================================================ */
  var DIM = { desk: [1440, 900], gsm: [390, 844] };
  function bpSVG(svg, boxes, mode) {
    if (!svg) return;
    var W = DIM[mode][0], H = DIM[mode][1], fs = mode === 'desk' ? 21 : 17, L = U.labels || {};
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    (boxes || []).forEach(function (b, i) {
      var x = b.x * W / 100, y = b.y * H / 100, w = b.w * W / 100, h = b.h * H / 100;
      if (w < 4 || h < 4) return;
      sv('path', { 'class': 'k-' + b.k, d: 'M' + f1(x) + ' ' + f1(y) + 'h' + f1(w) + 'v' + f1(h) + 'h' + f1(-w) + 'Z', pathLength: 1, style: '--i:' + i }, svg);
      if (b.k === 'foto') sv('path', { 'class': 'k-x', d: 'M' + f1(x) + ' ' + f1(y) + 'L' + f1(x + w) + ' ' + f1(y + h) + 'M' + f1(x + w) + ' ' + f1(y) + 'L' + f1(x) + ' ' + f1(y + h), pathLength: 1, style: '--i:' + i }, svg);
      var lab = L[b.k];
      if (lab && w > fs * 2.6 && h > fs * 1.1) {
        var t = sv('text', { x: f1(x + 8), y: f1(h > fs * 1.8 ? y + fs + 4 : y + h - 4), style: '--i:' + i }, svg);
        t.textContent = lab;
      }
    });
  }
  function imgSet(img, id, mode) {
    if (!img) return;
    var base = D.rel + 'assets/werk/websites/' + id + '-' + mode + '-';
    if (mode === 'desk') { img.srcset = base + '960.webp 960w, ' + base + '1440.webp 1440w'; img.src = base + '960.webp'; }
    else { img.srcset = base + '390.webp 390w, ' + base + '780.webp 780w'; img.src = base + '390.webp'; }
  }
  function preload(id, like) {
    if (!id) return;
    (like || []).forEach(function (el) {
      if (!el) return;
      var im = new Image();
      im.sizes = el.getAttribute('sizes') || '';
      imgSet(im, id, el.getAttribute('data-mode') || (el.getAttribute('height') === '900' ? 'desk' : 'gsm'));
    });
  }
  function siteBy(id) { for (var i = 0; i < D.sites.length; i++) if (D.sites[i].id === id) return D.sites[i]; return null; }

  /* ============================================================
     3. HERO — de bouwtafel: blauwdruk, inkleuren, gsm, live
        De eerste ronde speelt met CSS (ook zonder JS). JS gaat daarna
        langs de andere klanten, pauzeert buiten beeld en op vraag.
     ============================================================ */
  safe(function () {
    var fig = $('[data-ws-build]');
    if (!fig) return;
    var desk = $('.ws-desk .ws-ink', fig), phone = $('.ws-phone .ws-ink', fig);
    var bpD = $('.ws-desk .ws-bp', fig), bpM = $('.ws-phone .ws-bp', fig);
    var dom = $('[data-ws-dom]', fig), whos = $$('[data-ws-who]', fig), pbtn = $('[data-ws-pause]', fig), srEl = $('[data-ws-buildsr]', fig);
    var BUILD = 5200, HOLD = 4300, OUTMS = 420;
    var H = { i: 0, paused: false, off: false, hidden: document.visibilityState === 'hidden', timer: null };
    function running() { return !H.paused && !H.off && !H.hidden; }
    function sync() {
      fig.classList.toggle('is-paused', !running());
      if (H.timer) { if (running()) H.timer.start(); else H.timer.pause(); }
    }
    function sched(ms) { if (H.timer) H.timer.kill(); H.timer = new Timer(next, ms); if (running()) H.timer.start(); }
    function mark() {
      whos.forEach(function (b, k) { b.setAttribute('aria-pressed', k === H.i ? 'true' : 'false'); b.classList.remove('is-prog'); });
      var a = whos[H.i];
      if (a && !reduce && !H.paused) { void a.offsetWidth; a.style.setProperty('--dur', (BUILD + HOLD + OUTMS) + 'ms'); a.classList.add('is-prog'); }
    }
    function show(i) {
      var s = D.sites[i];
      if (!s) return;
      H.i = i;
      fig.setAttribute('data-site', s.id);
      imgSet(desk, s.id, 'desk'); desk.alt = s.alt_desk;
      imgSet(phone, s.id, 'gsm'); phone.alt = s.alt_gsm;
      bpSVG(bpD, s.desk, 'desk'); bpSVG(bpM, s.gsm, 'gsm');
      if (dom) dom.textContent = s.domein;
      if (srEl) srEl.textContent = fill(D.sr_hero, s);
      fig.classList.toggle('is-still', reduce || H.paused);
      fig.classList.remove('is-run'); void fig.offsetWidth; fig.classList.add('is-run');
      fig.classList.remove('is-out');
      mark();
      var nx = D.sites[(i + 1) % D.sites.length];
      if (nx) setTimeout(function () { preload(nx.id, [desk, phone]); }, 2400);
      if (!reduce) sched(BUILD + HOLD);
    }
    function go(i) {
      if (reduce || H.paused) { show(i); return; }
      fig.classList.add('is-out');
      setTimeout(function () { show(i); }, OUTMS);
    }
    function next() { go((H.i + 1) % D.sites.length); }
    whos.forEach(function (b, k) { b.addEventListener('click', function () { if (H.timer) H.timer.kill(); go(k); }); });
    if (pbtn) {
      if (reduce) pbtn.hidden = true;
      pbtn.addEventListener('click', function () {
        H.paused = !H.paused;
        pbtn.setAttribute('data-state', H.paused ? 'paused' : 'playing');
        pbtn.setAttribute('aria-label', H.paused ? U.play_aria : U.pause_aria);
        $('span', pbtn).textContent = H.paused ? U.play : U.pause;
        if (!H.paused) mark(); else whos.forEach(function (b) { b.classList.remove('is-prog'); });
        sync();
      });
    }
    watch(fig, function (v) { H.off = !v; sync(); }, 0.15);
    document.addEventListener('visibilitychange', function () { H.hidden = document.visibilityState === 'hidden'; sync(); });
    if (reduce) return;
    mark();
    sched(BUILD + HOLD);
    /* de volgende klant pas na de eerste ronde voorladen: zo telt hij niet mee in de eerlijke meting */
    setTimeout(function () { if (D.sites[1]) preload(D.sites[1].id, [desk, phone]); }, 6200);
  });

  /* ============================================================
     4. WAAROM — anatomie: elk punt licht het juiste stuk van een echte gsm-site op
     ============================================================ */
  safe(function () {
    var root = $('[data-ws-anat]');
    if (!root) return;
    var items = $$('.ws-an-i', root), btns = $$('.ws-an-b', root), hl = $('[data-ws-hl]', root), scr = $('.ws-an-scr', root), svg = $('[data-ws-lines]', root);
    var em = hl && $('em', hl), boxes = (D.an && D.an.gsm) || [], A = { i: 0, user: false, vis: false, t: 0 };
    function biggest(k, minY) {
      var best = null;
      boxes.forEach(function (b) { if (b.k !== k || b.y < (minY || 0)) return; if (!best || b.w * b.h > best.w * best.h + 0.5) best = b; });
      return best;
    }
    function boxFor(part) {
      if (part === 'scherm') return { x: 2, y: 1.5, w: 96, h: 97 };
      if (part === 'titel') {
        var t = biggest('titel'), x = biggest('tekst');
        if (t && x) { var x0 = Math.min(t.x, x.x), y0 = Math.min(t.y, x.y), x1 = Math.max(t.x + t.w, x.x + x.w), y1 = Math.max(t.y + t.h, x.y + x.h); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; }
        return t || x;
      }
      if (part === 'knop') return biggest('knop', 12);
      return biggest(part);
    }
    function lines() {
      if (!svg) return;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (window.innerWidth < 1000 || !hl || hl.style.display === 'none') return;
      var r0 = root.getBoundingClientRect(), b = btns[A.i].getBoundingClientRect(), h = hl.getBoundingClientRect();
      var left = items[A.i].parentNode.classList.contains('ws-an-l');
      svg.setAttribute('viewBox', '0 0 ' + f1(r0.width) + ' ' + f1(r0.height));
      var sx = left ? b.right - r0.left + 14 : b.left - r0.left - 14, sy = b.top - r0.top + b.height / 2;
      var ex = left ? h.left - r0.left - 4 : h.right - r0.left + 4, ey = h.top - r0.top + Math.min(h.height / 2, 40);
      var dx = (ex - sx) * 0.5;
      var p = sv('path', { d: 'M' + f1(sx) + ' ' + f1(sy) + 'C' + f1(sx + dx) + ' ' + f1(sy) + ' ' + f1(ex - dx) + ' ' + f1(ey) + ' ' + f1(ex) + ' ' + f1(ey), pathLength: 1 }, svg);
      sv('circle', { cx: f1(sx), cy: f1(sy), r: 3.5 }, svg);
      sv('circle', { cx: f1(ex), cy: f1(ey), r: 4.5, 'class': 'e' }, svg);
      if (!reduce) anim(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
    }
    function set(i) {
      A.i = i;
      btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      items.forEach(function (it, k) { it.classList.toggle('is-on', k === i); });
      var bx = boxFor(btns[i].getAttribute('data-part'));
      if (hl) {
        if (!bx) { hl.style.display = 'none'; } else {
          hl.style.display = '';
          var pad = 1.2;
          hl.style.left = Math.max(0, bx.x - pad) + '%'; hl.style.top = Math.max(0, bx.y - pad * 0.45) + '%';
          hl.style.width = Math.min(100, bx.w + pad * 2) + '%'; hl.style.height = Math.min(100, bx.h + pad * 0.9) + '%';
          hl.classList.toggle('is-low', bx.y > 70);
          if (em) em.textContent = (D.an.hl || [])[i] || '';
        }
      }
      root.classList.add('is-js');
      if (reduce) lines(); else setTimeout(lines, 360);
    }
    btns.forEach(function (b, k) { b.addEventListener('click', function () { A.user = true; set(k); }); });
    set(0);
    var rs = 0;
    window.addEventListener('resize', function () { cancelAnimationFrame(rs); rs = requestAnimationFrame(lines); });
    var img = $('.ws-an-img', root);
    if (img && !img.complete) img.addEventListener('load', lines);
    if (reduce) return;
    function tick() { A.t = 0; if (!A.user && A.vis) set((A.i + 1) % btns.length); }
    watch(root, function (v) { A.vis = v; if (v) lines(); }, 0.35);
    setInterval(function () { if (!document.hidden) tick(); }, 3600);
  });

  /* ============================================================
     5. ONS PLATFORM — een boeking op je site komt binnen in je CRM
     ============================================================ */
  safe(function () {
    var root = $('[data-ws-plat]');
    if (!root) return;
    var btn = $('[data-ws-bk]', root), again = $('[data-ws-again]', root), flow = $$('[data-ws-flow] li', root), sr = $('[data-ws-platsr]', root);
    var P = { busy: false, done: false, user: false, ts: [] };
    root.classList.remove('is-done'); root.classList.add('is-ready');
    function later(fn, ms) { P.ts.push(setTimeout(fn, reduce ? 0 : ms)); }
    function reset() {
      P.ts.forEach(clearTimeout); P.ts = [];
      root.classList.remove('is-press', 'is-send', 'is-in', 'is-done');
      flow.forEach(function (f) { f.classList.remove('is-on'); });
      if (again) again.hidden = true;
      if (sr) sr.textContent = '';
      P.done = false; P.busy = false;
    }
    function play() {
      if (P.busy) return;
      if (P.done) reset();
      P.busy = true;
      root.classList.add('is-press');
      later(function () { root.classList.add('is-send'); }, 260);
      later(function () { root.classList.add('is-in'); }, 980);
      flow.forEach(function (f, k) { later(function () { f.classList.add('is-on'); }, 1550 + k * 620); });
      later(function () {
        root.classList.add('is-done');
        P.busy = false; P.done = true;
        if (again) again.hidden = false;
        if (sr) sr.textContent = D.plat.sr_done;
      }, 1550 + flow.length * 620);
    }
    if (btn) btn.addEventListener('click', function () { P.user = true; if (!P.done) play(); });
    if (again) again.addEventListener('click', function () { P.user = true; reset(); setTimeout(play, reduce ? 0 : 200); });
    if (reduce) return;
    once(root, function () { setTimeout(function () { if (!P.user && !P.done && !P.busy) play(); }, 1100); }, 0.4);
  });

  /* ============================================================
     6. ECHT WERK — blauwdruk naast de live site, per klant, computer of gsm
     ============================================================ */
  safe(function () {
    var cmp = $('[data-ws-cmp]');
    if (!cmp) return;
    var view = $('[data-ws-cview]', cmp), knife = $('[data-ws-knife]', cmp);
    var bpD = $('.ws-cbp-d', cmp), bpM = $('.ws-cbp-m', cmp), imgD = $('.ws-cmp-d', cmp), imgM = $('.ws-cmp-m', cmp);
    var cdom = $('[data-ws-cdom]', cmp), toggles = $$('[data-ws-mode]', cmp);
    var list = $('[data-ws-cases]'), cases = $$('[data-ws-case]'), cbs = $$('[data-ws-caseb]'), wh = $('[data-ws-wh]');
    var C = { v: 50, user: false, i: 0 };
    if (list) list.classList.add('is-js');
    function set(v) {
      C.v = clamp(v, 0, 100);
      cmp.style.setProperty('--cut', C.v.toFixed(2));
      knife.setAttribute('aria-valuenow', String(Math.round(C.v)));
      knife.setAttribute('aria-valuetext', fill(U.slider_v, { p: Math.round(C.v) }));
    }
    function fromEvent(e) { var r = view.getBoundingClientRect(); return (e.clientX - r.left) / Math.max(1, r.width) * 100; }
    var drag = false;
    view.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      C.user = true; drag = true; cmp.classList.add('is-drag');
      try { view.setPointerCapture(e.pointerId); } catch (x) {}
      set(fromEvent(e));
    });
    view.addEventListener('pointermove', function (e) { if (drag) set(fromEvent(e)); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { view.addEventListener(n, function () { drag = false; cmp.classList.remove('is-drag'); }); });
    knife.addEventListener('keydown', function (e) {
      var k = e.key, d = 0;
      if (k === 'ArrowRight' || k === 'ArrowUp') d = 5; else if (k === 'ArrowLeft' || k === 'ArrowDown') d = -5;
      else if (k === 'PageUp') d = 20; else if (k === 'PageDown') d = -20;
      else if (k === 'Home') { C.user = true; set(0); e.preventDefault(); return; } else if (k === 'End') { C.user = true; set(100); e.preventDefault(); return; }
      if (d) { C.user = true; set(C.v + d); e.preventDefault(); }
    });
    function mode(m) {
      cmp.setAttribute('data-mode', m);
      toggles.forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-ws-mode') === m ? 'true' : 'false'); });
    }
    toggles.forEach(function (b) { b.addEventListener('click', function () { mode(b.getAttribute('data-ws-mode')); }); });
    function sweep() {
      if (reduce) return;
      var t = 0, from = C.v;
      C.user = false;
      Loop.add(function run(dt) {
        if (C.user) return false;
        t += dt * 1000;
        if (t < 900) { set(from + (88 - from) * easeIO(t / 900)); return true; }
        if (t < 2300) { set(88 + (14 - 88) * easeIO((t - 900) / 1400)); return true; }
        set(14 + (50 - 14) * easeIO(clamp((t - 2300) / 800, 0, 1)));
        return t < 3100;
      });
    }
    function pick(i, quiet) {
      var s = D.sites[i];
      if (!s) return;
      C.i = i;
      cases.forEach(function (c, k) { c.classList.toggle('is-on', k === i); });
      cbs.forEach(function (b, k) { b.setAttribute('aria-expanded', k === i ? 'true' : 'false'); });
      imgSet(imgD, s.id, 'desk'); imgD.alt = s.alt_desk;
      imgSet(imgM, s.id, 'gsm'); imgM.alt = s.alt_gsm;
      bpSVG(bpD, s.desk, 'desk'); bpSVG(bpM, s.gsm, 'gsm');
      if (cdom) cdom.textContent = s.domein;
      if (wh) wh.textContent = fill(D.h2b_t, s);
      if (!quiet) sweep();
    }
    cbs.forEach(function (b, k) { b.addEventListener('click', function () { if (k !== C.i) pick(k); }); });
    if (mobile.matches) mode('gsm');
    set(50);
    if (reduce) return;
    once(cmp, function () { if (!C.user) { set(50); sweep(); } }, 0.5);
  });

  /* ============================================================
     7. METEN — tonen wat de browser zelf zegt
     ============================================================ */
  safe(function () {
    var chip = $('[data-ws-chip]'), rulers = $('[data-ws-rulers]'), meet = $('#gemeten');
    var verdict = $('[data-ws-verdict]'), stamp = $('[data-ws-stamp]'), others = $('[data-ws-others]'), loadEl = $('[data-ws-load]'), lcpNote = $('[data-ws-lcpnote]');
    var sr = $('[data-ws-meetsr]'), micro = $('[data-ws-micro]'), reload = $('[data-ws-reload]');
    var T = D.meet, loaded = false, shown = false;
    function kb(b) { var k = b / 1024; return k >= 1024 ? (NF1 ? NF1.format(k / 1024) : (k / 1024).toFixed(1)) + ' MB' : num(Math.round(k)) + ' kB'; }
    function inMock(el) { return el && el.closest && el.closest('.ws-anat,.ws-cmp,.ws-plat-demo'); }
    function chipUpdate() {
      if (!chip) return;
      var span = $('span', chip);
      if (M.fcp != null && !M.bg) { span.textContent = fill(T.chip, { x: sec(M.fcp) }); chip.classList.add('is-done'); }
      else { span.textContent = D.hero.chip_fallback; chip.setAttribute('href', '#werk'); }
    }
    function freeze() {
      if (M.frozen) return;
      M.frozen = true; weigh();
      try { M.at = new Intl.DateTimeFormat(LOC, { hour: '2-digit', minute: '2-digit' }).format(new Date()); } catch (e) {}
    }
    function render() {
      if (shown || !rulers) return;
      shown = true;
      var vals = { fcp: M.fcp, lcp: (M.lcp != null && !inMock(M.lcpEl)) ? M.lcp : null, cls: M.clsOk ? M.cls : null, kb: M.own ? M.own / 1024 : null };
      if (M.lcp != null && inMock(M.lcpEl) && lcpNote) lcpNote.hidden = false;
      T.rows.forEach(function (r, i) {
        var row = $('[data-ws-m="' + r.k + '"]', rulers); if (!row) return;
        var v = vals[r.k];
        if (v == null) { row.classList.add('is-off'); $('[data-ws-v]', row).textContent = '–'; return; }
        var txt = r.k === 'cls' ? (NF2 ? NF2.format(v) : v.toFixed(2)) : (r.k === 'kb' ? kb(M.own) : sec(v));
        $('[data-ws-v]', row).textContent = txt;
        var p = clamp(v / r.max, 0.004, 1);
        var path = $('.ws-rv', row);
        path.style.transitionDelay = (i * 0.12) + 's';
        requestAnimationFrame(function () { path.style.strokeDashoffset = String(1 - p); });
      });
      if (others) others.textContent = (M.other || M.unknown) ? fill(T.others, { n: num(M.unknown + (M.other ? 1 : 0)) }) : '';
      if (loadEl) loadEl.textContent = M.load ? fill(T.load, { x: sec(M.load) }) : '';
      if (stamp && M.at) stamp.textContent = fill(U.measured_at, { t: M.at });
      var v;
      if (M.bg) v = T.v_bg; else if (M.bf) v = T.v_bf; else if (M.fcp == null && vals.lcp == null) v = T.v_none;
      else if (M.cache) v = T.v_cache; else if ((M.fcp || 0) > 1800 || (vals.lcp || 0) > 2500) v = T.v_slow; else v = T.v_good;
      if (verdict) verdict.textContent = v;
      if (sr && M.fcp != null) sr.textContent = fill(T.sr, { x: sec(M.fcp) });
      if (micro && M.fcp != null && !M.bg) micro.textContent = fill(D.cta.micro, { x: sec(M.fcp) });
    }
    function tryRender() { if (loaded) { freeze(); render(); } }
    function onLoad() {
      if (nav) try { var n2 = performance.getEntriesByType('navigation')[0]; M.load = n2 && n2.loadEventEnd ? t0(n2.loadEventEnd) : null; } catch (e) {}
      if (M.load == null) M.load = null;
      setTimeout(function () {
        /* meten tot kort na het laden: wat de bouwtafel daarna nog inlaadt (de volgende klant), telt niet mee */
        loaded = true; freeze(); chipUpdate();
        if (micro && M.fcp != null && !M.bg) micro.textContent = fill(D.cta.micro, { x: sec(M.fcp) });
        if (meetVisible) tryRender();
      }, 1200);
    }
    if (document.readyState === 'complete') onLoad(); else window.addEventListener('load', onLoad);
    var meetVisible = false;
    if (meet) once(meet, function () { meetVisible = true; tryRender(); }, 0.3);
    var early = function () { if (!loaded) return; freeze(); };
    ['pointerdown', 'keydown'].forEach(function (ev) { window.addEventListener(ev, early, { once: true, capture: true }); });
    window.addEventListener('pagehide', function () { freeze(); });
    if (reload) reload.addEventListener('click', function () { try { location.hash = 'gemeten'; } catch (e) {} location.reload(); });
  });

  /* ============================================================
     8. STUKLIJST EN ADD-ONS
     ============================================================ */
  safe(function () {
    var sl = $('[data-ws-sl]');
    if (!sl) return;
    var sec = sl.closest('section');
    var amt = $('[data-ws-amt]', sec), amtD = $('.ws-amt-d', amt), amtSr = $('.sr-only', amt), per = $('[data-ws-per]', sec), totSr = $('[data-ws-totsr]', sec), tbp = $('[data-ws-tbp]', sec);
    var btns = $$('.ws-addon', sec), on = {};
    var R = new Roll(amtD, D.base);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-ws-add'); on[id] = !on[id];
        b.setAttribute('aria-pressed', on[id] ? 'true' : 'false');
        var row = $('[data-ws-row="' + id + '"]', sl);
        if (row) {
          row.hidden = !on[id];
          if (on[id]) anim(row, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 450, easing: 'cubic-bezier(.6,.05,.2,1)' });
        }
        /* maandprijs; een eenmalig bedrag (data-once, bv. de AI-receptioniste) telt niet mee en staat als aparte regel eronder */
        var t = D.base, o = 0;
        btns.forEach(function (x) { if (on[x.getAttribute('data-ws-add')]) { t += +x.getAttribute('data-price'); o += +x.getAttribute('data-once') || 0; } });
        R.set(t, false); if (amtSr) amtSr.textContent = String(t);
        var any = t !== D.base;
        if (per) per.textContent = any ? U.per_sum : U.per;
        if (tbp) tbp.textContent = (D.lang === 'fr' ? t + ' €' : '€' + t) + ' / ' + U.per.replace(/^\S+\s/, '');
        $$('[data-ws-once]', sec).forEach(function (p) { p.hidden = !on[p.getAttribute('data-ws-once')]; });
        if (totSr) totSr.textContent = fill(U.total_sr, { t: t }) + (o ? ', + ' + (D.lang === 'fr' ? o + ' €' : '€' + o) + ' ' + (U.once_word || '') : '');
      });
    });
    sl.classList.add('is-js');
    $$('li', sl).forEach(function (li, i) { li.style.transitionDelay = (i * 0.06) + 's'; });
    if (reduce) sl.classList.add('is-drawn'); else once(sl, function () { sl.classList.add('is-drawn'); setTimeout(function () { $$('li', sl).forEach(function (li) { li.style.transitionDelay = ''; }); }, 1200); }, 0.2);
  });

  /* ============================================================
     9. STAPPEN · 10. SLOT-CTA
     ============================================================ */
  safe(function () {
    var ol = $('[data-ws-steps]');
    if (!ol) return;
    var steps = $$('.ws-step', ol);
    ol.classList.add('is-js');
    steps.forEach(function (s, i) {
      if (reduce) { s.classList.add('is-on'); return; }
      once(s, function () { setTimeout(function () { s.classList.add('is-on'); }, mobile.matches ? 0 : i * 180); }, 0.3);
    });
  });
  safe(function () {
    var blank = $('[data-ws-blank]'), btn = $('[data-ws-ctabtn]');
    if (!blank || !btn) return;
    if (reduce) { blank.classList.add('is-on'); return; }
    var on = function () { blank.classList.add('is-on'); };
    btn.addEventListener('pointerenter', on); btn.addEventListener('focus', on);
  });
})();
