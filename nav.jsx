// EMLaunchpad — three navigation directions.
// Each renders a minimal hero frame with one nav treatment so it can be judged in context.

const NAV_ITEMS = ['Home', 'Product', 'Features', 'Resources', 'Blog', 'About', 'Contact'];

// Typographic EM monogram — tight Archivo, gradient-filled. Crisp at any size.
function EMMark({ size = 26 }) {
  return <span className="em-logo" style={{ fontSize: size }} aria-label="EM">EM</span>;
}

// EM logo seated on a frosted grey-glass tile (grain texture + bevel + sheen).
function EMGlass({ size = 44 }) {
  return (
    <span className="logo-glass" style={{ width: size, height: size, borderRadius: Math.round(size * 0.3) }}>
      <span className="em-logo" style={{ fontSize: Math.round(size * 0.46) }} aria-label="EM">EM</span>
    </span>
  );
}

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

function HeroCopy() {
  return (
    <div className="hero">
      <span className="eyebrow">Mission control for EMs</span>
      <h1>Run engineering teams from <span className="grad">one launchpad</span>.</h1>
      <p>Plans, 1:1s, reviews and metrics — every signal an engineering manager needs, in a single calm surface.</p>
    </div>
  );
}

// ── A · Aurora Pill ───────────────────────────────────────────────────────
function NavPill() {
  return (
    <div className="frame">
      <div className="pill-wrap">
        <nav className="pill">
          <EMGlass size={40} />
          <span className="pill-divide" />
          <div className="nav-links">
            {NAV_ITEMS.map((it, i) => (
              <a key={it} href="#" className={i === 1 ? 'active' : ''} onClick={(e) => e.preventDefault()}>{it}</a>
            ))}
          </div>
          <button className="btn-demo">Request a Demo <ArrowIcon /></button>
        </nav>
      </div>
      <HeroCopy />
    </div>
  );
}

// ── B · Edge Glass ──────────────────────────────────────────────────────--
function NavEdge() {
  return (
    <div className="frame">
      <header className="edge">
        <div className="lockup">
          <EMGlass size={42} />
          <span className="word">Launchpad</span>
        </div>
        <div className="nav-links">
          {NAV_ITEMS.map((it, i) => (
            <a key={it} href="#" className={i === 0 ? 'active' : ''} onClick={(e) => e.preventDefault()}>{it}</a>
          ))}
        </div>
        <button className="btn-demo">Request a Demo <ArrowIcon /></button>
      </header>
      <HeroCopy />
    </div>
  );
}

// ── C · Flightdeck (techy split) ────────────────────────────────────────--
function NavTechy() {
  return (
    <div className="frame">
      <nav className="deck">
        <EMGlass size={46} />
        <span className="deck-word">Launchpad</span>
        <span className="deck-divide" />
        <div className="nav-links">
          {NAV_ITEMS.map((it, i) => (
            <a key={it} href="#" className={i === 1 ? 'active' : ''} onClick={(e) => e.preventDefault()}>{it.toLowerCase()}</a>
          ))}
        </div>
        <span className="spacer" />
        <button className="btn-demo">request_demo <ArrowIcon /></button>
      </nav>
      <HeroCopy />
    </div>
  );
}

Object.assign(window, { NavPill, NavEdge, NavTechy });
