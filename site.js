(function(){const GHL_BOOKING_URL='https://api.leadconnectorhq.com/widget/booking/OoJsvpiXXpwS5oGbQGIE';const _pp=location.pathname;const _dr=(document.body&&document.body.dataset.root)||'';const _hasDR=_dr!=='';const B=_hasDR?_dr:(/\/(lokaal|fr|en)\//.test(_pp)?'../':'');const P=_hasDR?_dr:(/\/lokaal\//.test(_pp)?'../':'');const BOOKING_FALLBACK=P+'Contact';const _LG=/\/fr\//.test(_pp)?'fr':/\/en\//.test(_pp)?'en':'nl';const _T={nl:{main:'Hoofdmenu',home:'Home',services:'Diensten',portfolio:'Portfolio',about:'Over ons',contact:'Contact',demo:'Gratis demo',book:'Plan een gesprek',bookFree:'Plan een gratis gesprek',lang:'Taal',menu:'Menu',close:'Sluiten',packages:'Pakketten',solutions:'Oplossingen',p1n:'Pakket 1',p1:'Digitale groei',p1p:'€150 / maand',p1d:'Website, Google, reviews, CRM en automatisering',p2n:'Pakket 2',p2:'AI Consulting',p2p:'Op aanvraag',p2d:'Een persoonlijk AI-plan voor jouw bedrijf',all:'Alle diensten en prijzen',s1:'AI Chatbots',s1d:'Beantwoordt vragen en boekt afspraken, 24/7',s2:'AI Voice Agents',s2d:'Neemt elke oproep aan, dag en nacht',s3:'Websites',s3d:'Snel, mobiel en gemaakt om te converteren',s4:'AI-automatisering',s4d:'Opvolging en herinneringen op de achtergrond',s5:'Online afsprakensysteem',s5d:'Je agenda vult zichzelf',nw:'Nieuw',caseK:'Uitgelichte case',caseT:'Clinic3D, Hasselt',caseA:'bevestigde afspraken',caseB:'no-shows',caseGo:'Lees de case',made:'Gemaakt in Limburg'},en:{main:'Main menu',home:'Home',services:'Services',portfolio:'Portfolio',about:'About us',contact:'Contact',demo:'Free demo',book:'Book a call',bookFree:'Book a free call',lang:'Language',menu:'Menu',close:'Close',packages:'Packages',solutions:'Solutions',p1n:'Package 1',p1:'Digital Growth',p1p:'€150 / month',p1d:'Website, Google, reviews, CRM and automation',p2n:'Package 2',p2:'AI Consulting',p2p:'On request',p2d:'A personal AI plan for your business',all:'All services and prices',s1:'AI Chatbots',s1d:'Answer questions and book appointments, 24/7',s2:'AI Voice Agents',s2d:'Pick up every call, day and night',s3:'Websites',s3d:'Fast, mobile and built to convert',s4:'AI automation',s4d:'Follow-up and reminders in the background',s5:'Online booking system',s5d:'Your calendar fills itself',nw:'New',caseK:'Featured case',caseT:'Clinic3D, Hasselt',caseA:'confirmed appointments',caseB:'no-shows',caseGo:'Read the case',made:'Made in Limburg'},fr:{main:'Menu principal',home:'Accueil',services:'Services',portfolio:'Portfolio',about:'À propos',contact:'Contact',demo:'Démo gratuite',book:'Planifier un appel',bookFree:'Planifier un appel gratuit',lang:'Langue',menu:'Menu',close:'Fermer',packages:'Packs',solutions:'Solutions',p1n:'Pack 1',p1:'Croissance digitale',p1p:'150 € / mois',p1d:'Site web, Google, avis, CRM et automatisation',p2n:'Pack 2',p2:'Consulting IA',p2p:'Sur demande',p2d:'Un plan IA personnalisé pour votre entreprise',all:'Tous les services et tarifs',s1:'Chatbots IA',s1d:'Répondent aux questions et prennent des rendez-vous, 24h/24',s2:'Agents vocaux IA',s2d:'Répondent à chaque appel, jour et nuit',s3:'Sites web',s3d:'Rapides, mobiles et conçus pour convertir',s4:'Automatisation IA',s4d:'Suivi et rappels en arrière-plan',s5:'Prise de rendez-vous en ligne',s5d:'Votre agenda se remplit tout seul',nw:'Nouveau',caseK:'Étude de cas',caseT:'Clinic3D, Hasselt',caseA:'rendez-vous confirmés',caseB:'no-shows',caseGo:'Lire l’étude de cas',made:'Fait au Limbourg'}}[_LG];const _SV=(d,w)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||1.8)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';const _CHEV=_SV('<path d="M6 9l6 6 6-6"/>',2.2);const _ARR='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';const _NLT=_LG!=='nl'?'<em class="nv-tag">NL</em>':'';const _SOLS=[[P+'AI%20Chatbots','<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5z"/>',_T.s1,_T.s1d,''],[P+'AI%20Voice%20Agents','<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',_T.s2,_T.s2d,''],[P+'Websites','<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',_T.s3,_T.s3d,''],[P+'AI-Automatisering','<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.5 6h9M6.3 8.2l4.4 7.6M17.7 8.2l-4.4 7.6"/>',_T.s4,_T.s4d,''],[P+'Afsprakensysteem','<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8.5 15l2 2 4-4"/>',_T.s5,_T.s5d,'<em class="nv-tag is-new">'+_T.nw+'</em>'+_NLT]].map((x)=>'<a href="'+x[0]+'"><span class="nv-ic">'+_SV(x[1])+'</span><span class="nv-sol-t"><b>'+x[2]+x[4]+'</b><small>'+x[3]+'</small></span></a>').join('');const _PACKS='<a class="nv-pack" href="'+P+'Diensten#pakket-1"><span class="n">'+_T.p1n+'</span><b>'+_T.p1+'</b><span class="pr">'+_T.p1p+'</span><small>'+_T.p1d+'</small></a><a class="nv-pack is-prem" href="'+P+'Diensten#pakket-2"><span class="n">'+_T.p2n+' · ✦ Premium</span><b>'+_T.p2+'</b><span class="pr">'+_T.p2p+'</span><small>'+_T.p2d+'</small></a>';const NAV=`
  <header class="nv" id="nv" data-no-i18n="">
    <div class="nv-dim" aria-hidden="true"></div>
    <div class="wrap">
      <nav class="nv-bar" aria-label="${_T.main}">
        <a class="nv-brand" href="${P||'./'}" aria-label="EM Launchpad, ${_T.home}"><span class="em-chip nv-em"><img class="em-img" src="${B}assets/logo-em.png" alt="" /></span></a>
        <div class="nv-links">
          <span class="nv-ind" aria-hidden="true"></span>
          <button class="nv-link nv-trig" type="button" aria-expanded="false" aria-controls="nvMega" data-nav="diensten">${_T.services}${_CHEV}</button>
          <a class="nv-link" href="${P}Portfolio" data-nav="portfolio">${_T.portfolio}</a>
          <a class="nv-link" href="${P}Over%20ons" data-nav="over_ons">${_T.about}</a>
          <a class="nv-link" href="${P}Contact" data-nav="contact">${_T.contact}</a>
        </div>
        <div class="nv-right">
          <div class="nv-lang">
            <button class="nv-lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="${_T.lang}">${_SV('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>')}<span>${_LG.toUpperCase()}</span>${_CHEV}</button>
            <div class="nv-lang-menu"><button type="button" data-setlang="nl"><b>NL</b>Nederlands</button><button type="button" data-setlang="fr"><b>FR</b>Français</button><button type="button" data-setlang="en"><b>EN</b>English</button></div>
          </div>
          <a class="nv-demo" href="${P}Gratis%20Demo" data-nav="gratis_demo"><i><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></i>${_T.demo}</a>
          <a class="nv-cta" href="${P}Contact" data-book>${_T.book}${_ARR}</a>
          <button class="nv-burger" id="navBurger" type="button" aria-label="${_T.menu}" aria-expanded="false" aria-controls="mobnav"><span></span><span></span></button>
        </div>
      </nav>
      <div class="nv-mega" id="nvMega">
        <div class="nv-mega-in">
          <div class="nv-col">
            <span class="nv-kick">${_T.packages}</span>
            ${_PACKS}
            <a class="nv-all" href="${P}Diensten">${_T.all}${_ARR}</a>
          </div>
          <div class="nv-col">
            <span class="nv-kick">${_T.solutions}</span>
            <div class="nv-sols">${_SOLS}</div>
          </div>
          <a class="nv-feature" href="${P}Clinic3D">
            <span class="nv-kick">${_T.caseK}${_NLT}</span>
            <span class="nv-f-t">${_T.caseT}</span>
            <span class="nv-f-n"><b>650</b>${_T.caseA}</span>
            <span class="nv-f-z"><b>0</b>${_T.caseB}</span>
            <span class="nv-f-go">${_T.caseGo}${_ARR}</span>
          </a>
        </div>
      </div>
    </div>
  </header>
  <div class="nv-space" aria-hidden="true"></div>
  <div class="nv-sheet" id="mobnav" aria-hidden="true" data-no-i18n="">
    <div class="nv-sheet-top">
      <a class="nv-brand" href="${P||'./'}" aria-label="EM Launchpad, ${_T.home}"><span class="em-chip nv-em"><img class="em-img" src="${B}assets/logo-em.png" alt="" /></span></a>
      <button class="nv-close" id="mobnavClose" type="button" aria-label="${_T.close}">${_SV('<path d="M18 6L6 18M6 6l12 12"/>',2)}</button>
    </div>
    <nav class="nv-sheet-links" aria-label="${_T.main}">
      <a href="${P||'./'}" data-nav="home">${_T.home}${_ARR}</a>
      <div class="nv-acc">
        <button class="nv-acc-btn" type="button" aria-expanded="false" data-nav="diensten">${_T.services}<span class="nv-plus" aria-hidden="true"></span></button>
        <div class="nv-acc-panel"><div class="nv-acc-in">
          <div class="nv-acc-packs">${_PACKS}</div>
          <div class="nv-sols">${_SOLS}</div>
          <a class="nv-all" href="${P}Diensten">${_T.all}${_ARR}</a>
        </div></div>
      </div>
      <a href="${P}Portfolio" data-nav="portfolio">${_T.portfolio}${_ARR}</a>
      <a href="${P}Over%20ons" data-nav="over_ons">${_T.about}${_ARR}</a>
      <a href="${P}Gratis%20Demo" data-nav="gratis_demo">${_T.demo}${_ARR}</a>
      <a href="${P}Contact" data-nav="contact">${_T.contact}${_ARR}</a>
    </nav>
    <div class="nv-sheet-foot">
      <a class="nv-cta" href="${P}Contact" data-book>${_T.bookFree}${_ARR}</a>
      <div class="nv-sheet-lang" role="group" aria-label="${_T.lang}"><button type="button" data-setlang="nl">NL</button><button type="button" data-setlang="fr">FR</button><button type="button" data-setlang="en">EN</button></div>
      <div class="nv-social">
        <a href="https://be.linkedin.com/in/ebert-vanbrabant-077b5326a" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21H17v-5.4c0-1.3 0-2.95-1.8-2.95s-2.08 1.4-2.08 2.85V21H9z"/></svg></a>
        <a href="https://www.instagram.com/em_launchpad/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg></a>
        <a href="https://www.youtube.com/@emlaunchpad" target="_blank" rel="noopener" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 00-1.7-1.7C19.3 5.2 12 5.2 12 5.2s-7.3 0-8.9.4A2.5 2.5 0 001.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 001.7 1.7c1.6.4 8.9.4 8.9.4s7.3 0 8.9-.4a2.5 2.5 0 001.7-1.7C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z"/></svg></a>
        <a href="https://wa.me/32476015451" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-2.9.9.9-2.8-.2-.3A8.2 8.2 0 1112 20.2z"/></svg></a>
      </div>
      <p class="nv-copy">© 2026 EM Launchpad · ${_T.made}</p>
    </div>
  </div>`;const FOOTER=`
  <footer class="foot">
    <div class="foot-hair"></div>
    <div class="wrap">
      <div class="foot-inner">
        <div class="foot-top">
          <div class="foot-id">
            <div class="foot-lock"><span class="em-chip"><img class="em-img" src="${B}assets/logo-em.png" alt="EM Launchpad" /></span><span class="word">Launchpad</span></div>
            <span class="foot-status"><span class="dot"></span>all_systems_online // 24/7</span>
            <p class="foot-tag">Belgisch AI-bureau uit Limburg. We bouwen websites, chatbots, voice agents en automatisaties die lokale bedrijven laten groeien.</p>
          </div>
          <div class="foot-news">
            <span class="lbl">// volg ons</span>
            <div class="foot-social">
              <a href="https://be.linkedin.com/in/ebert-vanbrabant-077b5326a" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21H17v-5.4c0-1.3 0-2.95-1.8-2.95s-2.08 1.4-2.08 2.85V21H9z"/></svg></a>
              <a href="https://www.instagram.com/em_launchpad/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg></a>
              <a href="https://www.facebook.com/profile.php?id=61564020189008" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0022 12z"/></svg></a>
              <a href="https://www.youtube.com/@emlaunchpad" target="_blank" rel="noopener" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 00-1.7-1.7C19.3 5.2 12 5.2 12 5.2s-7.3 0-8.9.4A2.5 2.5 0 001.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 001.7 1.7c1.6.4 8.9.4 8.9.4s7.3 0 8.9-.4a2.5 2.5 0 001.7-1.7C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z"/></svg></a>
              <a href="https://wa.me/32476015451" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-2.9.9.9-2.8-.2-.3A8.2 8.2 0 1112 20.2zm4.7-6.1c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.2-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 01-2-1.2 7.4 7.4 0 01-1.4-1.7c-.1-.3 0-.4.1-.6l.4-.5.3-.5v-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.9 11.9 0 004.6 4 5.2 5.2 0 003.2.7 2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg></a>
            </div>
          </div>
        </div>
        <div class="foot-grid">
          <div class="foot-cell">
            <h5 class="foot-h">// <b>diensten</b></h5>
            <div class="foot-links">
              <a href="${P}Diensten">ai chatbots</a><a href="${P}Diensten">ai voice agents</a>
              <a href="${P}Diensten">websites</a><a href="${P}Diensten">ai-automatisering</a><a href="${P}Afsprakensysteem">online afspraken</a>
              <a href="${P}Diensten">reputatiebeheer</a><a href="${P}Diensten">crm &amp; dashboard</a>
              <a href="${P}Diensten">email &amp; sms</a><a href="${P}Diensten">funnels &amp; landingspagina's</a>
            </div>
          </div>
          <div class="foot-cell one">
            <h5 class="foot-h">// <b>bedrijf</b></h5>
            <div class="foot-links">
              <a href="${P||'./'}">home</a><a href="${P}Diensten">diensten</a><a href="${P}Over%20ons">over_ons</a>
              <a href="${P}Portfolio">portfolio</a><a href="${B}emtimes/">em_times</a><a href="${B}lokaal/">regio's</a><a href="${P}Gratis%20Demo">gratis_demo</a><a href="${P}Contact">contact</a>
            </div>
          </div>
          <div class="foot-cell">
            <h5 class="foot-h">// <b>contact</b></h5>
            <div class="foot-contact">
              <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg><span>Brugstraat 2A, 3870 Vechmaal, België</span></div>
              <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.1-8.7A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8.1 9.5a16 16 0 006 6l1.1-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z"/></svg><a href="tel:+32476015451">+32&nbsp;476&nbsp;01&nbsp;54&nbsp;51</a></div>
              <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7L22 6"/></svg><a href="mailto:ebert@emlaunchpad.com">ebert@emlaunchpad.com</a></div>
            </div>
          </div>
        </div>
        <div class="foot-cities">
          <p class="lead2">// lokaal_actief →</p>
          <a href="${B}lokaal/ai-hasselt">Hasselt</a><span class="sep">/</span><a href="${B}lokaal/ai-genk">Genk</a><span class="sep">/</span><a href="${B}lokaal/ai-antwerpen">Antwerpen</a><span class="sep">/</span><a href="${B}lokaal/ai-mechelen">Mechelen</a><span class="sep">/</span><a href="${B}lokaal/ai-turnhout">Turnhout</a><span class="sep">/</span><a href="${B}lokaal/ai-sint-truiden">Sint-Truiden</a><span class="sep">/</span><a href="${B}lokaal/">Heel Limburg, Antwerpen &amp; België</a>
        </div>
        <div class="foot-bot">
          <span>© 2026 <b>EM_LAUNCHPAD</b> · BTW BE1024.977.818 · <a href="${P}privacy">privacy</a> · <a href="#" data-cookie-open>cookies</a></span>
          <span><span class="mint">▲</span> <b>GEMAAKT_IN_LIMBURG</b> · BELGIË</span>
        </div>
      </div>
    </div>
  </footer>`;const navMount=document.getElementById('nav-mount');if(navMount)navMount.outerHTML=NAV;const footMount=document.getElementById('footer-mount');if(footMount)footMount.outerHTML=FOOTER;(function(){const nv=document.getElementById('nv');if(!nv)return;
/* actieve pagina (dienst- en casepagina's horen bij hun hoofdmenu-item) */
const _pg=document.body.dataset.page;const cur=({agenda:'diensten',case:'portfolio'})[_pg]||_pg;
document.querySelectorAll('.nv [data-nav], .nv-sheet [data-nav]').forEach((a)=>{if(a.dataset.nav===cur)a.classList.add('active');});
const bar=nv.querySelector('.nv-bar'),links=nv.querySelector('.nv-links'),ind=nv.querySelector('.nv-ind'),trig=nv.querySelector('.nv-trig'),mega=document.getElementById('nvMega');
const act=links.querySelector('.nv-link.active');let over=null,megaOpen=false,langOpen=false;
/* glijdend pilletje achter het menu-item onder de muis */
const place=(el)=>{if(!el||!el.offsetWidth){ind.style.opacity='0';return;}ind.style.opacity='1';ind.style.width=el.offsetWidth+'px';ind.style.transform='translateX('+el.offsetLeft+'px)';};
const rest=()=>place(megaOpen?trig:(over||act));
links.querySelectorAll('.nv-link').forEach((l)=>{l.addEventListener('mouseenter',()=>{over=l;place(l);});l.addEventListener('focus',()=>{over=l;place(l);});l.addEventListener('blur',()=>{over=null;rest();});});
links.addEventListener('mouseleave',()=>{over=null;rest();});
const snap=()=>{ind.classList.add('no-anim');rest();requestAnimationFrame(()=>requestAnimationFrame(()=>ind.classList.remove('no-anim')));};
snap();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(snap);window.addEventListener('resize',snap);
/* taalkeuze */
const lang=nv.querySelector('.nv-lang'),lbtn=nv.querySelector('.nv-lang-btn');
const closeL=()=>{if(!langOpen)return;langOpen=false;lang.classList.remove('open');lbtn.setAttribute('aria-expanded','false');};
/* uitklapmenu Diensten: openen bij hover (muis) of klik (touch/toetsenbord) */
let tO=0,tC=0,openedAt=0;const hov=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
const openM=()=>{clearTimeout(tC);if(megaOpen)return;megaOpen=true;openedAt=Date.now();nv.classList.add('mega-open');trig.setAttribute('aria-expanded','true');closeL();rest();};
const closeM=()=>{clearTimeout(tO);if(!megaOpen)return;megaOpen=false;nv.classList.remove('mega-open');trig.setAttribute('aria-expanded','false');rest();};
if(hov){trig.addEventListener('mouseenter',()=>{clearTimeout(tC);tO=setTimeout(openM,70);});trig.addEventListener('mouseleave',()=>{clearTimeout(tO);tC=setTimeout(closeM,240);});mega.addEventListener('mouseenter',()=>clearTimeout(tC));mega.addEventListener('mouseleave',()=>{tC=setTimeout(closeM,240);});}
trig.addEventListener('click',()=>{if(megaOpen&&Date.now()-openedAt>450)closeM();else openM();});
lbtn.addEventListener('click',()=>{langOpen=!langOpen;lang.classList.toggle('open',langOpen);lbtn.setAttribute('aria-expanded',String(langOpen));if(langOpen)closeM();});
document.addEventListener('click',(e)=>{if(langOpen&&!lang.contains(e.target))closeL();if(megaOpen&&!bar.contains(e.target)&&!mega.contains(e.target))closeM();});
document.addEventListener('keydown',(e)=>{if(e.key!=='Escape')return;if(megaOpen){closeM();trig.focus();}if(langOpen){closeL();lbtn.focus();}});
nv.addEventListener('focusout',(e)=>{if(!nv.contains(e.relatedTarget)){closeM();closeL();}});
/* verbergen bij naar beneden scrollen, terug bij omhoog scrollen */
let lastY=window.scrollY||0,hid=false,tk=false;
const onS=()=>{tk=false;const y=window.scrollY||0,d=y-lastY;if(Math.abs(d)<8)return;lastY=y;if(megaOpen)closeM();if(langOpen)closeL();const h=d>0&&y>360&&!nv.contains(document.activeElement);if(h!==hid){hid=h;nv.classList.toggle('is-hidden',h);}};
window.addEventListener('scroll',()=>{if(!tk){tk=true;requestAnimationFrame(onS);}},{passive:true});
nv.addEventListener('focusin',()=>{if(hid){hid=false;nv.classList.remove('is-hidden');}});
/* gsm-menu */
const burger=document.getElementById('navBurger'),mob=document.getElementById('mobnav'),closeBtn=document.getElementById('mobnavClose');
if(!burger||!mob)return;let lockY=0;
const openS=()=>{lockY=window.scrollY||0;mob.classList.add('open');mob.setAttribute('aria-hidden','false');burger.setAttribute('aria-expanded','true');const bs=document.body.style;bs.position='fixed';bs.top=(-lockY)+'px';bs.left='0';bs.right='0';bs.overflow='hidden';setTimeout(()=>{if(closeBtn)closeBtn.focus();},60);};
const closeS=()=>{if(!mob.classList.contains('open'))return;mob.classList.remove('open');mob.setAttribute('aria-hidden','true');burger.setAttribute('aria-expanded','false');const bs=document.body.style;bs.position='';bs.top='';bs.left='';bs.right='';bs.overflow='';try{window.scrollTo({top:lockY,behavior:'instant'});}catch(err){window.scrollTo(0,lockY);}};
burger.addEventListener('click',openS);if(closeBtn)closeBtn.addEventListener('click',closeS);
mob.querySelectorAll('a').forEach((a)=>a.addEventListener('click',closeS));
document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeS();});
const acc=mob.querySelector('.nv-acc'),accBtn=mob.querySelector('.nv-acc-btn');
if(acc&&accBtn)accBtn.addEventListener('click',()=>{const o=!acc.classList.contains('open');acc.classList.toggle('open',o);accBtn.setAttribute('aria-expanded',String(o));});
})();(function(){var _lang=/\/fr\//.test(_pp)?'fr':/\/en\//.test(_pp)?'en':'nl';var _file=_pp.split('/').pop()||'index.html';var _inLok=/\/lokaal\//.test(_pp);function _c(u){return u.replace(/(^|\/)index\.html$/,'$1').replace(/\.html$/,'');}function _t(t){if(t===_lang)return null;if(_inLok)return t==='nl'?null:'/'+t+'/';var _fb=document.body.dataset.langFallback;if(_fb&&t!=='nl')return _c('/'+t+'/'+_fb);return _c((t==='nl'?'/':'/'+t+'/')+_file);}if(window.EMi18n)window.EMi18n.apply(_lang);document.querySelectorAll('.nv-lang-menu [data-setlang], .nv-sheet-lang [data-setlang]').forEach(function(b){b.classList.toggle('active',b.dataset.setlang===_lang);b.addEventListener('click',function(e){e.preventDefault();var u=_t(b.dataset.setlang);if(u)location.href=u;});});})();(function(){const loader=document.getElementById('loader');if(!loader)return;let seen=false;try{seen=sessionStorage.getItem('em_loaded')==='1';}catch(e){}
if(seen){loader.remove();return;}
try{sessionStorage.setItem('em_loaded','1');}catch(e){}
const msg=document.getElementById('loaderMsg');const _lgL=/\/fr\//.test(location.pathname)?'fr':/\/en\//.test(location.pathname)?'en':'nl';const _dl=(window.EM_DICT&&window.EM_DICT[_lgL])||{};const steps=['systemen initialiseren','agenda koppelen','ai laden','klaar'].map((x)=>_dl[x]||x);let s=0;const tick=setInterval(()=>{s=Math.min(s+1,steps.length-1);if(msg)msg.textContent=steps[s];},420);const finish=()=>{clearInterval(tick);if(msg)msg.textContent=steps[steps.length-1];setTimeout(()=>{loader.classList.add('done');setTimeout(()=>loader.remove(),650);},520);};if(document.readyState==='complete')setTimeout(finish,1400);else window.addEventListener('load',()=>setTimeout(finish,800));})();(function(){const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const isInternal=(a)=>{if(!a)return false;if(a.target==='_blank'||a.hasAttribute('download'))return false;const href=a.getAttribute('href')||'';if(!href||href[0]==='#')return false;if(/^(mailto:|tel:|https?:|\/\/)/i.test(href))return false;var p=href.split(/[?#]/)[0],last=p.split('/').pop();return /\.html$/i.test(p)||p.endsWith('/')||(p!==''&&!/\.[a-z0-9]{2,5}$/i.test(last));};document.addEventListener('click',(e)=>{if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const a=e.target.closest&&e.target.closest('a[href]');if(!isInternal(a))return;if(a.hasAttribute('data-book'))return;const href=a.getAttribute('href');if(href.split('#')[0]===location.pathname.split('/').pop())return;e.preventDefault();if(reduce){window.location.href=href;return;}
const bar=document.createElement('div');bar.className='pt-bar';document.body.appendChild(bar);void bar.offsetWidth;bar.classList.add('go');requestAnimationFrame(()=>document.body.classList.add('pt-leaving'));setTimeout(()=>{bar.classList.add('done');},240);setTimeout(()=>{window.location.href=href;},300);});window.addEventListener('pageshow',()=>{document.body.classList.remove('pt-leaving');const b=document.querySelector('.pt-bar');if(b)b.remove();});})();document.querySelectorAll('.faq-item').forEach((item)=>{const q=item.querySelector('.faq-q');const a=item.querySelector('.faq-a');if(!q||!a)return;q.addEventListener('click',()=>{const open=item.classList.contains('open');document.querySelectorAll('.faq-item.open').forEach((o)=>{o.classList.remove('open');o.querySelector('.faq-a').style.maxHeight=null;});if(!open){item.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';}});});const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;(function(){const bar=document.createElement('div');bar.className='scroll-prog';document.body.appendChild(bar);let ticking=false;const update=()=>{const h=document.documentElement;const max=h.scrollHeight-h.clientHeight;const p=max>0?(h.scrollTop||window.scrollY)/max:0;bar.style.width=(p*100)+'%';ticking=false;};window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});update();})();(function(){const onScroll=()=>{document.body.classList.toggle('is-scrolled',(window.scrollY||0)>24);};window.addEventListener('scroll',onScroll,{passive:true});onScroll();})();if(!reduceMotion){document.documentElement.classList.add('reveal-ready');document.querySelectorAll('[data-reveal-group]').forEach((grp)=>{[...grp.querySelectorAll(':scope > [data-reveal]')].forEach((el,i)=>{el.style.transitionDelay=(i*75)+'ms';});});const all=[...document.querySelectorAll('[data-reveal]')];let ticking=false;const apply=()=>{ticking=false;const vh=window.innerHeight||document.documentElement.clientHeight;for(const el of all){const r=el.getBoundingClientRect();const inView=r.top<vh*0.88&&r.bottom>vh*0.10;el.classList.toggle('in',inView);}};const onScroll=()=>{if(!ticking){ticking=true;requestAnimationFrame(apply);}};window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);window.addEventListener('load',apply);apply();setTimeout(apply,300);}
if(!reduceMotion){const items=[...document.querySelectorAll('[data-parallax]')].map((el)=>({el,speed:parseFloat(el.dataset.parallax)||0.12,scale:el.dataset.parallaxScale?parseFloat(el.dataset.parallaxScale):0,}));if(items.length){let ticking=false;const update=()=>{const y=window.scrollY||0;items.forEach((it)=>{const sc=it.scale?' scale('+(1-Math.min(y*it.scale,0.12))+')':'';it.el.style.transform='translate3d(0,'+(y*it.speed).toFixed(1)+'px,0)'+sc;});ticking=false;};window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});update();}}
(function(){let overlay=null,lastFocus=null;function build(){overlay=document.createElement('div');overlay.className='ghl-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Plan een gesprek');overlay.innerHTML='<div class="ghl-modal">'+'<div class="ghl-head">'+'<span class="em-chip"><img class="em-img" src="'+B+'assets/logo-em.png" alt="EM Launchpad" /></span>'+'<span class="ttl"><b>Plan een gratis gesprek</b><span><span class="dot"></span>30 min · vrijblijvend</span></span>'+'<button class="ghl-close" type="button" aria-label="Sluiten"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>'+'</div>'+'<div class="ghl-body"><div class="ghl-loading"><span class="spin"></span></div></div>'+'</div>';document.body.appendChild(overlay);overlay.addEventListener('click',(e)=>{if(e.target===overlay)closePopup();});overlay.querySelector('.ghl-close').addEventListener('click',closePopup);}
window.openPopup=function(){if(!GHL_BOOKING_URL){window.location.href=BOOKING_FALLBACK;return;}
if(!overlay)build();const body=overlay.querySelector('.ghl-body');if(!body.querySelector('iframe')){const f=document.createElement('iframe');f.src=GHL_BOOKING_URL;f.title='Plan een gesprek';f.loading='lazy';f.setAttribute('scrolling','yes');f.allow='payment';f.addEventListener('load',()=>{const l=body.querySelector('.ghl-loading');if(l)l.style.display='none';});body.appendChild(f);}
lastFocus=document.activeElement;overlay.classList.add('open');document.body.style.overflow='hidden';setTimeout(()=>overlay.querySelector('.ghl-close').focus(),60);};window.closePopup=function(){if(!overlay)return;overlay.classList.remove('open');document.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus();};document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&overlay&&overlay.classList.contains('open'))closePopup();});document.addEventListener('click',(e)=>{const t=e.target.closest&&e.target.closest('[data-book]');if(!t)return;e.preventDefault();e.stopPropagation();window.openPopup();},true);})();/* cookiemelding: glazen kaartje linksonder; via "cookies" in de footer kun je je keuze later wijzigen */
(function(){var KEY='em_cookie';var _cl=/\/fr\//.test(_pp)?'fr':/\/en\//.test(_pp)?'en':'nl';
var C={nl:{h:'Een koekje?',t:'We gebruiken cookies om de site te laten werken en te verbeteren.',l:'Lees ons privacybeleid',a:'Accepteren',d:'Weigeren'},fr:{h:'Un cookie\u00a0?',t:'Nous utilisons des cookies pour faire fonctionner et améliorer le site.',l:'Politique de confidentialité',a:'Accepter',d:'Refuser'},en:{h:'Fancy a cookie?',t:'We use cookies to run and improve the site.',l:'Read our privacy policy',a:'Accept',d:'Decline'}}[_cl];
var rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;var el=null;
var ICON='<svg viewBox="0 0 32 32" aria-hidden="true"><defs><mask id="ckMask"><rect width="32" height="32" fill="#fff"/><circle class="ck-bite" cx="28" cy="7" r="7.5" fill="#000"/></mask></defs><g mask="url(#ckMask)"><circle cx="16" cy="16" r="13" fill="#c99656"/><circle cx="16" cy="16" r="13" fill="none" stroke="#a87638" stroke-width="1.4"/><circle cx="10.5" cy="12" r="1.9" fill="#4b2e19"/><circle cx="18.5" cy="10.5" r="1.5" fill="#4b2e19"/><circle cx="20.5" cy="19.5" r="2.1" fill="#4b2e19"/><circle cx="11.5" cy="21" r="1.6" fill="#4b2e19"/><circle cx="15.8" cy="16" r="1.2" fill="#4b2e19"/></g></svg>';
function stored(){try{return localStorage.getItem(KEY)}catch(e){return 'x'}}
function build(){el=document.createElement('div');el.className='ck';el.setAttribute('role','dialog');el.setAttribute('aria-modal','false');el.setAttribute('aria-labelledby','ckTitle');el.setAttribute('data-no-i18n','');
el.innerHTML='<div class="ck-top"><span class="ck-ic">'+ICON+'</span><b id="ckTitle">'+C.h+'</b></div><p>'+C.t+' <a href="'+P+'privacy">'+C.l+'</a></p><div class="ck-btns"><button type="button" class="ck-btn ck-no">'+C.d+'</button><button type="button" class="ck-btn ck-yes">'+C.a+'</button></div>';
document.body.appendChild(el);el.querySelector('.ck-yes').addEventListener('click',function(){done('all',true)});el.querySelector('.ck-no').addEventListener('click',function(){done('essential',false)})}
function show(){if(!el)build();el.classList.remove('is-bite');requestAnimationFrame(function(){requestAnimationFrame(function(){if(el)el.classList.add('show')})})}
function hide(){var e=el;if(!e)return;e.classList.remove('show');setTimeout(function(){if(!e.classList.contains('show')){e.remove();if(el===e)el=null}},420)}
function done(v,bite){try{localStorage.setItem(KEY,v)}catch(e){}if(bite&&!rm){el.classList.add('is-bite');setTimeout(hide,700)}else hide()}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-cookie-open]');if(b){e.preventDefault();show()}});
if(!stored())setTimeout(show,document.getElementById('loader')?2600:1400)})();})();