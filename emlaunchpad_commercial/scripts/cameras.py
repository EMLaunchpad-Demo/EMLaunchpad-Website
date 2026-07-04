"""
cameras.py
==========
One camera per shot, each with cinematic focal length + depth of field, its
own keyframed move (dolly / push-in / orbit / crane / rack-focus / parallax),
and bound to a timeline marker at the shot's start frame so the whole edit
renders in a single pass.

Camera moves use smooth Bezier easing (from utils.key). Handheld shots get an
F-Curve noise modifier for subtle shake.

`build(scene_refs)` receives references to key set/AI objects so cameras can
frame and focus on them. Returns the list of camera objects.
"""

import math
import bpy
from mathutils import Vector
from . import utils
from .utils import key, key_many, add_noise, track_to
from config import SHOTS


def _camera(name, col, lens=50.0, fstop=2.0):
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.dof.use_dof = True
    data.dof.aperture_fstop = fstop
    data.sensor_width = 36.0
    obj = utils.link_new(data, col, name)
    return obj


def _bind_markers(scene, cam_by_shot):
    """Create a timeline marker at each shot start and bind its camera."""
    for shot in SHOTS:
        mk = scene.timeline_markers.new(f"F_{shot['id']:02d}_{shot['name']}",
                                        frame=shot["start"])
        mk.camera = cam_by_shot[shot["id"]]


