"""Stage 2 : la bande du marchand (12 images de l'aller-retour du bras : levé → baissé → levé), tirée des 33 images Wan sur fond vert.
Le jeu fait avancer la bande avec la recharge du tir : le bras est levé au moment où l'orange part.
Usage : python3 docs/stage2/bande_marchand.py <dossier des anim_marchand_000NN_.png>"""
import sys, os
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'houma')); from detoure import cut
src = sys.argv[1]; ch = 180
idx = [round(k * 32 / 11) + 1 for k in range(12)]
fr = [cut(f'{src}/anim_marchand_{k:05d}_.png') for k in idx]
boxes = [f.getchannel('A').point(lambda v: 255 if v > 60 else 0).getbbox() for f in fr]
box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
k = ch / (box[3] - box[1]); cw = round((box[2] - box[0]) * k)
out = Image.new('RGBA', (cw * 12, ch))
for n, f in enumerate(fr): out.paste(f.crop(box).resize((cw, ch), Image.LANCZOS), (n * cw, 0))
out.save(os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'stage2', 'marchand-anim.webp'), quality=86, method=6); print('marchand', cw, ch, idx)
