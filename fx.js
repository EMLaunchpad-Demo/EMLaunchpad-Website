/* =============================================================
   EM Launchpad — interactieve effecten
   • hero-lines  : "één draad", een bol uit bewegende lijnen (homepage)
   • pinned steps: werkwijze, één stap tegelijk in beeld
   • tellers     : cijfers die meelopen zodra ze in beeld komen
   • logoveld    : integratielogo's die traag door de sectie zweven
   • case-grafiek: ring, staven en funnel op de case-pagina
   • blauw uur   : lichtvelden in de merkkleuren die meereizen (homepage)
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
     2. HERO — "één draad": een bol uit gewonden lijnen
     Losse draden (je losse tools) trekken bij het laden samen tot
     één rustig draaiende bol (één systeem). Lichtpulsen over de
     draden zijn boekingen, oproepen en reviews die binnenkomen.
     De muis kantelt de bol en duwt de draden zacht opzij.
     Canvas 2D, geen libraries; stilstaand beeld bij reduced motion.
     ============================================================ */
  (function heroLines() {
    var root = document.querySelector('[data-lines-hero]');
    if (!root) return;
    var cv = root.querySelector('.hl-canvas');
    var stage = root.querySelector('.hl-stage');
    var ctx = cv && cv.getContext && cv.getContext('2d');
    if (!ctx || !stage) return;
    var tags = [].slice.call(root.querySelectorAll('.hl-tag'));
    /* [poolhoek, lengtegraad] van de labels op het oppervlak */
    var TAGPOS = [[1.05, 0.2], [1.75, 1.45], [2.35, 2.75], [0.7, 3.9], [1.95, 5.05]];

    var W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R = 0, small = null, strands = [];
    var rotY = 0.8, tilt = 0, tiltT = 0, yaw = 0, yawT = 0, mx = -1e4, my = -1e4;
    var u = reduce ? 1 : 0, introAt = -1, last = 0, raf = 0, running = false, onScreen = true;
    var pulses = [], nextPulse = 0, tagW = [];
    var CH = 8; /* punten per getekend stukje: diepte per stukje */

    function rng(seed) {
      return function () {
        seed = seed + 0x6D2B79F5 | 0;
        var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    /* twee families spiralen, in tegengestelde richting gewonden: een kluwen */
    function build() {
      var r = rng(11);
      var fam = small ? 4 : 6, n = small ? 220 : 340, turns = small ? 6 : 7.5;
      strands = [];
      for (var d = 0; d < 2; d++) {
        var dir = d ? -1 : 1;
        for (var s = 0; s < fam; s++) {
          var ph = (s + d * 0.5) / fam * Math.PI * 2;
          var P = new Float32Array(n * 2);
          for (var i = 0; i < n; i++) {
            var v = i / (n - 1);
            P[i * 2] = 0.1 + v * (Math.PI - 0.2);
            P[i * 2 + 1] = dir * turns * Math.PI * 2 * v + ph;
          }
          strands.push({
            P: P, n: n, seed: r() * 20, loose: 0.8 + r() * 1.1, off: (r() - 0.5) * 1.4, lift: (r() - 0.5) * 0.9,
            X: new Float32Array(n), Y: new Float32Array(n), Z: new Float32Array(n)
          });
        }
      }
    }

    function size() {
      var hr = root.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      if (!hr.width || !sr.width) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hr.width; H = hr.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = sr.left - hr.left + sr.width / 2;
      cy = sr.top - hr.top + sr.height / 2;
      R = sr.width / 2 * 0.9;
      var s = W < 700;
      if (s !== small) { small = s; build(); }
      tagW = tags.map(function (el) { return el.offsetWidth; });
      return true;
    }

    /* 3D → scherm, met adem, losse intro-lussen en de muisbult */
    var cyw, syw, ct, st, e;
    function prep() {
      cyw = Math.cos(rotY + yaw); syw = Math.sin(rotY + yaw);
      ct = Math.cos(tilt - 0.36); st = Math.sin(tilt - 0.36);
      e = easeInOut(u);
    }
    function proj(x, y, z, out) {
      var x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
      var y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      var f = 3.4 / (3.4 - z2);
      out[0] = cx + x1 * R * f; out[1] = cy - y2 * R * f; out[2] = z2;
    }
    var tmp = [0, 0, 0];
    function project(time) {
      prep();
      var B = small ? 70 : 110, B2 = B * B, push = small ? 12 : 20;
      for (var k = 0; k < strands.length; k++) {
        var S = strands[k], P = S.P, n = S.n, lo0 = 1 - e;
        for (var i = 0; i < n; i++) {
          var phi = P[i * 2], th = P[i * 2 + 1], v = i / (n - 1);
          var br = 1 + 0.034 * Math.sin(3 * th + time * 0.9 + S.seed) * Math.sin(2 * phi - time * 0.55);
          var rr = br * (1 + lo0 * (S.loose + 0.55 * Math.sin(S.seed + v * 5 + time * 0.4)));
          var sp = Math.sin(phi);
          proj(rr * sp * Math.cos(th) + lo0 * S.off, rr * Math.cos(phi) * (1 - lo0 * 0.3) + lo0 * S.lift, rr * sp * Math.sin(th), tmp);
          var X = tmp[0], Y = tmp[1];
          var dx = X - mx, dy = Y - my, d2 = dx * dx + dy * dy;
          if (d2 < B2 && d2 > 0.01) {
            var dd = Math.sqrt(d2), kk = (1 - dd / B); kk = kk * kk * push;
            X += dx / dd * kk; Y += dy / dd * kk;
          }
          S.X[i] = X; S.Y[i] = Y; S.Z[i] = tmp[2];
        }
      }
    }

    function depth(z) { var d = (z + 1.2) / 2.4; return d < 0 ? 0 : (d > 1 ? 1 : d); }

    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      var fade = clamp(0.25 + u * 1.2, 0, 1);
      for (var k = 0; k < strands.length; k++) {
        var S = strands[k], X = S.X, Y = S.Y, Z = S.Z, n = S.n;
        for (var i = 0; i < n - 1; i += CH) {
          var j = Math.min(i + CH, n - 1);
          var dp = depth((Z[i] + Z[j]) * 0.5);
          var a = (0.03 + 0.5 * dp * dp) * fade;
          ctx.strokeStyle = 'rgba(236,232,222,' + a.toFixed(3) + ')';
          ctx.lineWidth = 0.55 + 0.75 * dp;
          ctx.beginPath();
          ctx.moveTo(X[i], Y[i]);
          for (var q = i + 1; q <= j; q++) ctx.lineTo(X[q], Y[q]);
          ctx.stroke();
        }
      }
      /* lichtpulsen: een boeking, oproep of review die binnenkomt */
      for (var p = pulses.length - 1; p >= 0; p--) {
        var pu = pulses[p], T = strands[pu.k];
        if (!T) { pulses.splice(p, 1); continue; }
        pu.pos += pu.sp * dt;
        var head = Math.floor(pu.pos), tail = Math.max(0, head - pu.len);
        if (tail >= T.n - 1) { pulses.splice(p, 1); continue; }
        head = Math.min(head, T.n - 1);
        if (head - tail < 2) continue;
        var ad = depth(T.Z[head]), A = (0.25 + 0.75 * ad) * fade;
        var g = ctx.createLinearGradient(T.X[tail], T.Y[tail], T.X[head], T.Y[head]);
        g.addColorStop(0, 'rgba(47,116,224,0)');
        g.addColorStop(0.55, 'rgba(47,116,224,' + (A * 0.8).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(62,214,150,' + A.toFixed(3) + ')');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.2 + 1.2 * ad;
        ctx.beginPath();
        ctx.moveTo(T.X[tail], T.Y[tail]);
        for (var w = tail + 1; w <= head; w++) ctx.lineTo(T.X[w], T.Y[w]);
        ctx.stroke();
        ctx.fillStyle = 'rgba(120,236,180,' + A.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(T.X[head], T.Y[head], 1.6 + 1.4 * ad, 0, 6.2832); ctx.fill();
      }
    }

    function placeTags() {
      prep();
      var show = clamp((u - 0.8) / 0.2, 0, 1);
      each(tags, function (el, i) {
        var tp = TAGPOS[i % TAGPOS.length], sp = Math.sin(tp[0]), rr = 1.16;
        proj(rr * sp * Math.cos(tp[1]), rr * Math.cos(tp[0]), rr * sp * Math.sin(tp[1]), tmp);
        var vis = clamp((tmp[2] + 0.1) / 0.45, 0, 1) * show;
        var hw = (tagW[i] || 90) / 2 + 10;                    /* label blijft binnen het scherm */
        tmp[0] = clamp(tmp[0], hw, W - hw);
        el.style.transform = 'translate(' + tmp[0].toFixed(1) + 'px,' + tmp[1].toFixed(1) + 'px) translate(-50%,-50%) scale(' + (0.88 + 0.12 * vis).toFixed(3) + ')';
        el.style.opacity = vis.toFixed(3);
      });
    }

    function frame(ts) {
      raf = 0;
      if (!running) return;
      var time = ts / 1000, dt = last ? Math.min(0.05, time - last) : 0.016;
      last = time;
      if (introAt >= 0 && u < 1) u = clamp((time - introAt) / 2.8, 0, 1);
      rotY += dt * 0.16;
      tilt += (tiltT - tilt) * Math.min(1, dt * 3);
      yaw += (yawT - yaw) * Math.min(1, dt * 3);
      if (u >= 1 && time > nextPulse && pulses.length < (small ? 3 : 5)) {
        var k = Math.floor(Math.random() * strands.length);
        pulses.push({ k: k, pos: Math.random() * strands[k].n * 0.4, sp: (small ? 70 : 95) + Math.random() * 70, len: small ? 22 : 30 });
        nextPulse = time + 0.6 + Math.random() * 0.9;
      }
      project(time);
      draw(dt);
      placeTags();
      raf = requestAnimationFrame(frame);
    }
    function run() {
      if (running || reduce || !onScreen || document.hidden) return;
      running = true; last = 0;
      raf = requestAnimationFrame(frame);
    }
    function halt() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    function still() { project(0); draw(0); placeTags(); }

    if (!size()) return;
    root.classList.add('is-js');

    if (reduce) {
      root.classList.add('is-live');
      u = 1; still();
      window.addEventListener('resize', function () { if (size()) still(); });
      return;
    }

    /* muis: kantelen en de draden opzij duwen */
    if (canHover) {
      root.addEventListener('pointermove', function (ev) {
        var r = root.getBoundingClientRect();
        mx = ev.clientX - r.left; my = ev.clientY - r.top;
        tiltT = clamp((my - cy) / (H || 1), -0.5, 0.5) * 0.55;
        yawT = clamp((mx - cx) / (W || 1), -0.5, 0.5) * 0.9;
      });
      root.addEventListener('pointerleave', function () { mx = my = -1e4; tiltT = 0; yawT = 0; });
    }

    if ('ResizeObserver' in window) {
      var rq = false;
      new ResizeObserver(function () {
        if (rq) return; rq = true;
        requestAnimationFrame(function () { rq = false; size(); if (!running) still(); });
      }).observe(root);
    } else {
      window.addEventListener('resize', function () { size(); });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        each(entries, function (en) { onScreen = en.isIntersecting; if (onScreen) run(); else halt(); });
      }).observe(root);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) halt(); else run(); });

    /* de draden trekken samen zodra de hero echt zichtbaar is (na de loader) */
    function begin() { root.classList.add('is-live'); introAt = performance.now() / 1000 + 0.15; run(); }
    still();
    run();
    var loader = document.getElementById('loader');
    if (!loader) setTimeout(begin, 80);
    else {
      var started = false;
      var go = function () { if (started) return; started = true; if (mo) mo.disconnect(); setTimeout(begin, 200); };
      var mo = 'MutationObserver' in window ? new MutationObserver(function () {
        if (!document.body.contains(loader) || loader.classList.contains('done')) go();
      }) : null;
      if (mo) { mo.observe(loader, { attributes: true, attributeFilter: ['class'] }); mo.observe(document.body, { childList: true }); }
      setTimeout(go, 6000);
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

  /* ============================================================
     6. BLAUW UUR — twee lichtvelden (EM-blauw en gedempt groen)
        achter de hele homepage. Ze reizen mee met de scroll en
        komen onderaan samen. Alleen transform/opacity: goedkoop.
     ============================================================ */
  (function () {
    var sky = document.querySelector('[data-sky]');
    if (!sky) return;
    var fa = sky.querySelector('.sky-a'), fb = sky.querySelector('.sky-b');
    if (!fa || !fb) return;
    /* p = scrollpositie (0..1); x/y = middelpunt in % van het scherm; o = helderheid */
    var K = [
      { p: 0,    ax: 76, ay: 16, bx: 6,  by: 104, ao: 1,   bo: 0.55 },
      { p: 0.22, ax: 16, ay: 34, bx: 94, by: 78,  ao: 0.9, bo: 0.8 },
      { p: 0.48, ax: 86, ay: 72, bx: 12, by: 26,  ao: 0.9, bo: 0.9 },
      { p: 0.74, ax: 20, ay: 82, bx: 84, by: 20,  ao: 0.9, bo: 0.8 },
      { p: 1,    ax: 40, ay: 34, bx: 62, by: 40,  ao: 1,   bo: 1 }
    ];
    /* een pagina kan een eigen route meegeven: <div data-sky data-keys='[…]'> */
    try { var own = JSON.parse(sky.getAttribute('data-keys') || 'null'); if (own && own.length > 1) K = own; } catch (e) {}
    var KEYS = ['ax', 'ay', 'bx', 'by', 'ao', 'bo'];
    function target() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? clamp(window.scrollY / h, 0, 1) : 0;
      var i = 1;
      while (i < K.length - 1 && K[i].p < p) i++;
      var k0 = K[i - 1], k1 = K[i];
      var t = easeInOut(clamp((p - k0.p) / (k1.p - k0.p), 0, 1));
      var o = {};
      KEYS.forEach(function (n) { o[n] = k0[n] + (k1[n] - k0[n]) * t; });
      return o;
    }
    function put(s) {
      fa.style.transform = 'translate3d(calc(' + s.ax.toFixed(2) + 'vw - 50%),calc(' + s.ay.toFixed(2) + 'vh - 50%),0)';
      fb.style.transform = 'translate3d(calc(' + s.bx.toFixed(2) + 'vw - 50%),calc(' + s.by.toFixed(2) + 'vh - 50%),0)';
      fa.style.opacity = s.ao.toFixed(3);
      fb.style.opacity = s.bo.toFixed(3);
    }
    var cur = target();
    put(cur);
    if (reduce) return;        /* minder beweging: het licht blijft waar de pagina start */
    /* zacht naijlen, zodat het licht achter je scroll aan drijft */
    var raf = 0;
    function frame() {
      raf = 0;
      var t = target(), moving = false;
      KEYS.forEach(function (n) {
        var d = t[n] - cur[n];
        if (Math.abs(d) > 0.02) moving = true;
        cur[n] += d * 0.08;
      });
      put(cur);
      if (moving) raf = requestAnimationFrame(frame);
    }
    onScroll(function () { if (!raf) raf = requestAnimationFrame(frame); });
  })();

})();
