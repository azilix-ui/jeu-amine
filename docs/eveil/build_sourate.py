"""Éveil religieux · rubrique « Sourate » (18/11) : images ComfyUI (output/sour/, FLUX.2 klein) -> eveil/sourate/img/
Usage : python3 -I build_sourate.py <dossier des PNG> <eveil/sourate/img>
sf1…sf7 = les scènes d'Amine (aucune personne), cover = la carte de la série, cartouche = le cadre doré du titre (fond vert
détouré : le titre est écrit par la page en vraie police, jamais par l'IA), parchemin = le fond des pages d'Essil et Salma."""
import os, re, sys
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'houma'))
from detoure import cut

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
for f in sorted(os.listdir(src)):
    m = re.match(r'(.+?)_\d+_\.png$', f)
    if not m: continue
    nom, p = m.group(1), os.path.join(src, f)
    if nom == 'cartouche':
        im = cut(p, 'green'); im = im.crop(im.getbbox()); im = im.resize((1200, round(1200 * im.height / im.width)), Image.LANCZOS); q = 82
    elif nom == 'parchemin':
        im = Image.open(p).convert('RGB').resize((512, 512), Image.LANCZOS); q = 70
    else:
        im = Image.open(p).convert('RGB'); im = im.resize((1280, round(1280 * im.height / im.width)), Image.LANCZOS); q = 74
    out = os.path.join(dst, nom + '.webp'); im.save(out, 'WEBP', quality=q, method=6)
    print(nom, os.path.getsize(out) // 1024, 'Ko')
