"""Stage 3 (la course du TGM) : images ComfyUI (FLUX.2 klein, préfixe s3/, graines 8301 à 8310) -> jeux/stage3/img/
python3 docs/stage3/build_images.py <dossier contenant s3/*.png>
Objets sur fond vert (bleu pour la poubelle verte, la banane et l'huile), détourés par docs/houma/detoure.py, recadrés, en webp."""
import sys, os, glob
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'houma'))
from detoure import cut
from PIL import Image
SRC = sys.argv[1]; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'jeux', 'stage3', 'img')
os.makedirs(OUT, exist_ok=True)
OBJ = { 'tgm':('green', 1000), 'gare':('green', 700), 'poubelle':('blue', 260), 'sacs':('green', 300), 'cageot':('green', 300), 'banane':('blue', 220),
        'huile':('blue', 300), 'barriere':('green', 320), 'linge':('green', 700) }
def dernier(k): l = sorted(glob.glob(os.path.join(SRC, 's3', k + '_*.png'))); return l[-1] if l else None
for k, (fond, larg) in OBJ.items():
    f = dernier(k); im = cut(f, fond); bb = im.getbbox(); im = im.crop(bb)
    if im.width > larg: im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, k + '.webp'), quality=88); print(k, im.size)
m = Image.open(dernier('menu')).convert('RGB'); m.save(os.path.join(OUT, 'menu.webp'), quality=84); print('menu', m.size)
