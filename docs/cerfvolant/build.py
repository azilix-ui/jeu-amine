"""Le grand cerf-volant d'Amine (22/11) : les images (cv/*.png) et les films (cvv/*.mp4) ComfyUI → amine/cerfvolant/img/.
Usage : python3 -I docs/cerfvolant/build.py <dossier contenant cv/ et cvv/>
Le choix des images : CHOIX (les versions refaites parce que la première ne collait pas à l'histoire)."""
import sys, os, subprocess
from PIL import Image
R = os.path.join(os.path.dirname(__file__), '..', '..'); D = os.path.join(R, 'amine', 'cerfvolant', 'img'); os.makedirs(D, exist_ok=True)
CHOIX = { 'c1':'c1', 'c2':'c2', 'c3':'c3', 'c4':'c4', 'c5':'c5b', 'c6':'c6b', 'c7':'c7e9921', 'c8':'c8' }
ALLER_RETOUR = { 'c7': 1.0 }; UNE = { 'c5' }
if len(sys.argv) > 2: CHOIX['c7'] = sys.argv[2]
base = sys.argv[1]; ni = nv = 0
for k, f in CHOIX.items():
    p = os.path.join(base, 'cv', f + '_00001_.png')
    if os.path.isfile(p): im = Image.open(p).convert('RGB'); im.thumbnail((1280, 1280)); im.save(os.path.join(D, k + '.webp'), quality=80, method=6); ni += 1
    v = os.path.join(base, 'cvv', k + '_00001_.mp4')
    if os.path.isfile(v):
        # les films tournent en boucle : fondu fin → début (0,6 s) ; c7 : aller-retour de la 1re seconde (le cerf-volant sortait du cadre) ;
        # c5 : joué une seule fois (UNE dans la page), pas de fondu (les enfants courent).
        d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v]))
        if k in ALLER_RETOUR: fc = f'[0:v]trim=0:{ALLER_RETOUR[k]},setpts=PTS-STARTPTS,scale=832:-2,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[o]'
        elif k in UNE: fc = '[0:v]scale=832:-2[o]'
        else: fc = f'[0:v]scale=832:-2,split[a][b];[a]trim=0.6:{d},setpts=PTS-STARTPTS[m];[b]trim=0:0.6,setpts=PTS-STARTPTS[h];[m][h]xfade=transition=fade:duration=0.6:offset={d - 1.2:.3f}[o]'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', v, '-an', '-filter_complex', fc, '-map', '[o]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(D, k + '.mp4')], check=True); nv += 1
print('images', ni, 'films', nv)
