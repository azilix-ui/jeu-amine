"""Jasmin 2 : planche d'une créature à partir de vidéos sur fond vert.
   usage : python3 bete.py <sortie.webp> <hauteur de case> <video>:<loop|seq>:<n images> [<video>:<mode>:<n> ...]
   Une ligne par vidéo ; toutes les images sont recadrées sur le même rectangle (pas de tremblement).
   loop = une boucle trouvée toute seule (marche, vol) ; seq = n images réparties sur toute la vidéo."""
import numpy as np, subprocess, sys, os, glob, shutil, json
from PIL import Image
from scipy import ndimage as nd
def frames(path):
    d = path + '.fr'; shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-vf', 'scale=480:-1', d + '/%03d.png'], check=True); out = []
    for f in sorted(glob.glob(d + '/*.png')):
        a = np.array(Image.open(f).convert('RGB')).astype(float); r, g, b = a[..., 0], a[..., 1], a[..., 2]
        k = g - np.maximum(r, b); al = np.clip((40 - k) / 26, 0, 1); lab, n = nd.label(al > .5)
        if n > 1: sizes = nd.sum(al > .5, lab, range(1, n + 1)); keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > sizes.max() * .03]); al = al * nd.binary_dilation(keep, iterations=2)
        a[..., 1] = np.where(al < 1, np.minimum(g, np.maximum(r, b) + 8), g); out.append((a, al))
    shutil.rmtree(d, ignore_errors=True); return out
def pick(fr, mode, n):
    if mode == 'seq': return [fr[int(round(x))] for x in np.linspace(3, len(fr) - 2, n)], None
    M = [al > .5 for _, al in fr]; N = len(M); cand = []
    for i in range(4, 44):
        for L in range(8, 30):
            if i + L + 1 < N: cand.append(((M[i] ^ M[i + L]).mean() + (M[i + 1] ^ M[i + L + 1]).mean() + .0004 * abs(L - 16), i, L))
    _, i0, L = min(cand); return [fr[i0 + int(round(k * L / n))] for k in range(n)], (i0, L)
out, CH = sys.argv[1], int(sys.argv[2]); rows = []; info = []
for spec in sys.argv[3:]:
    v, mode, n = spec.split(':'); sel, lp = pick(frames(v), mode, int(n)); rows.append(sel); info.append((os.path.basename(v), mode, lp))
ys, xs = np.nonzero(np.max([al for r in rows for _, al in r], axis=0) > .5); x0, x1, y0, y1 = xs.min() - 2, xs.max() + 3, ys.min() - 2, ys.max() + 3
k = CH / (y1 - y0); CW = int(round((x1 - x0) * k)); cols = max(len(r) for r in rows); sheet = Image.new('RGBA', (CW * cols, CH * len(rows)), (0, 0, 0, 0))
for j, r in enumerate(rows):
    for i, (a, al) in enumerate(r):
        im = Image.fromarray(np.dstack([a, al * 255]).astype(np.uint8), 'RGBA').crop((x0, y0, x1, y1)).resize((CW, CH), Image.LANCZOS); sheet.paste(im, (i * CW, j * CH))
sheet.save(out, quality=84, method=6); bg = Image.new('RGBA', sheet.size, (190, 215, 255, 255)); bg.alpha_composite(sheet); bg.convert('RGB').save('prev-' + os.path.basename(out)[:-5] + '.jpg')
print(os.path.basename(out), 'case', CW, 'x', CH, 'colonnes', cols, info, os.path.getsize(out) // 1024, 'Ko')
