/* =============================================================
   EM Launchpad: EML AI Team ("Een kantoor vol")
   1. sector  : één gedeelde keuze (hero en organigram)
   2. groep   : de Telegram-groep speelt de berichten één voor één af;
                bij "ask" kan de bezoeker goedkeuren of laten wachten
   3. organigram: de agents komen aan als de sectie in beeld komt
   4. pakketten: het passende pakket oplichten (geen prijsberekening)
   5. gsm: afdelingen in het organigram open/dicht
   Alles staat al in de HTML; zonder JS of met minder beweging blijft
   alles zichtbaar. Alleen opacity en transform, dus geen verschuiving.
   ============================================================= */
(function () {
  'use strict';
  var src = document.getElementById('etData');
  if (!src) return;
  var D;
  try { D = JSON.parse(src.textContent); } catch (e) { return; }
  var U = D.ui;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* "in beeld" met een eenvoudige rechthoekcontrole bij scrollen (zoals de onthulling in site.js),
     zodat het ook werkt waar IntersectionObserver niet of laat vuurt */
  function whenInView(el, frac, fn) {
    var done = false;
    function check() {
      if (done) return;
      var r = el.getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * frac && r.bottom > 0) { done = true; window.removeEventListener('scroll', check); window.removeEventListener('resize', check); fn(); }
    }
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();
  }

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function fill(s, v) { return String(s == null ? '' : s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; }); }
  function Timer(fn, ms) { this.fn = fn; this.left = ms; this.id = 0; this.t0 = 0; this.done = false; }
  Timer.prototype.start = function () { if (this.done || this.id) return; var s = this; this.t0 = Date.now(); this.id = setTimeout(function () { s.id = 0; s.done = true; s.fn(); }, Math.max(0, this.left)); };
  Timer.prototype.pause = function () { if (!this.id) return; clearTimeout(this.id); this.id = 0; this.left -= Date.now() - this.t0; };
  Timer.prototype.kill = function () { if (this.id) clearTimeout(this.id); this.id = 0; this.done = true; };

  var hero = $('[data-et-hero]'), phone = $('[data-et-phone]'), charts = $('[data-et-charts]');
  var live = $('[data-et-live]');
  function say(t) { if (live) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 50); } }

  /* ============================================================
     2. DE TELEGRAM-GROEP
     ============================================================ */
  var play = (function () {
    var timers = [], paused = false, auto = false, done = true, idx = 0, msgs = [];
    var status = $('[data-et-status]'), statusT = status && status.firstElementChild;
    var pbtn = $('[data-et-pause]'), abtn = $('[data-et-again]');
    function clear() { timers.forEach(function (t) { t.kill(); }); timers = []; }
    function after(ms, fn) { var t = new Timer(fn, ms); timers.push(t); if (!paused) t.start(); return t; }
    function typing(name) {
      if (!status) return;
      if (name) { statusT.textContent = name + ' ' + U.typing; status.classList.add('is-on'); }
      else status.classList.remove('is-on');
    }
    function who(m) { var w = $('.et-who', m); return w ? w.textContent : ''; }
    function setBtn(playing) {
      if (!pbtn) return;
      pbtn.setAttribute('data-state', playing ? 'playing' : 'paused');
      pbtn.querySelector('span').textContent = playing ? U.pause : U.play;
      pbtn.setAttribute('aria-label', playing ? U.pause_aria : U.play_aria);
    }
    function reset() {
      clear();
      var t = $('[data-et-thread].is-on');
      msgs = t ? $$('[data-et-msg]', t) : [];
      msgs.forEach(function (m) {
        m.classList.remove('is-on');
        var a = $('[data-et-ask]', m);
        if (a) { a.classList.remove('is-done'); var d = $('[data-et-done]', a); d.hidden = true; d.className = 'et-done'; d.textContent = ''; }
      });
      idx = 0; done = false; typing(null);
    }
    function showAll() { msgs.forEach(function (m) { m.classList.add('is-on'); }); done = true; typing(null); setBtn(false); }
    function step() {
      if (idx >= msgs.length) { done = true; typing(null); setBtn(false); return; }
      var m = msgs[idx];
      if (m.classList.contains('is-owner')) {
        after(900, function () { m.classList.add('is-on'); idx++; after(1100, step); });
      } else {
        typing(who(m));
        after(idx === 0 ? 700 : 1300, function () {
          typing(null); m.classList.add('is-on'); idx++;
          after(m.hasAttribute('data-et-askmsg') ? 2600 : 1500, step);
        });
      }
    }
    function start() {
      reset();
      if (reduce) { showAll(); return; }
      paused = false; auto = false; setBtn(true); step();
    }
    if (pbtn) pbtn.addEventListener('click', function () {
      if (done) { start(); return; }
      paused = !paused; auto = false;
      timers.forEach(function (t) { if (paused) t.pause(); else t.start(); });
      setBtn(!paused);
    });
    if (abtn) abtn.addEventListener('click', start);
    document.addEventListener('visibilitychange', function () {
      /* tab weg: even stilzetten; terug: verder, tenzij de bezoeker zelf pauzeerde */
      if (document.hidden && !paused && !done) { paused = true; auto = true; timers.forEach(function (t) { t.pause(); }); setBtn(false); }
      else if (!document.hidden && paused && auto && !done) { paused = false; auto = false; timers.forEach(function (t) { t.start(); }); setBtn(true); }
    });
    return { start: start, showAll: showAll };
  })();

  /* goedkeuren of laten wachten */
  document.addEventListener('click', function (e) {
    var ok = e.target.closest && e.target.closest('[data-et-ok]');
    var wait = e.target.closest && e.target.closest('[data-et-wait]');
    var b = ok || wait;
    if (!b) return;
    var ask = b.closest('[data-et-ask]');
    if (!ask) return;
    var d = $('[data-et-done]', ask);
    d.textContent = ok ? U.approved : U.waiting;
    d.className = 'et-done' + (ok ? ' is-ok' : '');
    d.hidden = false;
    ask.classList.add('is-done');
    say(ok ? U.approved : U.waiting);
  });

  /* ============================================================
     1. GEDEELDE SECTORKEUZE
     ============================================================ */
  var niche = D.niches[0].id;
  var chips = $$('[data-et-niche]');
  function nicheOf(id) { for (var i = 0; i < D.niches.length; i++) if (D.niches[i].id === id) return D.niches[i]; return D.niches[0]; }
  function setNiche(id, restart) {
    niche = id;
    var n = nicheOf(id);
    chips.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-et-niche') === id ? 'true' : 'false'); });
    $$('[data-et-thread]').forEach(function (t) { t.classList.toggle('is-on', t.getAttribute('data-et-thread') === id); });
    $$('[data-et-chart]').forEach(function (c) { var on = c.getAttribute('data-et-chart') === id; c.classList.toggle('is-on', on); if (on) arrive(c); });
    var g = $('[data-et-group]'); if (g) g.textContent = fill(U.group, { bedrijf: n.bedrijf });
    var m = $('[data-et-members]'); if (m) m.textContent = fill(U.members, { n: n.n });
    var sr = $('[data-et-sr]'); if (sr) sr.textContent = fill(U.sr_hero, { bedrijf: n.bedrijf, wat: n.wat });
    if (restart) play.start();
  }
  chips.forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-et-niche');
      if (id !== niche) setNiche(id, true);
    });
  });

  /* ============================================================
     3. ORGANIGRAM: de agents komen aan
     ============================================================ */
  var seen = false;
  function arrive(c) {
    if (!charts || !seen) return;
    if (reduce) { c.classList.add('is-in'); return; }
    c.classList.remove('is-in');
    void c.offsetWidth;
    requestAnimationFrame(function () { c.classList.add('is-in'); });
  }
  if (charts) {
    charts.classList.add('is-js');
    var first = function () { seen = true; var c = $('[data-et-chart].is-on'); if (c) arrive(c); };
    if (reduce) first();
    else whenInView(charts, 0.85, first);
  }

  /* ============================================================
     4. PAKKETTEN: het passende pakket oplichten
     ============================================================ */
  var picks = $$('[data-et-pick]');
  function setPick(id) {
    picks.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-et-pick') === id ? 'true' : 'false'); });
    $$('[data-et-plan]').forEach(function (p) {
      var on = p.getAttribute('data-et-plan') === id;
      p.classList.toggle('is-pick', on);
      p.classList.toggle('is-dim', !!id && !on && p.getAttribute('data-et-plan') !== 'analyse');
    });
    $$('[data-et-col]').forEach(function (c) { c.classList.toggle('is-pick', !!id && c.getAttribute('data-et-col') === id); });
  }
  picks.forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-et-pick');
      setPick(b.getAttribute('aria-pressed') === 'true' ? null : id);
    });
  });

  /* ============================================================
     5. GSM: AFDELINGEN OPEN/DICHT
     De open/dicht-weergave staat in de CSS (html.et-js + max-width 760px),
     dus vanaf de eerste weergave; hier komt alleen de knop in de kop.
     ============================================================ */
  var mq = window.matchMedia('(max-width: 760px)');
  var depts = $$('[data-et-dept]');
  function syncDepts() {
    depts.forEach(function (d) {
      var h = $('.et-dh', d), b = $('.et-dbtn', h);
      if (mq.matches && !b) {
        b = document.createElement('button');
        b.type = 'button'; b.className = 'et-dbtn';
        b.textContent = h.textContent;
        b.setAttribute('aria-expanded', d.classList.contains('is-open') ? 'true' : 'false');
        h.textContent = ''; h.appendChild(b);
      } else if (!mq.matches && b) {
        h.textContent = b.textContent;
      }
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.et-dbtn');
    if (!b) return;
    var d = b.closest('[data-et-dept]');
    var open = !d.classList.contains('is-open');
    d.classList.toggle('is-open', open);
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  syncDepts();
  if (mq.addEventListener) mq.addEventListener('change', syncDepts); else if (mq.addListener) mq.addListener(syncDepts);

  /* ============================================================
     START
     ============================================================ */
  if (phone && hero) {
    phone.classList.add('is-js');
    hero.classList.add('is-js');
    setNiche(niche, false);
    var loader = document.getElementById('loader');
    var ld = loader && !/(^|\s)emld-off(\s|$)/.test(document.documentElement.className);
    var t0 = Date.now(), wait = ld ? 2300 : 500;
    /* pas afspelen als de groep in beeld is (op gsm staat ze onder de vouw) */
    var go = function () { setTimeout(play.start, Math.max(0, wait - (Date.now() - t0))); };
    if (reduce) go();
    else whenInView(phone, 0.75, go);
  }
})();
