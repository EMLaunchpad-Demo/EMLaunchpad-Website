
import os
import sys
import bpy

# --------------------------------------------------------------------------- #
#  Resolve the project directory and put it on sys.path so `import config`
#  and `from scripts import ...` work no matter how Blender launched us.
# --------------------------------------------------------------------------- #
def _project_dir():
    # 1) Normal case: __file__ is defined (blender --python main.py / -P).
    try:
        return os.path.dirname(os.path.abspath(__file__))
    except NameError:
        pass
    # 2) Text-editor case: derive from the current text block's filepath.
    try:
        txt = bpy.context.space_data.text
        if txt and txt.filepath:
            return os.path.dirname(bpy.path.abspath(txt.filepath))
    except Exception:
        pass
    # 3) Last resort: EDIT THIS to your project folder if the above fail.
    return os.path.expanduser(
        r"~/Downloads/EMLaunchpad/emlaunchpad_commercial")


PROJECT_DIR = _project_dir()
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)


def _wants_render():
    """True if '--render' was passed after the '--' CLI separator."""
    argv = sys.argv
    if "--" in argv:
        return "--render" in argv[argv.index("--") + 1:]
    return False


def main():
    # Imported here (after sys.path setup) so the package resolves cleanly.
    from scripts import build
    import importlib
    importlib.reload(build)
    build.run(do_render=_wants_render())


if __name__ == "__main__":
    main()
