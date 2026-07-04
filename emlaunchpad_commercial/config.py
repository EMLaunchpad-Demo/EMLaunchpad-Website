"""
config.py
=========
Central configuration for the EMLaunchpad cinematic commercial.

Every "magic number" in the project lives here so the film can be re-timed,
re-coloured or re-scaled without touching the build logic. All colours are
authored in sRGB hex and converted to scene-linear at material-build time
(see scripts/utils.srgb_hex).

Timeline
--------
The commercial is one continuous master scene. Each "shot" is a range of
frames on a single timeline; a dedicated camera is bound to a timeline marker
at each shot's start (the professional multi-shot editing workflow in Blender).
This renders the whole edit in a single pass while keeping every shot's camera
independently animated.
"""

# --------------------------------------------------------------------------- #
#  Render / output
# --------------------------------------------------------------------------- #
FPS = 24                       # cinematic frame rate

# "eevee"  -> BLENDER_EEVEE_NEXT : fast, ideal for the neon-glow aesthetic
# "cycles" -> CYCLES            : full path-traced GI, slower, most realistic
RENDER_ENGINE = "eevee"

# Resolution presets. Flip QUALITY to "4k" for delivery renders.
QUALITY = "1080p"
RESOLUTIONS = {
    "1080p": (1920, 1080),
    "4k":    (3840, 2160),
}

# Sample counts (higher = cleaner, slower)
EEVEE_SAMPLES = 96
CYCLES_SAMPLES = 256

# Output folder is resolved relative to the project root at runtime.
OUTPUT_SUBDIR = "renders"
OUTPUT_NAME = "emlaunchpad_commercial_"   # frame number is appended

# Output as an MP4 video (True) or PNG stills / image sequence (False).
# PNG is bulletproof and ideal for test frames; set True for a final video.
OUTPUT_VIDEO = True

# --------------------------------------------------------------------------- #
#  Colour palette (sRGB hex) — dark, premium, neon-AI
# --------------------------------------------------------------------------- #
COL = {
    "cyan":        "#00E5FF",   # primary AI accent
    "electric":    "#0A84FF",   # electric blue
    "deep_blue":   "#04122B",   # near-black cool base
    "purple":      "#7A5CFF",   # subtle secondary accent
    "white":       "#FFFFFF",
    "warm":        "#FFB25E",   # warm practical light (freedom scene)
    "wa_green":    "#25D366",   # WhatsApp
    "ig_pink":     "#E1306C",   # Instagram
    "red":         "#FF3B30",   # missed calls / urgency
    "concrete":    "#1A1D22",   # dark concrete
    "aluminium":   "#8A9099",   # brushed aluminium
    "black_matte": "#0B0C0E",
}

# --------------------------------------------------------------------------- #
#  Shot definitions — one continuous 45s / 1080-frame timeline @ 24fps
# --------------------------------------------------------------------------- #
# start/end are inclusive frame numbers. `cam` is the camera builder key
# (see scripts/cameras.py). Order matters: markers are created in sequence.
SHOTS = [
    {"id": 1,  "name": "Overwhelm_notify", "start": 1,    "end": 72,   "sec": "0:00-0:03"},
    {"id": 2,  "name": "Wide_office",      "start": 73,   "end": 168,  "sec": "0:03-0:07"},
    {"id": 3,  "name": "Chaos_montage",    "start": 169,  "end": 240,  "sec": "0:07-0:10"},
    {"id": 4,  "name": "Holo_swarm",       "start": 241,  "end": 312,  "sec": "0:10-0:13"},
    {"id": 5,  "name": "Freeze",           "start": 313,  "end": 384,  "sec": "0:13-0:16"},
    {"id": 6,  "name": "AI_core_birth",    "start": 385,  "end": 480,  "sec": "0:16-0:20"},
    {"id": 7,  "name": "Automation",       "start": 481,  "end": 624,  "sec": "0:20-0:26"},
    {"id": 8,  "name": "Freedom",          "start": 625,  "end": 768,  "sec": "0:26-0:32"},
    {"id": 9,  "name": "Network_flythru",  "start": 769,  "end": 912,  "sec": "0:32-0:38"},
    {"id": 10, "name": "Brand_reveal",     "start": 913,  "end": 1080, "sec": "0:38-0:45"},
]

FRAME_START = SHOTS[0]["start"]
FRAME_END = SHOTS[-1]["end"]

# --------------------------------------------------------------------------- #
#  Brand copy
# --------------------------------------------------------------------------- #
BRAND_NAME = "EMLAUNCHPAD"
BRAND_TAGLINE_1 = "Your AI Workforce."
BRAND_TAGLINE_2 = "Always Working."

# --------------------------------------------------------------------------- #
#  Global toggles
# --------------------------------------------------------------------------- #
BUILD_PARTICLES = True         # AI network particle systems
BUILD_VOLUMETRICS = True       # atmospheric fog
USE_MOTION_BLUR = True

def resolution():
    """Return the (x, y) pixel resolution for the active QUALITY preset."""
    return RESOLUTIONS[QUALITY]
