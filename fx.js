/* =============================================================
   EM Launchpad — interactieve effecten
   • hero-dial   : "een dag met je systeem" (24-uurs ring)
   • pinned steps: werkwijze, één stap tegelijk in beeld
   • tellers     : cijfers die meelopen zodra ze in beeld komen
   • logoveld    : integratielogo's die traag door de sectie zweven
   • case-grafiek: ring, staven en funnel op de case-pagina
   Alles is progressive enhancement: zonder JS blijft elke
   pagina gewoon leesbaar en volledig.
   ============================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  /* getalnotatie volgt de taal van de pagina: 40.340 / 40,340 / 40 340 */
  var NL = ({ en: 'en-GB', fr: 'fr-BE' })[(document.documentElement.lang || 'nl').slice(0, 2)] || 'nl-BE';

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
      { t: 14.08, ic: 'bell', what: 'Herinnering verstuurd', you: 'Jij hoefde niet te bellen.', d: {} },
      { t: 18.5, ic: 'cal', what: 'Nieuwe afspraak via Instagram', you: 'Jij was al naar huis.', d: { a: 1 } },
      { t: 21.17, ic: 'star', what: 'Review binnengekomen', you: 'Jij zat aan tafel.', d: { c: 1 } }
    ];
    /* de teller begint op nul en wordt door de zes gebeurtenissen opgebouwd —
       anders staat er al iets geteld vóór er die dag iets gebeurd is */
    var BASE = { a: 0, b: 0, c: 0 };
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
    var tallyLbl = [root.querySelector('.hd-al'), root.querySelector('.hd-bl'), root.querySelector('.hd-cl')];
    var LBL = [['afspraak', 'afspraken'], ['oproep opgevangen', 'oproepen opgevangen'], ['review', 'reviews']];
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
    /* Bewust NIET focusbaar: de hele dial is één role="img" met een label,
       en focusbare knoppen daarbinnen worden door screenreaders genegeerd
       terwijl ze wél in de tabvolgorde blijven staan. Klikken is een extraatje
       voor de muis; alle informatie staat al in het label en loopt vanzelf. */
    var dots = EVENTS.map(function (ev, k) {
      var p = pos(R, ev.t);
      var g = mk('g', { class: 'hd-dot' });
      g.appendChild(mk('circle', { cx: p[0].toFixed(2), cy: p[1].toFixed(2), r: 11, class: 'hd-hit' }));
      g.appendChild(mk('circle', { cx: p[0].toFixed(2), cy: p[1].toFixed(2), r: 4.2, class: 'hd-pip' }));
      var title = mk('title', {});
      title.textContent = hhmm(ev.t) + ' — ' + ev.what;
      g.appendChild(title);
      g.addEventListener('click', function () { jump(k); });
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
        if (!el) return;
        if (tallyLbl[n]) tallyLbl[n].textContent = LBL[n][c[n] === 1 ? 0 : 1];
        if (el.textContent === String(c[n])) return;
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

    var sec = wrap.closest ? wrap.closest('.steps-sec') : null;
    function enable(on) {
      wrap.classList.toggle('js-pin', on);
      if (sec) sec.classList.toggle('is-pinned', on); /* verbergt o.a. de scroll-hint */
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
     4. ZWEVEND LOGOVELD (integraties)
     Elke tegel dwaalt traag rond met een eigen koers, duwt zacht weg van
     randen, van andere tegels en van de kop, en krijgt een diepte: verder
     weg = kleiner, doffer, trager en minder muis-parallax.
     ============================================================ */
  (function logoField() {
    var field = document.querySelector('[data-logo-field]');
    if (!field) return;
    var sec = field.parentElement;
    var head = sec.querySelector('.sec-head');
    var tiles = Array.prototype.slice.call(field.querySelectorAll('.lf-tile'));
    if (!tiles.length) return;

    /* vaste "willekeur" (mulberry32): iedereen krijgt dezelfde startopstelling */
    var seed = 7;
    function rand() {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    function turn(a, b, k) { return a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k; }

    sec.classList.add('has-field');
    field.classList.add('is-live');

    var W = 0, H = 0, keep = null, parts = [];

    function measure() {
      W = field.clientWidth;
      var fr = field.getBoundingClientRect(), hr = head ? head.getBoundingClientRect() : null;
      keep = hr ? { l: hr.left - fr.left - 28, t: hr.top - fr.top - 28, r: hr.right - fr.left + 28, b: hr.bottom - fr.top + 36 }
                : { l: 0, t: 0, r: 0, b: 0 };
      /* genoeg ruimte onder de kop: op gsm wordt de sectie daardoor hoger */
      var base = clamp(W / 22, 40, 62), avg = base * 0.93;
      var need = keep.b + tiles.length * Math.pow(avg + 18, 2) * 1.6 / Math.max(W, 1) + 40;
      sec.style.minHeight = Math.ceil(need) + 'px';
      H = field.clientHeight;
      return base;
    }
    function inKeep(x, y, half) {
      return x + half > keep.l && x - half < keep.r && y + half > keep.t && y - half < keep.b;
    }

    function build() {
      var base = measure();
      parts = tiles.map(function (el) {
        var z = rand(), s = base * (0.72 + 0.42 * z);
        el.style.setProperty('--ts', s.toFixed(1) + 'px');
        el.style.setProperty('--o', (0.5 + 0.5 * z).toFixed(2));
        el.style.zIndex = String(1 + Math.round(z * 9));
        return { el: el, z: z, s: s, x: 0, y: 0, vx: 0, vy: 0, fx: 0, fy: 0,
                 a: rand() * Math.PI * 2, sp: 5 + 13 * z, ph: rand() * 100 };
      });
      /* startopstelling: verspreid, niet op de kop, niet op elkaar */
      parts.forEach(function (p, i) {
        for (var t = 0; t < 400; t++) {
          var x = p.s / 2 + rand() * (W - p.s), y = p.s / 2 + rand() * (H - p.s);
          if (inKeep(x, y, p.s / 2 + 6) && t < 399) continue;
          var ok = true;
          for (var j = 0; j < i; j++) {
            var q = parts[j], dx = x - q.x, dy = y - q.y, m = (p.s + q.s) / 2 + 12;
            if (dx * dx + dy * dy < m * m) { ok = false; break; }
          }
          if (ok || t === 399) { p.x = x; p.y = y; break; }
        }
      });
    }

    function tick(dt, now) {
      var n = parts.length, i, j, p, q;
      for (i = 0; i < n; i++) { parts[i].fx = 0; parts[i].fy = 0; }
      /* tegels duwen elkaar zacht weg */
      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          p = parts[i]; q = parts[j];
          var dx = p.x - q.x, dy = p.y - q.y, m = (p.s + q.s) / 2 + 16, d2 = dx * dx + dy * dy;
          if (d2 < m * m) {
            var d = Math.sqrt(d2) || 0.01, f = (m - d) / m * 70;
            dx /= d; dy /= d;
            p.fx += dx * f; p.fy += dy * f; q.fx -= dx * f; q.fy -= dy * f;
          }
        }
      }
      for (i = 0; i < n; i++) {
        p = parts[i];
        var M = p.s / 2 + 24, h = p.s / 2;
        if (p.x < M) p.fx += (M - p.x) * 1.6; else if (p.x > W - M) p.fx -= (p.x - (W - M)) * 1.6;
        if (p.y < M) p.fy += (M - p.y) * 1.6; else if (p.y > H - M) p.fy -= (p.y - (H - M)) * 1.6;
        /* weg van de kop, naar de dichtstbijzijnde kant */
        if (inKeep(p.x, p.y, h)) {
          var dl = p.x - (keep.l - h), dr = keep.r + h - p.x, dtp = p.y - (keep.t - h), db = keep.b + h - p.y;
          var mn = Math.min(dl, dr, dtp, db);
          if (mn === dl) p.fx -= 90; else if (mn === dr) p.fx += 90; else if (mn === dtp) p.fy -= 90; else p.fy += 90;
        }
        /* dwalen: de koers draait traag heen en weer */
        p.a += Math.sin(now * 0.0003 * (0.6 + p.z) + p.ph) * 0.45 * dt;
        var fm = Math.sqrt(p.fx * p.fx + p.fy * p.fy);
        if (fm > 1) p.a = turn(p.a, Math.atan2(p.fy, p.fx), Math.min(1, fm * 0.02) * dt * 2.2);
        p.vx += ((Math.cos(p.a) * p.sp - p.vx) * 0.7 + p.fx) * dt;
        p.vy += ((Math.sin(p.a) * p.sp - p.vy) * 0.7 + p.fy) * dt;
        var v = Math.sqrt(p.vx * p.vx + p.vy * p.vy), vmax = p.sp * 2.2;
        if (v > vmax) { p.vx *= vmax / v; p.vy *= vmax / v; }
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
    }

    var mx = 0, my = 0, tmx = 0, tmy = 0;
    function render() {
      mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], dpar = 6 + 30 * p.z;
        var x = p.x - p.s / 2 + mx * dpar, y = p.y - p.s / 2 + my * dpar;
        p.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      }
    }

    build();
    render();

    /* binnenkomst: rustig na elkaar zichtbaar */
    onView(field, function () {
      tiles.forEach(function (el, k) {
        setTimeout(function () { el.classList.add('in'); }, reduce ? 0 : Math.min(k * 40, 1800));
      });
    });

    if (canHover && !reduce) {
      sec.addEventListener('pointermove', function (e) {
        var r = sec.getBoundingClientRect();
        tmx = (e.clientX - r.left) / r.width - 0.5;
        tmy = (e.clientY - r.top) / r.height - 0.5;
      });
      sec.addEventListener('pointerleave', function () { tmx = 0; tmy = 0; });
    }

    /* bij resize: opnieuw meten en de tegels binnen het veld houden */
    var rt = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        measure();
        parts.forEach(function (p) {
          p.x = clamp(p.x, p.s / 2, Math.max(p.s / 2, W - p.s / 2));
          p.y = clamp(p.y, p.s / 2, Math.max(p.s / 2, H - p.s / 2));
        });
        render();
      }, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); });

    if (reduce) return; /* geen beweging: de verspreide startopstelling blijft staan */

    /* alleen animeren zolang de sectie in beeld is */
    var running = false, last = 0, raf = 0, visible = false;
    function loop(ts) {
      if (!running) return;
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts;
      tick(dt, ts);
      render();
      raf = requestAnimationFrame(loop);
    }
    function setRunning(on) {
      if (on === running) return;
      running = on;
      if (on) { last = 0; raf = requestAnimationFrame(loop); } else cancelAnimationFrame(raf);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        setRunning(visible && !document.hidden);
      }, { threshold: 0 }).observe(sec);
    } else { visible = true; setRunning(true); }
    document.addEventListener('visibilitychange', function () { setRunning(visible && !document.hidden); });
  })();

  /* ============================================================
     4b. TIJDLIJN — lijn groeit mee met scrollen (Over ons)
     <div data-scroll-fill> met kinderen [data-step]; zet --fill (0–1)
     en .is-reached op elke stap die de leeslijn gepasseerd heeft.
     ============================================================ */
  each(document.querySelectorAll('[data-scroll-fill]'), function (line) {
    var steps = line.querySelectorAll('[data-step]');
    onScroll(function () {
      var r = line.getBoundingClientRect();
      var mark = (window.innerHeight || 800) * 0.62; /* leeslijn iets onder het midden */
      line.style.setProperty('--fill', clamp((mark - r.top) / r.height, 0, 1).toFixed(3));
      each(steps, function (s) { s.classList.toggle('is-reached', s.getBoundingClientRect().top + 12 < mark); });
    });
  });

  /* ============================================================
     4c. INTERVIEW-SPELER (homepage) — eigen play-knop, "bioscoopstand"
     en een lichte 3D-kanteling zolang de video stilstaat.
     ============================================================ */
  each(document.querySelectorAll('[data-player]'), function (show) {
    var video = show.querySelector('video');
    var play = show.querySelector('.tm-play');
    var frame = show.querySelector('.tm-frame');
    if (!video || !play || !frame) return;

    play.addEventListener('click', function () {
      video.setAttribute('controls', '');       /* pas tonen zodra het speelt */
      var p = video.play();
      if (p && p.catch) p.catch(function () { video.setAttribute('controls', ''); });
    });
    video.addEventListener('play', function () {
      show.classList.add('is-playing');
      frame.style.setProperty('--tx', '0deg');
      frame.style.setProperty('--ty', '0deg');
    });
    /* bij pauze blijven de bedieningsknoppen staan, maar de rest komt terug */
    video.addEventListener('pause', function () { show.classList.remove('is-playing'); });
    video.addEventListener('ended', function () {
      show.classList.remove('is-playing');
      video.removeAttribute('controls');
      video.currentTime = 0;
    });

    if (!canHover || reduce) return;
    frame.addEventListener('pointermove', function (e) {
      if (show.classList.contains('is-playing')) return;
      var r = frame.getBoundingClientRect();
      frame.style.setProperty('--tx', (((e.clientX - r.left) / r.width - 0.5) * 6).toFixed(2) + 'deg');
      frame.style.setProperty('--ty', (-((e.clientY - r.top) / r.height - 0.5) * 4).toFixed(2) + 'deg');
    });
    frame.addEventListener('pointerleave', function () {
      frame.style.setProperty('--tx', '0deg');
      frame.style.setProperty('--ty', '0deg');
    });
  });

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

    /* pas op het laatste moment naar nul zetten: zolang dit niet gebeurt,
       blijven de stroke-dasharray-attributen uit de HTML staan en klopt de
       ring ook zonder (of vóór) JS */
    onView(ring, function () {
      each(segs, function (s, k) {
        s.style.strokeDasharray = '0 ' + CIRC.toFixed(2);
        s.style.strokeDashoffset = (-geo[k].off).toFixed(2);
      });
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
    each(bars, function (b, k) { label(k); });
    onView(box, function () {
      each(bars, function (b) {
        var f = b.querySelector('.bf');
        if (f) f.style.width = '0%';
      });
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
    onView(fn, function () {
      each(rows, function (r) {
        var b = r.querySelector('.fn-fill');
        if (b) b.style.width = '0%';
      });
      each(rows, function (r, k) {
        var v = parseFloat(r.getAttribute('data-v')) || 0;
        var b = r.querySelector('.fn-fill');
        var pc = r.querySelector('.fn-pc');
        if (pc) pc.textContent = fmt(v / top * 100, 0) + '%';
        if (!b) return;
        setTimeout(function () {
          tween(900, function (p) { b.style.width = (v / top * 100 * easeOut(p)).toFixed(2) + '%'; });
        }, reduce ? 0 : k * 140);
      });
    });
  });

})();
