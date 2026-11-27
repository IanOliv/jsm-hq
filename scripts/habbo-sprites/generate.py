#!/usr/bin/env python3
"""Generates src/office/draw/humanData.ts from the Habbo avatar libraries.

Usage (from the repo root):
  python3 scripts/habbo-sprites/fetch.py       # once: download + unpack into .cache/
  python3 scripts/habbo-sprites/generate.py    # writes src/office/draw/humanData.ts

Needs Python 3 and Pillow (pip install pillow). Pillow is a tool for this script only; it is
not a project dependency.

Pipeline: compose the standing pose per direction from the avatar parts, one pass per tintable
layer, box-downscale to 20 x 48, quantise to four shade levels (k = outline, a-d = shades).
"""
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).parent
CACHE = HERE / ".cache"
OUT = HERE.parent.parent / "src" / "office" / "draw" / "humanData.ts"

# --- compose ---
LIB={}
def lib(p):
    if p not in LIB:
        d=json.load(open(CACHE/f'{p}.json'))
        LIB[p]=(d['assets'],d['spritesheet']['frames'],Image.open(CACHE/f'{p}.png').convert('RGBA'))
    return LIB[p]
def tint(im,c):
    r,g,b=[int(c[i:i+2],16) for i in (1,3,5)]
    px=im.load()
    out=im.copy(); o=out.load()
    for y in range(im.height):
        for x in range(im.width):
            R,G,B,A=px[x,y]
            if A: o[x,y]=(R*r//255,G*g//255,B*b//255,A)
    return out
def part(libname,name,anchor,canvas,color=None,flip=False):
    assets,frames,sheet=lib(libname)
    a=assets.get(name)
    if a is None: return False
    src=a.get('source',name); fl=a.get('flipH',False)
    f=frames.get(f'hh_human_{libname}_{src}')
    if f is None: return False
    fr=f['frame']; ss=f['spriteSourceSize']
    im=sheet.crop((fr['x'],fr['y'],fr['x']+fr['w'],fr['y']+fr['h']))
    if color: im=tint(im,color)
    ox=a['x']; 
    if fl: im=im.transpose(Image.FLIP_LEFT_RIGHT)
    # place: top-left of source = anchor - offset ; trimmed shift
    if fl: x=anchor[0]+ox-ss['x']-fr['w']  ; 
    else: x=anchor[0]-ox+ss['x']
    y=anchor[1]-a['y']+ss['y']
    canvas.alpha_composite(im,(int(x),int(y)))
    return True
ORDER=['hrb','bd','lg','lh','ch','cc','lc','ls','hd','fc','ey','hr','rh','rs','rc']
def figure(d,skin='#F3C9A0',shirt='#3b7de0',pants='#2a2f4a',hair='#5a3a1e',hid=1,act='std',fr=0,mirror=False):
    cv=Image.new('RGBA',(96,128),(0,0,0,0)); anchor=(48,100)
    spec={'hrb':('hair',hair,hid),'hr':('hair',hair,hid),'lg':('leg',pants,1),'bd':('body',skin,1),'lh':('body',skin,1),'rh':('body',skin,1),'hd':('body',skin,1),'fc':('face',skin,1),'ey':('face',None,1),'ch':('shirt',shirt,1),'cc':('shirt',shirt,800),'lc':('shirt',shirt,800),'rc':('shirt',shirt,800),'ls':('shirt',shirt,1),'rs':('shirt',shirt,1)}
    for p in ORDER:
        L,c,i=spec[p]
        part(L,f'h_{act}_{p}_{i}_{d}_{fr}',anchor,cv,c)
    return cv

# --- generate ---
BOX=(65,26,96,104); H=48; W=19; CW=20
# (pass kind, parts[(lib,part,id)])
PASSES=[('hair',[('hair','hrb',8)]),('skin',[('body','bd',1)]),('pants',[('leg','lg',1)]),('skin',[('body','lh',1)]),
        ('shirt',[('shirt','ch',2),('shirt','ls',2)]),('skin',[('body','hd',1),('face','fc',1)]),('eyes',[('face','ey',1)]),
        ('hair',[('hair','hr',8)]),('skin',[('body','rh',1)]),('shirt',[('shirt','rs',2)])]
ARMS={'lh','rh','ls','rs'}
def layer(d,parts):
    cv=Image.new('RGBA',(96,128),(0,0,0,0))
    for L,p,i in parts:
        ok=part(L,f'h_std_{p}_{i}_{d}_0',(48,100),cv,None)
        if not ok and p in('ls','rs'): part(L,f'h_std_{p}_1_{d}_0',(48,100),cv,None)
    return cv.crop(BOX)
def rows(im,dy=0):
    r=im.resize((W,H),Image.BOX); px=r.load(); out=[]
    for y in range(H):
        s=''
        for x in range(CW):
            if x>=W: s+='.'; continue
            R,G,B,A=px[x,y]
            if A<110: s+='.'; continue
            g=(R+G+B)//3
            s+='k' if g<50 else 'a' if g<130 else 'b' if g<190 else 'c' if g<235 else 'd'
        out.append(s)
    if dy:
        out=out[-dy:] and out[dy:]+['.'*CW]*dy if dy>0 else out
    return out
def eyes(im):
    px=im.load(); pts=[(x,y) for y in range(im.height) for x in range(im.width) if px[x,y][3]>200 and sum(px[x,y][:3])//3<90]
    if not pts: return None
    y0=min(p[1] for p in pts); pts=[p for p in pts if p[1]>=y0+2]
    if not pts: return None
    pts.sort(); cl=[[pts[0]]]
    for p in pts[1:]:
        (cl[-1].append(p) if p[0]-cl[-1][-1][0]<=3 else cl.append([p]))
    rowsx=[['.']*CW for _ in range(H)]
    for c_ in cl:
        cx=sum(p[0] for p in c_)/len(c_); cy=sum(p[1] for p in c_)/len(c_)
        x=min(W-1,int(cx*W/im.width)); y=min(H-1,int(cy*H/im.height)); rowsx[y][x]='k'
        if y+1<H: rowsx[y+1][x]='k'
    return [''.join(r) for r in rowsx]
def facing(d,type_=False):
    res=[]
    for kind,parts in PASSES:
        im=layer(d,parts)
        if im.getbbox() is None: continue
        if kind=='eyes':
            r=eyes(im)
            if r: res.append(('eyes',r))
            continue
        arm=any(p in ARMS for _,p,_ in parts)
        r=rows(im,2 if (type_ and arm) else 0)
        if any(ch!='.' for row in r for ch in row): res.append((kind,r))
    return res
def emit(name,f):
    s=f'  {name}: [\n'
    for kind,r in f:
        s+=f'    ["{kind}", [\n'+''.join(f'      "{x}",\n' for x in r)+'    ]],\n'
    return s+'  ],\n'
out='''// GENERATED pixel data for the human sprites (20 x 48 px, layered passes).
// Each pass is one tintable layer; letters k/a/b/c/d = outline and 4 shade levels.
// Derived from avatar parts of the Habbo client (see docs/habbo-sprite-assets.md).
export type PassKind = "skin" | "hair" | "shirt" | "pants" | "eyes";
export type Pass = [PassKind, string[]];
export const HUMAN_W = 20;
export const HUMAN_H = 48;
export const HUMAN: Record<"front" | "back" | "side" | "type", Pass[]> = {
'''
out+=emit('front',facing(3))+emit('back',facing(7))+emit('side',facing(1))+emit('type',facing(7,True))+'};\n'
OUT.write_text(out)
print(f'wrote {OUT} ({len(out)} bytes)')
