"""
particles.py
============
Glowing particle systems for the AI network: an emitter shell around the core
that sprays thousands of small light motes, plus drifting "data dust" filling
the room during the AI-activation and automation beats.

Uses Blender's particle system with tiny emissive ico-sphere instances so the
motes bloom. Particle systems are added via operators (they need object
context), then tuned through the settings data-block.
"""

import bpy
from . import utils, materials
from .utils import key
from config import COL, BUILD_PARTICLES


def _mote(col):
    """The instanced glowing mote used as particle render object."""
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.02, subdivisions=1,
                                           location=(0, -50, -50))
    m = bpy.context.active_object
    m.name = "PARTICLE_MOTE"
    bpy.ops.object.shade_smooth()
    utils.move_to(m, col)
    m.data.materials.append(materials.emission("M_Mote", COL["cyan"], 22.0))
    m.hide_render = True   # only its instances render
    return m


def build(ai_reg):
    """
    Attach particle systems. `ai_reg` is the registry from ai_network.build().
    Returns the emitter objects (mostly for completeness).
    """
    if not BUILD_PARTICLES:
        return {}

    col = utils.collection("PARTICLES")
    mote = _mote(col)

    core = ai_reg["core"]

    # --- Core spray: motes stream outward as the AI activates ------------- #
    bpy.ops.object.select_all(action="DESELECT")
    core.select_set(True)
    bpy.context.view_layer.objects.active = core
    bpy.ops.object.particle_system_add()
    psys = core.particle_systems[-1]
    psys.name = "AI_Spray"
    ps = psys.settings
    ps.name = "PS_AI_Spray"
    ps.count = 7000
    ps.frame_start = 385      # AI birth
    ps.frame_end = 620        # through automation
    ps.lifetime = 90
    ps.lifetime_random = 0.5
    ps.emit_from = "FACE"
    ps.physics_type = "NEWTON"
    ps.normal_factor = 2.2
    ps.factor_random = 1.4
    ps.effector_weights.gravity = 0.0
    ps.particle_size = 1.0
    ps.size_random = 0.7
    ps.render_type = "OBJECT"
    ps.instance_object = mote
    ps.use_rotations = True
    ps.rotation_factor_random = 1.0

    # --- Ambient data dust: slow drift filling the room ------------------- #
    bpy.ops.mesh.primitive_cube_add(size=8, location=(0, 0, 2.5))
    dust_emit = bpy.context.active_object
    dust_emit.name = "DUST_EMITTER"
    dust_emit.display_type = "WIRE"
    dust_emit.hide_render = True
    utils.move_to(dust_emit, col)

    bpy.ops.object.select_all(action="DESELECT")
    dust_emit.select_set(True)
    bpy.context.view_layer.objects.active = dust_emit
    bpy.ops.object.particle_system_add()
    dsys = dust_emit.particle_systems[-1]
    dsys.name = "Data_Dust"
    d = dsys.settings
    d.name = "PS_Data_Dust"
    d.count = 1500
    d.frame_start = 300
    d.frame_end = 1000
    d.lifetime = 400
    d.emit_from = "VOLUME"
    d.physics_type = "NEWTON"
    d.normal_factor = 0.0
    d.factor_random = 0.15
    d.effector_weights.gravity = 0.0
    d.particle_size = 0.4
    d.size_random = 0.8
    d.render_type = "OBJECT"
    d.instance_object = mote

    return {"mote": mote, "core_spray": psys, "dust": dsys,
            "collection": col}
