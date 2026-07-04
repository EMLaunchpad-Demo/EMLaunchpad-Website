"""
build.py
========
Top-level orchestrator. Runs every stage in the correct order, wires the
cross-module object references (so cameras can frame/focus real targets), and
leaves the scene on frame 1 ready to preview or render.

Import order matters only for reloads; the build order is explicit below.
"""

import importlib
import bpy

import config
from . import (utils, materials, lighting, environment, ui_holograms,
               ai_network, particles, cameras, animation, branding, render)

# Reload everything so re-running inside one Blender session picks up edits.
for _m in (config, utils, materials, lighting, environment, ui_holograms,
           ai_network, particles, cameras, animation, branding, render):
    importlib.reload(_m)


def run(do_render=False):
    print("=" * 60)
    print(" EMLaunchpad commercial — procedural build starting")
    print("=" * 60)

    # 0. Clean slate + scene frame range.
    utils.wipe_scene()
    scene = bpy.context.scene
    scene.frame_start = config.FRAME_START
    scene.frame_end = config.FRAME_END
    scene.render.fps = config.FPS

    # 1. World + lighting rig.
    lighting.build()

    # 2. The physical set (room, desk, props, figure).
    env = environment.build()

    # 3. UI / data holograms.
    ui = ui_holograms.build()

    # 4. AI network (core + lattice) and the deep-space fly-through.
    ai = ai_network.build()
    fly = ai_network.build_flythrough()

    # 5. Particles (needs the AI core to emit from).
    particles.build(ai)

    # 6. Brand end-frame stage.
    brand = branding.build()

    # 7. Animation choreography across all shots.
    animation.animate(env, ui, ai)

    # 8. Cameras (need object refs to frame / focus).
    refs = {
        "phone": env["phone"],
        "phone_screen": env["phone_screen"],
        "figure_head": bpy.data.objects.get("FIG_head"),
        "ai_core": ai["core"],
        "ai_root": ai["root"],
        "fly_root": fly["root"],
        "fly_hub": fly["hub"],
        "brand_anchor": brand["root"],
    }
    cameras.build(refs)

    # 9. Render / color / compositor settings.
    render.setup()

    scene.frame_set(config.FRAME_START)
    print("=" * 60)
    print(" Build complete. Timeline markers switch cameras per shot.")
    print(" Press Spacebar to play, or render the animation.")
    print("=" * 60)

    if do_render:
        print(" Rendering animation to", scene.render.filepath)
        bpy.ops.render.render(animation=True)

    return {"env": env, "ui": ui, "ai": ai, "fly": fly, "brand": brand}
