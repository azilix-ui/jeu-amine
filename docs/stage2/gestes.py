"""Stage 2 : les gestes du héros faits avec ComfyUI (15/11) → jeux/stage2/heros/<id>.webp + heros.js.
Sources (dossier output/g2 de ComfyUI) : <id>_accroupi, <id>_grimpe2, <id>_porte2, <id>_lance, <id>_rampe (FLUX.2 klein, retouche de houma_<id>.png)
et les vidéos Wan 2.2 anim_<id>_rampe_000NN_ (il rampe sur place) et anim_<id>_porte_000NN_ (il marche les bras levés), 33 images chacune.
Planche 12 × 5 : ligne 0 grimper (2 images : la pose et son miroir), 1 ramper (12), 2 accroupi (1), 3 porter (12), 4 lancer (1).
Les poses n'ont pas la même échelle (FLUX recadre) : chaque ligne est ramenée à une hauteur connue par rapport au héros debout (RAPPORT).
Usage : python3 docs/stage2/gestes.py <dossier g2> <id> [<id>…]"""
import sys, os, json, re
from PIL import Image, ImageChops, ImageStat, ImageOps
from scipy import ndimage as nd
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma')); from detoure import cut

REF = 150                      # hauteur du héros debout dans la planche (px)
RAPPORT = { 'grimpe':1.2, 'rampe':.52, 'accroupi':.64, 'porte':1.22, 'lance':.98 }
SORTIE = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'stage2', 'heros')

def propre(im):   # garde le personnage (la plus grande tache), enlève la balle lancée ou les miettes
    a = np.array(im.getchannel('A')) > 60
    lab, n = nd.label(a)
    if n > 1:
        tailles = nd.sum(a, lab, range(1, n + 1)); garde = np.isin(lab, [i + 1 for i, t in enumerate(tailles) if t > tailles.max() * .15])
        al = np.array(im.getchannel('A')); al[~nd.binary_dilation(garde, iterations=2)] = 0; im.putalpha(Image.fromarray(al))
    return im
def boucle(fichiers):
    petit = [Image.open(f).convert('RGB').resize((120, 208)) for f in fichiers]; best = None
    for i in range(2, 21):
        for j in range(i + 10, min(33, i + 25)):
            d = sum(ImageStat.Stat(ImageChops.difference(petit[i], petit[j])).mean)
            if best is None or d < best[0]: best = (d, i, j)
    _, i, j = best; return [fichiers[i + round(k * (j - i) / 12)] for k in range(12)]

def planche(dos, id):
    fond = 'blue' if 'plage' in id else 'green'   # le short de plage est vert : ces images-là sont faites sur fond bleu
    cut_ = lambda f: cut(f, fond)
    s = lambda k: os.path.join(dos, f'{id}_{k}_00001_.png')
    anim = lambda k: [os.path.join(dos, f'anim_{id}_{k}_{n:05d}_.png') for n in range(1, 34)]
    rampe3 = s('rampe3') if os.path.exists(s('rampe3')) else None
    lignes = {}
    g = propre(cut_(s('grimpe2'))); lignes['grimpe'] = [g, ImageOps.mirror(g)]
    ra = anim('rampe'); lignes['rampe'] = [propre(cut_(f)) for f in boucle(ra)] if all(os.path.exists(f) for f in ra) else [propre(cut_(rampe3 or s('rampe')))]
    lignes['accroupi'] = [propre(cut_(s('accroupi')))]
    po = anim('porte'); lignes['porte'] = [propre(cut_(f)) for f in boucle(po)] if all(os.path.exists(f) for f in po) else [propre(cut_(s('porte2')))]
    lignes['lance'] = [propre(cut_(s('lance') if os.path.exists(s('lance')) else s('porte2')))]   # (le jeu lance avec l'image « porter »)
    cases = {}
    for k, ims in lignes.items():
        boxes = [im.getchannel('A').point(lambda v: 255 if v > 60 else 0).getbbox() for im in ims]
        box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
        h = max(b[3] - b[1] for b in boxes); sc = RAPPORT[k] * REF / h
        cases[k] = [im.crop(box).resize((max(1, round((box[2] - box[0]) * sc)), max(1, round((box[3] - box[1]) * sc))), Image.LANCZOS) for im in ims]
    cw = max(c.width for v in cases.values() for c in v); ch = max(c.height for v in cases.values() for c in v)
    ordre = ['grimpe', 'rampe', 'accroupi', 'porte', 'lance']
    out = Image.new('RGBA', (cw * 12, ch * 5))
    for r, k in enumerate(ordre):
        for i, c in enumerate(cases[k]): out.paste(c, (i * cw + (cw - c.width) // 2, r * ch + ch - c.height), c)
    os.makedirs(SORTIE, exist_ok=True); out.save(os.path.join(SORTIE, f'{id}.webp'), quality=84, method=6)
    return { 'cw':cw, 'ch':ch, 'ref':REF, 'n':[len(cases[k]) for k in ordre], 'v':2 }

if __name__ == '__main__':
    dos, ids = sys.argv[1], sys.argv[2:]
    fj = os.path.join(SORTIE, 'heros.js'); meta = {}
    if os.path.exists(fj):
        m = re.search(r'= (\{.*\});', open(fj).read(), re.S)
        if m: meta = json.loads(m.group(1))
    for id in ids:
        meta[id] = planche(dos, id); print(id, meta[id])
    open(fj, 'w').write('/* Stage 2 : les gestes du héros (ComfyUI), fabriqués par docs/stage2/gestes.py. cw/ch = case, ref = hauteur du héros debout, n = images par ligne (grimper, ramper, accroupi, porter, lancer). */\n'
                       'window.S2_GESTES = ' + json.dumps(meta, indent=0) + ';\n')
