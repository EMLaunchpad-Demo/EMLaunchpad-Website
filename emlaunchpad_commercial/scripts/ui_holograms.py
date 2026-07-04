"""
ui_holograms.py
===============
Procedural, animated "fake but realistic" UI: WhatsApp chat, Instagram DM,
a CRM dashboard, a calendar/booking grid, plus notification toasts, missed
calls and review stars.

Each panel is a holographic card (rounded plane + glow border) populated with
emissive text objects and simple shape widgets — no image textures required.
Panels are returned so the animation module can float, spawn and dismiss them.

All panels live under the "UI" collection and are parented to per-panel EMPTY
anchors so they can be moved/scaled as single units.
"""

import bpy
from . import utils, materials
from .utils import srgb_hex
from config import COL


def _text(name, body, loc, col, size=0.06, color=COL["white"],
          strength=5.0, align="LEFT", parent=None):
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = body
    curve.size = size
    curve.align_x = align
    o = utils.link_new(curve, col, name)
    o.location = loc
    o.data.materials.append(materials.emission(f"M_{name}", color, strength))
    if parent:
        o.parent = parent
    return o


def _card(name, w, h, loc, col, base_color=COL["deep_blue"],
          border_color=COL["cyan"], parent=None):
    """A holo card = translucent body plane + emissive border frame."""
    anchor = utils.empty(f"{name}_anchor", loc, col)
    if parent:
        anchor.parent = parent

    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
    body = bpy.context.active_object
    body.name = name
    body.scale = (w * 0.5, h * 0.5, 1)
    body.rotation_euler = (1.5708, 0, 0)   # stand upright, facing -Y
    utils.move_to(body, col)
    body.data.materials.append(
        materials.hologram(f"M_{name}", color=base_color, strength=2.4,
                           alpha=0.28))
    body.parent = anchor

    # Border frame (thin emissive box outline via 4 strips).
    bm = materials.emission(f"M_{name}_border", border_color, 13.0)
    t = 0.01
    for sn, sc, ln in (("T", (w * 0.5, t, 0), (0, 0, h * 0.5)),
                       ("B", (w * 0.5, t, 0), (0, 0, -h * 0.5)),
                       ("L", (t, h * 0.5, 0), (-w * 0.5, 0, 0)),
                       ("R", (t, h * 0.5, 0), (w * 0.5, 0, 0))):
        bpy.ops.mesh.primitive_plane_add(size=1, location=ln)
        e = bpy.context.active_object
        e.name = f"{name}_edge{sn}"
        e.scale = sc
        e.rotation_euler = (1.5708, 0, 0)
        utils.move_to(e, col)
        e.data.materials.append(bm)
        e.parent = anchor
    return anchor


# --------------------------------------------------------------------------- #
#  Concrete panels
# --------------------------------------------------------------------------- #
def whatsapp(col, loc):
    a = _card("UI_WhatsApp", 1.0, 1.3, loc, col,
              base_color="#062018", border_color=COL["wa_green"])
    _text("WA_title", "WhatsApp  •  Business", (-0.42, -0.02, 0.55), col,
          0.06, COL["wa_green"], 6, parent=a)
    lines = [
        ("Klant: Zijn jullie open vandaag?", COL["white"], -0.42, 0.35),
        ("Kan ik een afspraak maken?", COL["white"], -0.42, 0.18),
        ("Hallo? Iemand daar?", COL["white"], -0.42, 0.01),
        ("Nog steeds geen antwoord...", "#9AA3AD", -0.42, -0.16),
    ]
    bubbles = []
    for i, (txt, c, x, y) in enumerate(lines):
        b = _text(f"WA_msg{i}", txt, (x, -0.02, y), col, 0.045, c, 4,
                  parent=a)
        bubbles.append(b)
    return {"anchor": a, "bubbles": bubbles, "kind": "whatsapp"}


