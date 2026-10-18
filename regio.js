/* =============================================================
   EM Launchpad: regio- en stadspagina's ("De kaart")
   Alleen de kaart: zodra ze in beeld komt, lichten de klanten één
   voor één op. Wie over een punt of een regel in de legende gaat,
   ziet beide oplichten. Zonder JS of met minder beweging staat alles
   meteen zichtbaar. Alleen opacity en transform: geen verschuiving.
   ============================================================= */
(function () {
  'use strict';
  var kaarten = document.querySelectorAll('[data-rg-kaart]');
  if (!kaarten.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function inView(el, fn) {
    var done = false;
    function check() {
      if (done) return;
      var r = el.getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.9 && r.bottom > 0) {
        done = true;
        window.removeEventListener('scroll', check);
        window.removeEventListener('resize', check);
        fn();
      }
    }
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    check();
  }

  Array.prototype.forEach.call(kaarten, function (k) {
    var pts = k.querySelectorAll('[data-rg-pt]');
    var lis = k.querySelectorAll('[data-rg-li]');
    Array.prototype.forEach.call(pts, function (p, i) {
      var d = reduce ? 0 : 280 + i * 220;
      p.style.transitionDelay = d + 'ms';
      p.style.setProperty('--d', d + 'ms');
    });
    function show() { k.classList.add('is-in'); }
    if (reduce) show();
    // laadscherm eerst laten verdwijnen, anders speelt de kaart onder de sluier
    else if (document.documentElement.classList.contains('emld-off') || !document.getElementById('loader')) inView(k, show);
    else {
      var t0 = Date.now();
      (function wait() {
        var l = document.getElementById('loader');
        if (!l || l.classList.contains('done') || Date.now() - t0 > 3500) inView(k, show);
        else setTimeout(wait, 120);
      })();
    }

    function light(id, on) {
      Array.prototype.forEach.call(pts, function (p) { if (p.getAttribute('data-rg-pt') === id) p.classList.toggle('is-on', on); });
      Array.prototype.forEach.call(lis, function (li) { if (li.getAttribute('data-rg-li') === id) li.classList.toggle('is-on', on); });
    }
    function bind(el, attr) {
      var id = el.getAttribute(attr);
      el.addEventListener('mouseenter', function () { light(id, true); });
      el.addEventListener('mouseleave', function () { light(id, false); });
      el.addEventListener('focusin', function () { light(id, true); });
      el.addEventListener('focusout', function () { light(id, false); });
    }
    Array.prototype.forEach.call(lis, function (li) { bind(li, 'data-rg-li'); });
    Array.prototype.forEach.call(pts, function (p) { bind(p, 'data-rg-pt'); });
  });
})();
