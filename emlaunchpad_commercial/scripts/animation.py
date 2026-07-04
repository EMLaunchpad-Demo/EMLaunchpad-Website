"""
animation.py
============
Ties story beats to objects: notification flashes, panel spawn/float/freeze/
dismiss, the AI core's birth, and the automation choreography (CRM leads
populating, calendar slots booking, voice waveform, auto-replies).

All timing is authored against the shot frame ranges in config.SHOTS. Motion
is eased (Bezier/Sine) via utils.key; nothing moves linearly.
"""

import math
import bpy
from mathutils import Vector
from . import utils, materials
from .utils import key, add_noise
from config import COL


# --------------------------------------------------------------------------- #
#  Small helpers
# --------------------------------------------------------------------------- #
def _emission_node(mat):
    if not mat or not mat.use_nodes:
        return None
    for n in mat.node_tree.nodes:
        if n.type == "EMISSION":
            return n
    return None


def flash(mat, keys):
    """Keyframe an emission material's Strength. `keys` = [(frame, value), ...]."""
    em = _emission_node(mat)
    if not em:
        return
    inp = em.inputs["Strength"]
    for f, v in keys:
        inp.default_value = v
        inp.keyframe_insert("default_value", frame=f)


def pop(obj, f0, f1, to=1.0, frm=0.0, easing="EASE_OUT", hold_before=True):
    """Scale-pop an object in (or out) between two frames."""
    if hold_before:
        obj.scale = (frm, frm, frm)
        key(obj, "scale", max(1, f0 - 1))
    obj.scale = (frm, frm, frm)
    key(obj, "scale", f0)
    obj.scale = (to, to, to)
    key(obj, "scale", f1, easing=easing)


def float_drift(anchor, amp=0.04, scale=22):
    """Add gentle handheld-style drift so panels feel alive (not static)."""
    # Seed a couple of location keys so an F-curve exists, then noise-modulate.
    base = tuple(anchor.location)
    anchor.location = base
    key(anchor, "location", 169)
    anchor.location = base
    key(anchor, "location", 768)
    add_noise(anchor, "location", strength=amp, scale=scale)


# --------------------------------------------------------------------------- #
#  Master orchestration
# --------------------------------------------------------------------------- #
def animate(env, ui, ai):
    _shot1_phone(env)
    _shots34_chaos(ui)
    _shot5_freeze(ui)
    _shot6_ai_birth(ai, ui)
    _shot7_automation(ui, ai)
    _shot8_freedom(env, ui, ai)


# ---- Shot 1: buzzing phone ------------------------------------------------ #
def _shot1_phone(env):
    scr = env["phone_screen"]
    mat = scr.data.materials[0] if scr.data.materials else None
    # Three escalating notification flashes lighting the dark room.
    flash(mat, [(1, 0.4), (10, 6.0), (16, 0.8),
                (26, 7.0), (33, 0.9),
                (44, 8.0), (52, 1.0),
                (72, 1.2)])
    # Tiny buzz shake on the phone itself.
    ph = env["phone"]
    base = tuple(ph.location)
    for i, f in enumerate(range(6, 60, 6)):
        ph.location = (base[0] + (0.004 if i % 2 else -0.004), base[1],
                       base[2])
        key(ph, "location", f, interp="LINEAR")
    ph.location = base
    key(ph, "location", 72)


# ---- Shots 3 & 4: chaos montage + holo swarm ------------------------------ #
def _shots34_chaos(ui):
    # Main panels pop in during the montage, staggered.
    stagger = [
        (ui["whatsapp"], 172, 184),
        (ui["instagram"], 180, 192),
        (ui["calls"], 190, 202),
        (ui["reviews"], 198, 210),
        (ui["crm"], 214, 228),
        (ui["calendar"], 222, 236),
        (ui["voice"], 244, 258),
    ]
    for panel, f0, f1 in stagger:
        pop(panel["anchor"], f0, f1)
        float_drift(panel["anchor"])

    # Toast swarm pops in fast and dense through the chaos peak.
    for i, toast in enumerate(ui["toasts"]):
        f0 = 176 + i * 6
        pop(toast["anchor"], f0, f0 + 8)
        add_noise(toast["anchor"], "location", strength=0.05, scale=20,
                  phase=i * 3.0)


# ---- Shot 5: freeze ------------------------------------------------------- #
def _shot5_freeze(ui):
    # Everything simply holds its last keyed value from ~312 through 384.
    # We anchor an explicit hold key so no drift leaks in during the freeze.
    for panel in list(ui["toasts"]) + [ui[k] for k in
                                       ("whatsapp", "instagram", "calls",
                                        "reviews", "crm", "calendar",
                                        "voice")]:
        a = panel["anchor"]
        a.scale = a.scale
        key(a, "scale", 313, interp="CONSTANT")
        key(a, "scale", 384, interp="CONSTANT")


