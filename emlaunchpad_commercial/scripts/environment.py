"""
environment.py
==============
Procedurally builds the set: a dark, contrasty small office / workspace,
the desk clutter (laptop, phone, coffee, scattered papers), and a stylised
entrepreneur silhouette figure.

The human is intentionally a clean, minimalist mannequin built from
primitives — a photoreal human would require external sculpted assets, and a
sleek silhouette fits the Apple/Tesla art direction. This is the one place we
approximate rather than model in full detail.

Everything is parented under an EMPTY named "SET_ROOT" so the whole set can be
transformed as a unit if needed.
"""

import bpy
from . import utils, materials
from .utils import srgb_hex


def _cube(name, size, loc, col, mat=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_cube_add(size=size, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    utils.move_to(o, col)
    if mat:
        o.data.materials.append(mat)
    return o


def _plane(name, size, loc, col, mat=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_plane_add(size=size, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.rotation_euler = rot
    utils.move_to(o, col)
    if mat:
        o.data.materials.append(mat)
    return o


def _figure(col, root):
    """Stylised seated entrepreneur silhouette from smooth primitives."""
    body_mat = materials.black_matte("M_Figure", color="#15181D", rough=0.5)
    parts = []

    # Torso
    bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=0.6,
                                        location=(0, 0, 1.15))
    torso = bpy.context.active_object
    torso.name = "FIG_torso"
    torso.scale = (1.0, 0.7, 1.0)

    # Head
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, location=(0, 0.02, 1.6))
    head = bpy.context.active_object
    head.name = "FIG_head"

    # Shoulders
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=(0.24, 0, 1.35))
    sh_l = bpy.context.active_object
    sh_l.name = "FIG_shoulderL"
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=(-0.24, 0, 1.35))
    sh_r = bpy.context.active_object
    sh_r.name = "FIG_shoulderR"

    # Arms resting toward the desk
    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.5,
                                        location=(0.28, -0.22, 1.15),
                                        rotation=(1.1, 0, 0))
    arm_l = bpy.context.active_object
    arm_l.name = "FIG_armL"
    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.5,
                                        location=(-0.28, -0.22, 1.15),
                                        rotation=(1.1, 0, 0))
    arm_r = bpy.context.active_object
    arm_r.name = "FIG_armR"

    for o in (torso, head, sh_l, sh_r, arm_l, arm_r):
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.shade_smooth()
        o.data.materials.append(body_mat)
        utils.move_to(o, col)
        o.parent = root
        parts.append(o)

    return parts


def build():
    """Construct the full set and return the SET_ROOT empty + key props."""
    col = utils.collection("SET")
    root = utils.empty("SET_ROOT", (0, 0, 0), col)

    # --- Materials -------------------------------------------------------- #
    m_floor = materials.cinematic_floor("M_Floor")   # reflective, premium
    m_wall = materials.black_matte("M_Wall", color="#0E1116", rough=0.8)
    m_desk = materials.brushed_aluminium("M_Desk")
    m_metal = materials.metal("M_DeskLegs", color="#3A3F45", rough=0.3)
    m_screen = materials.oled_display("M_LaptopScreen", color="#0A2540",
                                      strength=2.2)
    m_black = materials.black_matte("M_Plastic")
    m_glass = materials.glass("M_CupGlass", tint="#88CCFF")
    m_paper = materials.black_matte("M_Paper", color="#C8CDD4", rough=0.9)
    m_neon = materials.emission("M_NeonStrip", color="#00E5FF", strength=8.0)

    # --- Shell: floor + two walls (L-shaped, camera sees inside) ---------- #
    floor = _plane("FLOOR", 24, (0, 0, 0), col, m_floor)
    floor.parent = root
    back = _cube("WALL_BACK", 1, (0, 4.5, 3), col, m_wall,
                 scale=(12, 0.2, 6))
    back.parent = root
    side = _cube("WALL_SIDE", 1, (-6, 0, 3), col, m_wall,
                 scale=(0.2, 12, 6))
    side.parent = root

    # Neon accent strips (the "practical" AI glow) — these also streak across
    # the reflective floor, which sells the premium look.
    strip = _cube("NEON_STRIP", 1, (0, 4.35, 2.2), col, m_neon,
                  scale=(5.0, 0.03, 0.03))
    strip.parent = root
    strip_v = _cube("NEON_STRIP_V", 1, (-5.85, 0.0, 2.4), col,
                    materials.emission("M_NeonStripV", "#0A84FF", 7.0),
                    scale=(0.03, 4.0, 0.03))
    strip_v.parent = root
    strip_low = _cube("NEON_STRIP_LOW", 1, (0, 4.35, 0.06), col,
                      materials.emission("M_NeonStripLow", "#00E5FF", 5.0),
                      scale=(6.0, 0.03, 0.02))
    strip_low.parent = root

    # --- Desk ------------------------------------------------------------- #
    desk = _cube("DESK_TOP", 1, (0, 0, 0.75), col, m_desk,
                 scale=(1.7, 0.7, 0.03))
    desk.parent = root
    for i, (x, y) in enumerate([(1.5, 0.6), (-1.5, 0.6),
                                (1.5, -0.6), (-1.5, -0.6)]):
        leg = _cube(f"DESK_LEG_{i}", 1, (x, y, 0.37), col, m_metal,
                    scale=(0.04, 0.04, 0.37))
        leg.parent = root

    # --- Laptop ----------------------------------------------------------- #
    lap_base = _cube("LAPTOP_BASE", 1, (0, -0.15, 0.79), col, m_metal,
                     scale=(0.35, 0.24, 0.012))
    lap_base.parent = root
    lap_screen = _cube("LAPTOP_SCREEN", 1, (0, 0.09, 0.98), col, m_screen,
                       scale=(0.35, 0.012, 0.22))
    lap_screen.rotation_euler = (1.35, 0, 0)
    lap_screen.parent = root

    # --- Phone (hero of shot 1) ------------------------------------------- #
    phone = _cube("PHONE", 1, (0.6, -0.35, 0.775), col, m_black,
                  scale=(0.09, 0.18, 0.008))
    phone.parent = root
    phone_screen = _cube("PHONE_SCREEN", 1, (0.6, -0.35, 0.784), col,
                         materials.oled_display("M_PhoneScreen",
                                                color="#03060D", strength=1.0),
                         scale=(0.082, 0.17, 0.001))
    phone_screen.parent = root

    # --- Coffee cup ------------------------------------------------------- #
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.11,
                                        location=(-0.7, -0.25, 0.815))
    cup = bpy.context.active_object
    cup.name = "COFFEE_CUP"
    bpy.ops.object.shade_smooth()
    cup.data.materials.append(materials.black_matte("M_Cup", color="#EFEFEF",
                                                    rough=0.4))
    utils.move_to(cup, col)
    cup.parent = root

    # --- Scattered papers ------------------------------------------------- #
    import math
    for i in range(7):
        px = -1.0 + (i * 0.31) % 2.0
        py = -0.55 + ((i * 0.7) % 1.0) * 0.5
        rot = (0, 0, (i * 47) % 360 * math.pi / 180.0)
        p = _plane(f"PAPER_{i}", 0.3, (px, py, 0.771 + i * 0.001),
                   col, m_paper, rot=rot)
        p.parent = root

    # --- Figure ----------------------------------------------------------- #
    _figure(col, root)
    root["desk"] = desk.name  # note prop for reference

    return {
        "root": root,
        "phone": phone,
        "phone_screen": phone_screen,
        "laptop_screen": lap_screen,
        "cup": cup,
        "neon_strip": strip,
        "collection": col,
    }
