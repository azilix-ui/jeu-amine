"""Ma Houma › Ma maison : meubles, objets et textures faits avec ComfyUI (FLUX.2 klein, texte → image) sur le PC du papa.
Entrée : dossier des PNG ComfyUI (<id>_00001_.png sur fond vert, ou bleu pour ce qui est vert) et tex/<id>_00001_.png.
Sortie : jeux/maison/<id>.webp (détouré, recadré), jeux/maison/tex/<id>.webp (texture rendue raccordable par miroir),
         jeux/maison/catalogue.js (proportions de chaque image).
Usage : python3 docs/maison/build.py <dossier>"""
import sys, os, glob, json
from PIL import Image, ImageOps
ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ICI, '..', 'houma')); from detoure import cut
exec(open(os.path.join(ICI, 'catalogue.py'), encoding='utf-8').read())
BLEU = {'monstera', 'dino', 'palmier', 'citronnier_pot', 'jasmin_pot', 'tortue', 'lapin', 'toilettes', 'couscoussier', 'darbouka_d', 'cactus_pot', 'bambou', 'olivier', 'arrosoir', 'cabane_arbre', 'ara_fleurs', 'graf_dino', 'tapis_route', 'chevalet', 'poster_cheval', 'mobile_planetes', 'tableau_dessins', 'carte_europe'}   # les 4 derniers refaits sur fond bleu (le vert mangeait le blanc)
src = sys.argv[1]; out = os.path.join(ICI, '..', '..', 'jeux', 'maison'); os.makedirs(out + '/tex', exist_ok=True)
dims, manque = {}, []
old = os.path.join(out, 'catalogue.js')   # on garde les images déjà faites (on peut ne refaire qu'une partie du catalogue)
if os.path.exists(old): dims.update(json.loads(open(old, encoding='utf-8').read().split('=', 1)[1].strip().rstrip(';')))
for id_, nom, cat, h, ou, fmt, p in C:
    f = sorted(glob.glob(f'{src}/{id_}_0000*_.png'))
    if not f: manque.append(id_); continue
    im = cut(f[-1], 'blue' if id_ in BLEU else 'green')
    a = im.getchannel('A').point(lambda v: 255 if v > 40 else 0); bb = a.getbbox()
    if not bb: manque.append(id_); continue
    im = im.crop(bb)
    k = min(1, (h * 1.6) / im.height, 640 / im.width); im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    im.save(f'{out}/{id_}.webp', quality=82, method=6); dims[id_] = [im.width, im.height]
for f in glob.glob(f'{src}/tex/*_00001_.png'):
    id_ = os.path.basename(f).split('_00001_')[0]; t = Image.open(f).convert('RGB').resize((384, 384), Image.LANCZOS)
    tile = Image.new('RGB', (768, 768)); tile.paste(t, (0, 0)); tile.paste(ImageOps.mirror(t), (384, 0)); tile.paste(ImageOps.flip(t), (0, 384)); tile.paste(ImageOps.flip(ImageOps.mirror(t)), (384, 384))
    tile.resize((512, 512), Image.LANCZOS).save(f'{out}/tex/{id_}.webp', quality=80, method=6)
open(f'{out}/catalogue.js', 'w', encoding='utf-8').write('// fabriqué par docs/maison/build.py : [largeur, hauteur] de chaque image\nwindow.MAISON_DIMS = ' + json.dumps(dims, separators=(',', ':')) + ';\n')
print(len(dims), 'objets', len(glob.glob(out + '/tex/*.webp')), 'textures', 'MANQUANTS :', manque)
