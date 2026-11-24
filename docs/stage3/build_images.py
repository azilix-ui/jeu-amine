"""Stage 3 (la course du TGM) : images ComfyUI (FLUX.2 klein, préfixe s3/, graines 8301 à 8310) -> jeux/stage3/img/
python3 docs/stage3/build_images.py <dossier contenant s3/*.png>
Objets sur fond vert (bleu pour la poubelle verte, la banane et l'huile), détourés par docs/houma/detoure.py, recadrés, en webp."""
import sys, os, glob
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'houma'))
from detoure import cut
from PIL import Image
SRC = sys.argv[1]; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'jeux', 'stage3', 'img')
os.makedirs(OUT, exist_ok=True)
OBJ = { 'tgm':('green', 1000), 'gare':('green', 700), 'poubelle':('blue', 260), 'sacs':('green', 300), 'cageot':('green', 300), 'banane':('blue', 220),
        'huile':('blue', 300), 'barriere':('green', 320), 'linge':('green', 700) }
def dernier(k): l = sorted(glob.glob(os.path.join(SRC, 's3', k + '_*.png'))); return l[-1] if l else None
if os.path.isdir(os.path.join(SRC, 's3')):   # le monde 1
  for k, (fond, larg) in OBJ.items():
    f = dernier(k); im = cut(f, fond); bb = im.getbbox(); im = im.crop(bb)
    if im.width > larg: im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, k + '.webp'), quality=88); print(k, im.size)
  m = Image.open(dernier('menu')).convert('RGB'); m.save(os.path.join(OUT, 'menu.webp'), quality=84); print('menu', m.size)

# 24/11 : les mondes 2 à 6 (préfixe s3m/<m2…m6>/<nom>, graines 8401 et suivantes ; fond bleu pour le tram vert et la pastèque).
# Pour ce qui pend (tapis, filets, fanions, tissus, tronc) on affiche « lb » : la hauteur (fraction depuis le haut) du bas de ce qui pend, à recopier dans MONDES de jeu.js.
import numpy as np
BLEU = { 'm2/metro', 'm5/pasteque', 'm7/vigne', 'm11/palmes', 'm13/cactus', 'm16/branche' }   # (verglas refait sur fond vert)
GRAND = { 'metro':1000, 'bac':1000, 'sahel':1000, 'lezard':1000, 'petittrain':1000, 'louage':1000, 'train':1000, 'caleche':1000, 'bus':1000, 'caravane':1000, 'bateau':1000,
          'gare':700, 'quai':700, 'station':700, 'arret':700, 'puits':700, 'ponton':700, 'chalet':700 }
# 24/11 (nuit) : les mondes 7 à 21 (préfixe s3n/, graines 8501 et suivantes)
PENDUS = { 'tapispendus', 'filets', 'fanions', 'tissus', 'tronc', 'vigne', 'serviettes', 'lanternes', 'banderoles', 'palmes', 'toile', 'tente', 'voiles', 'branche', 'drapeaux', 'piments', 'guirlande' }
for n in PENDUS: GRAND[n] = 700
PEND = PENDUS
for f in sorted(glob.glob(os.path.join(SRC, 's3[mn]', 'm*', '*_0*.png'))):
    pre = os.path.basename(os.path.dirname(os.path.dirname(f))); m = os.path.basename(os.path.dirname(f)); n = os.path.basename(f).rsplit('_', 2)[0]; k = m + '/' + n
    if f != sorted(glob.glob(os.path.join(SRC, pre, m, n + '_0*.png')))[-1]: continue   # la dernière version
    im = cut(f, 'blue' if k in BLEU else 'green'); im = im.crop(im.getbbox()); larg = GRAND.get(n, 300)
    if im.width > larg: im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
    os.makedirs(os.path.join(OUT, m), exist_ok=True); im.save(os.path.join(OUT, m, n + '.webp'), quality=88)
    lb = ''
    if n in PEND:
        a = np.array(im.getchannel('A')) > 80; w = a.shape[1]; c = a[:, int(w * .3):int(w * .7)]; rows = np.where(c.mean(1) > .15)[0]
        lb = ' lb=%.2f' % ((rows.max() + 1) / a.shape[0]) if len(rows) else ''
    print(k, im.size, lb)
