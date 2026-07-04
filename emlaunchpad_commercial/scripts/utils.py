"""
utils.py
========
Low-level Blender helpers shared across every build module: scene reset,
collection management, colour conversion, node helpers, and — most importantly —
a keyframing API that produces smooth, eased (Bezier) animation curves by
default so nothing ever moves linearly.
"""

import math
import bpy
from mathutils import Vector


# --------------------------------------------------------------------------- #
#  Colour
# --------------------------------------------------------------------------- #
def _srgb_channel_to_linear(c):
    """Convert a single 0..1 sRGB channel to scene-linear."""
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def srgb_hex(hex_str, alpha=1.0):
    """'#00E5FF' -> (r, g, b, a) tuple in scene-linear space for Blender."""
    h = hex_str.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    return (
        _srgb_channel_to_linear(r),
        _srgb_channel_to_linear(g),
        _srgb_channel_to_linear(b),
        alpha,
    )


# --------------------------------------------------------------------------- #
#  Scene / collection management
# --------------------------------------------------------------------------- #
def wipe_scene():
    """Remove all objects, orphan data and collections for a clean rebuild."""
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")

    # Remove via the data API so hidden / unselectable objects (e.g. the fog
    # domain) are cleared too — operator-based delete skips those and they
    # accumulate across re-runs.
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    # Purge orphan datablocks so re-runs don't accumulate .001, .002 duplicates.
    # orphans_purge needs a valid context; guard it for background/CLI runs.
    for _ in range(4):
        try:
            bpy.ops.outliner.orphans_purge(do_local_ids=True,
                                            do_linked_ids=True,
                                            do_recursive=True)
        except Exception:
            break

    # Remove empty non-master collections.
    for col in list(bpy.data.collections):
        if col.users == 0:
            bpy.data.collections.remove(col)


def collection(name):
    """Get or create a collection linked under the scene's master collection."""
    if name in bpy.data.collections:
        return bpy.data.collections[name]
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def move_to(obj, col):
    """Unlink `obj` from every collection and link it only into `col`."""
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)


def link_new(data_block, col, name=None):
    """Wrap a data-block in an object, link it into `col`, return the object."""
    obj = bpy.data.objects.new(name or data_block.name, data_block)
    col.objects.link(obj)
    return obj


# --------------------------------------------------------------------------- #
#  Object constraints / transforms
# --------------------------------------------------------------------------- #
def track_to(obj, target):
    """Add a Track-To constraint so `obj` always aims at `target` (cameras)."""
    c = obj.constraints.new("TRACK_TO")
    c.target = target
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"
    return c


def empty(name, location=(0, 0, 0), col=None):
    """Create an Empty (used as camera targets / animation rigs)."""
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 0.3
    e.location = location
    (col or bpy.context.scene.collection).objects.link(e)
    return e


# --------------------------------------------------------------------------- #
#  Keyframing with easing
# --------------------------------------------------------------------------- #
def iter_fcurves(obj):
    """
    Return all F-Curves of an object's active action, working across Blender
    versions. Blender 4.4+/5.x moved F-Curves into slotted actions
    (layers -> strips -> channelbags); older versions expose action.fcurves.
    """
    ad = getattr(obj, "animation_data", None)
    if not ad or not ad.action:
        return []
    action = ad.action

    # New slotted-action API (Blender 4.4+, required on 5.x).
    if hasattr(action, "layers") and len(action.layers):
        slot = getattr(ad, "action_slot", None)
        fcurves = []
        for layer in action.layers:
            for strip in layer.strips:
                if getattr(strip, "type", "KEYFRAME") != "KEYFRAME":
                    continue
                cb = None
                if slot is not None:
                    try:
                        cb = strip.channelbag(slot)
                    except Exception:
                        cb = None
                if cb is not None:
                    fcurves.extend(cb.fcurves)
                else:
                    # Fallback: gather every channelbag on the strip.
                    for cbi in getattr(strip, "channelbags", []):
                        fcurves.extend(cbi.fcurves)
        if fcurves:
            return fcurves

    # Legacy API (Blender <= 4.3).
    if hasattr(action, "fcurves"):
        try:
            return list(action.fcurves)
        except AttributeError:
            pass
    return []


def key(obj, data_path, frame, interp="BEZIER", easing="EASE_IN_OUT",
        index=-1):
    """
    Insert a keyframe for `data_path` at `frame`, then stamp the requested
    interpolation + easing onto exactly the keyframe(s) just written.

    Set the property value on `obj` *before* calling this, e.g.::

        obj.location = (0, -6, 1)
        key(obj, "location", 1)

    interp:  'BEZIER' | 'LINEAR' | 'CONSTANT' | 'SINE' | 'CUBIC' | 'QUAD' ...
    easing:  'EASE_IN' | 'EASE_OUT' | 'EASE_IN_OUT' | 'AUTO'
    """
    obj.keyframe_insert(data_path=data_path, frame=frame, index=index)
    for fc in iter_fcurves(obj):
        if fc.data_path != data_path:
            continue
        if index != -1 and fc.array_index != index:
            continue
        for kp in fc.keyframe_points:
            if abs(kp.co.x - frame) < 0.5:
                kp.interpolation = interp
                if interp not in ("CONSTANT", "LINEAR"):
                    kp.easing = easing


def key_many(obj, specs):
    """
    Batch helper. `specs` is a list of dicts, each applied in order::

        key_many(cam, [
            {"path": "location", "frame": 1,   "value": (0, -8, 1.6)},
            {"path": "location", "frame": 72,  "value": (0, -5, 1.6),
             "easing": "EASE_OUT"},
        ])
    """
    for s in specs:
        setattr_path(obj, s["path"], s["value"])
        key(obj, s["path"], s["frame"],
            interp=s.get("interp", "BEZIER"),
            easing=s.get("easing", "EASE_IN_OUT"),
            index=s.get("index", -1))


def setattr_path(obj, path, value):
    """Assign to a (possibly nested / dotted) data path on an object."""
    if "." in path:
        head, tail = path.rsplit(".", 1)
        target = obj.path_resolve(head)
        setattr(target, tail, value)
    else:
        setattr(obj, path, value)


def add_noise(obj, data_path, strength=0.03, scale=18.0, phase=0.0):
    """
    Add an F-Curve NOISE modifier to every channel of `data_path`.
    Used for subtle handheld camera shake.
    """
    for fc in iter_fcurves(obj):
        if fc.data_path == data_path:
            m = fc.modifiers.new("NOISE")
            m.strength = strength
            m.scale = scale
            m.phase = phase + fc.array_index * 7.3   # decorrelate axes


# --------------------------------------------------------------------------- #
#  Node-tree helpers
# --------------------------------------------------------------------------- #
def set_input(node, name, value):
    """Safely set a node input by name (version-robust across Blender 4.x)."""
    if name in node.inputs:
        node.inputs[name].default_value = value
        return True
    return False


def principled(mat):
    """Return the Principled BSDF node of a material (creates node tree)."""
    mat.use_nodes = True
    for n in mat.node_tree.nodes:
        if n.type == "BSDF_PRINCIPLED":
            return n
    return mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def lerp(a, b, t):
    return a + (b - a) * t
