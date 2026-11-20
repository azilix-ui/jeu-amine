"""Serpent Légendes · l'arène (21/11) : les images ComfyUI (FLUX.2 klein) → jeux/arene/img/.
Usage : python3 docs/arene/build_images.py <dossier des png ComfyUI (arene/)>
- tete_<animal>.png (fond vert) : détourées, recadrées sur la tête, 256 px ;
- peau_<nom>.png : textures sans raccord pour le corps, 256 px ;
- sol.png : le sol de l'arène (carreaux), 512 px ; menu.png : le fond du menu."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma'))
from detoure import cut
from PIL import Image, ImageFilter, ImageChops
src = sys.argv[1]; dst = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'arene', 'img'); os.makedirs(dst, exist_ok=True)
for f in sorted(os.listdir(src)):
    if not f.endswith('.png'): continue
    nom = f.split('_00')[0]; p = os.path.join(src, f)
    if nom.startswith('tete_'):
        if nom == 'tete_tortue': continue   # tortue verte sur fond vert : le détourage la mange (pas gardée)
        im = cut(p, 'green')
        # on bouche les encoches du menton (ombre verte au sol reliée au bord) : fermeture du masque, puis on enlève le reflet vert
        a = im.getchannel('A'); m = a.point(lambda v: 255 if v > 128 else 0)
        ferme = m.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.MinFilter(31)).filter(ImageFilter.GaussianBlur(1))
        a2 = ImageChops.lighter(a, ferme); r, g, b, _ = im.split()
        g = ImageChops.darker(g, ImageChops.add(ImageChops.lighter(r, b), Image.new('L', im.size, 25)))
        im = Image.merge('RGBA', (r, g, b, a2)); bb = im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox(); im = im.crop(bb)
        w, h = im.size; s = max(w, h); c = Image.new('RGBA', (s, s), (0, 0, 0, 0)); c.paste(im, ((s - w) // 2, (s - h) // 2)); c = c.resize((256, 256), Image.LANCZOS)
        c.save(os.path.join(dst, nom + '.webp'), quality=86, method=6)
    elif nom.startswith('peau_'):
        Image.open(p).convert('RGB').resize((256, 256), Image.LANCZOS).save(os.path.join(dst, nom + '.webp'), quality=82, method=6)
    elif nom == 'sol':
        Image.open(p).convert('RGB').resize((512, 512), Image.LANCZOS).save(os.path.join(dst, 'sol.webp'), quality=80, method=6)
    elif nom == 'menu':
        im = Image.open(p).convert('RGB'); im.save(os.path.join(dst, 'menu.webp'), quality=78, method=6)
        im.resize((im.width // 2, im.height // 2)).save(os.path.join(dst, 'menu-p.webp'), quality=78, method=6)
print('ok', len(os.listdir(dst)))
