"""Jasmin 2 : ajoute à une planche la vue de face (case 21 et 23) et le soupir (case 22), à la même taille que le héros debout de profil (case 20).
   usage : python3 face.py <nom>   (images sur fond vert : img/<nom>-face.png, img/<nom>-soupir.png)"""
import numpy as np, sys, os
from PIL import Image
from scipy import ndimage as nd
CW, CH = 176, 288
def key(path):
    a = np.array(Image.open(path).convert('RGB')).astype(float); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    k = g - np.maximum(r, b); al = np.clip((48 - k) / 30, 0, 1); lab, n = nd.label(al > .5)
    if n > 1: sizes = nd.sum(al > .5, lab, range(1, n + 1)); al = al * nd.binary_dilation(lab == (int(np.argmax(sizes)) + 1), iterations=3)
    a[..., 1] = np.where(al < 1, np.minimum(g, np.maximum(r, b) + 8), g)
    im = Image.fromarray(np.dstack([a, al * 255]).astype(np.uint8), 'RGBA'); ys, xs = np.nonzero(al > .5); return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
def main(n):
    p = f'/home/claude/jeux-amine/jeux/jasmin2/corps-{n}.webp'; sh = Image.open(p).convert('RGBA'); idle = np.asarray(sh.crop((2 * CW, 3 * CH, 3 * CW, 4 * CH)))[..., 3] > 128
    ys = np.nonzero(idle.any(axis=1))[0]; top, feet = ys.min(), ys.max(); H = feet - top + 1
    face = key(f'img/{n}-face.png'); k = H / face.height
    for cellno, src in ((21, face), (22, key(f'img/{n}-soupir.png')), (23, face)):
        im = src.resize((max(1, round(src.width * k)), max(1, round(src.height * k))), Image.LANCZOS); c = Image.new('RGBA', (CW, CH), (0, 0, 0, 0)); c.paste(im, ((CW - im.width) // 2, feet + 1 - im.height))
        x0, y0 = (cellno % 6) * CW, (cellno // 6) * CH; sh.paste(c, (x0, y0))
    sh.save(p, quality=84, method=6); bg = Image.new('RGBA', sh.size, (190, 215, 255, 255)); bg.alpha_composite(sh); bg.convert('RGB').crop((0, 3 * CH, 6 * CW, 4 * CH)).save(f'prev-face-{n}.jpg'); print(n, 'H', H, os.path.getsize(p) // 1024, 'Ko')
main(sys.argv[1])
