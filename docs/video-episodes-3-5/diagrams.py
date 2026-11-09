"""Schémas exacts des épisodes 3 (piège du fermier), 4 (volume) et 5 (angles)."""
from PIL import Image, ImageDraw, ImageFont
import math, os
F = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
font = lambda s: ImageFont.truetype(F, s)
INK, BLUE, RED, GOLD = (31, 42, 68), (47, 111, 191), (214, 64, 52), (230, 150, 10)
GREEN, SAND, WATER = (222, 236, 205), (250, 226, 180), (190, 225, 245)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'diag'); os.makedirs(OUT, exist_ok=True)
def card(w=760, h=620):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((6, 10, w - 6, h - 2), 40, fill=(0, 0, 0, 60)); d.rounded_rectangle((0, 0, w - 12, h - 12), 40, fill=(255, 255, 255, 238))
    return im, d
def label(d, xy, txt, size=40, fill=INK, anchor='mm'):
    d.text(xy, txt, font=font(size), fill=fill, anchor=anchor, stroke_width=6, stroke_fill=(255, 255, 255))

# ---------- épisode 3 ----------
def pen(L, l, upto):
    """les enclos de 16 m de tour essayés jusqu'ici"""
    im, d = card(760, 640); k = 34; y = 70
    shapes = [(7, 1), (6, 2), (5, 3), (4, 4)][:upto]
    x = 50
    for (a, b) in shapes:
        last = (a, b) == (L, l)
        d.rectangle((x, y, x + b * k, y + a * k), fill=GREEN if not last else (205, 236, 190), outline=BLUE if last else (150, 170, 200), width=8 if last else 4)
        label(d, (x + b * k / 2, y + a * k + 34), f'{a}×{b}', size=30, fill=RED if last else (120, 130, 150))
        label(d, (x + b * k / 2, y + a * k + 72), f'{a * b} m²', size=34, fill=INK if last else (120, 130, 150))
        x += b * k + 50
    label(d, (374, 580), f'P = 2 × ({L} + {l}) = 16 m   ·   A = {L * l} m²', size=32, fill=BLUE)
    im.save(f'{OUT}/e3-pen{upto}.png')
def compare():
    im, d = card(760, 600)
    rows = [('7 × 1', 7), ('6 × 2', 12), ('5 × 3', 15), ('4 × 4', 16), ('cercle', 20.4)]
    for i, (n, a) in enumerate(rows):
        y = 80 + i * 92; w = a / 20.4 * 420
        label(d, (40, y + 22), n, size=34, fill=RED, anchor='lm')
        d.rounded_rectangle((200, y, 200 + w, y + 46), 12, fill=(120, 190, 120) if n != 'cercle' else (240, 170, 40))
        label(d, (210 + w + 10, y + 23), f'{a:g} m²'.replace('.', ','), size=32, anchor='lm')
    label(d, (374, 555), 'même tour : 16 m', size=34, fill=BLUE)
    im.save(f'{OUT}/e3-compare.png')
def circle3():
    im, d = card(); cx, cy, r = 374, 270, 190
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=GREEN, outline=BLUE, width=10)
    d.line((cx, cy, cx + r, cy), fill=RED, width=8); d.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=RED)
    label(d, (cx + r / 2, cy - 36), 'r ≈ 2,55 m', size=36, fill=RED)
    label(d, (374, 535), 'P = 16 m   ·   A = π × r² ≈ 20 m²', size=34, fill=BLUE)
    im.save(f'{OUT}/e3-cercle.png')

