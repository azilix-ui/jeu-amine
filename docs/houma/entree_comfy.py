"""Ma Houma : prépare les images de départ pour ComfyUI (Wan 2.2 image vers vidéo, sur le PC du papa).
Chaque personnage debout, de face (case 21 des planches du Jasmin 2), agrandi sur fond vert 480 x 832.
Usage : python3 docs/houma/entree_comfy.py <dossier de sortie> [tenue]   (tenue : '', jebba, foot, astro, super, or)"""
import sys
from PIL import Image
out, ten = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else '')
for i in ['anis', 'imen', 'essil', 'salma', 'amine', 'nour', 'yasmine', 'fares']:
    name = f'corps-{i}' + (f'-{ten}' if ten else '')
    c = Image.open(f'jeux/jasmin2/{name}.webp').convert('RGBA').crop((3 * 176, 3 * 288, 4 * 176, 4 * 288))
    c = c.crop(c.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())
    k = 560 / c.height; c = c.resize((round(c.width * k), 560), Image.LANCZOS)
    bg = Image.new('RGBA', (480, 832), (0, 177, 64, 255)); bg.alpha_composite(c, ((480 - c.width) // 2, 832 - 560 - 90))
    bg.convert('RGB').save(f'{out}/houma_{i}{"_" + ten if ten else ""}.png')
