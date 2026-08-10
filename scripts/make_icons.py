#!/usr/bin/env python3
"""
Generate optimized brand-icon variants from public/images/hoe-icon-original.png
(watercolor garden hoe with pink bow, white background, no alpha).

Outputs:
  public/images/hoe-icon-512.png / -192.png / -64.png  — web UI variants
  app/icon.png        (512x512) — Next App Router icon
  app/apple-icon.png  (180x180) — iOS touch icon
  app/favicon.ico     (16/32/48 multi-size ICO)

The source has no alpha channel (white background); variants keep it — square
white icons are fine for favicon purposes, and UI usages apply their own
rounding. Re-run whenever the master icon changes: python scripts/make_icons.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "images" / "hoe-icon-original.png"


def resized(img: Image.Image, px: int) -> Image.Image:
    return img.resize((px, px), Image.LANCZOS)


def save_png(img: Image.Image, path: Path, px: int) -> None:
    out = resized(img, px)
    out.save(path, "PNG", optimize=True)
    print(f"  {path.relative_to(ROOT)}  {px}x{px}  {path.stat().st_size / 1024:.1f} KB")


def main() -> None:
    img = Image.open(SOURCE).convert("RGB")
    print(f"Source: {SOURCE.name} {img.size[0]}x{img.size[1]}")

    for px in (512, 192, 64):
        save_png(img, ROOT / "public" / "images" / f"hoe-icon-{px}.png", px)

    save_png(img, ROOT / "app" / "icon.png", 512)
    save_png(img, ROOT / "app" / "apple-icon.png", 180)

    # Multi-size ICO: Pillow resamples internally when given `sizes`.
    ico_path = ROOT / "app" / "favicon.ico"
    resized(img, 48).save(ico_path, "ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"  {ico_path.relative_to(ROOT)}  16/32/48  {ico_path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
