"""Arabe (26/11) : les demandes ComfyUI des dessins animés de « Salma & Ghazala » (lues dans salma/arabe/lecons.js, champ p).
Images : __edit(['toile_169.png', 'houma_salma.png', 'ar_ghazala.png'], prompt, 9800 + 10 n + k, 'arg/a<n>_<k>')
Films  : __filmP('<image copiée dans input>', prompt film, 11800 + 10 n + k, 'argv/a<n>_<k>')
Usage : python3 docs/arabe-ghazala/scenes.py [--films]  → JSON à coller dans l'onglet ComfyUI."""
import re, json, os, sys
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
src = open(os.path.join(R, 'salma/arabe/lecons.js')).read()
out = []
for m in re.finditer(r"\{ n:(\d+), id:'\w+'.*?scenes:\[(.*?)\],\s*\n\s*mots:", src, re.S):
    n = int(m.group(1))
    ps = re.findall(r"\{ p:'((?:[^'\\]|\\.)*)'", m.group(2))
    for k, p in enumerate(ps):
        p = p.replace("\\'", "'")
        if '--films' in sys.argv:
            out.append([f'arg_a{n}_{k}.png', 'Animated cartoon, 3D family movie style. ' + p + ' Gentle natural movements, the girl and the baby gazelle move a little and smile, static camera, same characters all along.', 11800 + n * 10 + k, f'argv/a{n}_{k}'])
        else:
            out.append([['toile_169.png', 'houma_salma.png', 'ar_ghazala.png'],
                        'Cartoon still from a 3D animated family movie. The 8-year-old girl is exactly the person of image 2 (same face, hair, skin tone). '
                        'The baby gazelle is exactly the animal of image 3 (same fur, same red and white scarf). ' + p +
                        ' The girl appears only once and the baby gazelle appears only once. No text, no letters, no writing anywhere. Wide landscape cinematic shot, warm colours, high quality animation style. The first image only gives the picture size.',
                        9800 + n * 10 + k, f'arg/a{n}_{k}'])
print(json.dumps(out, ensure_ascii=False))
