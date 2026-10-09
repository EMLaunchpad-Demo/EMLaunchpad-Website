/* =============================================================
   EM Launchpad — Portfolio ("Door het venster")
   De beweging van het hero-venster is pure CSS (pauzeerbaar via
   checkbox + label, ook zonder JavaScript). Dit script doet één
   ding: zodra het venster uit beeld is, krijgt het blok de klasse
   is-weg en pauzeert de CSS de animatie. Dat spaart CPU en batterij.
   De pauzestand van de bezoeker blijft onaangeroerd.
   ============================================================= */
(function () {
  'use strict';
  var blok = document.querySelector('[data-pf-blok]');
  if (!blok || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (es) {
    blok.classList.toggle('is-weg', !es[0].isIntersecting);
  }, { rootMargin: '80px 0px' }).observe(blok);
})();
