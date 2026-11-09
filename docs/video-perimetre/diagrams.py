"""Schémas exacts (nombres et formules écrits par nous, pas par l'IA) : cartes blanches arrondies 1080 px de large."""
from PIL import Image, ImageDraw, ImageFont
import math, os
F = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
font = lambda s: ImageFont.truetype(F, s)
INK, BLUE, RED, YEL = (31, 42, 68), (47, 111, 191), (214, 64, 52), (240, 170, 20)
OUT = os.path.join(os.path.dirname(__file__), 'diag'); os.makedirs(OUT, exist_ok=True)

def card(w=760, h=620):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((6, 10, w - 6, h - 2), 40, fill=(0, 0, 0, 60))
    d.rounded_rectangle((0, 0, w - 12, h - 12), 40, fill=(255, 255, 255, 238))
    return im, d

def label(d, xy, txt, size=46, fill=INK, anchor='mm'):
    d.text(xy, txt, font=font(size), fill=fill, anchor=anchor, stroke_width=6, stroke_fill=(255, 255, 255))

def square(all_sides):
    im, d = card(); x0, y0, s = 200, 110, 340
    d.rectangle((x0, y0, x0 + s, y0 + s), outline=BLUE, width=12, fill=(220, 238, 214))
    label(d, (x0 + s / 2, y0 - 50), '25 m', fill=RED)
    if all_sides:
        label(d, (x0 + s / 2, y0 + s + 50), '25 m', fill=RED); label(d, (x0 - 70, y0 + s / 2), '25 m', fill=RED); label(d, (x0 + s + 74, y0 + s / 2), '25 m', fill=RED)
    else:
        d.line((x0, y0 - 10, x0 + s, y0 - 10), fill=RED, width=8)
    im.save(f'{OUT}/carre{"4" if all_sides else "1"}.png')

def rect(total):
    im, d = card(); x0, y0, w, h = 170, 150, 400, 260
    d.rectangle((x0, y0, x0 + w, y0 + h), outline=BLUE, width=12, fill=(222, 236, 205))
    label(d, (x0 + w / 2, y0 - 50), '30 m', fill=RED); label(d, (x0 + w / 2, y0 + h + 50), '30 m', fill=RED)
    label(d, (x0 - 4, y0 + h / 2), '15 m', fill=RED, anchor='rm'); label(d, (x0 + w + 8, y0 + h / 2), '15 m', fill=RED, anchor='lm')
    if total: label(d, (370, 555), '30 + 15 + 30 + 15 = 90 m', size=40, fill=INK)
    im.save(f'{OUT}/rect{"t" if total else ""}.png')

def lshape(total):
    im, d = card(760, 700); k, ox, oy = 21, 170, 100   # 1 m = 15 px
    P = [(0, 0), (20, 0), (20, 8), (8, 8), (8, 18), (0, 18)]
    pts = [(ox + x * k, oy + y * k) for x, y in P]
    d.polygon(pts, fill=(230, 238, 210), outline=BLUE); d.line(pts + [pts[0]], fill=BLUE, width=12, joint='curve')
    L = ['20 m', '8 m', '12 m', '10 m', '8 m', '18 m']
    off = [(0, -46), (66, 0), (40, 44), (70, 30), (0, 46), (-74, 0)]
    for i in range(6):
        a, b = pts[i], pts[(i + 1) % 6]; label(d, ((a[0] + b[0]) / 2 + off[i][0], (a[1] + b[1]) / 2 + off[i][1]), L[i], size=40, fill=RED)
    if total: label(d, (374, 630), '20 + 8 + 12 + 10 + 8 + 18 = 76 m', size=36)
    im.save(f'{OUT}/L{"t" if total else ""}.png')

def circle(kind):
    im, d = card(); cx, cy, r = 374, 300, 190
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=BLUE, width=12, fill=(244, 230, 200))
    if kind in ('diam', 'formule'):
        d.line((cx - r, cy, cx + r, cy), fill=RED, width=10); d.ellipse((cx - 12, cy - 12, cx + 12, cy + 12), fill=RED)
        label(d, (cx, cy - 46), 'diamètre d' if kind == 'diam' else 'd = 10 m', fill=RED)
    if kind == 'formule': label(d, (cx, cy + r + 70), 'P = π × d ≈ 3,14 × 10 ≈ 31,4 m', size=36)
    im.save(f'{OUT}/cercle-{kind}.png')

def unroll():
    im, d = card(760, 520); x0, y, unit = 60, 300, 196   # le tour déroulé = 3,14 diamètres
    for i in range(3):
        d.rectangle((x0 + i * unit + 4, y - 22, x0 + (i + 1) * unit - 4, y + 22), fill=(214, 64, 52))
        label(d, (x0 + i * unit + unit / 2, y + 66), 'd', size=44, fill=RED)
    d.rectangle((x0 + 3 * unit + 4, y - 22, x0 + 3 * unit + int(.14 * unit), y + 22), fill=(240, 120, 90))
    label(d, (380, 120), 'le tour = 3,14 × d', size=50, fill=INK)
    label(d, (x0 + 3 * unit + 18, y + 66), '0,14', size=30, fill=RED)
    im.save(f'{OUT}/deroule.png')

square(False); square(True); rect(False); rect(True); lshape(False); lshape(True)
circle('diam'); circle('formule'); unroll()
print(sorted(os.listdir(OUT)))
