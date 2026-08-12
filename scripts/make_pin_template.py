#!/usr/bin/env python3
"""
Render the STATIC Pinterest pin template background (1000x1500) to
public/images/pin-template.png. Everything that never changes per product is
baked in: cream canvas, inner frame, blush ribbon bookmark, "HOE of all
HOBBIES" masthead + taglines, procedural botanical sprigs, photo mat, category
pill shape, footer band with ornate price-label shape (price text stays
dynamic), centered brand line, and the watercolor hoe icon in a white circle.

The og route (app/api/pin-image/[id]/route.tsx) overlays only the dynamic
slots on top of this PNG. Layout constants below MUST match that route.

Fonts are downloaded from Google Fonts into public/fonts/ on first run so the
script AND the og route share the same files:
  Playfair Display 400/700 (masthead serif, title, price)
  Great Vibes 400         (script "of all")

Re-run after any template change:  python scripts/make_pin_template.py
"""

import io
import math
import re
from pathlib import Path

import requests
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS_DIR = ROOT / "public" / "fonts"
OUT = ROOT / "public" / "images" / "pin-template.png"
HOE_ICON = ROOT / "public" / "images" / "hoe-icon-512.png"

W, H = 1000, 1500

# Palette (sample: cream, dusty blush, charcoal, muted sage)
CREAM = "#faf6f1"
BLUSH = "#d9a5a0"        # ribbon, pill, price label
BLUSH_LIGHT = "#ecd2cc"  # footer band
CHARCOAL = "#3d4451"
SCRIPT_ROSE = "#c98a84"  # "of all" script
FOOTER_TEXT = "#7a5550"
SAGE = (150, 160, 135)   # botanical strokes (alpha applied separately)

# ---- Dynamic slots the og route MUST reuse --------------------------------
PHOTO_BOX = (74, 344, 926, 1006)        # product photo (object-fit cover)
PILL_BOX = (330, 996, 670, 1046)        # category pill shape
PRICE_BOX = (56, 1408, 264, 1470)       # price text inside the label
TITLE_BOX = (100, 1058, 900, 1248)      # serif title, up to 2 lines

FONT_SPECS = {
    "PlayfairDisplay-Regular.ttf": ("Playfair Display", "ital,wght@0,400"),
    "PlayfairDisplay-Bold.ttf": ("Playfair Display", "ital,wght@0,700"),
    "GreatVibes-Regular.ttf": ("Great Vibes", "ital,wght@0,400"),
}


# ---------------------------------------------------------------------------
# Fonts
# ---------------------------------------------------------------------------

def ensure_fonts() -> None:
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    for filename, (family, axes) in FONT_SPECS.items():
        dest = FONTS_DIR / filename
        if dest.exists():
            continue
        css = requests.get(
            f"https://fonts.googleapis.com/css2?family={family.replace(' ', '+')}:{axes}&display=swap",
            headers={"User-Agent": "curl/7.0"},
            timeout=20,
        )
        css.raise_for_status()
        urls = re.findall(r"url\((https://[^)]+\.ttf)\)", css.text)
        if not urls:
            raise RuntimeError(f"No TTF URL found for {family}")
        ttf = requests.get(urls[0], timeout=30)
        ttf.raise_for_status()
        dest.write_bytes(ttf.content)
        print(f"  downloaded {filename} ({len(ttf.content) / 1024:.0f} KB)")


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS_DIR / name), size)


# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------

def tracked_width(f: ImageFont.FreeTypeFont, text: str, tracking: float) -> float:
    return sum(f.getbbox(ch)[2] - f.getbbox(ch)[0] for ch in text) + tracking * (len(text) - 1)


def draw_tracked(draw: ImageDraw.ImageDraw, cx: float, y: float, text: str,
                 f: ImageFont.FreeTypeFont, fill: str, tracking: float) -> None:
    """Letterspaced text centered on cx (y = top)."""
    x = cx - tracked_width(f, text, tracking) / 2
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += (f.getbbox(ch)[2] - f.getbbox(ch)[0]) + tracking


def draw_heart(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float,
               color, outline: bool = False, width: int = 2) -> None:
    """Parametric heart centered at (cx, cy)."""
    pts = []
    for i in range(101):
        t = 2 * math.pi * i / 100
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * size / 16, cy - y * size / 16))
    if outline:
        draw.line(pts + [pts[0]], fill=color, width=width, joint="curve")
    else:
        draw.polygon(pts, fill=color)


