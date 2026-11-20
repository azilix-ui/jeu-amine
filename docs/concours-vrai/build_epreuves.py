"""Les épreuves « en vrai » (20/11) : panoramas, sols et obstacles ComfyUI (FLUX.2 klein, préfixe nuit/ep_ et nuit/ob_).
python3 docs/concours-vrai/build_epreuves.py <dossier des PNG ComfyUI>  ->  essil/concours-vrai/img/"""
import sys, os
from PIL import Image, ImageEnhance
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma'))
from detoure import cut
src = sys.argv[1]; dst = os.path.join(os.path.dirname(__file__), '..', '..', 'essil', 'concours-vrai', 'img'); os.makedirs(dst, exist_ok=True)
P = lambda n: os.path.join(src, n + '_00001_.png')
O = 256
def boucle(a, b):
    """deux panoramas (ou un panorama et son miroir) mis bout à bout, raccords fondus, pour faire le tour du cylindre"""
    grad = Image.linear_gradient('L').rotate(90, expand=True).resize((O, a.height)).transpose(Image.FLIP_LEFT_RIGHT)
    fond = lambda g, d: Image.composite(g, d, grad)
    W = a.width + b.width - 2 * O; c = Image.new('RGB', (W, a.height))
    c.paste(a.crop((O, 0, a.width - O, a.height)), (0, 0))
    c.paste(fond(a.crop((a.width - O, 0, a.width, a.height)), b.crop((0, 0, O, b.height))), (a.width - 2 * O, 0))
    c.paste(b.crop((O, 0, b.width - O, b.height)), (a.width - O, 0))
    c.paste(fond(b.crop((b.width - O, 0, b.width, b.height)), a.crop((0, 0, O, a.height))), (W - O, 0))
    return c.resize((3072, 512))
for n in ('course', 'dress', 'hunter', 'west'):
    a = Image.open(P('ep_%s_a' % n)).convert('RGB'); boucle(a, a.transpose(Image.FLIP_LEFT_RIGHT)).save(os.path.join(dst, 'p_%s.webp' % n), quality=80)
a, b = Image.open(P('ep_cross_a')).convert('RGB'), Image.open(P('ep_cross_b')).convert('RGB').resize(Image.open(P('ep_cross_a')).size)
boucle(a, b).save(os.path.join(dst, 'p_cross.webp'), quality=80)
for n in ('piste', 'pre', 'ranch'):
    t = Image.open(P('ep_t_' + n)).convert('RGB').resize((512, 512)); (ImageEnhance.Contrast(t).enhance(.6) if n != 'pre' else t).save(os.path.join(dst, 't_%s.webp' % n), quality=80)
# les obstacles détourés ; sur le tronc et le stère, l'image avait un petit cavalier : on coupe au-dessus de l'obstacle
COUPE = { 'ob_tronc':.6, 'ob_stere':.56 }   # part de la hauteur (depuis le haut de l'image détourée) où l'obstacle commence
for n, f in (('ob_tronc', 'blue'), ('ob_stere', 'blue'), ('ob_haie', 'blue'), ('ob_rustique', 'blue'), ('ob_tonneau', 'green')):
    im = cut(P(n), f); a = im.getchannel('A'); bb = a.point(lambda v: 255 if v > 40 else 0).getbbox(); im = im.crop(bb)
    if n in COUPE:
        # on cherche la première ligne assez large (le haut du tronc ou du tas de bois), et on coupe tout ce qui est au-dessus
        al = im.getchannel('A'); W, H = im.size; y0 = 0
        for y in range(H):
            if sum(1 for x in range(0, W, 4) if al.getpixel((x, y)) > 128) * 4 > W * COUPE[n]: y0 = y; break
        im = im.crop((0, max(0, y0 - 6), W, H))
    im.thumbnail((900, 600)); im.save(os.path.join(dst, n[3:] + '.webp'), quality=85)
print('ok')
