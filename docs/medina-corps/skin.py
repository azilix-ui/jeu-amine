"""Remet une planche habillée par Higgsfield (fond vert) au format du jeu : 1056 x 1152, fond transparent.
   usage : python3 skin.py <image-higgsfield.png> <planche-de-base.webp> <sortie.webp>"""
import numpy as np, sys
from PIL import Image
from scipy import ndimage as nd
src, base, out = sys.argv[1:4]
B = np.array(Image.open(base).convert('RGBA')); H, W = B.shape[:2]
a = np.array(Image.open(src).convert('RGB').resize((W, H), Image.LANCZOS)).astype(float); r, g, b = a[..., 0], a[..., 1], a[..., 2]
k = g - np.maximum(r, b); al = np.clip((48 - k) / 30, 0, 1)
# on ne garde que ce qui touche la silhouette d'origine (un peu élargie : cape, casque…)
near = nd.binary_dilation(B[..., 3] > 60, iterations=14); al = al * near
a[..., 1] = np.where(al < 1, np.minimum(g, np.maximum(r, b) + 8), g)
S = np.dstack([a, al * 255]).astype(np.uint8)
# recalage case par case sur la silhouette d'origine (évite que le personnage tremble)
CW, CH = W // 6, H // 4; O = np.zeros_like(S); sh = []
for i in range(24):
    x0, y0 = (i % 6) * CW, (i // 6) * CH; c = S[y0:y0+CH, x0:x0+CW]; m = c[..., 3] > 128; mb = B[y0:y0+CH, x0:x0+CW, 3] > 128
    if m.sum() < 50 or mb.sum() < 50: O[y0:y0+CH, x0:x0+CW] = c; continue
    ys, xs = np.nonzero(m); yb, xb = np.nonzero(mb); dx = int(round(np.median(xb) - np.median(xs))); dy = int(round(np.percentile(yb, 99) - np.percentile(ys, 99)))
    dx = max(-8, min(8, dx)); dy = max(-8, min(8, dy)); sh.append((dx, dy))
    O[y0:y0+CH, x0:x0+CW] = nd.shift(c, (dy, dx, 0), order=0, mode='constant', cval=0)
Image.fromarray(O, 'RGBA').save(out, quality=84, method=6)
bg = Image.new('RGBA', (W, H), (190, 215, 255, 255)); bg.alpha_composite(Image.fromarray(O, 'RGBA')); bg.convert('RGB').resize((W // 2, H // 2)).save(out[:-5] + '.prev.jpg')
print(out, 'décalages max', max(abs(v) for s in sh for v in s), sh[:12])
