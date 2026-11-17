"""Kelma (18/11) : les images ComfyUI (output/kelma/, FLUX.2 klein) -> jeux/kelma/img/*.webp
Usage : python3 -I build_images.py <dossier des PNG> <jeux/kelma/img>
Décors (menu, m1..m5 : Sidi Bou Saïd, souk de Kairouan, Djerba, Douz, Tabarka) en 1280 de large ; objets détourés (vert, ou bleu
pour le jasmin) en 256 px ; la tuile de céramique en 256 px. Une version « _v2 » remplace la première."""
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'houma'))
from PIL import Image
from detoure import cut
src, dst = sys.argv[1], sys.argv[2]; os.makedirs(dst, exist_ok=True)
choix = {}
for f in sorted(os.listdir(src)):
    m = re.match(r'(.+?)(_v2)?_\d+_\.png$', f)
    if m and (m.group(2) or m.group(1) not in choix): choix[m.group(1)] = f
for nom, f in sorted(choix.items()):
    p = os.path.join(src, f)
    if nom.startswith('o_'):
        im = cut(p, 'blue' if nom == 'o_jasmin' else 'green')
        bb = im.getbbox(); im = im.crop(bb) if bb else im; im.thumbnail((256, 256), Image.LANCZOS)
        im.save(os.path.join(dst, nom[2:] + '.webp'), 'WEBP', quality=86, method=6)
    elif nom == 'tuile':
        Image.open(p).convert('RGB').resize((256, 256), Image.LANCZOS).save(os.path.join(dst, 'tuile.webp'), 'WEBP', quality=80)
    else:
        im = Image.open(p).convert('RGB'); im = im.resize((1280, round(1280 * im.height / im.width)), Image.LANCZOS)
        im.save(os.path.join(dst, nom + '.webp'), 'WEBP', quality=72, method=6)
    print(nom, os.path.getsize(os.path.join(dst, (nom[2:] if nom.startswith('o_') else nom) + '.webp')) // 1024, 'Ko')
