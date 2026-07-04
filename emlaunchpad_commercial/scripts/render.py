"""
render.py
=========
Render + color-management + compositor setup. Engine-specific settings are
guarded with hasattr so the script runs across Blender 4.2 / 4.3 / 4.4 where
Eevee-Next property names differ.

Bloom: Eevee-Next removed the legacy Bloom toggle, so glow is created in the
compositor with a Glare (Bloom/Fog Glow) node for both engines. This is the
modern, engine-agnostic approach.
"""

import os
import bpy
import config
from config import (RENDER_ENGINE, QUALITY, RESOLUTIONS, FPS,
                    EEVEE_SAMPLES, CYCLES_SAMPLES, FRAME_START, FRAME_END,
                    USE_MOTION_BLUR, OUTPUT_SUBDIR, OUTPUT_NAME, resolution)


def _try(obj, attr, value):
    """Set attr only if it exists (version-robust)."""
    if hasattr(obj, attr):
        try:
            setattr(obj, attr, value)
            return True
        except Exception:
            return False
    return False


def _engine():
    scene = bpy.context.scene
    if RENDER_ENGINE == "cycles":
        scene.render.engine = "CYCLES"
        cy = scene.cycles
        cy.samples = CYCLES_SAMPLES
        _try(cy, "use_denoising", True)
        _try(cy, "caustics_reflective", True)
        # Prefer GPU if configured; silently fall back to CPU.
        try:
            scene.cycles.device = "GPU"
        except Exception:
            pass
    else:
        # Eevee-Next in 4.2+ is 'BLENDER_EEVEE_NEXT'; older is 'BLENDER_EEVEE'.
        for name in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
            try:
                scene.render.engine = name
                break
            except Exception:
                continue
        ee = scene.eevee
        _try(ee, "taa_render_samples", EEVEE_SAMPLES)
        _try(ee, "taa_samples", 16)
        _try(ee, "use_raytracing", True)        # SSR / reflections (Next)
        _try(ee, "use_ssr", True)               # legacy Eevee
        _try(ee, "use_ssr_refraction", True)
        _try(ee, "use_gtao", True)              # legacy AO
        _try(ee, "use_shadows", True)
        _try(ee, "use_volumetric_shadows", True)
        _try(ee, "use_bloom", True)             # legacy Eevee bloom if present


def _set_output_format(r):
    """
    Choose the output format robustly across Blender versions.

    Blender 5.x split still vs. video via `image_settings.media_type`, so
    'FFMPEG' is only a valid file_format after media_type is 'VIDEO'. We try
    MP4 only when OUTPUT_VIDEO is set, and always fall back to PNG (which is
    universally supported and perfect for test frames).
    """
    imgs = r.image_settings
    if getattr(config, "OUTPUT_VIDEO", False):
        try:
            if hasattr(imgs, "media_type"):
                imgs.media_type = "VIDEO"     # Blender 5.x still/video split
            imgs.file_format = "FFMPEG"
            r.ffmpeg.format = "MPEG4"
            r.ffmpeg.codec = "H264"
            r.ffmpeg.constant_rate_factor = "HIGH"
            r.ffmpeg.ffmpeg_preset = "GOOD"
            r.ffmpeg.audio_codec = "NONE"
            print("[render] output: FFMPEG / MP4 (H.264)")
            return
        except Exception as e:
            print("[render] FFMPEG unavailable, falling back to PNG:", e)

    # PNG stills / image sequence — bulletproof, ideal for F12 test frames.
    try:
        if hasattr(imgs, "media_type"):
            imgs.media_type = "IMAGE"
    except Exception:
        pass
    imgs.file_format = "PNG"
    _try(imgs, "color_mode", "RGBA")
    _try(imgs, "compression", 15)
    print("[render] output: PNG stills")


def _output():
    scene = bpy.context.scene
    r = scene.render
    x, y = resolution()
    r.resolution_x = x
    r.resolution_y = y
    r.resolution_percentage = 100
    r.fps = FPS
    scene.frame_start = FRAME_START
    scene.frame_end = FRAME_END
    r.use_motion_blur = USE_MOTION_BLUR
    _try(r, "motion_blur_shutter", 0.5)

    _set_output_format(r)

    base = _project_root()
    out_dir = os.path.join(base, OUTPUT_SUBDIR)
    os.makedirs(out_dir, exist_ok=True)
    r.filepath = os.path.join(out_dir, OUTPUT_NAME)


