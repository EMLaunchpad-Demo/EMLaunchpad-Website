/* Advertentiebeheer / Google Ads: "Het spoor".
   Het voorbeeld in #spoor: kies een aanvraag en zie uit welke advertentie ze kwam en wat ze werd,
   of kies een advertentie en zie wie ze bracht. De gegevens staan in #spData (uit <taal>.json).
   Zonder JavaScript staat de bron al bij elke naam in de HTML; dit script voegt alleen de keuze,
   de strook met het spoor en (vanaf 1000 px) de lijn tussen de twee kolommen toe. */
(function () {
  var board = document.querySelector('[data-sp-board]');
  var dataEl = document.getElementById('spData');
  if (!board || !dataEl) return;
  var D;
  try { D = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var L = D.lbl;
  var strip = board.querySelector('[data-sp-strip]');
  var wire = board.querySelector('[data-sp-wire]');
  var hint = board.querySelector('[data-sp-hint]');
  var leadBtns = [].slice.call(board.querySelectorAll('[data-sp-lead]'));
  var resBtns = [].slice.call(board.querySelectorAll('[data-sp-res]'));
  var ads = {}, leads = {};
  D.ads.forEach(function (a) { ads[a.id] = a; });
  D.leads.forEach(function (l) { leads[l.id] = l; });
  var NS = 'http://www.w3.org/2000/svg';
  var state = null;
  /* op de gsm staat de strook meteen onder de gekozen naam of advertentie, op pc onder de twee kolommen */
  var wide = window.matchMedia ? window.matchMedia('(min-width: 1000px)') : { matches: true };
  function place(btn) {
    if (wide.matches || !btn) { if (strip.parentNode !== board) board.insertBefore(strip, wire); }
    else if (strip.parentNode !== btn.parentNode) btn.parentNode.appendChild(strip);
  }

  if (hint) hint.textContent = D.hint;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function resBtn(id) { return board.querySelector('[data-sp-res="' + id + '"]'); }
  function leadBtn(id) { return board.querySelector('[data-sp-lead="' + id + '"]'); }

  function reset() {
    leadBtns.concat(resBtns).forEach(function (b) {
      b.setAttribute('aria-pressed', 'false');
      b.classList.remove('is-lit');
    });
    [].forEach.call(board.querySelectorAll('[data-sp-count]'), function (c) { c.textContent = ''; });
    board.classList.remove('is-one', 'is-filter');
  }

  function step(k, b, s, cls) {
    return '<li class="sp-step' + (cls ? ' ' + cls : '') + '"><span class="sp-k">' + esc(k) + '</span><b>' + esc(b) + '</b>' +
      (s ? '<span>' + esc(s) + '</span>' : '') + '</li>';
  }

  function pickLead(id) {
    var l = leads[id];
    if (!l) return;
    reset();
    state = { lead: id };
    var b = leadBtn(id);
    b.setAttribute('aria-pressed', 'true');
    b.classList.add('is-lit');
    var kind = l.kind === 'b' ? L.kind_b : L.kind_a;
    var rows;
    if (l.ad) {
      var a = ads[l.ad];
      resBtn(l.ad).classList.add('is-lit');
      board.classList.add('is-one');
      rows = step(L.ad, a.camp, a.title) + step(L.page, l.page) +
        step(kind, l.name + ' · ' + l.what, l.when, 'is-res') + step(L.next, l.stage, '', 'is-res');
    } else {
      rows = step(L.src, l.other, '', 'is-none') + step(L.ad, L.none_ad, L.none_ad_d, 'is-none') +
        step(kind, l.name + ' · ' + l.what, l.when, 'is-res') + step(L.next, l.stage, '', 'is-res');
    }
    strip.innerHTML = '<p class="sp-strip-k"><span class="sp-dot" aria-hidden="true"></span>' + esc(L.trail) + ' · ' + esc(l.name) + '</p>' +
      '<ol class="sp-steps-row">' + rows + '</ol>';
    strip.hidden = false;
    place(b);
    draw();
  }

  function pickRes(id) {
    var a = ads[id];
    if (!a) return;
    reset();
    state = { res: id };
    var b = resBtn(id);
    b.setAttribute('aria-pressed', 'true');
    b.classList.add('is-lit');
    board.classList.add('is-filter');
    var hits = D.leads.filter(function (l) { return l.ad === id; });
    hits.forEach(function (l) { leadBtn(l.id).classList.add('is-lit'); });
    var msg = hits.length
      ? esc(L.per_ad).replace('{n}', '<b>' + hits.length).replace('{t}', D.leads.length + '</b>')
      : esc(L.per_ad_0);
    var c = board.querySelector('[data-sp-count="' + id + '"]');
    if (c && hits.length) c.textContent = hits.map(function (l) { return l.name; }).join(', ');
    strip.innerHTML = '<p class="sp-strip-k"><span class="sp-dot" aria-hidden="true"></span>' + esc(L.trail) + ' · ' + esc(a.camp) + '</p>' +
      '<p class="sp-strip-msg">' + msg + '</p>';
    strip.hidden = false;
    place(b);
    draw();
  }

  /* de lijn: van de rechterrand van de advertentie naar de linkerrand van de aanvraag */
  function draw() {
    if (!wire) return;
    while (wire.firstChild) wire.removeChild(wire.firstChild);
    if (!state || getComputedStyle(wire).display === 'none') return;
    var pairs = [];
    if (state.lead) {
      var l = leads[state.lead];
      if (l.ad) pairs.push([resBtn(l.ad), leadBtn(l.id)]);
    } else if (state.res) {
      D.leads.forEach(function (l) { if (l.ad === state.res) pairs.push([resBtn(l.ad), leadBtn(l.id)]); });
    }
    if (!pairs.length) return;
    var br = board.getBoundingClientRect();
    var r0 = pairs[0][0].getBoundingClientRect();
    var x1 = r0.right - br.left;
    var x2 = pairs[0][1].getBoundingClientRect().left - br.left;
    var defs = document.createElementNS(NS, 'defs');
    var g = document.createElementNS(NS, 'linearGradient');
    g.setAttribute('id', 'spGrad');
    g.setAttribute('gradientUnits', 'userSpaceOnUse');
    g.setAttribute('x1', x1); g.setAttribute('x2', x2); g.setAttribute('y1', 0); g.setAttribute('y2', 0);
    [['0', '#4f8de8'], ['0.55', '#3fae78'], ['1', '#e6c46e']].forEach(function (s) {
      var st = document.createElementNS(NS, 'stop');
      st.setAttribute('offset', s[0]);
      st.setAttribute('stop-color', s[1]);
      g.appendChild(st);
    });
    defs.appendChild(g);
    wire.appendChild(defs);
    pairs.forEach(function (p) {
      var a = p[0].getBoundingClientRect(), b = p[1].getBoundingClientRect();
      var ax = a.right - br.left, ay = a.top + a.height / 2 - br.top;
      var bx = b.left - br.left, by = b.top + b.height / 2 - br.top;
      var dx = (bx - ax) / 2;
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('d', 'M' + ax + ' ' + ay + 'C' + (ax + dx) + ' ' + ay + ',' + (bx - dx) + ' ' + by + ',' + bx + ' ' + by);
      path.setAttribute('stroke', 'url(#spGrad)');
      wire.appendChild(path);
      try { path.style.setProperty('--len', Math.ceil(path.getTotalLength())); } catch (e) {}
      [[ax, ay, '#4f8de8'], [bx, by, '#e6c46e']].forEach(function (c) {
        var dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', c[0]); dot.setAttribute('cy', c[1]); dot.setAttribute('r', 3.5);
        dot.setAttribute('fill', c[2]);
        wire.appendChild(dot);
      });
    });
  }

  leadBtns.forEach(function (b) {
    b.addEventListener('click', function () { pickLead(b.getAttribute('data-sp-lead')); });
  });
  resBtns.forEach(function (b) {
    b.addEventListener('click', function () { pickRes(b.getAttribute('data-sp-res')); });
  });

  var raf = 0;
  function redraw() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; draw(); });
  }
  window.addEventListener('resize', redraw);
  function replace() {
    if (!state) return;
    place(state.lead ? leadBtn(state.lead) : resBtn(state.res));
    redraw();
  }
  if (wide.addEventListener) wide.addEventListener('change', replace);
  else if (wide.addListener) wide.addListener(replace);
  window.addEventListener('load', redraw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);

  /* startstand: de eerste aanvraag is gekozen, zodat het spoor meteen zichtbaar is */
  if (D.leads.length) pickLead(D.leads[0].id);
})();
