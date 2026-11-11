"""Jasmin 2 : une créature en image seule (le code l'anime). Fond vert, ou bleu pour une créature verte.
   usage : python3 image.py <image.png> <sortie.webp> <hauteur> [vert|bleu] [gauche|droite : ne garder qu'une moitié de l'image]"""
import numpy as np, sys, os
from PIL import Image
from scipy import ndimage as nd
src, out, H = sys.argv[1], sys.argv[2], int(sys.argv[3]); fond = sys.argv[4] if len(sys.argv) > 4 else 'vert'; part = sys.argv[5] if len(sys.argv) > 5 else ''
im = Image.open(src).convert('RGB')
if part: w = im.width // 2; im = im.crop((0, 0, w, im.height)) if part == 'gauche' else im.crop((w, 0, im.width, im.height))
a = np.array(im).astype(float); r, g, b = a[..., 0], a[..., 1], a[..., 2]
k = (g - np.maximum(r, b)) if fond == 'vert' else (b - np.maximum(r, g)); al = np.clip((40 - k) / 26, 0, 1); lab, n = nd.label(al > .5)
if n > 1: sizes = nd.sum(al > .5, lab, range(1, n + 1)); al = al * nd.binary_dilation(np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > sizes.max() * .03]), iterations=2)
if fond == 'vert': a[..., 1] = np.where(al < 1, np.minimum(g, np.maximum(r, b) + 8), g)
else: a[..., 2] = np.where(al < 1, np.minimum(b, np.maximum(r, g) + 8), b)
ys, xs = np.nonzero(al > .5); o = Image.fromarray(np.dstack([a, al * 255]).astype(np.uint8), 'RGBA').crop((xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3)); o = o.resize((round(o.width * H / o.height), H), Image.LANCZOS)
o.save(out, quality=86, method=6); bg = Image.new('RGBA', o.size, (190, 215, 255, 255)); bg.alpha_composite(o); bg.convert('RGB').save('prev-' + os.path.basename(out)[:-5] + '.jpg'); print(os.path.basename(out), o.size, os.path.getsize(out) // 1024, 'Ko')
