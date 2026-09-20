/* EM Launchpad — interactieve 3D-sterrenhemel
   Zoekt elke <canvas data-stars> en tekent sterren met echte diepte die
   langzaam naar de kijker toe komen. De parallax schaalt mee met de diepte,
   dus sterren dichtbij verschuiven méér met de muis dan sterren ver weg.
   Respecteert prefers-reduced-motion (dan staat alles stil). */
(function () {
  const canvases = document.querySelectorAll('canvas[data-stars]');
  if (!canvases.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mx = 0.5, my = 0.5;
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX / window.innerWidth;
    my = e.clientY / window.innerHeight;
  }, { passive: true });

  canvases.forEach((cv) => {
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, f = 400, stars = [], vx = 0.5, vy = 0.5, raf = 0;
    const SPEED = 0.0022; // rustige voorwaartse drift

    // Zaai de ster op een willekeurig punt dat NU in beeld valt en reken terug
    // naar 3D-coördinaten. Zo blijft het beeld altijd gelijkmatig gevuld.
    function seed(s, init) {
      s.z = init ? (0.15 + Math.random() * 0.85) : (0.92 + Math.random() * 0.08);
      const px = Math.random() * w, py = Math.random() * h;
      s.x = (px - w / 2) * s.z / f;
      s.y = (py - h / 2) * s.z / f;
      s.o = 0.45 + Math.random() * 0.55; // basishelderheid
    }

    function size() {
      const r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height; f = Math.min(w, h) * 0.55;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(80, Math.min(280, Math.round((w * h) / 7000)));
      stars = Array.from({ length: n }, () => { const s = {}; seed(s, true); return s; });
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      vx += (mx - vx) * 0.05; vy += (my - vy) * 0.05;       // cursor smoothing
      const ox = (vx - 0.5) * 0.10, oy = (vy - 0.5) * 0.10; // muis-offset (3D parallax)
      const cx = w / 2, cy = h / 2;
      for (const s of stars) {
        if (!reduce) { s.z -= SPEED; if (s.z <= 0.05) { seed(s, false); continue; } }
        const k = f / s.z;                                   // perspectiefprojectie
        const bx = cx + s.x * k, by = cy + s.y * k;          // positie zonder muis
        if (bx < -40 || bx > w + 40 || by < -40 || by > h + 40) { if (!reduce) seed(s, false); continue; }
        // parallax schaalt mee met de diepte: sterren dichtbij verschuiven méér
        const px = bx + ox * k;
        const py = by + oy * k;
        const near = 1 - s.z;                                // 0 ver -> 1 dichtbij
        const rad = 0.5 + near * near * 1.7;                 // dichterbij = groter
        const a = s.o * (0.25 + near * 0.75);                // dichterbij = helderder
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, 6.2832);
        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    }

    size();
    if (reduce) frame(); else raf = requestAnimationFrame(frame);
    let rt = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        cancelAnimationFrame(raf); size();
        if (reduce) frame(); else raf = requestAnimationFrame(frame);
      }, 150);
    }, { passive: true });
  });
})();
