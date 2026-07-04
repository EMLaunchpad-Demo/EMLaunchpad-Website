"""
branding.py
===========
Shot 10 end-frame: the EMLaunchpad logotype + tagline emerging from black
with a cyan glow. Built far from the set (z ~= 100) on its own black backdrop
so nothing from the room leaks into frame.

Layout faces -Y (toward CAM_10 which sits at y=-5, z=100 looking +Y).
"""

import bpy
from . import utils, materials
from .utils import key
from config import COL, BRAND_NAME, BRAND_TAGLINE_1, BRAND_TAGLINE_2


CENTER = (0.0, 2.5, 100.0)   # brand stage origin
FACE_ROT = (1.5708, 0, 0)    # text plane stands upright, faces -Y


def _text(name, body, z_off, size, color, strength, col, parent,
          x_off=0.0):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.size = size
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    o = utils.link_new(cu, col, name)
    o.rotation_euler = FACE_ROT
    # Local offset; the BRAND_ROOT (at CENTER) supplies the world position.
    o.location = (x_off, 0.0, z_off)
    o.data.materials.append(materials.emission(f"M_{name}", color, strength))
    o.parent = parent
    return o


def build():
    col = utils.collection("BRAND")
    root = utils.empty("BRAND_ROOT", CENTER, col)

    # Black backdrop that fills the frame behind the logo.
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
    bd = bpy.context.active_object
    bd.name = "BRAND_BACKDROP"
    bd.rotation_euler = FACE_ROT
    utils.move_to(bd, col)
    bd.data.materials.append(materials.emission("M_Black", "#000000", 0.0))
    bd.parent = root
    bd.matrix_parent_inverse.identity()
    bd.location = (0, 8, 0)   # local: behind the text relative to camera

    # A subtle glowing accent line under the wordmark.
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
    line = bpy.context.active_object
    line.name = "BRAND_LINE"
    line.rotation_euler = FACE_ROT
    line.scale = (2.2, 0.006, 1)
    utils.move_to(line, col)
    line.data.materials.append(materials.emission("M_BrandLine",
                                                  COL["cyan"], 9.0))
    line.parent = root
    line.matrix_parent_inverse.identity()
    line.location = (0, 0, -0.35)   # local offset under the wordmark

    # Wordmark + taglines.
    logo = _text("BRAND_LOGO", BRAND_NAME, 0.35, 0.55, COL["white"], 7.0,
                 col, root)
    tag1 = _text("BRAND_TAG1", BRAND_TAGLINE_1, -0.7, 0.2, COL["cyan"], 5.0,
                 col, root)
    tag2 = _text("BRAND_TAG2", BRAND_TAGLINE_2, -1.0, 0.2, COL["cyan"], 5.0,
                 col, root)

    elems = [logo, line, tag1, tag2]

    # Everything starts invisible (scale 0) and rises in on black.
    reveal = [(logo, 930, 968), (line, 950, 985),
              (tag1, 985, 1015), (tag2, 1005, 1035)]
    for obj, f0, f1 in reveal:
        obj_scale = tuple(obj.scale)
        obj.scale = (0.0, 0.0, 0.0)
        key(obj, "scale", f0)
        obj.scale = obj_scale if obj_scale != (0, 0, 0) else (1, 1, 1)
        key(obj, "scale", f1, easing="EASE_OUT")

    # Glow swell then gentle settle on the wordmark.
    lm = logo.data.materials[0]
    from .animation import flash
    flash(lm, [(930, 0.0), (968, 12.0), (1000, 7.0), (1080, 7.0)])

    # Soft fade-to-black at the very end.
    bd_mat = bd.data.materials[0]
    # (backdrop already black; fade the logo/taglines out on the last beat)
    for obj in (logo, tag1, tag2, line):
        obj.scale = tuple(obj.scale)
        key(obj, "scale", 1050)
        obj.scale = (obj.scale.x, obj.scale.y, obj.scale.z)
        key(obj, "scale", 1068)
        obj.scale = (0.0, 0.0, 0.0)
        key(obj, "scale", 1080, easing="EASE_IN")

    return {"root": root, "logo": logo, "collection": col, "backdrop": bd}
