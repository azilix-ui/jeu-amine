"""Éveil · le livre animé (18/11) : les animaux du cortège (ComfyUI, FLUX.2 klein, fond vert) -> eveil/livre/img/<nom>.webp
Usage : python3 -I build_livre.py <dossier PNG output/livre> <eveil/livre/img> [planche.jpg]"""
import os, re, sys
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'houma'))
from detoure import cut

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
faits = []
for f in sorted(os.listdir(src)):
    m = re.match(r'(.+?)_\d+_\.png$', f)
    if not m or m.group(1) == 'papier': continue
    if m.group(1) == 'arche':   # le décor du cortège (pas de détourage)
        im = Image.open(os.path.join(src, f)).convert('RGB'); im = im.resize((1280, round(1280 * im.height / im.width)), Image.LANCZOS)
        im.save(os.path.join(dst, 'arche.webp'), 'WEBP', quality=74, method=6); print('arche', im.size); continue
    im = cut(os.path.join(src, f), 'green'); im = im.crop(im.getbbox())
    im.thumbnail((640, 640), Image.LANCZOS)
    out = os.path.join(dst, m.group(1) + '.webp'); im.save(out, 'WEBP', quality=82, method=6); faits.append(im)
    print(m.group(1), im.size, os.path.getsize(out) // 1024, 'Ko')
if len(sys.argv) > 3:   # planche contact sur un fond sombre, pour vérifier le détourage
    W = 330; p = Image.new('RGB', (W * 4, W * 2), (13, 34, 48))
    for i, im in enumerate(faits):
        c = im.copy(); c.thumbnail((W - 10, W - 10)); p.paste(c, ((i % 4) * W + 5, (i // 4) * W + 5), c)
    p.save(sys.argv[3], quality=85)
