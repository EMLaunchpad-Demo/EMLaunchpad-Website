/* =============================================================
   EM Launchpad — Pakketkiezer ("Eerlijk gewogen")
   Een toonbankweegschaal: links legt de zaak wat ze vraagt, rechts
   zetten wij er precies tegenover wat dat opvangt. Zes vragen, een
   eerlijk advies (ook wat we NIET aanraden) en een weegbriefje dat
   het gesprek voorbereidt.
   Bovenaan PK: de zuivere advieslogica (ook in Node te laden, zie
   scripts/paginas/pakketkiezer/check_pk.mjs). Daaronder de pagina.
   De toestand van de schaal is altijd een functie van de antwoorden
   (en de eigen keuze bij "Probeer zelf"); animatie is alleen de
   overgang tussen twee toestanden.
   ============================================================= */
var PK = (function () {
  'use strict';
  var INB = { reviews: [3], facturen: [7], herinneren: [8], kanalen: [4] };

  /* a = {vak, boek, opr, ber, inb:[...], doel}; onbeantwoorde vragen tellen niet mee */
  function advies(a) {
    a = a || {};
    var bel = a.boek === 'bel', bericht = a.boek === 'bericht';
    var inb = (a.inb || []).filter(function (x) { return x !== 'niets'; });
    var needs = [];
    function need(id, slot, w, key, ribs, by, doubt) { needs.push({ id: id, slot: slot, w: w, key: key, ribs: ribs || [], by: by, doubt: !!doubt }); }

    if (bel) need('boek', 'K1', 'zwaar', 'boek_bel', [1, 8, 4], 'dg');
    else if (bericht) need('boek', 'K1', 'zwaar', 'boek_bericht', [1, 4], 'dg');
    if (a.opr === 'dag') need('opr', 'K2', 'zwaar', 'opr_dag', [], 'recep');
    else if (a.opr === 'week') {
      if (bel) need('opr', 'K2', 'licht', 'opr_week_bel', [], 'recep', true);
      else need('opr', 'K2', 'licht', 'opr_week', [4], 'dg');
    }
    if (a.ber === 'avond') need('ber', 'K3', 'zwaar', 'ber_avond', [], 'chat');
    else if (a.ber === 'werk') {
      if (bericht) need('ber', 'K3', 'zwaar', 'ber_werk_bericht', [], 'chat');
      else need('ber', 'K3', 'licht', 'ber_werk', [], 'chat', true);
    } else if (a.ber === 'paar') need('ber', 'K3', 'licht', 'ber_paar', [4], 'dg');
    ['reviews', 'facturen', 'herinneren', 'kanalen'].forEach(function (c) {
      if (inb.indexOf(c) >= 0) need('inb_' + c, 'S', 'schijf', 'inb_' + c, INB[c], 'dg');
    });
    if (a.doel === 'klanten') need('doel', 'S', 'schijf', 'doel_klanten', [1, 2, 5, 6], 'dg');
    else if (a.doel === 'eenplek') need('doel', 'S', 'schijf', 'doel_eenplek', [9, 4], 'dg');

    var R = a.opr === 'dag' ? 'ja' : (a.opr === 'week' && bel ? 'twijfel' : 'nee');
    var C = (a.ber === 'avond' || (a.ber === 'werk' && bericht)) ? 'ja' : (a.ber === 'werk' ? 'twijfel' : 'nee');
    var dgNeeds = needs.filter(function (n) { return n.by === 'dg'; }).length;
    var DG = dgNeeds > 0 || R !== 'nee' || C !== 'nee';
    var CONS = a.doel === 'intern';
    var outcome = CONS ? (DG ? 'B' : 'A') : (DG ? 'C' : 'D');
    var price = (DG ? 150 : 0) + (C === 'ja' ? 50 : 0) + (R === 'ja' ? 125 : 0);

    var ribs = [];
    needs.forEach(function (n) { n.ribs.forEach(function (r) { if (ribs.indexOf(r) < 0) ribs.push(r); }); });

    var why = [];
    if (R === 'ja') why.push('recep');
    if (C === 'ja') why.push(a.ber === 'avond' ? 'chat_avond' : 'chat_werk');
    if (a.doel === 'klanten' || a.doel === 'eenplek') why.push(a.doel);
    if (bel) why.push('agenda_bel'); else if (bericht) why.push('agenda_bericht');
    if (inb.indexOf('kanalen') >= 0) why.push('inbox_kanalen');
    else if (a.opr === 'week' && !bel) why.push('inbox_opr');
    else if (a.ber === 'paar') why.push('inbox_ber');
    ['reviews', 'facturen', 'herinneren'].forEach(function (c) { if (inb.indexOf(c) >= 0) why.push(c); });
    why = why.slice(0, 4);

    var not = [];
    if (R === 'nee' && a.opr) not.push(a.opr === 'zelden' ? 'recep_zelden' : a.opr === 'week' ? 'recep_week' : 'recep_onbekend');
    if (C === 'nee' && a.ber) not.push(a.ber === 'zelden' ? 'chat_zelden' : 'chat_paar');
    if (a.doel && !CONS) not.push('cons');

    var talk = [];
    if (R === 'twijfel') talk.push('recep');
    if (C === 'twijfel') talk.push('chat');
    if (a.opr === 'onbekend') talk.push('tel');
    if (a.boek === 'online') talk.push('agenda');
    if (outcome === 'B') talk.push('volgorde');
    talk = talk.slice(0, 3);

    var proof = null;
    if (outcome === 'B' || outcome === 'C') {
      if (bel || bericht || inb.indexOf('herinneren') >= 0) proof = 'afspraken';
      else if (a.doel === 'klanten') proof = 'web';
      else if (inb.indexOf('reviews') >= 0 || inb.indexOf('facturen') >= 0) proof = 'mails';
      else proof = 'afspraken';
    }
    var alt = [];
    if (R === 'twijfel') alt.push({ x: 'recep', p: price + 125 });
    if (C === 'twijfel') alt.push({ x: 'chat', p: price + 50 });

    return { needs: needs, R: R, C: C, DG: DG, CONS: CONS, outcome: outcome, price: price, ribs: ribs,
             why: why, not: not, talk: talk, proof: proof, alt: alt,
             k: { dg: DG, c: C === 'ja', r: R === 'ja' } };
  }

  /* prijs van een eigen keuze; een uitbreiding bestaat alleen bovenop Digitale groei */
  function prijs(k) { return k && k.dg ? 150 + (k.c ? 50 : 0) + (k.r ? 125 : 0) : 0; }

  return { advies: advies, prijs: prijs };
})();
if (typeof module === 'object' && module.exports) module.exports = PK;

