/* EM Times — eigen nav + footer.
   Booking-modal, cookie-bar, reveal & page-transitions komen uit site.js. */
(function(){
  var body = document.body;
  var R = (body && body.dataset.root) || '';   // pad naar site-root (bv. "../../")
  var topic = (body && body.dataset.topic) || '';

  // ── logo (external SVG uit assets) ──
  var LOGO = R + 'assets/logo-em.png';
  var HOME = R + 'index.html';          // hoofdsite home
  var HUB  = R + 'emtimes/index.html';  // EM Times hub

  var TOPICS = [
    { key:'ai',    label:'AI',             href: R+'emtimes/ai/index.html' },
    { key:'auto',  label:'Automatisering', href: R+'emtimes/automatisering/index.html' },
    { key:'web',   label:'Websites',       href: R+'emtimes/websites/index.html' },
    { key:'groei', label:'Groei',          href: R+'emtimes/groei/index.html' }
  ];

  function ico(path){ return '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>'; }
  var HOMEICO = ico('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>');
  var ARROW   = ico('<path d="M3 8h10M9 4l4 4-4 4"/>');
  var CHEV    = ico('<path d="M9 6l6 6-6 6"/>');
  var CLOSE   = ico('<path d="M18 6L6 18M6 6l12 12"/>');
  var SEARCH  = ico('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>');

  var topLinks = TOPICS.map(function(t){
    return '<a href="'+t.href+'"'+(t.key===topic?' class="on"':'')+'>'+t.label+'</a>';
  }).join('');

  var mobLinks = TOPICS.map(function(t){
    return '<a href="'+t.href+'">'+t.label+(t.soon?' <small>binnenkort</small>':'')+CHEV+'</a>';
  }).join('');

  var NAV =
   '<div class="et-nav-in">'
   + '<a class="et-brand" href="'+HUB+'" aria-label="EM Times home">'
     + '<span class="chip"><img src="'+LOGO+'" alt="EM Launchpad"/></span>'
     + '<span class="wm"><b>EM&nbsp;Times</b><span>// kennishub</span></span>'
   + '</a>'
   + '<nav class="et-topics" aria-label="Onderwerpen">'+topLinks+'</nav>'
   + '<div class="et-nav-right">'
     + '<button class="et-searchbtn" id="etSearchBtn" type="button" aria-label="Zoek een artikel">'+SEARCH+'</button>'
     + '<a class="et-home" href="'+HOME+'">'+HOMEICO+'<span>emlaunchpad.com</span></a>'
     + '<a class="et-navcta" href="'+R+'Contact.html" data-book>Plan een gesprek'+ARROW+'</a>'
     + '<button class="et-burger" id="etBurger" type="button" aria-label="Menu"><span></span><span></span><span></span></button>'
   + '</div>'
   + '</div>'
   + '<div class="et-mob" id="etMob" aria-hidden="true">'
     + '<div class="et-mob-top">'
       + '<a class="et-brand" href="'+HUB+'"><span class="chip"><img src="'+LOGO+'" alt="EM Launchpad"/></span><span class="wm"><b>EM&nbsp;Times</b><span>// kennishub</span></span></a>'
       + '<button class="et-mob-close" id="etMobClose" type="button" aria-label="Sluiten">'+CLOSE+'</button>'
     + '</div>'
     + '<button class="et-herosearch" id="etMobSearch" type="button" style="max-width:none;margin:0 0 20px">'+SEARCH+'<span class="ph">Zoek een artikel…</span></button>'
     + '<nav class="et-mob-links" aria-label="Onderwerpen">'
       + '<a href="'+HUB+'">Alle artikels'+CHEV+'</a>'
       + mobLinks
     + '</nav>'
     + '<div class="et-mob-foot">'
       + '<a class="et-navcta" href="'+R+'Contact.html" data-book>Plan een gratis gesprek'+ARROW+'</a>'
       + '<a class="et-home" href="'+HOME+'">'+HOMEICO+'<span>Terug naar emlaunchpad.com</span></a>'
     + '</div>'
   + '</div>';

  var SOC =
    '<a href="https://be.linkedin.com/in/ebert-vanbrabant-077b5326a" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21H17v-5.4c0-1.3 0-2.95-1.8-2.95s-2.08 1.4-2.08 2.85V21H9z"/></svg></a>'
   +'<a href="https://www.instagram.com/em_launchpad/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="var(--mid)" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="var(--mid)" stroke="none"/></svg></a>'
   +'<a href="https://www.youtube.com/@emlaunchpad" target="_blank" rel="noopener" aria-label="YouTube"><svg viewBox="0 0 24 24"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 00-1.7-1.7C19.3 5.2 12 5.2 12 5.2s-7.3 0-8.9.4A2.5 2.5 0 001.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 001.7 1.7c1.6.4 8.9.4 8.9.4s7.3 0 8.9-.4a2.5 2.5 0 001.7-1.7C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z"/></svg></a>'
   +'<a href="https://www.facebook.com/profile.php?id=61564020189008" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0022 12z"/></svg></a>';

  var FOOT =
   '<div class="et-foot-in">'
   + '<div class="et-foot-top">'
     + '<div class="et-foot-brand">'
       + '<div class="mast"><span class="chip"><img src="'+LOGO+'" alt="EM Launchpad"/></span><span class="wm">EM&nbsp;Times</span></div>'
       + '<p>De kennishub van EM Launchpad. Praktische inzichten over AI, automatisatie en websites voor groeiende Belgische bedrijven.</p>'
       + '<div class="et-foot-soc">'+SOC+'</div>'
     + '</div>'
     + '<div class="et-foot-col">'
       + '<h5>// onderwerpen</h5>'
       + '<a href="'+R+'emtimes/ai/index.html">AI &amp; chatbots</a>'
       + '<a href="'+R+'emtimes/automatisering/index.html">Automatisering</a>'
       + '<a href="'+R+'emtimes/websites/index.html">Websites</a>'
       + '<a href="'+R+'emtimes/groei/index.html">Groei &amp; marketing</a>'
     + '</div>'
     + '<div class="et-foot-col">'
       + '<h5>// em launchpad</h5>'
       + '<a href="'+HOME+'">Hoofdsite</a>'
       + '<a href="'+R+'Diensten.html">Diensten</a>'
       + '<a href="'+R+'Over ons.html">Over ons</a>'
       + '<a href="'+R+'Contact.html">Contact</a>'
     + '</div>'
     + '<div class="et-backsite">'
       + '<span class="txt">EM Times is onderdeel van <b>EM Launchpad</b> — het Belgische AI-bureau uit Limburg.</span>'
       + '<a href="'+HOME+'">'+HOMEICO+'Terug naar de hoofdsite</a>'
     + '</div>'
   + '</div>'
   + '<div class="et-foot-bot">'
     + '<span>© 2026 <b>EM&nbsp;LAUNCHPAD</b> · <a href="'+R+'privacy.html">privacy</a></span>'
     + '<span><span class="mint">▲</span> GEMAAKT_IN_LIMBURG · BELGIË</span>'
   + '</div>'
   + '</div>';

  var navEl = document.getElementById('et-nav');
  if(navEl){ navEl.className='et-nav'; navEl.innerHTML=NAV; }
  var footEl = document.getElementById('et-foot');
  if(footEl){ footEl.className='et-foot'; footEl.innerHTML=FOOT; }

  // burger
  var burger = document.getElementById('etBurger');
  var mob = document.getElementById('etMob');
  if(burger && mob){
    var closeBtn = document.getElementById('etMobClose');
    var lockY = 0;
    function open(){ lockY=window.scrollY||0; mob.classList.add('open'); mob.setAttribute('aria-hidden','false');
      document.body.style.position='fixed'; document.body.style.top=(-lockY)+'px'; document.body.style.left='0'; document.body.style.right='0'; }
    function close(){ mob.classList.remove('open'); mob.setAttribute('aria-hidden','true');
      document.body.style.position=''; document.body.style.top=''; document.body.style.left=''; document.body.style.right=''; window.scrollTo(0,lockY); }
    burger.addEventListener('click',open);
    if(closeBtn) closeBtn.addEventListener('click',close);
    mob.querySelectorAll('a').forEach(function(a){ a.addEventListener('click',close); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape' && mob.classList.contains('open')) close(); });
  }

  /* ── ZOEKEN ── */
  function esc(s){ return (s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  function highlight(text, toks){
    var out = esc(text);
    toks.forEach(function(t){
      if(!t) return;
      var re = new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');
      out = out.replace(re,'<mark>$1</mark>');
    });
    return out;
  }
  function search(q){
    var arts = window.ET_ARTICLES || [];
    var query = norm(q).trim();
    if(!query) return arts.slice();
    var toks = query.split(/\s+/);
    var scored = [];
    arts.forEach(function(a){
      var titleN = norm(a.title);
      var hay = norm([a.title, a.excerpt, a.topic, (a.tags||[]).join(' ')].join(' '));
      var ok = true, score = 0;
      toks.forEach(function(t){
        if(hay.indexOf(t) === -1) ok = false;
        if(titleN.indexOf(t) !== -1) score += 3; else if(hay.indexOf(t) !== -1) score += 1;
      });
      if(ok) scored.push({ a:a, score:score });
    });
    scored.sort(function(x,y){ return y.score - x.score; });
    return scored.map(function(o){ return o.a; });
  }

  var overlay = document.createElement('div');
  overlay.className = 'et-search';
  overlay.id = 'etSearch';
  overlay.innerHTML =
      '<div class="et-search-box" role="dialog" aria-modal="true" aria-label="Zoek een artikel">'
    +   '<div class="et-search-in">' + SEARCH
    +     '<input type="text" id="etSearchInput" placeholder="Zoek een artikel, onderwerp of trefwoord…" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Zoekterm"/>'
    +     '<button class="esc" id="etSearchEsc" type="button">esc</button>'
    +   '</div>'
    +   '<div class="et-sr-list" id="etSearchList"></div>'
    +   '<div class="et-sr-foot"><span><b>↑</b><b>↓</b> navigeren</span><span><b>↵</b> openen</span><span><b>esc</b> sluiten</span></div>'
    + '</div>';
  document.body.appendChild(overlay);

  var inputEl = overlay.querySelector('#etSearchInput');
  var listEl  = overlay.querySelector('#etSearchList');
  var isOpen = false;

  function renderResults(q){
    var list = search(q);
    var toks = norm(q).trim().split(/\s+/).filter(Boolean);
    if(!list.length){
      listEl.innerHTML = '<div class="et-sr-empty">Geen artikels gevonden'
        + (q.trim() ? ' voor “<b>'+esc(q.trim())+'</b>”' : '')
        + '.<br>Probeer een ander zoekwoord.</div>';
      return;
    }
    listEl.innerHTML = list.map(function(a, i){
      return '<a class="et-sr-item'+(i===0?' sel':'')+'" href="'+R+a.path+'">'
        + '<span class="et-sr-tag">'+esc(a.topic)+'</span>'
        + '<span class="et-sr-t">'+highlight(a.title, toks)+'</span>'
        + '<span class="et-sr-x">'+esc(a.excerpt)+'</span>'
        + '</a>';
    }).join('');
  }
  function selItems(){ return [].slice.call(listEl.querySelectorAll('.et-sr-item')); }
  function moveSel(dir){
    var its = selItems(); if(!its.length) return;
    var idx = its.findIndex(function(el){ return el.classList.contains('sel'); });
    if(idx < 0) idx = 0; else its[idx].classList.remove('sel');
    idx = (idx + dir + its.length) % its.length;
    its[idx].classList.add('sel');
    its[idx].scrollIntoView({ block:'nearest' });
  }
  function openSearch(){
    isOpen = true; overlay.classList.add('open');
    renderResults(inputEl.value);
    setTimeout(function(){ inputEl.focus(); inputEl.select(); }, 30);
  }
  function closeSearch(){ isOpen = false; overlay.classList.remove('open'); }
  function closeMobIfOpen(){
    if(mob && mob.classList.contains('open')){
      mob.classList.remove('open'); mob.setAttribute('aria-hidden','true');
      document.body.style.position=''; document.body.style.top=''; document.body.style.left=''; document.body.style.right='';
    }
  }

  inputEl.addEventListener('input', function(){ renderResults(inputEl.value); });
  inputEl.addEventListener('keydown', function(e){
    if(e.key === 'ArrowDown'){ e.preventDefault(); moveSel(1); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); moveSel(-1); }
    else if(e.key === 'Enter'){
      var sel = listEl.querySelector('.et-sr-item.sel') || listEl.querySelector('.et-sr-item');
      if(sel){ e.preventDefault(); window.location.href = sel.getAttribute('href'); }
    }
  });
  overlay.addEventListener('click', function(e){ if(e.target === overlay) closeSearch(); });
  overlay.querySelector('#etSearchEsc').addEventListener('click', closeSearch);

  var navBtn = document.getElementById('etSearchBtn');
  if(navBtn) navBtn.addEventListener('click', openSearch);
  var heroBtn = document.getElementById('etHeroSearch');
  if(heroBtn) heroBtn.addEventListener('click', openSearch);
  var mobBtn = document.getElementById('etMobSearch');
  if(mobBtn) mobBtn.addEventListener('click', function(){ closeMobIfOpen(); openSearch(); });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && isOpen){ closeSearch(); return; }
    var tag = (e.target && e.target.tagName) || '';
    var typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable);
    if((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')){ e.preventDefault(); isOpen ? closeSearch() : openSearch(); return; }
    if(!isOpen && !typing && e.key === '/'){ e.preventDefault(); openSearch(); }
  });
})();
