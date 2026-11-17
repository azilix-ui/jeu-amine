"""Images de Yajour (ComfyUI, FLUX.2 klein, 17/11) : python3 docs/yajour/build_images.py <dossier contenant yaj/>
- les héros en super-héros (tenue « super » de Ma Houma) : de dos (on vise), en vol (de dos), joie, oups (assis, sonné), face (menu).
  Amine, Anis et Imen avaient une cape verte (partie avec le fond vert ; le fond bleu, lui, emportait le costume violet) :
  ils ont une cape ROUGE (r_*), les autres gardent leur cape turquoise (p_*). → img/h-<id>-<pose>.webp
- le chaton à sauver, la rosace de lancement, les matières des blocs (m_*), les sols et les panoramas des 3 mondes."""
import sys, os, glob
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma'))
from detoure import cut
from PIL import Image, ImageDraw
src = os.path.join(sys.argv[1], 'yaj'); out = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'yajour', 'img')
f = lambda n: os.path.join(src, n + '_00001_.png')
def rogne(im, m=4):
    bb = im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox(); return im.crop((max(0, bb[0]-m), max(0, bb[1]-m), min(im.width, bb[2]+m), min(im.height, bb[3]+m)))
for who in ['amine', 'salma', 'essil', 'anis', 'imen', 'nour', 'yasmine', 'fares']:
    for pose in ['dos', 'vol', 'joie', 'oups', 'face']:
        r, p = f('r_%s_%s' % (who, pose)), f('p_%s_%s' % (who, pose))   # r_ : cape rouge (Amine, Anis, Imen : leur cape verte partait avec le fond vert)
        if os.path.exists(r): im = cut(r)
        elif os.path.exists(p): im = cut(p)
        elif pose == 'face' and os.path.exists(os.path.join(sys.argv[1], 'houma_%s_super.png' % who)): im = cut(os.path.join(sys.argv[1], 'houma_%s_super.png' % who))
        else: print('manque', who, pose); continue
        im = rogne(im); h = 420 if pose != 'vol' else 380; im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
        im.save(os.path.join(out, 'h-%s-%s.webp' % (who, pose)), quality=84)
im = rogne(cut(f('chat'), 'blue')); im.thumbnail((300, 300)); im.save(os.path.join(out, 'chat.webp'), quality=84)
im = cut(f('rampe')); im = rogne(im, 0); im = im.resize((512, 512), Image.LANCZOS)
m = Image.new('L', (512, 512), 0); ImageDraw.Draw(m).ellipse((4, 4, 508, 508), fill=255); im.putalpha(Image.composite(im.getchannel('A'), m, m)); im.save(os.path.join(out, 'rampe.webp'), quality=82)
for n in ['bois', 'brique', 'feux', 'marbre', 'matelas', 'palmier', 'pierre', 'zellige']:
    Image.open(f('m_' + n)).convert('RGB').resize((256, 256), Image.LANCZOS).save(os.path.join(out, 'm-' + n + '.webp'), quality=80)
t = Image.open(f('m_terre')).convert('RGB'); w, hh = t.size; t.crop((int(w * .38), int(hh * .45), int(w * .62), int(hh * .69))).resize((256, 256), Image.LANCZOS).save(os.path.join(out, 'm-terre.webp'), quality=80)
for n in ['sidibou', 'eljem', 'sahara']:
    Image.open(f('sol_' + n)).convert('RGB').resize((512, 512), Image.LANCZOS).save(os.path.join(out, 'sol-' + n + '.webp'), quality=76)
    im = Image.open(f('pano_' + n)).convert('RGB'); im.thumbnail((1600, 1600)); im.save(os.path.join(out, 'pano-' + n + '.webp'), quality=70)
print('ok')
