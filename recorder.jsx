// EM Launchpad — deterministic MP4 recorder.
// Renders the reveal scene at native 1920x1080 into #frame, exposes a seek hook,
// then steps frame-by-frame, rasterizes each via html-to-image, and encodes H.264 MP4.

const { useState, useEffect, useMemo } = React;
const DUR = 6, W = 1920, H = 1080;
const TL = window.TimelineContext;

let setTimeExternal = null;

function ExportFrame() {
  const [time, setTime] = useState(0);
  useEffect(() => { setTimeExternal = setTime; }, []);
  const ctx = useMemo(() => ({ time, duration: DUR, playing: false, setTime, setPlaying: () => {} }), [time]);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#06080c', overflow: 'hidden' }}>
      <TL.Provider value={ctx}>
        <LaunchpadReveal flat={true} />
      </TL.Provider>
    </div>
  );
}

const frameEl = document.getElementById('frame');
ReactDOM.createRoot(frameEl).render(<ExportFrame />);

// Fit the 1920x1080 frame into the preview area
function fitStage() {
  const wrap = document.getElementById('stageWrap');
  const s = Math.min(wrap.clientWidth / W, wrap.clientHeight / H);
  frameEl.style.transform = `scale(${s})`;
}
window.addEventListener('resize', fitStage);
fitStage();

const nextPaint = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

// Seek to a specific time and wait for React to commit + paint
async function seekTo(t) {
  if (setTimeExternal) setTimeExternal(Math.max(0, Math.min(DUR, t)));
  await nextPaint();
}
window.__seekTo = seekTo;
window.__duration = DUR;

const statusEl = document.getElementById('status');
const fillEl = document.getElementById('fill');
const btn = document.getElementById('render');
const setStatus = (m) => { statusEl.textContent = m; };
const setProg = (p) => { fillEl.style.width = (p * 100).toFixed(1) + '%'; };

// Precompute font-embed CSS once (Archivo for the wordmark) so per-frame raster is fast
let FONT_CSS = '';
async function ensureFontCSS() {
  if (FONT_CSS) return FONT_CSS;
  try { FONT_CSS = await window.htmlToImage.getFontEmbedCSS(frameEl); } catch (e) { FONT_CSS = ''; }
  return FONT_CSS;
}

// Rasterize the unscaled 1920x1080 frame to a canvas at the requested pixel scale
async function rasterize(pixelScale) {
  return await window.htmlToImage.toCanvas(frameEl, {
    width: W, height: H, pixelRatio: pixelScale, cacheBust: false,
    fontEmbedCSS: FONT_CSS,
    style: { transform: 'none', transformOrigin: 'top left', margin: '0' },
    backgroundColor: '#06080c',
  });
}

// Main render — returns the encoded MP4 Uint8Array (also downloads it)
async function renderMP4({ fps = 30, scale = 1, download = true, maxFrames = Infinity } = {}) {
  if (!window.HME) throw new Error('encoder not loaded');
  await (document.fonts && document.fonts.ready);
  setStatus('Embedding fonts…');
  await ensureFontCSS();
  // warm-up raster (first call compiles the clone path)
  await seekTo(0);
  await rasterize(scale);
  const outW = Math.round(W * scale / 2) * 2;
  const outH = Math.round(H * scale / 2) * 2;

  const encoder = await window.HME.createH264MP4Encoder();
  encoder.width = outW; encoder.height = outH;
  encoder.frameRate = fps;
  encoder.kbps = Math.round((outW * outH) / 320); // ~6.5Mbps @720p, scales with area
  encoder.groupOfPictures = fps; // a keyframe ~every second
  encoder.initialize();

  const total = Math.min(Math.ceil(DUR * fps) + 1, maxFrames);
  const tmp = document.createElement('canvas');
  tmp.width = outW; tmp.height = outH;
  const tctx = tmp.getContext('2d');

  for (let i = 0; i < total; i++) {
    const t = i / fps;
    await seekTo(t);
    const c = await rasterize(scale);
    tctx.clearRect(0, 0, outW, outH);
    tctx.drawImage(c, 0, 0, outW, outH);
    const data = tctx.getImageData(0, 0, outW, outH).data;
    encoder.addFrameRgba(data);
    setProg((i + 1) / total);
    setStatus(`Rendering frame ${i + 1}/${total} (${outW}×${outH} @ ${fps}fps)`);
    if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  setStatus('Encoding…');
  encoder.finalize();
  const out = encoder.FS.readFile(encoder.outputFilename);
  encoder.delete();

  const blob = new Blob([out], { type: 'video/mp4' });
  window.__lastMP4 = { size: blob.size, frames: total, w: outW, h: outH };
  if (download) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `EM-Launchpad_${outW}x${outH}_${fps}fps.mp4`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  setStatus(`Done — ${(blob.size / 1048576).toFixed(1)} MB, ${total} frames.`);
  setProg(0);
  await seekTo(DUR);
  return out;
}
window.__renderMP4 = renderMP4;

btn.addEventListener('click', async () => {
  btn.disabled = true;
  const fps = parseInt(document.getElementById('fps').value, 10);
  const scale = parseFloat(document.getElementById('res').value);
  try {
    await renderMP4({ fps, scale });
  } catch (e) {
    setStatus('Error: ' + e.message);
    console.error(e);
  } finally {
    btn.disabled = false;
  }
});

// settle on a representative frame for the idle preview (retry until React is mounted)
(async () => {
  for (let i = 0; i < 40 && !setTimeExternal; i++) await new Promise((r) => setTimeout(r, 50));
  await seekTo(4.6);
})();
