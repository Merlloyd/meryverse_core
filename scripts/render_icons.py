#!/usr/bin/env python3
"""Render an app icon from its SVG source into every bitmap format the apps need.

The SVG is the source of truth; PNG and ICO files are reproducible build artifacts.

Usage:
    python3 scripts/render_icons.py SVG [--static-dir DIR --slug SLUG [--layout flat|folder]]
                                        [--app-png PATH] [--app-ico PATH]

Outputs with --static-dir DIR --slug SLUG:
  --layout flat (default):
      DIR/<slug>-icon.svg       copy of the SVG (skipped if source and target are the same file)
      DIR/<slug>-icon.png       1024x1024
      DIR/<slug>-icon-512.png   512x512
      DIR/<slug>-icon-192.png   192x192
      DIR/<slug>-favicon.ico    multi-size ICO
  --layout folder:
      DIR/<slug>/icon.svg, icon.png (1024), icon-512.png, icon-192.png, favicon.ico

Additional outputs:
  --app-png PATH   1024x1024 PNG written to PATH
  --app-ico PATH   multi-size ICO written to PATH

At least one of --static-dir (together with --slug), --app-png or --app-ico is required.

Requirements (see requirements-tools.txt):
    pip install -r requirements-tools.txt
"""

import argparse
import io
import os
import shutil
import sys

PNG_SIZES = (192, 512, 1024)
ICO_SIZES = (16, 32, 48, 64, 128, 256)


def render_png(svg_path: str, size: int) -> bytes:
    import resvg_py

    return bytes(resvg_py.svg_to_bytes(svg_path=svg_path, width=size, height=size))


def write_ico(svg_path: str, ico_path: str) -> None:
    """Create a multi-size ICO from the SVG - every size is rendered on its own for sharpness."""
    from PIL import Image

    images = []
    for s in ICO_SIZES:
        png_bytes = render_png(svg_path, s)
        img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
        images.append(img)
    # Pillow stores the ICO with all sizes; the main image is the largest one.
    images[-1].save(
        ico_path,
        format="ICO",
        sizes=[(img.width, img.height) for img in images],
        append_images=images[:-1],
    )


def write_png(svg_path: str, png_path: str, size: int) -> None:
    with open(png_path, "wb") as f:
        f.write(render_png(svg_path, size))
    print(f"   {png_path}  ({size}x{size})")


def static_targets(static_dir: str, slug: str, layout: str):
    """Return (svg_target, png_target(size), ico_target) for the chosen layout."""
    if layout == "folder":
        base = os.path.join(static_dir, slug)
        os.makedirs(base, exist_ok=True)

        def png_target(size: int) -> str:
            suffix = "" if size == 1024 else f"-{size}"
            return os.path.join(base, f"icon{suffix}.png")

        return os.path.join(base, "icon.svg"), png_target, os.path.join(base, "favicon.ico")

    os.makedirs(static_dir, exist_ok=True)

    def png_target(size: int) -> str:
        suffix = "" if size == 1024 else f"-{size}"
        return os.path.join(static_dir, f"{slug}-icon{suffix}.png")

    return os.path.join(static_dir, f"{slug}-icon.svg"), png_target, os.path.join(static_dir, f"{slug}-favicon.ico")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Render an app icon (SVG) into PNG and ICO files.",
    )
    parser.add_argument("svg", help="path to the SVG source")
    parser.add_argument("--static-dir", help="target directory for the static asset set")
    parser.add_argument("--slug", help="asset name prefix / folder (required with --static-dir)")
    parser.add_argument(
        "--layout",
        choices=("flat", "folder"),
        default="flat",
        help="flat: <slug>-icon*.png next to each other (default); folder: <slug>/icon*.png",
    )
    parser.add_argument("--app-png", help="additionally write a 1024x1024 PNG to this path")
    parser.add_argument("--app-ico", help="additionally write a multi-size ICO to this path")
    args = parser.parse_args(argv)

    if not (args.static_dir or args.app_png or args.app_ico):
        parser.error("give at least one of --static-dir (with --slug), --app-png or --app-ico")
    if args.static_dir and not args.slug:
        parser.error("--static-dir requires --slug")
    if not os.path.isfile(args.svg):
        print(f"ERROR: SVG not found: {args.svg}", file=sys.stderr)
        return 1

    try:
        import resvg_py  # noqa: F401
        from PIL import Image  # noqa: F401
    except ImportError as exc:
        print(f"ERROR: {exc}. Install the tools: pip install -r requirements-tools.txt", file=sys.stderr)
        return 1

    svg_path = args.svg
    print(f"\n-> {svg_path}")

    if args.app_png:
        write_png(svg_path, args.app_png, 1024)
    if args.app_ico:
        write_ico(svg_path, args.app_ico)
        print(f"   {args.app_ico}  (multi-size)")

    if args.static_dir:
        out_svg, png_target, out_ico = static_targets(args.static_dir, args.slug, args.layout)
        same = os.path.exists(out_svg) and os.path.samefile(svg_path, out_svg)
        if not same:
            shutil.copyfile(svg_path, out_svg)
            print(f"   {out_svg}  (SVG copy)")
        for size in PNG_SIZES:
            write_png(svg_path, png_target(size), size)
        write_ico(svg_path, out_ico)
        print(f"   {out_ico}  (multi-size)")

    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
