"""English B2 · Essil (21/11) : images et films ComfyUI des dessins animés → essil/english/img/.
Usage : python3 docs/english-b2/build_images.py <dossier png (enb2/)> [<dossier mp4 (enb2v/)>]
- l<n>_<k>_0000x_.png → l<n>_<k>.webp (960 px de large) ; une version « b » (refaite) remplace la première ;
- l<n>_<k>_0000x_.mp4 → l<n>_<k>.mp4 (réencodé léger, sans son, en boucle dans la page) ;
  COUPE : films coupés avant la fin (les portes se ferment sur Essil, le casque se déforme, le cheval sort du cadre)."""
import sys, os, re, subprocess
from PIL import Image
D = os.path.join(os.path.dirname(__file__), '..', '..', 'essil', 'english', 'img'); os.makedirs(D, exist_ok=True)
src = sys.argv[1]; choix = {}
COUPE = { 'l4_0':1.9, 'l5_1':2.0, 'l5_2':2.0 }
for f in sorted(os.listdir(src)):
    m = re.match(r'l(\d+)_(\d)(b?)_\d+_\.png$', f)
    if m: k = f'l{m.group(1)}_{m.group(2)}'; (choix.__setitem__(k, f) if m.group(3) or k not in choix else None)
for k, f in choix.items():
    im = Image.open(os.path.join(src, f)).convert('RGB'); im.thumbnail((960, 960)); im.save(os.path.join(D, k + '.webp'), quality=80, method=6)
print('images', len(choix))
if len(sys.argv) > 2:
    n = 0
    for f in sorted(os.listdir(sys.argv[2])):
        m = re.match(r'l(\d+)_(\d)(b?)_\d+_?\.mp4$', f)
        if not m: continue
        out = os.path.join(D, f'l{m.group(1)}_{m.group(2)}.mp4')
        k = f'l{m.group(1)}_{m.group(2)}'; t = ['-t', str(COUPE[k])] if k in COUPE else []
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(sys.argv[2], f), *t, '-an', '-vf', 'scale=832:-2', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], check=True); n += 1
    print('films', n)
