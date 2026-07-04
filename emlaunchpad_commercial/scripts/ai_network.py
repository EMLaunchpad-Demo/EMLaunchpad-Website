"""
ai_network.py
=============
The visual identity of the AI: a glowing central core, a lattice of floating
nodes, and light-line connections between them (the "network"). Plus the
big camera-fly-through network for shot 9.

Design brief: AI = energy, not a robot. Everything is emissive geometry and
curves so it blooms in the compositor.
"""

import math
import bpy
from mathutils import Vector
from . import utils, materials
from .utils import srgb_hex, key
from config import COL


def _icosphere(name, radius, loc, col, mat, subdiv=3):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=radius, subdivisions=subdiv,
                                           location=loc)
    o = bpy.context.active_object
    o.name = name
    bpy.ops.object.shade_smooth()
    utils.move_to(o, col)
    if mat:
        o.data.materials.append(mat)
    return o


def _line(name, p1, p2, col, mat, bevel=0.004):
    """A thin glowing tube along a poly curve between two points."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("POLY")
    sp.points.add(1)
    sp.points[0].co = (*p1, 1)
    sp.points[1].co = (*p2, 1)
    cu.bevel_depth = bevel
    o = utils.link_new(cu, col, name)
    o.data.materials.append(mat)
    return o


def build():
    """
    Build the AI core + node lattice + connections.
    Returns a registry with the core, nodes, lines and the group empty so the
    animation module can grow/pulse them.
    """
    col = utils.collection("AI_NETWORK")
    root = utils.empty("AI_ROOT", (0, 0.4, 1.5), col)

    core_mat = materials.ai_energy("M_AICore", COL["cyan"], strength=28.0)
    glow_mat = materials.emission("M_NodeGlow", COL["cyan"], 16.0)
    line_mat = materials.emission("M_LineGlow", COL["electric"], 10.0)

    # --- Central core ----------------------------------------------------- #
    core = _icosphere("AI_CORE", 0.32, (0, 0.4, 1.5), col, core_mat, subdiv=4)
    core.parent = root
    core.matrix_parent_inverse = root.matrix_world.inverted()
    # Wireframe overlay shell for a "data" feel.
    shell = _icosphere("AI_CORE_SHELL", 0.5, (0, 0.4, 1.5), col,
                       materials.emission("M_CoreShell", COL["cyan"], 3.0),
                       subdiv=2)
    wf = shell.modifiers.new("wire", "WIREFRAME")
    wf.thickness = 0.01
    shell.parent = root
    shell.matrix_parent_inverse = root.matrix_world.inverted()

    # --- Node lattice around the core (fibonacci sphere) ------------------ #
    nodes = []
    N = 42
    R = 1.9
    for i in range(N):
        y = 1 - (i / (N - 1)) * 2
        r = math.sqrt(max(0.0, 1 - y * y))
        theta = math.pi * (3 - math.sqrt(5)) * i
        p = Vector((math.cos(theta) * r, y, math.sin(theta) * r)) * R
        p += Vector((0, 0.4, 1.5))
        nd = _icosphere(f"AI_NODE_{i}", 0.05, tuple(p), col, glow_mat, 1)
        nd.parent = root
        nd.matrix_parent_inverse = root.matrix_world.inverted()
        nodes.append(nd)

    # --- Connections: each node -> core, plus a few node-node links ------- #
    center = Vector((0, 0.4, 1.5))
    lines = []
    for i, nd in enumerate(nodes):
        ln = _line(f"AI_LINK_{i}", tuple(center), tuple(nd.location), col,
                   line_mat)
        ln.parent = root
        ln.matrix_parent_inverse = root.matrix_world.inverted()
        lines.append(ln)
    # cross links
    for i in range(0, N - 2, 3):
        ln = _line(f"AI_XLINK_{i}", tuple(nodes[i].location),
                   tuple(nodes[i + 2].location), col, line_mat, bevel=0.0025)
        ln.parent = root
        ln.matrix_parent_inverse = root.matrix_world.inverted()
        lines.append(ln)

    # --- Slow constant rotation of the whole network --------------------- #
    root.rotation_euler = (0, 0, 0)
    key(root, "rotation_euler", 384, index=2)      # AI birth start
    root.rotation_euler = (0, 0, math.radians(140))
    key(root, "rotation_euler", 912, index=2, interp="SINE",
        easing="EASE_IN_OUT")

    return {
        "root": root, "core": core, "shell": shell,
        "nodes": nodes, "lines": lines, "collection": col,
    }


def build_flythrough():
    """
    A larger deep-space network for the shot-9 camera fly-through:
    scattered server/data nodes with connecting light beams and EMLaunchpad
    at the centre.
    """
    col = utils.collection("AI_FLYTHRU")
    root = utils.empty("FLY_ROOT", (0, 30, 4), col)  # far down the +Y corridor

    node_mat = materials.emission("M_FlyNode", COL["cyan"], 9.0)
    beam_mat = materials.emission("M_FlyBeam", COL["electric"], 5.0)
    hub_mat = materials.ai_energy("M_FlyHub", COL["cyan"], 22.0)

    # A corridor of nodes stretching along +Y that the camera flies down.
    import math
    pts = []
    for i in range(60):
        t = i / 59.0
        ang = t * math.tau * 3.0
        rad = 2.2 + math.sin(t * 8) * 0.8
        p = Vector((math.cos(ang) * rad,
                    10 + t * 40,
                    4 + math.sin(ang) * rad))
        pts.append(p)
        nd = _icosphere(f"FLY_NODE_{i}", 0.08 + (i % 4) * 0.02, tuple(p),
                        col, node_mat, 1)
        nd.parent = root
        nd.matrix_parent_inverse = root.matrix_world.inverted()

    # Beams connecting consecutive nodes.
    for i in range(len(pts) - 1):
        ln = _line(f"FLY_BEAM_{i}", tuple(pts[i]), tuple(pts[i + 1]), col,
                   beam_mat, bevel=0.006)
        ln.parent = root
        ln.matrix_parent_inverse = root.matrix_world.inverted()

    # Central EMLaunchpad hub at the far end.
    hub = _icosphere("FLY_HUB", 0.9, (0, 52, 4), col, hub_mat, subdiv=4)
    hub.parent = root
    hub.matrix_parent_inverse = root.matrix_world.inverted()

    return {"root": root, "hub": hub, "collection": col}