def _project_root():
    """Resolve the project root regardless of how the script was launched."""
    # scripts/ is one level under the project root.
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return here


def _color_management():
    scene = bpy.context.scene
    vs = scene.view_settings
    # Prefer AgX (modern filmic default); fall back to Filmic.
    for vt in ("AgX", "Filmic"):
        try:
            vs.view_transform = vt
            break
        except Exception:
            continue
    for look in ("AgX - High Contrast", "High Contrast",
                 "AgX - Medium High Contrast", "Medium High Contrast"):
        try:
            vs.look = look
            break
        except Exception:
            continue
    vs.exposure = 0.2
    vs.gamma = 1.0


def _compositor_glow():
    """
    Add a Glare (bloom) pass so all emissives bloom. Handles both compositor
    APIs and uses the CORRECT output node for each:
      * Blender 5.x: a CompositorNodeTree *group* -> needs a Group Output node
      * Blender <= 4.x: scene.node_tree -> needs a Composite node
    The 5.x group is only assigned to the scene once fully built, so a partial
    failure can never leave the render blocked by a broken compositor.
    """
    scene = bpy.context.scene
    _try(scene.render, "use_compositing", True)

    use_group = hasattr(scene, "compositing_node_group")
    if use_group:
        ng = bpy.data.node_groups.get("EML_Compositor")
        if ng is None:
            ng = bpy.data.node_groups.new("EML_Compositor",
                                          "CompositorNodeTree")
        nt = ng
    else:
        scene.use_nodes = True
        nt = scene.node_tree

    nt.nodes.clear()

    rl = nt.nodes.new("CompositorNodeRLayers")
    glare = nt.nodes.new("CompositorNodeGlare")
    glare.glare_type = "BLOOM" if "BLOOM" in \
        glare.bl_rna.properties["glare_type"].enum_items.keys() else "FOG_GLOW"
    glare.quality = "HIGH"
    _try(glare, "mix", 0.15)
    _try(glare, "threshold", 0.5)
    _try(glare, "size", 9)

    # A second, softer fog-glow pass layered for a filmic halation feel.
    glare2 = nt.nodes.new("CompositorNodeGlare")
    glare2.glare_type = "FOG_GLOW"
    glare2.quality = "HIGH"
    _try(glare2, "mix", 0.1)
    _try(glare2, "threshold", 0.75)
    _try(glare2, "size", 9)

    nt.links.new(rl.outputs["Image"], glare.inputs["Image"])
    nt.links.new(glare.outputs["Image"], glare2.inputs["Image"])

    if use_group:
        # Blender 5.x: output via a Group Output node + Image interface socket.
        has_out = any(getattr(s, "in_out", None) == "OUTPUT"
                      for s in nt.interface.items_tree)
        if not has_out:
            nt.interface.new_socket("Image", in_out="OUTPUT",
                                    socket_type="NodeSocketColor")
        gout = nt.nodes.new("NodeGroupOutput")
        nt.links.new(glare2.outputs["Image"], gout.inputs[0])
        scene.compositing_node_group = ng   # assign only when complete + valid
    else:
        comp = nt.nodes.new("CompositorNodeComposite")
        nt.links.new(glare2.outputs["Image"], comp.inputs["Image"])
        try:
            viewer = nt.nodes.new("CompositorNodeViewer")
            nt.links.new(glare2.outputs["Image"], viewer.inputs["Image"])
        except Exception:
            pass


def setup():
    """
    Apply all render settings. Each step is isolated so a version-specific API
    difference in one (e.g. the compositor) can never abort the whole build.
    """
    for name, fn in (("engine", _engine),
                     ("output", _output),
                     ("color-management", _color_management),
                     ("compositor-glow", _compositor_glow)):
        try:
            fn()
        except Exception as e:
            print(f"[render] WARNING: '{name}' step skipped ({e})")

    try:
        print(f"[render] engine={bpy.context.scene.render.engine} "
              f"{resolution()} @ {FPS}fps  frames {FRAME_START}-{FRAME_END}")
    except Exception:
        pass
