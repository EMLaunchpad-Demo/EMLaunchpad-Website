"""
lighting.py
===========
Cinematic lighting rig:
  * procedural HDRI-style world (gradient dome, no external .hdr needed)
  * key / fill / rim area lights
  * practical warm lights for the "freedom" beat
  * animated cool<->warm world colour grade across the film
  * global volumetric fog for light shafts

All lights live in the "LIGHTS" collection.
"""

import bpy
from . import utils
from .utils import srgb_hex, key
from config import COL, BUILD_VOLUMETRICS


def _world_gradient():
    """Dark blue procedural environment: a subtle top-down sky gradient."""
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = 0.12

    # Gradient driven by the sky-facing component of the view vector.
    tex = nt.nodes.new("ShaderNodeTexGradient")
    tex.gradient_type = "SPHERICAL"
    mapping = nt.nodes.new("ShaderNodeMapping")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = srgb_hex("#02060F")
    ramp.color_ramp.elements[1].color = srgb_hex(COL["deep_blue"])

    nt.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
    nt.links.new(tex.outputs["Color"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    return bg


def _area(col, name, loc, energy, color, size=3.0, rot=(0, 0, 0)):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.color = srgb_hex(color)[:3]
    data.size = size
    obj = utils.link_new(data, col, name)
    obj.location = loc
    obj.rotation_euler = rot
    return obj


def _spot(col, name, loc, energy, color, spot_size=0.9, rot=(0, 0, 0)):
    data = bpy.data.lights.new(name, "SPOT")
    data.energy = energy
    data.color = srgb_hex(color)[:3]
    data.spot_size = spot_size
    data.spot_blend = 0.5
    obj = utils.link_new(data, col, name)
    obj.location = loc
    obj.rotation_euler = rot
    return obj


def build():
    """Create the full lighting rig and animate the cool->warm grade."""
    col = utils.collection("LIGHTS")
    bg = _world_gradient()

    # --- Key light: cool, high, camera-left. Small + bright for contrast -- #
    key_light = _area(col, "KEY", (-4.5, -3.0, 5.0), 260.0, COL["white"],
                      size=2.5, rot=(0.9, 0.0, -0.5))

    # --- Fill: very soft cyan bounce so shadows stay deep & moody --------- #
    fill = _area(col, "FILL", (5.0, -2.0, 3.0), 35.0, COL["cyan"],
                 size=7.0, rot=(1.0, 0.0, 0.6))

    # --- Rim / back light: strong electric-blue separation ---------------- #
    rim = _area(col, "RIM", (0.0, 5.0, 4.5), 320.0, COL["electric"],
                size=2.0, rot=(-1.1, 0.0, 0.0))

    # --- Dedicated rim spot on the figure: reads the silhouette as intent - #
    fig_rim = _spot(col, "FIG_RIM", (-1.6, 3.4, 3.2), 900.0, COL["cyan"],
                    spot_size=0.8, rot=(-1.0, 0.0, -0.4))
    head = bpy.data.objects.get("FIG_head")
    if head:
        utils.track_to(fig_rim, head)

    # --- Practical warm lamp (off during chaos, on during freedom) -------- #
    warm = _spot(col, "PRACTICAL_WARM", (2.6, -1.2, 2.6), 0.0, COL["warm"],
                 spot_size=1.4, rot=(1.1, 0.0, 0.7))

    # Warm practical fades in for the "Freedom" beat (shot 8: 625-768).
    warm.data.energy = 0.0
    key(warm.data, "energy", 480)
    warm.data.energy = 0.0
    key(warm.data, "energy", 620)
    warm.data.energy = 420.0
    key(warm.data, "energy", 700, easing="EASE_OUT")
    warm.data.energy = 380.0
    key(warm.data, "energy", 1080)

    # Cool key dims slightly as warmth takes over.
    key(key_light.data, "energy", 620)
    key_light.data.energy = 90.0
    key(key_light.data, "energy", 720)

    # --- World grade animation: darker/cooler through chaos -> lift at end - #
    # Dip world strength to near-black at the "Freeze" (shot 5) then swell
    # as the AI core is born (shot 6). Shader-node sockets are keyframed
    # directly on the socket (not via an object data-path string).
    strength = bg.inputs["Strength"]
    for f, v in ((1, 0.06), (360, 0.02), (470, 0.14), (1080, 0.09)):
        strength.default_value = v
        strength.keyframe_insert("default_value", frame=f)

    if BUILD_VOLUMETRICS:
        _volumetric_fog(col)

    return col


def _volumetric_fog(col):
    """A large domain cube with Principled Volume for cinematic light shafts."""
    bpy.ops.mesh.primitive_cube_add(size=40, location=(0, 0, 6))
    dom = bpy.context.active_object
    dom.name = "FOG_DOMAIN"
    utils.move_to(dom, col)
    dom.display_type = "WIRE"
    dom.hide_select = True

    mat = bpy.data.materials.new("M_Fog")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = 0.012
    vol.inputs["Color"].default_value = srgb_hex(COL["deep_blue"])
    nt.links.new(vol.outputs["Volume"], out.inputs["Volume"])
    dom.data.materials.append(mat)

    # Enable Eevee volumetrics if available (version-robust).
    eevee = bpy.context.scene.eevee
    for attr, val in (("use_volumetric_shadows", True),
                      ("volumetric_tile_size", "8")):
        if hasattr(eevee, attr):
            try:
                setattr(eevee, attr, val)
            except Exception:
                pass
    return dom
