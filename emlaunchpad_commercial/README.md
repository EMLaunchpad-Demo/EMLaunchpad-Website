# EMLaunchpad — Cinematic AI Commercial (Blender / bpy)

A fully procedural, **runnable Blender project** that builds a 45‑second, 10‑shot
cinematic commercial for **EMLaunchpad** — no external assets required.
Everything (set, props, entrepreneur figure, holographic UI, AI network,
lighting, cameras, animation, materials, particles, render + compositor glow)
is generated in code.

> *"Your AI Workforce. Always Working."*

---

## Quick start

**Requires Blender 4.2 or newer** (tested against the Eevee‑Next API; also runs
on Cycles).

### Option A — one command (build + render to MP4)
```bash
blender --background --python main.py -- --render
```
Output lands in `./renders/emlaunchpad_commercial_####.mp4`‑style frames
(FFMPEG/H.264, one video file).

### Option B — open Blender with the scene built, then preview / render manually
```bash
blender --python main.py
```
Press **Spacebar** to play. Timeline **markers switch the camera per shot**.

### Option C — inside Blender
Open `main.py` in the **Text Editor** → **Run Script** (Alt+P).

---

## Project structure
```
emlaunchpad_commercial/
├── main.py              # entry point: bootstraps sys.path, runs the build
├── config.py            # ALL settings: engine, resolution, fps, palette, shots
├── README.md
├── scenes/              # (optional) save built .blend files here
├── assets/              # (empty — project is 100% procedural)
├── renders/             # render output (created on first render)
└── scripts/
    ├── __init__.py
    ├── utils.py         # scene reset, collections, colour, eased keyframing
    ├── materials.py     # PBR + glass + hologram + OLED + AI‑energy shaders
    ├── lighting.py      # world, key/fill/rim, practicals, volumetric fog
    ├── environment.py   # room, desk, laptop, phone, coffee, papers, figure
    ├── ui_holograms.py  # WhatsApp / Instagram / CRM / calendar / voice / toasts
    ├── ai_network.py    # AI core + node lattice + fly‑through corridor
    ├── particles.py     # glowing motes + ambient data dust
    ├── cameras.py       # one cinematic camera per shot, bound to markers
    ├── animation.py     # story choreography across all 10 shots
    ├── branding.py      # end‑frame logotype + taglines on black
    └── render.py        # engine, samples, motion blur, AgX, compositor bloom
```

---

## The edit (24 fps, 1080 frames total)

| Shot | Frames | Time | Beat | Camera |
|------|--------|------|------|--------|
| 1 | 1–72 | 0:00–0:03 | Buzzing phone lights the dark room | 85mm push‑in, handheld |
| 2 | 73–168 | 0:03–0:07 | Lone owner, wide, cold | 35mm dolly‑in |
| 3 | 169–240 | 0:07–0:10 | Chaos montage, cuts on the beat | 50mm punch‑ins |
| 4 | 241–312 | 0:10–0:13 | Holographic notification swarm | 40mm slow orbit |
| 5 | 313–384 | 0:13–0:16 | Freeze — time stops, near black | 50mm slow creep |
| 6 | 385–480 | 0:16–0:20 | The AI core is born | 35mm push + rack focus |
| 7 | 481–624 | 0:20–0:26 | Automation in action | 45mm crane |
| 8 | 625–768 | 0:26–0:32 | Freedom — warm, calm | 85mm intimate |
| 9 | 769–912 | 0:32–0:38 | Fly‑through the AI network | 28mm fast dolly |
| 10 | 913–1080 | 0:38–0:45 | Brand reveal on black | 50mm locked push |

The whole film is **one continuous scene**; each shot's camera is bound to a
timeline marker (the standard Blender multi‑camera editing workflow), so the
entire edit renders in a single pass.

---

## Tuning (all in `config.py`)

- `RENDER_ENGINE` — `"eevee"` (fast, ideal for the neon glow) or `"cycles"`
  (full path‑traced GI, most realistic, slower).
- `QUALITY` — `"1080p"` or `"4k"`.
- `EEVEE_SAMPLES` / `CYCLES_SAMPLES` — quality vs. speed.
- `COL` — the entire colour palette (sRGB hex, auto‑converted to linear).
- `SHOTS` — retime the edit by editing frame ranges.
- `BUILD_PARTICLES`, `BUILD_VOLUMETRICS`, `USE_MOTION_BLUR` — heavy‑feature
  toggles for faster preview renders.

### Notes on realism choices
- **Bloom** is done in the **compositor** (Glare → Bloom + Fog‑Glow), because
  Eevee‑Next removed the legacy bloom toggle. This is engine‑agnostic, so both
  Eevee and Cycles get consistent glow.
- **Color management** uses **AgX** (falls back to Filmic) for a filmic, HDR‑
  friendly look.
- The **entrepreneur** is a clean, minimalist silhouette built from primitives.
  A photoreal human needs sculpted external assets; the stylised figure suits
  the Apple/Tesla art direction and keeps the project fully procedural. This is
  the one deliberate approximation — swap in a rigged human model if desired.

---

## Rendering tips
- For a fast look‑dev pass: set `QUALITY="1080p"`, `RENDER_ENGINE="eevee"`,
  `EEVEE_SAMPLES=32`, and render a frame range per shot.
- For delivery: `QUALITY="4k"`, raise samples, and (optionally) switch to
  `"cycles"` with GPU. Cycles will be substantially slower per frame.
- To render still keyframes for review, pick a frame in a shot's range (see the
  table) and render the current frame (F12).
