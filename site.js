/* EMLaunchpad — shared site chrome (nav + footer) + loader/faq logic.
   Pages include: <body data-page="...">, an inline .loader at top,
   <div id="nav-mount"></div> after it, <div id="footer-mount"></div> before scripts,
   then <script src="site.js"></script>. Keeps every page's chrome identical. */
(function () {
  /* ───────────────────────────────────────────────────────────────────────
     GoHighLevel booking popup.
     Paste your GHL calendar / booking widget URL below. While it is empty the
     "Plan een gesprek" buttons fall back to the contact page (same behaviour
     as the original site). Example:
       const GHL_BOOKING_URL = 'https://api.leadconnectorhq.com/widget/booking/XXXXXXXX';
     ─────────────────────────────────────────────────────────────────────── */
  const GHL_BOOKING_URL = 'https://api.leadconnectorhq.com/widget/booking/OoJsvpiXXpwS5oGbQGIE';
  const BOOKING_FALLBACK = 'Contact.html';

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
        <a href="Gratis Demo.html" class="nav-demo">gratis_demo <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></a>
        <a href="Contact.html" data-book class="btn-grad-border">plan_een_gesprek <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a>
        <button class="nav-burger" id="navBurger" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
      </nav>
    </div>
  </div>
  <div class="mobnav" id="mobnav" aria-hidden="true">
    <div class="mobnav-glow"></div>
    <div class="mobnav-top">
      <span class="mobnav-brand"><span class="em-chip"><img class="em-img" src="assets/logo-em.png" alt="EM Launchpad" /></span>Launchpad</span>
      <button class="mobnav-close" id="mobnavClose" type="button" aria-label="Sluiten"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
    </div>
    <nav class="mobnav-links">
      <a href="EMLaunchpad Home.html" data-nav="home"><span>home</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></a>
      <a href="Diensten.html" data-nav="diensten"><span>diensten</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></a>
      <a href="Over ons.html" data-nav="over_ons"><span>over_ons</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></a>
      <a href="Gratis Demo.html" data-nav="gratis_demo"><span>gratis_demo</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></a>
      <a href="Contact.html" data-nav="contact"><span>contact</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></a>
    </nav>
    <div class="mobnav-foot">
      <div class="mobnav-cta">
        <a href="Gratis Demo.html" class="mobnav-ghost">gratis_demo</a>
        <a href="Contact.html" data-book class="mobnav-book">plan_een_gesprek</a>
      </div>
      <div class="mobnav-lang" data-no-i18n="" role="group" aria-label="Taal / Language">
        <button data-setlang="nl">NL</button><button data-setlang="fr">FR</button><button data-setlang="en">EN</button>
      </div>
      <div class="mobnav-social">
        <a href="https://be.linkedin.com/in/ebert-vanbrabant-077b5326a" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21H17v-5.4c0-1.3 0-2.95-1.8-2.95s-2.08 1.4-2.08 2.85V21H9z"/></svg></a>
        <a href="https://www.instagram.com/em_launchpad/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg></a>
        <a href="https://www.youtube.com/@emlaunchpad" target="_blank" rel="noopener" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 00-1.7-1.7C19.3 5.2 12 5.2 12 5.2s-7.3 0-8.9.4A2.5 2.5 0 001.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 001.7 1.7c1.6.4 8.9.4 8.9.4s7.3 0 8.9-.4a2.5 2.5 0 001.7-1.7C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z"/></svg></a>
        <a href="https://wa.me/32476015451" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-2.9.9.9-2.8-.2-.3A8.2 8.2 0 1112 20.2z"/></svg></a>
      </div>
      <p class="mobnav-copy">© 2026 EM_LAUNCHPAD · GEMAAKT_IN_LIMBURG</p>
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
              <div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7L22 6"/></svg><a href="mailto:ebert@emlaunchpad.com">ebert@emlaunchpad.com</a></div>
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
  document.querySelectorAll('.nav-links a[data-nav], .mobnav-links a[data-nav]').forEach((a) => {
    if (a.dataset.nav === page) a.classList.add('active');
  });

  // Mobile menu (fullscreen overlay)
  (function () {
    const burger = document.getElementById('navBurger');
    const mob = document.getElementById('mobnav');
    if (!burger || !mob) return;
    const closeBtn = document.getElementById('mobnavClose');
    let lockY = 0;
    const open = () => {
      lockY = window.scrollY || 0;
      mob.classList.add('open'); mob.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true');
      // robust scroll lock (also works on iOS where overflow:hidden is ignored)
      document.body.style.position = 'fixed';
      document.body.style.top = (-lockY) + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      mob.classList.remove('open'); mob.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, lockY);
    };
    burger.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    // close when a menu link is tapped (booking link still triggers popup via [data-book])
    mob.querySelectorAll('.mobnav-links a, .mobnav-cta a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && mob.classList.contains('open')) close(); });
  })();

  // Apply site-wide language (switcher lives in the nav)
  if (window.EMi18n) window.EMi18n.init();

  // Loader — plays only on the FIRST entry to the site (per browser session).
  // On any later page within the same session it's removed instantly.
  (function () {
    const loader = document.getElementById('loader');
    if (!loader) return;
    let seen = false;
    try { seen = sessionStorage.getItem('em_loaded') === '1'; } catch (e) {}
    if (seen) { loader.remove(); return; }
    try { sessionStorage.setItem('em_loaded', '1'); } catch (e) {}
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

  // Page transitions — smooth cross-fade + gradient sweep when navigating
  // to another internal page (instead of an instant jump).
  (function () {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isInternal = (a) => {
      if (!a) return false;
      if (a.target === '_blank' || a.hasAttribute('download')) return false;
      const href = a.getAttribute('href') || '';
      if (!href || href[0] === '#') return false;
      if (/^(mailto:|tel:|https?:|\/\/)/i.test(href)) return false;
      return /\.html(\?|#|$)/i.test(href) || href.endsWith('/');
    };
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!isInternal(a)) return;
      if (a.hasAttribute('data-book')) return; // booking CTAs open the popup instead
      const href = a.getAttribute('href');
      // same page? let the browser handle the in-page anchor
      if (href.split('#')[0] === location.pathname.split('/').pop()) return;
      e.preventDefault();
      if (reduce) { window.location.href = href; return; }
      const bar = document.createElement('div');
      bar.className = 'pt-bar';
      document.body.appendChild(bar);
      void bar.offsetWidth; bar.classList.add('go');
      // let the bar race ahead briefly, then lift the page out and hand off
      requestAnimationFrame(() => document.body.classList.add('pt-leaving'));
      setTimeout(() => { bar.classList.add('done'); }, 240);
      setTimeout(() => { window.location.href = href; }, 300);
    });
    // restore on back/forward (bfcache) so the page isn't left faded out
    window.addEventListener('pageshow', () => {
      document.body.classList.remove('pt-leaving');
      const b = document.querySelector('.pt-bar'); if (b) b.remove();
    });
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

  // Reveal-on-scroll (staggered, REPEATABLE) — opt-in via [data-reveal].
  // Scroll-driven (not IntersectionObserver) so it fires reliably every time:
  // elements fade in when they enter the viewport and reset when they leave,
  // replaying on every scroll up or down — even minutes later.
  if (!reduceMotion) {
    document.documentElement.classList.add('reveal-ready');
    document.querySelectorAll('[data-reveal-group]').forEach((grp) => {
      [...grp.querySelectorAll(':scope > [data-reveal]')].forEach((el, i) => {
        el.style.transitionDelay = (i * 75) + 'ms';
      });
    });
    const all = [...document.querySelectorAll('[data-reveal]')];
    let ticking = false;
    const apply = () => {
      ticking = false;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      for (const el of all) {
        const r = el.getBoundingClientRect();
        // visible once its top crosses ~88% of the viewport, hidden once fully past
        const inView = r.top < vh * 0.88 && r.bottom > vh * 0.10;
        el.classList.toggle('in', inView);
      }
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', apply);
    apply();
    setTimeout(apply, 300);
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

  // ── GoHighLevel booking popup ────────────────────────────────────────────
  (function () {
    let overlay = null, lastFocus = null;

    function build() {
      overlay = document.createElement('div');
      overlay.className = 'ghl-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Plan een gesprek');
      overlay.innerHTML =
        '<div class="ghl-modal">' +
          '<div class="ghl-head">' +
            '<span class="em-chip"><img class="em-img" src="assets/logo-em.png" alt="EM Launchpad" /></span>' +
            '<span class="ttl"><b>Plan een gratis gesprek</b><span><span class="dot"></span>30 min · vrijblijvend</span></span>' +
            '<button class="ghl-close" type="button" aria-label="Sluiten"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
          '</div>' +
          '<div class="ghl-body"><div class="ghl-loading"><span class="spin"></span></div></div>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });
      overlay.querySelector('.ghl-close').addEventListener('click', closePopup);
    }

    window.openPopup = function () {
      if (!GHL_BOOKING_URL) { window.location.href = BOOKING_FALLBACK; return; }
      if (!overlay) build();
      const body = overlay.querySelector('.ghl-body');
      if (!body.querySelector('iframe')) {
        const f = document.createElement('iframe');
        f.src = GHL_BOOKING_URL;
        f.title = 'Plan een gesprek';
        f.loading = 'lazy';
        f.setAttribute('scrolling', 'yes');
        f.allow = 'payment';
        f.addEventListener('load', () => { const l = body.querySelector('.ghl-loading'); if (l) l.style.display = 'none'; });
        body.appendChild(f);
      }
      lastFocus = document.activeElement;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => overlay.querySelector('.ghl-close').focus(), 60);
    };

    window.closePopup = function () {
      if (!overlay) return;
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) closePopup();
    });

    // Any [data-book] link/button opens the popup (capture phase so it wins
    // over the page-transition handler).
    document.addEventListener('click', (e) => {
      const t = e.target.closest && e.target.closest('[data-book]');
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      window.openPopup();
    }, true);
  })();
})();
