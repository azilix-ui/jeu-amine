"""Tebni : les deux fonds (terrasse de Sidi Bou Saïd, ComfyUI FLUX.2 klein, graines 9851-9852, préfixe nuit/tb_).
python3 docs/tebni/build_images.py <dossier ComfyUI output/nuit>"""
import sys, os
from PIL import Image
src = sys.argv[1]; dst = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'tebni', 'img')
os.makedirs(dst, exist_ok=True)
Image.open(os.path.join(src, 'tb_fond_l_00001_.png')).convert('RGB').resize((1600, 914)).save(os.path.join(dst, 'fond-l.webp'), quality=78)
Image.open(os.path.join(src, 'tb_fond_p_00001_.png')).convert('RGB').resize((900, 1575)).save(os.path.join(dst, 'fond-p.webp'), quality=78)
print('ok')
