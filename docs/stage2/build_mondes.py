"""Stage 2, mondes 2 à 10 : prépare les images du jeu à partir des images ComfyUI (dossier output/s2w : m<n>_<nom>_00001_.png, en_<nom>_00001_.png).
Usage : python3 docs/stage2/build_mondes.py <dossier s2w>   → jeux/stage2/m<n>/*.webp, jeux/stage2/en/*.webp
Les textures sont des carrés « sans raccord » ; le dessus des murs est une bande prise au milieu de sa texture ;
les objets et personnages sur fond vert sont détourés (docs/houma/detoure.py)."""
import sys, os, glob, re
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma'))
from detoure import cut

SRC = sys.argv[1]
J = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'stage2')
def save(im, chemin, q=80): os.makedirs(os.path.dirname(chemin), exist_ok=True); im.save(chemin, 'WEBP', quality=q, method=6); print(os.path.relpath(chemin, J), im.size)
def detoure(f, maxi):
    im = cut(f); im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()); im.thumbnail((maxi, maxi), Image.LANCZOS); return im
for f in sorted(glob.glob(os.path.join(SRC, '*_00001_.png'))):
    nom = os.path.basename(f)[:-len('_00001_.png')]
    m = re.match(r'm(\d+)_(.+)', nom)
    if m:
        n, k = m.group(1), m.group(2); out = os.path.join(J, 'm' + n, k + '.webp')
        if k == 'fond': save(Image.open(f).convert('RGB').resize((1344, 576), Image.LANCZOS), out, 76)
        elif k == 'maisons': save(detoure(f, 1400), out)
        elif k == 'train': save(detoure(f, 640), out)
        elif k == 'scooter': save(detoure(f, 220), os.path.join(J, 'en', 'scooter.webp'))
        elif k == 'pic': save(detoure(f, 128), out)
        elif k == 't_dessus':
            im = Image.open(f).convert('RGB'); w, h = im.size; b = w // 8; save(im.crop((0, h // 2 - b // 2, w, h // 2 + b // 2)).resize((384, 48), Image.LANCZOS), out)
        elif k == 't_rebond': im = Image.open(f).convert('RGB'); save(im.resize((384, 128), Image.LANCZOS), out)
        elif k.startswith('t_'): save(Image.open(f).convert('RGB').resize((384, 384), Image.LANCZOS), out)
    elif nom.startswith('en_'): save(detoure(f, 220), os.path.join(J, 'en', nom[3:] + '.webp'))
