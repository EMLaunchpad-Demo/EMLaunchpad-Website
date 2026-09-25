/* =============================================================
   EM Launchpad — AI-receptioniste ("Aan de lijn")
   1. tijdlijn : compile() geeft elk woord van een gesprek een tijd
   2. Line     : de telefoonlijn op canvas (rust, bellen, opnemen, spreken)
   3. Player   : één gesprek op een lijn + ondertitels + kaartjes
   4. geluid   : beltoon en klik via WebAudio, haar stem via spraaksynthese
   5. hero · 6. een dag aan de lijn · 7. fiche · 8. belstrook
   9. rekening · 10. stappen · 11. slot-CTA
   Alles is afgeleid van één tijd t, dus pauzeren, scrubben en
   terugspoelen werken vanzelf. Zonder JS of met minder beweging
   blijft alles leesbaar (statische lijn, transcript, fiche).
   ============================================================= */
(function () {
  'use strict';

  var src = document.getElementById('rcData');
  if (!src) return;
  var D;
  try { D = JSON.parse(src.textContent); } catch (e) { return; }
  var U = D.ui;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia('(max-width: 760px)');
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- hulpjes ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function mk(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function mmss(s) { s = Math.max(0, Math.round(s)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
  function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; }); }
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
  /* Belgische tijd (één formatter, niet elk frame een nieuwe) */
  var BRX = null;
  try { BRX = new Intl.DateTimeFormat('nl-BE', { timeZone: 'Europe/Brussels', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); } catch (e) {}
  function brussels() {
    try {
      if (!BRX) throw 0;
      var h = 0, m = 0;
      BRX.formatToParts(new Date()).forEach(function (x) { if (x.type === 'hour') h = +x.value; if (x.type === 'minute') m = +x.value; });
      return { h: h % 24, m: m };
    } catch (e) { var d = new Date(); return { h: d.getHours(), m: d.getMinutes() }; }
  }
  function nowHM() { var b = brussels(); return pad(b.h) + ':' + pad(b.m); }
  function greetFor(h) { var g = D.greet[0][1]; D.greet.forEach(function (x) { if (h >= x[0]) g = x[1]; }); return g; }
  function isClosed(h) { return h < D.open[0] || h >= D.open[1]; }
  function byId(id) { for (var i = 0; i < D.moments.length; i++) if (D.moments[i].id === id) return D.moments[i]; return null; }

  /* ============================================================
     1. TIJDLIJN
     ============================================================ */
  var LET = /[0-9A-Za-zÀ-ɏ]/g;
  function letters(w) { var m = w.match(LET); return m ? m.length : 0; }
  function syl(w) { var m = w.toLowerCase().match(/[aeiouyàâäéèêëïîôöùûü]+/g); return m ? m.length : 1; }
  function norm(w) { return w.toLowerCase().replace(/[^0-9a-zÀ-ɏ]/g, ''); }

  function compile(call, vars, ring) {
    var t = ring + 0.5, talk = t, prev = null, lastEnd = t, lines = [];
    call.lines.forEach(function (ln, li) {
      if (prev) t += prev === ln.who ? 0.25 : (prev === 'b' ? 0.35 : 0.5);
      var text = fill(vars && vars.closed && ln.t_closed ? ln.t_closed : ln.t, vars);
      var L = { i: li, who: ln.who, lang: ln.lang || D.lang, text: text, tr: ln.tr || '', note: ln.note || '', words: [], start: t, end: t };
      text.split(/\s+/).forEach(function (w) {
        if (!w) return;
        var d = Math.max(0.16, 0.10 + 0.055 * letters(w));
        L.words.push({ w: w, t0: t, t1: t + d, syl: syl(w) });
        t += d; lastEnd = t;
        if (/[,;:]$/.test(w)) t += 0.18; else if (/[.?!]$/.test(w)) t += 0.34;
      });
      t = lastEnd; L.end = lastEnd;
      lines.push(L); prev = ln.who;
    });
    var dur = lastEnd + 1.0;
    var events = (call.events || []).map(function (e) {
      var at, line = null, wi = -1;
      if (e.end) at = dur - 0.6;
      else {
        line = lines[e.line];
        if (e.word) {
          var key = norm(e.word);
          for (var i = 0; i < line.words.length; i++) if (norm(line.words[i].w).indexOf(key) === 0) { wi = i; break; }
          at = wi >= 0 ? line.words[wi].t0 + 0.1 : line.start + 0.2;
        } else at = e.after ? line.end + 0.1 : line.start + 0.2;
      }
      return { t: at, k: e.k, title: e.title, sub: e.sub, li: line ? line.i : -1, wi: wi };
    }).sort(function (a, b) { return a.t - b.t; });
    return { lines: lines, events: events, dur: dur, ring: ring, talk: talk, last: lastEnd };
  }
  function lineAt(c, t) {
    var lo = 0, hi = c.lines.length - 1, r = -1;
    while (lo <= hi) { var mid = (lo + hi) >> 1; if (c.lines[mid].start <= t) { r = mid; lo = mid + 1; } else hi = mid - 1; }
    return r;
  }
  function wordAt(L, t) { var r = -1; for (var i = 0; i < L.words.length; i++) { if (L.words[i].t0 <= t) r = i; else break; } return r; }
  function wEnv(w, t) {
    if (!w || t < w.t0 || t > w.t1 + 0.1) return 0;
    var a = Math.min(1, (t - w.t0) / 0.04), r = t > w.t1 ? 1 - (t - w.t1) / 0.1 : 1;
    var ph = Math.min(1, (t - w.t0) / (w.t1 - w.t0));
    return a * r * (0.55 + 0.45 * Math.abs(Math.sin(Math.PI * w.syl * ph)));
  }
  /* de toestand op tijd t: fase, zin, woord, spreker, envelop */
  function stateAt(c, t) {
    var s = { phase: 'idle', li: -1, wi: -1, who: null, env: 0, ring: 0, pick: -1 };
    if (t <= 0) return s;
    if (t < c.ring) {
      var ph = t % 1.6;
      s.phase = 'ring';
      s.ring = ph < 1 ? Math.min(1, ph / 0.08) * Math.min(1, (1 - ph) / 0.08) : 0;
      return s;
    }
    if (t < c.talk) { s.phase = 'pickup'; s.pick = (t - c.ring) / (c.talk - c.ring); return s; }
    if (t >= c.dur) {
      s.phase = 'end'; s.li = c.lines.length - 1;
      s.who = c.lines[s.li].who; s.wi = c.lines[s.li].words.length - 1;
      return s;
    }
    s.phase = 'talk';
    s.li = lineAt(c, t);
    if (s.li >= 0) {
      var L = c.lines[s.li];
      s.wi = wordAt(L, t); s.who = L.who;
      s.env = Math.max(wEnv(L.words[s.wi], t), wEnv(L.words[s.wi - 1], t));
    }
    return s;
  }

  /* ============================================================
     GEDEELDE rAF-PLANNER — draait alleen als er iets beweegt
     ============================================================ */
  var Loop = (function () {
    var fns = [], raf = 0, last = 0;
    /* raf blijft gezet tijdens een frame: wat in een frame wakker wordt,
       draait mee in het volgende frame (en vraagt geen extra frame aan) */
    function frame(ts) {
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 1 / 60;
      last = ts;
      var list = fns; fns = [];
      try {
        for (var i = 0; i < list.length; i++) {
          var keep = false;
          /* één kapotte animatie mag de rest niet stilleggen */
          try { keep = list[i](dt); } catch (err) { setTimeout(function () { throw err; }); }
          if (keep && fns.indexOf(list[i]) < 0) fns.push(list[i]);
        }
      } finally {
        if (fns.length) raf = requestAnimationFrame(frame); else { raf = 0; last = 0; }
      }
    }
    return { add: function (fn) { if (fns.indexOf(fn) < 0) fns.push(fn); if (!raf) raf = requestAnimationFrame(frame); } };
  })();

  /* ============================================================
     2. DE LIJN
     ============================================================ */
  function parseCol(s) {
    s = (s || '').trim();
    var m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) {
      var h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
    }
    m = s.match(/rgba?\(([^)]+)\)/i);
    if (m) { var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    return [243, 246, 250, 1];
  }
  function mixCol(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k]; }
  function rgba(c, al) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (c[3] * (al == null ? 1 : al)).toFixed(3) + ')'; }

  function Line(canvas, o) {
    this.c = canvas; this.x = canvas.getContext('2d'); this.o = o || {};
    this.env = 0; this.mix = 1; this.ring = 0; this.pick = -1; this.time = Math.random() * 10;
    this.tEnv = 0; this.tMix = 1;
    this.w = 0; this.h = 0; this.dpr = 1; this.n = 0; this.ys = null; this.noise = null; this.awake = false;
    var cs = getComputedStyle(document.body);
    this.cHer = parseCol(cs.getPropertyValue('--rc-her'));
    this.cCaller = parseCol(cs.getPropertyValue('--rc-caller'));
    this.cRest = parseCol(cs.getPropertyValue('--rc-line-rest'));
    this.gA = cs.getPropertyValue('--rc-glow-a').trim() || '#2f74e0';
    this.gB = cs.getPropertyValue('--rc-glow-b').trim() || '#2fbf86';
    var self = this;
    this.step = function (dt) { return self._step(dt); };
    this.size();
    if ('ResizeObserver' in window) new ResizeObserver(function () { if (self.size()) self.draw(); }).observe(canvas);
    else window.addEventListener('resize', function () { if (self.size()) self.draw(); });
    this.draw();
  }
  Line.prototype.size = function () {
    var r = this.c.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, mobile.matches ? 1.5 : 2);
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (w === this.w && h === this.h && dpr === this.dpr) return false;
    this.w = w; this.h = h; this.dpr = dpr;
    this.c.width = Math.round(w * dpr); this.c.height = Math.round(h * dpr);
    this.n = Math.round(clamp(w / 4, 90, mobile.matches ? 140 : 240));
    this.ys = new Float32Array(this.n);
    this.noise = new Float32Array(this.n);
    for (var i = 0, s = 7; i < this.n; i++) { s = (s * 9301 + 49297) % 233280; this.noise[i] = s / 233280 * 2 - 1; }
    return true;
  };
  Line.prototype.amp = function () { return mobile.matches ? (this.o.ampM || this.o.amp * 0.6) : this.o.amp; };
  Line.prototype.set = function (env, mix, ring, pick) {
    this.tEnv = env; this.tMix = mix; this.ring = ring; this.pick = pick;
    this.wake();
  };
  Line.prototype.wake = function () { if (!this.awake) { this.awake = true; Loop.add(this.step); } };
  Line.prototype._step = function (dt) {
    this.time += dt;
    this.env += (this.tEnv - this.env) * (1 - Math.exp(-dt / 0.06));
    this.mix += (this.tMix - this.mix) * (1 - Math.exp(-dt / 0.085));
    this.draw();
    var busy = this.env > 0.003 || this.tEnv > 0 || this.ring > 0 || this.pick >= 0 || Math.abs(this.mix - this.tMix) > 0.01;
    if (!busy) { this.env = 0; this.draw(); this.awake = false; }
    return busy;
  };
  Line.prototype.draw = function () {
    var x = this.x, w = this.w, h = this.h, n = this.n, ys = this.ys, y0 = h * (this.o.y || 0.5), A = this.amp();
    if (!n) return;
    x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    x.clearRect(0, 0, w, h);
    var env = this.env, mix = this.mix, T = this.time, ring = this.ring, pk = this.pick, TAU = Math.PI * 2;
    var strength = clamp(env * 2.4 + ring + (pk >= 0 ? 1 : 0), 0, 1);
    for (var i = 0; i < n; i++) {
      var u = i / (n - 1), win = Math.pow(Math.sin(Math.PI * u), 1.4), y = 0;
      if (env > 0.002) {
        var her = 0.58 * Math.sin(TAU * 1.3 * u - 2.1 * T + 0.3) + 0.30 * Math.sin(TAU * 2.4 * u - 3.3 * T + 1.1) + 0.12 * Math.sin(TAU * 3.7 * u - 4.6 * T + 2.2);
        var cal = 0.42 * Math.sin(TAU * 2.3 * u - 2.6 * T + 0.7) + 0.36 * Math.sin(TAU * 4.9 * u - 4.1 * T + 1.9) + 0.22 * Math.sin(TAU * 8.7 * u - 6.3 * T + 0.4);
        y += A * env * win * (cal + (her - cal) * mix);
        y += (1 - mix) * env * win * this.noise[i] * 1.3;
      }
      if (ring > 0) y += 7 * ring * win * Math.sin(TAU * 30 * u - 55 * T);
      if (pk >= 0) { var cx = -0.1 + 1.2 * pk, d = u - cx; y -= 16 * Math.exp(-(d * d) / 0.0128) * win; }
      ys[i] = y0 + y;
    }
    var step = w / (n - 1);
    function path() {
      x.beginPath(); x.moveTo(0, ys[0]);
      for (var k = 1; k < n - 1; k++) x.quadraticCurveTo(k * step, ys[k], (k + 0.5) * step, (ys[k] + ys[k + 1]) / 2);
      x.lineTo(w, ys[n - 1]);
    }
    x.lineJoin = 'round'; x.lineCap = 'round';
    /* gloed onder haar stem: de onderlijning van de koppen */
    if (mix > 0.05 && env > 0.01 && this.o.glow !== false) {
      var g = x.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, this.gA); g.addColorStop(1, this.gB);
      x.save(); x.translate(0, 3); x.globalAlpha = clamp(0.45 * env * 1.6 * mix, 0, 0.5);
      x.strokeStyle = g; x.lineWidth = 5; path(); x.stroke(); x.restore();
    }
    var active = mixCol(this.cCaller, this.cHer, mix);
    x.strokeStyle = rgba(mixCol(this.cRest, active, strength));
    x.lineWidth = 1 + strength * ((1.2 + 0.5 * mix) - 1);
    path(); x.stroke();
    /* zachte uiteinden */
    x.globalCompositeOperation = 'destination-in';
    var f = x.createLinearGradient(0, 0, w, 0);
    f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(0.05, '#000'); f.addColorStop(0.95, '#000'); f.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = f; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'source-over';
  };
  /* het punt met de grootste uitslag, in schermcoördinaten (startpunt van een vonkje) */
  Line.prototype.peak = function () {
    var r = this.c.getBoundingClientRect(), y0 = this.h * (this.o.y || 0.5), best = Math.floor(this.n / 2), bd = -1;
    for (var i = 0; i < this.n; i++) { var d = Math.abs(this.ys[i] - y0); if (d > bd) { bd = d; best = i; } }
    return { x: r.left + best / (this.n - 1) * r.width, y: r.top + this.ys[best] };
  };

  /* vonkje van de lijn naar een kaartje */
  function spark(from, toEl, done) {
    if (reduce || !toEl || !from || !document.body.animate) { done(); return; }
    var r = toEl.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > window.innerHeight) { done(); return; }
    var tx = r.left + r.width / 2, ty = r.top + r.height / 2;
    var cx = (from.x + tx) / 2, cy = Math.min(from.y, ty) - (mobile.matches ? 60 : 120);
    var el = mk('i', 'rc-spark'), kf = [];
    for (var k = 0; k <= 12; k++) {
      var p = k / 12, q = 1 - p;
      var x = q * q * from.x + 2 * q * p * cx + p * p * tx, y = q * q * from.y + 2 * q * p * cy + p * p * ty;
      kf.push({ transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (1 - 0.25 * p).toFixed(2) + ')', opacity: k === 12 ? 0.3 : 1 });
    }
    document.body.appendChild(el);
    var a = el.animate(kf, { duration: 700, easing: 'cubic-bezier(.2,.7,.2,1)' });
    var fin = function () { if (el.parentNode) el.remove(); done(); };
    a.onfinish = fin; a.oncancel = fin;
  }

  /* ============================================================
     4. GELUID (nooit automatisch: alleen na een klik)
     ============================================================ */
  var Snd = {
    on: false, ctx: null, nodes: [], mur: null, murG: null, buf: null,
    unlock: function () {
      /* Safari 17+: ook hoorbaar als de stilteschakelaar aan staat */
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC && !this.ctx) this.ctx = new AC();
        if (this.ctx && this.ctx.state !== 'running') this.ctx.resume();
      } catch (e) { this.ctx = null; }
      try {
        if ('speechSynthesis' in window) { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; window.speechSynthesis.speak(u); }
      } catch (e) {}
    },
    sleep: function () { try { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); } catch (e) {} },
    tone: function (f, at, len, peak) {
      var c = this.ctx, self = this; if (!c) return;
      var o = c.createOscillator(), g = c.createGain(), hp = c.createBiquadFilter(), lp = c.createBiquadFilter();
      o.type = 'sine'; o.frequency.value = f;
      hp.type = 'highpass'; hp.frequency.value = 300; lp.type = 'lowpass'; lp.frequency.value = 3400;
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak, at + 0.015);
      g.gain.setValueAtTime(peak, at + len - 0.015); g.gain.linearRampToValueAtTime(0, at + len);
      o.connect(hp); hp.connect(lp); lp.connect(g); g.connect(c.destination);
      o.onended = function () { var i = self.nodes.indexOf(o); if (i >= 0) self.nodes.splice(i, 1); };
      o.start(at); o.stop(at + len + 0.02);
      this.nodes.push(o);
    },
    ring: function (left) {
      if (!this.ctx) return;
      var t = this.ctx.currentTime + 0.02;
      for (var k = 0; k * 1.6 < left - 0.05; k++) this.tone(425, t + k * 1.6, Math.min(1, left - k * 1.6), 0.06);
    },
    stop: function () {
      this.nodes.forEach(function (o) { try { o.stop(); } catch (e) {} });
      this.nodes = [];
      if (this.mur) { try { this.mur.stop(); } catch (e) {} try { this.mur.disconnect(); } catch (e) {} this.mur = this.murG = null; }
    },
    noiseBuf: function () {
      if (this.buf) return this.buf;
      var c = this.ctx, b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return (this.buf = b);
    },
    pick: function () {
      var c = this.ctx; if (!c) return;
      var s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime;
      s.buffer = this.noiseBuf(); bp.type = 'bandpass'; bp.frequency.value = 1800;
      g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.03);
      s.connect(bp); bp.connect(g); g.connect(c.destination); s.start(t); s.stop(t + 0.04);
    },
    hang: function () {
      if (!this.ctx) return;
      var t = this.ctx.currentTime + 0.02;
      for (var k = 0; k < 3; k++) this.tone(425, t + k * 0.3, 0.15, 0.05);
    },
    /* de beller: geen tweede robotstem, maar een zacht 'stem aan de lijn' */
    murmur: function (env) {
      var c = this.ctx; if (!c) return;
      if (!this.mur && env > 0) {
        var s = c.createBufferSource(), hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), g = c.createGain();
        s.buffer = this.noiseBuf(); s.loop = true;
        hp.type = 'highpass'; hp.frequency.value = 300; lp.type = 'lowpass'; lp.frequency.value = 3400;
        g.gain.value = 0; s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(c.destination); s.start();
        this.mur = s; this.murG = g;
      }
      if (this.murG) this.murG.gain.setTargetAtTime(0.025 * env, c.currentTime, 0.03);
    }
  };
  /* stemmen laden in Safari en Firefox pas later: bijhouden via voiceschanged */
  var VOICES = [];
  function loadVoices() { try { VOICES = window.speechSynthesis.getVoices() || []; } catch (e) { VOICES = []; } }
  if ('speechSynthesis' in window) { loadVoices(); try { window.speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch (e) {} }
  function pickVoice(lang) {
    if (!('speechSynthesis' in window)) return null;
    if (!VOICES.length) loadVoices();
    var best = null, bs = -99, re = new RegExp(D.voices.allow, 'i');
    VOICES.forEach(function (v) {
      var vl = (v.lang || '').toLowerCase().replace('_', '-');
      if (vl.indexOf(lang) !== 0) return;
      var s = 1;                                   /* de juiste taal is al bruikbaar (bv. Android) */
      if (re.test(v.name)) s += 4;                 /* natuurlijke of netwerkstem */
      if (D.voices.her.some(function (n) { return v.name.indexOf(n) >= 0; })) s += 3;
      if (/eSpeak|Compact/i.test(v.name)) s -= 6;  /* robotstemmen */
      if ((D.voices.him || []).some(function (n) { return v.name.indexOf(n) >= 0; })) s -= 5;   /* zij is een zij */
      if (vl === lang + '-be') s += 0.5;
      if (s > bs) { bs = s; best = v; }
    });
    return bs >= 1 ? best : null;
  }
  var soundBtns = [];
  /* één patroon voor de geluidsknoppen: het label zegt wat een klik doet */
  function setSound(on) {
    Snd.on = on;
    soundBtns.forEach(function (b) {
      b.classList.toggle('is-on', on);
      b.removeAttribute('aria-pressed');
      var sp = b.querySelector('span');
      if (sp) sp.textContent = on ? (b.getAttribute('data-on') || U.sound_off) : (b.getAttribute('data-off') || U.sound_on);
    });
    if (!on) {
      players.forEach(function (p) { p.stopVoice(); });
      try { window.speechSynthesis.cancel(); } catch (e) {}
      Snd.stop(); Snd.sleep();
      $$('[data-novoice]').forEach(function (n) { n.hidden = true; });
    }
  }

  /* ============================================================
     3. DE SPELER
     ============================================================ */
  var players = [];
  function Player(o) {
    this.o = o; this.c = null; this.t = 0; this.playing = false; this.user = false; this.userRun = false;
    this.li = -2; this.wi = -2; this.shown = 0; this.spoken = -1; this.utt = null; this.rang = false;
    this.gen = 0;                                  /* ongeldig maken van vonkjes van een vorig gesprek */
    var self = this;
    this.tick = function (dt) { return self._tick(dt); };
    players.push(this);
  }
  Player.prototype.load = function (call, vars, ring) {
    this.pause();
    this.gen++;
    this.c = compile(call, vars, ring);
    this.t = 0; this.li = -2; this.wi = -2; this.shown = -1; this.rang = false;
    var o = this.o;
    if (o.cards) {
      o.cards.innerHTML = '';
      this.cards = this.c.events.map(function (e) {
        var li = mk('li', 'rc-card'); li.setAttribute('data-k', e.k);
        var ic = mk('span', 'rc-ic'); ic.innerHTML = ICON(e.k); li.appendChild(ic);
        var ct = mk('span', 'rc-ct'); ct.appendChild(mk('b', null, e.title)); ct.appendChild(mk('small', null, e.sub)); li.appendChild(ct);
        li.appendChild(mk('span', 'rc-slot', (U.slot && U.slot[e.k]) || ''));
        o.cards.appendChild(li);
        return li;
      });
    }
    this.render(true);
    return this.c;
  };
  Player.prototype.play = function (user) {
    if (!this.c) return false;
    var self = this;
    /* een automatische start wijkt voor een gesprek dat de bezoeker zelf startte */
    if (!user && players.some(function (p) { return p !== self && p.playing && p.userRun; })) return false;
    if (this.t >= this.c.dur) this.seek(0);
    players.forEach(function (p) { if (p !== self && p.playing) p.pause(); });
    if (Snd.on) Snd.unlock();
    if (this.t < this.c.ring) this.rang = false;
    this.playing = true; this.userRun = !!user; this.user = !!user || this.user;
    this.spoken = -1;
    Loop.add(this.tick);
    if (this.o.onPlay) this.o.onPlay(this);
    return true;
  };
  Player.prototype.pause = function () {
    var was = this.playing;
    this.playing = false; this.userRun = false;
    if (was) { this.stopVoice(); Snd.stop(); }
    this.rest();
    if (was && this.o.onPause) this.o.onPause(this);
  };
  /* de lijn komt tot rust als er niet gespeeld wordt (geen eindeloos tekenen buiten beeld) */
  Player.prototype.rest = function () { if (this.o.line) this.o.line.set(0, this.o.line.tMix, 0, -1); };
  Player.prototype.seek = function (t) {
    if (this.playing) { this.stopVoice(); Snd.stop(); }
    this.gen++;
    this.t = clamp(t, 0, this.c.dur); this.rang = this.t >= this.c.ring; this.spoken = -1;
    this.render(true);
  };
  Player.prototype.stopVoice = function () {
    if (this.utt) { this.utt = null; try { window.speechSynthesis.cancel(); } catch (e) {} }
  };
  Player.prototype._tick = function (dt) {
    if (!this.playing) return false;
    var c = this.c, prev = this.t, t = prev + dt;
    if (Snd.on) t = this.sound(prev, t);
    this.t = t;
    if (t >= c.dur) {
      this.t = c.dur; this.render(false);
      this.playing = false; this.userRun = false; this.stopVoice(); Snd.stop();
      if (this.o.onEnd) this.o.onEnd(this);
      return false;
    }
    this.render(false);
    return true;
  };
  /* met geluid volgt de klok haar stem: ze houdt op het einde van haar zin tot de stem klaar is */
  Player.prototype.sound = function (prev, t) {
    var c = this.c;
    if (prev < c.ring && !this.rang) { this.rang = true; Snd.ring(c.ring - prev); }
    if (prev < c.ring && t >= c.ring) Snd.pick();
    var li = lineAt(c, t), L = li >= 0 ? c.lines[li] : null;
    if (L && L.who === 'r' && t >= L.start && t < L.end + 0.05) {
      if (this.spoken !== li) { this.spoken = li; this.speak(L, t); }
      /* waakhond: meldt de stem nooit 'klaar', dan gaat de klok toch verder */
      if (this.utt && performance.now() - this.uttAt > this.uttMax) { this.stopVoice(); if (t < L.end) t = L.end; }
      if (this.utt) t = Math.min(t, L.end - 0.02);
    }
    var s = stateAt(c, t);
    Snd.murmur(s.who === 'b' && s.phase === 'talk' ? s.env : 0);
    if (prev < c.last + 0.15 && t >= c.last + 0.15) Snd.hang();
    return t;
  };
  Player.prototype.speak = function (L, t) {
    var self = this, v = pickVoice(L.lang);
    if (!v) {
      /* stemmen nog niet geladen: even opnieuw proberen */
      if (!VOICES.length) {
        if (!this.vWait) this.vWait = performance.now();
        if (performance.now() - this.vWait < 1500) { this.spoken = -1; return; }
      }
      if (this.o.onNoVoice) this.o.onNoVoice(L.lang);
      return;
    }
    this.vWait = 0;
    if (this.o.onVoice) this.o.onVoice();
    var from = Math.max(0, wordAt(L, t)), words = L.words.slice(from), text = '', map = [];
    words.forEach(function (w, k) { map.push(text.length); text += (k ? ' ' : '') + w.w; if (k) map[k] += 1; });
    var u = new SpeechSynthesisUtterance(text);
    u.voice = v; u.lang = v.lang; u.rate = 1; u.pitch = 1;
    u.onboundary = function (e) {
      if (self.utt !== u || e.name === 'sentence') return;
      var k = 0; while (k + 1 < map.length && map[k + 1] <= e.charIndex) k++;
      var w = words[k]; if (w && self.t < w.t0) self.t = w.t0;
    };
    u.onend = u.onerror = function () { if (self.utt === u) { self.utt = null; if (self.t < L.end) self.t = L.end; } };
    this.utt = u;
    this.uttAt = performance.now();
    this.uttMax = 3000 + (L.end - Math.max(t, L.start)) * 2500;
    try { window.speechSynthesis.speak(u); } catch (e) { this.utt = null; }
  };
  Player.prototype.render = function (jump) {
    var c = this.c, o = this.o, s = stateAt(c, this.t), live = this.playing && !reduce;
    if (o.line) o.line.set(live ? s.env : 0, s.who === 'b' ? 0 : 1, live ? s.ring : 0, live && s.phase === 'pickup' ? s.pick : -1);
    if (s.li !== this.li) this.buildSubs(s.li);
    if (s.li >= 0) this.words(s.phase === 'end' || reduce ? 1e9 : s.wi);
    var n = 0; while (n < c.events.length && c.events[n].t <= this.t) n++;
    if (n !== this.shown) this.events(n, jump || !this.playing);
    if (o.onState) o.onState(s, this);
  };
  Player.prototype.buildSubs = function (li) {
    var o = this.o, c = this.c, self = this;
    this.li = li; this.wi = -2; this.spans = [];
    if (!o.subs) return;
    o.subs.innerHTML = '';
    var P = li > 0 ? c.lines[li - 1] : null;
    /* de vorige zin staat boven het sprekerlabel, zodat het label bij de huidige zin hoort */
    if (o.prev) {
      o.prev.textContent = P ? P.text : '';
      o.prev.className = 'rc-prev' + (P && P.who === 'b' ? ' is-b' : '');
      if (P && P.lang !== D.lang) o.prev.lang = P.lang; else o.prev.removeAttribute('lang');
    }
    if (li < 0) { if (o.who) o.who.textContent = ''; if (o.note) o.note.classList.remove('show'); return; }
    var L = c.lines[li];
    var cur = mk('p', 'rc-sub cur' + (L.who === 'b' ? ' is-b' : ''));
    if (L.lang !== D.lang) cur.lang = L.lang;
    var keys = {};
    c.events.forEach(function (e) { if (e.li === li && e.wi >= 0) keys[e.wi] = true; });
    L.words.forEach(function (w, i) {
      if (i) cur.appendChild(document.createTextNode(' '));
      var sp = mk('span', 'w' + (keys[i] ? ' k' : ''), w.w);
      cur.appendChild(sp); self.spans.push(sp);
    });
    if (L.tr) { var tr = mk('span', 'tr', L.tr); tr.lang = D.lang; cur.appendChild(tr); }
    o.subs.appendChild(cur);
    if (o.who) {
      o.who.textContent = L.who === 'r' ? U.who_r : U.who_b;
      o.who.className = 'rc-who ' + (L.who === 'r' ? 'is-r' : 'is-b');
    }
    if (o.note) {
      if (L.note) { o.note.textContent = L.note; o.note.classList.add('show'); }
      else o.note.classList.remove('show');
    }
    if (o.onLine) o.onLine(L, this);
  };
  Player.prototype.words = function (wi) {
    if (wi === this.wi || !this.spans) return;
    var a = Math.min(Math.max(this.wi, -1), wi), b = Math.max(this.wi, wi);
    for (var i = Math.max(0, a); i <= Math.min(b, this.spans.length - 1); i++) this.spans[i].classList.toggle('on', i <= wi);
    if (this.wi < -1) for (var j = 0; j < this.spans.length; j++) this.spans[j].classList.toggle('on', j <= wi);
    this.wi = wi;
  };
  Player.prototype.events = function (n, jump) {
    var self = this, o = this.o, c = this.c, max = typeof o.max === 'function' ? o.max() : (o.max || 3);
    var from = Math.max(0, this.shown);
    if (this.cards) {
      this.cards.forEach(function (el, i) {
        var vis = i < n;
        el.classList.toggle('gone', vis && i < n - max);
        if (!vis) el.classList.remove('in');
        else if (jump || i < from) el.classList.add('in');
      });
    }
    if (!jump) {
      for (var i = from; i < n; i++) (function (e, el, g) {
        self.lightKey(e);
        var done = function () {
          if (g !== self.gen) return;              /* intussen gespoeld of een ander gesprek gekozen */
          if (el) { el.classList.add('in'); var ic = el.querySelector('.rc-ic'); if (ic) { ic.classList.remove('pulse'); void ic.offsetWidth; ic.classList.add('pulse'); } }
          if (o.onEvent) o.onEvent(e, self);
        };
        if (el && o.line && !reduce) spark(o.line.peak(), el.querySelector('.rc-ic'), done); else done();
      })(c.events[i], this.cards ? this.cards[i] : null, this.gen);
    } else if (this.spans) {
      c.events.forEach(function (e, i) { if (e.li === self.li && e.wi >= 0 && self.spans[e.wi]) self.spans[e.wi].classList.toggle('lit', i < n); });
    }
    if (o.trail) {
      var last = n ? c.events[n - 1] : null, on = {};
      c.events.forEach(function (e, i) { if (i < n) on[e.k] = true; });
      $$('i[data-k]', o.trail).forEach(function (b) { b.classList.toggle('on', !!on[b.getAttribute('data-k')]); });
      var tt = $('[data-trail-t]', o.trail); if (tt) tt.textContent = last ? last.title : '';
    }
    this.shown = n;
  };
  Player.prototype.lightKey = function (e) {
    if (e.li !== this.li || e.wi < 0 || !this.spans || !this.spans[e.wi]) return;
    this.spans[e.wi].classList.add('lit');
  };

  var ICONS = {
    cal: '<rect height="16" rx="2" width="18" x="3" y="5"></rect><path d="M3 10h18M8 3v4M16 3v4M8.5 15l2 2 4-4"></path>',
    sms: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5z"></path>',
    crm: '<circle cx="9" cy="8" r="3.2"></circle><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 8h4M17 12h4M18 16h3"></path>',
    lead: '<path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.4 7.2 17.9l.9-5.4L4.2 8.7l5.4-.8z"></path>',
    call: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"></path><path d="M15 3a6 6 0 0 1 6 6M15 7a2 2 0 0 1 2 2"></path>',
    lang: '<path d="M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8"></path><path d="M11 5c0 3-2.5 6.5-6 8"></path><path d="M13 21l4-9 4 9M14.5 18h5"></path>'
  };
  function ICON(k) {
    return '<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewBox="0 0 24 24">' + (ICONS[k] || ICONS.crm) + '</svg>';
  }

  /* pauzeer alles als het tabblad verdwijnt */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { players.forEach(function (p) { if (p.playing) { p.hiddenPause = true; p.pause(); } }); Snd.sleep(); }
  });
  window.addEventListener('pagehide', function () { players.forEach(function (p) { p.pause(); }); setSound(false); });

  /* wacht op de loader (zelfde patroon als fx.js) */
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

  /* ============================================================
     5. HERO
     ============================================================ */
  var Hero = (function () {
    var root = $('[data-rc-hero]');
    if (!root) return null;
    var canvas = $('.rc-band canvas', root);
    root.classList.add('is-js');
    if (reduce) root.classList.add('is-still');
    var line = canvas ? new Line(canvas, { amp: 40, ampM: 26, y: 0.5 }) : null;
    var status = $('[data-status]', root), statusT = $('[data-status-t]', root), pauseB = $('[data-pause]', root);
    var listen = $('[data-listen]', root), vnote = $('[data-vnote]', root), staticB = $('[data-play-static]', root);
    var loops = 0, visible = true, userPaused = false, finished = false, restartT = 0;
    var P = new Player({
      line: line, subs: $('[data-subs]', root), prev: $('[data-prev]', root), who: $('[data-who]', root), cards: $('[data-dock]', root), trail: $('[data-trail]', root), max: 3,
      onState: function (s, p) {
        var c = p.c, txt, ring = s.phase === 'ring';
        if (s.phase === 'idle') txt = U.now + ' ' + nowHM();
        else if (ring) txt = U.incoming + ' · ' + nowHM();
        else if (p.t >= c.last) txt = U.done + ' · ' + mmss(c.last - c.talk) + ' · ' + U.booked;
        else txt = U.live + ' · ' + mmss(Math.max(0, p.t - c.ring));
        if (statusT.textContent !== txt) statusT.textContent = txt;
        status.classList.toggle('is-ring', ring);
        root.classList.toggle('is-picked', p.t >= c.ring);
      },
      onPlay: function () { setBtn('playing'); },
      onPause: function () { setBtn(finished ? 'again' : 'paused'); },
      onEnd: function () {
        loops++;
        setBtn('again');
        if (loops >= 3 || Snd.on) { finished = true; return; }
        restartT = setTimeout(function () {
          /* niet zichtbaar of er speelt al iets: later, als hij weer in beeld komt */
          if (!visible || userPaused || document.hidden || players.some(function (x) { return x.playing; })) { P.autoPaused = true; return; }
          fresh(); P.play(false);
        }, 5000);
      },
      onNoVoice: function () { if (vnote) { vnote.textContent = U.no_voice; vnote.hidden = false; } },
      onVoice: function () { if (vnote && Snd.on) { vnote.textContent = vnote.getAttribute('data-txt'); vnote.hidden = false; } }
    });
    function setBtn(state) {
      if (!pauseB) return;
      pauseB.hidden = false;
      pauseB.setAttribute('data-state', state);
      pauseB.setAttribute('aria-label', state === 'playing' ? U.pause : (state === 'again' ? U.again : U.resume));
    }
    function fresh() {
      var b = brussels();
      P.load(D.heroCall, { groet: greetFor(b.h), closed: isClosed(b.h) }, 3.2);
    }
    function start() {
      clearTimeout(restartT);
      if (finished || P.t >= P.c.dur) { finished = false; loops = 0; fresh(); }
      userPaused = false;
      P.play(true);
    }
    fresh();
    /* statisch bord zonder beweging: alles staat al, gesprek alleen op klik */
    if (reduce) {
      P.seek(P.c.dur);
      if (staticB) { staticB.hidden = false; staticB.addEventListener('click', function () { fresh(); P.play(true); }); }
    }
    if (pauseB) pauseB.addEventListener('click', function () {
      if (P.playing) { userPaused = true; clearTimeout(restartT); P.pause(); }
      else start();
    });
    if (listen) {
      soundBtns.push(listen);
      listen.addEventListener('click', function () {
        if (Snd.on) { setSound(false); if (vnote) vnote.hidden = true; return; }
        Snd.unlock(); setSound(true);
        if (vnote) { vnote.textContent = vnote.getAttribute('data-txt'); vnote.hidden = false; }
        clearTimeout(restartT); finished = false; loops = 0; fresh(); userPaused = false; P.play(true);
      });
    }
    if (vnote) vnote.setAttribute('data-txt', vnote.textContent);
    if (!reduce) {
      var ready = false;
      /* (her)start als de hero in beeld is: na de loader, of later als je terugscrolt */
      var maybePlay = function () {
        if (!ready || !visible || userPaused || finished || P.playing || document.hidden) return;
        if (P.autoPaused || P.t === 0 || P.t >= P.c.dur) { if (P.t >= P.c.dur) fresh(); P.autoPaused = false; P.play(false); }
      };
      watch(root, function (v) {
        visible = v;
        if (!v && P.playing) { P.pause(); P.autoPaused = true; }
        else if (v) maybePlay();
      }, 0.2);
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && P.hiddenPause) { P.hiddenPause = false; P.autoPaused = true; maybePlay(); }
      });
      afterLoader(function () {
        root.classList.add('is-live');
        setTimeout(function () { ready = true; maybePlay(); }, 800);
      });
    } else root.classList.add('is-live');
    return { P: P };
  })();

  /* ============================================================
     6. EEN DAG AAN DE LIJN
     ============================================================ */
  var SAN;
  try { SAN = new RegExp("[^\\p{L}\\p{N} &'.\\-]", 'gu'); } catch (e) { SAN = /[^0-9A-Za-zÀ-ɏ &'.\-]/g; }
  var bizName = '';
  function zaakFor(m) { return bizName ? fill(D.zaak_named, { naam: bizName }) : fill(D.zaak_anon, { x: m.noName }); }
  function lenOf(m) { var c = compile(m, { zaak: zaakFor(m) }, 2.4); return c.last - c.talk; }

  var Day = (function () {
    var sec = $('#luister');
    if (!sec) return null;
    var frame = $('[data-frame]', sec), imgs = $$('[data-ph]', frame), chipL = $('[data-fchip]', frame), chipR = $('[data-fyou]', frame);
    var day = $('[data-day]', sec), nowEl = $('[data-now]', sec), dots = $$('[data-dot]', sec), mos = $$('[data-mo]', sec);
    var btnPlay = $('[data-play]', sec), btnRe = $('[data-restart]', sec), btnSnd = $('[data-sound]', sec);
    var tc = $('[data-tc]', sec), doneEl = $('[data-done]', sec), doneT = $('[data-done-t]', sec), toFiche = $('[data-tofiche]', sec);
    var wave = $('[data-wave]', sec), bars = $('[data-bars]', sec), barsOn = $('[data-bars-on]', sec), marks = $('[data-marks]', sec), seek = $('[data-seek]', sec);
    var novoice = $('[data-novoice]', sec), trList = $('[data-transcript]', sec), srlog = $('[data-srlog]', sec);
    var nameIn = $('[data-name]', sec), preview = $('[data-preview]', sec);
    var line = new Line($('.rc-fstage canvas', frame), { amp: 30, ampM: 18, y: 0.55 });
    var cur = null, front = 0, wasPlaying = false, autoDone = false, loggedLine = -1;
    sec.classList.add('is-js');

    var P = new Player({
      line: line, subs: $('[data-subs]', frame), prev: $('[data-prev]', frame), who: $('[data-who]', frame), note: $('[data-note]', frame), cards: $('[data-cards]', frame),
      max: function () { return mobile.matches ? 2 : 3; },
      onState: function (s, p) {
        var c = p.c, txt;
        if (s.phase === 'idle' || s.phase === 'ring') txt = cur.night ? U.closed : (U.incoming + ' · ' + cur.time);
        else if (p.t >= c.last) txt = U.done + ' · ' + cur.time;
        else txt = U.live + ' · ' + cur.time;
        var sp = chipL.lastElementChild; if (sp.textContent !== txt) sp.textContent = txt;
        chipL.classList.toggle('is-ring', s.phase === 'ring');
        var pct = (p.t / c.dur * 100).toFixed(2) + '%';
        wave.style.setProperty('--p', pct);
        if (!seeking) seek.value = Math.round(p.t * 1000);
        var vt = mmss(p.t) + ' ' + U.of + ' ' + mmss(c.dur);
        if (seek.getAttribute('aria-valuetext') !== vt) seek.setAttribute('aria-valuetext', vt);
        var t2 = mmss(p.t) + ' / ' + mmss(c.dur); if (tc.textContent !== t2) tc.textContent = t2;
      },
      onLine: function (L, p) {
        if (!p.user || !p.playing || !srlog || p.li === loggedLine) return;
        loggedLine = p.li;
        var e = mk('p', null, (L.who === 'r' ? U.who_r : U.who_b) + ': ' + L.text); if (L.lang !== D.lang) e.lang = L.lang;
        srlog.appendChild(e);
      },
      onEvent: function (e, p) { if (p.user && srlog) srlog.appendChild(mk('p', null, e.title + ': ' + e.sub)); },
      onPlay: function () { setPlay(true); doneEl.hidden = true; },
      onPause: function () { setPlay(false); },
      onEnd: function (p) {
        setPlay(false);
        doneT.textContent = U.done;
        doneEl.hidden = false;
      },
      onNoVoice: function () { if (novoice) novoice.hidden = false; }
    });
    function setPlay(on) {
      btnPlay.setAttribute('data-state', on ? 'playing' : 'paused');
      btnPlay.setAttribute('aria-label', on ? U.pause_btn : U.play);
    }
    function photoSrc(id, w) { return D.photoBase + id + '?auto=format&fit=crop&w=' + w + '&q=72'; }
    var photoTok = 0;
    function setPhoto(m, instant) {
      var ph = m.photo, my = ++photoTok;
      var now = imgs[0].classList.contains('on') ? imgs[0] : imgs[1], next = now === imgs[0] ? imgs[1] : imgs[0];
      if (now.getAttribute('data-id') === ph.id || (!now.getAttribute('data-id') && now.src.indexOf(ph.id) >= 0)) return;
      next.srcset = [720, 1000, 1400].map(function (w) { return photoSrc(ph.id, w) + ' ' + w + 'w'; }).join(', ');
      next.src = photoSrc(ph.id, 1000);
      next.setAttribute('data-id', ph.id);
      next.style.setProperty('--pos', ph.pos); next.style.setProperty('--posM', ph.posM);
      var swap = function () {
        if (my !== photoTok) return;             /* intussen al een ander moment gekozen */
        now.classList.remove('on', 'kb'); now.alt = '';
        next.alt = ph.alt; next.classList.add('on'); front = imgs.indexOf(next);
        if (!reduce) { next.classList.remove('kb'); void next.offsetWidth; next.classList.add('kb'); }
      };
      if (instant || !next.decode) swap(); else next.decode().then(swap, swap);
    }
    function preload(m) { var i = new Image(); i.srcset = [720, 1000, 1400].map(function (w) { return photoSrc(m.photo.id, w) + ' ' + w + 'w'; }).join(', '); i.sizes = '(max-width:760px) 92vw, 1120px'; i.src = photoSrc(m.photo.id, 1000); }
    function buildWave(c) {
      var NS = 'http://www.w3.org/2000/svg', html = '';
      c.lines.forEach(function (L) {
        L.words.forEach(function (w) {
          var x = ((w.t0 + w.t1) / 2 / c.dur * 1000), hgt = 10 + 26 * Math.min(1, letters(w.w) / 9);
          html += '<rect class="' + L.who + '" height="' + hgt.toFixed(1) + '" rx="1.5" width="3.2" x="' + (x - 1.6).toFixed(1) + '" y="' + (20 - hgt / 2).toFixed(1) + '"></rect>';
        });
      });
      bars.innerHTML = html; barsOn.innerHTML = html;
      marks.innerHTML = '';
      c.events.forEach(function (e) {
        var b = mk('button', 'rc-mark'); b.type = 'button';
        b.style.left = (e.t / c.dur * 100).toFixed(2) + '%';
        b.setAttribute('aria-label', fill(U.goto, { k: e.title, t: mmss(e.t) }));
        b.addEventListener('click', function () { var pl = P.playing; P.seek(Math.max(0, e.t - 0.25)); if (pl) P.play(true); });
        marks.appendChild(b);
      });
      seek.max = Math.round(c.dur * 1000);
      void NS;
    }
    function buildTranscript(c) {
      trList.innerHTML = '';
      c.lines.forEach(function (L) {
        var li = mk('li'); li.appendChild(mk('b', null, L.who === 'r' ? U.who_r : U.who_b)); li.appendChild(document.createTextNode(' '));
        var sp = mk('span', null, L.text); if (L.lang !== D.lang) sp.lang = L.lang; li.appendChild(sp);
        if (L.tr) { li.appendChild(mk('br')); var sm = mk('small', null, L.tr); li.appendChild(sm); }
        trList.appendChild(li);
      });
    }
    function select(id, opts) {
      opts = opts || {};
      var m = byId(id); if (!m) return;
      cur = m;
      mos.forEach(function (b) { var on = b.getAttribute('data-mo') === id; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      dots.forEach(function (d) { d.classList.toggle('on', d.getAttribute('data-dot') === id); });
      frame.classList.toggle('is-night', !!m.night); day.classList.toggle('is-night', !!m.night);
      chipR.textContent = m.you;
      setPhoto(m, opts.instant);
      var c = P.load(m, { zaak: zaakFor(m) }, 2.4);
      buildWave(c); buildTranscript(c);
      doneEl.hidden = true; if (novoice) novoice.hidden = true; loggedLine = -1;
      updatePreview();
      if (opts.fiche !== false && window.RcFiche) window.RcFiche.load(id, null, true);
      if (opts.play) P.play(true);
    }
    /* voorselectie: het moment dat het dichtst bij de Belgische tijd ligt */
    function nearest() {
      var b = brussels(), now = b.h * 60 + b.m, best = D.moments[0], bd = 1e9;
      D.moments.forEach(function (m) { var d = Math.abs(m.min - now); d = Math.min(d, 1440 - d); if (d < bd) { bd = d; best = m; } });
      return best;
    }
    function tickNow() {
      if (!nowEl) return;
      var b = brussels(), mins = b.h * 60 + b.m;
      nowEl.hidden = false; nowEl.style.left = (mins / 1440 * 100).toFixed(3) + '%';
      nowEl.firstChild.textContent = U.now + ' ' + pad(b.h) + ':' + pad(b.m);
    }
    tickNow(); setInterval(tickNow, 30000);

    mos.forEach(function (b, i) {
      var m = byId(b.getAttribute('data-mo'));
      b.addEventListener('click', function () { select(m.id, { play: true }); });
      b.addEventListener('pointerenter', function () { preload(m); });
      b.addEventListener('focus', function () { preload(m); });
      b.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? mos.length - 1 : -9;
        if (j === -9) return; e.preventDefault(); mos[(j + mos.length) % mos.length].focus();
      });
    });
    btnPlay.addEventListener('click', function () { if (P.playing) P.pause(); else P.play(true); });
    btnRe.addEventListener('click', function () { P.seek(0); P.play(true); });
    if (btnSnd) {
      soundBtns.push(btnSnd);
      btnSnd.addEventListener('click', function () {
        if (Snd.on) { setSound(false); return; }
        Snd.unlock(); setSound(true);
        if (!P.playing) { if (P.t >= P.c.dur) P.seek(0); P.play(true); } else { P.spoken = -1; }
      });
    }
    var seeking = false;
    seek.addEventListener('input', function () {
      if (!seeking) { seeking = true; wasPlaying = P.playing; if (P.playing) P.pause(); }
      P.seek(seek.value / 1000);
    });
    seek.addEventListener('change', function () { seeking = false; if (wasPlaying) P.play(true); wasPlaying = false; });
    if (toFiche) toFiche.addEventListener('click', function () { if (window.RcFiche) window.RcFiche.load(cur.id, null, false); });

    /* naam van je zaak: alleen op dit toestel, alleen via textContent */
    function updatePreview() {
      if (!preview) return;
      var g = greetFor(Math.floor(cur.min / 60)), nm = bizName || D.name.name_default, MARK = '\u0000';
      var zk = bizName ? fill(D.zaak_named, { naam: MARK }) : fill(D.zaak_anon, { x: MARK });
      var txt = fill(D.name.name_preview, { groet: g, zaak: zk }).split(MARK);
      preview.textContent = '';
      preview.appendChild(document.createTextNode(txt[0]));
      preview.appendChild(mk('b', null, nm));
      preview.appendChild(document.createTextNode(txt[1] || ''));
    }
    if (nameIn) nameIn.addEventListener('input', function () {
      var v = nameIn.value.replace(SAN, '').replace(/\s+/g, ' ').replace(/^\s+/, '').slice(0, 32);
      if (v !== nameIn.value) nameIn.value = v;
      bizName = v.trim();
      if (!P.playing) { var t = P.t; select(cur.id, { instant: true, fiche: false }); if (t > 0 && t < P.c.dur) P.seek(Math.min(t, P.c.dur)); }
      else updatePreview();
    });

    select(nearest().id, { instant: true, fiche: false });
    if (reduce) P.seek(P.c.dur);

    /* één keer stil afspelen als je hier aankomt; daarna enkel op klik */
    if (!reduce) once(sec.querySelector('.rc-frame'), function () {
      if (autoDone) return; autoDone = true;
      if (!P.playing && P.t === 0) P.play(false);
    }, 0.35);
    /* pas pauzeren als het frame helemaal uit beeld is */
    watch(frame, function (v) { if (!v && P.playing) P.pause(); }, 0);
    return { select: select, P: P, cur: function () { return cur; } };
  })();

  /* ============================================================
     7. FICHE
     ============================================================ */
  var Fiche = (function () {
    var root = $('[data-fiche]');
    if (!root) return null;
    var rows = {}, F = D.fiche, curId = null, hlT = 0, sumTok = 0, loadT = [];
    $$('.rc-row', root).forEach(function (r) { rows[r.getAttribute('data-f')] = r; });
    var sub = $('[data-fsub]', root), again = $('[data-again]', root);
    var caps = $$('[data-cap]', document);
    /* wat er echt in de HTML staat (zonder JS) */
    curId = root.getAttribute('data-id') || 'm1412';
    function dd(k) { return rows[k] ? rows[k].querySelector('dd') : null; }
    function content(m) {
      var f = m.fiche;
      dd('tijd').textContent = F.today + ' · ' + m.time;
      dd('duur').textContent = mmss(lenOf(m));
      dd('beller').textContent = f.beller;
      dd('taal').textContent = f.taal;
      var out = dd('uitkomst'); out.innerHTML = ''; out.appendChild(mk('span', 'rc-out', f.uitkomst));
      dd('sms').textContent = f.sms;
      var ol = rows.transcript && rows.transcript.querySelector('ol');
      if (ol) {
        ol.innerHTML = '';
        var c = compile(m, { zaak: zaakFor(m) }, 2.4);
        c.lines.forEach(function (L) {
          var li = mk('li'); li.appendChild(mk('b', null, L.who === 'r' ? U.who_r : U.who_b)); li.appendChild(document.createTextNode(' '));
          var sp = mk('span', null, L.text); if (L.lang !== D.lang) sp.lang = L.lang; li.appendChild(sp);
          if (L.tr) { li.appendChild(mk('br')); li.appendChild(mk('small', null, L.tr)); }
          ol.appendChild(li);
        });
      }
      sub.textContent = fill(F.sub, { tijd: m.time });
      /* de samenvatting typt zich in */
      var sumEl = dd('samenvatting'), txt = f.samenvatting;
      var my = ++sumTok;                          /* een oudere typ-animatie stopt meteen */
      if (reduce) { sumEl.textContent = txt; return; }
      sumEl.textContent = '';
      var t0 = 0, dur = Math.min(700, txt.length * 9);
      (function step(ts) {
        if (my !== sumTok) return;
        if (!t0) t0 = ts;
        var n = Math.round(clamp((ts - t0) / dur, 0, 1) * txt.length);
        sumEl.textContent = txt.slice(0, n);
        if (n < txt.length) requestAnimationFrame(step);
      })(0);
    }
    function highlight(list) {
      if (!list || !list.length) return;
      clearTimeout(hlT);
      Object.keys(rows).forEach(function (k) { rows[k].classList.remove('is-hl'); });
      void root.offsetWidth;
      list.forEach(function (k) { if (rows[k]) rows[k].classList.add('is-hl'); });
      hlT = setTimeout(function () { list.forEach(function (k) { if (rows[k]) rows[k].classList.remove('is-hl'); }); }, 2000);
    }
    function load(id, hl, quiet) {
      var m = byId(id); if (!m) return;
      if (id === curId) { highlight(hl); return; }
      loadT.forEach(clearTimeout); loadT = [];   /* een half afgewerkte wissel eerst stoppen */
      curId = id;
      var list = Object.keys(rows).map(function (k) { return rows[k]; });
      if (reduce || quiet) { list.forEach(function (r) { r.classList.remove('is-out'); }); content(m); highlight(hl); return; }
      list.forEach(function (r) { r.classList.add('is-out'); });
      loadT.push(setTimeout(function () {
        content(m);
        list.forEach(function (r, i) { loadT.push(setTimeout(function () { r.classList.remove('is-out'); }, i * 80)); });
        loadT.push(setTimeout(function () { highlight(hl); }, list.length * 80 + 120));
      }, 220));
    }
    caps.forEach(function (b) {
      var cap = F.caps[+b.getAttribute('data-cap')];
      b.addEventListener('click', function () {
        caps.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        if (cap.load) load(cap.load, cap.hl); else highlight(cap.hl);
        if (window.matchMedia('(max-width: 1099px)').matches) root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      });
    });
    if (again) again.addEventListener('click', function (e) {
      if (!Day) return;
      e.preventDefault();
      Day.select(curId, { fiche: false });
      var sec = document.getElementById('luister');
      sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () {
        Day.P.play(true);
        /* toetsenbord: de focus gaat mee naar de speler */
        var pb = document.querySelector('#luister [data-play]'); if (pb) pb.focus({ preventScroll: true });
      }, reduce ? 0 : 700);
    });
    /* de fiche volgt meteen het voorgekozen moment van 'een dag aan de lijn' */
    if (Day && Day.cur() && Day.cur().id !== curId) load(Day.cur().id, null, true);
    return { load: load };
  })();
  window.RcFiche = Fiche;

  /* ============================================================
     8. BELSTROOK (Clinic3D)
     ============================================================ */
  (function () {
    var strip = $('[data-strip]');
    if (!strip) return;
    /* hover of focus toont een groep, een klik zet ze vast (en weer los) */
    var pinned = null, lg = $$('[data-grp]');
    function show(g) { if (g) strip.setAttribute('data-hl', g); else strip.removeAttribute('data-hl'); }
    lg.forEach(function (b) {
      var g = b.getAttribute('data-grp');
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('pointerenter', function () { if (!pinned) show(g); });
      b.addEventListener('focus', function () { if (!pinned) show(g); });
      b.addEventListener('pointerleave', function () { show(pinned); });
      b.addEventListener('blur', function () { show(pinned); });
      b.addEventListener('click', function () {
        pinned = pinned === g ? null : g; show(pinned);
        lg.forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-grp') === pinned ? 'true' : 'false'); });
      });
    });
    if (reduce || !hasIO) return;
    strip.classList.add('is-js');
    once(strip, function () { strip.classList.add('in'); }, 0.5);
  })();

  /* ============================================================
     9. REKENING · 10. STAPPEN — tekenen zich als ze in beeld komen
     ============================================================ */
  [['[data-bill]', 0.4], ['[data-steps]', 0.35]].forEach(function (x) {
    var el = $(x[0]);
    if (!el || reduce || !hasIO) return;
    el.classList.add('is-js');
    once(el, function () { el.classList.add('in'); }, x[1]);
  });

  /* ============================================================
     11. SLOT-CTA — jij belt ons: de lijn trilt en neemt op
     ============================================================ */
  (function () {
    var wrap = $('.rc-cta-line'), btn = $('[data-cta-btn]');
    if (!wrap || !btn) return;
    var line = new Line($('canvas', wrap), { amp: 18, ampM: 14, y: 0.5 });
    if (reduce) return;
    var busy = false, last = -1e9, t = 0;
    function go() {
      var now = performance.now();
      if (busy || now - last < 4000) return;
      busy = true; last = now; t = 0;
      Loop.add(function (dt) {
        t += dt;
        var ring = 0, pick = -1, env = 0;
        if (t < 1.6) { var ph = t % 0.8; ring = ph < 0.5 ? Math.min(1, ph / 0.06) * Math.min(1, (0.5 - ph) / 0.06) : 0; }
        else if (t < 2.1) pick = (t - 1.6) / 0.5;
        else if (t < 3.3) { var u = (t - 2.1) / 1.2; env = Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.abs(Math.sin(u * 19))); }
        line.set(env, 1, ring, pick);
        if (t >= 3.3) { line.set(0, 1, 0, -1); busy = false; return false; }
        return true;
      });
    }
    btn.addEventListener('pointerenter', go);
    btn.addEventListener('focus', go);
  })();
})();