(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  var hero = document.querySelector('[data-pk-hero]'), src = document.getElementById('pkData');
  if (!hero || !src) return;
  var D;
  try { D = JSON.parse(src.textContent); } catch (e) { return; }

  var U = D.ui, R = D.result, B = D.brief;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LOC = { nl: 'nl-BE', en: 'en-GB', fr: 'fr-BE' }[D.lang] || 'nl-BE';
  var KEY = 'em_pk';
  var QIDS = D.q.map(function (q) { return q.id; });
  var LAST = QIDS.length - 1;
  var NS = 'http://www.w3.org/2000/svg';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function fill(s, v) { return String(s == null ? '' : s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; }); }
  function eur(n) { return fill(D.eur, { n: n }); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function f2(n) { return (Math.round(n * 100) / 100).toString(); }
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function lc(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function uc(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function wide() { return window.matchMedia('(min-width: 960px)').matches; }
  /* bedragen voluit voor de schermlezer: "+€125" -> "plus 125 euro" */
  function spoken(s) {
    return String(s).replace(/(\+\s?)?€\s?(\d[\d.]*)|(\+\s?)?(\d[\d.]*)[\s ]€/g, function (m, p1, n1, p3, n3) {
      return ((p1 || p3) ? U.plus_word + ' ' : '') + (n1 || n3) + ' ' + U.euro_word;
    });
  }

  /* ---------------- toestand ---------------- */
  var S = { a: {}, i: 0, n: '', k: null, done: false, edit: false, fb: {} };
  function load() {
    try {
      var o = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (o && o.v === 1 && o.a) {
        S.a = o.a; S.i = clamp(o.i | 0, 0, LAST); S.n = typeof o.n === 'string' ? o.n.slice(0, 60) : '';
        S.k = o.k || null; S.done = !!o.d; return true;
      }
    } catch (e) {}
    return false;
  }
  function save() {
    try { sessionStorage.setItem(KEY, JSON.stringify({ v: 1, a: S.a, i: S.i, n: S.n, k: S.k, d: S.done })); } catch (e) {}
  }
  function clear() { try { sessionStorage.removeItem(KEY); } catch (e) {} }
  function answered(id) { var v = S.a[id]; return v != null && (id !== 'inb' || v.length > 0); }
  function allAnswered() { return QIDS.every(answered); }
  function adv() { return PK.advies(S.a); }
  function vakObj() {
    for (var i = 0; i < D.vak.length; i++) if (D.vak[i].c === S.a.vak) return D.vak[i];
    return null;
  }
  function V() { return vakObj() || D.gen; }
  function qObj(id) { return D.q[QIDS.indexOf(id)]; }
  function opts(id) { return id === 'vak' ? D.vak : (qObj(id).opts || []); }
  function kort(id, c) {
    var o = opts(id);
    for (var i = 0; i < o.length; i++) if (o[i].c === c) return o[i].kort;
    return '';
  }
  function kortAns(id) {
    var v = S.a[id];
    if (v == null) return '';
    if (id === 'inb') return v.map(function (c) { return kort('inb', c); }).join(', ');
    return kort(id, v);
  }

  /* ---------------- elementen ---------------- */
  var card = $('[data-pk-card]', hero), ticket = $('[data-pk-ticket]', hero), ticketB = $('[data-pk-ticketb]', hero), stage = $('[data-pk-stage]', hero);
  var svg = $('[data-pk-svg]', hero), lists = $('[data-pk-lists]', hero), sum = $('[data-pk-sum]', hero), sumT = $('[data-pk-sumt]', hero);
  var live = $('[data-pk-live]', hero), fbEl = $('[data-pk-fb]', hero), errEl = $('[data-pk-err]', hero);
  var nav = $('[data-pk-nav]', hero), back = $('[data-pk-back]', hero), next = $('[data-pk-next]', hero), tores = $('[data-pk-tores]', hero);
  var prog = $('[data-pk-prog]', hero), welcome = $('[data-pk-welcome]', hero), welcomeT = $('[data-pk-welcomet]', hero);
  var fsets = $$('.pk-q', hero);
  if (!card || !ticket || !ticketB || !svg || fsets.length !== D.q.length) return;
  var nextLabel = next.innerHTML;

  hero.classList.add('is-js');
  nav.hidden = false; prog.hidden = false; lists.hidden = false; sum.hidden = false;
  if (!wide()) lists.classList.add('is-collapsed');

  /* ================= DE WEEGSCHAAL ================= */
  var beam = $('[data-pk-beam]', svg), needle = $('[data-pk-needle]', svg);
  var panL = $('[data-pk-pan="L"]', svg), panR = $('[data-pk-pan="R"]', svg);
  var priceEls = [$('[data-pk-price="a"]', svg), $('[data-pk-price="b"]', svg)], pi = 0, priceTxt = priceEls[0].textContent;
  var plate = $('[data-pk-plate]', svg), consEl = $('[data-pk-cons]', svg), noteCount = $('[data-pk-note="count"]', svg);
  var ribEls = $$('.pk-rib', svg);
  var tags = $$('.pk-tag.pk-wide', svg);   /* DIGITALE GROEI, +€50, +€125 onder de stukken op de toonbank */
  var OFF = { K1: -54, K2: -22, K3: 10, S: 50, dg: -30, chat: 34, recep: 60 };
  var HOME = { dg: [428, 326], chat: [492, 326], recep: [526, 326] };
  var O = {};
  function mk(el, kind) {
    return { el: el, sq: $('.pk-sq', el), kind: kind, mode: kind === 'piece' ? 'counter' : 'hidden', x: 0, y: 0, op: kind === 'piece' ? 1 : 0, an: null, w: null };
  }
  ['K1', 'K2', 'K3'].forEach(function (k) { O[k] = mk($('[data-pk-w="' + k + '"]', svg), 'w'); });
  for (var di = 0; di < 5; di++) { O['d' + di] = mk($('[data-pk-disc="' + di + '"]', svg), 'disc'); O['d' + di].idx = di; }
  ['dg', 'chat', 'recep'].forEach(function (id) { O[id] = mk($('[data-pk-piece="' + id + '"]', svg), 'piece'); });

  var th = 0, om = 0, tht = 0, sn = 0, raf = 0, last = 0, visible = true, gen = 0, cur = null;

  function target(id, o) {
    if (o.kind === 'piece') {
      if (o.mode === 'counter') return HOME[id];
      return [460 + OFF[id], 128 + 180 * sn - (o.mode === 'float' ? 14 : 0)];
    }
    if (o.kind === 'disc') return [100 + OFF.S, 128 - 180 * sn - 8 * o.idx];
    return [100 + OFF[id], 128 - 180 * sn];
  }
  function baseOp(o) { return o.mode === 'hidden' ? 0 : o.mode === 'float' ? 0.55 : 1; }
  function squash(o) {
    if (!o.sq || reduce) return;
    o.sq.classList.add('is-sq');
    setTimeout(function () { o.sq.classList.remove('is-sq'); }, 90);
  }
  function land(id, o, a) {
    squash(o);
    if (a.type === 'drop') om += a.w === 'zwaar' ? -36 : a.w === 'licht' ? -18 : -9;
    else if (a.type === 'arc' && o.mode === 'pan') om += (id === 'chat') ? 18 : 30;
  }
  function draw(t) {
    var r = th * Math.PI / 180;
    sn = Math.sin(r);
    beam.setAttribute('transform', 'rotate(' + f2(th) + ' 280 150)');
    needle.setAttribute('transform', 'rotate(' + f2(3 * th) + ' 280 150)');
    panL.setAttribute('transform', 'translate(0 ' + f2(-180 * sn) + ')');
    panR.setAttribute('transform', 'translate(0 ' + f2(180 * sn) + ')');
    var busy = false;
    Object.keys(O).forEach(function (id) {
      var o = O[id], tg = target(id, o), x = tg[0], y = tg[1], op = baseOp(o), a = o.an;
      if (a) {
        var p = (t - a.t0) / a.dur;
        if (p < 0) {
          busy = true;
          if (a.type === 'drop') op = 0;
          else if (a.type === 'arc') { x = a.from[0]; y = a.from[1]; op = a.op0; }
          else op = a.op0;
        } else if (p < 1) {
          busy = true;
          if (a.type === 'drop') {
            y = tg[1] - 24 * (1 - p * p);
            op = Math.min(1, (t - a.t0) / 80);
          } else if (a.type === 'arc') {
            var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            var cx = (a.from[0] + tg[0]) / 2, cy = Math.min(a.from[1], tg[1]) - 60;
            x = (1 - e) * (1 - e) * a.from[0] + 2 * (1 - e) * e * cx + e * e * tg[0];
            y = (1 - e) * (1 - e) * a.from[1] + 2 * (1 - e) * e * cy + e * e * tg[1];
            op = a.op0 + (op - a.op0) * e;
          } else {
            op = a.op0 + (op - a.op0) * p;
          }
        } else {
          o.an = null;
          land(id, o, a);
        }
      }
      o.x = x; o.y = y; o.op = op;
      o.el.setAttribute('transform', 'translate(' + f2(x) + ' ' + f2(y) + ')');
      o.el.setAttribute('opacity', f2(op));
    });
    return busy;
  }
  function frame(t) {
    raf = 0;
    var dt = last ? Math.min((t - last) / 1000, 1 / 30) : 1 / 60;
    last = t;
    if (reduce) { th = tht; om = 0; }
    else {
      /* veer-demper: θ'' = −110·(θ−θt) − 7,3·θ' (ongeveer 2 à 3 zwaaien, rust na ±1,1 s) */
      om += (-110 * (th - tht) - 7.3 * om) * dt;
      th += om * dt;
      if (th > 6) { th = 6; om = Math.min(om, 0); }
      if (th < -6) { th = -6; om = Math.max(om, 0); }
    }
    var busy = draw(t);
    if (busy || Math.abs(th - tht) > 0.02 || Math.abs(om) > 0.05) {
      if (visible) raf = requestAnimationFrame(frame); else settle();
    } else { th = tht; om = 0; draw(t); last = 0; }
  }
  function wake() {
    if (!visible || document.hidden) { settle(); return; }
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }
  /* buiten beeld of in een verborgen tabblad: meteen naar de eindtoestand */
  function settle() {
    Object.keys(O).forEach(function (id) { O[id].an = null; });
    th = tht; om = 0;
    draw(now());
  }
  function later(ms, g, fn) { setTimeout(function () { if (g === gen) fn(); }, Math.max(0, ms)); }

  function setPrice(txt, anim) {
    if (txt === priceTxt) return;
    priceTxt = txt;
    var o = priceEls[pi], n = priceEls[1 - pi];
    pi = 1 - pi;
    n.textContent = txt;
    if (!anim || reduce) {
      o.setAttribute('class', 'pk-price is-out');
      n.setAttribute('class', 'pk-price');
      return;
    }
    n.setAttribute('class', 'pk-price is-below');
    n.getBBox && n.getBBox();
    setTimeout(function () {
      o.setAttribute('class', 'pk-price is-anim is-out');
      n.setAttribute('class', 'pk-price is-anim');
    }, 20);
  }
  var plateT = 0, plateTxt = plate.textContent;
  function setPlate(txt, flash) {
    clearTimeout(plateT);
    var want = flash ? U.zit_erin : txt;
    function put(s) {
      if (plate.textContent === s) return;
      if (reduce) { plate.textContent = s; return; }
      plate.classList.add('is-fade');
      setTimeout(function () { plate.textContent = s; plate.classList.remove('is-fade'); }, 120);
    }
    plateTxt = txt;
    put(want);
    if (flash) plateT = setTimeout(function () { put(plateTxt); }, 1600);
  }
  function setRibs(on, g, t0, sweep) {
    var want = {};
    on.forEach(function (r) { want[r] = 1; });
    var j = 0;
    ribEls.forEach(function (el) {
      var r = +el.getAttribute('data-rib'), isOn = el.classList.contains('on');
      if (sweep && !reduce) {
        el.style.transitionDelay = (j++ * 60) + 'ms';
        el.classList.add('on');
      } else if (want[r] && !isOn) {
        el.style.transitionDelay = reduce ? '0ms' : (j++ * 80) + 'ms';
        el.classList.add('on');
      } else if (!want[r] && isOn) {
        el.style.transitionDelay = '0ms';
        el.classList.remove('on');
      }
    });
    if (sweep && !reduce) later(9 * 60 + 420, g, function () { setRibs(on, g, 0, false); });
    return j;
  }

  /* de gewenste toestand van de schaal */
  function viewOf() {
    var A = adv(), k = S.done ? S.k : null, pieces = {};
    if (k) { pieces.dg = k.dg ? 'pan' : 'counter'; pieces.chat = k.c ? 'pan' : 'counter'; pieces.recep = k.r ? 'pan' : 'counter'; }
    else {
      pieces.dg = A.DG ? 'pan' : 'counter';
      pieces.chat = A.C === 'ja' ? 'pan' : A.C === 'twijfel' ? 'float' : 'counter';
      pieces.recep = A.R === 'ja' ? 'pan' : A.R === 'twijfel' ? 'float' : 'counter';
    }
    var left = {}, discs = 0;
    A.needs.forEach(function (n) { if (n.slot === 'S') discs++; else left[n.slot] = n.w; });
    var t = 0;
    if (!k) { if (pieces.chat === 'float' || pieces.recep === 'float') t = -1.5; }
    else t = devTheta(A, k);
    var price = k ? PK.prijs(k) : A.price;
    var win = k ? eur(price) : A.DG ? eur(price) : (S.done && A.outcome === 'D') ? eur(0) : U.dash;
    return { A: A, k: k, pieces: pieces, left: left, discs: discs, ribs: pieces.dg !== 'counter' ? A.ribs : [], th: t, win: win,
             cons: A.CONS, count: S.a.opr === 'onbekend' };
  }
  function devTheta(A, k) {
    var t = 0, aC = A.C === 'ja', aR = A.R === 'ja';
    if (k.c && !aC) t += A.C === 'twijfel' ? 0 : 2;
    if (k.r && !aR) t += A.R === 'twijfel' ? 0 : 5;
    if (!k.c && aC) t -= 2;
    if (!k.r && aR) t -= 5;
    if (!k.dg && A.DG) t -= 5;
    if (k.dg && !A.DG) t += 2;
    return clamp(t, -6, 6);
  }

  /* van de huidige naar de nieuwe toestand; opts.sweep = alle ribbels één keer na elkaar */
  function apply(v, animate, opts) {
    opts = opts || {};
    gen++;
    var g = gen;
    consEl.classList.toggle('is-on', !!v.cons);
    noteCount.classList.toggle('is-on', !!v.count);
    tags.forEach(function (el, j) { el.classList.toggle('is-away', v.pieces[['dg', 'chat', 'recep'][j]] !== 'counter'); });
    if (!animate || reduce || !visible || document.hidden) {
      ['K1', 'K2', 'K3'].forEach(function (k) { var o = O[k]; o.an = null; o.mode = v.left[k] ? 'pan' : 'hidden'; if (v.left[k]) setW(o, v.left[k]); });
      for (var i = 0; i < 5; i++) { O['d' + i].an = null; O['d' + i].mode = i < v.discs ? 'pan' : 'hidden'; }
      ['dg', 'chat', 'recep'].forEach(function (id) { O[id].an = null; O[id].mode = v.pieces[id]; });
      svg.classList.add('no-tr');
      setRibs(v.ribs, g, 0, false);
      tht = th = v.th; om = 0;
      setPrice(v.win, false);
      draw(now());
      void svg.getBoundingClientRect();
      svg.classList.remove('no-tr');
      return;
    }
    var t = now(), drops = [], fades = 0;
    ['K1', 'K2', 'K3'].forEach(function (k) {
      var o = O[k], w = v.left[k] || null;
      if (w && (o.mode !== 'pan' || o.w !== w)) {
        setW(o, w); o.mode = 'pan';
        o.an = { type: 'drop', t0: t, dur: 240, w: w, op0: 0 };
        drops.push(w);
      } else if (!w && o.mode === 'pan') {
        o.mode = 'hidden'; o.an = { type: 'fade', t0: t, dur: 150, op0: o.op }; fades++;
      }
    });
    var nd = 0;
    for (var d = 0; d < 5; d++) {
      var od = O['d' + d];
      if (d < v.discs && od.mode !== 'pan') { od.mode = 'pan'; od.an = { type: 'drop', t0: t + nd * 70, dur: 240, w: 'schijf', op0: 0 }; nd++; }
      else if (d >= v.discs && od.mode === 'pan') { od.mode = 'hidden'; od.an = { type: 'fade', t0: t, dur: 150, op0: od.op }; fades++; }
    }
    var heavy = drops.indexOf('zwaar') >= 0 ? -5 : drops.length ? -2.5 : nd ? -1.2 : 0;
    var tLand = (drops.length || nd) ? t + 240 + Math.max(0, nd - 1) * 70 : t;
    var moves = ['dg', 'chat', 'recep'].filter(function (id) { return O[id].mode !== v.pieces[id]; });
    var tMove = tLand + ((drops.length || nd) ? 300 : 0);
    moves.forEach(function (id, j) {
      var o = O[id];
      var a = { type: 'arc', t0: tMove + j * 140, dur: v.pieces[id] === 'counter' ? 500 : 600, from: [o.x, o.y], op0: o.op };
      o.mode = v.pieces[id]; o.an = a;
    });
    var tEnd = moves.length ? tMove + (moves.length - 1) * 140 + 600 : tLand;
    later(tEnd - t, g, function () { setRibs(v.ribs, g, 0, opts.sweep); });
    var ribT = opts.sweep ? 9 * 60 + 420 : Math.max(0, v.ribs.length) * 80 + 220;
    var tFinal = Math.max(tEnd + ((drops.length || nd) && !moves.length ? ribT : 0), t);
    if (heavy) later(tLand - t, g, function () { tht = heavy; wake(); });
    later(tFinal - t, g, function () { tht = v.th; setPrice(v.win, true); wake(); });
    wake();
  }
  function setW(o, w) {
    o.w = w;
    o.el.classList.toggle('is-light', w === 'licht');
  }

  /* hover op een rij in de lijsten licht het stuk op */
  function hot(ref, on) {
    var o = O[ref];
    if (o) o.el.classList.toggle('is-hot', on);
    if (ref === 'cons') consEl.classList.toggle('is-hot', on);
  }

  /* ================= LIJSTEN ================= */
  var needsUl = $('[data-pk-needs]', hero), catchUl = $('[data-pk-catch]', hero), offW = $('[data-pk-offw]', hero), offUl = $('[data-pk-off]', hero), startEl = $('[data-pk-start]', hero);
  function li(txt, ref, sub, tag) {
    var el = document.createElement('li');
    var s = document.createElement('span');
    s.textContent = txt;
    el.appendChild(s);
    if (tag) { var em = document.createElement('em'); em.className = 'pk-litag'; em.textContent = tag; el.appendChild(document.createTextNode(' ')); el.appendChild(em); }
    if (sub) { var sm = document.createElement('small'); sm.textContent = sub; el.appendChild(sm); }
    if (ref) {
      el.setAttribute('data-ref', ref);
      el.addEventListener('mouseenter', function () { hot(ref, true); });
      el.addEventListener('mouseleave', function () { hot(ref, false); });
    }
    return el;
  }
  function renderLists(v) {
    var A = v.A, vv = V();
    needsUl.textContent = ''; catchUl.textContent = ''; offUl.textContent = '';
    var di2 = 0;
    A.needs.forEach(function (n) {
      var ref = n.slot === 'S' ? 'd' + (di2++) : n.slot;
      needsUl.appendChild(li(fill(D.needs[n.key], vv), ref, '', n.doubt ? U.talk : ''));
    });
    if (v.pieces.dg !== 'counter') {
      var names = A.ribs.slice().sort(function (a, b) { return a - b; }).map(function (r) { return D.ribs[r - 1]; });
      catchUl.appendChild(li(U.dg + ' · ' + eur(150), 'dg', names.length ? fill(U.catch_dg_sub, { ribs: names.join(', ') }) : U.catch_dg_base));
    }
    [['chat', 50], ['recep', 125]].forEach(function (x) {
      var m = v.pieces[x[0]];
      if (m === 'pan') catchUl.appendChild(li(uc(U[x[0]]) + ' · +' + eur(x[1]), x[0]));
      else if (m === 'float') catchUl.appendChild(li(uc(U[x[0]]) + ' · ' + U.talk, x[0], fill(U.catch_maybe, { p: '+' + eur(x[1]) })));
    });
    if (A.CONS) catchUl.appendChild(li(U.cons_side, 'cons'));
    if (v.pieces.recep === 'counter' && S.a.opr) offUl.appendChild(li(fill(U.off_recep, { p: eur(125) }), 'recep'));
    if (v.pieces.chat === 'counter' && S.a.ber) offUl.appendChild(li(fill(U.off_chat, { p: eur(50) }), 'chat'));
    if (S.a.doel && !A.CONS) offUl.appendChild(li(U.off_cons, 'cons'));
    var empty = !needsUl.children.length && !catchUl.children.length;
    if (!needsUl.children.length) needsUl.appendChild(li(U.empty));
    if (!catchUl.children.length) catchUl.appendChild(li(U.empty));
    offW.hidden = !offUl.children.length;
    startEl.hidden = !(empty && offW.hidden);
    sumT.textContent = empty ? U.sum_none : fill(U.sum, { n: A.needs.length, p: v.win === U.dash ? '—' : v.win + ' ' + U.per_month });
  }
  sum.addEventListener('click', function () {
    var open = lists.classList.toggle('is-collapsed') === false;
    sum.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* ================= DE VRAGEN ================= */
  var lastPointer = -1e9, advT = 0;
  function legends() {
    var vv = V();
    fsets.forEach(function (fs, i) { var el = $('[data-pk-qt]', fs); if (el) el.textContent = fill(D.q[i].legend, vv); });
    setPlate(vv.plaat || D.gen.plaat, false);
  }
  function syncInputs() {
    fsets.forEach(function (fs, i) {
      var id = QIDS[i], v = S.a[id];
      $$('input', fs).forEach(function (inp) {
        inp.checked = id === 'inb' ? !!(v && v.indexOf(inp.value) >= 0) : v === inp.value;
      });
    });
  }
  function progress() {
    $$('li', prog).forEach(function (el, i) {
      el.classList.toggle('is-done', answered(QIDS[i]));
      el.classList.toggle('is-cur', i === S.i && !S.done);
    });
  }
  function show(i, focus) {
    S.i = clamp(i, 0, LAST);
    fsets.forEach(function (fs, j) { fs.hidden = j !== S.i; });
    back.hidden = S.i === 0;
    next.innerHTML = S.i === LAST ? (U.to_result + ' ' + next.querySelector('svg').outerHTML) : nextLabel;
    tores.hidden = !(S.edit && allAnswered() && S.i < LAST);
    errEl.hidden = true;
    var f = S.fb[S.i];
    fbEl.hidden = !f; fbEl.textContent = f || '';
    stage.classList.toggle('is-avond', QIDS[S.i] === 'ber' && !S.done);
    progress();
    save();
    if (focus) {
      var lg = $('legend', fsets[S.i]);
      if (lg) lg.focus({ preventScroll: true });
      bring();
    }
  }
  /* op de gsm: schaal en vraag samen in beeld houden */
  function bring() {
    var navH = 86;
    if (wide()) {
      var r = card.getBoundingClientRect();
      if (r.top < navH || r.bottom > window.innerHeight) card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
      return;
    }
    var rc = card.getBoundingClientRect();
    if (rc.top < navH || rc.bottom > window.innerHeight) {
      var y = stage.getBoundingClientRect().top + window.pageYOffset - navH - 8;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function fbFor(id, val, extra) {
    var vv = V(), key;
    if (id === 'vak') key = 'vak';
    else if (id === 'boek') key = 'boek_' + val;
    else if (id === 'opr') key = val === 'week' ? (S.a.boek === 'bel' ? 'opr_week_bel' : 'opr_week') : 'opr_' + val;
    else if (id === 'ber') key = val === 'werk' ? (S.a.boek === 'bericht' ? 'ber_werk_bericht' : 'ber_werk') : 'ber_' + val;
    else if (id === 'doel') key = 'doel_' + val;
    else key = extra;
    return fill(D.fb[key], { werk: vv.werk, need: lc(kort('inb', val)) });
  }
  function onChange(fs, inp) {
    var i = +fs.getAttribute('data-i'), id = QIDS[i], q = D.q[i], val = inp.value, fbKey = null, flash = false;
    var before = viewOf();
    S.k = null;                       /* nieuwe antwoorden: de eigen keuze vervalt */
    if (q.type === 'check') {
      var boxes = $$('input', fs), list;
      if (val === 'niets' && inp.checked) {
        var had = boxes.some(function (b) { return b !== inp && b.checked; });
        boxes.forEach(function (b) { if (b !== inp) b.checked = false; });
        fbKey = had ? 'inb_cleared' : 'inb_niets';
      } else {
        if (inp.checked) boxes.forEach(function (b) { if (b.value === 'niets') b.checked = false; });
        fbKey = inp.checked ? 'inb_on' : 'inb_off';
        flash = inp.checked;
      }
      list = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
      if (list.length) S.a.inb = list; else delete S.a.inb;
    } else {
      S.a[id] = val;
    }
    if (id === 'vak') legends();
    var v = viewOf();
    var fb = fbFor(id, val, fbKey);
    S.fb[i] = fb;
    fbEl.textContent = fb; fbEl.hidden = false; errEl.hidden = true;
    apply(v, true, { sweep: id === 'doel' && val === 'eenplek' && before.A.needs.every(function (n) { return n.key !== 'doel_eenplek'; }) });
    renderLists(v);
    if (flash) setPlate(V().plaat, true);
    live.textContent = id === 'vak' ? fb : spoken(fb + ' ' + (v.A.DG ? fill(U.total_live, { p: eur(v.A.price) }) : U.total_none));
    progress();
    save();
    /* automatisch verder, alleen na aanwijzen of tikken en nooit bij de meerkeuzevraag */
    clearTimeout(advT);
    if (q.type === 'radio' && now() - lastPointer < 800) {
      var landed = JSON.stringify(before.left) !== JSON.stringify(v.left) || before.discs !== v.discs;
      advT = setTimeout(function () {
        if (S.done || S.i !== i) return;
        if (S.edit && allAnswered()) result(true); else goNext();
      }, reduce ? 250 : landed ? 700 : 450);
    }
  }
  fsets.forEach(function (fs) {
    fs.addEventListener('pointerdown', function () { lastPointer = now(); });
    fs.addEventListener('change', function (e) { if (e.target && e.target.matches('input')) onChange(fs, e.target); });
    fs.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target && e.target.matches('input')) { e.preventDefault(); goNext(); }
    });
  });
  function goNext() {
    clearTimeout(advT);
    var id = QIDS[S.i];
    if (!answered(id)) {
      if (id === 'inb') { S.a.inb = ['niets']; syncInputs(); }
      else { errEl.hidden = false; return; }
    }
    if (S.i === LAST || (S.edit && allAnswered() && S.i === LAST)) { result(true); return; }
    show(S.i + 1, true);
  }
  next.addEventListener('click', goNext);
  back.addEventListener('click', function () { clearTimeout(advT); show(S.i - 1, true); });
  tores.addEventListener('click', function () { result(true); });

  /* ================= HET WEEGBRIEFJE ================= */
  var T = {};
  ['kick', 'rh', 'voor', 'mode', 'big', 'opb', 'mono', 'alt', 'ptxt', 'whyw', 'why', 'notw', 'not', 'talkw', 'talk', 'proof', 'proofv', 'dev', 'devt', 'pre', 'status', 'chips'].forEach(function (k) {
    T[k] = $('[data-pk-' + k + ']', hero);
  });
  var kBtns = $$('[data-pk-k]', ticketB), nameIn = $('#pkName', ticketB), copyB = $('[data-pk-copy]', ticketB), shareB = $('[data-pk-share]', ticketB);
  var waLinks = $$('[data-pk-wa]'), inclLis = $$('[data-pk-rib]', ticketB);
  var ctaH = $('[data-pk-ctah]'), rows = $$('[data-pk-row]'), pws = $$('[data-pk-pw]');

  function datum() {
    try { return new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function kNow(A) { return S.k || A.k; }
  function listOf(k) {
    var l = [];
    if (k.dg) l.push(U.dg);
    if (k.c) l.push(U.chat);
    if (k.r) l.push(U.recep);
    return l;
  }
  function adviesTxt(A) {
    if (A.outcome === 'A') return B.adv_A;
    if (A.outcome === 'B') return fill(B.adv_B, { p: eur(A.price) });
    if (A.outcome === 'D') return B.adv_D;
    var s = fill(B.adv_C, { list: listOf(A.k).join(B.and), p: eur(A.price) });
    A.alt.forEach(function (x) { s += fill(B.adv_doubt, { x: U[x.x] }); });
    return s;
  }
  function briefTxt(head) {
    var A = adv(), L = [], vk = vakObj();
    if (head) L.push(fill(B.head, { datum: datum() }));
    if (S.n) L.push(fill(B.zaak_naam, { naam: S.n, v: vk ? vk.kort : '' }).replace(' ()', ''));
    else if (vk) L.push(fill(B.zaak, { v: vk.kort }));
    L.push(fill(B.advies, { v: adviesTxt(A) }));
    if (S.a.boek) L.push(fill(B.boek, { v: kortAns('boek') }));
    if (S.a.opr) L.push(fill(B.opr, { v: kortAns('opr') }));
    if (S.a.ber) L.push(fill(B.ber, { v: kortAns('ber') }));
    if (S.a.inb) L.push(fill(B.inb, { v: kortAns('inb') }));
    if (S.a.doel) L.push(fill(B.doel, { v: kortAns('doel') }));
    if (A.talk.length) L.push(fill(B.talk, { v: A.talk.map(function (x) { return D.talk_short[x]; }).join(', ') }));
    if (S.k) L.push(fill(B.zelf, { v: listOf(S.k).join(B.and) || '—', p: eur(PK.prijs(S.k)) }));
    return L.join('\n');
  }
  function waTxt() {
    var A = adv();
    var s = D.wa.hallo + '\n\n' + briefTxt(false) + '\n\n' + (A.CONS ? D.wa.slot_cons : D.wa.slot);
    return s.length > 700 ? s.slice(0, 697) + '…' : s;
  }
  function waHref(txt) { return 'https://wa.me/' + D.wa_nr + '?text=' + encodeURIComponent(txt); }
  function lis(ul, items) {
    ul.textContent = '';
    items.forEach(function (it) {
      var el = document.createElement('li');
      if (it.b) { var b = document.createElement('b'); b.textContent = it.b; el.appendChild(b); el.appendChild(document.createTextNode(' ')); }
      el.appendChild(document.createTextNode(it.t));
      ul.appendChild(el);
    });
  }
  function heading(parts) {
    T.rh.textContent = '';
    T.rh.appendChild(document.createTextNode(parts[0]));
    var g = document.createElement('span'); g.className = 'grad'; g.textContent = parts[1];
    T.rh.appendChild(g);
    T.rh.appendChild(document.createTextNode(parts[2]));
  }
  function fillTicket() {
    var A = adv(), vv = V(), k = S.k, kk = kNow(A);
    T.kick.textContent = fill(R.kicker, { datum: datum() });
    var hk = A.outcome;
    if (hk === 'C') hk = A.C === 'ja' && A.R === 'ja' ? 'C_both' : A.C === 'ja' ? 'C_chat' : A.R === 'ja' ? 'C_recep' : 'C';
    heading(R.h[hk]);
    T.voor.textContent = S.n ? fill(R.voor_naam, { naam: S.n }) : fill(R.voor, { woord: vv.woord });
    /* prijs */
    T.mode.textContent = k ? R.own_label : R.advice_label;
    var p = k ? PK.prijs(k) : A.price;
    var showPrice = k || A.outcome === 'B' || A.outcome === 'C' || A.outcome === 'D';
    T.big.textContent = showPrice ? eur(p) + ' ' + U.per_month : R.on_request;
    var parts = [];
    if (kk.dg && (k || A.outcome !== 'A' && A.outcome !== 'D')) {
      parts.push(fill(R.opbouw_dg, { p: eur(150) }));
      if (kk.c) parts.push(fill(R.opbouw_chat, { p: eur(50) }));
      if (kk.r) parts.push(fill(R.opbouw_recep, { p: eur(125) }));
    }
    if (A.outcome === 'B' && !k) parts.push(R.opbouw_cons);
    T.opb.textContent = parts.join(' + ');
    T.opb.hidden = !parts.length;
    T.mono.hidden = !(kk.dg && (k || A.outcome === 'B' || A.outcome === 'C'));
    T.alt.textContent = '';
    if (!k) A.alt.forEach(function (x) {
      var el = document.createElement('p');
      el.textContent = fill(R.alt, { p: eur(x.p), x: U[x.x + '_le'] || U[x.x] });
      T.alt.appendChild(el);
    });
    T.alt.hidden = !T.alt.children.length;
    var pt = '';
    if (A.outcome === 'A') pt = R.cons_txt;
    else if (A.outcome === 'B') {
      var ns = A.needs.slice(0, 3).map(function (n) { return lc(fill(D.needs[n.key], vv)); }).join(', ');
      pt = R.cons_txt + ' ' + fill(R.b_txt, { needs: ns, list: listOf(A.k).join(' + '), p: eur(A.price) });
    } else if (A.outcome === 'D') pt = fill(R.d_txt, { p: eur(150) });
    T.ptxt.textContent = pt; T.ptxt.hidden = !pt;
    /* waarom, niet, bespreken */
    lis(T.why, A.why.map(function (w) { return { b: R.said + ' ' + lc(fill(D.why[w][0], vv)), t: D.why[w][1] }; }));
    T.whyw.hidden = !A.why.length;
    lis(T.not, A.not.map(function (n) { return { t: fill(D.not[n], { p: eur(n.indexOf('recep') === 0 ? 125 : 50) }) }; }));
    T.notw.hidden = !A.not.length;
    lis(T.talk, A.talk.map(function (x) { return { t: fill(D.talk[x], { p: eur(x === 'recep' ? 125 : 50) }) }; }));
    T.talkw.hidden = !A.talk.length;
    T.proof.hidden = !A.proof;
    if (A.proof) T.proofv.textContent = D.proof[A.proof];
    /* probeer zelf */
    kBtns.forEach(function (b) {
      var id = b.getAttribute('data-pk-k');
      b.setAttribute('aria-pressed', kk[id === 'chat' ? 'c' : id === 'recep' ? 'r' : 'dg'] ? 'true' : 'false');
    });
    T.dev.hidden = !k;
    if (k) T.devt.textContent = devTxt(A, k);
    /* ook in Digitale groei */
    inclLis.forEach(function (el) {
      var on = kk.dg && A.ribs.indexOf(+el.getAttribute('data-pk-rib')) >= 0;
      el.classList.toggle('is-you', on);
      $('.pk-tagx', el).hidden = !on;
    });
    /* briefje en knoppen */
    T.pre.textContent = briefTxt(true);
    var wa = waHref(waTxt());
    waLinks.forEach(function (a) { a.href = wa; });
    shareB.hidden = !navigator.share;
    chips();
    sections(A);
  }
  function devTxt(A, k) {
    var extra = 0, doubtOn = false, less = false;
    if (k.c && A.C !== 'ja') { if (A.C === 'twijfel') doubtOn = true; else extra += 50; }
    if (k.r && A.R !== 'ja') { if (A.R === 'twijfel') doubtOn = true; else extra += 125; }
    if (k.dg && !A.DG) extra += 150;
    if ((!k.c && A.C === 'ja') || (!k.r && A.R === 'ja') || (!k.dg && A.DG)) less = true;
    var s = less ? R.light : extra ? fill(R.heavy, { p: eur(extra) }) : doubtOn ? R.doubt_on : '';
    return (s ? s + ' ' : '') + R.dev;
  }
  function chips() {
    T.chips.textContent = '';
    QIDS.forEach(function (id, i) {
      if (!answered(id)) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pk-chip';
      b.textContent = kortAns(id);
      b.setAttribute('aria-label', fill(U.q_of, { n: i + 1, t: QIDS.length }) + ': ' + fill(D.q[i].legend, V()) + ' ' + kortAns(id));
      b.addEventListener('click', function () { edit(i); });
      T.chips.appendChild(b);
    });
  }
  /* labels in de secties onder de kiezer: voor jou, laten we liggen, bespreken we */
  function sections(A) {
    var kk = kNow(A);
    rows.forEach(function (el) {
      var r = el.getAttribute('data-pk-row'), tag = '', cls = '';
      if (r.indexOf('rib-') === 0) { if (kk.dg && A.ribs.indexOf(+r.slice(4)) >= 0) { tag = U.for_you; cls = 'is-you'; } }
      else if (r === 'chat' || r === 'recep') {
        var st = r === 'chat' ? A.C : A.R, asked = r === 'chat' ? S.a.ber : S.a.opr;
        if (st === 'ja') { tag = U.for_you; cls = 'is-you'; }
        else if (st === 'twijfel') { tag = U.talk; cls = 'is-talk'; }
        else if (asked) { tag = U.leave; cls = 'is-leave'; }
      } else if (r === 'cons' && S.a.doel) { if (A.CONS) { tag = U.for_you; cls = 'is-you'; } else { tag = U.leave; cls = 'is-leave'; } }
      var em = $('.pk-tagx', el);
      em.textContent = tag; em.hidden = !tag;
      el.classList.remove('is-you', 'is-talk', 'is-leave');
      if (cls) el.classList.add(cls);
    });
    var p = (A.outcome === 'B' || A.outcome === 'C') ? A.price : -1;
    pws.forEach(function (el) {
      var on = +el.getAttribute('data-pk-pw') === p;
      el.classList.toggle('is-you', on);
      $('.pk-tagx', el).hidden = !on;
    });
    if (ctaH) {
      ctaH.textContent = '';
      ctaH.appendChild(document.createTextNode(D.cta.h2a_r + ' '));
      var g = document.createElement('span'); g.className = 'grad'; g.textContent = D.cta.h2b_r;
      ctaH.appendChild(g);
    }
  }
  function result(focus) {
    clearTimeout(advT);
    S.done = true; S.edit = false;
    card.hidden = true; ticket.hidden = false; ticketB.hidden = false;
    welcome.hidden = true;
    stage.classList.remove('is-avond');
    fillTicket();
    apply(viewOf(), !!focus);
    renderLists(viewOf());
    progress();
    save();
    if (focus) {
      if (!reduce) [ticket, ticketB].forEach(function (el) { el.classList.remove('is-in'); void el.offsetWidth; el.classList.add('is-in'); });
      T.rh.focus({ preventScroll: true });
      var r = ticket.getBoundingClientRect();
      if (r.top < 86 || r.top > window.innerHeight * 0.6) {
        window.scrollTo({ top: r.top + window.pageYOffset - 100, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
  }
  function edit(i) {
    S.edit = true; S.done = false;
    ticket.hidden = true; ticketB.hidden = true; card.hidden = false;
    apply(viewOf(), true);
    renderLists(viewOf());
    show(i, true);
  }
  function restart() {
    clear();
    S = { a: {}, i: 0, n: '', k: null, done: false, edit: false, fb: {} };
    syncInputs();
    nameIn.value = '';
    ticket.hidden = true; ticketB.hidden = true; card.hidden = false; welcome.hidden = true;
    legends();
    var v = viewOf();
    apply(v, true);
    renderLists(v);
    show(0, true);
  }
  kBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var A = adv(), k = S.k ? { dg: S.k.dg, c: S.k.c, r: S.k.r } : { dg: A.k.dg, c: A.k.c, r: A.k.r };
      var id = b.getAttribute('data-pk-k');
      if (id === 'dg') { k.dg = !k.dg; if (!k.dg) { k.c = false; k.r = false; } }
      else { var f = id === 'chat' ? 'c' : 'r'; k[f] = !k[f]; if (k[f]) k.dg = true; }
      S.k = (k.dg === A.k.dg && k.c === A.k.c && k.r === A.k.r) ? null : k;
      var v = viewOf();
      apply(v, true);
      renderLists(v);
      fillTicket();
      save();
      live.textContent = spoken(S.k ? T.mode.textContent + ': ' + T.big.textContent + '. ' + T.devt.textContent : R.advice_label + ': ' + T.big.textContent + '.');
    });
  });
  $('[data-pk-kreset]', ticketB).addEventListener('click', function () {
    S.k = null;
    var v = viewOf();
    apply(v, true); renderLists(v); fillTicket(); save();
    kBtns[0].focus();
  });
  nameIn.addEventListener('input', function () {
    S.n = nameIn.value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    T.voor.textContent = S.n ? fill(R.voor_naam, { naam: S.n }) : fill(R.voor, { woord: V().woord });
    T.pre.textContent = briefTxt(true);
    var wa = waHref(waTxt());
    waLinks.forEach(function (a) { a.href = wa; });
    save();
  });
  $('[data-pk-again]', ticketB).addEventListener('click', restart);
  $('[data-pk-restart]', hero).addEventListener('click', restart);

  /* klembord */
  function copy(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(txt).then(function () { return true; }, function () { return fallbackCopy(txt); });
    }
    return Promise.resolve(fallbackCopy(txt));
  }
  function fallbackCopy(txt) {
    try {
      var ta = document.createElement('textarea');
      ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch (e) { return false; }
  }
  var statT = 0;
  function status(s) {
    clearTimeout(statT);
    T.status.textContent = s;
    statT = setTimeout(function () { T.status.textContent = ''; }, 4000);
  }
  copyB.addEventListener('click', function () {
    copy(briefTxt(true)).then(function (ok) { status(ok ? R.copied : R.copy_fail); });
  });
  shareB.addEventListener('click', function () {
    var c = document.querySelector('link[rel="canonical"]');
    try { navigator.share({ title: document.title, text: briefTxt(true), url: c ? c.href : location.href }).catch(function () {}); } catch (e) {}
  });
  /* de boekknop: eerst het briefje op het klembord, dan de bestaande boekingspopup (vóór de listener van site.js) */
  window.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('.pk-book');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (!S.done) { if (typeof window.openPopup === 'function') window.openPopup(); else window.location.href = b.href; return; }
    var A = adv();
    copy(briefTxt(true)).then(function (ok) {
      var note = ok ? fill(R.popup_note, { advies: adviesTxt(A) }) : R.popup_note_fail;
      if (typeof window.openPopup === 'function') window.openPopup({ note: note });
      else window.location.href = b.href;
    });
  }, true);

  /* ================= START ================= */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) wake(); else settle();
    }).observe(stage);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) settle(); else wake(); });
  window.addEventListener('resize', function () {
    if (wide()) lists.classList.remove('is-collapsed');
  });

  var restored = load();
  syncInputs();
  legends();
  if (S.n) nameIn.value = S.n;
  var v0 = viewOf();
  apply(v0, false);
  renderLists(v0);
  if (restored && S.done) {
    result(false);
    welcome.hidden = true;
  } else {
    show(restored ? S.i : 0, false);
    if (restored && Object.keys(S.a).length) {
      welcome.hidden = false;
      welcomeT.textContent = fill(U.welcome_q, { n: S.i + 1 });
    }
  }
  if (restored && S.done) {
    var wr = document.createElement('p');
    wr.className = 'pk-welcome pk-welcome-r';
    wr.textContent = U.welcome_r + ' ';
    var rb = document.createElement('button');
    rb.type = 'button'; rb.className = 'pk-tl'; rb.textContent = U.restart;
    rb.addEventListener('click', function () { wr.remove(); restart(); });
    wr.appendChild(rb);
    ticket.insertBefore(wr, ticket.firstChild);
  }
  /* één intro-zwaai zodra de schaal in beeld is */
  if (!restored && !reduce) {
    var go = function () { th = 3; om = 0; tht = 0; wake(); };
    var fr = document.fonts && document.fonts.ready;
    var once = false;
    var start = function () { if (!once) { once = true; go(); } };
    if (fr) fr.then(start, start);
    setTimeout(start, 600);
  }
})();
