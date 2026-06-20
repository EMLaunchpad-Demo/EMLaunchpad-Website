// EMLaunchpad — three FOOTER directions (light, premium/high-tech).
// Content lifted verbatim from the live site (NL, Belgisch AI-bureau uit Limburg).

const DIENSTEN = [
  ['AI Chatbots', '/conversation-ai'],
  ['AI Voice Agents', '/ai-voice-assistent'],
  ['Websites', '/website'],
  ['AI-Automatisering', '/automatisaties'],
  ['Reputatiebeheer', '/diensten'],
  ['CRM & Dashboard', '/diensten'],
  ['Email & SMS', '/diensten'],
  ["Funnels & landingspagina's", '/diensten'],
];
const BEDRIJF = [
  ['Home', '/'], ['Diensten', '/diensten'], ['Over ons', '/over-ons'],
  ['Live demo', '/demo'], ['Blog', '/blogs-2057'], ['Contact', '/contact-us'],
];
const CITIES = [
  ['Hasselt', '/ai-automatisering-hasselt'], ['Tongeren', '/ai-automatisering-tongeren'],
  ['Sint-Truiden', '/ai-automatisering-sint-truiden'], ['Genk', '/diensten'],
  ['Bilzen', '/diensten'], ['Maaseik', '/diensten'], ['Heel Limburg & België', '/diensten'],
];
const TAGLINE = 'Belgisch AI-bureau uit Limburg. We bouwen websites, chatbots, voice agents en automatisaties die lokale bedrijven laten groeien.';

