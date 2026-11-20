"""Tebni, style « Classique en vrai » (20/11) : 7 blocs de verre (ComfyUI FLUX.2 klein, préfixe tbc/b_<pièce>) et le fond (tbc/fond_l, fond_p).
python3 docs/tebni/build_classique.py <dossier tbc>  ->  jeux/tebni/img/c-<pièce>.webp, fond-cl-l.webp, fond-cl-p.webp"""
import sys, os
from PIL import Image, ImageEnhance
src = sys.argv[1]; dst = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'tebni', 'img')
for p in 'IJLOSTZ':
    im = Image.open(os.path.join(src, 'b_%s_00001_.png' % p)).convert('RGB')
    # on enlève la marge blanche autour du bloc : boîte des pixels colorés (pas blancs)
    g = im.convert('HSV').getchannel('S').point(lambda v: 255 if v > 60 else 0); bb = g.getbbox(); w = bb[2] - bb[0]; h = bb[3] - bb[1]; m = int(min(w, h) * .015)
    im.crop((bb[0] + m, bb[1] + m, bb[2] - m, bb[3] - m)).resize((96, 96), Image.LANCZOS).save(os.path.join(dst, 'c-%s.webp' % p), quality=88)
for k, (W, H) in (('l', (1600, 900)), ('p', (900, 1600))):
    im = Image.open(os.path.join(src, 'fond_%s_00001_.png' % k)).convert('RGB').resize((W, H), Image.LANCZOS)
    ImageEnhance.Brightness(im).enhance(1.35).save(os.path.join(dst, 'fond-cl-%s.webp' % k), quality=78)
print('ok')
