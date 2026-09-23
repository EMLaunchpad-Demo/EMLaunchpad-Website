/* =============================================================
   EM Launchpad — Diensten (pakketten)
   1. uitbreidingen aan/uit → maandprijs telt mee
   2. checklist in de prijskaart vinkt af terwijl je scrolt
   3. de drie vragen van AI Consulting lichten om beurten op
   4. de lijn van "Hoe we werken" loopt vol als hij in beeld komt
   ============================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = (document.documentElement.lang || 'nl').slice(0, 2);
  var LOC = ({ en: 'en-GB', fr: 'fr-BE' })[lang] || 'nl-BE';
  var hasIO = 'IntersectionObserver' in window;
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* 1. UITBREIDINGEN */
  var BASE = 150;
  var totals = $$('[data-total]');
  var lines = document.querySelector('[data-lines]');
  var addons = $$('[data-addon]');
  var shown = BASE, raf = 0;

  function paint(v) {
    var t = Math.round(v).toLocaleString(LOC);
    totals.forEach(function (el) { el.textContent = t; });
  }
  function tween(to) {
    totals.forEach(function (el) {
      var box = el.parentNode;
      box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
    });
    if (reduce) { shown = to; paint(to); return; }
    var from = shown, t0 = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / 420);
      shown = from + (to - from) * (1 - Math.pow(1 - p, 3));
      paint(shown);
      if (p < 1) raf = requestAnimationFrame(step);
    });
  }
  function update() {
    var sum = BASE;
    if (lines) lines.innerHTML = '';
    addons.forEach(function (a) {
      if (!a.classList.contains('on')) return;
      sum += parseFloat(a.getAttribute('data-addon')) || 0;
      if (lines) {
        var li = document.createElement('li');
        li.textContent = '+ ' + a.getAttribute('data-name');
        lines.appendChild(li);
      }
    });
    tween(sum);
  }
  addons.forEach(function (a) {
    var sw = a.querySelector('.a-sw');
    if (!sw) return;
    sw.addEventListener('click', function () {
      var on = !a.classList.contains('on');
      a.classList.toggle('on', on);
      sw.setAttribute('aria-pressed', on ? 'true' : 'false');
      update();
    });
  });

  /* 2. CHECKLIST */
  var checks = {};
  $$('[data-check] a').forEach(function (a) { checks[a.getAttribute('href').slice(1)] = a.parentNode; });
  /* een onderdeel telt als gezien zodra het tot 3/4 van het scherm is gekomen,
     ook als je er snel voorbij scrolt */
  var incs = $$('[data-inc]');
  var ticking = false;
  function tick() {
    ticking = false;
    var mark = window.innerHeight * 0.75;
    incs = incs.filter(function (el) {
      if (el.getBoundingClientRect().top > mark) return true;
      var li = checks[el.id];
      if (li) li.classList.add('done');
      return false;
    });
    if (!incs.length) { window.removeEventListener('scroll', queue); window.removeEventListener('resize', queue); }
  }
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  if (incs.length) {
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    tick();
  }

  /* 3. VRAGEN */
  var qs = $$('[data-qs] li');
  if (qs.length) {
    var k = 0, timer = 0;
    var show = function (i) { qs.forEach(function (q, n) { q.classList.toggle('on', n === i); }); };
    show(0);
    if (!reduce && hasIO) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          clearInterval(timer);
          if (e.isIntersecting) timer = setInterval(function () { k = (k + 1) % qs.length; show(k); }, 2600);
        });
      }, { threshold: 0.3 }).observe(qs[0].parentNode);
    }
  }

  /* 4. STAPPEN */
  $$('[data-steps]').forEach(function (ol) {
    if (reduce || !hasIO) { ol.classList.add('in'); return; }
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { ol.classList.add('in'); io2.disconnect(); } });
    }, { threshold: 0.35 });
    io2.observe(ol);
  });
})();
