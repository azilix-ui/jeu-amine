"""Les Écuries (15/11) : prépare les photos ComfyUI des chevaux et du décor de « nos écuries ».
Usage : python3 docs/ecuries/build_photos.py <dossier ComfyUI output/ecu>
 - ch_<id>_0000N_.png (cheval de profil tourné vers la droite, fond vert) → essil/ecuries/img/h-<id>.webp (détouré, 640 px de haut)
   et ses repères de pansage (sabots, œil, naseau, crinière, queue, épaule, flanc…) en fractions de l'image → essil/ecuries/ancres.js
 - fond_ecurie, fond_pansage → img/fond-ecurie.webp, img/fond-pansage.webp ; o_<outil> → img/o-<outil>.webp
On prend toujours la dernière version d'une image (le plus grand numéro)."""
import sys, os, glob, json, re
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma')); from detoure import cut

SRC = sys.argv[1]
IMG = os.path.join(os.path.dirname(__file__), '..', '..', 'essil', 'ecuries', 'img')
def dernier(nom):
    fs = sorted(glob.glob(os.path.join(SRC, nom + '_0*_.png')))
    return fs[-1] if fs else None

def reperes(al):
    """al : masque (h, w) booléen du cheval de profil tourné vers la droite. Renvoie des repères en fractions (x, y)."""
    h, w = al.shape; ys, xs = np.nonzero(al); top, bot, lef, rig = ys.min(), ys.max(), xs.min(), xs.max(); H, W = bot - top, rig - lef
    fx = lambda x: round(float(x) / w, 4); fy = lambda y: round(float(y) / h, 4)
    def dans(x, y):   # le point du cheval le plus proche
        x, y = int(x), int(y)
        if 0 <= y < h and 0 <= x < w and al[y, x]: return x, y
        d = (xs - x) ** 2 + (ys - y) ** 2; i = d.argmin(); return xs[i], ys[i]
    A = {}
    # les sabots : les taches en bas de l'image
    bas = al[bot - int(H * .035): bot + 1].any(axis=0); runs = []; x = 0
    while x < w:
        if bas[x]:
            x0 = x
            while x < w and bas[x]: x += 1
            if x - x0 > W * .012: runs.append((x0 + x) / 2)
        x += 1
    mid = lef + W * .5   # deux sabots derrière, deux devant (souvent l'un cache l'autre : on les écarte un peu)
    arr = [r for r in runs if r < mid] or [lef + W * .25]; av = [r for r in runs if r >= mid] or [lef + W * .66]
    pts = []
    for g in (arr, av):
        if len(g) >= 2: pts += [min(g), max(g)] if max(g) - min(g) > W * .03 else [(min(g) + max(g)) / 2 - W * .022, (min(g) + max(g)) / 2 + W * .022]
        else: pts += [g[0] - W * .022, g[0] + W * .022]
    for i, r in enumerate(pts): A['sabot' + str(i)] = [fx(r), fy(bot - H * .03)]
    # la tête : le plus haut à droite (les oreilles), le museau le plus à droite dans le haut du corps
    droite = xs > lef + W * .62; oy = ys[droite].min(); ox = xs[droite][ys[droite] == oy].mean()
    haut = ys < top + H * .5; mx = xs[haut].max(); my = ys[haut][xs[haut] == mx].mean()
    A['oeil'] = list(map(lambda v: v, [fx(ox + (mx - ox) * .3), fy(oy + (my - oy) * .45)]))
    nx, ny = dans(mx - W * .025, my + H * .015); A['naseau'] = [fx(nx), fy(ny)]
    cx, cy = dans(ox + (mx - ox) * .55, oy + (my - oy) * .62); A['chanfrein'] = [fx(cx), fy(cy)]
    # l'encolure et la crinière : entre la tête et le garrot
    gx = lef + W * .62
    for k, f in (('criniere1', .35), ('criniere2', .7)):
        x = ox + (gx - ox) * f; col = np.nonzero(al[:, int(x)])[0]; y = col.min() if len(col) else top + H * .2; A[k] = [fx(x), fy(y + H * .03)]
    ex, ey = dans(lef + W * .7, top + H * .32); A['encolure'] = [fx(ex), fy(ey)]
    # le corps
    for k, (a, b) in { 'epaule':(.66, .5), 'flanc':(.45, .52), 'dos':(.45, .34), 'croupe':(.2, .3), 'cuisse':(.18, .5), 'canon':(.66, .8), 'jarret':(.2, .74) }.items():
        x, y = dans(lef + W * a, top + H * b); A[k] = [fx(x), fy(y)]
    # la queue : le plus à gauche
    qy = ys[xs == lef].mean(); qx, qy = dans(lef + W * .02, qy + H * .06); A['queue'] = [fx(qx), fy(qy)]
    return A

ancres = {}
for f in sorted(glob.glob(os.path.join(SRC, 'ch_*_00001_.png'))):
    id = re.match(r'ch_(.+)_00001_', os.path.basename(f)).group(1); f = dernier('ch_' + id)
    im = cut(f); al = np.array(im.getchannel('A')) > 90
    # le reflet vert du fond sur le ventre et les jambes : aucun cheval n'est vert, on plafonne le vert au rouge ou au bleu
    px = np.array(im).astype(np.int16); px[..., 1] = np.minimum(px[..., 1], np.maximum(px[..., 0], px[..., 2]) + 4); im = Image.fromarray(px.astype(np.uint8), 'RGBA')
    # on enlève les miettes (herbe, reflets) : on garde la plus grande tache
    from scipy import ndimage as nd
    lab, n = nd.label(al)
    if n > 1:
        t = nd.sum(al, lab, range(1, n + 1)); garde = lab == (t.argmax() + 1); a = np.array(im.getchannel('A')); a[~nd.binary_dilation(garde, iterations=3)] = 0; im.putalpha(Image.fromarray(a)); al = garde
    box = Image.fromarray((al * 255).astype('uint8')).getbbox(); m = 6
    box = (max(0, box[0] - m), max(0, box[1] - m), min(im.width, box[2] + m), min(im.height, box[3] + m))
    im = im.crop(box); al = al[box[1]:box[3], box[0]:box[2]]
    k = 640 / im.height; im = im.resize((round(im.width * k), 640), Image.LANCZOS)
    im.save(os.path.join(IMG, f'h-{id}.webp'), 'WEBP', quality=82, method=6)
    a = reperes(al); ancres[id] = { 'w':im.width, 'h':im.height, 'a':a }; print(id, im.size)
for k in ('fond_ecurie', 'fond_pansage'):
    f = dernier(k)
    if f: Image.open(f).convert('RGB').resize((1600, 686), Image.LANCZOS).save(os.path.join(IMG, k.replace('_', '-') + '.webp'), 'WEBP', quality=78, method=6)
for f in glob.glob(os.path.join(SRC, 'o_*_00001_.png')):
    id = re.match(r'o_(.+)_00001_', os.path.basename(f)).group(1)
    Image.open(dernier('o_' + id)).convert('RGB').resize((480, 480), Image.LANCZOS).save(os.path.join(IMG, f'o-{id}.webp'), 'WEBP', quality=82, method=6)
open(os.path.join(IMG, '..', 'ancres.js'), 'w').write('/* Les Écuries : les repères de pansage sur chaque photo de cheval (fractions de l\'image), faits par docs/ecuries/build_photos.py. */\nexport const ANCRES = ' + json.dumps(ancres) + ';\n')
