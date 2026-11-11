"""Fabrique la planche d'un coureur de Médina Express à partir de 3 vidéos sur fond vert (course, saut, accroupi).
   Planche 6 x 4 cases de 176 x 288 : cases 0-11 la foulée, 12-19 le saut, 20-23 la glissade (accroupi).
   usage : python3 sheet.py <nom> [sortie.webp]   (vidéos : vid/<nom>-run.mp4, -jump.mp4, -slide.mp4 ; si saut ou glissade manque, on réutilise la course)"""
import numpy as np, subprocess, sys, os, glob, shutil
from PIL import Image
from scipy import ndimage as nd
CW, CH, WIN_W, WIN_H, TOP = 176, 288, 330, 540, 14
def frames(path):
    d = path + '.fr'; shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-vf', 'scale=414:-1', d + '/%03d.png'], check=True)
    out = []
    for f in sorted(glob.glob(d + '/*.png')):
        a = np.array(Image.open(f).convert('RGB')).astype(float); r, g, b = a[..., 0], a[..., 1], a[..., 2]
        k = g - np.maximum(r, b); al = np.clip((48 - k) / 30, 0, 1)
        lab, n = nd.label(al > .5)
        if n > 1:
            sizes = nd.sum(al > .5, lab, range(1, n + 1)); keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > sizes.max() * .04]); al = al * nd.binary_dilation(keep, iterations=3)
        a[..., 1] = np.where(al < 1, np.minimum(g, np.maximum(r, b) + 8), g)
        out.append((a, al))
    shutil.rmtree(d, ignore_errors=True); return out
def box(al):
    ys, xs = np.nonzero(al > .5); return int(np.median(xs)), int(ys.mean()), int(np.percentile(ys, 1)), int(np.percentile(ys, 99.5))
def cell(fr, cx, y0):
    a, al = fr; H, W = al.shape; rgba = np.dstack([a, al * 255]).astype(np.uint8); im = Image.new('RGBA', (WIN_W, WIN_H), (0, 0, 0, 0))
    src = Image.fromarray(rgba, 'RGBA'); im.paste(src, (-(cx - WIN_W // 2), -y0)); return im.resize((CW, CH), Image.LANCZOS)
def longest(mask):
    best = (0, 0); i = 0
    while i < len(mask):
        if mask[i]:
            j = i
            while j + 1 < len(mask) and mask[j + 1]: j += 1
            if j - i > best[1] - best[0] or best == (0, 0): best = (i, j)
            i = j + 1
        else: i += 1
    return best
def build(name, out):
    run = frames(f'vid/{name}-run.mp4'); M = [al > .5 for _, al in run]; n = len(M); cand = []
    for i in range(4, 40):
        for L in range(12, 34):
            if i + L + 1 < n: cand.append(((M[i] ^ M[i + L]).mean() + (M[i + 1] ^ M[i + L + 1]).mean(), i, L))
    _, i0, L = min(cand); B = [box(al) for _, al in run]; H0 = np.median([b[3] - b[2] for b in B]); ground = np.median([b[3] for b in B[:n]])
    cells = [cell(run[i0 + int(round(k * L / 12))], B[i0 + int(round(k * L / 12))][0], TOP) for k in range(12)]
    info = {'loop': (i0, L), 'H': float(H0)}
    # le saut : on recentre sur le milieu du corps (c'est le jeu qui fait monter le personnage)
    jp = f'vid/{name}-jump.mp4'
    if os.path.exists(jp):
        J = frames(jp); BJ = [box(al) for _, al in J]; g = np.median([b[3] for b in BJ[:6]]); a, b = longest([bb[3] < g - .07 * H0 for bb in BJ]); info['jump'] = (a, b)
        ids = [int(round(x)) for x in np.linspace(max(0, a - 2), min(len(J) - 1, b + 1), 8)]; cy0 = B[i0][1] - TOP
        cells += [cell(J[i], BJ[i][0], BJ[i][1] - cy0) for i in ids]
    else: cells += [cells[3]] * 8
    sp = f'vid/{name}-slide.mp4'
    if os.path.exists(sp):
        Sl = frames(sp); BS = [box(al) for _, al in Sl]; a, b = longest([(bb[3] - bb[2]) < .7 * H0 for bb in BS]); info['slide'] = (a, b)
        ids = [max(0, a - 3), a + 1, (a + b) // 2, max(a + 1, b - 1)]; gy = int(ground) - TOP
        cells += [cell(Sl[i], BS[i][0], BS[i][3] - gy) for i in ids]
    else: cells += [cells[0].rotate(90, expand=False)] * 4
    sheet = Image.new('RGBA', (CW * 6, CH * 4), (0, 0, 0, 0))
    for k, c in enumerate(cells): sheet.paste(c, ((k % 6) * CW, (k // 6) * CH))
    sheet.save(out, quality=84, method=6); bg = Image.new('RGBA', sheet.size, (190, 215, 255, 255)); bg.alpha_composite(sheet); bg.convert('RGB').resize((CW * 3, CH * 2)).save(f'prev-{os.path.basename(out)[:-5]}.jpg')
    print(name, info, os.path.getsize(out) // 1024, 'Ko')
if __name__ == '__main__':
    n = sys.argv[1]; build(n, sys.argv[2] if len(sys.argv) > 2 else f'/home/claude/jeux-amine/jeux/medina/corps-{n}.webp')
