"""Ma Houma : fabrique les corps réalistes à partir des planches du Jasmin 2 (aucun crédit).
Pour chaque personnage et chaque tenue : case 21 (de face) et case 22 (yeux fermés, pour dormir), recadrées ensemble,
côte à côte dans jeux/houma/c-<id>[-<tenue>].webp. Écrit aussi jeux/houma/corps.js : tailles et repères (tête, cou, main, hanches)
en fractions de l'image, pour poser les chapeaux, les objets tenus et la position assise.
Usage : python3 docs/houma/build.py   (depuis la racine du dépôt)"""
import json
from PIL import Image
IDS = ['anis', 'imen', 'essil', 'salma', 'amine', 'nour', 'yasmine', 'fares']
TEN = ['', 'jebba', 'foot', 'astro', 'super', 'or']
CW, CH = 176, 288
meta = {}
for i in IDS:
    for t in TEN:
        name = f'corps-{i}' + (f'-{t}' if t else '')
        sh = Image.open(f'jeux/jasmin2/{name}.webp').convert('RGBA')
        cell = lambda n: sh.crop(((n % 6) * CW, (n // 6) * CH, (n % 6 + 1) * CW, (n // 6 + 1) * CH))
        a, b = cell(21), cell(22)
        al = lambda im: im.getchannel('A').point(lambda v: 255 if v > 40 else 0)
        ba, bb = al(a).getbbox(), al(b).getbbox()
        box = (max(0, min(ba[0], bb[0]) - 2), max(0, min(ba[1], bb[1]) - 2), min(CW, max(ba[2], bb[2]) + 2), min(CH, max(ba[3], bb[3]) + 2))
        a, b = a.crop(box), b.crop(box); w, h = a.size
        out = Image.new('RGBA', (w * 2, h), (0, 0, 0, 0)); out.paste(a, (0, 0)); out.paste(b, (w, 0))
        out.save(f'jeux/houma/c-{i}' + (f'-{t}' if t else '') + '.webp', quality=84, method=6)
        m = al(a).load(); rows = []
        for y in range(h):
            xs = [x for x in range(w) if m[x, y]]
            rows.append((xs[0], xs[-1]) if xs else None)
        wid = lambda y: (rows[y][1] - rows[y][0]) if rows[y] else 0
        y0 = next(y for y in range(h) if rows[y])
        ny = min(range(int(h * .16), int(h * .46)), key=wid)                       # le cou : la ligne la plus étroite
        head = [y for y in range(y0, ny) if rows[y]]
        hw = max(wid(y) for y in head); hcx = sum((rows[y][0] + rows[y][1]) / 2 for y in head) / len(head)
        hy = max(range(int(h * .42), int(h * .66)), key=lambda y: rows[y][1] if rows[y] else 0)   # la main droite : le point le plus à droite
        meta.setdefault(i, {})[t or 'ville'] = [w, h, round(hcx / w, 3), round(y0 / h, 3), round(hw / w, 3), round(ny / h, 3), round(rows[hy][1] / w, 3), round(hy / h, 3)]
open('jeux/houma/corps.js', 'w', encoding='utf-8').write('/* Fabriqué par docs/houma/build.py : [largeur, hauteur, centre de la tête x, haut de la tête y, largeur de la tête, cou y, main x, main y] */\nwindow.HOUMA_CORPS = ' + json.dumps(meta, separators=(',', ':')) + ';\n')
print(json.dumps(meta['salma']), json.dumps(meta['anis']['ville']))
