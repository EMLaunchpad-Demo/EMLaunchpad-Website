/* =============================================================
   EM Launchpad — AI-chatbots
   1. live klok in de hero ("Nu 21:43 · je chatbot is online")
   2. inbox die zichzelf beantwoordt
   3. demo: praten met de bot (sector, toon, kanaal) + logboek
   4. balken van het Clinic3D-bewijs
   Alles werkt ook zonder beweging (prefers-reduced-motion).
   ============================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function mk(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function watch(el, fn, th) {
    if (!hasIO) { fn(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting); }); }, { threshold: th || 0.2 }).observe(el);
  }

  /* 1. LIVE KLOK (Belgische tijd) */
  (function () {
    var el = $('[data-live]');
    if (!el) return;
    function hm() {
      try {
        return new Intl.DateTimeFormat('nl-BE', { timeZone: 'Europe/Brussels', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
      } catch (e) {
        var d = new Date();
        return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
      }
    }
    function tick() { el.textContent = el.getAttribute('data-now') + ' ' + hm() + ' · ' + el.getAttribute('data-post'); }
    tick();
    setInterval(tick, 20000);
  })();

  /* 2. INBOX */
  (function () {
    var box = $('[data-inbox]');
    if (!box || reduce) return;
    var rows = $$('.ib-row', box);
    var timers = [], running = false, visible = false;
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function showAll() { rows.forEach(function (r) { r.classList.add('in', 'done'); r.classList.remove('typing'); }); }
    function play() {
      if (running) return;
      clear();
      running = true;
      box.classList.add('is-js');        /* pas verbergen als de animatie echt start */
      rows.forEach(function (r) { r.classList.remove('in', 'typing', 'done'); });
      var t = 500;
      rows.forEach(function (r) {
        later(function () { r.classList.add('in', 'typing'); }, t);
        later(function () { r.classList.remove('typing'); r.classList.add('done'); }, t + 1300);
        t += 1900;
      });
      later(function () {
        running = false;
        rows.forEach(function (r) { r.classList.remove('in'); });
        /* niet (meer) in beeld: laat alles staan i.p.v. een lege inbox */
        later(function () { if (visible && !document.hidden) play(); else showAll(); }, 900);
      }, t + 5200);
    }
    watch(box, function (v) {
      visible = v;
      if (v && !running && !document.hidden) play();
      if (!v) { clear(); running = false; showAll(); }
    }, 0.3);
    /* terug naar dit tabblad: opnieuw afspelen */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clear(); running = false; showAll(); }
      else if (visible) play();
    });
  })();

  /* 3. DEMO */
  (function () {
    var root = $('[data-demo]'), src = $('#cbDemo');
    if (!root || !src) return;
    var D;
    try { D = JSON.parse(src.textContent); } catch (e) { return; }
    var chat = $('[data-chat]', root), body = $('[data-body]', root), quick = $('[data-quick]', root);
    var logList = $('[data-log]', root), logEmpty = $('.cl-empty', logList);
    var bizEl = $('[data-biz]', root), avaEl = $('[data-ava]', root), chName = $('[data-chname]', root);
    var st = { sector: 0, tone: 0, ch: 'web', gen: 0, used: {}, booked: false };
    var ICONS = {
      price: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"></path><circle cx="7.5" cy="7.5" r="1.5"></circle>',
      ok: '<path d="M5 12.5l4.5 4.5L19 7.5"></path>',
      cal: '<rect height="16" rx="2" width="18" x="3" y="5"></rect><path d="M3 10h18M8 3v4M16 3v4"></path>',
      sms: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5z"></path>',
      crm: '<circle cx="9" cy="8" r="3.2"></circle><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M19 8v6M16 11h6"></path>',
      hand: '<path d="M5 12h14M13 6l6 6-6 6"></path>'
    };

    function S() { return D.sectors[st.sector]; }
    /* {a|b} = vriendelijke|formele variant; {naam} = invulveld */
    function T(s, vars) {
      s = String(s).replace(/\{([^{}|]*)\|([^{}]*)\}/g, function (m, a, b) { return st.tone ? b : a; });
      if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
      return s;
    }
    function scroll() { body.scrollTop = body.scrollHeight; }
    /* schermlezers horen wie er spreekt */
    function say(cls, text) {
      var m = mk('div', 'cc-msg ' + cls);
      m.appendChild(mk('span', 'sr-only', (cls === 'me' ? D.you : S().biz) + ': '));
      m.appendChild(document.createTextNode(text));
      body.appendChild(m); scroll(); return m;
    }

    /* bot typt, daarna verschijnen de berichten één voor één */
    function bot(texts, vars, done) {
      var my = st.gen, i = 0;
      setQuick([]);
      (function next() {
        if (my !== st.gen) return;
        if (i >= texts.length) { if (done) done(); return; }
        var txt = T(texts[i++], vars);
        if (reduce) { say('bot', txt); next(); return; }
        var ty = mk('div', 'cc-typing');
        ty.innerHTML = '<i></i><i></i><i></i>';
        body.appendChild(ty); scroll();
        setTimeout(function () {
          if (my !== st.gen) return;
          ty.remove(); say('bot', txt);
          setTimeout(next, 280);
        }, Math.min(1500, 600 + txt.length * 11));
      })();
    }
    function me(text) { say('me', text); }

    function log(k, text) {
      if (logEmpty && logEmpty.parentNode) logEmpty.remove();
      var li = mk('li', 'cl-item');
      li.setAttribute('data-k', k);
      var ic = mk('span', 'cl-ic');
      ic.innerHTML = '<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">' + (ICONS[k] || ICONS.ok) + '</svg>';
      li.appendChild(ic);
      li.appendChild(mk('span', 'cl-t', text));
      li.appendChild(mk('span', 'cl-time', D.log_now));
      logList.insertBefore(li, logList.firstChild);
    }
    function logSeq(items, vars) {
      var my = st.gen;
      (items || []).forEach(function (it, n) {
        setTimeout(function () { if (my === st.gen) log(it.k, T(it.t, vars)); }, reduce ? 0 : n * 380);
      });
    }

    /* focus blijft in de knoppenrij als die vervangen wordt (toetsenbord) */
    var focusQuick = false;
    quick.setAttribute('tabindex', '-1');
    function addQuick(label, go, pri) {
      var b = mk('button', pri ? 'pri' : '', label);
      b.type = 'button';
      b.addEventListener('click', go);
      quick.appendChild(b);
      if (focusQuick) { focusQuick = false; b.focus({ preventScroll: true }); }
      scroll();      /* de knoppenrij maakt het venster kleiner: laatste bericht in beeld houden */
    }
    function setQuick(opts) {
      focusQuick = quick.contains(document.activeElement);
      if (focusQuick) quick.focus({ preventScroll: true });
      quick.innerHTML = '';
      opts.forEach(function (o) { addQuick(o.label, o.go, o.pri); });
    }
    function menu() {
      var s = S(), opts = [];
      s.intents.forEach(function (it, i) {
        if (st.used[i] || (it.flow === 'book' && st.booked)) return;
        opts.push({ label: it.q, go: function () { ask(i); } });
      });
      if (!opts.length) opts.push({ label: T(D.restartLabel || '↻'), go: reset });
      setQuick(opts);
    }
    function ask(i) {
      var it = S().intents[i];
      st.used[i] = true;
      me(it.q);
      if (it.flow === 'book') { book(); return; }
      /* het aanbod om te boeken valt weg als er al geboekt is */
      var offer = !!(it.offer && !st.booked);
      bot(it.a.concat(offer ? [it.offer] : []), null, function () {
        logSeq(it.log);
        if (it.follow && (offer || (!it.offer && !st.booked))) {
          setQuick([{ label: it.follow, pri: true, go: function () { me(it.follow); book(); } }]);
          /* de andere vragen blijven beschikbaar */
          S().intents.forEach(function (x, j) {
            if (!st.used[j] && x.flow !== 'book') addQuick(x.q, function () { ask(j); });
          });
        } else menu();
      });
    }
    function book() {
      var b = S().book;
      st.booked = true;
      bot([b.ask], null, function () {
        setQuick(b.slots.map(function (t) {
          return { label: t, go: function () {
            me(t);
            bot([b.name_q], null, function () {
              setQuick([{ label: b.name, go: function () {
                me(b.name);
                var vars = { time: t, day: b.day, name: b.name };
                bot([b.done], vars, function () { logSeq(D.log_book, vars); menu(); });
              } }]);
            });
          } };
        }));
      });
    }

    var started = false;
    function reset() {
      started = true;
      st.gen++;
      st.used = {};
      st.booked = false;
      var s = S();
      body.innerHTML = '';
      logList.innerHTML = '';
      if (logEmpty) logList.appendChild(logEmpty);
      bizEl.textContent = s.biz;
      avaEl.textContent = s.biz.charAt(0).toUpperCase();
      bot([s.greet], null, menu);
    }

    function setChannel(key) {
      st.ch = key;
      chat.className = 'cb-chat ch-' + key;
      var c = D.channels.filter(function (x) { return x.key === key; })[0];
      var logo = D.logos[key];
      var ic = key === 'web'
        ? '<span class="cc-chlogo cb-webic"><svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"></path></svg></span>'
        : '<img alt="" class="cc-chlogo" height="18" src="' + logo + '" width="18"/>';
      chName.innerHTML = ic + '<span></span>';
      chName.lastChild.textContent = c ? c.label : key;
    }

    /* keuzeknoppen */
    $$('[data-seg]', root).forEach(function (seg) {
      var kind = seg.getAttribute('data-seg');
      $$('button', seg).forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (btn.classList.contains('on')) return;      /* al gekozen: gesprek niet wissen */
          $$('button', seg).forEach(function (o) {
            var on = o === btn;
            o.classList.toggle('on', on);
            o.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          var v = btn.getAttribute('data-v');
          if (kind === 'sector') { st.sector = +v; reset(); }
          else if (kind === 'tone') { st.tone = +v; reset(); }
          else setChannel(v);      /* zelfde gesprek, ander kanaal */
        });
      });
    });
    var rs = $('[data-restart]', root);
    if (rs) { D.restartLabel = rs.textContent; rs.addEventListener('click', reset); }

    /* pas starten als de demo in beeld komt, dan zie je de bot ook echt typen */
    watch(root, function (v) { if (v && !started) reset(); }, 0.25);
  })();

  /* 4. BALKEN + TELLERS */
  (function () {
    var bars = $('[data-bars]');
    if (!bars) return;
    if (reduce || !hasIO) return;
    bars.classList.add('is-js');
    var nums = $$('[data-to]', bars);
    nums.forEach(function (n) { n.textContent = '0'; });
    var done = false;
    watch(bars, function (v) {
      if (!v || done) return;
      done = true;
      bars.classList.add('in');
      var t0 = 0;
      requestAnimationFrame(function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / 1400), e = 1 - Math.pow(1 - p, 3);
        nums.forEach(function (n) { n.textContent = Math.round(+n.getAttribute('data-to') * e); });
        if (p < 1) requestAnimationFrame(step);
      });
    }, 0.4);
  })();
})();
