"""Ma Houma : nouvelles tenues faites avec ComfyUI en local (FLUX.2 klein 4B : on retouche la tenue du personnage debout, puis on lui ferme les yeux).
Pour chaque <id>_<tenue>_00001_.png (debout) et <id>_<tenue>_dodo_00001_.png (yeux fermés) du dossier : détourage du fond vert, même cadrage,
côte à côte dans jeux/houma/c-<id>-<tenue>.webp (hauteur 320 px), et repères ajoutés à jeux/houma/corps.js (même format que build.py).
Usage : python3 docs/houma/build_tenues.py <dossier>"""
import sys, os, re, json, glob
from PIL import Image
src = sys.argv[1]
head, body = open('jeux/houma/corps.js', encoding='utf-8').read().split('window.HOUMA_CORPS = ')
meta = json.loads(body.rstrip(';\n'))
sys.path.insert(0, os.path.dirname(__file__)); from detoure import cut
for f in sorted(glob.glob(src + '/*_00001_.png')):
    m = re.match(r'([a-z]+)_([a-z]+)_00001_\.png$', os.path.basename(f))
    if not m: continue
    i, t = m.groups(); d = f.replace('_00001_', '_dodo_00001_'); a = cut(f); b = cut(d) if os.path.exists(d) else a
    al = lambda im: im.getchannel('A').point(lambda v: 255 if v > 60 else 0)
    ba, bb = al(a).getbbox(), al(b).getbbox(); box = (min(ba[0], bb[0]), min(ba[1], bb[1]), max(ba[2], bb[2]), max(ba[3], bb[3]))
    if abs((bb[3]-bb[1]) - (ba[3]-ba[1])) > 40 or abs(bb[0]-ba[0]) > 30: print('  cadrage différent :', i, t, ba, bb)
    a, b = a.crop(box), b.crop(box); k = 320 / a.height; size = (round(a.width * k), 320); a, b = a.resize(size, Image.LANCZOS), b.resize(size, Image.LANCZOS); w, h = size
    out = Image.new('RGBA', (w * 2, h)); out.paste(a, (0, 0)); out.paste(b, (w, 0)); out.save(f'jeux/houma/c-{i}-{t}.webp', quality=84, method=6)
    mk = al(a).load(); rows = []
    for y in range(h):
        xs = [x for x in range(w) if mk[x, y]]; rows.append((xs[0], xs[-1]) if xs else None)
    wid = lambda y: (rows[y][1] - rows[y][0]) if rows[y] else 0
    y0 = next(y for y in range(h) if rows[y]); y1 = max(y for y in range(h) if rows[y]); fh = y1 - y0   # le personnage debout peut être plus petit que le cadre commun
    ny = min(range(y0 + int(fh * .16), y0 + int(fh * .46)), key=wid); hd = [y for y in range(y0, ny) if rows[y]]
    hw = max(wid(y) for y in hd); hcx = sum((rows[y][0] + rows[y][1]) / 2 for y in hd) / len(hd); hy = max(range(y0 + int(fh * .42), y0 + int(fh * .66)), key=lambda y: rows[y][1] if rows[y] else 0)
    meta.setdefault(i, {})[t] = [w, h, round(hcx / w, 3), round(y0 / h, 3), round(hw / w, 3), round(ny / h, 3), round(rows[hy][1] / w, 3), round(hy / h, 3)]
open('jeux/houma/corps.js', 'w', encoding='utf-8').write(head + 'window.HOUMA_CORPS = ' + json.dumps(meta, separators=(',', ':')) + ';\n')
print(len(glob.glob('jeux/houma/c-*.webp')), 'images debout')
