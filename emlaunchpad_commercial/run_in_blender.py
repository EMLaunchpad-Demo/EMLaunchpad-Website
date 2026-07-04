"""
run_in_blender.py  —  RUN THIS ONE IN THONNY
============================================
This is NOT the Blender script. `bpy` only exists inside Blender, so it can
never run in a normal Thonny interpreter. Instead, this launcher finds your
blender.exe and starts Blender with the project's main.py — which builds the
whole commercial for you.

HOW TO USE (in Thonny):
    1. Open this file in Thonny.
    2. Make sure Blender is CLOSED (so it launches fresh).
    3. Press the green Run button (F5).
    4. Blender opens with the full scene already built. Look through the
       camera (Numpad 0), set viewport shading to "Rendered", press Spacebar.

TOGGLES:
    RENDER = False  -> opens Blender GUI so you can preview (recommended first).
    RENDER = True   -> renders the MP4 headlessly (no window) to ./renders/.
"""

import glob
import os
import subprocess
import sys

# --------------------------------------------------------------------------- #
#  Settings — edit these if paths differ on your machine.
# --------------------------------------------------------------------------- #
PROJECT_DIR = r"C:\Users\marti\Downloads\EMLaunchpad\emlaunchpad_commercial"
RENDER = False   # False = open GUI to preview, True = headless render to MP4

MAIN = os.path.join(PROJECT_DIR, "main.py")


def find_blender():
    """Locate blender.exe automatically (newest version first)."""
    # 1) Explicit override via environment variable.
    env = os.environ.get("BLENDER_EXE")
    if env and os.path.isfile(env):
        return env

    # 2) Standard install locations.
    candidates = []
    for base in (r"C:\Program Files\Blender Foundation",
                 r"C:\Program Files (x86)\Blender Foundation"):
        candidates += glob.glob(os.path.join(base, "Blender*", "blender.exe"))

    # 3) Steam install.
    candidates += glob.glob(
        r"C:\Program Files (x86)\Steam\steamapps\common\Blender\blender.exe")

    candidates.sort(reverse=True)  # newest folder name first
    return candidates[0] if candidates else None


def main():
    if not os.path.isfile(MAIN):
        sys.exit(f"main.py not found at:\n  {MAIN}\n"
                 f"Fix PROJECT_DIR at the top of this file.")

    blender = find_blender()
    if not blender:
        sys.exit("Could not find blender.exe.\n"
                 "Set an env var BLENDER_EXE to its full path, e.g.\n"
                 r'  C:\Program Files\Blender Foundation\Blender 5.1\blender.exe')

    print("Blender :", blender)
    print("Project :", PROJECT_DIR)
    print("Mode    :", "HEADLESS RENDER" if RENDER else "GUI PREVIEW")

    cmd = [blender]
    if RENDER:
        cmd += ["--background", "--python", MAIN, "--", "--render"]
    else:
        cmd += ["--python", MAIN]

    print("Launching:", " ".join(f'"{c}"' if " " in c else c for c in cmd))
    print("-" * 60)
    # Blender's console output streams here in Thonny's shell.
    subprocess.run(cmd)
    print("-" * 60)
    print("Blender has exited.")


if __name__ == "__main__":
    main()
