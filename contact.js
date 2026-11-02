/* =============================================================
   Contact: "Rechtstreeks". Vanaf 1000 px loopt van elke weg
   (bellen, WhatsApp, mail, gratis demo) een dunne lijn naar één
   punt op de rand van de werkplekfoto: elke weg komt bij ons uit.
   Om de paar seconden glijdt er een lichtje over één lijn; wie
   een weg aanwijst of erop tabt, laat die lijn oplichten.
   Progressive enhancement: zonder JS, op gsm en bij minder
   beweging blijft de pagina volledig en gewoon bruikbaar.
   ============================================================= */
(function () {
  'use strict';
  var stage = document.querySelector('[data-ct-stage]');
  if (!stage) return;
  var svg = stage.querySelector('[data-ct-wires]');
  var fig = stage.querySelector('[data-ct-photo]');
  var frame = fig && fig.querySelector('.ct-frame');
  var socket = fig && fig.querySelector('.ct-socket');
  var ways = Array.prototype.slice.call(stage.querySelectorAll('[data-ct-way]'));
  if (!svg || !frame || !socket || !ways.length || !svg.createSVGPoint) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.matchMedia('(min-width: 1000px)');
  var wires = [], sparks = [], lens = [], grad = null, built = false;
  var lit = -1, next = 0, timer = 0, inView = true, pointing = false, started = false;
  var DASH = 30;

  function mk(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }

  function build() {
    var defs = mk('defs', {});
    grad = mk('linearGradient', { id: 'ctGrad', gradientUnits: 'userSpaceOnUse', x1: '0', y1: '0', x2: '1', y2: '0' });
    grad.appendChild(mk('stop', { offset: '0', 'stop-color': '#2f74e0' }));
    grad.appendChild(mk('stop', { offset: '1', 'stop-color': '#33a06a' }));
    defs.appendChild(grad);
    svg.appendChild(defs);
    ways.forEach(function () {
      var w = mk('path', { 'class': 'ct-wire' }), s = mk('path', { 'class': 'ct-spark' });
      svg.appendChild(w); svg.appendChild(s);
      wires.push(w); sparks.push(s);
    });
    built = true;
  }

  /* lijnen uitrekenen op basis van waar de wegen en de foto nu staan */
  function layout() {
    if (!wide.matches) { stage.classList.remove('ct-wired'); return; }
    if (!built) build();
    var sr = stage.getBoundingClientRect(), fr = frame.getBoundingClientRect(), gr = fig.getBoundingClientRect();
    var ex = fr.left - sr.left;
    var pts = ways.map(function (w) { var r = w.getBoundingClientRect(); return { x: r.right - sr.left + 10, y: r.top - sr.top + r.height / 2 }; });
    var mid = (pts[0].y + pts[pts.length - 1].y) / 2;
    var top = fr.top - sr.top, h = fr.height;
    var ey = Math.max(top + 80, Math.min(top + h - 120, mid));
    svg.setAttribute('viewBox', '0 0 ' + Math.round(sr.width) + ' ' + Math.round(sr.height));
    grad.setAttribute('x1', String(Math.round(pts[0].x)));
    grad.setAttribute('x2', String(Math.round(ex)));
    pts.forEach(function (p, i) {
      var dx = ex - p.x;
      var d = 'M' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) +
              ' C' + (p.x + dx * 0.55).toFixed(1) + ' ' + p.y.toFixed(1) +
              ' ' + (ex - dx * 0.45).toFixed(1) + ' ' + ey.toFixed(1) +
              ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1);
      wires[i].setAttribute('d', d);
      sparks[i].setAttribute('d', d);
      lens[i] = wires[i].getTotalLength();
      sparks[i].style.strokeDasharray = DASH + ' ' + Math.ceil(lens[i] + DASH * 2);
      sparks[i].style.strokeDashoffset = String(DASH);
    });
    socket.style.top = (ey - (gr.top - sr.top)) + 'px';
    stage.classList.add('ct-wired');
  }

  function light(i) {
    lit = i;
    wires.forEach(function (w, k) { w.classList.toggle('is-on', k === i); });
    ways.forEach(function (w, k) { w.classList.toggle('is-lit', k === i && !pointing); });
  }

  function ping() {
    socket.classList.remove('is-ping');
    void socket.offsetWidth;            /* animatie opnieuw starten */
    socket.classList.add('is-ping');
    setTimeout(function () { socket.classList.remove('is-ping'); }, 950);
  }

  function spark(i) {
    if (!stage.classList.contains('ct-wired') || !lens[i]) return;
    if (reduce || !sparks[i].animate) { ping(); return; }
    var s = sparks[i];
    if (s._a) s._a.cancel();
    s._a = s.animate([
      { strokeDashoffset: DASH, opacity: 0 },
      { strokeDashoffset: DASH - lens[i] * 0.12, opacity: 1, offset: 0.12 },
      { strokeDashoffset: -lens[i], opacity: 1 }
    ], { duration: 1150, easing: 'cubic-bezier(.45,0,.25,1)' });
    s._a.onfinish = ping;
  }

  /* rustig ritme: om de 3,6 s één weg, alleen als de hero in beeld is */
  function tick() {
    if (pointing || !inView || document.hidden || !wide.matches) return;
    light(next); spark(next);
    next = (next + 1) % ways.length;
  }

  ways.forEach(function (w, i) {
    function on() { pointing = true; light(i); spark(i); next = (i + 1) % ways.length; }
    function off() { pointing = false; }
    w.addEventListener('mouseenter', on);
    w.addEventListener('mouseleave', off);
    w.addEventListener('focus', on);
    w.addEventListener('blur', off);
  });

  function start() {
    if (started) return;
    started = true;
    layout();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0.15 }).observe(stage);
    }
    if (!reduce) {
      setTimeout(tick, 700);
      timer = setInterval(tick, 3600);
    }
  }

  /* opnieuw meten bij een andere breedte, na de lettertypes en na de foto */
  var rq = 0;
  function relayout() { if (rq) return; rq = requestAnimationFrame(function () { rq = 0; if (started) layout(); }); }
  window.addEventListener('resize', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  var img = frame.querySelector('img');
  if (img && !img.complete) img.addEventListener('load', relayout);
  if (wide.addEventListener) wide.addEventListener('change', relayout);

  /* wacht tot het laadscherm weg is (één keer per sessie), anders meteen */
  var loader = document.getElementById('loader');
  var html = document.documentElement;
  if (!loader || html.className.indexOf('emld-off') > -1) { start(); return; }
  var t0 = Date.now();
  (function wait() {
    if (!loader.isConnected || loader.classList.contains('done') || Date.now() - t0 > 3600) { setTimeout(start, 250); return; }
    setTimeout(wait, 120);
  })();
})();
