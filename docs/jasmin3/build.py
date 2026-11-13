"""Jasmin 3 : prépare les images d'un monde faites avec ComfyUI (FLUX.2 klein, texte → image, sur le PC du papa).
Entrée : un dossier de PNG ComfyUI <nom>_00001_.png. Sortie : jeux/jasmin3/m<n>/
  - objets (fond vert détouré, recadré, hauteur 160 px max) : coffres, brique, jasmin d'or, lanterne, jarre, ressort, panneau, oursins, chéchia, harissa, thé, pièce, maisons (bande du plan du milieu, 420 px de haut)
  - t_<texture> : textures rendues raccordables par miroir (256 px)
  - fond.webp : la photo du monde (hauteur 640)
Usage : python3 docs/jasmin3/build.py <dossier> <monde>   (ex. … m1png 1)"""
import sys, os, glob
from PIL import Image, ImageOps
ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ICI, '..', 'houma')); from detoure import cut
src, n = sys.argv[1], sys.argv[2]; out = os.path.join(ICI, '..', '..', 'jeux', 'jasmin3', 'm' + n); os.makedirs(out, exist_ok=True)
BLEU = {'the'}   # ce qui est vert (le thé à la menthe) est fait sur fond bleu
H = {'maisons': 420, 'lanterne': 240, 'panneau': 160, 'oursins': 120}
for f in sorted(glob.glob(f'{src}/*_00001_.png')):
    k = os.path.basename(f).split('_00001_')[0]
    if k == 'fond_loin':
        im = Image.open(f).convert('RGB'); im = im.resize((round(im.width * 640 / im.height), 640), Image.LANCZOS); im.save(f'{out}/fond.webp', quality=80, method=6); continue
    if k.startswith('t_'):
        t = Image.open(f).convert('RGB').resize((128, 128), Image.LANCZOS); tile = Image.new('RGB', (256, 256))
        tile.paste(t, (0, 0)); tile.paste(ImageOps.mirror(t), (128, 0)); tile.paste(ImageOps.flip(t), (0, 128)); tile.paste(ImageOps.flip(ImageOps.mirror(t)), (128, 128))
        tile.save(f'{out}/{k}.webp', quality=82, method=6); continue
    im = cut(f, 'blue' if k in BLEU else 'green'); bb = im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    if not bb: print('vide', k); continue
    im = im.crop(bb); h = H.get(k, 160); s = min(1, h / im.height); im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    im.save(f'{out}/{k}.webp', quality=84, method=6)
print(sorted(os.listdir(out)))
