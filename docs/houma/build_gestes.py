"""Ma Houma : les gestes des personnages (salut, danse A, danse B, saut, bravo), faits avec ComfyUI en local (FLUX.2 klein : on retouche
l'image du personnage debout, le visage et la tenue restent). Pour chaque personnage et chaque tenue : détourage, même échelle que debout
(rapport des hauteurs dans les images d'origine), pieds alignés, 5 cases côte à côte → jeux/houma/g-<id>[-<tenue>].webp ; repères dans jeux/houma/gestes.js :
HOUMA_GESTES[id][tenue] = [largeur case, hauteur case, pieds x (fraction), hauteur case / hauteur debout, ligne du sol (fraction)].
Usage : python3 docs/houma/build_gestes.py <dossier des gestes> <dossier des images debout>
  (gestes : <id>_<tenue>_<geste>_00001_.png ; debout : houma_<id>[_<tenue>].png ou houma2/<id>_<tenue>_00001_.png)"""
import sys, os, glob, json
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from detoure import cut
gdir, sdir = sys.argv[1], sys.argv[2]
K = ['salut', 'danseA', 'danseB', 'saut', 'bravo']
out = 'jeux/houma/gestes.js'; meta = {}
if os.path.exists(out):
    try: meta = json.loads(open(out, encoding='utf-8').read().split('=', 1)[1].strip().rstrip(';'))
    except Exception: meta = {}
def box(im):
    a = im.getchannel('A').point(lambda v: 255 if v > 60 else 0); bb = a.getbbox(); return a, bb
def debout(i, t):
    for p in ([f'{sdir}/houma_{i}.png'] if t == 'ville' else [f'{sdir}/houma_{i}_{t}.png', f'{sdir}/houma2/{i}_{t}_00001_.png']):
        if os.path.exists(p): return p
for f in sorted(glob.glob(f'{gdir}/*_salut_00001_.png')):
    i, t = os.path.basename(f).split('_')[:2]
    fr = [f'{gdir}/{i}_{t}_{k}_00001_.png' for k in K]
    if not all(os.path.exists(x) for x in fr): print('incomplet', i, t); continue
    s = debout(i, t)
    if not s: print('pas d\'image debout', i, t); continue
    st = cut(s); sa, sb = box(st); H0 = st.height; hs = (sb[3] - sb[1]) / H0; yg = sb[3] / H0   # la ligne du sol et la taille debout
    ft = sa.crop((sb[0], sb[3] - max(4, (sb[3] - sb[1]) // 12), sb[2], sb[3])).getbbox(); xc = (sb[0] + (ft[0] + ft[2]) / 2) / H0
    ims = []
    for x in fr:   # le cadrage est gardé par ComfyUI : on place chaque geste dans le même repère que l'image debout (le saut reste en l'air)
        im = cut(x); a, bb = box(im); n = im.height; ims.append((im, [v / n for v in bb], n))
    L = max(xc - bb[0] for im, bb, n in ims); R = max(bb[2] - xc for im, bb, n in ims); T = min(bb[1] for im, bb, n in ims); B = max([yg] + [bb[3] for im, bb, n in ims])
    ch = 330; k0 = ch / (B - T); cw = round((L + R) * k0)
    sheet = Image.new('RGBA', (cw * 5, ch))
    for j, (im, bb, n) in enumerate(ims):
        px = [round(v * n) for v in bb]; c = im.crop(px); c = c.resize((max(1, round((bb[2] - bb[0]) * k0)), max(1, round((bb[3] - bb[1]) * k0))), Image.LANCZOS)
        sheet.paste(c, (j * cw + round((bb[0] - (xc - L)) * k0), round((bb[1] - T) * k0)), c)
    sheet.save(f'jeux/houma/g-{i}{"" if t == "ville" else "-" + t}.webp', quality=82, method=6)
    meta.setdefault(i, {})[t] = [cw, ch, round(L / (L + R), 3), round((B - T) / hs, 3), round((yg - T) / (B - T), 3)]
    print(i, t, 'ok', cw, ch, round((B - T) / hs, 2))
open(out, 'w', encoding='utf-8').write('// fabriqué par docs/houma/build_gestes.py\nwindow.HOUMA_GESTES = ' + json.dumps(meta, separators=(',', ':')) + ';\n')
