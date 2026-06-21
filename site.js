/* EMLaunchpad — shared site chrome (nav + footer) + loader/faq logic.
   Pages include: <body data-page="...">, an inline .loader at top,
   <div id="nav-mount"></div> after it, <div id="footer-mount"></div> before scripts,
   then <script src="site.js"></script>. Keeps every page's chrome identical. */
(function () {
  const NAV = `
  <div class="nav">
    <div class="wrap">
      <nav class="nav-bar">
        <span class="em-chip nav-em"><img class="em-img" src="assets/logo-em.png" alt="EM Launchpad" /></span>
        <span class="nav-word">Launchpad</span>
        <span class="nav-div"></span>
        <div class="nav-links">
          <a href="EMLaunchpad Home.html" data-nav="home">home</a>
          <a href="Diensten.html" data-nav="diensten">diensten</a>
          <a href="#" data-nav="blog">blog</a>
          <a href="Over ons.html" data-nav="over_ons">over_ons</a>
          <a href="Contact.html" data-nav="contact">contact</a>
        </div>
        <span class="nav-spacer"></span>
        <div class="lang-pick" data-no-i18n="" role="group" aria-label="Taal / Language">
          <button data-setlang="nl">NL</button><button data-setlang="fr">FR</button><button data-setlang="en">EN</button>
        </div>
        <a href="#" class="nav-demo">live_demo <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></a>
        <a href="Contact.html" class="btn-grad-border">plan_een_gesprek <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a>
      </nav>
    </div>
  </div>`;

  const FOOTER = `
  <footer class="foot">
    <div class="foot-hair"></div>
    <div class="wrap">
      <div class="foot-inner">
        <div class="foot-top">
          <div class="foot-id">
            <div class="foot-lock"><span class="em-chip"><img class="em-img" src="assets/logo-em.png" alt="EM Launchpad" /></span><span class="word">Launchpad</span></div>
            <span class="foot-status"><span class="dot"></span>all_systems_online // 24/7</span>
            <p class="foot-tag">Belgisch AI-bureau uit Limburg. We bouwen websites, chatbots, voice agents en automatisaties die lokale bedrijven laten groeien.</p>
          </div>
          <div class="foot-news">
            <span class="lbl">// nieuwsbrief</span>
            <form class="foot-field" onsubmit="return false;">
              <input type="email" placeholder="jouw@email.be" aria-label="E-mailadres" />
              <button type="submit">subscribe <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button>
            </form>
            <div class="foot-social">
              <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21H17v-5.4c0-1.3 0-2.95-1.8-2.95s-2.08 1.4-2.08 2.85V21H9z"/></svg></a>
              <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg></a>
              <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0022 12z"/></svg></a>
              <a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8a4.8 4.8 0 01-1-.1V9a7.9 7.9 0 01-4.6-1.5v6.9a5.4 5.4 0 11-5.4-5.4c.2 0 .4 0 .6.05v2.6a2.9 2.9 0 00-.6-.07 2.8 2.8 0 102.8 2.8V2h2.6a4.8 4.8 0 004.8 4.3z"/></svg></a>
              <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 00-1.7-1.7C19.3 5.2 12 5.2 12 5.2s-7.3 0-8.9.4A2.5 2.5 0 001.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 001.7 1.7c1.6.4 8.9.4 8.9.4s7.3 0 8.9-.4a2.5 2.5 0 001.7-1.7C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z"/></svg></a>
              <a href="#" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-2.9.9.9-2.8-.2-.3A8.2 8.2 0 1112 20.2zm4.7-6.1c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.2-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 01-2-1.2 7.4 7.4 0 01-1.4-1.7c-.1-.3 0-.4.1-.6l.4-.5.3-.5v-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.9 11.9 0 004.6 4 5.2 5.2 0 003.2.7 2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg></a>
            </div>
          </div>
        </div>
        <div class="foot-grid">
          <div class="foot-cell">
            <h5 class="foot-h">// <b>diensten</b></h5>
            <div class="foot-links">
              <a href="Diensten.html">ai chatbots</a><a href="Diensten.html">ai voice agents</a>
              <a href="Diensten.html">websites</a><a href="Diensten.html">ai-automatisering</a>
              <a href="Diensten.html">reputatiebeheer</a><a href="Diensten.html">crm &amp; dashboard</a>
              <a href="Diensten.html">email &amp; sms</a><a href="Diensten.html">funnels &amp; landingspagina's</a>
            </div>
          </div>
          <div class="foot-cell one">
            <h5 class="foot-h">// <b>bedrijf</b></h5>
            <div class="foot-links">
              <a href="EMLaunchpad Home.html">home</a><a href="Diensten.html">diensten</a><a href="Over ons.html">over_ons</a>
              <a href="#">live_demo</a><a href="#">blog</a><a href="Contact.html">contact</a>
            </div>
          </div>
          <div class="foot-cell">
            <h5 class="foot-h">// <b>contact</b></h5>
            <div class="foot-contact">
              <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg><span>Brugstraat 2A, 3870 Vechmaal, België</span></div>
              <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.1-8.7A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8.1 9.5a16 16 0 006 6l1.1-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z"/></svg><a href="tel:+32476015451">+32&nbsp;476&nbsp;01&nbsp;54&nbsp;51</a></div>
              <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7L22 6"/></svg><a href="mailto:hallo@emlaunchpad.com">hallo@emlaunchpad.com</a></div>
            </div>
          </div>
        </div>
        <div class="foot-cities">
          <p class="lead2">// lokaal_actief →</p>
          <a href="#">Hasselt</a><span class="sep">/</span><a href="#">Tongeren</a><span class="sep">/</span><a href="#">Sint-Truiden</a><span class="sep">/</span><a href="#">Genk</a><span class="sep">/</span><a href="#">Bilzen</a><span class="sep">/</span><a href="#">Maaseik</a><span class="sep">/</span><a href="#">Heel Limburg &amp; België</a>
        </div>
        <div class="foot-bot">
          <span>© 2026 <b>EM_LAUNCHPAD</b> · BTW BE1024.977.818</span>
          <span><span class="mint">▲</span> <b>GEMAAKT_IN_LIMBURG</b> · BELGIË</span>
        </div>
      </div>
    </div>
  </footer>`;

  // Inject chrome into mount points
  const navMount = document.getElementById('nav-mount');
  if (navMount) navMount.outerHTML = NAV;
  const footMount = document.getElementById('footer-mount');
  if (footMount) footMount.outerHTML = FOOTER;

  // Active nav link from <body data-page="...">
  const page = document.body.dataset.page;
  document.querySelectorAll('.nav-links a[data-nav]').forEach((a) => {
    if (a.dataset.nav === page) a.classList.add('active');
  });

  // Apply site-wide language (switcher lives in the nav)
  if (window.EMi18n) window.EMi18n.init();

  // Loader — fade out once page/fonts are ready
  (function () {
    const loader = document.getElementById('loader');
    if (!loader) return;
    const msg = document.getElementById('loaderMsg');
    const steps = ['systemen initialiseren', 'agenda koppelen', 'ai laden', 'klaar'];
    let s = 0;
    const tick = setInterval(() => { s = Math.min(s + 1, steps.length - 1); if (msg) msg.textContent = steps[s]; }, 420);
    const finish = () => {
      clearInterval(tick); if (msg) msg.textContent = 'klaar';
      setTimeout(() => { loader.classList.add('done'); setTimeout(() => loader.remove(), 650); }, 520);
    };
    if (document.readyState === 'complete') setTimeout(finish, 1400);
    else window.addEventListener('load', () => setTimeout(finish, 800));
  })();

  // FAQ accordion (any page with .faq-item)
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((o) => { o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = null; });
      if (!open) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll progress bar (top of page)
  (function () {
    const bar = document.createElement('div');
    bar.className = 'scroll-prog';
    document.body.appendChild(bar);
    let ticking = false;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? (h.scrollTop || window.scrollY) / max : 0;
      bar.style.width = (p * 100) + '%';
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  })();

  // Nav condense on scroll
  (function () {
    const onScroll = () => { document.body.classList.toggle('is-scrolled', (window.scrollY || 0) > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  // Reveal-on-scroll (staggered) — opt-in via [data-reveal]
  if (!reduceMotion) {
    document.documentElement.classList.add('reveal-ready');
    // stagger children inside [data-reveal-group]
    document.querySelectorAll('[data-reveal-group]').forEach((grp) => {
      [...grp.querySelectorAll(':scope > [data-reveal]')].forEach((el, i) => {
        el.style.transitionDelay = (i * 75) + 'ms';
      });
    });
    const all = [...document.querySelectorAll('[data-reveal]')];
    const reveal = (el) => el.classList.add('in');
    // 1) reveal anything already in (or above) the viewport immediately
    const initPass = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      all.forEach((el) => { if (el.classList.contains('in')) return; if (el.getBoundingClientRect().top < vh * 0.96) reveal(el); });
    };
    // 2) observe the rest for staggered reveal on scroll
    let obs = null;
    if ('IntersectionObserver' in window) {
      obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { reveal(e.target); obs.unobserve(e.target); } });
      }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });
      all.forEach((el) => obs.observe(el));
    }
    initPass();
    // 3) safety fallbacks — content must never stay hidden
    const revealAll = () => all.forEach(reveal);
    window.addEventListener('load', () => { initPass(); setTimeout(revealAll, 1600); });
    setTimeout(initPass, 200);
    setTimeout(revealAll, 2600);
    // also catch in-view items as the user scrolls, even if the observer is flaky
    window.addEventListener('scroll', initPass, { passive: true });
  }

  // Lightweight parallax — opt-in via [data-parallax="<speed>"]
  if (!reduceMotion) {
    const items = [...document.querySelectorAll('[data-parallax]')].map((el) => ({
      el, speed: parseFloat(el.dataset.parallax) || 0.12,
      scale: el.dataset.parallaxScale ? parseFloat(el.dataset.parallaxScale) : 0,
    }));
    if (items.length) {
      let ticking = false;
      const update = () => {
        const y = window.scrollY || 0;
        items.forEach((it) => {
          const sc = it.scale ? ' scale(' + (1 - Math.min(y * it.scale, 0.12)) + ')' : '';
          it.el.style.transform = 'translate3d(0,' + (y * it.speed).toFixed(1) + 'px,0)' + sc;
        });
        ticking = false;
      };
      window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      update();
    }
  }
})();
