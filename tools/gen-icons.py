#!/usr/bin/env python3
"""Generate Writter's PWA icon set with Pillow — no build tools involved.

    python3 tools/gen-icons.py

Output (assets/icons/):
  icon-192.png             192x192    manifest, purpose "any"
  icon-512.png             512x512    manifest, purpose "any"
  maskable-512.png         512x512    manifest, purpose "maskable"
                             glyph kept inside the central 60% safe zone
  apple-touch-icon-180.png 180x180    opaque (iOS applies its own rounding)
  favicon-48.png            48x48     browser tab
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BG = "#f5f5f7"   # --bg in css/variables.css / theme-color
INK = "#1d1d1f"  # --ink in css/variables.css
FONT = Path("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf")
OUT = Path(__file__).resolve().parent.parent / "assets" / "icons"
GLYPH = "W"

# name, size, fraction of the square the glyph may occupy, opaque output
TARGETS = [
    ("icon-192.png", 192, 0.58, False),
    ("icon-512.png", 512, 0.58, False),
    ("maskable-512.png", 512, 0.40, False),
    ("apple-touch-icon-180.png", 180, 0.60, True),
    ("favicon-48.png", 48, 0.66, False),
]


def font_for(target: int) -> ImageFont.FreeTypeFont:
    """Largest font size whose glyph still fits inside `target` pixels."""
    best, lo, hi = None, 8, target * 4
    while lo <= hi:
        mid = (lo + hi) // 2
        font = ImageFont.truetype(str(FONT), mid)
        box = font.getbbox(GLYPH)
        if box[3] - box[1] <= target:
            best, lo = font, mid + 1
        else:
            hi = mid - 1
    return best


def render(size: int, coverage: float, opaque: bool) -> Image.Image:
    image = Image.new("RGB" if opaque else "RGBA", (size, size), BG)
    draw = ImageDraw.Draw(image)

    font = font_for(round(size * coverage))
    box = font.getbbox(GLYPH)
    width, height = box[2] - box[0], box[3] - box[1]
    x = (size - width) / 2 - box[0]
    y = (size - height) / 2 - box[1]
    draw.text((x, y), GLYPH, font=font, fill=INK)
    return image


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size, coverage, opaque in TARGETS:
        path = OUT / name
        render(size, coverage, opaque).save(path, optimize=True)
        print(f"{path.relative_to(OUT.parent.parent)}  {size}x{size}")


if __name__ == "__main__":
    main()
