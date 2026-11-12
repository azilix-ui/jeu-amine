"""Ma Houma : poses assises faites avec ComfyUI (Wan 2.2, PC du papa, gratuit).
Prend une des dernières images de chaque vidéo « <id>[_<tenue>]_assis_0000N_.png » (fond vert 480 x 832, personnage debout de 560 px au départ),
enlève le fond vert, recadre et écrit jeux/houma/s-<id>[-<tenue>].webp + jeux/houma/assis.js (repères de la tête et taille par rapport au personnage debout).
Usage : python3 docs/houma/build_assis.py <dossier des images>"""
import sys, os, re, json, glob
from PIL import Image
src = sys.argv[1]; meta = {}
if os.path.exists('jeux/houma/assis.js'):
    meta = json.loads(open('jeux/houma/assis.js', encoding='utf-8').read().split('=', 1)[1].rstrip(';\n'))
best = {}
for f in glob.glob(src + '/*_assis_*.png'):
    m = re.match(r'(.+)_assis_(\d+)_\.png', os.path.basename(f)); best[m.group(1)] = min(best.get(m.group(1), f), f)   # la première des 3 dernières images : les yeux y sont ouverts
for key, f in sorted(best.items()):
    i, _, t = key.partition('_')
    im = Image.open(f).convert('RGB'); w, h = im.size; px = im.load()
    out = Image.new('RGBA', (w, h)); o = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]; k = g - max(r, b)                      # à quel point c'est vert
            a = 255 if k < 24 else 0 if k > 70 else int(255 * (70 - k) / 46)
            if a and k > 0: g = max(r, b) + min(k, 6)                  # retire le reflet vert sur les bords
            o[x, y] = (r, g, b, a)
    al = out.getchannel('A').point(lambda v: 255 if v > 60 else 0); box = al.getbbox()
    out = out.crop(box); al = al.crop(box); W, H = out.size; m = al.load()
    rows = []
    for y in range(H):
        xs = [x for x in range(W) if m[x, y]]; rows.append((xs[0], xs[-1]) if xs else None)
    wid = lambda y: (rows[y][1] - rows[y][0]) if rows[y] else 0
    ny = min(range(int(H * .2), int(H * .6)), key=wid); head = [y for y in range(0, ny) if rows[y]]
    hw = max(wid(y) for y in head); hcx = sum((rows[y][0] + rows[y][1]) / 2 for y in head) / len(head)
    out.save('jeux/houma/s-' + i + ('-' + t if t else '') + '.webp', quality=86, method=6)
    meta.setdefault(i, {})[t or 'ville'] = [W, H, round(H / 560, 3), round(hcx / W, 3), round(hw / W, 3), round(ny / H, 3)]
    print(key, W, H)
open('jeux/houma/assis.js', 'w', encoding='utf-8').write('/* Fabriqué par docs/houma/build_assis.py : [largeur, hauteur, hauteur par rapport au personnage debout, tête x, tête largeur, cou y] */\nwindow.HOUMA_ASSIS = ' + json.dumps(meta, separators=(',', ':')) + ';\n')
