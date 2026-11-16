"""Kassar : les images ComfyUI (FLUX.2 klein, préfixe k/ ; 16/11) → jeux/kassar/img/.
Usage : python3 docs/kassar/build_images.py <dossier k>
Carreaux de zellige (z_<couleur>), pierre (mur) : centre recadré en 3:2 ; balle, boule d'or, jarre : détourées (fond vert) ; fonds en portrait ; image du menu."""
import sys, os, glob
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma')); from detoure import cut
SRC = sys.argv[1]; OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'kassar', 'img'); os.makedirs(OUT, exist_ok=True)
def f(n, s=1):
    g = glob.glob(os.path.join(SRC, f'{n}_{s}_0000*_.png')); return sorted(g)[-1] if g else None
def save(im, n, q=84): im.save(os.path.join(OUT, n + '.webp'), quality=q, method=6); print(n, im.size)
for c in ['turquoise', 'bleu', 'vert', 'jaune', 'rouge', 'violet', 'mosaique']:
    p = f('z_' + c)
    if p: im = Image.open(p).convert('RGB'); w, h = im.size; cw = int(w * .8); ch = int(cw * 2 / 3); save(im.crop(((w - cw) // 2, (h - ch) // 2, (w + cw) // 2, (h + ch) // 2)).resize((180, 120), Image.LANCZOS), 'z-' + c)
p = f('mur')
if p: im = Image.open(p).convert('RGB'); save(im.crop((100, 200, 700, 600)).resize((180, 120), Image.LANCZOS), 'mur')
for n, t in [('balle', 64), ('bonus', 72), ('jarre', 110)]:
    p = f(n)
    if p: im = cut(p); im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 60 else 0).getbbox()); im.thumbnail((t, t), Image.LANCZOS); save(im, n, 88)
for m in ['medina', 'carthage', 'sahara']:
    p = f('fond_' + m)
    if p: im = Image.open(p).convert('RGB'); im.thumbnail((720, 1260), Image.LANCZOS); save(im, 'fond-' + m, 78)
p = f('menu')
if p: im = Image.open(p).convert('RGB'); im.thumbnail((1344, 768), Image.LANCZOS); save(im, 'menu', 78)
# 16/11 (soir) : Carthage et le Sahara — amphore et oasis détourées, pierre de chaque monde, carreau de sable
def g(n):
    l = sorted(glob.glob(os.path.join(SRC, f'{n}_0000*_.png'))); return l[-1] if l else None
for n, t in [('amphore', 110), ('oasis', 90)]:
    p = g(n)
    if p: im = cut(p); im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 60 else 0).getbbox()); im.thumbnail((t, t), Image.LANCZOS); save(im, n, 88)
for n in ['mur_carthage', 'mur_sahara', 'z_sable']:
    p = g(n)
    if p: im = Image.open(p).convert('RGB'); w, h = im.size; cw = int(w * .8); ch = int(cw * 2 / 3); save(im.crop(((w - cw) // 2, (h - ch) // 2, (w + cw) // 2, (h + ch) // 2)).resize((180, 120), Image.LANCZOS), n.replace('_', '-'))
