"""Jasmin 2 : créatures animées avec ComfyUI en local (Wan 2.2 image vers vidéo, gratuit) à partir de leur image fixe.
Prend les 33 images « anim_<nom>_000NN_.png » (fond vert 832 x 480), cherche la boucle la plus propre (deux images presque identiques
à 10-24 images d'écart), en tire 12 images, les détoure, les recadre ensemble et écrit une bande de 12 cases : jeux/jasmin2/<nom>-anim.webp.
Affiche le rapport « hauteur de case / hauteur de la créature » pour régler la taille dans BETE.
Usage : python3 docs/jasmin2-corps/bande_comfy.py <dossier> <nom>:<hauteur de case> ..."""
import sys, os
from PIL import Image, ImageChops, ImageStat
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma')); from detoure import cut
src = sys.argv[1]
for arg in sys.argv[2:]:
    name, ch = arg.split(':'); ch = int(ch)
    files = [f'{src}/anim_{name}_{k:05d}_.png' for k in range(1, 34)]
    small = [Image.open(f).convert('RGB').resize((208, 120)) for f in files]
    best = None
    for i in range(2, 20):
        for j in range(i + 10, min(33, i + 25)):
            d = sum(ImageStat.Stat(ImageChops.difference(small[i], small[j])).mean)
            if best is None or d < best[0]: best = (d, i, j)
    _, i, j = best; idx = [i + round(k * (j - i) / 12) for k in range(12)]
    fr = [cut(files[k]) for k in idx]
    boxes = [f.getchannel('A').point(lambda v: 255 if v > 60 else 0).getbbox() for f in fr]
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    k = ch / (box[3] - box[1]); cw = round((box[2] - box[0]) * k)
    out = Image.new('RGBA', (cw * 12, ch))
    for n, f in enumerate(fr): out.paste(f.crop(box).resize((cw, ch), Image.LANCZOS), (n * cw, 0))
    out.save(f'jeux/jasmin2/{name}-anim.webp', quality=86, method=6)
    hs = sorted(b[3] - b[1] for b in boxes)
    print(name, 'boucle', i, j, 'écart', round(best[0], 1), 'case', cw, ch, 'rapport', round((box[3] - box[1]) / hs[len(hs) // 2], 2))
