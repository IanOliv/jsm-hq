// Human office-worker sprites, recoloured per agent (shirt = agent colour). The lead wears a crown.
// Original artwork drawn in code; no third-party assets.

import type { Texture } from "pixi.js";
import { shade } from "../../theme/tokens";
import { C } from "../engine/palette";
import { flipCanvas, spriteCanvas } from "../engine/pen";
import { canvasTexture } from "../engine/textures";

// Palette letters: k outline, S/s skin, H/h hair, B/b/L shirt (base/shadow/light), P/p trousers, F shoes, G gold.
// Every sprite is 12 wide x 14 high. HAT_* replaces the top two rows for the lead.
const HAT_CROWN = ["..kGk..kGk..", "..kGGGGGGk.."];
const HAIR_TOP = ["...kkkkkk...", "..kHHHHHHk.."];
const LEGS = ["..kPPPPPPk..", "..kPPkkPPk..", "..kFFk.kFFk."];
const HEAD_FRONT = ["..kHhHHHHk..", "..kHSSSSHk..", "..kSkSSkSk..", "...kSSSSk..."];
const HEAD_BACK = ["..kHHhHHHk..", "..kHHHHHHk..", "..kHHHHHHk..", "...kHHHHk..."];
const HEAD_SIDE = ["..kHHHHHHk..", "..kHHHHSSk..", "..kHHHSkSk..", "...kHHSSSk.."];
const BODY_FRONT = ["...kkSSkk...", ".kkLBBBBBkk.", ".kLBBBBBBbk.", "kSSBBBBBBbSk", ".kkbBBBBbkk."];
const BODY_BACK = ["...kksskk...", ".kkBBBBBBkk.", ".kBBBBBBBbk.", "kSSBBBBBBbSk", ".kkbBBBBbkk."];
const BODY_TYPE = ["...kksskk...", ".kkBBBBBBkk.", ".kBBBBBBBBk.", ".kSkBBBBkSk.", "..kkBBBBkk.."];
const BODY_SIDE = ["...kkSSkk...", "..kkLBBBBkk.", "..kLBBBBBBk.", "..kSBBBBBbk.", "..kSSBBBbk.."];
const LEGS_TYPE = ["..kPPPPPPk..", "...kPPPPk...", "...kFFFFk..."];
const LEGS_SIDE = ["...kPPPPk...", "...kPPPPk...", "...kFFFFFk.."];

export type Facing = "front" | "back" | "type" | "side" | "sideL";

export interface RobotSprites {
  canvases: Record<Facing, HTMLCanvasElement>;
  textures: Record<Facing, Texture>;
}

const canvasCache = new Map<string, Record<Facing, HTMLCanvasElement>>();
const spriteCache = new Map<string, RobotSprites>();

/** Plain canvases for each facing (no Pixi) — also used by HUD portraits. */
export function robotCanvases(color: string, lead: boolean): Record<Facing, HTMLCanvasElement> {
  const key = `${color}|${lead}`;
  const hit = canvasCache.get(key);
  if (hit) return hit;
  const pal = { k: C.ink, B: color, b: shade(color, -0.3), L: shade(color, 0.3), S: "#f2c29b", s: "#d49a74", H: "#4a3020", h: "#6b4a30", P: "#2f3a5a", p: "#222c46", F: "#f4efe6", G: C.gold };
  const top = lead ? HAT_CROWN : HAIR_TOP;
  const build = (head: string[], body: string[], legs: string[]) => spriteCanvas([...top, ...head, ...body, ...legs], pal);
  const side = build(HEAD_SIDE, BODY_SIDE, LEGS_SIDE);
  const canvases: Record<Facing, HTMLCanvasElement> = {
    front: build(HEAD_FRONT, BODY_FRONT, LEGS),
    back: build(HEAD_BACK, BODY_BACK, LEGS),
    type: build(HEAD_BACK, BODY_TYPE, LEGS_TYPE),
    side,
    sideL: flipCanvas(side),
  };
  canvasCache.set(key, canvases);
  return canvases;
}

export function robotSprites(color: string, lead: boolean): RobotSprites {
  const key = `${color}|${lead}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;
  const canvases = robotCanvases(color, lead);
  const textures = Object.fromEntries(Object.entries(canvases).map(([k, c]) => [k, canvasTexture(c)])) as Record<Facing, Texture>;
  const out = { canvases, textures };
  spriteCache.set(key, out);
  return out;
}

export const RABBIT = [
  "..k...k..", ".kOk.kOk.", ".kPk.kPk.", ".kPk.kPk.", ".kOkkkOk.", "kOOOOOOOk",
  "kOkOOOkOk", "kOOOpOOOk", ".kOWWWOk.", "kOOWWWOOk", "kOOWWWOOk", ".kkkkkkk.",
];
export const RABBIT_BLINK = [
  "..k...k..", ".kOk.kOk.", ".kPk.kPk.", ".kPk.kPk.", ".kOkkkOk.", "kOOOOOOOk",
  "kOOOOOOOk", "kkkOpOkkk", ".kOWWWOk.", "kOOWWWOOk", "kOOWWWOOk", ".kkkkkkk.",
];
export const RABBIT_PAL = { k: C.ink, O: C.rabbit, P: C.pink, p: "#ff5c86", W: C.white };

/** A small scanner eye used for review tools other than CodeRabbit. */
export const SCANNER = ["..kkkkk..", ".kMMMMMk.", "kMWWWWWMk", "kMWkkkWMk", "kMWWWWWMk", ".kMMMMMk.", "..kkkkk..", "....k....", "...kkk..."];
export const SCANNER_PAL = { k: C.ink, M: C.metal, W: C.white };
