/* EM Times — interactie bovenop de gedeelde site-nav (site.js).
   · zoekvenster (knop, "/" of ⌘/Ctrl+K) over window.ET_ARTICLES
   · categoriebalk + zijbalk schuiven mee met de nav die zich verstopt
   · actieve inhoudstafel en "kopieer link" op artikels */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var R = (doc.body && doc.body.dataset.root) || '';
  var ARTS = window.ET_ARTICLES || [];
  var ICO_SEARCH = '<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  /* ── sticky offset: volg de nav (die verdwijnt bij naar beneden scrollen) ── */
  function syncTop() {
    var nv = doc.getElementById('nv');
    var top = 0;
    if (nv && !nv.classList.contains('is-hidden')) {
      var r = nv.getBoundingClientRect();
      top = Math.max(0, Math.round(r.top + r.height));
    }
    root.style.setProperty('--emt-top', top + 'px');
    onScroll();
  }
  function watchNav() {
    var nv = doc.getElementById('nv');
    if (!nv) return;
    new MutationObserver(syncTop).observe(nv, { attributes: true, attributeFilter: ['class'] });
    syncTop();
  }
  window.addEventListener('resize', syncTop, { passive: true });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', watchNav); else watchNav();

  /* ── zoekvenster ── */
  var sr, input, list, lastFocus, results = [], sel = 0;

  function build() {
    sr = doc.createElement('div');
    sr.className = 'emt-sr';
    sr.setAttribute('role', 'dialog');
    sr.setAttribute('aria-modal', 'true');
    sr.setAttribute('aria-label', 'Zoek in EM Times');
    sr.innerHTML =
      '<div class="emt-sr-panel">' +
        '<div class="emt-sr-head">' + ICO_SEARCH +
          '<input type="search" autocomplete="off" spellcheck="false" placeholder="Zoek een artikel, onderwerp of trefwoord…" aria-label="Zoekterm" aria-controls="emtSrList"/>' +
          '<button class="emt-sr-close" type="button" aria-label="Sluiten"><kbd>esc</kbd></button>' +
        '</div>' +
        '<div class="emt-sr-lbl" id="emtSrLbl"></div>' +
        '<ul class="emt-sr-list" id="emtSrList" role="listbox" aria-labelledby="emtSrLbl"></ul>' +
        '<div class="emt-sr-foot"><span><kbd>↑</kbd><kbd>↓</kbd> kiezen</span><span><kbd>enter</kbd> openen</span><span><kbd>esc</kbd> sluiten</span></div>' +
      '</div>';
    doc.body.appendChild(sr);
    input = sr.querySelector('input');
    list = sr.querySelector('.emt-sr-list');
    sr.addEventListener('click', function (e) { if (e.target === sr) close(); });
    sr.querySelector('.emt-sr-close').addEventListener('click', close);
    input.addEventListener('input', function () { sel = 0; render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); location.href = R + results[sel].path; }
    });
  }

  function search(q) {
    var terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return ARTS.slice(0, 6);
    return ARTS.map(function (a) {
      var f = { t: norm(a.title), c: norm(a.topic), g: norm((a.tags || []).join(' ')), x: norm(a.excerpt) };
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var w = terms[i], s = (f.t.indexOf(w) > -1 ? 6 : 0) + (f.c.indexOf(w) > -1 ? 3 : 0) + (f.g.indexOf(w) > -1 ? 3 : 0) + (f.x.indexOf(w) > -1 ? 1 : 0);
        if (!s) return null;
        score += s;
      }
      return { a: a, s: score };
    }).filter(Boolean).sort(function (p, q2) { return q2.s - p.s; }).map(function (r) { return r.a; });
  }

  function mark(text, q) {
    var out = esc(text);
    norm(q).split(/\s+/).filter(function (w) { return w.length > 1; }).forEach(function (w) {
      out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
    });
    return out;
  }

  function render() {
    var q = input.value.trim();
    results = search(q);
    sr.querySelector('.emt-sr-lbl').textContent = q ? (results.length ? results.length + (results.length === 1 ? ' resultaat' : ' resultaten') : '') : 'Nieuwste artikels';
    if (!results.length) {
      list.innerHTML = '<li class="emt-sr-empty">Geen artikels gevonden voor “' + esc(q) + '”. Probeer een ander woord, zoals <b>chatbot</b> of <b>website</b>.</li>';
      return;
    }
    list.innerHTML = results.map(function (a, i) {
      return '<li class="emt-sr-item' + (i === sel ? ' is-sel' : '') + '" role="option" aria-selected="' + (i === sel) + '">' +
        '<a href="' + esc(R + a.path) + '"><img alt="" loading="lazy" src="' + esc(R + (a.img || 'assets/og-image.png')) + '"/>' +
        '<span><span class="t">' + mark(a.title, q) + '</span><span class="m">' + esc(a.topic) + ' · ' + esc(a.date) + ' · ' + esc(a.read) + '</span></span></a></li>';
    }).join('');
  }

  function move(d) {
    if (!results.length) return;
    sel = (sel + d + results.length) % results.length;
    var items = list.querySelectorAll('.emt-sr-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('is-sel', i === sel);
      items[i].setAttribute('aria-selected', i === sel);
    }
    if (items[sel]) items[sel].scrollIntoView({ block: 'nearest' });
  }

  function open() {
    if (!sr) build();
    lastFocus = doc.activeElement;
    sel = 0; input.value = ''; render();
    sr.classList.add('is-open');
    root.style.overflow = 'hidden';
    setTimeout(function () { input.focus(); }, 30);
  }
  function close() {
    if (!sr || !sr.classList.contains('is-open')) return;
    sr.classList.remove('is-open');
    root.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  doc.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-et-search]');
    if (t) { e.preventDefault(); open(); }
  });
  doc.addEventListener('keydown', function (e) {
    var typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); sr && sr.classList.contains('is-open') ? close() : open(); }
    else if (e.key === '/' && !typing) { e.preventDefault(); open(); }
    else if (e.key === 'Escape') close();
  });

  /* ── scroll: categoriebalk "vastgeplakt" + actieve inhoudstafel ── */
  var tabs = doc.querySelector('.emt-tabs');
  var art = doc.getElementById('artikel');
  var heads = art ? [].slice.call(art.querySelectorAll('h2[id]')) : [];
  var tocLinks = [].slice.call(doc.querySelectorAll('.emt-toc a'));
  var ticking = false;
  function onScroll() {
    ticking = false;
    var top = parseInt(getComputedStyle(root).getPropertyValue('--emt-top'), 10) || 0;
    // de hero erboven beweegt niet mee met de (geanimeerde) sticky-positie → betrouwbare meting
    var above = tabs && tabs.previousElementSibling;
    if (above) tabs.classList.toggle('is-stuck', above.getBoundingClientRect().bottom <= top + 1);
    if (tocLinks && tocLinks.length) {
      var cur = -1;
      for (var i = 0; i < heads.length; i++) if (heads[i].getBoundingClientRect().top <= top + window.innerHeight * 0.3) cur = i;
      tocLinks.forEach(function (l, j) { l.classList.toggle('is-on', j === cur); });
    }
  }
  if (tabs || tocLinks.length) {
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  var toast;
  function say(msg) {
    if (!toast) { toast = doc.createElement('div'); toast.className = 'emt-toast'; toast.setAttribute('role', 'status'); doc.body.appendChild(toast); }
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(say.t);
    say.t = setTimeout(function () { toast.classList.remove('is-on'); }, 2200);
  }
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]');
    if (!b) return;
    var url = b.getAttribute('data-copy');
    var done = function () { say('Link gekopieerd'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, function () { fallback(url); done(); });
    else { fallback(url); done(); }
  });
  function fallback(text) {
    var t = doc.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    doc.body.appendChild(t); t.select();
    try { doc.execCommand('copy'); } catch (e) { /* niets */ }
    doc.body.removeChild(t);
  }
})();
