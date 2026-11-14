"""Stage 2, monde 1 : prépare les images du jeu à partir des images ComfyUI (dossier output/s2 sur le PC de papa).
Usage : python3 build_m1.py <dossier des png ComfyUI>   → écrit jeux/stage2/m1/*.webp
Les objets sont sur fond vert : on les détoure (docs/houma/detoure.py) puis on les recadre."""
import sys, os
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma'))
from detoure import cut

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'stage2', 'm1')
os.makedirs(OUT, exist_ok=True)
def src(n): return os.path.join(SRC, f'm1_{n}_00001_.png')
def save(im, n, q=82): im.save(os.path.join(OUT, n + '.webp'), 'WEBP', quality=q, method=6); print(n, im.size)
def objet(n, nom=None, maxi=192, taille=None):
    im = cut(src(n)); im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())
    if taille: im = im.resize(taille, Image.LANCZOS)
    else: im.thumbnail((maxi, maxi), Image.LANCZOS)
    save(im, nom or n)

# le fond (photo de ruelle) et les façades
f = Image.open(src('fond')).convert('RGB'); f = f.resize((1344, 576), Image.LANCZOS); save(f, 'fond', 78)
objet('maisons', maxi=1400)
# les textures (grille 6×6 de carreaux, une case = 64 px)
for n in ('t_mur', 't_fissure'): save(Image.open(src(n)).convert('RGB').resize((384, 384), Image.LANCZOS), n)
save(Image.open(src('t_planche')).convert('RGB').resize((384, 384), Image.LANCZOS), 't_planche')
# le dessus des murs : la bande de tuiles vertes, en une longue frise (6 cases)
d = Image.open(src('t_dessus')).convert('RGB'); w, h = d.size
# on cherche la bande de tuiles : les lignes nettement vertes
px = d.load(); rows = [y for y in range(h) if sum(1 for x in range(0, w, 16) if px[x, y][1] > px[x, y][0] + 25) > (w // 16) * .6]
y0, y1 = min(rows), max(rows); save(d.crop((0, y0, w, y1)).resize((384, 48), Image.LANCZOS), 't_dessus')
# les objets
def pierre():   # la pierre a des reflets verts (le détourage la troue) : on la découpe en ovale et on la passe en gris
    from PIL import ImageDraw, ImageOps
    im = Image.open(src('pierre')).convert('RGB'); px = im.load(); w, h = im.size
    vert = lambda p: p[1] > p[0] + 40 and p[1] > p[2] + 40
    xs = [x for x in range(w) if sum(1 for y in range(0, h, 4) if not vert(px[x, y])) > 4]
    ys = [y for y in range(h) if sum(1 for x in range(0, w, 4) if not vert(px[x, y])) > 4]
    c = im.crop((min(xs), min(ys), max(xs), max(ys))); cw, ch = c.size
    m = Image.new('L', (cw * 4, ch * 4), 0); ImageDraw.Draw(m).ellipse((6, 6, cw * 4 - 6, ch * 4 - 10), fill=255); m = m.resize((cw, ch), Image.LANCZOS)
    g = ImageOps.grayscale(c); c = Image.blend(Image.merge('RGB', (g, g, g)), Image.new('RGB', c.size, (150, 140, 125)), .25).convert('RGBA')
    c.putalpha(m); c.thumbnail((128, 128), Image.LANCZOS); save(c, 'pierre')
objet('caisse'); objet('ballon2', 'ballon', 128); pierre(); objet('cle', maxi=128); objet('levier', maxi=128); objet('sac')
objet('echelle', taille=(80, 128)); objet('grille', taille=(72, 192)); objet('porte_verrou', maxi=256); objet('porte_sortie', maxi=256)
# les ennemis (image fixe, si l'animation manque)
for n in ('garde', 'chien', 'marchand'): objet(n, maxi=200)
