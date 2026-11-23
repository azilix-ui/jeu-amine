"""Stage 3 (24/11) : les poses du héros faites avec ComfyUI → jeux/stage3/heros/<clé>.webp + poses.js.
Sources (ComfyUI output/s3h) : <id>[_<tenue>]_<pose>_0000N_.png, retouches FLUX.2 klein de input/houma_<id>[_<tenue>].png (aides __s3 de docs/comfy/aides.js) :
  glisse (la glissade, pieds devant, graine 9302), tombe (tombé sur le dos, sonné, 9301), releve (assis, se frotte la tête, 9301).
Fond vert, magenta pour les tenues plage et super (la cape turquoise, le bleu de la plage). Chaque pose est ramenée à une taille connue par rapport
au héros debout (REF = 150 px) : glisse 1,1 × REF de large, tombe 1,02 × REF de large, releve 0,64 × REF de haut. Une bande de 3 cases par planche.
Usage : python3 docs/stage3/poses.py <dossier s3h>"""
import sys, os, glob, json
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'houma')); from detoure import cut

REF = 150
TAILLE = { 'glisse':('w', 1.1), 'tombe':('w', 1.02), 'releve':('h', .64) }
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'jeux', 'stage3', 'heros')
IDS = ['amine', 'salma', 'essil', 'anis', 'imen', 'nour', 'yasmine', 'fares']
TENUES = ['', 'jebba', 'foot', 'super', 'astro', 'or', 'pyjama', 'tablier', 'plage', 'fete']

def cut_magenta(path):
    a = np.array(Image.open(path).convert('RGB')).astype(np.int16); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.clip(((np.minimum(r, b) - g) - 40) * 4, 0, 255)
    al = (255 - m).astype(np.uint8); al = np.array(Image.fromarray(al).filter(ImageFilter.MinFilter(3)))
    out = a.copy(); spill = np.minimum(r, b) > g + 20; out[..., 0][spill] = np.minimum(r, g + 20)[spill]; out[..., 2][spill] = np.minimum(b, g + 20)[spill]
    im = Image.fromarray(out.astype(np.uint8)).convert('RGBA'); im.putalpha(Image.fromarray(al)); return im
def propre(im):   # garde le personnage (les grandes taches)
    a = np.array(im.getchannel('A')) > 60; lab, n = nd.label(a)
    if n > 1:
        t = nd.sum(a, lab, range(1, n + 1)); garde = np.isin(lab, [i + 1 for i, v in enumerate(t) if v > t.max() * .15])
        al = np.array(im.getchannel('A')); al[~nd.binary_dilation(garde, iterations=2)] = 0; im.putalpha(Image.fromarray(al))
    return im

def source(dos, cle, pose):
    l = sorted(glob.glob(os.path.join(dos, f'{cle}_{pose}_0*.png')))
    if not l: return None
    return l[1] if pose == 'glisse' and len(l) >= 3 else l[-1]   # les 3 premiers essais de glissade : le 2e (graine 9302) est le bon

meta = {}
for t in TENUES:
    for id in IDS:
        cle = id + ('_' + t if t else ''); nom = id + ('-' + t if t else '')
        fs = { p:source(sys.argv[1], cle, p) for p in TAILLE }
        if not all(fs.values()): print('manque', cle, [p for p, f in fs.items() if not f]); continue
        cases = {}
        for p, f in fs.items():
            im = propre(cut_magenta(f) if t in ('plage', 'super') else cut(f, 'green'))
            bb = im.getchannel('A').point(lambda v: 255 if v > 60 else 0).getbbox(); im = im.crop(bb)
            if p != 'tombe':   # tourné vers la droite : la tête (en haut) à gauche, les jambes vers la droite ; sinon on retourne l'image
                a = np.array(im.getchannel('A')) > 60; xs = np.arange(a.shape[1]); h = a.shape[0]
                cx = lambda b: (b * xs).sum() / max(1, b.sum())
                if cx(a[:int(h * .3)]) > cx(a): im = im.transpose(Image.FLIP_LEFT_RIGHT); print('retourné', cle, p)
            dim, k = TAILLE[p]; sc = k * REF / (im.width if dim == 'w' else im.height)
            cases[p] = im.resize((max(1, round(im.width * sc)), max(1, round(im.height * sc))), Image.LANCZOS)
        W = sum(c.width + 4 for c in cases.values()); H = max(c.height for c in cases.values())
        out = Image.new('RGBA', (W, H)); x = 0; poses = {}
        for p, c in cases.items(): out.paste(c, (x, H - c.height)); poses[p] = [x, H - c.height, c.width, c.height]; x += c.width + 4
        out.save(os.path.join(OUT, nom + '.webp'), quality=88); meta[nom] = { 'v':1, 'ref':REF, 'poses':poses }
print(len(meta), 'planches')
with open(os.path.join(OUT, 'poses.js'), 'w') as f:
    f.write('// Stage 3 : les poses du héros (glisser, tombé sonné, assis qui se relève), faites par docs/stage3/poses.py\nwindow.S3_POSES = ' + json.dumps(meta, separators=(',', ':')) + ';\n')
