"""Schémas exacts de l'épisode 2 (l'aire)."""
from PIL import Image, ImageDraw, ImageFont
import math, os
F = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
font = lambda s: ImageFont.truetype(F, s)
INK, BLUE, RED, GREEN, ORANGE = (31, 42, 68), (47, 111, 191), (214, 64, 52), (222, 236, 205), (250, 214, 160)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'diag'); os.makedirs(OUT, exist_ok=True)

def card(w=760, h=620):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((6, 10, w - 6, h - 2), 40, fill=(0, 0, 0, 60))
    d.rounded_rectangle((0, 0, w - 12, h - 12), 40, fill=(255, 255, 255, 238))
    return im, d
def label(d, xy, txt, size=44, fill=INK, anchor='mm'):
    d.text(xy, txt, font=font(size), fill=fill, anchor=anchor, stroke_width=6, stroke_fill=(255, 255, 255))

def grid(total):
    im, d = card(); k, x0, y0 = 72, 158, 120
    for i in range(6):
        for j in range(4):
            c = (205, 225, 245) if (i + j) % 2 else (255, 255, 255)
            d.rectangle((x0 + i * k, y0 + j * k, x0 + (i + 1) * k, y0 + (j + 1) * k), fill=c, outline=(150, 175, 210), width=2)
    d.rectangle((x0, y0, x0 + 6 * k, y0 + 4 * k), outline=BLUE, width=10)
    label(d, (x0 + 3 * k, y0 - 44), '6 m', fill=RED); label(d, (x0 - 14, y0 + 2 * k), '4 m', fill=RED, anchor='rm')
    label(d, (x0 + 6 * k + 50, y0 + k / 2), '1 m²', size=30, fill=BLUE)
    if total: label(d, (374, 545), '6 × 4 = 24 m²', size=50)
    im.save(f'{OUT}/grille{"t" if total else ""}.png')

def lshape(total):
    im, d = card(760, 680); k, ox, oy = 62, 130, 90
    P = [(0, 0), (8, 0), (8, 3), (3, 3), (3, 7), (0, 7)]
    pts = [(ox + x * k, oy + y * k) for x, y in P]
    d.polygon(pts, fill=GREEN)
    if total:
        d.rectangle((ox, oy, ox + 8 * k, oy + 3 * k), fill=(205, 225, 245)); d.rectangle((ox, oy + 3 * k, ox + 3 * k, oy + 7 * k), fill=ORANGE)
        d.line((ox, oy + 3 * k, ox + 3 * k, oy + 3 * k), fill=(240, 170, 20), width=8)
        label(d, (ox + 4 * k + 30, oy + 1.5 * k), '8 × 3 = 24 m²', size=34, fill=BLUE); label(d, (ox + 1.5 * k, oy + 5 * k), '3 × 4', size=32, fill=(190, 110, 20)); label(d, (ox + 1.5 * k, oy + 5.6 * k), '= 12 m²', size=30, fill=(190, 110, 20))
    d.line(pts + [pts[0], pts[1]], fill=BLUE, width=10, joint='curve')
    label(d, (ox + 4 * k, oy - 40), '8 m', fill=RED); label(d, (ox + 8 * k + 50, oy + 1.5 * k), '3 m', fill=RED)
    label(d, (ox - 14, oy + 3.5 * k), '7 m', fill=RED, anchor='rm'); label(d, (ox + 1.5 * k, oy + 7 * k + 40), '3 m', fill=RED)
    if total: label(d, (374, 620), '24 + 12 = 36 m²', size=48)
    im.save(f'{OUT}/L{"t" if total else ""}.png')

def triangle(total):
    im, d = card(); k, ox, oy = 110, 160, 110   # base 4 m, hauteur 3 m
    A, B, C = (ox, oy + 3 * k), (ox + 4 * k, oy + 3 * k), (ox, oy)
    d.polygon([A, B, C], fill=GREEN)
    for x in range(ox, ox + 4 * k, 24): d.line((x, oy, min(x + 12, ox + 4 * k), oy), fill=(240, 170, 20), width=6)
    for y in range(oy, oy + 3 * k, 24): d.line((ox + 4 * k, y, ox + 4 * k, min(y + 12, oy + 3 * k)), fill=(240, 170, 20), width=6)
    d.line([A, B, C, A], fill=BLUE, width=10, joint='curve')
    d.rectangle((ox, oy + 3 * k - 30, ox + 30, oy + 3 * k), outline=INK, width=3)
    label(d, (ox + 2 * k, oy + 3 * k + 44), 'base 4 m', fill=RED); label(d, (ox - 14, oy + 1.5 * k), '3 m', fill=RED, anchor='rm')
    label(d, (ox + 3.1 * k, oy + 0.9 * k), 'la moitié !', size=34, fill=(200, 140, 10))
    if total: label(d, (374, 560), '4 × 3 ÷ 2 = 6 m²', size=50)
    im.save(f'{OUT}/tri{"t" if total else ""}.png')

def disc(kind):
    im, d = card(760, 640)
    if kind == 'parts':
        cx, cy, r, n = 200, 250, 150, 12
        for i in range(n):
            a0, a1 = 360 / n * i - 90, 360 / n * (i + 1) - 90
            d.pieslice((cx - r, cy - r, cx + r, cy + r), a0, a1, fill=(214, 64, 52) if i % 2 else (240, 170, 20), outline='white', width=3)
        label(d, (cx, cy + r + 50), 'un disque', size=36)
        # les parts rangées tête-bêche
        x0, y0, w = 420, 175, 300; s = w / (n / 2); hgt = 150
        for i in range(n):
            up = i % 2 == 0; xa = x0 + (i // 2) * s + (0 if up else s / 2)
            pts = [(xa, y0 + hgt), (xa + s, y0 + hgt), (xa + s / 2, y0)] if up else [(xa, y0), (xa + s, y0), (xa + s / 2, y0 + hgt)]
            d.polygon(pts, fill=(214, 64, 52) if i % 2 else (240, 170, 20), outline='white')
        label(d, (x0 + w / 2, y0 + hgt + 50), 'presque un rectangle', size=32)
        label(d, (374, 560), 'longueur : π × r   ·   largeur : r', size=34, fill=BLUE)
    else:
        cx, cy, r = 374, 270, 190
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(250, 214, 160), outline=BLUE, width=10)
        d.line((cx, cy, cx + r, cy), fill=RED, width=8); d.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=RED)
        label(d, (cx + r / 2, cy - 40), 'r = 1 m' if kind == 'un' else 'rayon r', fill=RED)
        label(d, (374, 540), 'A = π × r × r ≈ 3,14 m²' if kind == 'un' else 'A = π × r × r = π × r²', size=40)
    im.save(f'{OUT}/disque-{kind}.png')

grid(False); grid(True); lshape(False); lshape(True); triangle(False); triangle(True); disc('parts'); disc('rayon'); disc('un')
print(sorted(os.listdir(OUT)))
