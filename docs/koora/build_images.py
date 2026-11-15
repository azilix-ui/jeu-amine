"""Koora : prépare les images ComfyUI (dossier output/koo) → jeux/koora/img/.
Usage : python3 docs/koora/build_images.py <dossier koo>
 - titre / titre2 (calligraphie كرة, fond vert) → titre.webp / titre-bleu.webp détourés
 - bab (porte de la médina), charrette, chat, caisses (fond vert) → détourés
 - facade, facade2 (murs de la rue), fond (le bout de la rue), menu → photos
 - sol (dalles), p_<matière> (peaux des ballons) → textures raccordables
On prend toujours la dernière version (le plus grand numéro)."""
import sys, os, glob
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma')); from detoure import cut
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'koora', 'img'); os.makedirs(OUT, exist_ok=True)
def dernier(nom):
    fs = sorted(glob.glob(os.path.join(SRC, nom + '_0*_.png'))); return fs[-1] if fs else None
def raccord(im, n):
    a = np.array(im.convert('RGB').resize((n, n), Image.LANCZOS)).astype(np.float32)
    b = np.roll(np.roll(a, n // 2, 0), n // 2, 1)
    y, x = np.mgrid[0:n, 0:n]; d = np.maximum(np.abs(x - n / 2 + .5), np.abs(y - n / 2 + .5)) / (n / 2)
    m = np.clip((d - .55) / .4, 0, 1)[..., None]
    return Image.fromarray((a * (1 - m) + b * m).astype(np.uint8))
def detoure(nom, sortie, larg):
    f = dernier(nom)
    if not f: return
    im = cut(f); from scipy import ndimage as nd
    al = np.array(im.getchannel('A')) > 90; lab, n = nd.label(al)
    if n > 1:
        t = nd.sum(al, lab, range(1, n + 1)); garde = np.isin(lab, [i + 1 for i, v in enumerate(t) if v > t.max() * .08]); a = np.array(im.getchannel('A')); a[~nd.binary_dilation(garde, iterations=2)] = 0; im.putalpha(Image.fromarray(a))
    im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 60 else 0).getbbox())
    k = larg / im.width; im.resize((larg, round(im.height * k)), Image.LANCZOS).save(os.path.join(OUT, sortie + '.webp'), quality=86, method=6)
detoure('titre', 'titre', 900); detoure('titre2', 'titre-bleu', 900)
detoure('bab', 'bab', 768); detoure('charrette', 'charrette', 512); detoure('chat', 'chat', 384); detoure('caisses', 'caisses', 512)
for k, (w, h) in { 'facade':(1280, 533), 'facade2':(1280, 533), 'fond':(1280, 640), 'menu':(1600, 900) }.items():
    f = dernier(k)
    if f: Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS).save(os.path.join(OUT, k + '.webp'), quality=80, method=6)
f = dernier('sol')
if f: raccord(Image.open(f), 512).save(os.path.join(OUT, 'sol.webp'), quality=80, method=6)
for f in glob.glob(os.path.join(SRC, 'p_*_00001_.png')):
    k = os.path.basename(f)[:-11]; raccord(Image.open(dernier(k)), 256).save(os.path.join(OUT, k.replace('_', '-') + '.webp'), quality=82, method=6)
print(sorted(os.listdir(OUT)))
