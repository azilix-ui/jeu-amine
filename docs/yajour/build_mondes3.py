"""Yajour, 22/11 : sols et panoramas des mondes Kairouan, Tozeur et Carthage (ComfyUI, dossier yaj3/).
Usage : python3 docs/yajour/build_mondes3.py <dossier contenant yaj3/>"""
import sys, os
from PIL import Image
src = os.path.join(sys.argv[1], 'yaj3'); out = os.path.join(os.path.dirname(__file__), '..', '..', 'jeux', 'yajour', 'img')
for n in ['kairouan', 'tozeur', 'carthage']:
    Image.open(os.path.join(src, 'sol_%s_00001_.png' % n)).convert('RGB').resize((512, 512), Image.LANCZOS).save(os.path.join(out, 'sol-' + n + '.webp'), quality=76)
    im = Image.open(os.path.join(src, 'pano_%s_00001_.png' % n)).convert('RGB'); im.thumbnail((1600, 1600)); im.save(os.path.join(out, 'pano-' + n + '.webp'), quality=70)
print('ok')
