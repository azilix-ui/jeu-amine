"""Le grand cerf-volant d'Amine (22/11) : les images (cv/*.png) et les films (cvv/*.mp4) ComfyUI → amine/cerfvolant/img/.
Usage : python3 -I docs/cerfvolant/build.py <dossier contenant cv/ et cvv/>
Le choix des images : CHOIX (les versions refaites parce que la première ne collait pas à l'histoire)."""
import sys, os, subprocess
from PIL import Image
R = os.path.join(os.path.dirname(__file__), '..', '..'); D = os.path.join(R, 'amine', 'cerfvolant', 'img'); os.makedirs(D, exist_ok=True)
CHOIX = { 'c1':'c1', 'c2':'c2', 'c3':'c3', 'c4':'c4', 'c5':'c5b', 'c6':'c6b', 'c7':'c7e9921', 'c8':'c8' }
if len(sys.argv) > 2: CHOIX['c7'] = sys.argv[2]
base = sys.argv[1]; ni = nv = 0
for k, f in CHOIX.items():
    p = os.path.join(base, 'cv', f + '_00001_.png')
    if os.path.isfile(p): im = Image.open(p).convert('RGB'); im.thumbnail((1280, 1280)); im.save(os.path.join(D, k + '.webp'), quality=80, method=6); ni += 1
    v = os.path.join(base, 'cvv', k + '_00001_.mp4')
    if os.path.isfile(v): subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', v, '-an', '-vf', 'scale=832:-2', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(D, k + '.mp4')], check=True); nv += 1
print('images', ni, 'films', nv)
