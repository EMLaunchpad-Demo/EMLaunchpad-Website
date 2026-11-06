/* =============================================================
   EM Launchpad: gratis website scan (/gratis-website-scan).
   Stuurt het adres naar /api/scan (de Worker in worker/) en toont het rapport.
   - Alles wat van de gescande site komt (titels, adressen) zetten we met textContent, nooit als HTML.
   - ?url=jouwzaak.be start meteen een scan (de link in de mail). &plan=1 toont het verbeterplan meteen.
   - Het scanpaneel in de hero: eerst het voorbeeld (zonder JavaScript blijft het dat), tijdens de scan loopt het
     de punten van "Wat we checken" na (het antwoord van /api/scan komt in één keer, dus dit toont wat we nakijken,
     geen echte voortgang), daarna toont het je eigen score. Bij minder beweging: geen licht, geen lopende tekst.
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
  var veld = form.querySelector('.sc-field');
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
  var SLOT = '<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><rect height="9" rx="2" width="12" x="6" y="11"></rect><path d="M9 11V8a3 3 0 0 1 6 0v3"></path></svg>';
  var laatste = null, bezigNu = false, frame = null, naarTimer = null;
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
  function dial(score) {
    var d = el('div', 'sc-dial is-' + klasVan(score));
    d.style.setProperty('--s', String(score));
    d.setAttribute('role', 'img');
    d.setAttribute('aria-label', 'Score ' + score + ' op 100');
    d.innerHTML = '<svg aria-hidden="true" viewBox="0 0 120 120"><circle class="sc-dial-bg" cx="60" cy="60" r="52"></circle>' +
      '<circle class="sc-dial-fg" cx="60" cy="60" pathLength="100" r="52"></circle></svg>';
    var n = el('span', 'sc-dial-n', String(score));
    n.setAttribute('aria-hidden', 'true');
    n.appendChild(el('small', null, '/100'));
    d.appendChild(n);
    return d;
  }
  function balkje(score) {
    var bar = el('span', 'sc-cat-bar'); bar.setAttribute('aria-hidden', 'true');
    var i = el('i'); i.style.setProperty('--w', score + '%'); bar.appendChild(i);
    return bar;
  }
  function weegt(n) { return (T.weegt || 'Weegt {n} van de 100 punten').replace('{n}', String(n)); }
  function telTekst(c) {
    var tel = [];
    if (c.slecht) tel.push(c.slecht + ' probleem' + (c.slecht > 1 ? 'en' : ''));
    if (c.beter) tel.push(c.beter + ' kan beter');
    if (c.goed) tel.push(c.goed + ' goed');
    return tel.join(' · ');
  }

  /* ---------- het scanpaneel in de hero ---------- */
  var paneel = document.querySelector('[data-sc-voorbeeld]');
  var P = null, begin = null, punten = {}, tik = null;
  if (paneel && paneel.querySelector('[data-sc-vb-dial]')) {
    P = {
      adres: paneel.querySelector('[data-sc-adres]'), staat: paneel.querySelector('[data-sc-staat]'),
      dial: paneel.querySelector('[data-sc-vb-dial]'), n: paneel.querySelector('[data-sc-vb-n]'),
      label: paneel.querySelector('[data-sc-vb-label]'),
      noot: paneel.querySelector('[data-sc-vb-noot]'), rijen: [].slice.call(paneel.querySelectorAll('.sc-vb-cats li'))
    };
    begin = {
      aria: paneel.getAttribute('aria-label'), adres: P.adres.textContent, staat: P.staat.textContent,
      dial: P.dial.className, s: P.dial.style.getPropertyValue('--s'), n: P.n.textContent, label: P.label.textContent, noot: P.noot.textContent,
      rijen: P.rijen.map(function (r) { return { klas: r.className, w: r.style.getPropertyValue('--w'), b: r.querySelector('b').textContent }; })
    };
    // wat we nakijken, per onderdeel, uit de sectie "Wat we checken"
    [].forEach.call(document.querySelectorAll('#wat-we-checken .sc-check[data-cat]'), function (a) {
      punten[a.getAttribute('data-cat')] = [].map.call(a.querySelectorAll('li'), function (li) { return li.textContent.trim(); });
    });
  }
  function stopTik() {
    if (tik) clearInterval(tik);
    tik = null;
    if (P) P.rijen.forEach(function (r) { r.classList.remove('is-nu'); });
  }
  function startTik() {
    var lijst = [];
    P.rijen.forEach(function (r, ri) {
      (punten[r.getAttribute('data-cat')] || []).forEach(function (t) { lijst.push([ri, t]); });
    });
    P.label.textContent = T.scan_bezig_label || '';
    if (reduce || !lijst.length) {
      P.rijen.forEach(function (r) { r.classList.add('is-nu'); });
      return;
    }
    var i = 0;
    // naast de meter: welk punt we nu nakijken (de rij van dat onderdeel licht op)
    var stap = function () {
      var x = lijst[i % lijst.length]; i++;
      P.rijen.forEach(function (r, ri) { r.classList.toggle('is-nu', ri === x[0]); });
      P.label.textContent = T.scan_nu || 'Nu:';
      P.label.appendChild(el('b', null, x[1]));
    };
    stap();
    tik = setInterval(stap, 340);
  }
  function paneelBezig(adres) {
    if (!P) return;
    stopTik();
    paneel.classList.remove('is-intro', 'is-klaar');
    paneel.classList.add('is-bezig');
    paneel.setAttribute('aria-busy', 'true');
    P.adres.textContent = adres;
    P.staat.textContent = T.scan_bezig || 'Bezig met scannen';
    P.noot.textContent = T.scan_bezig_noot || '';
    startTik();
  }
  function paneelKlaar(d) {
    if (!P) return;
    stopTik();
    paneel.classList.remove('is-bezig', 'is-intro', 'is-klaar');
    paneel.removeAttribute('aria-busy');
    paneel.setAttribute('aria-label', 'Je score: ' + d.score + ' op 100');
    P.adres.textContent = d.host || d.url;
    P.staat.textContent = T.scan_klaar || 'Je score';
    P.dial.className = 'sc-dial is-' + klasVan(d.score);
    P.dial.style.setProperty('--s', String(d.score));
    P.n.textContent = String(d.score);
    P.label.textContent = d.label;
    var per = {};
    d.categorieen.forEach(function (c) { per[c.id] = c; });
    P.rijen.forEach(function (r, i) {
      var c = per[r.getAttribute('data-cat')];
      var b = r.querySelector('b');
      r.style.setProperty('--d', (i * 90) + 'ms');
      if (!c || c.score === null) { r.className = ''; r.style.setProperty('--w', '0%'); b.textContent = ''; return; }
      r.className = 'is-' + klasVan(c.score);
      r.style.setProperty('--w', c.score + '%');
      b.textContent = String(c.score);
    });
    P.noot.textContent = '';
    if (T.scan_klaar_noot) P.noot.appendChild(document.createTextNode(T.scan_klaar_noot + ' '));
    var a = el('a', null, T.scan_naar_rapport || 'Naar je rapport');
    a.href = '#rapport';
    a.addEventListener('click', function (e) { e.preventDefault(); naarRapport(); });
    P.noot.appendChild(a);
    void paneel.offsetWidth; // de animatie van de meter opnieuw starten
    paneel.classList.add('is-klaar');
  }
  function paneelTerug() {
    if (!P) return;
    if (laatste) { paneelKlaar(laatste); return; }
    stopTik();
    paneel.classList.remove('is-bezig', 'is-klaar', 'is-intro');
    paneel.removeAttribute('aria-busy');
    paneel.setAttribute('aria-label', begin.aria);
    P.adres.textContent = begin.adres;
    P.staat.textContent = begin.staat;
    P.dial.className = begin.dial;
    P.dial.style.setProperty('--s', begin.s);
    P.n.textContent = begin.n;
    P.label.textContent = begin.label;
    P.noot.textContent = begin.noot;
    P.rijen.forEach(function (r, i) {
      var o = begin.rijen[i];
      r.className = o.klas;
      r.style.setProperty('--w', o.w);
      r.querySelector('b').textContent = o.b;
    });
  }
  // op de gsm staat het paneel onder het formulier: tijdens de scan schuiven we het in beeld
  function toonPaneel() {
    if (!paneel) return;
    var r = paneel.getBoundingClientRect();
    if (r.top > window.innerHeight - 200 || r.bottom < 80) paneel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }
  // één keer vullen zodra het paneel in beeld komt
  if (P && !reduce && !params.get('url')) {
    var intro = function () {
      if (paneel.classList.contains('is-bezig') || paneel.classList.contains('is-klaar')) return;
      paneel.classList.add('is-intro');
      setTimeout(function () { paneel.classList.remove('is-intro'); }, 1900);
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); intro(); }
      }, { threshold: 0.35 });
      io.observe(paneel);
    } else intro();
  }

  /* ---------- scannen ---------- */
  function bezig(aan, adres) {
    bezigNu = aan;
    knop.disabled = aan;
    knop.classList.toggle('is-bezig', aan);
    knopT.textContent = aan ? (knop.getAttribute('data-bezig') || knopTekst) : knopTekst;
    form.setAttribute('aria-busy', aan ? 'true' : 'false');
    status.classList.remove('is-fout', 'is-ok');
    veld.classList.remove('is-fout');
    input.removeAttribute('aria-invalid');
    status.textContent = aan ? 'We scannen ' + adres + '. Dit duurt meestal enkele seconden.' : '';
  }
  function fout(tekst) {
    status.classList.remove('is-ok');
    status.classList.add('is-fout');
    status.textContent = tekst;
    veld.classList.add('is-fout');
    input.setAttribute('aria-invalid', 'true');
  }
  input.addEventListener('input', function () {
    if (!veld.classList.contains('is-fout')) return;
    veld.classList.remove('is-fout');
    input.removeAttribute('aria-invalid');
  });

  function scan(waarde) {
    var v = String(waarde || '').trim();
    if (bezigNu) return;
    if (!v) { fout('Geef het adres van je website in, bijvoorbeeld jouwzaak.be.'); input.focus(); return; }
    if (naarTimer) { clearTimeout(naarTimer); naarTimer = null; }
    var adres = v.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    bezig(true, adres);
    paneelBezig(adres);
    toonPaneel();
    var t0 = Date.now();
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
      // heel snelle antwoorden: het paneel even laten zien, zodat het niet flitst
      setTimeout(function () { klaarMet(data, v); }, Math.max(0, 600 - (Date.now() - t0)));
    });
  }

  function klaarMet(data, v) {
    bezig(false);
    if (!data || !data.ok) {
      paneelTerug();
      fout((data && data.bericht) || 'Er liep iets mis bij de scan. Probeer het zo meteen opnieuw.');
      input.focus();
      return;
    }
    laatste = data;
    try {
      var u = new URL(location.href);
      u.searchParams.set('url', v);
      history.replaceState(null, '', u.pathname + u.search);
    } catch (e) { /* oude browser: niets */ }
    status.classList.add('is-ok');
    status.textContent = 'Klaar. Je score is ' + data.score + ' op 100. Je rapport staat hieronder.';
    paneelKlaar(data);
    toon(data);
    naarTimer = setTimeout(naarRapport, reduce ? 0 : 1300);
  }

  function naarRapport() {
    naarTimer = null;
    rapport.classList.remove('is-in');
    void rapport.offsetWidth;
    rapport.classList.add('is-in');
    kop.focus({ preventScroll: true });
    rapport.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- het rapport ---------- */
  function lijstVan(xs) {
    var ul = el('ul', 'sc-items');
    xs.forEach(function (x) {
      var li = el('li', 'sc-item is-' + x.status);
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
    return ul;
  }
  var VOLG = { slecht: 0, beter: 1, goed: 2, info: 3 };
  function opVolgorde(xs) {
    return xs.map(function (x, i) { return [x, i]; })
      .sort(function (a, b) { return (VOLG[a[0].status] - VOLG[b[0].status]) || (a[1] - b[1]); })
      .map(function (p) { return p[0]; });
  }

  function toon(d) {
    rapport.hidden = false;
    rapport.classList.remove('is-in');
    // totaal: score, telling en de score per onderdeel
    uitkomst.textContent = '';
    var wrap = el('div', 'sc-uitkomst');
    var tot = el('div', 'sc-totaal');
    tot.appendChild(dial(d.score));
    var tt = el('div', 'sc-totaal-t');
    tt.appendChild(el('b', null, d.label));
    var tijd = '';
    try { tijd = new Date(d.gescand).toLocaleString('nl-BE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); } catch (e) { tijd = ''; }
    tt.appendChild(el('p', null, 'Gescand: ' + d.url));
    if (tijd) tt.lastChild.appendChild(el('span', 'sc-tijd', tijd));
    tot.appendChild(tt);
    var tel = { slecht: 0, beter: 0, goed: 0, info: 0 };
    d.checks.forEach(function (x) { if (x.status in tel) tel[x.status]++; });
    var tally = el('div', 'sc-tally');
    var balk = el('div', 'sc-tally-bar'); balk.setAttribute('aria-hidden', 'true');
    ['slecht', 'beter', 'goed'].forEach(function (st) {
      if (!tel[st]) return;
      var s = el('span', 'is-' + st); s.style.setProperty('--n', String(tel[st])); balk.appendChild(s);
    });
    tally.appendChild(balk);
    var lg = el('ul', 'sc-tally-l'); lg.setAttribute('aria-label', 'Alle punten samen');
    var woord = function (st, n) { return st === 'slecht' ? (n > 1 ? 'problemen' : 'probleem') : st === 'beter' ? 'kan beter' : st === 'goed' ? 'goed' : 'niet meegeteld'; };
    ['slecht', 'beter', 'goed', 'info'].forEach(function (st) {
      if (!tel[st]) return;
      var li = el('li', 'is-' + st);
      var dot = el('span', 'sc-dot'); dot.setAttribute('aria-hidden', 'true');
      li.appendChild(dot);
      li.appendChild(el('b', null, String(tel[st])));
      li.appendChild(document.createTextNode(' ' + woord(st, tel[st])));
      lg.appendChild(li);
    });
    tally.appendChild(lg);
    tot.appendChild(tally);
    if (T.uitleg_score) tot.appendChild(el('p', 'sc-uitleg', T.uitleg_score));
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
      a.appendChild(balkje(c.score));
      a.appendChild(el('span', 'sc-cat-w', c.gewicht ? weegt(c.gewicht) : ''));
      a.appendChild(el('span', 'sc-cat-tel', telTekst(c)));
      li.appendChild(a);
      cats.appendChild(li);
    });
    wrap.appendChild(cats);
    uitkomst.appendChild(wrap);
    jsnoot.hidden = !(d.meta && (d.meta.jsSite || d.meta.weinigTekst));

    // alle punten per onderdeel: eerst wat aandacht vraagt, wat in orde is klapt open
    groepen.textContent = '';
    d.categorieen.forEach(function (c) {
      var lijst = d.checks.filter(function (x) { return x.cat === c.id; });
      if (!lijst.length) return;
      var aandacht = opVolgorde(lijst.filter(function (x) { return x.status === 'slecht' || x.status === 'beter'; }));
      var rest = opVolgorde(lijst.filter(function (x) { return x.status !== 'slecht' && x.status !== 'beter'; }));
      var sec = el('section', 'sc-groep' + (c.score !== null ? ' is-' + klasVan(c.score) : ''));
      sec.id = 'groep-' + c.id;
      sec.setAttribute('aria-labelledby', 'groep-' + c.id + '-kop');
      var h = el('div', 'sc-groep-h');
      var h4 = el('h4', null, c.naam); h4.id = 'groep-' + c.id + '-kop';
      h.appendChild(h4);
      if (c.score !== null) {
        var sp = el('p', 'sc-groep-s');
        sp.appendChild(el('b', null, String(c.score)));
        sp.appendChild(document.createTextNode('/100'));
        h.appendChild(sp);
        h.appendChild(balkje(c.score));
      }
      var tt2 = telTekst(c);
      if (tt2) h.appendChild(el('p', 'sc-groep-tel', tt2));
      if (c.gewicht) h.appendChild(el('p', 'sc-groep-w', weegt(c.gewicht)));
      sec.appendChild(h);
      var bdy = el('div', 'sc-groep-b');
      if (aandacht.length) bdy.appendChild(lijstVan(aandacht));
      else bdy.appendChild(el('p', 'sc-alles-ok', T.alles_ok || 'Alles in orde in dit onderdeel.'));
      if (rest.length) {
        var goedN = rest.filter(function (x) { return x.status === 'goed'; }).length;
        var infoN = rest.length - goedN;
        var som = [];
        if (goedN) som.push(goedN + (goedN === 1 ? ' punt' : ' punten') + ' in orde');
        if (infoN) som.push(infoN + ' niet meegeteld');
        var det = el('details', 'sc-ok');
        det.appendChild(el('summary', null, som.join(', ')));
        det.appendChild(lijstVan(rest));
        bdy.appendChild(det);
      }
      sec.appendChild(bdy);
      groepen.appendChild(sec);
    });
    toonPlan();
    klaar.hidden = true;
    if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
    frame = null;
    var alt = slot.parentNode.querySelector('.sc-form-alt:not(.sc-plan-meer)');
    if (alt) alt.parentNode.removeChild(alt);
    formBox.textContent = '';
    formBox.hidden = true;
    formKnop.hidden = false;
  }

  function toonPlan() {
    var d = laatste;
    planLijst.textContent = '';
    var punten = d.plan.map(function (id) { return d.checks.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
    var oud = plan.querySelector('.sc-plan-meer');
    if (oud) oud.parentNode.removeChild(oud);
    if (!punten.length) {
      planLijst.appendChild(el('li', 'sc-plan-leeg', T.plan_leeg || 'We vonden niets dat beter kan.'));
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
      var adv = el('p', 'sc-p-advies');
      if (open) adv.textContent = x.advies;
      else { adv.innerHTML = SLOT; adv.appendChild(document.createTextNode(T.plan_verborgen || 'Zit in je verbeterplan')); }
      li.appendChild(adv);
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
