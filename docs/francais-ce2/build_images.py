"""Français CE2 (24/11) : images et films ComfyUI des dessins animés de « Salma & Filou ».
Usage : python3 docs/francais-ce2/build_images.py <dossier> (contient frs/ et/ou frsv/)
- frs/f<n>_<k>[b]_0000x_.png → salma/filou/img/f<n>_<k>.webp (960 px) ; la version « b » (refaite : un personnage en double) remplace la première ;
  images : __edit(['toile_169.png', 'houma_salma.png', 'fr_filou.png'], …) ; Filou : __t2i, graine 9602, frs/filou_00002_ → input/fr_filou.png ;
- frsv/f<n>_<k>[b]_*.mp4 → salma/filou/img/f<n>_<k>.mp4 (films Wan 2.2, aide __filmP : 81 images, 832 × 480), réencodés légers et sans son."""
import sys, os, re, subprocess
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); OUT = os.path.join(R, 'salma/filou/img'); os.makedirs(OUT, exist_ok=True)
COUPE = {}
for sous in ['frs', 'frsv']:
    src = os.path.join(sys.argv[1], sous)
    if not os.path.isdir(src): continue
    choix = {}
    for f in sorted(os.listdir(src)):
        m = re.match(r'(f\d+_\d)(b?)_\d+_?\.(png|mp4)$', f)
        if not m: continue
        if m.group(1) not in choix or m.group(2) >= choix[m.group(1)][0]: choix[m.group(1)] = (m.group(2), f)
    for k, (_, f) in sorted(choix.items()):
        p = os.path.join(src, f)
        if f.endswith('.png'):
            im = Image.open(p).convert('RGB'); im.thumbnail((960, 960)); im.save(os.path.join(OUT, k + '.webp'), quality=80, method=6)
        else:
            t = ['-t', str(COUPE[k])] if k in COUPE else []
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p, *t, '-an', '-vf', 'scale=832:-2', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(OUT, k + '.mp4')], check=True)
        print(k, f)
