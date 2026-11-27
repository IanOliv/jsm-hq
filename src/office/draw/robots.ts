// Agent sprites: small humans (head, hair, shirt, trousers), recoloured per
// agent. The shirt is the agent colour; the lead wears a gold crown. The pixel data lives in
// humanData.ts (see docs/habbo-sprite-assets.md for where it comes from and its licence status).

import type { Texture } from "pixi.js";
import { C } from "../engine/palette";
import { flipCanvas, makeCanvas, spriteCanvas } from "../engine/pen";
import { canvasTexture } from "../engine/textures";
import { HUMAN, HUMAN_H, HUMAN_W, type PassKind } from "./humanData";

const CROWN = ["G..G..G..G.", "GG.GG.GG.GG", "GGGGGGGGGGG", "GkGkGkGkGkG", "GGGGGGGGGGG"];
const FIXED: Record<Exclude<PassKind, "shirt">, string> = { skin: "#f1c9a0", hair: "#b9824a", pants: "#2b3050", eyes: "#ffffff" };
const LEVELS = [0.5, 0.72, 0.88, 1];

export type Facing = "front" | "back" | "type" | "side" | "sideL";

export interface RobotSprites {
  canvases: Record<Facing, HTMLCanvasElement>;
  textures: Record<Facing, Texture>;
}

const canvasCache = new Map<string, Record<Facing, HTMLCanvasElement>>();
const spriteCache = new Map<string, RobotSprites>();

function mul(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.min(255, v * f)).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

function build(face: keyof typeof HUMAN, color: string, lead: boolean): HTMLCanvasElement {
  const out = makeCanvas(HUMAN_W, HUMAN_H);
  const g = out.getContext("2d");
  if (!g) return out;
  for (const [kind, rows] of HUMAN[face]) {
    const base = kind === "shirt" ? color : FIXED[kind];
    const pal: Record<string, string> = { k: C.ink };
    LEVELS.forEach((f, i) => (pal["abcd"[i]] = kind === "eyes" ? (i < 2 ? C.ink : base) : mul(base, f)));
    g.drawImage(spriteCanvas(rows, pal), 0, 0);
  }
  if (lead) g.drawImage(spriteCanvas(CROWN, { k: C.ink, G: C.gold }), 4, 0);
  return out;
}

/** Plain canvases for each facing (no Pixi) — also used by HUD portraits. */
export function robotCanvases(color: string, lead: boolean): Record<Facing, HTMLCanvasElement> {
  const key = `${color}|${lead}`;
  const hit = canvasCache.get(key);
  if (hit) return hit;
  const side = build("side", color, lead);
  const canvases: Record<Facing, HTMLCanvasElement> = {
    front: build("front", color, lead),
    back: build("back", color, lead),
    type: build("type", color, lead),
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
