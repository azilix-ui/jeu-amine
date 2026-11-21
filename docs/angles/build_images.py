"""Les angles, 5e (21/11) : images et films ComfyUI du dessin animé.
Usage : python3 -I docs/angles/build_images.py <dossier contenant ang/ et angv/>
- ang/a<n>_<k>[b]_0000x_.png → essil/angles/img/a<n>_<k>.webp (1280 px) ; la version « b » remplace la première ;
- angv/a<n>_<k>_0000x_.mp4 → essil/angles/img/a<n>_<k>.mp4 (réencodé léger, sans son)."""
import sys, os, re, subprocess
from PIL import Image
R = os.path.join(os.path.dirname(__file__), '..', '..'); D = os.path.join(R, 'essil', 'angles', 'img'); os.makedirs(D, exist_ok=True)
base = sys.argv[1]; n_i = n_v = 0
for sous, ext in (('ang', '.png'), ('angv', '.mp4')):
    src = os.path.join(base, sous)
    if not os.path.isdir(src): continue
    choix = {}
    for f in sorted(os.listdir(src)):
        m = re.match(r'(a\d_\d)([b-z]?)_\d+_?' + re.escape(ext) + '$', f)
        if m and (m.group(1) not in choix or m.group(2) >= choix[m.group(1)][0]): choix[m.group(1)] = (m.group(2), f)
    for k, (_, f) in choix.items():
        p = os.path.join(src, f)
        if ext == '.png':
            im = Image.open(p).convert('RGB'); im.thumbnail((1280, 1280)); im.save(os.path.join(D, k + '.webp'), quality=80, method=6); n_i += 1
        else:
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p, '-an', '-vf', 'scale=832:-2', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(D, k + '.mp4')], check=True); n_v += 1
print('images', n_i, 'films', n_v)