# ---------- épisode 4 ----------
def iso_box(d, ox, oy, nx, ny, nz, s, upto=None):
    """pavé en perspective cavalière : face avant nx × nz (couches colorées), dessus nx × ny, côté ny × nz"""
    cols = [(255, 190, 200), (255, 225, 160), (190, 230, 190), (180, 210, 245), (215, 195, 245)]
    nz = nz if upto is None else upto
    dx, dy = s * .55, -s * .4
    P = lambda x, y, z: (ox + x * s + y * dx, oy - z * s + y * dy)
    shade = lambda c, f: tuple(int(v * f) for v in c)
    for z in range(nz):
        c = cols[z % 5]
        d.polygon([P(0, 0, z), P(nx, 0, z), P(nx, 0, z + 1), P(0, 0, z + 1)], fill=c)
        d.polygon([P(nx, 0, z), P(nx, ny, z), P(nx, ny, z + 1), P(nx, 0, z + 1)], fill=shade(c, .82))
    ct = cols[(nz - 1) % 5]; d.polygon([P(0, 0, nz), P(nx, 0, nz), P(nx, ny, nz), P(0, ny, nz)], fill=shade(ct, 1.05) if max(ct) < 245 else ct)
    W = (255, 255, 255)
    for x in range(nx + 1): d.line([P(x, 0, 0), P(x, 0, nz), P(x, ny, nz)], fill=W, width=3)
    for z in range(nz + 1): d.line([P(0, 0, z), P(nx, 0, z), P(nx, ny, z)], fill=W, width=3)
    for y in range(ny + 1): d.line([P(0, y, nz), P(nx, y, nz), P(nx, y, 0)], fill=W, width=3)
    d.line([P(0, 0, 0), P(nx, 0, 0), P(nx, ny, 0), P(nx, ny, nz), P(0, ny, nz), P(0, 0, nz), P(0, 0, 0)], fill=(90, 110, 150), width=4)
    return P
def cubes(upto, total):
    im, d = card(760, 640); P = iso_box(d, 150, 470, 5, 3, 4, 64, upto=upto)
    label(d, ((P(0, 0, 0)[0] + P(5, 0, 0)[0]) / 2, P(0, 0, 0)[1] + 34), '5', size=40, fill=RED)
    label(d, ((P(5, 0, 0)[0] + P(5, 3, 0)[0]) / 2 + 26, (P(5, 0, 0)[1] + P(5, 3, 0)[1]) / 2 + 10), '3', size=40, fill=RED)
    if upto > 1: label(d, (P(0, 0, 2)[0] - 40, P(0, 0, 2)[1]), '4', size=40, fill=RED)
    label(d, (374, 585), '5 × 3 × 4 = 60 cm³' if total else f'1 couche = 5 × 3 = 15', size=40)
    im.save(f'{OUT}/e4-cubes{upto}{"t" if total else ""}.png')
def litre():
    im, d = card(760, 600)
    P = iso_box(d, 120, 440, 1, 1, 1, 220)
    label(d, (230, 475), '10 cm', size=32, fill=RED); label(d, (P(1, 0, 0)[0] + 60, P(1, 1, 0)[1] + 60), '10 cm', size=32, fill=RED, anchor='lm')
    label(d, (560, 200), '1 L', size=80, fill=BLUE); label(d, (560, 290), '= 1 000 cm³', size=36)
    label(d, (374, 545), '1 m³ = 1 000 L', size=44, fill=RED)
    im.save(f'{OUT}/e4-litre.png')
def cylinder(withnum):
    im, d = card(760, 640); cx, top, rx, ry, h = 374, 150, 230, 70, 230
    d.rectangle((cx - rx, top, cx + rx, top + h), fill=WATER); d.ellipse((cx - rx, top + h - ry, cx + rx, top + h + ry), fill=WATER, outline=BLUE, width=6)
    d.ellipse((cx - rx, top - ry, cx + rx, top + ry), fill=(160, 210, 240), outline=BLUE, width=6)
    d.line((cx - rx, top, cx - rx, top + h), fill=BLUE, width=6); d.line((cx + rx, top, cx + rx, top + h), fill=BLUE, width=6)
    d.line((cx, top, cx + rx, top), fill=RED, width=6); label(d, (cx + rx / 2, top - 30), 'r = 2 m' if withnum else 'rayon r', size=32, fill=RED)
    d.line((cx + rx + 30, top, cx + rx + 30, top + h), fill=RED, width=5); label(d, (cx + rx + 40, top + h / 2), 'h = 1 m' if withnum else 'h', size=32, fill=RED, anchor='lm')
    label(d, (374, 560), 'V = π × 2 × 2 × 1 ≈ 12,5 m³' if withnum else 'V = aire du fond × h', size=40)
    im.save(f'{OUT}/e4-cyl{"n" if withnum else ""}.png')

