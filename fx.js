/* =============================================================
   EM Launchpad — interactieve effecten
   • hero-dial   : "een dag met je systeem" (24-uurs ring)
   • pinned steps: werkwijze, één stap tegelijk in beeld
   • tellers     : cijfers die meelopen zodra ze in beeld komen
   • glaspanelen : zwevende integratietegels met muisparallax
   • case-grafiek: ring, staven en funnel op de case-pagina
   Alles is progressive enhancement: zonder JS blijft elke
   pagina gewoon leesbaar en volledig.
   ============================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var NL = 'nl-BE';

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  /* roept fn één keer aan zodra el in beeld komt */
  function onView(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      each(entries, function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
  }

  /* één gedeelde, afgeremde scroll-lus */
  var scrollJobs = [];
  var scrollTicking = false;
  function runScrollJobs() { scrollTicking = false; for (var i = 0; i < scrollJobs.length; i++) scrollJobs[i](); }
  function queueScroll() { if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(runScrollJobs); } }
  function onScroll(fn) {
    scrollJobs.push(fn);
    if (scrollJobs.length === 1) {
      window.addEventListener('scroll', queueScroll, { passive: true });
      window.addEventListener('resize', queueScroll);
      window.addEventListener('load', queueScroll);
    }
    fn();
  }

  function tween(ms, step, done) {
    if (reduce || ms <= 0) { step(1); if (done) done(); return 0; }
    var t0 = null;
    var id = requestAnimationFrame(function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = clamp((ts - t0) / ms, 0, 1);
      step(p);
      if (p < 1) id = requestAnimationFrame(frame); else if (done) done();
    });
    return id;
  }

  /* ============================================================
     1. TELLERS — <b data-count="650" data-dec="0" data-suffix="%">
     ============================================================ */
  function fmt(n, dec) {
    return n.toLocaleString(NL, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  each(document.querySelectorAll('[data-count]'), function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    var write = function (v) { el.textContent = pre + fmt(v, dec) + suf; };
    if (reduce || target === 0) { write(target); return; }
    onView(el, function () {
      write(0);
      tween(1200 + Math.min(600, Math.abs(target) / 50), function (p) { write(target * easeOut(p)); });
    });
  });

  /* ============================================================
     2. HERO-DIAL — een dag met je systeem
     ============================================================ */
  (function heroDial() {
    var root = document.getElementById('heroDial');
    if (!root) return;

    var IC = {
      chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
      mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
      phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.5a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z',
      bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
      cal: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18M12 13.5v4.5M9.75 15.75h4.5',
      star: 'M12 2.6l2.75 5.95 6.45.76-4.75 4.37 1.24 6.45L12 16.95l-5.69 3.18 1.24-6.45-4.75-4.37 6.45-.76z'
    };

    /* een voorbeelddag — illustratief, geen klantcijfers */
    var EVENTS = [
      { t: 6.67, ic: 'chat', what: 'Chatbot boekte een afspraak', you: 'Jij sliep nog.', d: { a: 1 } },
      { t: 8.25, ic: 'mail', what: 'Bevestiging verstuurd', you: 'Automatisch — jij tikte niets.', d: {} },
      { t: 11.33, ic: 'phone', what: 'Gemiste oproep opgevangen', you: 'Jij stond bij een klant.', d: { b: 1 } },
      { t: 14.08, ic: 'bell', what: 'Herinnering verstuurd', you: 'Daarom komt iedereen opdagen.', d: {} },
      { t: 18.5, ic: 'cal', what: 'Nieuwe afspraak via Instagram', you: 'Jij was al naar huis.', d: { a: 1 } },
      { t: 21.17, ic: 'star', what: 'Review binnengekomen', you: 'Jij zat aan tafel.', d: { c: 1 } }
    ];
    var BASE = { a: 10, b: 0, c: 2 };
    var START = 5.0;
    var R = 78, CX = 100, CY = 100, CIRC = 2 * Math.PI * R;
    var NS = 'http://www.w3.org/2000/svg';

    var svg = root.querySelector('.hd-svg');
    var arc = root.querySelector('.hd-arc');
    var hand = root.querySelector('.hd-hand');
    var clockEl = root.querySelector('.hd-clock');
    var iconEl = root.querySelector('.hd-ic');
    var whatEl = root.querySelector('.hd-what');
    var youEl = root.querySelector('.hd-you');
    var tally = [root.querySelector('.hd-a'), root.querySelector('.hd-b'), root.querySelector('.hd-c')];
    if (!svg || !arc || !hand) return;

    function pos(r, t) {
      var a = (t / 24) * Math.PI * 2 - Math.PI / 2;
      return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
    }
    function mk(name, attrs) {
      var n = document.createElementNS(NS, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    }

    /* uurstreepjes */
    var ticks = mk('g', { class: 'hd-ticks' });
    for (var h = 0; h < 24; h++) {
      var major = h % 6 === 0;
      var p1 = pos(major ? 66 : 70, h), p2 = pos(74, h);
      ticks.appendChild(mk('line', {
        x1: p1[0].toFixed(2), y1: p1[1].toFixed(2), x2: p2[0].toFixed(2), y2: p2[1].toFixed(2),
        class: major ? 'hd-tick major' : 'hd-tick'
      }));
    }
    svg.insertBefore(ticks, svg.firstChild);

    /* klikbare gebeurtenispunten */
    var dotsG = mk('g', { class: 'hd-dots' });
    var dots = EVENTS.map(function (ev, k) {
      var p = pos(R, ev.t);
      var g = mk('g', { class: 'hd-dot', tabindex: '0', role: 'button' });
      g.appendChild(mk('circle', { cx: p[0].toFixed(2), cy: p[1].toFixed(2), r: 11, class: 'hd-hit' }));
      g.appendChild(mk('circle', { cx: p[0].toFixed(2), cy: p[1].toFixed(2), r: 4.2, class: 'hd-pip' }));
      var title = mk('title', {});
      title.textContent = hhmm(ev.t) + ' — ' + ev.what;
      g.appendChild(title);
      g.addEventListener('click', function () { jump(k); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(k); }
      });
      dotsG.appendChild(g);
      return g;
    });
    svg.appendChild(dotsG);
    svg.appendChild(hand); /* wijzer bovenop */

    arc.style.strokeDasharray = CIRC.toFixed(2);

    function hhmm(t) {
      var h = Math.floor(t), m = Math.round((t - h) * 60);
      if (m === 60) { m = 0; h += 1; }
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }
    function render(t) {
      var p = t / 24;
      arc.style.strokeDashoffset = (CIRC * (1 - p)).toFixed(2);
      hand.setAttribute('transform', 'rotate(' + (p * 360).toFixed(2) + ' ' + CX + ' ' + CY + ')');
      if (clockEl) clockEl.textContent = hhmm(t);
    }
    function counts(upto) {
      var c = { a: BASE.a, b: BASE.b, c: BASE.c };
      for (var k = 0; k <= upto; k++) {
        var d = EVENTS[k].d;
        c.a += d.a || 0; c.b += d.b || 0; c.c += d.c || 0;
      }
      return [c.a, c.b, c.c];
    }
    function paint(k) {
      var ev = EVENTS[k];
      if (iconEl) iconEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + IC[ev.ic] + '"></path></svg>';
      if (whatEl) whatEl.textContent = ev.what;
      if (youEl) youEl.textContent = ev.you;
      root.classList.remove('is-beat');
      void root.offsetWidth;
      root.classList.add('is-beat');
      var c = counts(k);
      tally.forEach(function (el, n) {
        if (!el || el.textContent === String(c[n])) return;
        el.textContent = c[n];
        el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
      });
      each(dots, function (d, n) { d.classList.toggle('on', n <= k); });
    }

    /* twee onafhankelijke remmen: "hover" zolang de muis erop staat,
       "hold" gedurende 9 s nadat iemand zelf een punt aanklikte. */
    var i = -1, gen = 0, timer = 0, resumeT = 0, hover = false, hold = false;

    function armNext() {
      clearTimeout(timer);
      if (i < 0 || hover || hold || reduce) return; /* i < 0 = nog niet in beeld geweest */
      timer = setTimeout(function () { go(i + 1); }, 2900);
    }
    function go(n) {
      clearTimeout(timer);
      var my = ++gen; /* maakt een nog lopende tween stil */
      var next = ((n % EVENTS.length) + EVENTS.length) % EVENTS.length;
      var from = i < 0 || next === 0 ? START : EVENTS[i].t;
      if (next === 0) { each(dots, function (d) { d.classList.remove('on'); }); render(START); }
      i = next;
      var to = EVENTS[i].t;
      tween(reduce ? 0 : 820,
        function (p) { if (my === gen) render(from + (to - from) * easeInOut(p)); },
        function () { if (my !== gen) return; paint(i); armNext(); });
    }
    function jump(k) {
      hold = true;
      clearTimeout(resumeT);
      go(k);
      resumeT = setTimeout(function () { hold = false; armNext(); }, 9000);
    }

    if (canHover) {
      root.addEventListener('pointerenter', function () { hover = true; clearTimeout(timer); });
      root.addEventListener('pointerleave', function () { hover = false; armNext(); });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(timer); else armNext();
    });

    if (reduce) { render(EVENTS[EVENTS.length - 1].t); i = EVENTS.length - 1; paint(i); }
    else { render(START); onView(root, function () { go(0); }); }

    /* lichte 3D-kanteling van het hero-tafereel */
    var stage = document.getElementById('heroStage');
    if (stage && canHover && !reduce) {
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        stage.style.setProperty('--tx', (x * 7).toFixed(2) + 'deg');
        stage.style.setProperty('--ty', (-y * 5).toFixed(2) + 'deg');
      });
      stage.addEventListener('pointerleave', function () {
        stage.style.setProperty('--tx', '0deg');
        stage.style.setProperty('--ty', '0deg');
      });
    }
  })();

  /* ============================================================
     3. WERKWIJZE — één stap tegelijk, vastgeprikt tijdens scrollen
     ============================================================ */
  (function pinnedSteps() {
    var wrap = document.getElementById('pinSteps');
    if (!wrap) return;
    var cards = wrap.querySelectorAll('.pin-card');
    var rail = wrap.querySelectorAll('.pin-rail li');
    var fill = wrap.querySelector('.pin-fill');
    if (!cards.length) return;

    var wide = window.matchMedia('(min-width: 901px)');
    var active = -1;
    /* sticky werkt alleen als <body> geen scroll-container is (zie de
       overflow-x-noot in home-redesign.css). Meet het gewoon na. */
    var canPin = getComputedStyle(document.body).overflowX === 'visible';

    function setActive(n) {
      if (n === active) return;
      active = n;
      each(cards, function (c, k) {
        c.classList.toggle('is-on', k === n);
        c.classList.toggle('is-past', k < n);
      });
      each(rail, function (r, k) {
        r.classList.toggle('is-on', k === n);
        r.classList.toggle('is-done', k < n);
      });
    }

    function enable(on) {
      wrap.classList.toggle('js-pin', on);
      if (on) { wrap.style.height = (cards.length * 85) + 'vh'; }
      else { wrap.style.height = ''; setActive(-1); if (fill) fill.style.transform = ''; }
    }

    function update() {
      if (!wrap.classList.contains('js-pin')) return;
      var r = wrap.getBoundingClientRect();
      var span = wrap.offsetHeight - window.innerHeight;
      if (span <= 0) return;
      var p = clamp(-r.top / span, 0, 1);
      /* laat de laatste stap ook echt even staan */
      var n = clamp(Math.floor(p * cards.length * 0.999), 0, cards.length - 1);
      setActive(n);
      if (fill) fill.style.transform = 'scaleY(' + ((n + 1) / cards.length).toFixed(3) + ')';
    }

    function sync() {
      enable(canPin && wide.matches && !reduce);
      update();
    }
    if (wide.addEventListener) wide.addEventListener('change', sync);
    else if (wide.addListener) wide.addListener(sync);
    sync();
    onScroll(update);
  })();

  /* ============================================================
     4. ZWEVENDE GLASPANELEN (integraties)
     ============================================================ */
  (function floaters() {
    var stages = document.querySelectorAll('[data-float-stage]');
    if (!stages.length) return;
    each(stages, function (stage) {
      var panels = stage.querySelectorAll('[data-depth]');
      if (!panels.length) return;
      /* binnenkomst: één voor één omhoog */
      onView(stage, function () {
        each(panels, function (p, k) {
          setTimeout(function () { p.classList.add('in'); }, reduce ? 0 : k * 90);
        });
      });
      if (reduce || !canHover) return;
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        stage.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        stage.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
      stage.addEventListener('pointerleave', function () {
        stage.style.setProperty('--px', '0');
        stage.style.setProperty('--py', '0');
      });
    });
  })();

  /* ============================================================
     5. CASE-GRAFIEKEN
     ============================================================ */

  /* 5a. ringdiagram met hover-uitleg */
  each(document.querySelectorAll('[data-ring]'), function (ring) {
    var segs = ring.querySelectorAll('.rg-seg');
    var keys = ring.parentNode.querySelectorAll('.rg-key li');
    var nEl = ring.querySelector('.rg-n');
    var lEl = ring.querySelector('.rg-l');
    var R = 88, CIRC = 2 * Math.PI * R;
    var vals = [], total = 0;
    each(segs, function (s) { var v = parseFloat(s.getAttribute('data-v')) || 0; vals.push(v); total += v; });
    if (!total) return;

    var home = { n: nEl ? nEl.textContent : '', l: lEl ? lEl.textContent : '' };
    var acc = 0;
    var geo = vals.map(function (v) {
      var len = CIRC * (v / total);
      var o = acc; acc += len;
      return { len: len, off: o };
    });

    each(segs, function (s, k) {
      s.style.strokeDasharray = '0 ' + CIRC.toFixed(2);
      s.style.strokeDashoffset = (-geo[k].off).toFixed(2);
    });
    onView(ring, function () {
      tween(1000, function (p) {
        var e = easeOut(p);
        each(segs, function (s, k) {
          s.style.strokeDasharray = (geo[k].len * e).toFixed(2) + ' ' + (CIRC - geo[k].len * e).toFixed(2);
        });
      });
    });

    function focus(k) {
      each(segs, function (s, n) { s.classList.toggle('dim', k !== null && n !== k); });
      each(keys, function (li, n) { li.classList.toggle('on', k !== null && n === k); });
      if (!nEl || !lEl) return;
      if (k === null) { nEl.textContent = home.n; lEl.textContent = home.l; return; }
      nEl.textContent = fmt(vals[k], 0);
      lEl.textContent = (keys[k] ? keys[k].getAttribute('data-l') || '' : '') +
        ' · ' + fmt(vals[k] / total * 100, 1) + '%';
    }
    each(keys, function (li, k) {
      li.addEventListener('pointerenter', function () { focus(k); });
      li.addEventListener('pointerleave', function () { focus(null); });
      li.addEventListener('focus', function () { focus(k); });
      li.addEventListener('blur', function () { focus(null); });
    });
    each(segs, function (s, k) {
      s.addEventListener('pointerenter', function () { focus(k); });
      s.addEventListener('pointerleave', function () { focus(null); });
    });
  });

  /* 5b. staafdiagram: animeren + wisselen tussen aantal en aandeel */
  each(document.querySelectorAll('[data-bars]'), function (box) {
    var bars = box.querySelectorAll('.cs-bar');
    if (!bars.length) return;
    var vals = [], total = 0, max = 0;
    each(bars, function (b) {
      var v = parseFloat(b.getAttribute('data-v')) || 0;
      vals.push(v); total += v; if (v > max) max = v;
    });
    if (!max) return;

    var mode = 'n';
    function label(k) {
      var v = bars[k].querySelector('.bv');
      if (!v) return;
      v.textContent = mode === 'n' ? fmt(vals[k], 0) : fmt(vals[k] / total * 100, 1) + '%';
    }
    each(bars, function (b, k) {
      var f = b.querySelector('.bf');
      if (f) f.style.width = '0%';
      label(k);
    });
    onView(box, function () {
      tween(1100, function (p) {
        var e = easeOut(p);
        each(bars, function (b, k) {
          var f = b.querySelector('.bf');
          if (f) f.style.width = (vals[k] / max * 100 * e).toFixed(2) + '%';
        });
      });
    });

    var btns = box.parentNode.querySelectorAll('[data-mode]');
    each(btns, function (btn) {
      btn.addEventListener('click', function () {
        mode = btn.getAttribute('data-mode');
        each(btns, function (b) {
          var on = b === btn;
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        each(bars, function (b, k) { label(k); });
      });
    });
  });

  /* 5c. funnel */
  each(document.querySelectorAll('[data-funnel]'), function (fn) {
    var rows = fn.querySelectorAll('.fn-row');
    if (!rows.length) return;
    var top = parseFloat(rows[0].getAttribute('data-v')) || 1;
    each(rows, function (r) {
      var b = r.querySelector('.fn-fill');
      if (b) b.style.width = '0%';
    });
    onView(fn, function () {
      each(rows, function (r, k) {
        var v = parseFloat(r.getAttribute('data-v')) || 0;
        var b = r.querySelector('.fn-fill');
        var pc = r.querySelector('.fn-pc');
        if (pc) pc.textContent = fmt(v / top * 100, 1) + '%';
        if (!b) return;
        setTimeout(function () {
          tween(900, function (p) { b.style.width = (v / top * 100 * easeOut(p)).toFixed(2) + '%'; });
        }, reduce ? 0 : k * 140);
      });
    });
  });

})();
