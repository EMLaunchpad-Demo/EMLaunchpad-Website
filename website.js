/* =============================================================
   EM Launchpad — Websites ("Blauwdruk")
   1. meting   : hoe snel deze pagina bij de bezoeker laadde (lokaal)
   2. Site     : de voorbeeldsite per vak (kapper, kinesist, ...)
   3. hero     : het tekenblad (tekenen, inkleuren, op je gsm, 's avonds)
   4. lenzen   : wat een site voor je doet
   5. doorsnede: blauwdruk en echte site van amakhosi.be
   6. meetlijnen · 7. stuklijst en add-ons · 8. stappen · 9. slot-CTA
   Er wordt niets verstuurd of bewaard. Zonder JS of met minder
   beweging blijft alles leesbaar.
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

  /* GHL-chat pas na het laden: dan meet de pagina zichzelf eerlijk */
  window.addEventListener('load', function () {
    var go = function () {
      if (document.querySelector('script[data-widget-id="685bcf1cc6f0443168b1c35c"]')) return;
      var s = document.createElement('script');
      s.src = 'https://widgets.leadconnectorhq.com/loader.js';
      s.setAttribute('data-resources-url', 'https://widgets.leadconnectorhq.com/chat-widget/loader.js');
      s.setAttribute('data-widget-id', '685bcf1cc6f0443168b1c35c');
      document.body.appendChild(s);
    };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2500 }); else setTimeout(go, 1500);
  });

  /* ============================================================
     2. SITE — alle voorbeeldsites volgen één gedeelde keuze
     ============================================================ */
  var S = { vak: 0, naam: '' };
  var sites = $$('[data-ws-site]');
  var subs = [];
  function vak() { return D.vak[S.vak]; }
  function naam() { return S.naam || vak().naam; }
  function slug(n) {
    var s = String(n).toLowerCase();
    try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    s = s.replace(/[^a-z0-9]/g, '').slice(0, 24);
    return s ? s + '.be' : vak().domein;
  }
  function photoUrl(id, w) { return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&q=70&w=' + (w || 600); }
  function applySite(el, onlyText) {
    var v = vak(), p = v.pal;
    var set = function (f, t) { $$('[data-f="' + f + '"]', el).forEach(function (x) { x.textContent = t; }); };
    set('naam', naam()); set('titel', v.titel); set('sub', v.sub); set('cta', v.cta); set('uren', v.uren); set('review', v.review); set('adres', v.adres); set('tel', v.tel);
    if (onlyText) return;
    var links = $('[data-f="links"]', el);
    if (links) { links.textContent = ''; v.links.forEach(function (l) { links.appendChild(mk('i', null, l)); }); }
    el.style.setProperty('--s-bg', p.bg); el.style.setProperty('--s-ink', p.ink); el.style.setProperty('--s-acc', p.acc);
    el.style.setProperty('--s-line', p.line); el.style.setProperty('--s-card', p.card);
    var img = $('[data-f="foto"]', el);
    if (img && img.getAttribute('data-id') !== v.foto.id) {
      img.setAttribute('data-id', v.foto.id); img.src = photoUrl(v.foto.id); img.style.objectPosition = v.foto.pos;
    }
  }
  function applyAll(onlyText) {
    sites.forEach(function (el) { applySite(el, onlyText); });
    $$('[data-f="domein"]').forEach(function (x) { x.textContent = slug(naam()); });
    subs.forEach(function (fn) { safe(function () { fn(onlyText); }); });
  }
  function preload(i) { var v = D.vak[i]; if (!v || v._pre) return; v._pre = 1; var im = new Image(); im.src = photoUrl(v.foto.id); }
  /* lokale coördinaten van een onderdeel binnen de site (niet beïnvloed door transform) */
  function relRect(el, site) {
    var x = 0, y = 0, e = el;
    while (e && e !== site) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
  }

  /* ============================================================
     3. HERO — het tekenblad
     ============================================================ */
  safe(function () {
    var root = $('[data-ws-hero]');
    if (!root) return;
    var sheet = $('[data-ws-sheet]', root), stage = $('[data-ws-stage]', root), frame = $('[data-ws-frame]', root);
    var view = $('[data-ws-view]', root), scale = $('[data-ws-scale]', root), site = $('[data-ws-site]', scale);
    var labels = $('[data-ws-labels]', root), notes = $('[data-ws-notes]', root), clock = $('[data-ws-clock]', root), clockT = $('[data-ws-clockt]', root);
    var toast = $('[data-ws-toast]', root), rulerN = $('[data-ws-rulen]', root), ruler = $('.ws-ruler', root);
    var chaps = $$('.ws-chap', root), pauseB = $('[data-ws-pause]', root), againB = $('[data-ws-again]', root);
    var heroSr = $('[data-ws-herosr]', root), heroLive = $('[data-ws-herolive]', root);
    var chips = $$('.ws-chip', root), nameBtn = $('[data-ws-namebtn]', root), nameBox = $('#wsNameBox'), nameIn = $('#wsName');
    if (!sheet || !site) return;
    root.classList.add('is-js');
    site.removeAttribute('aria-hidden'); site.setAttribute('aria-hidden', 'true');
    var draft = sv('svg', { 'class': 'ws-draft', 'aria-hidden': 'true' });
    scale.appendChild(draft);

    var H = { mode: 'desk', ch: -1, user: false, userPaused: false, off: true, hidden: false, timers: [], k: 1, prog: null, done: false };
    function paused() { return H.userPaused || H.off || H.hidden; }
    function later(fn, ms) { var t = new Timer(fn, ms); H.timers.push(t); if (!paused()) t.start(); return t; }
    function kill() { H.timers.forEach(function (t) { t.kill(); }); H.timers = []; H.prog = null; }
    function sync() {
      var p = paused();
      H.timers = H.timers.filter(function (t) { return !t.done; });
      H.timers.forEach(function (t) { if (p) t.pause(); else t.start(); });
      if (!p && H.prog) Loop.add(progTick);
    }

    /* ---------- maat en schaal ---------- */
    var DIM = { desk: [1000, 625, 24], gsm: [390, 780, 18] };
    function geo(mode) {
      var sw = stage.clientWidth, sh = stage.clientHeight, d = DIM[mode];
      var k = Math.min(sw / d[0], (sh - d[2]) / d[1]);
      if (mode === 'desk') k = Math.min(k, 0.66);
      var fw = d[0] * k, fh = d[1] * k;
      return { k: k, fw: fw, fh: fh, addr: d[2], left: stage.offsetLeft + (sw - fw) / 2, top: stage.offsetTop + (sh - fh - d[2]) / 2 + d[2] };
    }
    function layout(mode, instant) {
      var g = geo(mode);
      H.k = g.k; H.g = g;
      if (instant) { frame.style.transition = 'none'; view.style.transition = 'none'; scale.style.transition = 'none'; }
      frame.style.setProperty('--fw', g.fw.toFixed(1) + 'px');
      view.style.setProperty('--fh', g.fh.toFixed(1) + 'px');
      scale.style.transform = 'scale(' + g.k.toFixed(4) + ')';
      if (instant) { void frame.offsetWidth; frame.style.transition = ''; view.style.transition = ''; scale.style.transition = ''; }
      return g;
    }
    scale.style.transition = 'transform .9s cubic-bezier(.6,.05,.2,1)';

    /* ---------- de schets ---------- */
    var PARTS_D = ['nav', 'logo', 'links', 'cta', 'foto', 'titel', 'sub', 'knop', 'uren', 'review', 'adres'];
    var PARTS_G = ['nav', 'logo', 'burger', 'foto', 'titel', 'sub', 'uren', 'review', 'adres', 'bar'];
    var LAB = { logo: 'logo', links: 'links', cta: 'cta', knop: 'cta', foto: 'foto', titel: 'titel', uren: 'uren', review: 'review', adres: 'adres', bar: 'bar' };
    var LAB_M = { knop: 1, cta: 1, foto: 1, uren: 1, bar: 1 };
    function part(n) { return $('[data-part="' + n + '"]', site); }
    function drawDraft(mode, animate) {
      var W = DIM[mode][0], Hh = DIM[mode][1];
      draft.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh);
      draft.setAttribute('width', W); draft.setAttribute('height', Hh);
      draft.textContent = ''; labels.textContent = '';
      var list = mode === 'desk' ? PARTS_D : PARTS_G, g = H.g, i = 0;
      list.forEach(function (n) {
        var el = part(n); if (!el || !el.offsetWidth) return;
        var r = relRect(el, site);
        var p = sv('path', { d: 'M' + f1(r.x) + ' ' + f1(r.y) + 'h' + f1(r.w) + 'v' + f1(r.h) + 'h' + f1(-r.w) + 'Z', pathLength: 1 }, draft);
        var dl = 0.3 + i * 0.08;
        if (animate) p.style.transition = 'stroke-dashoffset .6s cubic-bezier(.6,.05,.2,1) ' + dl + 's';
        if (n === 'foto') {
          var c1 = sv('path', { d: 'M' + f1(r.x) + ' ' + f1(r.y) + 'L' + f1(r.x + r.w) + ' ' + f1(r.y + r.h) + 'M' + f1(r.x + r.w) + ' ' + f1(r.y) + 'L' + f1(r.x) + ' ' + f1(r.y + r.h), pathLength: 1 }, draft);
          if (animate) c1.style.transition = p.style.transition;
        }
        var key = LAB[n];
        if (key && (!mobile.matches || LAB_M[n]) && !(n === 'knop' && mode === 'desk' && !mobile.matches && false)) {
          var lab = mk('span', 'ws-lab', U.labels[key]);
          lab.style.left = f1(g.left + r.x * g.k) + 'px';
          lab.style.top = f1(g.top + r.y * g.k) + 'px';
          if (animate) lab.style.transitionDelay = (dl + 0.25) + 's';
          labels.appendChild(lab);
        }
        i++;
      });
      if (animate) { void draft.getBoundingClientRect(); requestAnimationFrame(function () { draft.classList.add('is-on'); $$('.ws-lab', labels).forEach(function (l) { l.classList.add('is-on'); }); }); }
      else { draft.classList.add('is-on'); $$('.ws-lab', labels).forEach(function (l) { l.classList.add('is-on'); }); }
    }

    /* ---------- notities (handschrift) ---------- */
    var ARR = { up: '<path d="M13 24c-1-7 0-13 2-20M10 8l5-4 3 6"/>', left: '<path d="M24 14c-7 1-14 0-20-2M8 8l-4 4 5 4"/>', right: '<path d="M2 14c7 1 14 0 20-2M18 8l4 4-5 4"/>' };
    function note(i, target) {
      var g = H.g, el = part(target), r = el ? relRect(el, site) : { x: 0, y: 0, w: 0, h: 0 };
      var n = mk('span', 'ws-note');
      var s = sv('svg', { viewBox: '0 0 26 26', 'aria-hidden': 'true' });
      var txt = mk('span', null, U.notes[i]);
      var sw = sheet.clientWidth, sh = sheet.clientHeight;
      if (H.mode === 'desk') {
        /* onder het frame, in een vaste plek links of rechts, met een pijl omhoog */
        s.innerHTML = ARR.up; n.classList.add('up');
        n.appendChild(s); n.appendChild(txt);
        if (i % 2 === 0) n.style.left = f1(Math.max(18, g.left + 6)) + 'px';
        else { n.style.right = f1(Math.max(18, sw - g.left - g.fw + 6)) + 'px'; }
        n.style.top = f1(g.top + g.fh + 8) + 'px';
      } else {
        /* naast de gsm, op de hoogte van het blok */
        var y = g.top + (r.y + r.h / 2) * g.k - 12, leftSide = i % 2 === 0;
        if (leftSide) { s.innerHTML = ARR.right; n.appendChild(txt); n.appendChild(s); n.style.right = f1(sw - g.left + 6) + 'px'; n.style.textAlign = 'right'; }
        else { s.innerHTML = ARR.left; n.appendChild(s); n.appendChild(txt); n.style.left = f1(g.left + g.fw + 6) + 'px'; }
        n.style.top = f1(clamp(y, 40, sh - 60)) + 'px';
      }
      notes.appendChild(n);
      var on = $$('.ws-note.is-on', notes);
      if (on.length >= 2) { on[0].classList.remove('is-on'); setTimeout(function () { if (on[0].parentNode) on[0].parentNode.removeChild(on[0]); }, 400); }
      requestAnimationFrame(function () { n.classList.add('is-on'); });
    }
    function clearNotes() { notes.textContent = ''; }

    /* ---------- hoofdstukken ---------- */
    function progTick(dt) {
      if (paused() || !H.prog) return false;
      H.prog.t += dt * 1000;
      var p = clamp(H.prog.t / H.prog.dur, 0, 1);
      H.prog.el.style.setProperty('--p', p.toFixed(3));
      return p < 1;
    }
    function markChap(i) {
      chaps.forEach(function (b, k) {
        b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
        b.classList.toggle('is-done', k < i);
        if (k !== i) b.querySelector('i').style.removeProperty('--p');
      });
    }
    var DUR = [2400, 2600, 1800, 3900];
    function setRuler(n) { if (rulerN) rulerN.textContent = n + ' px'; }
    function clearSite() {
      site.classList.remove('is-night', 'is-sheet');
      sheet.classList.remove('is-night');
      clock.classList.remove('is-on'); toast.classList.remove('is-on');
      $$('.ws-tap', site).forEach(function (t) { t.parentNode.removeChild(t); });
    }
    function setMode(mode) {
      H.mode = mode;
      site.classList.toggle('is-gsm', mode === 'gsm');
      frame.classList.toggle('is-gsm', mode === 'gsm');
      sheet.style.setProperty('--rw', mode === 'gsm' ? '34%' : '60%');
      setRuler(mode === 'gsm' ? 390 : 1280);
    }
    /* eindstand van een hoofdstuk zonder beweging (voor terugspringen en minder beweging) */
    function endState(i) {
      if (i === 0) { sheet.classList.add('is-ruled'); drawDraft(H.mode, false); }
      if (i === 1) { sheet.classList.add('is-inked'); draft.classList.add('is-faint'); labels.classList.add('is-gone'); }
      if (i === 2) { setMode('gsm'); layout('gsm', true); drawDraft('gsm', false); draft.classList.add('is-faint'); labels.classList.add('is-gone'); }
      if (i === 3) { nightOn(false); }
    }
    function sheetContent() {
      var v = vak(), box = $('.ws-s-sheet-in', site);
      box.textContent = '';
      if (v.flow === 'offerte') {
        U.form.forEach(function (f, k) { var ln = mk('div', 'ln'); ln.appendChild(mk('span', null, f)); ln.appendChild(mk('b', null, k === 0 ? 'Volkswagen' : (k === 1 ? v.dienst : '04•• •• •• 12'))); box.appendChild(ln); });
      } else {
        box.appendChild(mk('p', null, naam()));
        var ln = mk('div', 'ln'); ln.appendChild(mk('span', null, v.dienst)); ln.appendChild(mk('b', null, v.moment)); box.appendChild(ln);
      }
      var ok = mk('div', 'ok');
      var s = sv('svg', { viewBox: '0 0 24 24' }); sv('path', { d: 'M5 12.5l4.5 4.5L19 7.5', pathLength: 1 }, s);
      ok.appendChild(s); ok.appendChild(mk('span', null, v.flow === 'offerte' ? U.sent : U.confirmed)); box.appendChild(ok);
      var t = v.flow === 'offerte' ? U.toast_offerte : U.toast_boek;
      $('b', toast).textContent = fill(t[0], v); $('span', toast).textContent = fill(t[1], v);
    }
    function placeNight() {
      var g = H.g, sw = sheet.clientWidth;
      var cx = g.left - 12;
      if (H.mode === 'gsm' && cx > 150) { clock.style.left = ''; clock.style.right = f1(sw - cx) + 'px'; clock.style.top = f1(g.top + 6) + 'px'; }
      else { clock.style.right = ''; clock.style.left = '14px'; clock.style.top = '36px'; }
      if (H.mode === 'gsm' && g.left > 230) { toast.style.left = ''; toast.style.right = f1(sw - g.left + 14) + 'px'; toast.style.top = f1(g.top + g.fh * 0.45) + 'px'; }
      else { toast.style.right = ''; toast.style.left = '14px'; toast.style.top = f1(Math.max(36, g.top + g.fh * 0.3)) + 'px'; }
    }
    function nightOn(animate) {
      sheetContent(); placeNight();
      clockT.textContent = U.clock_b;
      clock.classList.add('is-on'); sheet.classList.add('is-night'); site.classList.add('is-night', 'is-sheet');
      toast.classList.add('is-on'); root.classList.add('is-booked');
      if (!animate) { clearNotes(); note(4, H.mode === 'gsm' ? 'bar' : 'knop'); }
    }
    function chapter(i) {
      H.ch = i; markChap(i);
      var b = chaps[i].querySelector('i');
      H.prog = { t: 0, dur: DUR[i], el: b };
      if (!paused()) Loop.add(progTick);
      if (H.user && heroLive) heroLive.textContent = fill(U.live_chapter, { i: i + 1, naam: D.chapters[i] });
      if (i === 0) {
        clearNotes(); sheet.classList.remove('is-inked'); draft.classList.remove('is-faint', 'is-on'); labels.classList.remove('is-gone');
        later(function () { sheet.classList.add('is-ruled'); }, 200);
        drawDraft(H.mode, true);
        later(function () { note(0, H.mode === 'gsm' ? 'bar' : 'knop'); }, 1400);
        later(function () { note(1, 'uren'); }, 2000);
      } else if (i === 1) {
        sheet.classList.add('is-inked');
        var ph = $('.ws-s-photo img', site), ti = part('titel'), kn = part('knop'), cards = $$('.ws-s-card', site);
        anim(site, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
        anim(ph, [{ clipPath: 'inset(0 100% 0 0)', transform: 'scale(1.06)' }, { clipPath: 'inset(0 0% 0 0)', transform: 'scale(1)' }], { duration: 1000, delay: 250, easing: 'cubic-bezier(.6,.05,.2,1)', fill: 'backwards' });
        if (ti && !reduce) {
          var full = ti.textContent, tt = 0;
          ti.textContent = '';
          later(function () {
            Loop.add(function type(dt) {
              if (paused()) { later(function () { Loop.add(type); }, 50); return false; }
              tt += dt * 1000; var n = Math.min(full.length, Math.floor(tt / 28));
              ti.textContent = full.slice(0, n);
              return n < full.length;
            });
          }, 500);
        }
        anim(kn, [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 400, delay: 1200, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
        cards.forEach(function (c, k) { anim(c, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: 1500 + k * 80, fill: 'backwards' }); });
        later(function () { draft.classList.add('is-faint'); labels.classList.add('is-gone'); }, 1800);
        later(function () { note(2, 'foto'); }, 2000);
      } else if (i === 2) {
        toGsm();
      } else if (i === 3) {
        sheetContent(); placeNight();
        clockT.textContent = U.clock_a; clock.classList.add('is-on');
        later(function () { roll(clockT, U.clock_b); }, 700);
        later(function () { sheet.classList.add('is-night'); site.classList.add('is-night'); }, 1300);
        later(function () { tap(); }, 2200);
        later(function () { site.classList.add('is-sheet'); root.classList.add('is-booked'); }, 2600);
        later(function () { toast.classList.add('is-on'); }, 3200);
        later(function () { note(4, H.mode === 'gsm' ? 'bar' : 'knop'); }, 3700);
      }
      later(function () {
        chaps[i].classList.add('is-done');
        if (i < 3) chapter(i + 1); else { H.done = true; H.ch = 4; markChap(4); pauseB.hidden = true; }
      }, DUR[i] + (i === 3 ? 400 : 250));
    }
    function roll(el, text) {
      if (reduce) { el.textContent = text; return; }
      anim(el, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-60%)', opacity: 0 }], { duration: 220 });
      setTimeout(function () { el.textContent = text; anim(el, [{ transform: 'translateY(60%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260 }); }, 220);
    }
    function tap() {
      var el = H.mode === 'gsm' ? $('.ws-s-bar span', site) : part('knop');
      if (!el) return;
      var r = relRect(el, site), t = mk('i', 'ws-tap');
      t.style.left = f1(r.x + r.w / 2) + 'px'; t.style.top = f1(r.y + r.h / 2) + 'px';
      site.appendChild(t);
      anim(t, [{ opacity: 0.9, transform: 'scale(.4)' }, { opacity: 0, transform: 'scale(1.6)' }], { duration: 520, easing: 'ease-out' });
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 560);
    }
    /* FLIP: van desktop naar gsm, onderdelen schuiven vloeiend naar hun nieuwe plek */
    function toGsm() {
      var names = ['nav', 'logo', 'titel', 'sub', 'foto', 'uren', 'review', 'adres'];
      var before = {};
      names.forEach(function (n) { var e = part(n); if (e) before[n] = relRect(e, site); });
      clearNotes();
      setMode('gsm');
      var g = layout('gsm');
      names.forEach(function (n) {
        var e = part(n), a = before[n]; if (!e || !a) return;
        var b = relRect(e, site);
        var dx = a.x - b.x, dy = a.y - b.y, sx = a.w / Math.max(1, b.w), sy = a.h / Math.max(1, b.h);
        var from = n === 'foto' ? 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')' : 'translate(' + dx + 'px,' + dy + 'px)';
        e.style.transformOrigin = '0 0';
        anim(e, [{ transform: from }, { transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.6,.05,.2,1)' });
      });
      var bar = part('bar');
      anim(bar, [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 320, delay: 700, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
      var n0 = 1280, t0 = 0;
      Loop.add(function cnt(dt) { t0 += dt * 1000; var u = clamp(t0 / 900, 0, 1); setRuler(Math.round(n0 + (390 - n0) * easeIO(u))); return u < 1; });
      draft.style.opacity = '0';
      later(function () { drawDraft('gsm', false); draft.classList.add('is-faint'); draft.style.opacity = ''; labels.classList.add('is-gone'); }, 1000);
      later(function () { note(3, 'bar'); }, 1200);
      H.g = g;
    }

    function restart(fromCh) {
      kill(); H.done = false; pauseB.hidden = false;
      clearSite(); clearNotes();
      root.classList.remove('is-booked');
      var ti = part('titel'); if (ti) ti.textContent = vak().titel;
      if (fromCh <= 2) { setMode('desk'); layout('desk', true); }
      if (fromCh === 0) { sheet.classList.remove('is-inked', 'is-ruled'); }
      for (var k = 0; k < fromCh; k++) endState(k);
      markChap(fromCh);
      chapter(fromCh);
    }
    function setPause(on) {
      H.userPaused = on;
      pauseB.setAttribute('data-state', on ? 'paused' : 'playing');
      pauseB.setAttribute('aria-label', on ? U.play_aria : U.pause_aria);
      $('span', pauseB).textContent = on ? U.play : U.pause;
      sync();
    }
    chaps.forEach(function (b, i) {
      b.addEventListener('click', function () {
        H.user = true;
        if (reduce) { staticChapter(i); return; }
        if (H.userPaused) setPause(false);
        restart(i);
      });
    });
    pauseB.addEventListener('click', function () { H.user = true; setPause(!H.userPaused); });
    againB.addEventListener('click', function () { H.user = true; if (reduce) { staticChapter(1); return; } if (H.userPaused) setPause(false); restart(0); });

    /* vak kiezen: de inkt trekt terug en het blad kleurt opnieuw in */
    var vakT = 0;
    function setVak(i) {
      if (i === S.vak) return;
      S.vak = i;
      chips.forEach(function (c, k) { c.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      if (heroSr) heroSr.textContent = fill(U.sr_hero, { naam: naam(), wat: vak().flow === 'offerte' ? U.sr_offerte : U.sr_boek });
      if (reduce) { applyAll(); staticChapter(Math.max(1, H.ch)); return; }
      if (H.ch < 1) { applyAll(); return; }
      kill(); H.done = false; pauseB.hidden = false;
      var mode = H.mode;
      anim(site, [{ opacity: 1 }, { opacity: 0 }], { duration: 350 });
      draft.classList.remove('is-faint');
      clearTimeout(vakT);
      vakT = setTimeout(function () {
        kill();
        clearSite(); clearNotes(); root.classList.remove('is-booked');
        applyAll();
        if (mode === 'gsm') { drawDraft('gsm', false); }
        markChap(1);
        chapter(1);
        if (mode === 'gsm') {
          /* in gsm-stand: na het inkleuren niet opnieuw omklappen, meteen naar 's avonds */
          H.timers.forEach(function (t) { t.kill(); }); H.timers = [];
          later(function () { chaps[1].classList.add('is-done'); chaps[2].classList.add('is-done'); draft.classList.add('is-faint'); labels.classList.add('is-gone'); chapter(3); }, DUR[1] + 250);
        }
      }, 360);
    }
    chips.forEach(function (c, i) {
      c.addEventListener('click', function () { H.user = true; setVak(i); });
      c.addEventListener('pointerenter', function () { preload(i); });
      c.addEventListener('focus', function () { preload(i); });
    });
    if (nameBtn && nameBox) nameBtn.addEventListener('click', function () {
      var open = nameBox.hidden; nameBox.hidden = !open; nameBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && nameIn) nameIn.focus();
    });
    var nt = 0;
    if (nameIn) nameIn.addEventListener('input', function () {
      clearTimeout(nt);
      nt = setTimeout(function () {
        var v = String(nameIn.value || '').replace(/[<>{}]/g, '').trim().slice(0, 28);
        S.naam = v; applyAll(true);
        $$('[data-f="domein"]').forEach(function (x) { x.textContent = slug(naam()); });
        if (heroSr) heroSr.textContent = fill(U.sr_hero, { naam: naam(), wat: vak().flow === 'offerte' ? U.sr_offerte : U.sr_boek });
        if (site.classList.contains('is-sheet')) sheetContent();
      }, 200);
    });

    /* minder beweging: elke knop toont meteen de eindstand */
    function staticChapter(i) {
      clearSite(); clearNotes(); root.classList.remove('is-booked');
      setMode(i >= 2 ? 'gsm' : 'desk'); layout(H.mode, true);
      sheet.classList.add('is-ruled');
      drawDraft(H.mode, false);
      if (i >= 1) { sheet.classList.add('is-inked'); draft.classList.add('is-faint'); labels.classList.add('is-gone'); } else sheet.classList.remove('is-inked');
      if (i === 0) { note(0, 'knop'); note(1, 'uren'); }
      if (i === 1) { note(2, 'foto'); }
      if (i === 2) { note(3, 'bar'); }
      if (i === 3) nightOn(false);
      H.ch = i; markChap(i); chaps.forEach(function (b, k) { b.classList.toggle('is-done', k < i); });
      if (H.user && heroLive) heroLive.textContent = fill(U.live_chapter, { i: i + 1, naam: D.chapters[i] });
    }

    /* opnieuw meten bij een andere breedte, zonder de stand te verliezen */
    var rt = 0;
    function relayout() {
      layout(H.mode, true);
      if (sheet.classList.contains('is-ruled')) {
        var faint = draft.classList.contains('is-faint');
        drawDraft(H.mode, false); if (faint) draft.classList.add('is-faint');
      }
      if (sheet.classList.contains('is-night')) placeNight();
      clearNotes();
    }
    if ('ResizeObserver' in window) new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(relayout, 150); }).observe(sheet);
    else window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(relayout, 150); });

    watch(sheet, function (vis) { H.off = !vis; sync(); }, 0.25);
    document.addEventListener('visibilitychange', function () { H.hidden = document.hidden; sync(); });

    layout('desk', true);
    if (reduce) { pauseB.hidden = true; H.off = false; staticChapter(1); return; }
    var started = false;
    var start = function () { if (started) return; started = true; preload(1); preload(2); preload(3); chapter(0); };
    requestAnimationFrame(function () { once(sheet, start, 0.35); });
  });

  /* ============================================================
     4. LENZEN — wat je site voor je doet
     ============================================================ */
  safe(function () {
    var lens = $('[data-ws-lens-root]');
    if (!lens) return;
    var sec = lens.closest('section');
    var scale = $('[data-ws-lscale]', lens), site = $('[data-ws-site]', scale), box = $('[data-ws-lbox]', lens), boxP = $('path', box), over = $('[data-ws-over]', lens);
    var btns = $$('.ws-lensb', sec), pauseB = $('[data-ws-lpause]', sec);
    var live = mk('p', 'ws-lens-live'); live.setAttribute('aria-live', 'polite'); live.style.display = 'none';
    var group = $('.ws-lenses', sec); group.parentNode.insertBefore(live, group.nextSibling);
    var L = { i: 0, stop: false, userPaused: false, off: true, t: 0, dur: 6000, typing: null };
    var k0 = 1;
    function base() { k0 = lens.clientWidth / 1000; }
    function texts() {
      var v = vak();
      btns.forEach(function (b, i) {
        var d = D.lenses[i], off = v.flow === 'offerte';
        $('b', b).textContent = off && d.titel_offerte ? d.titel_offerte : d.titel;
        $('.ws-lens-t', b).textContent = fill(off && d.tekst_offerte ? d.tekst_offerte : d.tekst, { vak: v.chip.toLowerCase(), cta: v.cta });
      });
      live.textContent = $('.ws-lens-t', btns[L.i]).textContent;
    }
    subs.push(function () { texts(); if (!L.stop || true) show(L.i, true); });
    function zoomTo(pn) {
      var W = lens.clientWidth, Hh = lens.clientHeight;
      box.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh);
      if (!pn) { scale.style.transform = 'scale(' + k0 + ')'; return null; }
      var el = $('[data-part="' + pn + '"]', site); if (!el) return null;
      var r = relRect(el, site), s = k0 * 1.55;
      var tx = clamp(W / 2 - (r.x + r.w / 2) * s, W - 1000 * s, 0), ty = clamp(Hh / 2 - (r.y + r.h / 2) * s, Hh - 625 * s, 0);
      scale.style.transform = 'translate(' + f1(tx) + 'px,' + f1(ty) + 'px) scale(' + s.toFixed(4) + ')';
      return { x: r.x * s + tx - 6, y: r.y * s + ty - 6, w: r.w * s + 12, h: r.h * s + 12 };
    }
    function ov(cls, css) { var d = mk('div', 'ws-ov ' + cls); for (var k in css) d.style[k] = css[k]; over.appendChild(d); return d; }
    var TI = {
      web: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>', wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5z"/>',
      ig: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>', mail: '<rect height="14" rx="2" width="18" x="3" y="5"/><path d="m3 7 9 6 9-6"/>',
      sms: '<path d="M4 5h16v11H9l-5 4z"/>', tel: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'
    };
    function overlay(i) {
      over.textContent = ''; if (L.typing) { clearInterval(L.typing); L.typing = null; }
      var v = vak(), id = D.lenses[i].id;
      if (id === 'gevonden') {
        var o = ov('ws-srch', { right: '4%', top: '12%', width: 'min(300px,62%)' });
        var f = mk('div', 'ws-q-field'); f.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
        var q = mk('span'); f.appendChild(q); o.appendChild(f);
        var res = mk('div', 'ws-res'); res.appendChild(mk('b', null, naam())); res.appendChild(mk('em', null, slug(naam())));
        res.appendChild(mk('span', null, U.open_until));
        var rb = mk('div', 'ws-res-b'); U.result_btns.forEach(function (t) { rb.appendChild(mk('i', null, t)); }); res.appendChild(rb);
        res.appendChild(mk('small', null, U.example)); res.style.opacity = '0'; o.appendChild(res);
        var full = v.zoek, n = 0;
        if (reduce) { q.textContent = full; res.style.opacity = '1'; }
        else L.typing = setInterval(function () { n++; q.textContent = full.slice(0, n); if (n >= full.length) { clearInterval(L.typing); L.typing = null; res.style.transition = 'opacity .35s ease'; res.style.opacity = '1'; } }, 45);
      } else if (id === 'vertrouwen') {
        var o2 = ov('ws-sms', { right: '4%', bottom: '8%' });
        o2.appendChild(mk('small', null, U.sms_meta)); o2.appendChild(mk('p', null, U.sms_text)); o2.appendChild(mk('small', null, U.example));
      } else if (id === 'boeken') {
        var o3 = ov('ws-tiles', { right: '4%', top: '10%' }), tiles = [];
        if (v.flow === 'offerte') { U.form.forEach(function (f) { tiles.push(mk('div', null, f)); }); tiles.push(mk('div', 'done', U.sent + ' · ' + U.crm)); }
        else {
          tiles.push(mk('div', null, fill(U.tile_service, v))); tiles.push(mk('div', null, v.moment));
          var p = mk('div', null, U.pay), pc = mk('span', 'pay'); U.pay_chips.forEach(function (c) { pc.appendChild(mk('i', null, c)); }); p.appendChild(pc); tiles.push(p);
          tiles.push(mk('div', 'done', '✓ ' + U.confirmed));
        }
        tiles.forEach(function (t, k) { o3.appendChild(t); setTimeout(function () { t.classList.add('is-on'); }, reduce ? 0 : 400 + k * 600); });
        o3.appendChild(mk('small', null, U.example));
      } else {
        var o4 = ov('ws-inbox', { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' });
        U.inbox.forEach(function (r) {
          var row = mk('div'), s = sv('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }); s.innerHTML = TI[r[0]] || '';
          row.appendChild(s); row.appendChild(mk('b', null, r[1])); row.appendChild(mk('span', null, r[0] === 'web' ? r[2] + ' · ' + naam() : r[2])); o4.appendChild(row);
        });
        o4.appendChild(mk('small', null, U.example));
      }
      requestAnimationFrame(function () { $$('.ws-ov', over).forEach(function (o) { o.style.transitionDelay = reduce ? '0s' : '.75s'; o.classList.add('is-on'); }); });
    }
    function show(i, quiet) {
      L.i = i; L.t = 0;
      btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); var bar = $('i', b); if (bar) bar.style.transform = 'scaleX(0)'; });
      base();
      var d = D.lenses[i];
      lens.classList.toggle('is-dim', !d.part);
      box.classList.remove('is-on');
      var r = zoomTo(d.part);
      if (r) {
        boxP.setAttribute('d', 'M' + f1(r.x) + ' ' + f1(r.y) + 'h' + f1(r.w) + 'v' + f1(r.h) + 'h' + f1(-r.w) + 'Z');
        setTimeout(function () { box.classList.add('is-on'); }, reduce ? 0 : 650);
      }
      overlay(i);
      live.textContent = $('.ws-lens-t', btns[i]).textContent;
    }
    function tick(dt) {
      if (L.stop || L.userPaused || L.off) return false;
      L.t += dt * 1000;
      var bar = $('i', btns[L.i]); if (bar) bar.style.transform = 'scaleX(' + clamp(L.t / L.dur, 0, 1).toFixed(3) + ')';
      if (L.t >= L.dur) show((L.i + 1) % btns.length);
      return true;
    }
    function stopAuto() { L.stop = true; pauseB.hidden = true; btns.forEach(function (b) { var bar = $('i', b); if (bar) bar.style.transform = 'scaleX(0)'; }); }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { stopAuto(); show(i); }); });
    sec.addEventListener('keydown', function (e) { if (e.target.closest && e.target.closest('.ws-lensb')) stopAuto(); });
    pauseB.addEventListener('click', function () {
      L.userPaused = !L.userPaused;
      pauseB.setAttribute('data-state', L.userPaused ? 'paused' : 'playing');
      pauseB.setAttribute('aria-label', L.userPaused ? U.lens_play : U.lens_pause);
      $('span', pauseB).textContent = L.userPaused ? U.play : U.pause;
      if (!L.userPaused) Loop.add(tick);
    });
    var mq = function () { live.style.display = mobile.matches ? 'block' : 'none'; };
    mq(); if (mobile.addEventListener) mobile.addEventListener('change', mq);
    if ('ResizeObserver' in window) new ResizeObserver(function () { show(L.i, true); }).observe(lens);
    texts(); show(0, true);
    if (reduce) { stopAuto(); return; }
    watch(lens, function (v) { L.off = !v; if (v && !L.stop) Loop.add(tick); }, 0.25);
    once(lens, function () { if (!L.stop) Loop.add(tick); }, 0.5);
  });

  /* ============================================================
     5. DOORSNEDE — blauwdruk boven, echte site onder de lijn
     ============================================================ */
  safe(function () {
    var cut = $('[data-ws-cut]');
    if (!cut) return;
    var sec = cut.closest('section');
    var bp = $('[data-ws-bp]', cut), pinsEl = $('[data-ws-pins]', cut), knife = $('[data-ws-knife]', cut), viewEl = $('.ws-cut-view', cut), cap = $('[data-ws-pincap]', sec);
    var toggles = $$('[data-ws-mode]', sec);
    cut.classList.add('is-js');
    var C = { v: 56, mode: 'desk', user: false, lastPin: -1 };
    function build() {
      bp.textContent = '';
      var s = sv('svg', { viewBox: '0 0 100 100', preserveAspectRatio: 'none' }, bp);
      D.bp[C.mode].forEach(function (r) {
        sv('path', { d: 'M' + r.x + ' ' + r.y + 'h' + r.w + 'v' + r.h + 'h' + (-r.w) + 'Z' }, s);
        if (r.x_) sv('path', { 'class': 'x', d: 'M' + r.x + ' ' + r.y + 'L' + (r.x + r.w) + ' ' + (r.y + r.h) + 'M' + (r.x + r.w) + ' ' + r.y + 'L' + r.x + ' ' + (r.y + r.h) }, s);
        if (r.l) { var l = mk('span', null, r.l); l.style.left = r.x + '%'; l.style.top = r.y + '%'; bp.appendChild(l); }
      });
      pinsEl.textContent = '';
      D.pins[C.mode].forEach(function (p, i) {
        var el = mk('div', 'ws-pin' + (p.x > 60 ? ' is-left' : ''));
        el.style.left = p.x + '%'; el.style.top = p.y + '%';
        var dot = mk('i', null, C.mode === 'gsm' ? String(i + 1) : ''); el.appendChild(dot); el.appendChild(mk('span', null, p.t));
        pinsEl.appendChild(el);
      });
      C.lastPin = -1; set(C.v, true);
    }
    function set(v, quiet) {
      C.v = clamp(v, 0, 100);
      cut.style.setProperty('--cut', C.v.toFixed(2));
      knife.style.top = f1(viewEl.offsetTop + viewEl.offsetHeight * C.v / 100 + $('.ws-cut-frame', cut).offsetTop) + 'px';
      knife.style.left = f1($('.ws-cut-frame', cut).offsetLeft - 20) + 'px';
      knife.style.right = f1(cut.clientWidth - $('.ws-cut-frame', cut).offsetLeft - $('.ws-cut-frame', cut).offsetWidth - 20) + 'px';
      knife.setAttribute('aria-valuenow', String(Math.round(C.v)));
      var pins = D.pins[C.mode], last = -1, lastY = -1;
      var els = $$('.ws-pin', pinsEl);
      els.forEach(function (el, i) {
        var on = C.v >= pins[i].y; el.classList.toggle('is-on', on);
        if (on && pins[i].y > lastY) { lastY = pins[i].y; last = i; }
      });
      els.forEach(function (el, i) { el.classList.toggle('is-last', i === last); });
      if (last !== C.lastPin) {
        C.lastPin = last;
        var t = last >= 0 ? pins[last].t : U.slider_none;
        knife.setAttribute('aria-valuetext', t);
        if (cap) cap.textContent = t;
      }
    }
    /* slepen met muis of vinger, pijltjes met het toetsenbord */
    var drag = false;
    function fromEvent(e) { var r = viewEl.getBoundingClientRect(); return (e.clientY - r.top) / r.height * 100; }
    knife.addEventListener('pointerdown', function (e) { C.user = true; drag = true; try { knife.setPointerCapture(e.pointerId); } catch (x) {} set(fromEvent(e)); e.preventDefault(); });
    knife.addEventListener('pointermove', function (e) { if (drag) set(fromEvent(e)); });
    knife.addEventListener('pointerup', function () { drag = false; });
    knife.addEventListener('pointercancel', function () { drag = false; });
    viewEl.addEventListener('click', function (e) { C.user = true; set(fromEvent(e)); });
    knife.addEventListener('keydown', function (e) {
      var k = e.key, d = 0;
      if (k === 'ArrowDown' || k === 'ArrowRight') d = 5; else if (k === 'ArrowUp' || k === 'ArrowLeft') d = -5;
      else if (k === 'PageDown') d = 20; else if (k === 'PageUp') d = -20;
      else if (k === 'Home') { C.user = true; set(0); e.preventDefault(); return; } else if (k === 'End') { C.user = true; set(100); e.preventDefault(); return; }
      if (d) { C.user = true; set(C.v + d); e.preventDefault(); }
    });
    toggles.forEach(function (b) {
      b.addEventListener('click', function () {
        var m = b.getAttribute('data-ws-mode'); if (m === C.mode) return;
        toggles.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        cut.classList.add('is-swap');
        setTimeout(function () { C.mode = m; cut.setAttribute('data-mode', m); build(); cut.classList.remove('is-swap'); }, reduce ? 0 : 300);
      });
    });
    if (mobile.matches) { C.mode = 'gsm'; cut.setAttribute('data-mode', 'gsm'); toggles.forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-ws-mode') === 'gsm' ? 'true' : 'false'); }); }
    build();
    if ('ResizeObserver' in window) new ResizeObserver(function () { set(C.v, true); }).observe(cut);
    var shot = $('.ws-shot-' + (C.mode === 'gsm' ? 'm' : 'd'), cut);
    if (shot && !shot.complete) shot.addEventListener('load', function () { set(C.v, true); });
    if (reduce) return;
    once(cut, function () {
      if (C.user) return;
      set(0);
      var t = 0, phase = 0;
      Loop.add(function run(dt) {
        if (C.user) return false;
        t += dt * 1000;
        if (phase === 0) { set(100 * easeIO(clamp(t / 3200, 0, 1))); if (t >= 3200) { phase = 1; t = 0; } return true; }
        if (phase === 1) { if (t >= 900) { phase = 2; t = 0; } return true; }
        set(100 + (56 - 100) * easeIO(clamp(t / 900, 0, 1)));
        return t < 900;
      });
    }, 0.5);
  });

  /* ============================================================
     6. METEN — tonen wat de browser zelf zegt
     ============================================================ */
  safe(function () {
    var chip = $('[data-ws-chip]'), rulers = $('[data-ws-rulers]'), meet = $('#gemeten');
    var verdict = $('[data-ws-verdict]'), stamp = $('[data-ws-stamp]'), others = $('[data-ws-others]'), loadEl = $('[data-ws-load]'), lcpNote = $('[data-ws-lcpnote]');
    var sr = $('[data-ws-meetsr]'), micro = $('[data-ws-micro]'), reload = $('[data-ws-reload]');
    var T = D.meet, loaded = false, shown = false;
    function kb(b) { var k = b / 1024; return k >= 1024 ? (NF1 ? NF1.format(k / 1024) : (k / 1024).toFixed(1)) + ' MB' : num(Math.round(k)) + ' kB'; }
    function inMock(el) { return el && el.closest && el.closest('.ws-sheet,.ws-lens,.ws-cut,.ws-mini'); }
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
        if (v == null) { row.classList.add('is-off'); return; }
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
        loaded = true; chipUpdate();
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
     7. STUKLIJST EN ADD-ONS
     ============================================================ */
  safe(function () {
    var sl = $('[data-ws-sl]');
    if (!sl) return;
    var sec = sl.closest('section');
    var mini = $('[data-ws-mini]', sec), mscale = $('[data-ws-mscale]', sec), msite = mscale && $('[data-ws-site]', mscale);
    var amt = $('[data-ws-amt]', sec), amtD = $('.ws-amt-d', amt), amtSr = $('.sr-only', amt), per = $('[data-ws-per]', sec), totSr = $('[data-ws-totsr]', sec), tbp = $('[data-ws-tbp]', sec);
    var btns = $$('.ws-addon', sec), on = {};
    var R = new Roll(amtD, D.base);
    function fit() { if (!mscale || !mini) return; var w = $('.ws-mini-dev', mini).clientWidth; mscale.style.transform = 'scale(' + (w / 390).toFixed(4) + ')'; }
    fit(); if ('ResizeObserver' in window) new ResizeObserver(fit).observe(mini);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-ws-add'); on[id] = !on[id];
        b.setAttribute('aria-pressed', on[id] ? 'true' : 'false');
        var row = $('[data-ws-row="' + id + '"]', sl);
        if (row) {
          row.hidden = !on[id];
          if (on[id]) anim(row, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 450, easing: 'cubic-bezier(.6,.05,.2,1)' });
        }
        if (msite) msite.classList.toggle(id === 'cb' ? 'has-cb' : 'has-rc', !!on[id]);
        var t = D.base; btns.forEach(function (x) { if (on[x.getAttribute('data-ws-add')]) t += +x.getAttribute('data-price'); });
        R.set(t, false); if (amtSr) amtSr.textContent = String(t);
        var any = t !== D.base;
        if (per) per.textContent = any ? U.per_sum : U.per;
        if (tbp) tbp.textContent = '€' + t + ' / ' + U.per.replace(/^\S+\s/, '');
        if (totSr) totSr.textContent = fill(U.total_sr, { t: t });
      });
    });
    sl.classList.add('is-js');
    $$('li', sl).forEach(function (li, i) { li.style.transitionDelay = (i * 0.06) + 's'; });
    if (reduce) sl.classList.add('is-drawn'); else once(sl, function () { sl.classList.add('is-drawn'); setTimeout(function () { $$('li', sl).forEach(function (li) { li.style.transitionDelay = ''; }); }, 1200); }, 0.2);
  });

  /* ============================================================
     8. STAPPEN · 9. SLOT-CTA
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

  /* alles wat de keuze van vak of naam volgt */
  applyAll();
})();
