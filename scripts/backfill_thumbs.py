#!/usr/bin/env python3
"""
One-time backfill: generate `_thumb.webp` thumbnails for EXISTING listing
photos in Supabase Storage (see lib/imageThumb.ts for the URL convention the
frontend uses — this script replicates it exactly):

    product-images/<uid>/<uuid>.<ext>   ->  product-images/<uid>/<uuid>_thumb.webp

Behavior:
  * Fetches products.images via the REST API, keeps only URLs hosted in the
    product-images bucket (external URLs — Cloudinary, Unsplash, pasted —
    are skipped).
  * Idempotent: skips images whose thumb object already exists (HEAD 200).
  * Downloads the original (skips files > 25 MB with a warning), resizes to
    <=480px long edge with Pillow (first frame only for GIFs), encodes WebP
    quality 80, uploads with x-upsert. Per-image failures are logged and the
    run continues. Originals and the database are never modified.

Credentials (never printed, never committed): read from the process
environment first, then dotenv-style `.env.local` / `.env` in the project
root. NEXT_PUBLIC_SUPABASE_URL is required. Uploads need
SUPABASE_SERVICE_ROLE_KEY; reads and downloads fall back to the anon key so
`--dry-run` works without secrets.

Usage:
    python scripts/backfill_thumbs.py            # full run (needs service key)
    python scripts/backfill_thumbs.py --dry-run  # analyze + resize only
"""

import io
import os
import re
import sys
from pathlib import Path

import requests
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BUCKET = "product-images"
BUCKET_MARKER = "/product-images/"
THUMB_SUFFIX = "_thumb.webp"
MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024
MAX_THUMB_EDGE = 480
WEBP_QUALITY = 80

DRY_RUN = "--dry-run" in sys.argv


# ---------------------------------------------------------------------------
# Credentials
# ---------------------------------------------------------------------------

def load_env() -> dict:
    env = dict(os.environ)
    for name in (".env.local", ".env"):
        path = PROJECT_ROOT / name
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            env.setdefault(key, value)
    return env


ENV = load_env()
SUPABASE_URL = (ENV.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
SERVICE_KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY") or ""
ANON_KEY = ENV.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or ""
READ_KEY = SERVICE_KEY or ANON_KEY

if not SUPABASE_URL or not READ_KEY:
    sys.exit(
        "Missing NEXT_PUBLIC_SUPABASE_URL and a Supabase key. Provide them via "
        "environment variables or a .env.local file in the project root."
    )

if not SERVICE_KEY:
    print("[warn] SUPABASE_SERVICE_ROLE_KEY not found — running in dry-run mode "
          "(no uploads).\n")
    DRY_RUN = True


# ---------------------------------------------------------------------------
# URL mapping — must mirror lib/imageThumb.ts exactly
# ---------------------------------------------------------------------------

def is_bucket_image(url: str) -> bool:
    return bool(url) and "_thumb." not in url and BUCKET_MARKER in url


def thumb_url(url: str) -> str:
    return re.sub(r"\.[a-zA-Z0-9]+(\?.*)?$", THUMB_SUFFIX, url)


def storage_path(public_url: str) -> str | None:
    m = re.search(r"/storage/v1/object/public/" + re.escape(BUCKET) + r"/(.+)$", public_url)
    return m.group(1) if m else None


# ---------------------------------------------------------------------------
# Steps
# ---------------------------------------------------------------------------

def fetch_product_images() -> list[str]:
    """All bucket-hosted image URLs across products, deduped."""
    urls: set[str] = set()
    offset = 0
    page = 1000
    while True:
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/products",
            params={"select": "images", "offset": offset, "limit": page},
            headers={"apikey": READ_KEY, "Authorization": f"Bearer {READ_KEY}"},
            timeout=30,
        )
        res.raise_for_status()
        rows = res.json()
        for row in rows:
            for url in row.get("images") or []:
                if isinstance(url, str) and is_bucket_image(url):
                    urls.add(url)
        if len(rows) < page:
            break
        offset += page
    return sorted(urls)


def thumb_exists(url: str) -> bool:
    try:
        return requests.head(thumb_url(url), timeout=15).status_code == 200
    except requests.RequestException:
        return False


def build_thumb(url: str) -> bytes | None:
    """Download + resize. Returns WebP bytes, or None to skip (logged)."""
    try:
        res = requests.get(url, timeout=60, stream=True)
        if res.status_code != 200:
            print(f"  [fail] download HTTP {res.status_code}: {url}")
            return None
        length = int(res.headers.get("Content-Length") or 0)
        if length > MAX_DOWNLOAD_BYTES:
            print(f"  [skip] {length / 1e6:.1f} MB exceeds 25 MB cap: {url}")
            return None
        data = res.content
        if len(data) > MAX_DOWNLOAD_BYTES:
            print(f"  [skip] downloaded body exceeds 25 MB cap: {url}")
            return None
    except requests.RequestException as e:
        print(f"  [fail] download error: {e}: {url}")
        return None

    try:
        with Image.open(io.BytesIO(data)) as img:
            if getattr(img, "is_animated", False):  # GIF: first frame only
                img.seek(0)
            frame = img.convert("RGB")
            frame.thumbnail((MAX_THUMB_EDGE, MAX_THUMB_EDGE), Image.LANCZOS)
            out = io.BytesIO()
            frame.save(out, "WEBP", quality=WEBP_QUALITY)
            return out.getvalue()
    except Exception as e:
        print(f"  [fail] resize error: {e}: {url}")
        return None


def upload_thumb(path: str, webp: bytes) -> bool:
    try:
        res = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}",
            data=webp,
            headers={
                "Authorization": f"Bearer {SERVICE_KEY}",
                "Content-Type": "image/webp",
                "x-upsert": "true",
            },
            timeout=60,
        )
        if res.status_code in (200, 201):
            return True
        print(f"  [fail] upload HTTP {res.status_code}: {res.text[:200]}")
        return False
    except requests.RequestException as e:
        print(f"  [fail] upload error: {e}")
        return False


def main() -> None:
    print(f"Fetching product images from {SUPABASE_URL} ...\n")
    images = fetch_product_images()
    total = len(images)
    print(f"Found {total} bucket-hosted image(s) across all products.\n")

    existed = created = failed = pending = 0

    for i, url in enumerate(images, 1):
        label = f"[{i}/{total}]"
        if thumb_exists(url):
            existed += 1
            continue

        webp = build_thumb(url)
        if webp is None:
            failed += 1
            continue

        path = storage_path(thumb_url(url))
        if not path:
            print(f"  [fail] could not derive storage path: {url}")
            failed += 1
            continue

        if DRY_RUN:
            pending += 1
            print(f"{label} would create {path} ({len(webp) / 1024:.0f} KB)")
        else:
            if upload_thumb(path, webp):
                created += 1
                print(f"{label} created {path} ({len(webp) / 1024:.0f} KB)")
            else:
                failed += 1

    print("\n================ SUMMARY ================")
    print(f"Bucket-hosted images total : {total}")
    print(f"Thumbs already existed     : {existed}")
    if DRY_RUN:
        print(f"Thumbs pending (dry-run)   : {pending}")
    else:
        print(f"Thumbs created             : {created}")
    print(f"Failed                     : {failed}")
    print("(External URLs are not in this list — they are skipped upstream.)")
    if DRY_RUN and pending:
        print("\nRe-run without --dry-run and with SUPABASE_SERVICE_ROLE_KEY set to upload.")


if __name__ == "__main__":
    main()
