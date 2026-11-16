"""Les cours du 16/11 : images ComfyUI (FLUX.2 klein, préfixes eng/, epi/, pat/) → salma/ollie/img/ et amine/epicerie/img/.
Usage : python3 docs/cours/build_images.py <dossier qui contient eng/ epi/ pat/>
Pièces et fonds : recadrés ; objets et fruits : détourés (fond vert), recadrés au plus juste. Affiche le rapport hauteur/largeur des objets (A dans ollies-house.html)."""
import sys, os, glob
from PIL import Image, ImageChops
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma')); from detoure import cut
SRC = sys.argv[1]; R = os.path.join(os.path.dirname(__file__), '..', '..')
OLLIE = os.path.join(R, 'salma', 'ollie', 'img'); EPI = os.path.join(R, 'amine', 'epicerie', 'img')
for d in (OLLIE, EPI): os.makedirs(d, exist_ok=True)
def f(p):
    g = sorted(glob.glob(os.path.join(SRC, p + '_0000*_.png'))); return g[-1] if g else None
def save(im, d, n, q=82): im.save(os.path.join(d, n + '.webp'), quality=q, method=6); print(n, im.size)
VERTS = {'raisin', 'poire'}   # fruits verts : on ne retire pas le reflet vert partout
def objet(p, n, d, t=420, fond='green'):
    im = cut(p, fond)
    if n not in VERTS:   # le reflet du fond sur l'objet (vert, ou bleu pour le chat et le ballon)
        r, g, b, a = im.split()
        if fond == 'blue': b = ImageChops.darker(b, ImageChops.add(ImageChops.lighter(r, g), Image.new("L", im.size, 30)))
        else: g = ImageChops.darker(g, ImageChops.add(ImageChops.lighter(r, b), Image.new("L", im.size, 2)))
        im = Image.merge('RGBA', (r, g, b, a))
    im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 60 else 0).getbbox()); im.thumbnail((t, t), Image.LANCZOS); save(im, d, n, 86)
    print('  A', n, round(im.size[1] / im.size[0], 2))
for k in ['kitchen', 'bedroom', 'bathroom', 'livingroom', 'garden']:
    p = f('eng/' + k)
    if p: im = Image.open(p).convert('RGB'); im.thumbnail((800, 600), Image.LANCZOS); save(im, OLLIE, 'r-' + k, 78)
for k in ['bed', 'table', 'chair', 'sofa', 'lamp', 'bath', 'fridge', 'wardrobe', 'tv', 'door', 'window', 'box']:
    p = f('eng/' + k)
    if p: objet(p, k, OLLIE)
for k in ['cat', 'ball']:   # refaits sur fond bleu (le vert déteignait sur le poitrail blanc du chat)
    p = f('eng/' + k + 'b')
    if p: objet(p, k, OLLIE, fond='blue')
for k in ['pomme', 'banane', 'tomate', 'orange', 'carotte', 'citron', 'fraise', 'poire', 'pain', 'panier']:
    p = f('epi/' + k)
    if p: objet(p, k, EPI, 360)
p = f('epi/oeuf2')   # un œuf brun : le blanc ne se voyait pas sur les boutons blancs
if p: objet(p, 'oeuf', EPI, 360)
p = f('epi/raisinb')   # le raisin vert, sur fond bleu
if p: objet(p, 'raisin', EPI, 360, fond='blue')
p = f('epi/datte2')
if p: objet(p, 'datte', EPI, 360)
p = f('epi/fond')
if p: im = Image.open(p).convert('RGB'); im.thumbnail((1344, 768), Image.LANCZOS); save(im, EPI, 'fond', 74)
p = f('pat/fond')
if p: im = Image.open(p).convert('RGB'); im.thumbnail((1344, 768), Image.LANCZOS); save(im, OLLIE, 'pat-fond', 74)
p = f('pat/tarte')
if p: objet(p, 'pat-tarte', OLLIE, 400)