# ---- Shot 6: AI core birth ------------------------------------------------ #
def _shot6_ai_birth(ai, ui):
    core, shell, root = ai["core"], ai["shell"], ai["root"]
    # Core grows from a single point of light.
    for obj, f0, f1 in ((core, 388, 470), (shell, 400, 478)):
        obj.scale = (0.001, 0.001, 0.001)
        key(obj, "scale", 388)
        obj.scale = (1, 1, 1)
        key(obj, "scale", f1, easing="EASE_OUT")

    # Node lattice + links spring outward slightly after the core.
    for i, nd in enumerate(ai["nodes"]):
        f0 = 430 + (i % 10) * 3
        pop(nd, f0, f0 + 20, easing="EASE_OUT")
    for i, ln in enumerate(ai["lines"]):
        f0 = 440 + (i % 12) * 3
        ln.scale = (1, 1, 0.001)
        key(ln, "scale", f0, index=2)
        ln.scale = (1, 1, 1)
        key(ln, "scale", f0 + 18, index=2, easing="EASE_OUT")

    # Chaos toasts get "absorbed" into the core (shrink toward centre).
    center = Vector((0, 0.4, 1.5))
    for i, toast in enumerate(ui["toasts"]):
        a = toast["anchor"]
        a.location = a.location  # current
        key(a, "location", 400)
        a.location = tuple(center)
        key(a, "location", 452 + i * 2, easing="EASE_IN")
        a.scale = (1, 1, 1)
        key(a, "scale", 400)
        a.scale = (0, 0, 0)
        key(a, "scale", 452 + i * 2, easing="EASE_IN")


# ---- Shot 7: automation choreography -------------------------------------- #
def _shot7_automation(ui, ai):
    col = ui["collection"]

    # CRM leads pop in one by one as the AI tags them.
    for i, lead in enumerate(ui["crm"]["leads"]):
        f0 = 492 + i * 18
        pop(lead, f0, f0 + 12, to=1.0)

    # Calendar: spawn green "booked" blocks on a subset of slots.
    booked_mat = materials.emission("M_Booked", COL["wa_green"], 6.0)
    slots = ui["calendar"]["slots"]
    booked_indices = list(range(0, len(slots), 2))
    for j, si in enumerate(booked_indices):
        slot = slots[si]
        bpy.ops.mesh.primitive_plane_add(size=1)
        blk = bpy.context.active_object
        blk.name = f"CAL_booked_{si}"
        blk.rotation_euler = (1.5708, 0, 0)
        utils.move_to(blk, col)
        blk.parent = ui["calendar"]["anchor"]
        blk.matrix_parent_inverse.identity()
        blk.location = (slot.location.x, slot.location.y - 0.002,
                        slot.location.z)
        blk.data.materials.append(booked_mat)
        f0 = 500 + j * 16
        blk.scale = (0, 0, 0)
        key(blk, "scale", f0)
        blk.scale = (0.11, 0.05, 1)
        key(blk, "scale", f0 + 12, easing="EASE_OUT")

    # Voice agent waveform: oscillate bar heights across the beat.
    for i, bar in enumerate(ui["voice"]["bars"]):
        base = bar.scale.z
        f = 481
        step = 8
        phase = i * 0.6
        while f <= 624:
            h = base * (0.4 + 1.6 * abs(math.sin(phase + f * 0.15)))
            bar.scale = (bar.scale.x, bar.scale.y, h)
            key(bar, "scale", f, interp="SINE", index=2)
            f += step

    # Auto-reply confirmations pop in on the messaging panels.
    from .ui_holograms import _text
    for panel_key, txt, acc in (("whatsapp", "✓ AI beantwoord",
                                 COL["wa_green"]),
                                ("instagram", "✓ AI beantwoord",
                                 COL["ig_pink"])):
        a = ui[panel_key]["anchor"]
        t = _text(f"{panel_key}_autoreply", txt, (0.0, -0.05, -0.62), col,
                  0.05, acc, 6, align="CENTER", parent=a)
        pop(t, 520, 540)


# ---- Shot 8: freedom ------------------------------------------------------ #
def _shot8_freedom(env, ui, ai):
    # Dismiss every UI panel: they gracefully shrink away as calm returns.
    for k in ("whatsapp", "instagram", "calls", "reviews", "crm",
              "calendar", "voice"):
        a = ui[k]["anchor"]
        a.scale = a.scale
        key(a, "scale", 636)
        a.scale = (0, 0, 0)
        key(a, "scale", 700, easing="EASE_IN")

    # AI core settles into a small, calm persistent glow near the desk.
    core, shell = ai["core"], ai["shell"]
    core.scale = (1, 1, 1)
    key(core, "scale", 636)
    core.scale = (0.35, 0.35, 0.35)
    key(core, "scale", 720, easing="EASE_IN_OUT")
    shell.scale = (1, 1, 1)
    key(shell, "scale", 636)
    shell.scale = (0.001, 0.001, 0.001)
    key(shell, "scale", 700, easing="EASE_IN")

    # The entrepreneur relaxes: head lifts, shoulders ease.
    head = bpy.data.objects.get("FIG_head")
    torso = bpy.data.objects.get("FIG_torso")
    if head:
        head.rotation_euler = (0.18, 0, 0)   # slumped in chaos
        key(head, "rotation_euler", 300)
        key(head, "rotation_euler", 620)
        head.rotation_euler = (-0.05, 0, 0)  # lifted, at ease
        key(head, "rotation_euler", 720, easing="EASE_OUT")
    if torso:
        torso.rotation_euler = (0.06, 0, 0)
        key(torso, "rotation_euler", 620)
        torso.rotation_euler = (-0.02, 0, 0)
        key(torso, "rotation_euler", 730, easing="EASE_OUT")
