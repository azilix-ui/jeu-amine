"""Chkobba : prépare les images ComfyUI (dossier output/chk) → jeux/chkobba/img/.
Usage : python3 docs/chkobba/build_images.py <dossier chk>
 - p_/j_/t_<perso> : les adversaires de l'ordinateur (malin / chkobba ! / boude) → <perso>-<humeur>.webp, recadrés au carré sur le visage
 - m_<monde> : les quatre mondes (fonds) ; tapis (le tapis vert) ; dos (dos des cartes)
 - roi, dame, valet : les figures (on coupe les coins où l'image a mis des lettres au hasard)"""
import sys, os, glob
from PIL import Image
SRC = sys.argv[1]; OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'chkobba', 'img'); os.makedirs(OUT, exist_ok=True)
def dernier(n):
    fs = sorted(glob.glob(os.path.join(SRC, n + '_0*_.png'))); return fs[-1] if fs else None
for h, k in (('p', 'malin'), ('j', 'joie'), ('t', 'boude')):
    for f in glob.glob(os.path.join(SRC, h + '_*_00001_.png')):
        perso = os.path.basename(f)[2:-11]; im = Image.open(dernier(h + '_' + perso)).convert('RGB'); w, hh = im.size
        c = int(hh * .92); x0 = (w - c) // 2; im.crop((x0, 0, x0 + c, c)).resize((360, 360), Image.LANCZOS).save(os.path.join(OUT, f'{perso}-{k}.webp'), quality=84, method=6)
for f in glob.glob(os.path.join(SRC, 'm_*_00001_.png')):
    m = os.path.basename(f)[2:-11]; Image.open(dernier('m_' + m)).convert('RGB').resize((1600, 900), Image.LANCZOS).save(os.path.join(OUT, f'monde-{m}.webp'), quality=78, method=6)
f = dernier('tapis')
if f: Image.open(f).convert('RGB').resize((1280, 800), Image.LANCZOS).save(os.path.join(OUT, 'tapis.webp'), quality=80, method=6)
f = dernier('dos')
if f: Image.open(f).convert('RGB').resize((240, 360), Image.LANCZOS).save(os.path.join(OUT, 'dos.webp'), quality=84, method=6)
for k in ('roi', 'dame', 'valet'):
    f = dernier(k)
    if not f: continue
    im = Image.open(f).convert('RGB'); w, h = im.size
    im.crop((int(w * .15), int(h * .1), int(w * .85), int(h * .9))).resize((240, 330), Image.LANCZOS).save(os.path.join(OUT, f'{k}.webp'), quality=86, method=6)
# le titre (شكبة) n'est pas fait ici : ComfyUI perdait les points des lettres ; il est dessiné en police Aref Ruqaa par docs/chkobba/titre.cjs
print(sorted(os.listdir(OUT)))