def draw_bow(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float,
             color, width: int = 2) -> None:
    """Stylized line-art bow centered at (cx, cy)."""
    s = size
    # loops
    draw.arc([cx - s, cy - s * 0.55, cx - s * 0.08, cy + s * 0.45], 95, 305, fill=color, width=width)
    draw.arc([cx + s * 0.08, cy - s * 0.55, cx + s, cy + s * 0.45], -125, 85, fill=color, width=width)
    # knot
    r = s * 0.12
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=width)
    # tails
    draw.line([(cx - s * 0.15, cy + s * 0.3), (cx - s * 0.45, cy + s * 0.95)], fill=color, width=width)
    draw.line([(cx + s * 0.15, cy + s * 0.3), (cx + s * 0.45, cy + s * 0.95)], fill=color, width=width)


def draw_sprig(base: Image.Image, x0: float, y0: float, height: float,
               lean: float, seed_phase: float) -> None:
    """Muted botanical sprig growing upward from (x0, y0), on an RGBA overlay."""
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    color = SAGE + (105,)
    steps = 60
    pts = []
    for i in range(steps + 1):
        t = i / steps
        x = x0 + lean * t + 14 * math.sin(t * math.pi * 1.6 + seed_phase) * (1 - t * 0.4)
        y = y0 - t * height
        pts.append((x, y))
    od.line(pts, fill=color, width=2, joint="curve")

    # leaves: rotated ellipse tiles alternating sides
    n_leaves = max(3, int(height / 95))
    for k in range(1, n_leaves + 1):
        t = k / (n_leaves + 0.5)
        x = x0 + lean * t + 14 * math.sin(t * math.pi * 1.6 + seed_phase) * (1 - t * 0.4)
        y = y0 - t * height
        side = 1 if k % 2 == 0 else -1
        tile = Image.new("RGBA", (44, 44), (0, 0, 0, 0))
        td = ImageDraw.Draw(tile)
        td.ellipse([4, 14, 40, 30], outline=color, width=2)
        tile = tile.rotate(-side * (38 + 8 * math.sin(seed_phase + k)), resample=Image.BICUBIC, expand=False)
        overlay.alpha_composite(tile, (int(x) - 22 + side * 8, int(y) - 22))
        # tiny stem from main stem to leaf
        od.line([(x, y), (x + side * 14, y - 4)], fill=color, width=1)

    base.alpha_composite(overlay)


# ---------------------------------------------------------------------------
# Template
# ---------------------------------------------------------------------------

