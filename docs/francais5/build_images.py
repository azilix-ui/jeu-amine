"""Français 5e · Essil (21/11) : images et films ComfyUI des dessins animés -> essil/francais/img/.
Usage : python3 -I docs/francais5/build_images.py <dossier> [<dossier>…]   (sous-dossiers fr5/ : f<n>_<k>_0000x_.png, fr5v/ : films Wan 2.2)
Une version « b » refaite remplace la première."""
import sys, os, re, subprocess
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); D = os.path.join(R, 'essil', 'francais', 'img'); os.makedirs(D, exist_ok=True)
COUPE = {}
ni = nv = 0
for base in sys.argv[1:]:
    for sous in ('fr5', 'fr5v'):
        src = os.path.join(base, sous)
        if not os.path.isdir(src): continue
        choix = {}
        for f in sorted(os.listdir(src)):
            m = re.match(r'(f\d_\d)(b?)_\d+_?\.(png|mp4)$', f)
            if m and (m.group(1) not in choix or m.group(2) >= choix[m.group(1)][0]): choix[m.group(1)] = (m.group(2), f)
        for k, (_, f) in choix.items():
            p = os.path.join(src, f)
            if f.endswith('.png'): im = Image.open(p).convert('RGB'); im.thumbnail((960, 960)); im.save(os.path.join(D, k + '.webp'), quality=80, method=6); ni += 1
            else:
                t = ['-t', str(COUPE[k])] if k in COUPE else []
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p, *t, '-an', '-vf', 'scale=832:-2', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(D, k + '.mp4')], check=True); nv += 1
print('images', ni, 'films', nv)