# ---------- épisode 5 ----------
def angle(deg, name, sub):
    im, d = card(760, 600); ox, oy, L = 260 if deg <= 100 else 380, 420, 300
    d.line((ox, oy, ox + L, oy), fill=BLUE, width=12)
    a = math.radians(deg); ex, ey = ox + L * math.cos(a), oy - L * math.sin(a)
    d.line((ox, oy, ex, ey), fill=BLUE, width=12)
    if deg == 90: d.rectangle((ox, oy - 50, ox + 50, oy), outline=RED, width=6)
    else: d.arc((ox - 80, oy - 80, ox + 80, oy + 80), -deg, 0, fill=RED, width=8)
    label(d, (ox + 120 * math.cos(a / 2), oy - 120 * math.sin(a / 2)), f'{deg}°', size=40, fill=RED)
    label(d, (374, 500), name, size=48); label(d, (374, 548), sub, size=30, fill=(110, 120, 140))
    im.save(f'{OUT}/e5-{deg}.png')
def triangle_sum(example):
    im, d = card(760, 640); A, B = (215, 420), (545, 420)
    # un vrai triangle de 60°, 70° et 50°
    tA, tB = math.radians(60), math.radians(70); base = B[0] - A[0]; t = base * math.sin(tB) / math.sin(math.pi - tA - tB)
    C = (A[0] + t * math.cos(tA), A[1] - t * math.sin(tA))
    d.polygon([A, B, C], fill=GREEN, outline=BLUE); d.line([A, B, C, A], fill=BLUE, width=10, joint='curve')
    cols = [RED, BLUE, GOLD]
    def ang(P, Q, R):
        v1 = (Q[0] - P[0], Q[1] - P[1]); v2 = (R[0] - P[0], R[1] - P[1])
        return math.degrees(math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / math.hypot(*v1) / math.hypot(*v2)))
    if example:
        names = ['60°', '70°', '50°']
    else:
        names = ['a', 'b', 'c']
    for P, Q, R, c, n in [(A, B, C, RED, names[0]), (B, C, A, (60, 140, 220), names[1]), (C, A, B, GOLD, names[2])]:
        a1 = math.degrees(math.atan2(-(Q[1] - P[1]), Q[0] - P[0])); a2 = math.degrees(math.atan2(-(R[1] - P[1]), R[0] - P[0]))
        lo, hi = sorted([-a1, -a2]);
        if hi - lo > 180: lo, hi = hi, lo + 360
        d.pieslice((P[0] - 60, P[1] - 60, P[0] + 60, P[1] + 60), lo, hi, fill=c)
        mid = math.radians((lo + hi) / 2); label(d, (P[0] + 95 * math.cos(mid), P[1] + 95 * math.sin(mid)), n, size=34, fill=c)
    # les trois coins côte à côte sur une droite
    y = 520; d.line((140, y, 610, y), fill=INK, width=6); cx = 375
    sa, sb = ang(A, B, C), ang(B, C, A); sc = 180 - sa - sb
    start = 180
    for c, s in [(RED, sa), (( 60, 140, 220), sb), (GOLD, sc)]:
        d.pieslice((cx - 90, y - 90, cx + 90, y + 90), start, start + s, fill=c, outline='white'); start += s
    label(d, (374, 600), '180 − 60 − 70 = 50°' if example else 'a + b + c = 180°', size=38)
    im.save(f'{OUT}/e5-tri{"x" if example else ""}.png')

for u in (1, 2, 3, 4): pen(*[(7, 1), (6, 2), (5, 3), (4, 4)][u - 1], u)
compare(); circle3()
cubes(1, False); cubes(4, True); litre(); cylinder(False); cylinder(True)
angle(90, 'ANGLE DROIT', 'le fil à plomb et le sol'); angle(50, 'ANGLE AIGU', 'plus petit que l’angle droit'); angle(130, 'ANGLE OBTUS', 'plus grand que l’angle droit'); angle(180, 'ANGLE PLAT', 'deux côtés alignés')
triangle_sum(False); triangle_sum(True)
print(sorted(os.listdir(OUT)))
