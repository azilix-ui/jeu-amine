"""Éveil religieux · « La vie du Prophète ﷺ » : les images ComfyUI (output/ev/, FLUX.2 klein) -> eveil/prophete/img/*.webp
Usage : python3 -I build_images.py <dossier des PNG> <dossier eveil/prophete/img>
Une version « _v2 » remplace la première (refaites le 17/11 : sans route moderne, sans coupoles, sans personne).
Règle : aucune image ne montre le Prophète ﷺ, un prophète, un compagnon ou un ange ; seulement lieux, animaux, objets, lumière
(et la famille : papa, maman, les enfants)."""
import os, re, sys
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
choix = {}
for f in sorted(os.listdir(src)):
    m = re.match(r'(.+?)(_v2)?_\d+_\.png$', f)
    if not m or m.group(1) == 'cover': continue   # la couverture : on garde e2_d (la Kaaba la nuit) ; les deux essais « cover » montraient des pèlerins ou un rideau
    nom, v2 = m.group(1), bool(m.group(2))
    if v2 or nom not in choix: choix[nom] = f
for nom, f in sorted(choix.items()):
    im = Image.open(os.path.join(src, f)).convert('RGB')
    if nom in ('papa', 'maman'):   # portraits ronds du conteur : le visage est dans le haut du carré
        cx, cy = (295, 250) if nom == 'papa' else (287, 270); c = 340   # le visage (mesuré sur les images du 17/11)
        im = im.crop((cx - c // 2, cy - c // 2, cx + c // 2, cy + c // 2)).resize((320, 320), Image.LANCZOS); q = 82
    else:
        im = im.resize((1280, round(1280 * im.height / im.width)), Image.LANCZOS); q = 74
    im.save(os.path.join(dst, nom + '.webp'), 'WEBP', quality=q, method=6)
    print(nom, f, os.path.getsize(os.path.join(dst, nom + '.webp')) // 1024, 'Ko')