// ── icons ───────────────────────────────────────────────────────────────
const Arrow = () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>);
const IPin = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>);
const IPhone = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.1-8.7A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8.1 9.5a16 16 0 006 6l1.1-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z"/></svg>);
const IMail = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7L22 6"/></svg>);
// brand glyphs (simple single-shape)
const ILinkedin = () => (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21H17v-5.4c0-1.3 0-2.95-1.8-2.95s-2.08 1.4-2.08 2.85V21H9z"/></svg>);
const IInsta = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>);
const IFacebook = () => (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0022 12z"/></svg>);
const ITiktok = () => (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8a4.8 4.8 0 01-1-.1V9a7.9 7.9 0 01-4.6-1.5v6.9a5.4 5.4 0 11-5.4-5.4c.2 0 .4 0 .6.05v2.6a2.9 2.9 0 00-.6-.07 2.8 2.8 0 102.8 2.8V2h2.6a4.8 4.8 0 004.8 4.3z"/></svg>);
const IYoutube = () => (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 00-1.7-1.7C19.3 5.2 12 5.2 12 5.2s-7.3 0-8.9.4A2.5 2.5 0 001.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 001.7 1.7c1.6.4 8.9.4 8.9.4s7.3 0 8.9-.4a2.5 2.5 0 001.7-1.7C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z"/></svg>);
const IWhatsapp = () => (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-2.9.9.9-2.8-.2-.3A8.2 8.2 0 1112 20.2zm4.7-6.1c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.2-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 01-2-1.2 7.4 7.4 0 01-1.4-1.7c-.1-.3 0-.4.1-.6l.4-.5.3-.5v-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.9 11.9 0 004.6 4 5.2 5.2 0 003.2.7 2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg>);

const SOCIALS = [
  ['LinkedIn', 'https://linkedin.com/company/emlaunchpad', ILinkedin],
  ['Instagram', 'https://instagram.com/emlaunchpad', IInsta],
  ['Facebook', 'https://facebook.com/emlaunchpad', IFacebook],
  ['TikTok', 'https://tiktok.com/@emlaunchpad', ITiktok],
  ['YouTube', 'https://youtube.com/@emlaunchpad', IYoutube],
  ['WhatsApp', 'https://wa.me/32476015451', IWhatsapp],
];

function Wordmark({ grad }) {
  return (
    <span className={'wm' + (grad ? ' wm-grad' : '')} aria-label="EMLaunchpad">
      <span className="wm-side">lau</span><span className="wm-em">EM</span><span className="wm-side">pad</span>
    </span>
  );
}
function Social({ className }) {
  return (
    <div className={className || 'social'}>
      {SOCIALS.map(([name, href, Ic]) => (
        <a key={name} href={href} aria-label={name} onClick={(e)=>e.preventDefault()}><Ic/></a>
      ))}
    </div>
  );
}
function LinkCol({ title, items, lower }) {
  return (
    <div>
      <h5 className="col-h">{title}</h5>
      <div className="lnks">
        {items.map(([t, h]) => <a key={t} href={h} onClick={(e)=>e.preventDefault()}>{lower ? t.toLowerCase() : t}</a>)}
      </div>
    </div>
  );
}
function Newsletter({ ph = 'jouw@email.be' }) {
  return (
    <form className="news" onSubmit={(e)=>e.preventDefault()}>
      <input type="email" placeholder={ph} aria-label="E-mailadres" />
      <button type="submit" aria-label="Inschrijven"><Arrow/></button>
    </form>
  );
}
function Ctx({ label }) { return <div className="ctx"><span>{label}</span></div>; }

/* ════════════════════ A · EDITORIAL LIGHT ════════════════════ */
function FooterA() {
  return (
    <div className="ftr">
      <Ctx label="· · ·  einde pagina  · · ·" />
      <footer className="a-foot">
        <div className="a-top">
          <div className="a-brand">
            <Wordmark />
            <p className="tagline">{TAGLINE}</p>
            <Social />
          </div>
          <div className="a-news-wrap">
            <span className="eyebrow"><span className="dot"></span>Nieuwsbrief</span>
            <h4>Slimmer ondernemen, elke maand in je inbox.</h4>
            <Newsletter />
          </div>
        </div>

        <div className="a-cols">
          <LinkCol title="Diensten" items={DIENSTEN} />
          <LinkCol title="Bedrijf" items={BEDRIJF} />
          <div>
            <h5 className="col-h">Contact</h5>
            <div className="contact">
              <div className="c-row"><IPin/><span>Brugstraat 2A<br/>3870 Vechmaal, België</span></div>
              <div className="c-row"><IPhone/><a href="tel:+32476015451">+32 476 01 54 51</a></div>
              <div className="c-row"><IMail/><a href="mailto:hallo@emlaunchpad.com">hallo@emlaunchpad.com</a></div>
            </div>
          </div>
          <div className="a-cities">
            <span className="ttl">Lokaal actief</span>
            <div className="cities">
              {CITIES.map(([t,h]) => <a key={t} href={h} onClick={(e)=>e.preventDefault()}>{t}</a>)}
            </div>
          </div>
        </div>

        <div className="a-bot">
          <span className="meta">© 2026 EM Launchpad · BTW BE1024.977.818</span>
          <div className="a-legal">
            <a href="#">Privacy</a><a href="#">Algemene voorwaarden</a><a href="#">Cookies</a>
          </div>
          <span className="made"><span className="dot"></span>Gemaakt in Limburg, België</span>
        </div>
      </footer>
    </div>
  );
}

/* ════════════════════ B · GREEN ANCHOR ════════════════════ */
function FooterB() {
  return (
    <div className="ftr">
      <Ctx label="· · ·  einde pagina  · · ·" />
      <footer className="b-foot">
        <div className="b-card-wrap">
          <div className="b-card">
            <div>
              <span className="eyebrow" style={{marginBottom: '12px'}}><span className="dot"></span>Klaar om te groeien?</span>
              <h3>Plan een gratis gesprek van 30 minuten.</h3>
              <p>We bekijken samen wat past bij jouw bedrijf — geen verplichtingen, geen sales-druk.</p>
            </div>
            <div className="b-cta-side">
              <button className="cta">Plan een gratis gesprek <Arrow/></button>
              <Newsletter ph="Of laat je e-mail achter" />
            </div>
          </div>
        </div>

        <div className="b-body">
          <div className="b-grid">
            <div className="b-brand">
              <Wordmark />
              <p className="tagline">{TAGLINE}</p>
              <Social />
            </div>
            <LinkCol title="Diensten" items={DIENSTEN} />
            <LinkCol title="Bedrijf" items={BEDRIJF} />
            <div>
              <h5 className="col-h">Contact</h5>
              <div className="contact">
                <div className="c-row"><IPin/><span>Brugstraat 2A<br/>3870 Vechmaal, België</span></div>
                <div className="c-row"><IPhone/><a href="tel:+32476015451">+32 476 01 54 51</a></div>
                <div className="c-row"><IMail/><a href="mailto:hallo@emlaunchpad.com">hallo@emlaunchpad.com</a></div>
              </div>
            </div>
          </div>

          <div className="b-cities">
            <span className="ttl">Lokaal actief</span>
            <div className="cities">
              {CITIES.map(([t,h]) => <a key={t} href={h} onClick={(e)=>e.preventDefault()}>{t}</a>)}
            </div>
          </div>

          <div className="b-bot">
            <span className="meta">© 2026 EM Launchpad · BTW BE1024.977.818</span>
            <span className="made"><span className="dot"></span>Gemaakt in Limburg, België</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ════════════════════ C · FLIGHTDECK LIGHT ════════════════════ */
function FooterC() {
  return (
    <div className="ftr">
      <Ctx label="· · ·  einde pagina  · · ·" />
      <footer className="c-foot">
        <div className="c-hair"></div>
        <div className="c-inner">
          <div className="c-top">
            <div className="c-id">
              <Wordmark grad />
              <span className="c-status"><span className="dot"></span>Alle systemen online · 24/7</span>
              <p className="tagline">{TAGLINE}</p>
            </div>
            <div className="c-news">
              <span className="lbl">// nieuwsbrief</span>
              <Newsletter ph="jouw@email.be" />
              <Social className="c-social" />
            </div>
          </div>

          <div className="c-grid">
            <div className="c-cell">
              <h5 className="c-h">// <b>diensten</b></h5>
              <div className="c-links2">
                {DIENSTEN.map(([t,h]) => <a key={t} href={h} onClick={(e)=>e.preventDefault()}>{t}</a>)}
              </div>
            </div>
            <div className="c-cell">
              <h5 className="c-h">// <b>bedrijf</b></h5>
              <div className="c-links2">
                {BEDRIJF.map(([t,h]) => <a key={t} href={h} onClick={(e)=>e.preventDefault()}>{t}</a>)}
              </div>
            </div>
            <div className="c-cell">
              <h5 className="c-h">// <b>contact</b></h5>
              <div className="contact">
                <div className="c-row"><IPin/><span>Brugstraat 2A, 3870 Vechmaal, België</span></div>
                <div className="c-row"><IPhone/><a href="tel:+32476015451">+32 476 01 54 51</a></div>
                <div className="c-row"><IMail/><a href="mailto:hallo@emlaunchpad.com">hallo@emlaunchpad.com</a></div>
              </div>
            </div>
          </div>

          <div className="c-cities">
            <span className="slash">// lokaal actief →</span>
            {CITIES.map(([t,h], i) => (
              <React.Fragment key={t}>
                {i>0 && <span className="slash">/</span>}
                <a href={h} onClick={(e)=>e.preventDefault()}>{t}</a>
              </React.Fragment>
            ))}
          </div>

          <div className="c-bot">
            <span className="seg">© 2026 <b>EM_LAUNCHPAD</b> · BTW BE1024.977.818</span>
            <span className="seg"><b>GEMAAKT_IN_LIMBURG</b> · BELGIË</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ════════════════════ D · FLIGHTDECK DARK (robotic) ════════════════════
   The dark, techy counterpart to the navbar — deep field, dot grid,
   gradient hairline, frosted EM-glass chip, JetBrains Mono labels. */
function FooterDeck() {
  return (
    <div className="dframe">
      <div className="d-ctx"><span>· · ·  end_of_page  · · ·</span></div>
      <footer className="dfoot">
        <div className="d-hair"></div>
        <div className="d-inner">

          <div className="d-top">
            <div className="d-id">
              <div className="d-lock">
                <span className="d-em"><b>EM</b></span>
                <span className="word">Launchpad</span>
              </div>
              <span className="d-status"><span className="dot"></span>all_systems_online // 24/7</span>
              <p className="d-tag">{TAGLINE}</p>
            </div>
            <div className="d-news">
              <span className="lbl">// nieuwsbrief</span>
              <form className="d-field" onSubmit={(e)=>e.preventDefault()}>
                <input type="email" placeholder="jouw@email.be" aria-label="E-mailadres" />
                <button type="submit">subscribe <Arrow/></button>
              </form>
              <div className="d-social">
                {SOCIALS.map(([name, href, Ic]) => (
                  <a key={name} href={href} aria-label={name} onClick={(e)=>e.preventDefault()}><Ic/></a>
                ))}
              </div>
            </div>
          </div>

          <div className="d-grid">
            <div className="d-cell">
              <h5 className="d-h">// <b>diensten</b></h5>
              <div className="d-links">
                {DIENSTEN.map(([t,h]) => <a key={t} href={h} onClick={(e)=>e.preventDefault()}>{t.toLowerCase()}</a>)}
              </div>
            </div>
            <div className="d-cell one">
              <h5 className="d-h">// <b>bedrijf</b></h5>
              <div className="d-links">
                {BEDRIJF.map(([t,h]) => <a key={t} href={h} onClick={(e)=>e.preventDefault()}>{t.toLowerCase().replace(' ','_')}</a>)}
              </div>
            </div>
            <div className="d-cell">
              <h5 className="d-h">// <b>contact</b></h5>
              <div className="d-contact">
                <div className="row"><IPin/><span>Brugstraat 2A, 3870 Vechmaal, België</span></div>
                <div className="row"><IPhone/><a href="tel:+32476015451">+32&nbsp;476&nbsp;01&nbsp;54&nbsp;51</a></div>
                <div className="row"><IMail/><a href="mailto:hallo@emlaunchpad.com">hallo@emlaunchpad.com</a></div>
              </div>
            </div>
          </div>

          <div className="d-cities">
            <span className="lead">// lokaal_actief →</span>
            {CITIES.map(([t,h], i) => (
              <React.Fragment key={t}>
                {i>0 && <span className="sep">/</span>}
                <a href={h} onClick={(e)=>e.preventDefault()}>{t}</a>
              </React.Fragment>
            ))}
          </div>

          <div className="d-bot">
            <span className="seg">© 2026 <b>EM_LAUNCHPAD</b> · BTW BE1024.977.818</span>
            <span className="seg"><span className="mint">▲</span> <b>GEMAAKT_IN_LIMBURG</b> · BELGIË</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

Object.assign(window, { FooterA, FooterB, FooterC, FooterDeck });
