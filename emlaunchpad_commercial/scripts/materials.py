"""
materials.py
============
PBR + emission material factory. Every material is procedural (no external
texture files) so the project is fully self-contained.

Public builders return a ready `bpy.types.Material`:
    glass, metal, brushed_aluminium, dark_concrete, black_matte,
    oled_display, hologram, emission, ai_energy
"""

import bpy
from . import utils
from .utils import srgb_hex, set_input, principled
from config import COL


# --------------------------------------------------------------------------- #
def _new(name):
    """Fresh node-based material (reused if it already exists)."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    return mat


# --------------------------------------------------------------------------- #
#  Surface PBR
# --------------------------------------------------------------------------- #
def metal(name="M_Metal", color=COL["aluminium"], rough=0.35):
    mat = _new(name)
    b = principled(mat)
    set_input(b, "Base Color", srgb_hex(color))
    set_input(b, "Metallic", 1.0)
    set_input(b, "Roughness", rough)
    return mat


def brushed_aluminium(name="M_BrushedAlu"):
    """Anisotropic-ish brushed metal via mid roughness + slight coat."""
    mat = _new(name)
    b = principled(mat)
    set_input(b, "Base Color", srgb_hex(COL["aluminium"]))
    set_input(b, "Metallic", 1.0)
    set_input(b, "Roughness", 0.42)
    set_input(b, "Anisotropic", 0.8)
    set_input(b, "Coat Weight", 0.15)
    return mat


def dark_concrete(name="M_Concrete"):
    """Matte dark concrete with subtle procedural noise breakup."""
    mat = _new(name)
    nt = mat.node_tree
    b = principled(mat)
    set_input(b, "Metallic", 0.0)
    set_input(b, "Roughness", 0.9)

    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 12.0
    noise.inputs["Detail"].default_value = 6.0
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = srgb_hex("#0E1013")
    ramp.color_ramp.elements[1].color = srgb_hex(COL["concrete"])
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])

    # Micro roughness variation.
    ramp2 = nt.nodes.new("ShaderNodeValToRGB")
    ramp2.color_ramp.elements[0].color = (0.75, 0.75, 0.75, 1)
    ramp2.color_ramp.elements[1].color = (0.95, 0.95, 0.95, 1)
    nt.links.new(noise.outputs["Fac"], ramp2.inputs["Fac"])
    nt.links.new(ramp2.outputs["Color"], b.inputs["Roughness"])
    return mat


def cinematic_floor(name="M_Floor"):
    """
    Dark, semi-wet reflective floor — the single biggest 'premium' upgrade.
    Low roughness so neon and holograms streak across it as reflections, with
    a faint procedural roughness breakup so it isn't a perfect mirror.
    """
    mat = _new(name)
    nt = mat.node_tree
    b = principled(mat)
    set_input(b, "Base Color", srgb_hex("#05070B"))
    set_input(b, "Metallic", 0.0)
    set_input(b, "Roughness", 0.12)
    set_input(b, "IOR", 1.5)
    set_input(b, "Coat Weight", 0.6)
    set_input(b, "Coat Roughness", 0.08)

    # Subtle roughness variation so reflections have life.
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 4.0
    noise.inputs["Detail"].default_value = 4.0
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.08, 0.08, 0.08, 1)
    ramp.color_ramp.elements[1].color = (0.22, 0.22, 0.22, 1)
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Roughness"])
    return mat


def black_matte(name="M_BlackMatte", color=COL["black_matte"], rough=0.6):
    mat = _new(name)
    b = principled(mat)
    set_input(b, "Base Color", srgb_hex(color))
    set_input(b, "Metallic", 0.0)
    set_input(b, "Roughness", rough)
    return mat


def glass(name="M_Glass", tint=COL["cyan"], rough=0.02):
    """Transmissive glass (works in Eevee-Next raytracing and Cycles)."""
    mat = _new(name)
    b = principled(mat)
    set_input(b, "Base Color", srgb_hex(tint))
    set_input(b, "Roughness", rough)
    set_input(b, "Metallic", 0.0)
    set_input(b, "IOR", 1.45)
    # Blender 4.x renamed Transmission -> Transmission Weight
    if not set_input(b, "Transmission Weight", 1.0):
        set_input(b, "Transmission", 1.0)
    mat.use_screen_refraction = True   # Eevee refraction
    try:
        mat.blend_method = "BLEND"     # legacy Eevee; ignored on Eevee-Next
    except Exception:
        pass
    return mat


# --------------------------------------------------------------------------- #
#  Emissive / screen / hologram
# --------------------------------------------------------------------------- #
def emission(name, color=COL["cyan"], strength=6.0):
    """Pure emitter — used for neon strips, UI glow, particles."""
    mat = _new(name)
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = srgb_hex(color)
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat


def oled_display(name="M_OLED", color=COL["deep_blue"], strength=1.4):
    """
    Self-lit OLED-style screen base. UI text/graphics are separate emissive
    planes placed just above this surface.
    """
    mat = _new(name)
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = srgb_hex(color)
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat


def hologram(name="M_Holo", color=COL["cyan"], strength=4.0, alpha=0.5):
    """
    Transparent holographic panel: fresnel edge-glow + scanline emission,
    semi-transparent body. Reads as a floating HUD surface.
    """
    mat = _new(name)
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")

    transp = nt.nodes.new("ShaderNodeBsdfTransparent")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = srgb_hex(color)
    em.inputs["Strength"].default_value = strength

    fres = nt.nodes.new("ShaderNodeFresnel")
    fres.inputs["IOR"].default_value = 1.3

    # Scanline stripes via wave texture drive extra edge emission.
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.inputs["Scale"].default_value = 40.0

    add_fac = nt.nodes.new("ShaderNodeMath")
    add_fac.operation = "MULTIPLY_ADD"
    nt.links.new(fres.outputs["Fac"], add_fac.inputs[0])
    add_fac.inputs[1].default_value = 0.7
    nt.links.new(wave.outputs["Fac"], add_fac.inputs[2])

    mix = nt.nodes.new("ShaderNodeMixShader")
    # Base transparency vs emission mixed by fresnel+scanlines.
    mixfac = nt.nodes.new("ShaderNodeMath")
    mixfac.operation = "MULTIPLY"
    mixfac.inputs[1].default_value = alpha + 0.4
    nt.links.new(add_fac.outputs[0], mixfac.inputs[0])

    nt.links.new(mixfac.outputs[0], mix.inputs["Fac"])
    nt.links.new(transp.outputs["BSDF"], mix.inputs[1])
    nt.links.new(em.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])

    try:
        mat.blend_method = "BLEND"
        mat.show_transparent_back = False
    except Exception:
        pass
    return mat


def ai_energy(name="M_AICore", color=COL["cyan"], strength=12.0):
    """
    Living AI-core surface: animated noise ramps drive emission intensity so
    the core visibly pulses/roils. Strength is driven high for bloom pickup.
    """
    mat = _new(name)
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")

    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.noise_dimensions = "4D"   # exposes the 'W' input we animate below
    noise.inputs["Scale"].default_value = 3.5
    noise.inputs["Detail"].default_value = 8.0

    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = srgb_hex(COL["deep_blue"])
    ramp.color_ramp.elements[1].color = srgb_hex(color)
    ramp.color_ramp.elements[1].position = 0.65

    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], em.inputs["Color"])
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])

    # Animate the noise texture 'W' so the surface roils over time.
    noise.inputs["W"].keyframe_insert("default_value", frame=1)
    noise.inputs["W"].default_value = 6.0
    noise.inputs["W"].keyframe_insert("default_value", frame=1080)
    return mat