def build() -> None:
    img = Image.new("RGBA", (W, H), CREAM)
    draw = ImageDraw.Draw(img)

    pf = font("PlayfairDisplay-Regular.ttf", 21)
    pf_small = font("PlayfairDisplay-Regular.ttf", 19)
    pf_masthead = font("PlayfairDisplay-Bold.ttf", 64)
    pf_footer = font("PlayfairDisplay-Regular.ttf", 24)
    script = font("GreatVibes-Regular.ttf", 62)

    # Inner frame
    draw.rounded_rectangle([14, 14, W - 14, H - 14], radius=26, outline=BLUSH, width=2)

    # --- Ribbon bookmark (top-left) -----------------------------------------
    rx0, rx1, ry0, ry1 = 34, 158, 16, 358
    notch = 36
    draw.polygon([(rx0, ry0), (rx1, ry0), (rx1, ry1),
                  ((rx0 + rx1) / 2, ry1 - notch), (rx0, ry1)], fill=BLUSH)
    rcx = (rx0 + rx1) / 2
    ribbon_font = font("PlayfairDisplay-Regular.ttf", 13)
    draw_bow(draw, rcx, 70, 26, CREAM, 2)
    for i, line in enumerate(["SUSTAINABLE", "FINDS FOR", "CREATIVE", "MINDS"]):
        draw_tracked(draw, rcx, 112 + i * 27, line, ribbon_font, CREAM, 1)
    draw_heart(draw, rcx, 300, 11, CREAM, outline=True, width=2)

    # --- Masthead ------------------------------------------------------------
    mast_cx = (rx1 + (W - 14)) / 2 + 10  # center of area right of the ribbon
    hoe_w = tracked_width(pf_masthead, "HOE", 6)
    hobbies_w = tracked_width(pf_masthead, "HOBBIES", 6)
    ofall_w = draw.textlength("of all", font=script)
    gap = 26
    total = hoe_w + gap + ofall_w + gap + hobbies_w
    x = mast_cx - total / 2
    baseline_y = 66
    for ch in "HOE":
        draw.text((x, baseline_y), ch, font=pf_masthead, fill=CHARCOAL)
        x += (pf_masthead.getbbox(ch)[2] - pf_masthead.getbbox(ch)[0]) + 6
    x += gap - 6
    draw.text((x, baseline_y + 10), "of all", font=script, fill=SCRIPT_ROSE)
    x += ofall_w + gap
    for ch in "HOBBIES":
        draw.text((x, baseline_y), ch, font=pf_masthead, fill=CHARCOAL)
        x += (pf_masthead.getbbox(ch)[2] - pf_masthead.getbbox(ch)[0]) + 6

    draw_bow(draw, mast_cx, 186, 22, "#b89a8a", 2)
    draw_tracked(draw, mast_cx, 226, "SUSTAINABLE FINDS FOR CREATIVE MINDS", pf, CHARCOAL, 5)

    # --- Photo mat -----------------------------------------------------------
    draw.rounded_rectangle([60, 330, 940, 1020], radius=8, fill="#ffffff", outline=BLUSH, width=2)
    x0, y0, x1, y1 = PHOTO_BOX
    draw.rectangle([x0 - 1, y0 - 1, x1 + 1, y1 + 1], outline=BLUSH_LIGHT, width=1)

    # --- Category pill shape (text is dynamic) -------------------------------
    px0, py0, px1, py1 = PILL_BOX
    draw.rounded_rectangle([px0, py0, px1, py1], radius=(py1 - py0) // 2, fill=BLUSH)

    # --- Botanicals ----------------------------------------------------------
    draw_sprig(img, 46, 1330, 560, 10, 0.4)
    draw_sprig(img, 64, 1340, 380, -6, 2.1)
    draw_sprig(img, 954, 1330, 640, -12, 1.2)
    draw_sprig(img, 936, 1340, 430, 8, 2.9)
    draw = ImageDraw.Draw(img)  # refresh draw after alpha compositing

    # --- Heart + static line above footer ------------------------------------
    draw_heart(draw, 500, 1268, 11, BLUSH)
    draw_tracked(draw, 500, 1294, "BEAUTIFUL FINDS FOR YOUR CREATIVE PROJECTS", pf_small, CHARCOAL, 4)

    # --- Footer band ----------------------------------------------------------
    draw.rectangle([16, 1352, W - 16, H - 16], fill=BLUSH_LIGHT)

    # Ornate price label (text stays dynamic)
    lx0, ly0, lx1, ly1 = 56, 1374, 264, 1474
    c = 14  # corner notch size -> plaque shape
    draw.polygon([(lx0 + c, ly0), (lx1 - c, ly0), (lx1, ly0 + c), (lx1, ly1 - c),
                  (lx1 - c, ly1), (lx0 + c, ly1), (lx0, ly1 - c), (lx0, ly0 + c)], fill=BLUSH)
    draw.polygon([(lx0 + c + 4, ly0 + 4), (lx1 - c - 4, ly0 + 4), (lx1 - 4, ly0 + c + 4),
                  (lx1 - 4, ly1 - c - 4), (lx1 - c - 4, ly1 - 4), (lx0 + c + 4, ly1 - 4),
                  (lx0 + 4, ly1 - c - 4), (lx0 + 4, ly0 + c + 4)], outline=CREAM)
    draw_bow(draw, (lx0 + lx1) / 2, 1392, 13, CREAM, 1)

    # Centered brand line
    draw_tracked(draw, 560, 1414, "HOE OF ALL HOBBIES", pf_footer, FOOTER_TEXT, 6)

    # Watercolor hoe icon in a white circle (bottom-right), fully inside the
    # frame but straddling the footer band edge like the sample.
    ccx, ccy, cr = 884, 1406, 60
    draw.ellipse([ccx - cr, ccy - cr, ccx + cr, ccy + cr], fill="#ffffff", outline=BLUSH, width=3)
    icon = Image.open(HOE_ICON).convert("RGB").resize((96, 96), Image.LANCZOS)
    img.paste(icon, (ccx - 48, ccy - 48))

    img.convert("RGB").save(OUT, "PNG", optimize=True)
    print(f"  wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)")
    print("Dynamic slots for the og route:")
    print(f"  PHOTO_BOX={PHOTO_BOX}  PILL_BOX={PILL_BOX}")
    print(f"  TITLE_BOX={TITLE_BOX}  PRICE_BOX={PRICE_BOX}")


if __name__ == "__main__":
    print("Ensuring fonts...")
    ensure_fonts()
    print("Rendering template...")
    build()
