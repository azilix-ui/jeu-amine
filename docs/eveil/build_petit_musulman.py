"""Éveil religieux, série 3 « Ma vie de petit musulman » (21/11) : images et films ComfyUI -> eveil/petit-musulman/img et vid.
Usage : python3 -I build_petit_musulman.py <dossier pmf (PNG choisis : m<n>_<k>.png)> [<dossier pmv (films Wan 2.2)>]
Les films passent par boucle.sh (la fin se fond dans le début). Images : 1280 px de large, webp."""
import os, re, sys, subprocess
from PIL import Image
R = os.path.join(os.path.dirname(__file__), '..', '..'); D = os.path.join(R, 'eveil', 'petit-musulman')
os.makedirs(os.path.join(D, 'img'), exist_ok=True); os.makedirs(os.path.join(D, 'vid'), exist_ok=True)
n = 0
for f in sorted(os.listdir(sys.argv[1])):
    m = re.match(r'(m\d_[a-d])\.png$', f)
    if m: im = Image.open(os.path.join(sys.argv[1], f)).convert('RGB'); im.thumbnail((1280, 1280)); im.save(os.path.join(D, 'img', m.group(1) + '.webp'), quality=82, method=6); n += 1
SANS = {'m6_c'}   # le film transforme le petit qui verse l'eau en drôle de créature : on garde l'image seule
v = 0
if len(sys.argv) > 2:
    for f in sorted(os.listdir(sys.argv[2])):
        m = re.match(r'(m\d_[a-d])_\d+_?\.mp4$', f)
        if m and m.group(1) not in SANS: subprocess.run(['sh', os.path.join(os.path.dirname(__file__), 'boucle.sh'), os.path.join(sys.argv[2], f), os.path.join(D, 'vid', m.group(1) + '.mp4')], check=True); v += 1
print('images', n, 'films', v)