def build(refs):
    """
    refs keys used: 'phone', 'phone_screen', 'figure_head', 'ai_core',
    'ai_root', 'fly_root', 'fly_hub', 'brand_anchor'.
    Missing keys degrade gracefully (camera just won't track that target).
    """
    col = utils.collection("CAMERAS")
    scene = bpy.context.scene
    cams = {}

    focus_empty = refs.get("focus")  # optional shared focus empty

    # --------------------------------------------------------------------- #
    # SHOT 1 — Overwhelm: 85mm extreme close-up on the buzzing phone.
    # Slow push-in, shallow DOF, handheld shake.
    # --------------------------------------------------------------------- #
    c1 = _camera("CAM_01_phone", col, lens=85.0, fstop=1.6)
    phone = refs.get("phone")
    if phone:
        c1.data.dof.focus_object = phone
    key_many(c1, [
        {"path": "location", "frame": 1,  "value": (0.75, -0.7, 0.95)},
        {"path": "location", "frame": 72, "value": (0.68, -0.5, 0.9),
         "easing": "EASE_OUT"},
    ])
    key_many(c1, [
        {"path": "rotation_euler", "frame": 1,  "value": (1.32, 0, 0.15)},
        {"path": "rotation_euler", "frame": 72, "value": (1.30, 0, 0.12)},
    ])
    add_noise(c1, "location", strength=0.015, scale=14)
    add_noise(c1, "rotation_euler", strength=0.01, scale=12)
    cams[1] = c1

    # --------------------------------------------------------------------- #
    # SHOT 2 — Wide office: 35mm, slow dolly-in revealing the lone owner.
    # --------------------------------------------------------------------- #
    c2 = _camera("CAM_02_wide", col, lens=35.0, fstop=3.5)
    c2.data.dof.focus_distance = 6.5
    key_many(c2, [
        {"path": "location", "frame": 73,  "value": (3.2, -6.5, 2.2)},
        {"path": "location", "frame": 168, "value": (2.4, -5.2, 2.0),
         "easing": "EASE_IN_OUT"},
    ])
    key_many(c2, [
        {"path": "rotation_euler", "frame": 73,  "value": (1.35, 0, 0.42)},
        {"path": "rotation_euler", "frame": 168, "value": (1.37, 0, 0.36)},
    ])
    add_noise(c2, "location", strength=0.01, scale=10)
    cams[2] = c2

    # --------------------------------------------------------------------- #
    # SHOT 3 — Chaos montage: 50mm quick punch-ins toward UI panels.
    # Rapid stepped moves (per-beat) using near-CONSTANT holds + snaps.
    # --------------------------------------------------------------------- #
    c3 = _camera("CAM_03_montage", col, lens=50.0, fstop=2.2)
    c3.data.dof.focus_distance = 3.0
    beats = [
        (169, (1.4, -1.6, 1.8), (1.45, 0, 0.5)),
        (187, (-1.6, -1.4, 2.0), (1.45, 0, -0.5)),
        (205, (2.2, -1.0, 1.5), (1.5, 0, 0.7)),
        (223, (-2.0, -1.2, 1.4), (1.5, 0, -0.7)),
        (240, (0.2, -1.8, 1.9), (1.45, 0, 0.05)),
    ]
    for f, loc, rot in beats:
        c3.location = loc
        key(c3, "location", f, interp="BEZIER", easing="EASE_OUT")
        c3.rotation_euler = rot
        key(c3, "rotation_euler", f, interp="BEZIER", easing="EASE_OUT")
    add_noise(c3, "location", strength=0.02, scale=16)
    cams[3] = c3

    # --------------------------------------------------------------------- #
    # SHOT 4 — Holo swarm: 40mm slow ORBIT around the owner amid panels.
    # --------------------------------------------------------------------- #
    c4 = _camera("CAM_04_orbit", col, lens=40.0, fstop=2.8)
    c4.data.dof.focus_distance = 4.0
    pivot = Vector((0, 0.4, 1.4))
    radius = 4.2
    n = 5
    for i in range(n):
        f = 241 + int((312 - 241) * i / (n - 1))
        ang = math.radians(-40 + i * 24)
        c4.location = (pivot.x + math.sin(ang) * radius,
                       pivot.y - math.cos(ang) * radius,
                       2.1)
        key(c4, "location", f, interp="SINE", easing="EASE_IN_OUT")
    if "figure_head" in refs:
        c4.data.dof.focus_object = refs["figure_head"]
    t4 = utils.empty("CAM04_TARGET", tuple(pivot), col)
    track_to(c4, t4)
    cams[4] = c4

    # --------------------------------------------------------------------- #
    # SHOT 5 — Freeze: 50mm, notifications hang; very slow creep forward.
    # --------------------------------------------------------------------- #
    c5 = _camera("CAM_05_freeze", col, lens=50.0, fstop=2.0)
    c5.data.dof.focus_distance = 3.6
    key_many(c5, [
        {"path": "location", "frame": 313, "value": (0.0, -4.4, 1.9)},
        {"path": "location", "frame": 384, "value": (0.0, -3.9, 1.85),
         "interp": "SINE", "easing": "EASE_IN_OUT"},
    ])
    key_many(c5, [
        {"path": "rotation_euler", "frame": 313, "value": (1.5, 0, 0)},
        {"path": "rotation_euler", "frame": 384, "value": (1.5, 0, 0)},
    ])
    cams[5] = c5

    # --------------------------------------------------------------------- #
    # SHOT 6 — AI core birth: 35mm push-in toward the growing core,
    # rack focus from foreground to the core.
    # --------------------------------------------------------------------- #
    c6 = _camera("CAM_06_core", col, lens=35.0, fstop=1.8)
    key_many(c6, [
        {"path": "location", "frame": 385, "value": (0.0, -5.0, 1.6)},
        {"path": "location", "frame": 480, "value": (0.0, -2.6, 1.55),
         "easing": "EASE_IN_OUT"},
    ])
    key_many(c6, [
        {"path": "rotation_euler", "frame": 385, "value": (1.52, 0, 0)},
        {"path": "rotation_euler", "frame": 480, "value": (1.53, 0, 0)},
    ])
    # Rack focus: distant -> lands on the core. Keyframe on the camera DATA
    # (an ID with animation_data), using the "dof.focus_distance" sub-path.
    c6.data.dof.focus_distance = 6.0
    key(c6.data, "dof.focus_distance", 385)
    c6.data.dof.focus_distance = 4.0
    key(c6.data, "dof.focus_distance", 440, easing="EASE_IN_OUT")
    c6.data.dof.focus_distance = 2.7
    key(c6.data, "dof.focus_distance", 480)
    cams[6] = c6

    # --------------------------------------------------------------------- #
    # SHOT 7 — Automation: 45mm crane-up drifting across active UI panels.
    # --------------------------------------------------------------------- #
    c7 = _camera("CAM_07_automation", col, lens=45.0, fstop=2.6)
    c7.data.dof.focus_distance = 4.2
    key_many(c7, [
        {"path": "location", "frame": 481, "value": (-2.6, -4.6, 1.3)},
        {"path": "location", "frame": 560, "value": (0.0, -4.2, 2.0)},
        {"path": "location", "frame": 624, "value": (2.6, -4.4, 2.4),
         "easing": "EASE_IN_OUT"},
    ])
    t7 = utils.empty("CAM07_TARGET", (0, 1.2, 1.6), col)
    track_to(c7, t7)
    cams[7] = c7

    # --------------------------------------------------------------------- #
    # SHOT 8 — Freedom: 85mm intimate, gentle dolly, focus on the owner.
    # --------------------------------------------------------------------- #
    c8 = _camera("CAM_08_freedom", col, lens=85.0, fstop=1.8)
    if "figure_head" in refs:
        c8.data.dof.focus_object = refs["figure_head"]
    else:
        c8.data.dof.focus_distance = 3.4
    key_many(c8, [
        {"path": "location", "frame": 625, "value": (1.8, -3.4, 1.7)},
        {"path": "location", "frame": 768, "value": (1.3, -2.9, 1.65),
         "easing": "EASE_IN_OUT"},
    ])
    key_many(c8, [
        {"path": "rotation_euler", "frame": 625, "value": (1.46, 0, 0.32)},
        {"path": "rotation_euler", "frame": 768, "value": (1.47, 0, 0.28)},
    ])
    add_noise(c8, "location", strength=0.006, scale=8)
    cams[8] = c8

    # --------------------------------------------------------------------- #
    # SHOT 9 — Network fly-through: 28mm wide, fast dolly down the corridor.
    # --------------------------------------------------------------------- #
    c9 = _camera("CAM_09_flythru", col, lens=28.0, fstop=3.2)
    c9.data.dof.focus_distance = 8.0
    key_many(c9, [
        {"path": "location", "frame": 769, "value": (0.0, 6.0, 4.0)},
        {"path": "location", "frame": 912, "value": (0.0, 48.0, 4.0),
         "interp": "SINE", "easing": "EASE_IN"},
    ])
    key_many(c9, [
        {"path": "rotation_euler", "frame": 769, "value": (1.5708, 0, 0)},
        {"path": "rotation_euler", "frame": 912, "value": (1.5708, 0, 0)},
    ])
    cams[9] = c9

    # --------------------------------------------------------------------- #
    # SHOT 10 — Brand reveal: 50mm locked, slow push to the logo on black.
    # --------------------------------------------------------------------- #
    c10 = _camera("CAM_10_brand", col, lens=50.0, fstop=4.0)
    c10.data.dof.focus_distance = 5.0
    key_many(c10, [
        {"path": "location", "frame": 913,  "value": (0.0, -5.4, 100.0)},
        {"path": "location", "frame": 1080, "value": (0.0, -5.0, 100.0),
         "interp": "SINE", "easing": "EASE_OUT"},
    ])
    key_many(c10, [
        {"path": "rotation_euler", "frame": 913,  "value": (1.5708, 0, 0)},
        {"path": "rotation_euler", "frame": 1080, "value": (1.5708, 0, 0)},
    ])
    cams[10] = c10

    _bind_markers(scene, cams)
    scene.camera = cams[1]
    return cams
