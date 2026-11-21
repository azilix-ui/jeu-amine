"""Anglais A1 (21/11) : images et films ComfyUI des dessins animés de « Salma & Pip » et « Amine & Kiko ».
Usage : python3 docs/english-a1/build_images.py <dossier> [<dossier>…]
Chaque dossier contient engs/ et engk/ (images) et/ou engsv/ et engkv/ (films Wan 2.2) :
- engs/p<n>_<k>[b|c]_0000x_.png → salma/pip/img/p<n>_<k>.webp (960 px) ; la dernière lettre (b, puis c) remplace les précédentes ;
- engk/k<n>_<k>…png → amine/kiko/img/k<n>_<k>.webp ;
- engsv/, engkv/ : les films, réencodés légers et sans son (COUPE : coupés avant une fin ratée)."""
import sys, os, re, subprocess
from PIL import Image
R = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = {'engs': 'salma/pip/img', 'engk': 'amine/kiko/img', 'engsv': 'salma/pip/img', 'engkv': 'amine/kiko/img'}
COUPE = { 'k1_0':1.5, 'k5_1':2.4, 'k9_2':1.9 }   # Amine sort du cadre, le ciel reste vide, Kiko sort du cadre
for d in OUT.values(): os.makedirs(os.path.join(R, d), exist_ok=True)
n_img = n_vid = 0
for base in sys.argv[1:]:
    for sous, dest in OUT.items():
        src = os.path.join(base, sous)
        if not os.path.isdir(src): continue
        choix = {}
        for f in sorted(os.listdir(src)):
            m = re.match(r'([pk]\d+_\d)([bc]?)_\d+_?\.(png|mp4)$', f)
            if not m: continue
            k = m.group(1)
            if k not in choix or m.group(2) >= choix[k][0]: choix[k] = (m.group(2), f)
        for k, (_, f) in choix.items():
            p = os.path.join(src, f)
            if f.endswith('.png'):
                im = Image.open(p).convert('RGB'); im.thumbnail((960, 960)); im.save(os.path.join(R, dest, k + '.webp'), quality=80, method=6); n_img += 1
            else:
                t = ['-t', str(COUPE[k])] if k in COUPE else []
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p, *t, '-an', '-vf', 'scale=832:-2', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(R, dest, k + '.mp4')], check=True); n_vid += 1
print('images', n_img, 'films', n_vid)
