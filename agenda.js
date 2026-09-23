/* =============================================================
   EM Launchpad — Online afsprakensysteem
   1. hero: een weekagenda die zich 's nachts vanzelf vult
   2. demo: zelf boeken als klant + door de tijd spoelen
   3. lekcheck: wat no-shows en gemiste oproepen kosten
   4. meldingen over de foto
   5. spotlight op de kaarten
   Alles werkt ook zonder beweging (prefers-reduced-motion).
   ============================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var LOC = 'nl-BE';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function mk(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* roept fn(true/false) aan telkens el in of uit beeld gaat */
  function watch(el, fn, threshold) {
    if (!('IntersectionObserver' in window)) { fn(true); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { fn(e.isIntersecting); });
    }, { threshold: threshold || 0.15 }).observe(el);
  }

  /* ============================================================
     1. HERO-AGENDA
     ============================================================ */
  (function () {
    var app = $('[data-agenda]');
    if (!app) return;
    var cal = $('[data-cal]', app);
    var clock = $('[data-clock]', app);
    var status = $('[data-status]', app);
    var countEl = $('[data-newcount]', app);
    var toast = $('[data-toast]', app);

    var DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
    /* [dag, start, duur (u), naam, dienst, tint] */
    var BASE = [
      [0, 9, 1, 'Marie', 'Knippen', 's'], [0, 10.5, 1.5, 'Nora', 'Kleuring', 'b'], [0, 14, 1, 'Pieter', 'Knippen', 'g'],
      [1, 9.5, 1, 'Ilse', 'Brushing', 's'], [1, 11, 2, 'Hanne', 'Kleuring & snit', 'b'],
      [2, 10, 1, 'Kobe', 'Knippen', 'g'], [2, 13.5, 1.5, 'Julie', 'Balayage', 'b'],
      [3, 9, 1, 'Wout', 'Baard & knippen', 'g'], [3, 15.5, 1, 'Sarah', 'Brushing', 's'],
      [4, 11, 1, 'Lien', 'Knippen', 's'], [4, 14, 2, 'Eva', 'Kleuring & snit', 'b'],
      [5, 9, 1, 'Mats', 'Knippen', 'g'], [5, 11.5, 1.5, 'Fien', 'Kleuring', 'b']
    ];
    /* at = minuten sinds middernacht van de avond ervoor (dus > 1440 = na middernacht) */
    var EVENTS = [
      { at: 1247, b: [1, 14, 1, 'Sofie', 'Knippen & brushen', 'g'], ch: 'website' },
      { at: 1296, b: [5, 10, 1, 'Tom', 'Baard & knippen', 's'], ch: 'Instagram' },
      { at: 1378, b: [3, 13, 1.5, 'Lotte', 'Kleuring', 'b'], ch: 'Google' },
      { at: 1421, b: [2, 16.5, 1, 'Jonas', 'Knippen', 'g'], ch: 'chatbot' },
      { at: 1512, b: [4, 9, 2, 'Emma', 'Kleuring & snit', 'b'], ch: 'website' },
      { at: 1854, b: [0, 16, 1, 'An', 'Knippen', 's'], ch: 'website' },
      { at: 1860, remind: true },
      { at: 1890, morning: true }
    ];
    var START = 1230; /* 20:30 */

    /* datums van volgende week */
    var mon = new Date();
    mon.setHours(12, 0, 0, 0);
    mon.setDate(mon.getDate() + (((8 - mon.getDay()) % 7) || 7));

    cal.appendChild(mk('span', 'ag-corner'));
    DAYS.forEach(function (n, i) {
      var d = new Date(mon); d.setDate(mon.getDate() + i);
      var h = mk('span', 'ag-dh', n + ' ');
      h.appendChild(mk('b', null, String(d.getDate())));
      h.style.gridColumn = i + 2;
      cal.appendChild(h);
    });
    for (var hr = 9; hr < 18; hr++) {
      var t = mk('span', 'ag-t', pad(hr));
      t.style.gridRow = (2 + (hr - 9) * 2) + ' / span 2';
      cal.appendChild(t);
    }
    for (var c = 0; c < 6; c++) {
      var col = mk('i', 'ag-col');
      col.style.gridColumn = c + 2;
      col.style.gridRow = '2 / -1';
      cal.appendChild(col);
    }

    function block(b, fresh) {
      var e = mk('div', 'ag-ev t-' + b[5] + (fresh ? ' is-new is-fresh' : ''));
      e.appendChild(mk('b', null, b[3]));
      e.appendChild(mk('span', null, b[4]));
      e.appendChild(mk('i', 'ok'));
      e.setAttribute('data-day', b[0]);
      e.style.gridColumn = b[0] + 2;
      e.style.gridRow = (2 + (b[1] - 9) * 2) + ' / span ' + (b[2] * 2);
      cal.appendChild(e);
      if (fresh) setTimeout(function () { e.classList.remove('is-new'); }, 1400);
      return e;
    }
    BASE.forEach(function (b) { block(b, false); });

    function hhmm(min) { min = ((Math.round(min) % 1440) + 1440) % 1440; return pad(Math.floor(min / 60)) + ':' + pad(min % 60); }
    function phase(min) { return min >= 1860 ? 'morning' : (min >= 1320 ? 'night' : 'evening'); }
    var STATUS = {
      evening: 'Zaak gesloten. Je agenda niet.',
      night: 'Jij slaapt. Het systeem niet.',
      morning: 'Goedemorgen. Dit kwam er vannacht bij.'
    };
    var lastPhase = '';
    function setTime(min) {
      clock.textContent = hhmm(min);
      var p = phase(min);
      if (p !== lastPhase) {
        lastPhase = p;
        app.classList.toggle('is-night', p === 'night');
        app.classList.toggle('is-morning', p === 'morning');
        status.textContent = STATUS[p];
      }
    }

    var newCount = 0;
    function bump() { newCount++; countEl.textContent = newCount; countEl.classList.remove('pop'); void countEl.offsetWidth; countEl.classList.add('pop'); }

    var toastTimer = 0;
    function showToast(title, text, ch, kind) {
      $('[data-t-title]', toast).textContent = title;
      $('[data-t-text]', toast).textContent = text;
      $('[data-t-ch]', toast).textContent = ch || '';
      toast.classList.toggle('is-remind', kind === 'remind');
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2300);
    }

    function fire(ev) {
      if (ev.b) {
        var b = ev.b;
        block(b, true);
        bump();
        var slot = DAYS[b[0]].toLowerCase() + ' ' + hhmm(b[1] * 60);
        showToast('Nieuwe boeking', b[3] + ' · ' + b[4] + ' · ' + slot, 'via ' + ev.ch);
      } else if (ev.remind) {
        var mondays = $$('.ag-ev[data-day="0"]', cal);
        mondays.forEach(function (e, i) { setTimeout(function () { e.classList.add('is-reminded'); }, i * 140); });
        showToast('Herinneringen verstuurd', mondays.length + ' klanten van maandag', 'e-mail + sms', 'remind');
      }
    }

    /* reduced motion: toon meteen de ochtend */
    if (reduce) {
      EVENTS.forEach(function (ev) { if (ev.b) { block(ev.b, false).classList.add('is-fresh'); newCount++; } });
      $$('.ag-ev[data-day="0"]', cal).forEach(function (e) { e.classList.add('is-reminded'); });
      countEl.textContent = newCount;
      setTime(1890);
      return;
    }

    var visible = false, pending = null, idx = 0, sim = START, raf = 0;
    function later(fn, ms) {
      setTimeout(function () {
        if (visible && !document.hidden) fn(); else pending = fn;
      }, ms);
    }
    function resume() { if (pending && visible && !document.hidden) { var f = pending; pending = null; f(); } }
    watch(app, function (v) { visible = v; resume(); });
    document.addEventListener('visibilitychange', resume);

    function runTo(target, done) {
      var from = sim, ms = Math.max(700, Math.min(1900, (target - from) * 9)), t0 = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / ms);
        var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        sim = from + (target - from) * e;
        setTime(sim);
        if (p < 1) raf = requestAnimationFrame(step); else { sim = target; done(); }
      });
    }

    function next() {
      if (idx >= EVENTS.length) { later(reset, 3800); return; }
      var ev = EVENTS[idx++];
      runTo(ev.at, function () {
        fire(ev);
        later(next, ev.morning ? 400 : 2500);
      });
    }

    function reset() {
      toast.classList.remove('show');
      $$('.ag-ev.is-fresh', cal).forEach(function (e) {
        e.classList.add('is-out');
        setTimeout(function () { e.remove(); }, 520);
      });
      $$('.ag-ev.is-reminded', cal).forEach(function (e) { e.classList.remove('is-reminded'); });
      setTimeout(function () {
        newCount = 0; countEl.textContent = '0';
        idx = 0; sim = START; setTime(sim);
        later(next, 900);
      }, 600);
    }

    setTime(START);
    later(next, 1200);
  })();

  /* ============================================================
     2. BOEKINGSDEMO + TIJDMACHINE
     ============================================================ */
  (function () {
    var demo = $('[data-demo]');
    if (!demo) return;

    var SECTORS = {
      kapper: {
        svcs: [['Knippen', 30], ['Knippen & brushen', 45], ['Kleuring', 90]],
        weeks: 6, when: 'Na 6 weken',
        title: 'Tijd voor een nieuwe knipbeurt?',
        text: 'Je laatste bezoek is zes weken geleden. Kies meteen een nieuw moment, in twee tikken.'
      },
      beauty: {
        svcs: [['Gelaatsverzorging', 60], ['Manicure', 45], ['Wimperlift', 60]],
        weeks: 4, when: 'Na 4 weken',
        title: 'Tijd om jezelf weer te verwennen?',
        text: 'Je laatste behandeling is vier weken geleden. Kies meteen een nieuw moment.'
      },
      kine: {
        svcs: [['Eerste consultatie', 45], ['Behandeling', 30], ['Sportmassage', 45]],
        weeks: 3, when: 'Na 3 weken',
        title: 'Hoe gaat het met je herstel?',
        text: 'Plan je volgende sessie in, op een moment dat jou past.'
      },
      kliniek: {
        svcs: [['Consultatie', 30], ['Behandeling', 45], ['Nazorgafspraak', 20]],
        weeks: 13, when: 'Na 3 maanden',
        title: 'Tijd voor je opvolging',
        text: 'Drie maanden na je behandeling is het ideale moment voor een controle.'
      },
      garage: {
        svcs: [['Onderhoudsbeurt', 60], ['Bandenwissel', 30], ['Aircocheck', 45]],
        weeks: 52, when: 'Na 1 jaar',
        title: 'Je jaarlijkse onderhoud komt eraan',
        text: 'Je laatste beurt is een jaar geleden. Kies meteen een moment dat jou past.'
      }
    };
    var TIMES = ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'];

    var screen = $('[data-screen]', demo);
    var bizIn = $('[data-biz]', demo);
    var svcsBox = $('[data-svcs]', demo);
    var daysBox = $('[data-days]', demo);
    var timesBox = $('[data-times]', demo);
    var sumBox = $('[data-sum]', demo);
    var dots = $$('.ph-steps i', demo);
    var stack = $('[data-stack]', demo);
    var lkDate = $('[data-lk-date]', demo);
    var lkTime = $('[data-lk-time]', demo);
    var range = $('[data-range]', demo);
    var play = $('[data-play]', demo);
    var hint = $('[data-hint]', demo);
    var steps = $$('[data-steps] li', demo);
    var stepsBox = $('[data-steps]', demo);

    var again = mk('button', 'ag-again', 'Opnieuw boeken');
    again.type = 'button';
    $('.ag-scrub', demo).appendChild(again);

    var st = { sector: 'kapper', svc: -1, day: -1, time: '', k: 0, booked: false };
    var autoTimer = 0;

    function biz() { return (bizIn.value || '').replace(/\s+/g, ' ').trim() || 'Jouw zaak'; }
    function sector() { return SECTORS[st.sector]; }

    /* 5 dagen vanaf overmorgen, zondag overgeslagen. Morgen valt weg, anders
       zou de herinnering "1 dag vooraf" vóór het boekingsmoment liggen. */
    var DAYLIST = [];
    (function () {
      var d = new Date(); d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() + 1);
      while (DAYLIST.length < 5) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0) DAYLIST.push(new Date(d));
      }
    })();
    function taken(di, ti) { return (di * 7 + ti * 3) % 5 === 0; }

    function fmtShort(d) { return d.toLocaleDateString(LOC, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, ''); }
    function fmtLong(d) { return d.toLocaleDateString(LOC, { weekday: 'long', day: 'numeric', month: 'long' }); }
    function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
    function fmtTime(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

    function show(view) {
      $$('[data-view]', demo).forEach(function (v) { v.classList.toggle('is-on', v.getAttribute('data-view') === view); });
      var n = { svc: 0, slot: 1, ok: 2, done: 2 }[view];
      dots.forEach(function (d, i) { d.classList.toggle('on', i <= n); });
    }

    function paintBiz() {
      var b = biz();
      $('[data-bizname]', demo).textContent = b;
      $('[data-ava]', demo).textContent = b.charAt(0).toUpperCase();
      if (st.booked) renderLock();
    }

    function renderSvcs() {
      svcsBox.innerHTML = '';
      sector().svcs.forEach(function (s, i) {
        var btn = mk('button', 'ph-svc');
        btn.type = 'button';
        btn.appendChild(mk('b', null, s[0]));
        btn.appendChild(mk('span', null, s[1] + ' min'));
        btn.addEventListener('click', function () {
          st.svc = i; st.day = -1; st.time = '';
          renderDays(); renderTimes();
          show('slot');
        });
        svcsBox.appendChild(btn);
      });
      $('[data-rebook-when]', demo).textContent = sector().when;
    }

    function renderDays() {
      daysBox.innerHTML = '';
      DAYLIST.forEach(function (d, i) {
        var btn = mk('button', 'ph-day' + (i === st.day ? ' on' : ''));
        btn.type = 'button';
        btn.appendChild(mk('span', null, d.toLocaleDateString(LOC, { weekday: 'short' }).replace('.', '')));
        btn.appendChild(mk('b', null, String(d.getDate())));
        btn.addEventListener('click', function () { st.day = i; st.time = ''; renderDays(); renderTimes(); });
        daysBox.appendChild(btn);
      });
    }

    function renderTimes() {
      timesBox.innerHTML = '';
      if (st.day < 0) { timesBox.appendChild(mk('p', 'ph-pick', 'Kies eerst een dag.')); return; }
      TIMES.forEach(function (t, i) {
        var busy = taken(st.day, i);
        var btn = mk('button', 'ph-time' + (busy ? ' busy' : ''), busy ? 'bezet' : t);
        btn.type = 'button';
        btn.disabled = busy;
        if (busy) btn.setAttribute('aria-label', t + ' bezet');
        btn.addEventListener('click', function () { st.time = t; renderSum(); show('ok'); });
        timesBox.appendChild(btn);
      });
    }

    function apptDate() {
      var d = new Date(DAYLIST[st.day]);
      var p = st.time.split(':');
      d.setHours(+p[0], +p[1], 0, 0);
      return d;
    }

    function renderSum() {
      var s = sector().svcs[st.svc], d = apptDate();
      sumBox.innerHTML = '';
      [['Wat', s[0]], ['Wanneer', fmtLong(d)], ['Uur', st.time + ' · ' + s[1] + ' min'], ['Waar', biz()]].forEach(function (r) {
        var row = mk('div', 'ph-row');
        row.appendChild(mk('span', null, r[0]));
        row.appendChild(mk('b', null, r[1]));
        sumBox.appendChild(row);
      });
    }

    /* de vijf momenten na het boeken */
    function moments() {
      var s = sector(), svc = s.svcs[st.svc], a = apptDate(), b = biz();
      var now = new Date(); now.setSeconds(0, 0);
      var m1 = new Date(a.getTime() - 24 * 3600e3);
      var m2 = new Date(a.getTime() - 2 * 3600e3);
      var m3 = new Date(a.getTime() + (svc[1] + 120) * 60e3);
      var m4 = new Date(a.getTime() + s.weeks * 7 * 24 * 3600e3); m4.setHours(10, 0, 0, 0);
      return [
        { d: now, ch: 'E-mail', title: 'Je afspraak staat vast', text: svc[0] + ' op ' + fmtLong(a) + ' om ' + st.time + '. Past het toch niet? Verplaats of annuleer met één klik.' },
        { d: m1, ch: 'E-mail', title: 'Morgen verwachten we je', text: svc[0] + ' om ' + st.time + '. Tot morgen! Verplaatsen kan nog altijd via de link.' },
        { d: m2, ch: 'Sms', title: 'Tot straks!', text: 'Om ' + st.time + ' verwachten we je bij ' + b + '. Tik hier voor de route.' },
        { d: m3, ch: 'Sms', title: 'Hoe was het?', text: 'Bedankt voor je bezoek aan ' + b + '. Heb je 30 seconden voor een review? ★★★★★' },
        { d: m4, ch: 'E-mail', title: s.title, text: s.text }
      ];
    }

    function renderLock() {
      var ms = moments(), b = biz(), cur = ms[st.k];
      lkDate.textContent = cap(fmtLong(cur.d));
      lkTime.textContent = fmtTime(cur.d);
      stack.innerHTML = '';
      for (var i = st.k; i >= 0; i--) {
        var m = ms[i];
        var n = mk('div', 'lk-n' + (i === st.k ? ' is-new' : ''));
        var top = mk('div', 'n-top');
        top.appendChild(mk('span', 'n-ava', b.charAt(0).toUpperCase()));
        top.appendChild(mk('span', 'n-app', m.ch + ' · ' + b));
        top.appendChild(mk('time', null, i === st.k ? 'nu' : fmtShort(m.d)));
        n.appendChild(top);
        n.appendChild(mk('b', null, m.title));
        n.appendChild(mk('p', null, m.text));
        stack.appendChild(n);
      }
      steps.forEach(function (li, i) {
        li.classList.toggle('is-reached', i <= st.k);
        li.classList.toggle('is-current', i === st.k);
        var w = $('[data-when="' + i + '"]', li);
        if (w) w.textContent = fmtShort(ms[i].d) + ' · ' + fmtTime(ms[i].d);
      });
      line();
      range.value = st.k;
      range.style.setProperty('--fill', (st.k / 4 * 100) + '%');
    }

    /* verbindingslijn: van de eerste stip tot de laatste, gevuld tot de huidige */
    function line() {
      stepsBox.style.setProperty('--tot', steps[steps.length - 1].offsetTop + 'px');
      stepsBox.style.setProperty('--h', (st.booked ? steps[st.k].offsetTop : 0) + 'px');
    }
    window.addEventListener('resize', line);

    function setK(k) { st.k = Math.max(0, Math.min(4, k)); renderLock(); }

    function stopAuto() { clearInterval(autoTimer); autoTimer = 0; play.classList.remove('is-playing'); }
    function startAuto() {
      if (st.k >= 4) setK(0);
      play.classList.add('is-playing');
      clearInterval(autoTimer);
      autoTimer = setInterval(function () {
        if (st.k >= 4) { stopAuto(); return; }
        setK(st.k + 1);
      }, 2600);
    }

    function lockOn() {
      st.booked = true; st.k = 0;
      screen.classList.add('is-locked');
      demo.classList.add('is-booked');
      range.disabled = false; play.disabled = false;
      hint.textContent = 'Sleep de schuif of druk op play. Zo ziet je klant het, van boeking tot volgende afspraak.';
      renderLock();
      if (!reduce) startAuto();
    }

    function resetBooking() {
      stopAuto();
      st.svc = -1; st.day = -1; st.time = ''; st.k = 0; st.booked = false;
      screen.classList.remove('is-locked');
      demo.classList.remove('is-booked');
      range.disabled = true; play.disabled = true;
      range.value = 0; range.style.setProperty('--fill', '0%');
      steps.forEach(function (li) { li.classList.remove('is-reached', 'is-current'); $('time', li).textContent = ''; });
      hint.textContent = 'Boek eerst een afspraak in de telefoon. Daarna neemt het systeem het over.';
      line();
      renderSvcs();
      show('svc');
    }

    $('[data-confirm]', demo).addEventListener('click', function () {
      $('[data-done-text]', demo).textContent = 'Tot ' + fmtLong(apptDate()) + ' om ' + st.time + '.';
      show('done');
      setTimeout(lockOn, reduce ? 300 : 1500);
    });
    $$('[data-back]', demo).forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-back')); });
    });
    range.addEventListener('input', function () { stopAuto(); setK(+range.value); });
    play.addEventListener('click', function () { if (autoTimer) stopAuto(); else startAuto(); });
    again.addEventListener('click', resetBooking);
    steps.forEach(function (li, i) {
      li.addEventListener('click', function () { if (st.booked) { stopAuto(); setK(i); } });
    });
    bizIn.addEventListener('input', paintBiz);

    $$('[data-sector]', demo).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-sector]', demo).forEach(function (o) {
          var on = o === b;
          o.classList.toggle('on', on);
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        st.sector = b.getAttribute('data-sector');
        resetBooking();
      });
    });

    /* de tijdlijn pauzeert als hij uit beeld schuift */
    watch(demo, function (v) { if (!v) stopAuto(); }, 0.05);

    renderSvcs();
    paintBiz();
    show('svc');
    line();
  })();

  /* ============================================================
     3. LEKCHECK
     ============================================================ */
  (function () {
    var box = $('[data-leak]');
    if (!box) return;
    var WEEKS = 46;
    var inp = {};
    $$('input[data-k]', box).forEach(function (i) { inp[i.getAttribute('data-k')] = i; });
    var out = {};
    $$('[data-out]', box).forEach(function (o) { out[o.getAttribute('data-out')] = o; });
    var bars = { ns: $('[data-bar="ns"]', box), mc: $('[data-bar="mc"]', box) };
    var share = 1 / 3;

    function eur(x) { return '€ ' + Math.round(x).toLocaleString(LOC); }
    function one(x) { return x.toLocaleString(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }

    function fill(i) {
      var p = (i.value - i.min) / (i.max - i.min) * 100;
      i.style.setProperty('--fill', p + '%');
    }

    var shown = null, raf = 0;
    function tweenTotal(to) {
      if (shown === null || reduce) { shown = to; out.total.textContent = eur(to); return; }
      var from = shown, t0 = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / 380);
        shown = from + (to - from) * (1 - Math.pow(1 - p, 3));
        out.total.textContent = eur(shown);
        if (p < 1) raf = requestAnimationFrame(step);
      });
    }

    function calc() {
      var a = +inp.appts.value, v = +inp.value.value, n = +inp.ns.value / 100, m = +inp.missed.value;
      $('[data-o="appts"]', box).textContent = a;
      $('[data-o="value"]', box).textContent = eur(v);
      $('[data-o="ns"]', box).textContent = Math.round(n * 100) + '%';
      $('[data-o="missed"]', box).textContent = m;
      Object.keys(inp).forEach(function (k) { fill(inp[k]); });

      var ns = a * n * v * WEEKS;
      var mc = m * share * v * WEEKS;
      var tot = ns + mc;
      tweenTotal(tot);
      out.ns.textContent = eur(ns);
      out.mc.textContent = eur(mc);
      bars.ns.style.width = (tot ? ns / tot * 100 : 0) + '%';
      bars.mc.style.width = (tot ? mc / tot * 100 : 0) + '%';
      out.month.textContent = Math.round((a * n + m * share) * WEEKS / 12).toLocaleString(LOC);
      out.weeks.textContent = one(a * v ? tot / (a * v) : 0);
      box.classList.toggle('is-dry', tot < 1);
    }

    Object.keys(inp).forEach(function (k) { inp[k].addEventListener('input', calc); });
    $$('[data-share] button', box).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-share] button', box).forEach(function (o) {
          var on = o === b;
          o.classList.toggle('on', on);
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        share = parseFloat(b.getAttribute('data-v'));
        calc();
      });
    });
    calc();
  })();

  /* ============================================================
     4. MELDINGEN OVER DE FOTO
     ============================================================ */
  (function () {
    var fig = $('[data-pings]');
    if (!fig) return;
    var pings = $$('.ag-ping', fig);
    if (reduce) { pings.forEach(function (p) { p.classList.add('in'); }); return; }
    var done = false;
    watch(fig, function (v) {
      if (!v || done) return;
      done = true;
      pings.forEach(function (p, i) { setTimeout(function () { p.classList.add('in'); }, 500 + i * 1100); });
    }, 0.35);
  })();

  /* ============================================================
     5. SPOTLIGHT OP DE KAARTEN
     ============================================================ */
  if (canHover) {
    $$('.ag-feat').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }
})();
