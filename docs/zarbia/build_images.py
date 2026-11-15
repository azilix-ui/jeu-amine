"""Zarbia : prépare les images ComfyUI (dossier output/zar) → jeux/zarbia/img/.
Usage : python3 docs/zarbia/build_images.py <dossier zar>
 - sol_*      → img/sol.webp (512, raccordable : les bords se suivent quand on le répète)
 - zarbia1..3 → img/zarbia1..3.webp (384, raccordables ; claires, le jeu les teinte à la couleur de chaque joueur)
 - bot_<id>   → img/bot-<id>.webp (192, le visage recadré au carré)
 - menu       → img/menu.webp (1600 × 900)
On prend toujours la dernière version (le plus grand numéro)."""
import sys, os, glob
import numpy as np
from PIL import Image

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'zarbia', 'img'); os.makedirs(OUT, exist_ok=True)
def dernier(nom):
    fs = sorted(glob.glob(os.path.join(SRC, nom + '_0*_.png'))); return fs[-1] if fs else None

def raccord(im, n):
    """rend une texture raccordable : on la mélange avec elle-même décalée d'une demi-image, les coutures au milieu sont cachées"""
    a = np.array(im.convert('RGB').resize((n, n), Image.LANCZOS)).astype(np.float32)
    b = np.roll(np.roll(a, n // 2, 0), n // 2, 1)
    y, x = np.mgrid[0:n, 0:n]; d = np.maximum(np.abs(x - n / 2 + .5), np.abs(y - n / 2 + .5)) / (n / 2)
    m = np.clip((d - .55) / .4, 0, 1)[..., None]     # près des bords de a : on prend b (dont le milieu est bien raccordé)
    return Image.fromarray((a * (1 - m) + b * m).astype(np.uint8))

f = dernier('sol')
if f: raccord(Image.open(f), 512).save(os.path.join(OUT, 'sol.webp'), quality=80, method=6)
for k in ('zarbia1', 'zarbia2', 'zarbia3'):
    f = dernier(k)
    if not f: continue
    im = raccord(Image.open(f), 384)
    # on étire les tons : le fond presque blanc, les motifs bien gris (pour que la teinte garde le dessin)
    a = np.array(im.convert('L')).astype(np.float32); lo, hi = np.percentile(a, 3), np.percentile(a, 97); a = np.clip((a - lo) / max(1, hi - lo), 0, 1)
    a = 120 + a * 135
    Image.fromarray(a.astype(np.uint8)).convert('RGB').save(os.path.join(OUT, k + '.webp'), quality=82, method=6)
for f in glob.glob(os.path.join(SRC, 'bot_*_00001_.png')):
    id = os.path.basename(f)[4:-11]; im = Image.open(dernier('bot_' + id)).convert('RGB'); w, h = im.size
    s = int(w * .62); x0 = (w - s) // 2; y0 = int(h * .04)
    im.crop((x0, y0, x0 + s, y0 + s)).resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, f'bot-{id}.webp'), quality=84, method=6)
f = dernier('menu')
if f: Image.open(f).convert('RGB').resize((1600, 900), Image.LANCZOS).save(os.path.join(OUT, 'menu.webp'), quality=78, method=6)
print(sorted(os.listdir(OUT)))
