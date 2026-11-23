"""Atelier du Jasmin (23/11) : les fruits et la 2e tenue de la famille, à partir des images ComfyUI (FLUX.2 klein).
python3 docs/atelier/build_images.py <dossier des png ComfyUI (output/atel)>

Fabrication dans ComfyUI (aides de docs/comfy/aides.js) :
  - fruits au trait : __t2i("Children's coloring book page: <fruit>, … clean thick black outlines on a pure white background, no shading …", 7701…, 'atel/fr_<id>', 1024, 768)
    (dattes : 2e essai 'fr_dattes2', graine 7720, la 1re ressemblait à des olives) ;
  - modèle en couleur des fruits : __edit(['atel_fr_<id>.png'], 'The exact same drawing, now colored like a finished children's coloring book page …', 7951, 'atel/frcol_<id>') ;
  - famille, 2e tenue : __edit(['famcol_<nom>.png' (= m-c-<nom>-1)], 'The same person exactly as in the image … now <tenue>', 7801 / 7811-7812, 'atel/c2col_<nom>[_b]')
    puis le trait : __edit(['atel_c2col_<nom>.png'], 'The exact same drawing with all colours removed …', 7901, 'atel/c2trait_<nom>').
Le trait est seuillé à 150 (noir et blanc pur) ; les cadres rectangulaires que FLUX dessine parfois autour des fruits sont effacés
(lignes et colonnes presque entièrement noires près du bord), sur le trait comme sur le modèle."""
import sys, os, glob
import numpy as np
from PIL import Image

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'jeux', 'atelier')
FRUITS = ['grenade', 'dattes', 'orange', 'figue', 'pasteque', 'citron', 'raisin', 'olives', 'fraise', 'banane', 'pomme', 'panier']
FAMILLE = ['anis', 'imen', 'essil', 'salma', 'amine']

def dernier(motif):
    l = sorted(glob.glob(os.path.join(SRC, motif)))
    return l[-1] if l else None

def cadre(noir):
    """lignes / colonnes du bord (25 % extérieurs) noires sur plus de 55 % : un cadre, à effacer (avec 3 px autour)"""
    h, w = noir.shape; m = np.zeros_like(noir)
    for y in list(range(int(h * .25))) + list(range(int(h * .75), h)):
        if noir[y].mean() > .55: m[max(0, y - 3):y + 4] = True
    for x in list(range(int(w * .25))) + list(range(int(w * .75), w)):
        if noir[:, x].mean() > .55: m[:, max(0, x - 3):x + 4] = True
    return m

def trait(path, taille):
    g = np.asarray(Image.open(path).convert('L').resize(taille, Image.LANCZOS)); noir = g < 150
    m = cadre(noir); noir[m] = False
    return Image.fromarray(np.where(noir, 0, 255).astype(np.uint8)).convert('RGB'), m

def modele(path, taille, m, mt):
    im = np.asarray(Image.open(path).convert('RGB').resize(taille, Image.LANCZOS)).copy()
    if m is not None:
        mm = np.asarray(Image.fromarray(m.astype(np.uint8) * 255).resize(taille, Image.NEAREST)) > 0
        im[mm] = 255
    return Image.fromarray(im).resize(mt, Image.LANCZOS)

for k in FRUITS:
    t = dernier(f'fr_{k}2_*.png') or dernier(f'fr_{k}_*.png'); c = dernier(f'frcol2_{k}_*.png') or dernier(f'frcol_{k}_*.png')
    if not t: print('manque', k); continue
    im, m = trait(t, (1024, 768)); im.save(os.path.join(OUT, f'f-{k}.webp'), quality=90)
    if c: modele(c, (1024, 768), m, (800, 600)).save(os.path.join(OUT, f'm-f-{k}.webp'), quality=86)
    print('fruit', k, 'modèle' if c else 'SANS modèle')

for n in FAMILLE:
    col = dernier(f'c2col_{n}_b_*.png') or dernier(f'c2col_{n}_*.png'); t = dernier(f'c2trait_{n}_*.png')
    if not (col and t): print('manque', n); continue
    im, _ = trait(t, (768, 1024)); im.save(os.path.join(OUT, f'c-{n}-2.webp'), quality=90)
    Image.open(col).convert('RGB').resize((768, 1024), Image.LANCZOS).save(os.path.join(OUT, f'm-c-{n}-2.webp'), quality=86)
    print('famille', n)