def instagram(col, loc):
    a = _card("UI_Instagram", 1.0, 1.3, loc, col,
              base_color="#1A0A14", border_color=COL["ig_pink"])
    _text("IG_title", "Instagram  •  Direct", (-0.42, -0.02, 0.55), col,
          0.06, COL["ig_pink"], 6, parent=a)
    lines = [
        "DM: Hoeveel kost een behandeling?",
        "DM: Doen jullie ook zaterdag?",
        "DM: Interesse in samenwerking!",
        "12 nieuwe berichten",
    ]
    bubbles = []
    for i, txt in enumerate(lines):
        c = COL["ig_pink"] if i == 3 else COL["white"]
        b = _text(f"IG_msg{i}", txt, (-0.42, -0.02, 0.32 - i * 0.17), col,
                  0.045, c, 4, parent=a)
        bubbles.append(b)
    return {"anchor": a, "bubbles": bubbles, "kind": "instagram"}


def missed_calls(col, loc):
    a = _card("UI_Calls", 0.8, 1.0, loc, col,
              base_color="#200606", border_color=COL["red"])
    _text("CALL_title", "Gemiste oproepen", (0, -0.02, 0.4), col, 0.06,
          COL["red"], 6, align="CENTER", parent=a)
    _text("CALL_count", "7", (0, -0.02, 0.05), col, 0.28, COL["red"], 9,
          align="CENTER", parent=a)
    _text("CALL_sub", "Onbeantwoord", (0, -0.02, -0.28), col, 0.05,
          "#FF9A93", 4, align="CENTER", parent=a)
    return {"anchor": a, "kind": "calls"}


def reviews(col, loc):
    a = _card("UI_Reviews", 0.95, 0.7, loc, col,
              base_color="#201A06", border_color=COL["warm"])
    _text("REV_title", "Google Reviews", (-0.4, -0.02, 0.18), col, 0.055,
          COL["warm"], 6, parent=a)
    _text("REV_stars", "★ ★ ★ ★ ☆", (-0.4, -0.02, 0.0), col, 0.07,
          COL["warm"], 6, parent=a)
    _text("REV_sub", "Nieuwe review wacht op antwoord", (-0.4, -0.02, -0.18),
          col, 0.04, "#E8D8B0", 3, parent=a)
    return {"anchor": a, "kind": "reviews"}


def crm_dashboard(col, loc):
    """CRM board that fills with tagged leads as the AI works."""
    a = _card("UI_CRM", 1.6, 1.0, loc, col,
              base_color="#04121F", border_color=COL["electric"])
    _text("CRM_title", "EMLaunchpad CRM  —  Leads", (-0.72, -0.02, 0.4), col,
          0.055, COL["electric"], 6, parent=a)
    cols = ["Nieuw", "Contacted", "Booked"]
    for ci, cn in enumerate(cols):
        _text(f"CRM_col{ci}", cn, (-0.55 + ci * 0.52, -0.02, 0.24), col,
              0.045, COL["cyan"], 5, parent=a)
    # Lead cards appear one by one (animation reveals them).
    lead_cards = []
    names = ["Kapsalon Lucy", "Tandarts Peeters", "Bistro Nord",
             "Makelaar VITA", "Garage Berg", "Salon Zoë"]
    for i, nm in enumerate(names):
        ci = i % 3
        row = i // 3
        c = _text(f"CRM_lead{i}", "• " + nm,
                  (-0.55 + ci * 0.52, -0.02, 0.06 - row * 0.16), col,
                  0.035, COL["white"], 4, parent=a)
        c.scale = (0, 0, 0)   # start hidden, animation pops them in
        lead_cards.append(c)
    return {"anchor": a, "leads": lead_cards, "kind": "crm"}


