# Habbo-derived sprite data

`src/office/draw/humanData.ts` holds the agent character pixels (20 x 48 px, four facings).

**Origin.** The shapes come from the avatar libraries of the Habbo client
(`hh_human_body`, `hh_human_face`, `hh_human_hair`, `hh_human_shirt`, `hh_human_leg`), obtained
from the community archive https://www.habboassets.com/ in Nov 2026. They were composed
(standing pose; directions 3, 7, 1), downscaled to 48 px and quantised to four shade levels per
layer, then tinted at runtime (shirt = agent colour).

**Licence.** None found. The archive states it is not affiliated with Sulake, and the artwork
belongs to Sulake Corporation Oy. This repository is public and `humanData.ts` is already
published on every branch that has been pushed. The repository's own licence (MIT) does not
cover this data, and the maintainer approving the commit does not grant Sulake's rights. Until
the data is replaced with original or openly licensed art, treat it as third-party material
used without permission. The raw sprite sheets are not committed.

## Regenerating `humanData.ts`

The file is generated; do not edit it by hand. Needs Python 3 and Pillow (`pip install pillow==13.0.0`;
a tool for these scripts only, not a project dependency).

```sh
python3 scripts/habbo-sprites/fetch.py      # download + unpack the five parts into scripts/habbo-sprites/.cache/
python3 scripts/habbo-sprites/generate.py   # write src/office/draw/humanData.ts
git diff --exit-code src/office/draw/humanData.ts   # empty diff = reproducible
```

- `fetch.py` pins each part by version and checks its SHA-256, so a changed upstream file fails
  loudly instead of silently changing the sprites. The `.cache/` folder is git-ignored; raw
  sheets are never committed. It sends the User-Agent `curl/8` because the CDN answers 403 to
  Python's default agent; this is a workaround, not an agreement with the site.
- `generate.py` composes the standing pose for directions 3 (front), 7 (back) and 1 (side),
  one pass per tintable layer, downscales to 20 x 48, and quantises to four shade levels. It stops
  with an error if a part is missing; only the face and eyes seen from behind (direction 7) may
  be absent.
- The `side` view faces right; `sideL` is its mirror, made at runtime in `robots.ts`.
- The `type` sprite is not a real pose. The generator makes it from the back view by moving the
  arm layers up 2 rows; a proper typing pose is planned in HC-T06.
- Crown, shadow and the portrait crop are drawn in code (`robots.ts`, `kit.tsx`), not by the
  generator.
