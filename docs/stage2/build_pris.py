"""Stage 2 (16/11) : les ennemis « capturés, tout tristes » qu'on porte au-dessus de la tête → jeux/stage2/pris/<nom>.webp.
Sources ComfyUI : output/pris/<nom>_00001_.png (animaux, FLUX.2 klein, retouche de input/s2_<nom>.png ou jas_<nom>.png : « lifted up, legs dangling, very sad »)
et output/pris2/<nom>_41_00001_.png (gardes, marchand, voleur, contrôleur : « dangles helplessly… crying » ; crabe et scorpion : « flipped on its back… sad »).
Usage : python3 docs/stage2/build_pris.py <dossier pris> <dossier pris2>"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma')); sys.path.insert(0, os.path.dirname(__file__))
from detoure import cut; from gestes import propre
from PIL import Image
P1, P2 = sys.argv[1], sys.argv[2]
src = { n: os.path.join(P2, n + '_41_00001_.png') for n in ['garde', 'marchand', 'voleur', 'controleur', 'crabe', 'scorpion'] }
src.update({ n: os.path.join(P1, n + '_00001_.png') for n in ['chat', 'chevre', 'chien', 'rat', 'serpent'] })
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'stage2', 'pris'); os.makedirs(OUT, exist_ok=True)
for n, f in src.items():
    im = propre(cut(f)); im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()); im.thumbnail((240, 240), Image.LANCZOS)
    im.save(os.path.join(OUT, n + '.webp'), quality=82, method=6); print(n, im.size)
