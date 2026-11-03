/* =============================================================
   EM Launchpad: gratis website scan (/gratis-website-scan).
   Stuurt het adres naar /api/scan (de Worker in worker/) en toont het rapport.
   - Alles wat van de gescande site komt (titels, adressen) zetten we met textContent, nooit als HTML.
   - ?url=jouwzaak.be start meteen een scan (de link in de mail). &plan=1 toont het verbeterplan meteen.
   - Het verbeterplan: de punten staan er altijd; wat je eraan kunt doen verschijnt na het formulier van ons
     platform (en staat dan ook in de mail). Is er (nog) geen formulier ingesteld, dan staat alles meteen open.
   - Zonder JavaScript: de pagina toont een melding (noscript) en de knop voor een gratis gesprek.
   ============================================================= */
(function () {
  'use strict';
  var form = document.querySelector('[data-sc-form]');
  var dataEl = document.getElementById('scData');
  if (!form || !dataEl || !window.fetch) return;
  var cfg = {};
  try { cfg = JSON.parse(dataEl.textContent); } catch (e) { cfg = {}; }
  var T = cfg.teksten || {};
  var Q = cfg.query || { url: 'website_scan_url', score: 'website_scan_score', samenvatting: 'website_scan_samenvatting' };
  var input = form.querySelector('#sc-url');
  var knop = form.querySelector('.sc-go');
  var knopT = knop.querySelector('.sc-go-t');
  var knopTekst = knopT.textContent;
  var status = form.querySelector('[data-sc-status]');
  var rapport = document.querySelector('[data-sc-rapport]');
  var kop = rapport.querySelector('#sc-rapport-kop');
  var uitkomst = rapport.querySelector('[data-sc-uitkomst]');
  var groepen = rapport.querySelector('[data-sc-groepen]');
  var jsnoot = rapport.querySelector('[data-sc-jsnoot]');
  var plan = rapport.querySelector('[data-sc-plan]');
  var planLijst = rapport.querySelector('[data-sc-plan-lijst]');
  var slot = rapport.querySelector('[data-sc-slot]');
  var formKnop = rapport.querySelector('[data-sc-toon-form]');
  var formBox = rapport.querySelector('[data-sc-form-box]');
  var klaar = rapport.querySelector('[data-sc-klaar]');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var params = new URLSearchParams(location.search);
  var LABEL = { goed: 'Goed', beter: 'Kan beter', slecht: 'Probleem', info: 'Niet meegeteld' };
  var EMBED = 'https://link.msgsndr.com/js/form_embed.js';
  var FORM_BASIS = 'https://api.leadconnectorhq.com/widget/form/';
  var laatste = null, bezigNu = false, frame = null;
  var open = params.get('plan') === '1' || !cfg.formId;

  function el(tag, cls, tekst) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (tekst !== undefined && tekst !== null) e.textContent = tekst;
    return e;
  }
  function klasVan(score) { return score >= 80 ? 'goed' : score >= 50 ? 'beter' : 'slecht'; }
  function pill(st) {
    var p = el('span', 'sc-pill is-' + st);
    var d = el('span', 'sc-dot'); d.setAttribute('aria-hidden', 'true');
    p.appendChild(d);
    p.appendChild(document.createTextNode(LABEL[st] || st));
    return p;
  }
  function dial(score, groot) {
    var d = el('div', 'sc-dial is-' + klasVan(score) + (reduce ? '' : ' is-anim'));
    d.style.setProperty('--s', String(score));
    d.setAttribute('role', 'img');
    d.setAttribute('aria-label', 'Score ' + score + ' op 100');
    d.innerHTML = '<svg aria-hidden="true" viewBox="0 0 120 120"><circle class="sc-dial-bg" cx="60" cy="60" r="52"></circle>' +
      '<circle class="sc-dial-fg" cx="60" cy="60" pathLength="100" r="52"></circle></svg>';
    var n = el('span', 'sc-dial-n', String(score));
    n.setAttribute('aria-hidden', 'true');
    n.appendChild(el('small', null, '/100'));
    d.appendChild(n);
    if (groot) d.classList.add('is-groot');
    return d;
  }

  function bezig(aan, adres) {
    bezigNu = aan;
    knop.disabled = aan;
    knop.classList.toggle('is-bezig', aan);
    knopT.textContent = aan ? (knop.getAttribute('data-bezig') || knopTekst) : knopTekst;
    form.setAttribute('aria-busy', aan ? 'true' : 'false');
    status.classList.remove('is-fout');
    status.textContent = aan ? 'We scannen ' + adres + '. Dit duurt meestal enkele seconden.' : '';
  }
  function fout(tekst) {
    status.classList.add('is-fout');
    status.textContent = tekst;
  }

  function scan(waarde) {
    var v = String(waarde || '').trim();
    if (bezigNu) return;
    if (!v) { fout('Geef het adres van je website in, bijvoorbeeld jouwzaak.be.'); input.focus(); return; }
    bezig(true, v.replace(/^https?:\/\//i, '').replace(/\/$/, ''));
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 45000);
    fetch('/api/scan', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: v }),
      signal: ctl ? ctl.signal : undefined, credentials: 'omit'
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, bericht: r.status === 429 ? 'Je hebt veel scans na elkaar gedaan. Wacht een minuut en probeer het dan opnieuw.' : 'Er liep iets mis bij de scan. Probeer het zo meteen opnieuw.' }; });
    }, function (e) {
      return { ok: false, bericht: e && e.name === 'AbortError' ? 'De scan duurde te lang. Probeer het zo meteen opnieuw.' : 'We konden de scan niet starten. Controleer je internetverbinding en probeer het opnieuw.' };
    }).then(function (data) {
      clearTimeout(timer);
      bezig(false);
      if (!data || !data.ok) { fout((data && data.bericht) || 'Er liep iets mis bij de scan. Probeer het zo meteen opnieuw.'); input.focus(); return; }
      laatste = data;
      try {
        var u = new URL(location.href);
        u.searchParams.set('url', v);
        history.replaceState(null, '', u.pathname + u.search);
      } catch (e) { /* oude browser: niets */ }
      toon(data);
    });
  }

  function toon(d) {
    rapport.hidden = false;
    // totaal en categorieën
    uitkomst.textContent = '';
    var wrap = el('div', 'sc-uitkomst');
    var tot = el('div', 'sc-totaal');
    tot.appendChild(dial(d.score, true));
    var tt = el('div', 'sc-totaal-t');
    tt.appendChild(el('b', null, d.label));
    var tijd = '';
    try { tijd = new Date(d.gescand).toLocaleString('nl-BE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); } catch (e) { tijd = ''; }
    tt.appendChild(el('p', null, 'Gescand: ' + d.url + (tijd ? ' · ' + tijd : '')));
    tot.appendChild(tt);
    wrap.appendChild(tot);
    var cats = el('ul', 'sc-cats');
    cats.setAttribute('aria-label', 'Score per onderdeel');
    d.categorieen.forEach(function (c) {
      if (c.score === null) return;
      var li = el('li', 'sc-cat is-' + klasVan(c.score));
      var a = el('a');
      a.href = '#groep-' + c.id;
      a.appendChild(el('span', 'sc-cat-n', c.naam));
      var s = el('span', 'sc-cat-s', String(c.score));
      s.appendChild(el('small', null, '/100'));
      a.appendChild(s);
      var bar = el('span', 'sc-cat-bar'); bar.setAttribute('aria-hidden', 'true');
      var i = el('i'); i.style.setProperty('--w', c.score + '%'); bar.appendChild(i);
      a.appendChild(bar);
      var tel = [];
      if (c.goed) tel.push(c.goed + ' goed');
      if (c.beter) tel.push(c.beter + ' kan beter');
      if (c.slecht) tel.push(c.slecht + ' probleem' + (c.slecht > 1 ? 'en' : ''));
      a.appendChild(el('span', 'sc-cat-tel', tel.join(' · ')));
      li.appendChild(a);
      cats.appendChild(li);
    });
    wrap.appendChild(cats);
    uitkomst.appendChild(wrap);
    jsnoot.hidden = !(d.meta && (d.meta.jsSite || d.meta.weinigTekst));

    // de punten per onderdeel
    groepen.textContent = '';
    d.categorieen.forEach(function (c) {
      var lijst = d.checks.filter(function (x) { return x.cat === c.id; });
      if (!lijst.length) return;
      var sec = el('section', 'sc-groep');
      sec.id = 'groep-' + c.id;
      sec.setAttribute('aria-labelledby', 'groep-' + c.id + '-kop');
      var h = el('div', 'sc-groep-h');
      var h3 = el('h3', null, c.naam); h3.id = 'groep-' + c.id + '-kop';
      h.appendChild(h3);
      if (c.score !== null) h.appendChild(el('span', null, c.score + '/100'));
      sec.appendChild(h);
      var ul = el('ul', 'sc-items');
      lijst.forEach(function (x) {
        var li = el('li', 'sc-item');
        li.appendChild(pill(x.status));
        li.appendChild(el('b', null, x.titel));
        li.appendChild(el('p', 'sc-gezien', x.gezien));
        if (x.uitleg) {
          var det = el('details');
          det.appendChild(el('summary', null, T.uitleg_knop || 'Waarom dit telt'));
          det.appendChild(el('p', null, x.uitleg));
          li.appendChild(det);
        }
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      groepen.appendChild(sec);
    });
    toonPlan();
    klaar.hidden = true;
    if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
    frame = null;
    formBox.textContent = '';
    formBox.hidden = true;
    formKnop.hidden = false;

    // naar het rapport
    kop.focus({ preventScroll: true });
    rapport.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function toonPlan() {
    var d = laatste;
    planLijst.textContent = '';
    var punten = d.plan.map(function (id) { return d.checks.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
    var oud = plan.querySelector('.sc-plan-meer');
    if (oud) oud.parentNode.removeChild(oud);
    if (!punten.length) {
      planLijst.appendChild(el('li', null, T.plan_leeg || 'We vonden niets dat beter kan.'));
      slot.hidden = true;
      plan.classList.remove('is-dicht');
      return;
    }
    punten.forEach(function (x) {
      var li = el('li');
      var k = el('div', 'sc-p-kop');
      k.appendChild(pill(x.status));
      k.appendChild(el('span', null, x.titel));
      li.appendChild(k);
      li.appendChild(el('p', 'sc-p-advies', open ? x.advies : (T.plan_verborgen || 'Zit in je verbeterplan')));
      planLijst.appendChild(li);
    });
    plan.classList.toggle('is-dicht', !open);
    slot.hidden = open;
    if (!open && punten.length > 5) {
      var meer = el('p', 'sc-plan-meer sc-form-alt', '+ ' + (punten.length - 5) + ' andere punt' + (punten.length - 5 === 1 ? '' : 'en') + ' in je verbeterplan.');
      planLijst.parentNode.insertBefore(meer, planLijst.nextSibling);
    }
  }

  // korte samenvatting voor het verborgen veld van het formulier (komt in de mail en in ons klantenbestand)
  function samenvatting(d) {
    var naam = function (st) { return d.checks.filter(function (x) { return x.status === st; }).map(function (x) { return x.titel; }); };
    var s = 'Score ' + d.score + '/100 voor ' + d.url + '.';
    var r = naam('slecht'), o = naam('beter');
    if (r.length) s += ' Problemen: ' + r.join(', ') + '.';
    if (o.length) s += ' Kan beter: ' + o.join(', ') + '.';
    return s.length > 900 ? s.slice(0, 897) + '...' : s;
  }

  var embedGeladen = false;
  function toonFormulier() {
    if (!laatste || !cfg.formId) return;
    formBox.hidden = false;
    formKnop.hidden = true;
    if (frame) return;
    var qs = new URLSearchParams();
    qs.set(Q.url, laatste.url);
    qs.set(Q.score, String(laatste.score));
    qs.set(Q.samenvatting, samenvatting(laatste));
    var src = FORM_BASIS + encodeURIComponent(cfg.formId) + '?' + qs.toString();
    if (!embedGeladen) {
      embedGeladen = true;
      var s = document.createElement('script');
      s.src = EMBED; s.async = true;
      document.head.appendChild(s);
    }
    frame = document.createElement('iframe');
    var at = {
      src: src, id: 'inline-' + cfg.formId, title: 'Formulier: je verbeterplan per mail', loading: 'eager',
      'data-layout': "{'id':'INLINE'}", 'data-trigger-type': 'alwaysShow', 'data-trigger-value': '',
      'data-activation-type': 'alwaysActivated', 'data-activation-value': '', 'data-deactivation-type': 'neverDeactivate',
      'data-deactivation-value': '', 'data-form-name': cfg.formName || 'Website scan', 'data-height': '620',
      'data-layout-iframe-id': 'inline-' + cfg.formId, 'data-form-id': cfg.formId
    };
    Object.keys(at).forEach(function (k) { frame.setAttribute(k, at[k]); });
    formBox.appendChild(frame);
    var alt = el('p', 'sc-form-alt');
    alt.appendChild(document.createTextNode('Laadt het formulier niet? '));
    var a = el('a', null, 'Open het in een nieuw venster');
    a.href = src; a.target = '_blank'; a.rel = 'noopener';
    alt.appendChild(a);
    alt.appendChild(document.createTextNode('.'));
    formBox.parentNode.appendChild(alt);
  }

  // na het versturen meldt het formulier van ons platform dat aan de pagina ("set-sticky-contacts")
  window.addEventListener('message', function (e) {
    var host = '';
    try { host = new URL(e.origin).hostname; } catch (err) { return; }
    if (!/(^|\.)(leadconnectorhq\.com|msgsndr\.com)$/.test(host)) return;
    if (!frame || e.source !== frame.contentWindow) return;
    var d = e.data;
    if (!Array.isArray(d) || d[0] !== 'set-sticky-contacts') return;
    if (open) return;
    open = true;
    toonPlan();
    var alt = slot.parentNode.querySelector('.sc-form-alt:not(.sc-plan-meer)');
    if (alt) alt.parentNode.removeChild(alt);
    klaar.hidden = false;
    klaar.focus({ preventScroll: true });
    plan.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); scan(input.value); });
  formKnop.addEventListener('click', toonFormulier);
  rapport.querySelector('[data-sc-opnieuw]').addEventListener('click', function () {
    form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    input.focus({ preventScroll: true });
    input.select();
  });

  // de link in de mail: ?url=jouwzaak.be(&plan=1) start meteen een scan
  var start = params.get('url');
  if (start) { input.value = start.slice(0, 500); scan(start); }
})();
