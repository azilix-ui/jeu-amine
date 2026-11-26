"""Arabe (26/11) : images et films ComfyUI des dessins animés de « Salma & Ghazala ».
Usage : python3 docs/arabe-ghazala/build_images.py <dossier> (contient arg/ et/ou argv/)
- Ghazala : __t2i, graine 9703, arg/ghazala_00003_ → input/ar_ghazala.png ;
- arg/a<n>_<k>[b]_0000x_.png → salma/arabe/img/a<n>_<k>.webp (960 px) ; la version « b » (refaite) remplace la première ;
  images : __edit(['toile_169.png', 'houma_salma.png', 'ar_ghazala.png'], …) (docs/arabe-ghazala/scenes.py) ;
- arg/ardoise_*.png → salma/ardoise/ardoise-salma.webp (l'image d'accueil de l'Ardoise arabe) ;
- argv/a<n>_<k>[b]_*.mp4 → salma/arabe/img/a<n>_<k>.mp4 (films Wan 2.2, __filmP : 81 images, 832 × 480), réencodés légers et sans son."""
import sys, os, re, subprocess
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); OUT = os.path.join(R, 'salma/arabe/img'); os.makedirs(OUT, exist_ok=True)
COUPE = {}
SANS_FILM = {'a4_0'}   # 26/11 : un 2e renard apparaissait dans le film ; la scène reste en image
for sous in ['arg', 'argv']:
    src = os.path.join(sys.argv[1], sous)
    if not os.path.isdir(src): continue
    choix = {}
    for f in sorted(os.listdir(src)):
        if f.startswith('ardoise_') and f.endswith('.png'):
            im = Image.open(os.path.join(src, f)).convert('RGB'); im.thumbnail((1200, 1200)); im.save(os.path.join(R, 'salma/ardoise/ardoise-salma.webp'), quality=80, method=6); print('ardoise', f); continue
        m = re.match(r'(a\d+_\d)(b?)_\d+_?\.(png|mp4)$', f)
        if not m: continue
        if m.group(1) not in choix or m.group(2) >= choix[m.group(1)][0]: choix[m.group(1)] = (m.group(2), f)
    for k, (_, f) in sorted(choix.items()):
        p = os.path.join(src, f)
        if f.endswith('.png'):
            im = Image.open(p).convert('RGB'); im.thumbnail((960, 960)); im.save(os.path.join(OUT, k + '.webp'), quality=80, method=6)
        elif k in SANS_FILM: continue
        else:
            t = ['-t', str(COUPE[k])] if k in COUPE else []
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p, *t, '-an', '-vf', 'scale=832:-2', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(OUT, k + '.mp4')], check=True)
        print(k, f)
