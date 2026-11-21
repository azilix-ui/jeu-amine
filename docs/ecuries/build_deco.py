"""Les Écuries (21/11, demandes d'Essil) : les images ComfyUI des prés, de Hamza et des décorations de box → essil/ecuries/img/.
Usage : python3 docs/ecuries/build_deco.py <dossier des png ComfyUI (ecu2/)>
- pre_<id>.png → img/pre-<id>.webp (1344 × 576) ; hamza.png (fond bleu) → img/hamza.webp détouré ;
- d_<nom>.png (fond vert, ou <nom>B sur fond bleu pour ce qui est vert) → img/d-<nom>.webp détourés, recadrés, 360 px."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma'))
from detoure import cut
from PIL import Image
src = sys.argv[1]; dst = os.path.join(os.path.dirname(__file__), '..', '..', 'essil', 'ecuries', 'img')
# le fond de chaque image (les feuilles vertes et le métal qui reflète le vert : sur fond bleu) ; None = version écartée
FOND = {'fleurs':None, 'fleursB':'blue', 'jasmin':None, 'jasminB':'blue', 'fanions':None, 'fanionsB':'green', 'abreuvoir':None, 'abreuvoirB':None, 'abreuvoirC':'green'}
def detoure(p, fond, nom, taille, colonnes=False):
    im = cut(p, fond)
    if colonnes:   # le seau en métal reflète le fond : on bouche chaque colonne entre son premier et son dernier pixel opaque
        a = im.getchannel('A'); w, h = im.size; px = a.load()
        for x in range(w):
            ys = [y for y in range(0, h, 2) if px[x, y] > 128]
            if len(ys) > 1:
                for y in range(ys[0], ys[-1] + 1): px[x, y] = 255
        im.putalpha(a)
    bb = im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox(); im = im.crop(bb)
    im.thumbnail((taille, taille), Image.LANCZOS); im.save(os.path.join(dst, nom + '.webp'), quality=86, method=6)
for f in sorted(os.listdir(src)):
    if not f.endswith('.png'): continue
    n = f.split('_00')[0]; p = os.path.join(src, f)
    if n.startswith('pre_'): Image.open(p).convert('RGB').save(os.path.join(dst, 'pre-' + n[4:] + '.webp'), quality=80, method=6)
    elif n == 'hamza': detoure(p, 'blue', 'hamza', 520)
    elif n.startswith('d_'):
        k = n[2:]; fond = FOND.get(k, 'green')
        if not fond: continue
        detoure(p, fond, 'd-' + (k[:-1] if k[-1] in 'BC' else k).replace('_', '-'), 360, False)
print('ok')
