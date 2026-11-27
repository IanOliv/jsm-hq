# Habbo-derived sprite data

`src/office/draw/humanData.ts` holds the agent character pixels (12 x 28 px, four facings).

**Origin.** The shapes come from the avatar libraries of the Habbo client
(`hh_human_body`, `hh_human_face`, `hh_human_hair`, `hh_human_shirt`, `hh_human_leg`), obtained
from the community archive https://www.habboassets.com/ in Nov 2026. They were composed
(standing pose; directions 3, 7, 1), downscaled to 28 px and quantised to four shade levels per
layer, then tinted at runtime (shirt = agent colour).

**Licence.** None found. The archive states it is not affiliated with Sulake, and the artwork
belongs to Sulake Corporation Oy. The maintainer approved committing this data; treat it as
temporary and replace it with original or openly licensed art before any public release.
The raw sprite sheets are not committed.
