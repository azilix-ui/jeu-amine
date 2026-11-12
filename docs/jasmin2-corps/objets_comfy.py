"""Jasmin 2 : objets « en vrai » faits avec ComfyUI en local (FLUX.2 klein 4B, texte vers image, gratuit).
Détoure le fond uni (vert, bleu ou magenta), recadre, réduit à 200 px et écrit jeux/jasmin2/obj-<nom>.webp.
Usage : python3 docs/jasmin2-corps/objets_comfy.py <nom>=<image>:<fond> ...   (fond : green, blue, magenta)"""
import sys
from PIL import Image
KEY = {'green': lambda r, g, b: g - max(r, b), 'blue': lambda r, g, b: b - max(r, g), 'magenta': lambda r, g, b: min(r, b) - g}
for arg in sys.argv[1:]:
    name, rest = arg.split('='); path, bg = rest.rsplit(':', 1); key = KEY[bg]
    im = Image.open(path).convert('RGB'); w, h = im.size; px = im.load(); out = Image.new('RGBA', (w, h)); o = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]; k = key(r, g, b)
            a = 255 if k < 30 else 0 if k > 80 else int(255 * (80 - k) / 50)
            if a and k > 0:   # retire le reflet du fond sur les bords
                if bg == 'green': g = max(r, b) + min(k, 8)
                elif bg == 'blue': b = max(r, g) + min(k, 8)
                else: r = b = g + min(k, 8)
            o[x, y] = (r, g, b, a)
    out = out.crop(out.getchannel('A').point(lambda v: 255 if v > 80 else 0).getbbox()); out.thumbnail((200, 200), Image.LANCZOS)
    out.save(f'jeux/jasmin2/obj-{name}.webp', quality=88, method=6); print(name, out.size)
