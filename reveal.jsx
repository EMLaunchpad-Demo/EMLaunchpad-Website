// EM Launchpad reveal scene.
// A blue→green neon line traces the outlines of "E" and "M", the glyphs fill in,
// then "Launchpad" slides in to complete the lockup.

const EASE = window.Easing;
const clampN = window.clamp;

// ── Letterform geometry (art units; E + M sit on a 730 x 300 baseline box) ──
const E_PTS = [
  [0,0],[250,0],[250,64],[78,64],[78,118],[215,118],
  [215,182],[78,182],[78,236],[250,236],[250,300],[0,300],
];
const M_PTS = [
  [370,0],[458,0],[550,132],[642,0],[730,0],[730,300],
  [642,300],[642,156],[550,246],[458,156],[458,300],[370,300],
];
const toPath = (pts) => 'M' + pts.map((p) => p.join(',')).join(' L') + ' Z';
const E_D = toPath(E_PTS);
const M_D = toPath(M_PTS);

// Stage geometry
const STAGE_W = 1920, STAGE_H = 1080;
const EM_W = 730, EM_H = 300;          // glyph block in art units
const EM_SCALE = 1.0;                   // display 1:1 -> 300px tall glyphs
const GAP = 78;                         // gap between EM mark and divider+word

// Timeline (seconds)
const T = {
  bgIn:        [0.0, 0.6],
  traceE:      [0.45, 1.95],
  traceM:      [1.80, 3.15],
  fill:        [2.55, 3.45],
  shift:       [3.05, 3.95],   // EM slides from center to lockup position
  divider:     [3.10, 3.70],
  word:        [3.20, 4.30],   // "Launchpad" letters stagger in
  settle:      4.4,            // breathing begins
};

// ── Background: deep field with dot grid, radial glow, vignette ─────────────
function Backdrop({ flat }) {
  const t = window.useTime();
  const a = EASE.easeOutQuad(clampN((t - T.bgIn[0]) / (T.bgIn[1] - T.bgIn[0]), 0, 1));
  // glow intensifies as the trace energizes, then gently breathes
  let glow = clampN((t - 0.4) / 2.6, 0, 1);
  if (t > T.settle) glow = 0.85 + 0.15 * Math.sin((t - T.settle) * 1.6);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: a, background: '#06080c' }}>
      {/* dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(120,180,200,0.16) 1.1px, transparent 1.1px)',
        backgroundSize: '46px 46px',
        maskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, #000 30%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, #000 30%, transparent 78%)',
        opacity: flat ? 0.42 : 0.55,
      }} />
      {/* core radial glow behind the mark */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: 1500, height: 900,
        transform: 'translate(-50%,-50%)',
        background: 'radial-gradient(ellipse at center, rgba(36,178,170,0.20) 0%, rgba(40,110,255,0.12) 32%, transparent 62%)',
        opacity: glow, filter: flat ? 'none' : 'blur(8px)',
      }} />
      {/* vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)',
      }} />
    </div>
  );
}

// ── The EM mark: track + animated trace + fill + comet head ─────────────────
function EMMark({ x, y, fillP, breathe, flat }) {
  const eRef = React.useRef(null);
  const mRef = React.useRef(null);
  const t = window.useTime();
  const [lenE, setLenE] = React.useState(0);
  const [lenM, setLenM] = React.useState(0);

  React.useEffect(() => {
    if (eRef.current) setLenE(eRef.current.getTotalLength());
    if (mRef.current) setLenM(mRef.current.getTotalLength());
  }, []);

  const progE = EASE.easeInOutSine(clampN((t - T.traceE[0]) / (T.traceE[1] - T.traceE[0]), 0, 1));
  const progM = EASE.easeInOutSine(clampN((t - T.traceM[0]) / (T.traceM[1] - T.traceM[0]), 0, 1));

  // comet head positions
  const headE = (lenE && progE > 0 && progE < 1) ? eRef.current.getPointAtLength(progE * lenE) : null;
  const headM = (lenM && progM > 0 && progM < 1) ? mRef.current.getPointAtLength(progM * lenM) : null;

  // gradient shimmer travels along the line
  const shimmer = (t * 26) % 100;
  const glowStr = 2 + breathe * 3;

  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: EM_W * EM_SCALE, height: EM_H * EM_SCALE,
      filter: flat ? 'none' : `drop-shadow(0 0 ${7 + breathe * 5}px rgba(40,200,180,${0.3 + breathe * 0.18}))`,
    }}>
      <svg viewBox={`-12 -12 ${EM_W + 24} ${EM_H + 24}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="emGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2f7bff" />
            <stop offset="45%" stopColor="#13c7e6" />
            <stop offset="100%" stopColor="#2ff0a6" />
          </linearGradient>
          <linearGradient id="emFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dff6ff" />
            <stop offset="100%" stopColor="#9fd9e6" />
          </linearGradient>
          <linearGradient id="moveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset={`${(shimmer - 18 + 100) % 100}%`} stopColor="#2f7bff" />
            <stop offset={`${shimmer}%`} stopColor="#7df7ff" />
            <stop offset={`${(shimmer + 18) % 100}%`} stopColor="#2ff0a6" />
          </linearGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* faint track */}
        <path d={E_D} fill="none" stroke="rgba(150,200,210,0.10)" strokeWidth="2" />
        <path d={M_D} fill="none" stroke="rgba(150,200,210,0.10)" strokeWidth="2" />

        {/* filled glyphs (fade in after trace) */}
        <path d={E_D} fill="url(#emFill)" fillOpacity={fillP * 0.92} />
        <path d={M_D} fill="url(#emFill)" fillOpacity={fillP * 0.92} />

        {/* flat-mode bloom: layered translucent strokes (no SVG filter) */}
        {flat && [[E_D, lenE, progE], [M_D, lenM, progM]].map(([d, len, prog], i) => (
          <g key={i}>
            <path d={d} fill="none" stroke="url(#emGrad)" strokeWidth={16} opacity={0.14}
              strokeLinejoin="round" strokeLinecap="round"
              strokeDasharray={len} strokeDashoffset={len * (1 - prog)} />
            <path d={d} fill="none" stroke="url(#emGrad)" strokeWidth={9} opacity={0.38}
              strokeLinejoin="round" strokeLinecap="round"
              strokeDasharray={len} strokeDashoffset={len * (1 - prog)} />
          </g>
        ))}

        {/* animated neon outline trace (core stroke; refs used for measure + comet) */}
        <g filter={flat ? undefined : 'url(#softGlow)'}>
          <path ref={eRef} d={E_D} fill="none" stroke="url(#emGrad)" strokeWidth={5}
            strokeLinejoin="round" strokeLinecap="round"
            strokeDasharray={lenE} strokeDashoffset={lenE * (1 - progE)} />
          <path ref={mRef} d={M_D} fill="none" stroke="url(#emGrad)" strokeWidth={5}
            strokeLinejoin="round" strokeLinecap="round"
            strokeDasharray={lenM} strokeDashoffset={lenM * (1 - progM)} />
        </g>

        {/* comet heads */}
        {headE && <CometHead p={headE} />}
        {headM && <CometHead p={headM} />}
      </svg>
    </div>
  );
}

