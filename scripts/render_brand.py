#!/usr/bin/env python3
"""Seva Sagar brand renderer.
Renders the SAME bezier geometry used by the adaptive vector icon into
legacy launcher PNGs, splash art, web logos and the admin panel mark.
Pure Pillow + numpy, no external services.
"""
import os, math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, 'app', 'android', 'res')
WEB = os.path.join(ROOT, 'app', 'web', 'assets')
ADM = os.path.join(ROOT, 'admin', 'assets')

# ---- geometry (identical to ic_launcher_foreground.xml, 108x108 viewport) ----
FLAME = [(54,24),(57.5,30),(61,32.5),(61,36.5),(61,40.6),(57.9,44),(54,44),
         (50.1,44),(47,40.6),(47,36.5),(47,32.5),(50.5,30),(54,24)]
PET_C = [(54,46),(58.5,53),(58.5,60),(54,66),(49.5,60),(49.5,53),(54,46)]
PET_L = [(41,50),(48,53),(52.5,59),(54,66),(46.5,64),(42,58),(41,50)]
PET_R = [(67,50),(60,53),(55.5,59),(54,66),(61.5,64),(66,58),(67,50)]
PET_OL= [(31,59),(40,59),(49.5,62),(54,66),(45,68.5),(36,66),(31,59)]
PET_OR= [(77,59),(68,59),(58.5,62),(54,66),(63,68.5),(72,66),(77,59)]
WAVE  = [(32,74),(37.3,70.5),(42.7,77.5),(48,74),(53.3,70.5),(58.7,77.5),(64,74),
         (69.3,70.5),(74.7,77.5),(79,74)]

def cubic_path(pts, steps=28):
    """pts = M followed by groups of 3 (C). Returns flattened polyline."""
    out = [pts[0]]
    for i in range(1, len(pts) - 2, 3):
        p0 = out[-1]; p1, p2, p3 = pts[i], pts[i+1], pts[i+2]
        for s in range(1, steps + 1):
            t = s / steps; u = 1 - t
            x = u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0]
            y = u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]
            out.append((x, y))
    return out

def lin_gradient(size, c1, c2, p1, p2):
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx, dy = p2[0]-p1[0], p2[1]-p1[1]
    L2 = dx*dx + dy*dy
    t = np.clip(((xx-p1[0])*dx + (yy-p1[1])*dy) / L2, 0, 1)[..., None]
    a = np.array(c1, np.float32); b = np.array(c2, np.float32)
    return Image.fromarray((a*(1-t) + b*t).astype(np.uint8), 'RGB')

def radial_gradient(size, c1, c2, center, radius):
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((xx-center[0])**2 + (yy-center[1])**2) / radius
    t = np.clip(d, 0, 1)[..., None]
    a = np.array(c1, np.float32); b = np.array(c2, np.float32)
    return Image.fromarray((a*(1-t) + b*t).astype(np.uint8), 'RGB')

def render(size, *, bg='dark', shape='squircle', fg_scale=1.16, halo=True, ss=4):
    S = size * ss
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    k = S / 108.0

    # ---------- background ----------
    if bg == 'dark':
        grad = radial_gradient((S, S), (20, 38, 58), (7, 12, 22), (54*k, 42*k), 78*k).convert('RGBA')
    elif bg == 'light':
        grad = radial_gradient((S, S), (255, 255, 255), (232, 240, 236), (54*k, 42*k), 78*k).convert('RGBA')
    else:
        grad = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    mask = Image.new('L', (S, S), 0); md = ImageDraw.Draw(mask)
    if shape == 'circle':
        md.ellipse([0, 0, S-1, S-1], fill=255)
    elif shape == 'squircle':
        md.rounded_rectangle([0, 0, S-1, S-1], radius=int(S*0.235), fill=255)
    else:
        md.rectangle([0, 0, S-1, S-1], fill=255)
    img.paste(grad, (0, 0), mask)

    # ---------- foreground layer ----------
    fg = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    def T(p):
        x, y = p
        return ((54 + (x-54)*fg_scale)*k, (54 + (y-54)*fg_scale)*k)
    def poly(pts, fill):
        ImageDraw.Draw(fg).polygon([T(p) for p in cubic_path(pts)], fill=fill)
    def gradpoly(pts, c1, c2, a, b):
        m = Image.new('L', (S, S), 0)
        ImageDraw.Draw(m).polygon([T(p) for p in cubic_path(pts)], fill=255)
        g = lin_gradient((S, S), c1, c2, T(a), T(b)).convert('RGBA')
        fg.paste(g, (0, 0), m)

    if halo:
        d = ImageDraw.Draw(fg)
        r = 40*k*fg_scale
        d.ellipse([54*k-r, 54*k-r, 54*k+r, 54*k+r], outline=(34, 197, 94, 46), width=max(1, int(1.6*k)))

    poly(PET_OL, (22, 163, 74, 217))
    poly(PET_OR, (22, 163, 74, 217))
    poly(PET_L, (34, 197, 94, 255))
    poly(PET_R, (34, 197, 94, 255))
    gradpoly(PET_C, (110, 231, 160), (22, 163, 74), (49, 46), (59, 66))
    gradpoly(FLAME, (255, 209, 102), (255, 122, 24), (47, 24), (61, 44))

    wpts = [T(p) for p in cubic_path(WAVE)]
    ImageDraw.Draw(fg).line(wpts, fill=(74, 222, 128, 255), width=max(2, int(3*k*fg_scale)), joint='curve')
    for p in (wpts[0], wpts[-1]):
        rr = max(1, int(1.5*k*fg_scale))
        ImageDraw.Draw(fg).ellipse([p[0]-rr, p[1]-rr, p[0]+rr, p[1]+rr], fill=(74, 222, 128, 255))

    img = Image.alpha_composite(img, fg)
    return img.resize((size, size), Image.LANCZOS)

def main():
    for d in (WEB, ADM):
        os.makedirs(d, exist_ok=True)
    dens = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
    for name, px in dens.items():
        p = os.path.join(RES, 'mipmap-' + name)
        os.makedirs(p, exist_ok=True)
        render(px).save(os.path.join(p, 'ic_launcher.png'))
        render(px, shape='circle').save(os.path.join(p, 'ic_launcher_round.png'))
    render(512).save(os.path.join(WEB, 'logo-512.png'))
    render(192).save(os.path.join(WEB, 'logo-192.png'))
    render(512, shape='square').save(os.path.join(ADM, 'logo-512.png'))
    render(180, shape='circle', bg='light').save(os.path.join(WEB, 'logo-light-180.png'))
    # notification small icon must be pure alpha/white -> drawable-nodpi png
    nd = os.path.join(RES, 'drawable-nodpi'); os.makedirs(nd, exist_ok=True)
    mono = render(96, bg='none', shape='square', fg_scale=1.0, halo=False, ss=6)
    a = np.array(mono); a[..., 0:3] = 255
    Image.fromarray(a).save(os.path.join(nd, 'ic_stat_seva.png'))
    print('icons written')

if __name__ == '__main__':
    main()
