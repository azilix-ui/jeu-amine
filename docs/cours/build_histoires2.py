"""Les dessins animés du 20/11 (après-midi) : Les Tables du Souk (mt_1..4) et My First English (e1_1..e5_3).
Images ComfyUI FLUX.2 klein (référence : houma_salma.png ; préfixes nuit2/ et nuit2b/ pour les deux refaites : mt_1, e4_2).
python3 docs/cours/build_histoires2.py <dossier nuit2> [<dossier nuit2b>]  ->  salma/ollie/img/h-<nom sans _>.webp"""
import sys, os, glob
from PIL import Image
R = os.path.join(os.path.dirname(__file__), '..', '..')
for d in sys.argv[1:]:
    for f in sorted(glob.glob(os.path.join(d, '*_00001_.png'))):
        n = os.path.basename(f)[:-len('_00001_.png')].replace('_', '')
        Image.open(f).convert('RGB').resize((1152, 658), Image.LANCZOS).save(os.path.join(R, 'salma', 'ollie', 'img', 'h-%s.webp' % n), quality=80)
print('ok')
