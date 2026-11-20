"""Les dessins animés du début des cours (20/11) : scènes ComfyUI (FLUX.2 klein, références : Salma de Ma Houma / Lumi de la Planète des Nombres)
et objets détourés. python3 docs/cours/build_histoires.py <dossier ComfyUI output/nuit>
  sd_1..4 → salma/ollie/img/h-sd<n>.webp   (La boulangerie des doubles)
  sf_1..4 → salma/ollie/img/h-sf<n>.webp   (La machine du futur)
  az_1..5, al_1..3 → amine/lumi/img/h-az<n>.webp, h-al<n>.webp
  o_makroud, o_cupcake, o_poisson, o_croissant (fond vert) → salma/ollie/img/d-<nom>.webp
  o_etoile, o_paquet, o_caisse, o_wagon (fond bleu) → amine/lumi/img/<nom>.webp"""
import sys, os
from PIL import Image
R = os.path.join(os.path.dirname(__file__), '..', '..'); sys.path.insert(0, os.path.join(R, 'docs', 'houma'))
from detoure import cut
src = sys.argv[1]; P = lambda n: os.path.join(src, n + '_00001_.png')
def sc(n, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True); Image.open(P(n)).convert('RGB').resize((1152, 658)).save(dst, quality=80)
for i in range(1, 5): sc('sd_%d' % i, os.path.join(R, 'salma/ollie/img/h-sd%d.webp' % i)); sc('sf_%d' % i, os.path.join(R, 'salma/ollie/img/h-sf%d.webp' % i))
for i in range(1, 6): sc('az_%d' % i, os.path.join(R, 'amine/lumi/img/h-az%d.webp' % i))
for i in range(1, 4): sc('al_%d' % i, os.path.join(R, 'amine/lumi/img/h-al%d.webp' % i))
def obj(n, fond, dst, taille=320):
    im = cut(P(n), fond); bb = im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox(); im = im.crop(bb); im.thumbnail((taille, taille))
    os.makedirs(os.path.dirname(dst), exist_ok=True); im.save(dst, quality=85)
for n in ('makroud', 'cupcake', 'poisson', 'croissant'): obj('o_' + n, 'green', os.path.join(R, 'salma/ollie/img/d-%s.webp' % n), 200)
for n in ('etoile', 'paquet', 'caisse'): obj('o_' + n, 'blue', os.path.join(R, 'amine/lumi/img/%s.webp' % n), 240)
obj('o_wagon', 'blue', os.path.join(R, 'amine/lumi/img/wagon.webp'), 420)
print('ok')
