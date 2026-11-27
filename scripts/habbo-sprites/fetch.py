#!/usr/bin/env python3
"""Downloads the five Habbo avatar libraries (pinned versions) and unpacks them into .cache/.

Usage: python3 scripts/habbo-sprites/fetch.py
Needs only the Python standard library. Raw sheets stay in .cache/ (git-ignored).
"""
import hashlib, json, struct, sys, urllib.request, zlib
from pathlib import Path

CACHE = Path(__file__).parent / ".cache"
BASE = "https://cdn.habboassets.com/derived/clothing"
# part -> (version, sha256 of the .nitro file)
LIBS = {
    "body": ("38955", "039ceb41032917c0f1144c4514dbfe2dcad08cb4d94647a0998c5365b2423530"),
    "face": ("50491", "f8a9ff62009866be92cfa876210171e33797bbc3ac3e7ec01141975b5bd32dd3"),
    "hair": ("50491", "fe9b79ef90a23dbc18264e48d933e17d66699315f596cf3d8337e0ce44ac922d"),
    "shirt": ("74162", "5e4a31bcfede04064b0bf51160dc611b9c04ea16d0eade0ed274890457e694d6"),
    "leg": ("25379", "ccb88cea46550daed4aec68f9959db6d1d08a90dbc4ad9ab5c0b97cb6f12ad42"),
}


def unpack(data: bytes) -> dict[str, bytes]:
    """A .nitro file: u16 count, then per file: u16 name length, name, u32 size, zlib data."""
    n = struct.unpack(">H", data[:2])[0]
    o, out = 2, {}
    for _ in range(n):
        ln = struct.unpack(">H", data[o:o + 2])[0]
        o += 2
        name = data[o:o + ln].decode()
        o += ln
        size = struct.unpack(">I", data[o:o + 4])[0]
        o += 4
        out[name] = zlib.decompress(data[o:o + size])
        o += size
    return out


def main() -> int:
    CACHE.mkdir(exist_ok=True)
    for part, (ver, want) in LIBS.items():
        name = f"hh_human_{part}"
        url = f"{BASE}/{name}/{ver}/{name}.nitro?download=1"
        req = urllib.request.Request(url, headers={"User-Agent": "curl/8"})  # the CDN rejects urllib's default agent
        data = urllib.request.urlopen(req, timeout=60).read()
        got = hashlib.sha256(data).hexdigest()
        if got != want:
            print(f"{name}: checksum mismatch (got {got})", file=sys.stderr)
            return 1
        files = unpack(data)
        (CACHE / f"{part}.json").write_bytes(files[f"{name}.json"])
        (CACHE / f"{part}.png").write_bytes(files[f"{name}.png"])
        print(f"ok {name} v{ver}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
