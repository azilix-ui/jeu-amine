"""Concours en vrai (essai, 19/11) : prépare les images ComfyUI de la carrière (FLUX.2 klein, préfixe cev/).
python3 docs/concours-vrai/build_images.py <dossier des PNG ComfyUI>  ->  essil/concours-vrai/img/"""
import sys, os
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma'))
from detoure import cut
src = sys.argv[1]; dst = os.path.join(os.path.dirname(__file__), '..', '..', 'essil', 'concours-vrai', 'img'); os.makedirs(dst, exist_ok=True)
P = lambda n: os.path.join(src, n + '_00001_.png')
# le ciel : les deux panoramas côte à côte, collés sur un cylindre autour de la carrière
a, b = Image.open(P('pano_a')).convert('RGB'), Image.open(P('pano_b')).convert('RGB')
# raccords fondus (256 px) entre a et b, et entre la fin de b et le début de a (le tour est fermé)
O = 256; grad = Image.linear_gradient('L').rotate(90, expand=True).resize((O, a.height)).transpose(Image.FLIP_LEFT_RIGHT)
def fond(g, d): return Image.composite(g, d, grad)   # à gauche g, à droite d
W = a.width + b.width - 2 * O; ciel = Image.new('RGB', (W, a.height))
ciel.paste(a.crop((O, 0, a.width - O, a.height)), (0, 0))
ciel.paste(fond(a.crop((a.width - O, 0, a.width, a.height)), b.crop((0, 0, O, b.height))), (a.width - 2 * O, 0))
ciel.paste(b.crop((O, 0, b.width - O, b.height)), (a.width - O, 0))
ciel.paste(fond(b.crop((b.width - O, 0, b.width, b.height)), a.crop((0, 0, O, a.height))), (W - O, 0))
ciel.resize((3072, 512)).save(os.path.join(dst, 'ciel.webp'), quality=82)
Image.open(P('herbe')).convert('RGB').resize((512, 512)).save(os.path.join(dst, 'herbe.webp'), quality=80)
# le sable : la première image avait des traces de pas ; la seconde (graine 9762) a des rides, qu'on adoucit de moitié
from PIL import ImageEnhance
sa = Image.open(P('sable_9762')).convert('RGB').resize((512, 512)); ImageEnhance.Contrast(sa).enhance(.35).save(os.path.join(dst, 'sable.webp'), quality=80)
# les obstacles en photo, détourés (fond vert)
for n in ('ob_vertical', 'ob_oxer', 'ob_mur', 'ob_jaune', 'ob_bouleau'):
    im = cut(P(n)); bb = im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox(); im = im.crop(bb)
    im.thumbnail((900, 600)); im.save(os.path.join(dst, n[3:] + '.webp'), quality=85)
print('ok')