function CometHead({ p }) {
  return (
    <g>
      <circle cx={p.x} cy={p.y} r="13" fill="#bff9ff" opacity="0.25" />
      <circle cx={p.x} cy={p.y} r="6" fill="#eafffb" opacity="0.55" />
      <circle cx={p.x} cy={p.y} r="3" fill="#ffffff" />
    </g>
  );
}

// ── "Launchpad" wordmark — per-letter stagger entrance ──────────────────────
const WORD = 'Launchpad';
function Wordmark({ x, yCenter, onWidth }) {
  const t = window.useTime();
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current) return;
    const measure = () => onWidth(ref.current.offsetWidth);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }, []);

  return (
    <div ref={ref} style={{
      position: 'absolute', left: x, top: yCenter,
      transform: 'translateY(-50%)',
      display: 'flex',
      fontFamily: 'Archivo, sans-serif', fontWeight: 700,
      fontSize: 168, lineHeight: 1, letterSpacing: '-0.02em',
      color: '#eef4f6', whiteSpace: 'pre',
    }}>
      {WORD.split('').map((ch, i) => {
        const start = T.word[0] + i * 0.052;
        const local = clampN((t - start) / 0.5, 0, 1);
        const e = EASE.easeOutCubic(local);
        return (
          <span key={i} style={{
            display: 'inline-block',
            opacity: e,
            transform: `translateX(${(1 - e) * 34}px) translateY(${(1 - e) * 10}px)`,
            willChange: 'transform, opacity',
          }}>{ch}</span>
        );
      })}
    </div>
  );
}

// ── Vertical gradient divider that draws between mark and word ──────────────
function Divider({ x, yCenter, p }) {
  const h = EM_H * EM_SCALE * 0.86;
  return (
    <div style={{
      position: 'absolute', left: x, top: yCenter,
      width: 3, height: h,
      transform: `translateY(-50%) scaleY(${EASE.easeOutCubic(p)})`,
      transformOrigin: 'center',
      background: 'linear-gradient(to bottom, transparent, #2f7bff, #2ff0a6, transparent)',
      boxShadow: '0 0 10px rgba(45,240,166,0.5)',
      opacity: p,
      borderRadius: 2,
    }} />
  );
}

// ── Scene root ──────────────────────────────────────────────────────────────
function LaunchpadReveal({ flat }) {
  const t = window.useTime();
  const [lpWidth, setLpWidth] = React.useState(940); // measured at runtime

  // layout math
  const markW = EM_W * EM_SCALE;
  const totalW = markW + GAP + lpWidth;
  const finalEMx = STAGE_W / 2 - totalW / 2;
  const centerEMx = STAGE_W / 2 - markW / 2;
  const shiftP = EASE.easeInOutCubic(clampN((t - T.shift[0]) / (T.shift[1] - T.shift[0]), 0, 1));
  const emX = centerEMx + (finalEMx - centerEMx) * shiftP;
  const emY = STAGE_H / 2 - (EM_H * EM_SCALE) / 2;
  const yCenter = STAGE_H / 2;

  const dividerX = emX + markW + GAP / 2;
  const wordX = emX + markW + GAP;

  const fillP = EASE.easeOutCubic(clampN((t - T.fill[0]) / (T.fill[1] - T.fill[0]), 0, 1));
  const dividerP = clampN((t - T.divider[0]) / (T.divider[1] - T.divider[0]), 0, 1);
  const breathe = t > T.settle ? (0.5 + 0.5 * Math.sin((t - T.settle) * 1.7)) : clampN((t - 2.6) / 1.0, 0, 1);

  return (
    <div data-screen-label={`t=${t.toFixed(1)}s`} style={{ position: 'absolute', inset: 0 }}>
      <Backdrop flat={flat} />
      <EMMark x={emX} y={emY} fillP={fillP} breathe={breathe} flat={flat} />
      <Divider x={dividerX} yCenter={yCenter} p={dividerP} />
      <Wordmark x={wordX} yCenter={yCenter} onWidth={(w) => { if (w && Math.abs(w - lpWidth) > 2) setLpWidth(w); }} />
    </div>
  );
}

window.LaunchpadReveal = LaunchpadReveal;
