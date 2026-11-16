"""Images de Khyout (ComfyUI, FLUX.2 klein, 17/11) : python3 docs/khyout/build_images.py <dossier contenant kh/>
fond (atelier de tissage de Kairouan, paysage et portrait), pelote de laine grise (teinte par le jeu), bois du plateau,
brin de laine (le fil, teint par le jeu), pont de pierre (vu de dessus)."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma'))
from detoure import cut
from PIL import Image, ImageOps
src = sys.argv[1]; out = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'khyout', 'img')
g = lambda n: os.path.join(src, 'kh', n + '_00001_.png')
def rogne(im, m=6):
    bb = im.getbbox(); return im.crop((max(0, bb[0]-m), max(0, bb[1]-m), min(im.width, bb[2]+m), min(im.height, bb[3]+m)))
im = Image.open(g('fond_paysage')).convert('RGB'); im.thumbnail((1600, 1600)); im.save(os.path.join(out, 'fond-paysage.webp'), quality=68)
im = Image.open(g('fond_portrait')).convert('RGB'); im.thumbnail((1600, 1600)); im.save(os.path.join(out, 'fond-portrait.webp'), quality=68)
im = Image.open(g('bois')).convert('RGB').resize((512, 512), Image.LANCZOS); im.save(os.path.join(out, 'bois.webp'), quality=72)
p = rogne(cut(g('pelote'))); p.thumbnail((256, 256)); p.save(os.path.join(out, 'pelote.webp'), quality=82)
p = rogne(cut(g('pont'))); p.thumbnail((256, 256)); p.save(os.path.join(out, 'pont.webp'), quality=80)
# le brin : la bande claire au milieu, le noir devient transparent
b = Image.open(g('brin')).convert('L'); w, h = b.size
rows = [sum(b.getpixel((x, y)) for x in range(0, w, 16)) for y in range(h)]
ys = [y for y, v in enumerate(rows) if v > max(rows) * .25]; y0, y1 = ys[0], ys[-1] + 1
band = b.crop((40, y0, w - 40, y1)).resize((768, 48), Image.LANCZOS)
rgba = Image.merge('RGBA', (band, band, band, band.point(lambda v: min(255, v * 2))))
rgba.save(os.path.join(out, 'brin.webp'), quality=85)
print('ok', y0, y1)