def calendar(col, loc):
    """A week grid whose slots fill with bookings under AI control."""
    a = _card("UI_Calendar", 1.5, 1.0, loc, col,
              base_color="#04121F", border_color=COL["cyan"])
    _text("CAL_title", "Agenda  —  Deze week", (-0.68, -0.02, 0.4), col,
          0.05, COL["cyan"], 6, parent=a)
    days = ["Ma", "Di", "Wo", "Do", "Vr"]
    slot_mat_free = materials.hologram("M_slot_free", "#0A2A44", 1.2, 0.3)
    slots = []
    for d, dn in enumerate(days):
        _text(f"CAL_d{d}", dn, (-0.6 + d * 0.3, -0.02, 0.24), col, 0.04,
              COL["cyan"], 4, parent=a)
        for r in range(3):
            bpy.ops.mesh.primitive_plane_add(size=1)
            s = bpy.context.active_object
            s.name = f"CAL_slot_{d}_{r}"
            s.scale = (0.12, 0.06, 1)
            s.rotation_euler = (1.5708, 0, 0)
            s.location = (0, 0, 0)
            utils.move_to(s, col)
            s.parent = a
            s.matrix_parent_inverse.identity()
            s.location = (-0.6 + d * 0.3, -0.015, 0.08 - r * 0.16)
            # give each its own material instance so we can light it green
            m = materials.hologram(f"M_CAL_slot_{d}_{r}", "#0A2A44", 1.2, 0.3)
            s.data.materials.append(m)
            slots.append(s)
    return {"anchor": a, "slots": slots, "kind": "calendar"}


def voice_agent(col, loc):
    """A round 'AI voice answering' widget with an animated waveform."""
    a = _card("UI_Voice", 0.9, 0.8, loc, col,
              base_color="#04121F", border_color=COL["cyan"])
    _text("VOICE_title", "AI Voice Agent", (0, -0.02, 0.24), col, 0.05,
          COL["cyan"], 6, align="CENTER", parent=a)
    _text("VOICE_sub", "Oproep beantwoord…", (0, -0.02, -0.22), col, 0.04,
          "#9FE8FF", 4, align="CENTER", parent=a)
    bars = []
    bmat = materials.emission("M_VoiceBar", COL["cyan"], 7)
    for i in range(9):
        bpy.ops.mesh.primitive_cube_add(size=1)
        b = bpy.context.active_object
        b.name = f"VOICE_bar{i}"
        b.scale = (0.012, 0.012, 0.05)
        utils.move_to(b, col)
        b.data.materials.append(bmat)
        b.parent = a
        b.matrix_parent_inverse.identity()
        b.location = (-0.16 + i * 0.04, -0.02, 0.0)
        bars.append(b)
    return {"anchor": a, "bars": bars, "kind": "voice"}


def notification_toast(col, name, text, loc, accent=COL["cyan"]):
    """Small floating notification pill used in the chaos montage."""
    a = _card(name, 0.7, 0.16, loc, col,
              base_color="#06121E", border_color=accent)
    _text(f"{name}_txt", text, (-0.3, -0.02, 0.0), col, 0.035, COL["white"],
          4.5, parent=a)
    return {"anchor": a, "kind": "toast"}


# --------------------------------------------------------------------------- #
def build():
    """Instantiate every UI panel at rest positions; return a registry."""
    col = utils.collection("UI")
    reg = {"collection": col}

    reg["whatsapp"] = whatsapp(col, (1.6, 1.0, 1.7))
    reg["instagram"] = instagram(col, (-1.8, 1.2, 1.9))
    reg["calls"] = missed_calls(col, (2.4, 0.4, 1.3))
    reg["reviews"] = reviews(col, (-2.4, 0.6, 1.2))
    reg["crm"] = crm_dashboard(col, (0.0, 1.6, 1.6))
    reg["calendar"] = calendar(col, (2.2, 1.4, 1.5))
    reg["voice"] = voice_agent(col, (-2.2, 1.4, 1.6))

    # A cloud of small notification toasts for the chaos peak.
    toast_texts = [
        ("New WhatsApp message", COL["wa_green"]),
        ("Instagram: new DM", COL["ig_pink"]),
        ("Missed call", COL["red"]),
        ("New email (23)", COL["cyan"]),
        ("Google review", COL["warm"]),
        ("Booking request", COL["electric"]),
        ("Reminder: reply!", COL["red"]),
        ("New follower", COL["ig_pink"]),
    ]
    reg["toasts"] = []
    import math
    for i, (txt, acc) in enumerate(toast_texts):
        ang = i / len(toast_texts) * math.tau
        loc = (math.sin(ang) * 2.6, 1.0 + (i % 3) * 0.2,
               1.2 + math.cos(ang) * 0.9)
        reg["toasts"].append(
            notification_toast(col, f"TOAST_{i}", txt, loc, acc))

    return reg
