/* =============================================================
   EM Launchpad — interactieve effecten
   • hero-film   : "de film van je dag" (homepage-hero)
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
     2. HERO — "de film van je dag"
     Schermvullende foto's van één ondernemersdag (05:00–23:00). De
     ondertitel vertelt wat het systeem intussen deed; de tijdlijn
     onderaan speelt vanzelf af en je kunt er zelf door slepen. Het
     licht verloopt mee via drie kleurlagen (alleen opacity, geen
     blend-modes). Eén dag, daarna blijft de film op het echte
     resultaat staan. Zonder JS toont de HTML één betekenisvolle still.
     ============================================================ */
  (function heroFilm() {
    var root = document.querySelector('[data-film]');
    if (!root) return;
    document.documentElement.classList.add('film-js');

    /* de hero loopt tot achter de glazen navigatiebalk */
    var spacer = document.querySelector('.nv-space');
    if (spacer) spacer.style.display = 'none';

    var BEATS = [
      { t: 6 + 40 / 60, tag: 'Website + chatbot', what: 'Chatbot boekte een afspraak.', you: 'Jij sliep nog.', d: [1, 0, 0] },
      { t: 8.25, tag: 'Automatisatie', what: 'Bevestiging verstuurd.', you: 'Automatisch. Jij tikte niets.', d: [0, 0, 0] },
      { t: 11 + 20 / 60, tag: 'Voice agent', what: 'Gemiste oproep opgevangen.', you: 'Jij stond bij een klant.', d: [0, 1, 0] },
      { t: 14 + 5 / 60, tag: 'Automatisatie', what: 'Herinnering verstuurd.', you: 'Jij hoefde niet te bellen.', d: [0, 0, 0] },
      { t: 18.5, tag: 'Chatbot · Instagram', what: 'Nieuwe afspraak via Instagram.', you: 'Jij was al naar huis.', d: [1, 0, 0] },
      { t: 21 + 10 / 60, tag: 'Reviews', what: 'Review binnengekomen.', you: 'Jij zat aan tafel.', d: [0, 0, 1] },
      { t: 23, tag: 'Vandaag', what: '2 afspraken, 1 oproep opgevangen, 1 review.', you: 'En jij? Jij hoefde er niets voor te doen.', d: [0, 0, 0] }
    ];
    var LAST = BEATS.length - 1;
    /* uur → [koel, warm, nacht, schaduw]; lineair ertussen */
    var TINT = [[5, .16, 0, .06, .30], [7, .10, .04, 0, .28], [10, .03, .03, 0, .24], [13, 0, .02, 0, .24],
      [16, 0, .08, 0, .26], [18.5, 0, .14, 0, .28], [20, .05, .08, .10, .34], [21.5, 0, .04, .18, .40], [23, 0, 0, .26, .48]];

    var q = function (s) { return root.querySelector(s); };
    var scenes = [].slice.call(root.querySelectorAll('.film-scene'));
    var rig = q('.film-rig');
    var cap = q('.film-cap'), capTag = q('.fc-tag'), capWhat = q('.fc-what'), capYou = q('.fc-you');
    var clock = q('.film-clock'), track = q('.film-track'), tip = q('.ft-tip'), hint = q('.ft-hint');
    var pips = [].slice.call(root.querySelectorAll('.ft-pips i'));
    var tA = q('.fy-a'), tB = q('.fy-b'), tC = q('.fy-c');
    var lA = q('.fy-al'), lB = q('.fy-bl'), lC = q('.fy-cl');
    var play = q('.film-play'), real = q('.film-real');

    var st = { t: 5, k: -1, scene: 0, gen: 0, timer: 0, live: false, userPaused: false, hidden: false, epi: false, dragging: false };

    function hhmm(t) {
      var m = Math.round(t * 60) % 1440;
      return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
    }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function xOf(t) { return clamp((t - 5) / 18, 0, 1); }
    function sceneAt(t) {
      var i = 0;
      each(scenes, function (s, n) { if (t >= parseFloat(s.getAttribute('data-from'))) i = n; });
      return i;
    }
    function ready(s) {
      var img = s.querySelector('img');
      return img && img.getAttribute('src') && img.complete && img.naturalWidth > 0;
    }
    function setScene(i) {
      if (i === st.scene || !ready(scenes[i])) return;
      st.scene = i;
      each(scenes, function (s, n) { s.classList.toggle('is-on', n === i); });
    }
    function tintAt(t) {
      for (var i = 1; i < TINT.length; i++) {
        if (t <= TINT[i][0]) {
          var a = TINT[i - 1], b = TINT[i], p = (t - a[0]) / (b[0] - a[0]);
          return [1, 2, 3, 4].map(function (j) { return a[j] + (b[j] - a[j]) * clamp(p, 0, 1); });
        }
      }
      return TINT[TINT.length - 1].slice(1);
    }
    function setT(t) {
      st.t = t;
      var v = tintAt(t);
      root.style.setProperty('--p', xOf(t).toFixed(4));
      root.style.setProperty('--tc', v[0].toFixed(3));
      root.style.setProperty('--tw', v[1].toFixed(3));
      root.style.setProperty('--tn', v[2].toFixed(3));
      root.style.setProperty('--shade', v[3].toFixed(3));
      clock.textContent = hhmm(t);
      setScene(sceneAt(t));
    }

    function totals(k) {
      var c = [0, 0, 0];
      for (var i = 0; i <= k; i++) { c[0] += BEATS[i].d[0]; c[1] += BEATS[i].d[1]; c[2] += BEATS[i].d[2]; }
      return c;
    }
    function tally(k) {
      var c = totals(k), prev = [+tA.textContent, +tB.textContent, +tC.textContent];
      [tA, tB, tC].forEach(function (el, i) {
        if (c[i] > prev[i]) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
      });
      tA.textContent = c[0]; lA.textContent = c[0] === 1 ? 'afspraak' : 'afspraken';
      tB.textContent = c[1]; lB.textContent = c[1] === 1 ? 'oproep opgevangen' : 'oproepen opgevangen';
      tC.textContent = c[2]; lC.textContent = c[2] === 1 ? 'review' : 'reviews';
    }
    function showBeat(k, animate) {
      st.k = k;
      each(pips, function (p, n) { p.classList.toggle('on', n <= k); });
      tally(k);
      if (k < 0) {
        cap.classList.add('is-out');
        track.setAttribute('aria-valuetext', hhmm(st.t));
        return;
      }
      var b = BEATS[k];
      capTag.textContent = hhmm(b.t) + ' · ' + b.tag;
      capWhat.textContent = b.what;
      capYou.textContent = '— ' + b.you;
      cap.classList.remove('is-out');
      if (animate) {
        cap.classList.remove('is-in'); void cap.offsetWidth; cap.classList.add('is-in');
        if (pips[k]) { pips[k].classList.remove('ping'); void pips[k].offsetWidth; pips[k].classList.add('ping'); }
      }
      track.setAttribute('aria-valuenow', b.t.toFixed(2));
      track.setAttribute('aria-valuetext', hhmm(b.t) + '. ' + b.what + ' ' + b.you);
    }
    function beatAtOrBefore(t) {
      var k = -1;
      for (var i = 0; i <= LAST; i++) if (BEATS[i].t <= t + 0.001) k = i;
      return k;
    }

    /* ── reizen en afspelen ── */
    function clearT() { clearTimeout(st.timer); }
    function later(fn, ms) { clearT(); st.timer = setTimeout(fn, ms); }
    function halt() { clearT(); st.gen++; }
    function running() { return st.live && !reduce && !st.userPaused && !st.hidden && !st.epi && !st.dragging; }
    function travel(to, ms, done) {
      var my = ++st.gen, from = st.t;
      tween(ms, function (p) { if (my === st.gen) setT(from + (to - from) * easeInOut(p)); },
        function () { if (my === st.gen && done) done(); });
    }
    function step() {
      if (!running()) return;
      var next = st.k + 1;
      if (next > LAST) { epilogue(); return; }
      cap.classList.add('is-out');
      later(function () {
        travel(BEATS[next].t, 900, function () {
          showBeat(next, true);
          if (next === 1) showHint();
          later(next === LAST ? epilogue : step, next === LAST ? 4200 : 3600);
        });
      }, 300);
    }
    function kick() { if (running()) step(); }
    function holdThenPlay() { halt(); later(kick, 7000); }

    function epilogue() {
      halt();
      st.epi = true;
      setT(23);
      showBeat(LAST, false);
      root.classList.add('is-epi');
      play.setAttribute('aria-label', 'Speel de dag opnieuw');
      play.setAttribute('aria-pressed', 'false');
    }
    function restart() {
      halt();
      st.epi = false;
      root.classList.remove('is-epi');
      setT(5);
      showBeat(-1, false);
      play.classList.remove('is-paused');
      play.setAttribute('aria-label', 'Pauzeer de dag');
      play.setAttribute('aria-pressed', 'true');
      st.userPaused = false;
      later(kick, 500);
    }
    function leaveEpi() {
      if (!st.epi) return;
      st.epi = false;
      root.classList.remove('is-epi');
      play.setAttribute('aria-label', st.userPaused ? 'Speel de dag af' : 'Pauzeer de dag');
    }

    /* ── knoppen ── */
    play.addEventListener('click', function () {
      if (reduce) {                                   /* stap per stap */
        if (st.epi) { leaveEpi(); setT(BEATS[0].t); showBeat(0, false); return; }
        if (st.k >= LAST) { epilogue(); return; }
        var n = st.k + 1; setT(BEATS[n].t); showBeat(n, false); return;
      }
      if (st.epi) { restart(); return; }
      st.userPaused = !st.userPaused;
      play.classList.toggle('is-paused', st.userPaused);
      root.classList.toggle('is-paused', st.userPaused);
      play.setAttribute('aria-pressed', st.userPaused ? 'false' : 'true');
      play.setAttribute('aria-label', st.userPaused ? 'Speel de dag af' : 'Pauzeer de dag');
      if (st.userPaused) halt(); else kick();
    });
    real.addEventListener('click', function () { epilogue(); });

    /* ── slepen over de tijdlijn ── */
    var down = null;
    function tAtX(x) { var r = track.getBoundingClientRect(); return 5 + clamp((x - r.left) / r.width, 0, 1) * 18; }
    function scrubTo(x) {
      var t = tAtX(x);
      setT(t);
      var k = beatAtOrBefore(t);
      if (k !== st.k) showBeat(k, false);
      else if (k >= 0) cap.classList.remove('is-out');
    }
    function beginDrag(e) {
      st.dragging = true;
      halt();
      leaveEpi();
      rig.classList.add('is-scrub');
      root.classList.add('is-scrub');
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
      hideTip();
      scrubTo(e.clientX);
    }
    track.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      down = { x: e.clientX, y: e.clientY, id: e.pointerId, type: e.pointerType };
      if (e.pointerType === 'mouse') { e.preventDefault(); beginDrag(e); }
    });
    track.addEventListener('pointermove', function (e) {
      if (st.dragging) { scrubTo(e.clientX); return; }
      if (down && down.type !== 'mouse') {
        var dx = Math.abs(e.clientX - down.x), dy = Math.abs(e.clientY - down.y);
        if (dx > 8 && dx > dy) beginDrag(e);
        else if (dy > 10) down = null;           /* verticaal: laat de pagina scrollen */
        return;
      }
      if (canHover) showTip(e.clientX);
    });
    function endDrag(e) {
      if (!st.dragging) {
        if (down && e && down.type !== 'mouse' && Math.abs(e.clientX - down.x) < 8) {   /* tik = springen */
          halt(); leaveEpi(); scrubTo(e.clientX); holdThenPlay();
        }
        down = null;
        return;
      }
      st.dragging = false;
      down = null;
      rig.classList.remove('is-scrub');
      root.classList.remove('is-scrub');
      if (st.k >= 0) cap.classList.remove('is-out');
      holdThenPlay();
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', function () { st.dragging = false; down = null; rig.classList.remove('is-scrub'); root.classList.remove('is-scrub'); holdThenPlay(); });
    track.addEventListener('pointerleave', function () { if (!st.dragging) hideTip(); });
    /* losgelaten buiten de tijdlijn (of buiten het venster): slepen netjes afronden */
    track.addEventListener('lostpointercapture', function () { if (st.dragging) endDrag(); });
    window.addEventListener('pointerup', function () { if (st.dragging) endDrag(); });
    window.addEventListener('blur', function () { if (st.dragging) endDrag(); });

    /* zweeftip: het dichtstbijzijnde moment onder de muis */
    function showTip(x) {
      if (!tip) return;
      var r = track.getBoundingClientRect(), best = -1, bd = 18;
      for (var i = 0; i < LAST; i++) {
        var px = r.left + xOf(BEATS[i].t) * r.width, d = Math.abs(px - x);
        if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) { hideTip(); return; }
      tip.textContent = hhmm(BEATS[best].t) + ' · ' + BEATS[best].what;
      tip.style.setProperty('--x', xOf(BEATS[best].t).toFixed(4));
      tip.classList.add('show');
    }
    function hideTip() { if (tip) tip.classList.remove('show'); }

    /* eenmalige hint dat je kunt slepen */
    function showHint() {
      if (!hint || !canHover || reduce) return;
      try { if (sessionStorage.getItem('em_film_hint')) return; sessionStorage.setItem('em_film_hint', '1'); } catch (err) {}
      setTimeout(function () {
        hint.classList.add('show');
        setTimeout(function () { hint.classList.remove('show'); }, 4000);
      }, 1500);
    }

    /* toetsenbord op de schuif */
    track.addEventListener('keydown', function (e) {
      var k = st.k;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') k = Math.min(LAST, st.k + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') k = Math.max(-1, st.k - 1);
      else if (e.key === 'Home') k = -1;
      else if (e.key === 'End') k = LAST;
      else return;
      e.preventDefault();
      halt(); leaveEpi();
      setT(k < 0 ? 5 : BEATS[k].t);
      showBeat(k, false);
      if (!reduce) holdThenPlay();
    });

    /* ── "nu"-streepje op de echte Belgische tijd ── */
    (function () {
      var now = q('.ft-now');
      if (!now) return;
      var h, m;
      try {
        var parts = new Intl.DateTimeFormat('nl-BE', { timeZone: 'Europe/Brussels', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
        parts.forEach(function (p) { if (p.type === 'hour') h = +p.value; if (p.type === 'minute') m = +p.value; });
      } catch (err) { var d = new Date(); h = d.getHours(); m = d.getMinutes(); }
      if (h == null || h < 5 || h >= 23) return;
      now.style.setProperty('--x', xOf(h + m / 60).toFixed(4));
      now.title = 'Nu: ' + pad(h) + ':' + pad(m);
      now.hidden = false;
    })();

    /* ── de overige scènes pas laden als de pagina er is ── */
    function loadScenes() {
      each(scenes, function (s) {
        var img = s.querySelector('img'), src = s.querySelector('source');
        if (!img || img.getAttribute('src')) return;
        if (src && src.getAttribute('data-srcset')) src.setAttribute('srcset', src.getAttribute('data-srcset'));
        img.addEventListener('load', function () { if (!st.dragging) setScene(sceneAt(st.t)); });
        img.addEventListener('error', function () { s.setAttribute('data-broken', ''); });
        if (img.getAttribute('data-srcset')) img.setAttribute('srcset', img.getAttribute('data-srcset'));
        img.setAttribute('src', img.getAttribute('data-src'));
      });
    }
    if (document.readyState === 'complete') setTimeout(loadScenes, 300);
    else window.addEventListener('load', function () { setTimeout(loadScenes, 300); });

    /* ── pauzeren buiten beeld of in een ander tabblad ── */
    function setHidden(h) {
      if (h === st.hidden) return;
      st.hidden = h;
      root.classList.toggle('is-away', h);
      if (h) halt(); else if (!reduce) later(kick, 400);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        each(entries, function (e) { setHidden(e.intersectionRatio < 0.25 || document.hidden); });
      }, { threshold: [0, 0.25, 0.5] }).observe(root);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) setHidden(true);
      else {
        var r = root.getBoundingClientRect();
        setHidden(r.bottom < window.innerHeight * 0.25 || r.top > window.innerHeight * 0.75);
      }
    });

    /* tekst vervaagt zacht als je de hero uit scrolt (alleen desktop) */
    if (!reduce) {
      onScroll(function () {
        if (window.innerWidth <= 700) { root.style.removeProperty('--fade'); return; }
        var h = root.offsetHeight || 1;
        root.style.setProperty('--fade', clamp(1 - (window.scrollY || 0) / (h * 0.6), 0, 1).toFixed(3));
      });
    }

    /* ── start ── */
    if (reduce) {
      root.classList.add('is-live', 'is-rm', 'is-open');
      play.setAttribute('aria-label', 'Volgend moment');
      setT(BEATS[0].t);
      showBeat(0, false);
      return;
    }
    setT(5);
    showBeat(-1, false);
    function start() {
      st.live = true;
      root.classList.add('is-live', 'is-open');
      later(kick, 1200);
    }
    var loader = document.getElementById('loader');
    if (!loader) {                      /* terugkerend bezoek: meteen, zonder filmbalken */
      root.classList.add('no-bars');
      setTimeout(start, 120);
    } else {
      var started = false;
      var go = function () { if (started) return; started = true; if (mo) mo.disconnect(); setTimeout(start, 250); };
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

})();
