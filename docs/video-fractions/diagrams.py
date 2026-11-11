"""Schémas exacts des 3 épisodes « Les fractions » : gâteaux, jardins, bouteilles, et fractions écrites en vrai (barre horizontale)."""
from PIL import Image, ImageDraw, ImageFont
import math, os
F = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
font = lambda s: ImageFont.truetype(F, s)
INK, BLUE, RED, GOLD, GREY = (31, 42, 68), (47, 111, 191), (214, 64, 52), (230, 150, 10), (150, 160, 180)
CAKE, CREAM, PINK = (246, 205, 150), (255, 246, 228), (240, 140, 160)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'diag'); os.makedirs(OUT, exist_ok=True)
def card(w=760, h=600):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((6, 10, w - 6, h - 2), 40, fill=(0, 0, 0, 60)); d.rounded_rectangle((0, 0, w - 12, h - 12), 40, fill=(255, 255, 255, 240))
    return im, d
def text(d, xy, t, size=40, fill=INK, anchor='mm'):
    d.text(xy, t, font=font(size), fill=fill, anchor=anchor, stroke_width=5, stroke_fill=(255, 255, 255))
def frac(d, cx, cy, n, m, size=60, fill=INK, bar=None):
    """une fraction écrite comme au tableau : n au-dessus, m en dessous, une barre ; renvoie la largeur"""
    f = font(size); w = max(d.textlength(str(n), font=f), d.textlength(str(m), font=f)) + size * .35
    d.text((cx, cy - size * .08), str(n), font=f, fill=fill, anchor='md'); d.text((cx, cy + size * .12), str(m), font=f, fill=fill, anchor='ma')
    d.line((cx - w / 2, cy + 2, cx + w / 2, cy + 2), fill=bar or fill, width=max(4, size // 12)); return w
def expr(d, cx, cy, items, size=60, gap=None):
    """items : ('f', n, m, couleur) ou ('t', texte, couleur) ; centré sur cx"""
    gap = gap or size * .28; f = font(size); ws = []
    for it in items:
        if it[0] == 'f': ws.append(max(d.textlength(str(it[1]), font=f), d.textlength(str(it[2]), font=f)) + size * .35)
        else: ws.append(d.textlength(it[1], font=f))
    x = cx - (sum(ws) + gap * (len(ws) - 1)) / 2
    for it, w in zip(items, ws):
        if it[0] == 'f': frac(d, x + w / 2, cy, it[1], it[2], size, it[3] if len(it) > 3 else INK)
        else: d.text((x + w / 2, cy + size * .05), it[1], font=f, fill=it[2] if len(it) > 2 else INK, anchor='mm')
        x += w + gap
def cake(d, cx, cy, r, parts, take, col=PINK, sub=1, take_sub=None):
    """un gâteau vu de dessus coupé en 'parts' ; les 'take' premières parts colorées ; sub : chaque part recoupée"""
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=CREAM, outline=INK, width=5)
    N = parts * sub; tk = take * sub if take_sub is None else take_sub
    for i in range(tk):
        a0 = -90 + 360 * i / N; d.pieslice((cx - r, cy - r, cx + r, cy + r), a0, a0 + 360 / N, fill=col)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=INK, width=5)
    for i in range(N):
        a = math.radians(-90 + 360 * i / N); thick = 5 if (i % sub == 0) else 2
        d.line((cx, cy, cx + r * math.cos(a), cy + r * math.sin(a)), fill=INK if thick == 5 else (120, 120, 140), width=thick)
def bar(d, x, y, w, h, parts, cols, outline=INK, sub=1):
    """une bande coupée en 'parts' ; cols[i] = couleur de la part i (None = vide)"""
    for i in range(parts):
        x0 = x + w * i / parts; x1 = x + w * (i + 1) / parts
        d.rectangle((x0, y, x1, y + h), fill=cols[i] if i < len(cols) and cols[i] else (247, 244, 236))
    for i in range(1, parts): xx = x + w * i / parts; d.line((xx, y, xx, y + h), fill=INK if i % sub == 0 else (130, 130, 150), width=4 if i % sub == 0 else 2)
    d.rectangle((x, y, x + w, y + h), outline=outline, width=5)

# ---------- épisode 1 : le gâteau ----------
def e1():
    im, d = card(760, 520); cake(d, 230, 250, 190, 4, 1); expr(d, 560, 250, [('f', 1, 4, RED)], 120); text(d, (560, 420), '1 part sur 4', 34, BLUE); im.save(f'{OUT}/e1-quart.png')
    im, d = card(760, 520); frac(d, 230, 255, 1, 4, 170, INK)
    text(d, (560, 150), 'numérateur', 44, RED); text(d, (560, 200), 'les parts qu’on prend', 28, GREY)
    text(d, (560, 330), 'dénominateur', 44, BLUE); text(d, (560, 380), 'en combien on coupe', 28, GREY)
    d.line((310, 150, 410, 150), fill=RED, width=6); d.line((310, 340, 410, 330), fill=BLUE, width=6); im.save(f'{OUT}/e1-mots.png')
    im, d = card(760, 520); cake(d, 230, 250, 190, 4, 1, sub=2); expr(d, 560, 250, [('f', 2, 8, RED)], 120); text(d, (560, 420), '2 parts sur 8', 34, BLUE); im.save(f'{OUT}/e1-huit.png')
    im, d = card(760, 560); cake(d, 175, 200, 140, 4, 1); cake(d, 575, 200, 140, 4, 1, sub=2); expr(d, 375, 445, [('f', 1, 4, RED), ('t', '=', INK), ('f', 2, 8, RED)], 76); text(d, (375, 200), '=', 90, INK); im.save(f'{OUT}/e1-egal.png')
    im, d = card(760, 470); expr(d, 375, 210, [('f', 1, 4, INK), ('t', '=', INK), ('f', '1 × 2', '4 × 2', BLUE), ('t', '=', INK), ('f', 2, 8, RED)], 72); text(d, (375, 400), '× 2 en haut ET en bas', 34, BLUE); im.save(f'{OUT}/e1-fois.png')
    im, d = card(760, 600)
    for k, (n, m) in enumerate([(3, 4), (6, 8), (9, 12)]):
        bar(d, 200, 45 + k * 160, 500, 80, m, [PINK] * n, sub=m // 4); frac(d, 105, 85 + k * 160, n, m, 50, RED)
    text(d, (375, 548), 'même longueur coloriée !', 32, BLUE); im.save(f'{OUT}/e1-amplifier.png')
    im, d = card(760, 560); cake(d, 175, 195, 140, 8, 6, col=PINK); cake(d, 575, 195, 140, 4, 3); text(d, (375, 195), '=', 90, INK)
    expr(d, 375, 445, [('f', 6, 8, INK), ('t', '=', INK), ('f', '6 ÷ 2', '8 ÷ 2', BLUE), ('t', '=', INK), ('f', 3, 4, RED)], 62); im.save(f'{OUT}/e1-simplifier.png')

# ---------- épisode 2 : le jardin ----------
TOM, PIM, OIG, FEV = (226, 82, 64), (240, 150, 40), (170, 120, 200), (110, 180, 90)
def e2():
    im, d = card(760, 470); bar(d, 60, 70, 630, 150, 5, [TOM, PIM, PIM]);
    expr(d, 375, 340, [('f', 1, 5, TOM), ('t', '+', INK), ('f', 2, 5, PIM), ('t', '=', INK), ('f', 3, 5, RED)], 76); im.save(f'{OUT}/e2-cinquiemes.png')
    im, d = card(760, 470); bar(d, 60, 70, 630, 150, 5, [TOM, PIM, PIM])
    expr(d, 375, 330, [('f', '1 + 2', 5, INK), ('t', '=', INK), ('f', 3, 5, RED)], 76); text(d, (375, 435), 'le dénominateur ne bouge pas', 32, BLUE); im.save(f'{OUT}/e2-regle.png')
    im, d = card(760, 520); bar(d, 60, 50, 630, 110, 2, [OIG]); bar(d, 60, 200, 630, 110, 3, [FEV])
    expr(d, 375, 420, [('f', 1, 2, OIG), ('t', '+', INK), ('f', 1, 3, FEV), ('t', '= ?', INK)], 76); im.save(f'{OUT}/e2-question.png')
    im, d = card(760, 470); bar(d, 60, 50, 300, 100, 2, [OIG]); bar(d, 400, 50, 300, 100, 3, [FEV]); text(d, (210, 190), 'pas la même taille', 28, GREY); text(d, (550, 190), '', 28)
    expr(d, 375, 330, [('f', 1, 2, OIG), ('t', '+', INK), ('f', 1, 3, FEV), ('t', '≠', RED), ('f', 2, 5, GREY)], 76); text(d, (375, 435), 'on n’additionne pas les bas !', 32, RED); im.save(f'{OUT}/e2-piege.png')
    im, d = card(760, 520); bar(d, 60, 50, 630, 110, 6, [OIG] * 3, sub=3); bar(d, 60, 200, 630, 110, 6, [FEV] * 2, sub=2)
    text(d, (375, 360), '6 = 2 × 3', 52, BLUE); text(d, (375, 440), 'des sixièmes vont aux deux', 32, GREY); im.save(f'{OUT}/e2-six.png')
    im, d = card(760, 520); bar(d, 60, 50, 630, 110, 6, [OIG] * 3, sub=3); bar(d, 60, 200, 630, 110, 6, [FEV] * 2, sub=2)
    expr(d, 375, 410, [('f', 1, 2, OIG), ('t', '=', INK), ('f', 3, 6, OIG), ('t', '   ', INK), ('f', 1, 3, FEV), ('t', '=', INK), ('f', 2, 6, FEV)], 66); im.save(f'{OUT}/e2-amplifie.png')
    im, d = card(760, 470); bar(d, 60, 60, 630, 140, 6, [OIG] * 3 + [FEV] * 2)
    expr(d, 375, 320, [('f', 3, 6, OIG), ('t', '+', INK), ('f', 2, 6, FEV), ('t', '=', INK), ('f', 5, 6, RED)], 76); text(d, (375, 430), 'même dénominateur', 32, BLUE); im.save(f'{OUT}/e2-somme.png')
    im, d = card(760, 520); bar(d, 60, 50, 630, 110, 8, [TOM] * 2 + [PIM] * 3, sub=2); text(d, (375, 200), '8 = 2 × 4', 34, BLUE)
    expr(d, 375, 345, [('f', 1, 4, TOM), ('t', '+', INK), ('f', 3, 8, PIM), ('t', '=', INK), ('f', 2, 8, TOM), ('t', '+', INK), ('f', 3, 8, PIM), ('t', '=', INK), ('f', 5, 8, RED)], 60); im.save(f'{OUT}/e2-huitiemes.png')
    im, d = card(760, 520); bar(d, 60, 50, 630, 110, 6, [FEV] * 3 + [(200, 200, 205)] * 2, sub=1)
    for i in (3, 4): x0 = 60 + 630 * i / 6; d.line((x0 + 15, 65, x0 + 90, 145), fill=RED, width=6); d.line((x0 + 90, 65, x0 + 15, 145), fill=RED, width=6)
    expr(d, 375, 280, [('f', 5, 6, INK), ('t', '−', INK), ('f', 1, 3, INK), ('t', '=', INK), ('f', 5, 6, INK), ('t', '−', INK), ('f', 2, 6, INK)], 62)
    expr(d, 375, 430, [('t', '=', INK), ('f', 3, 6, FEV), ('t', '=', INK), ('f', 1, 2, RED)], 66); im.save(f'{OUT}/e2-moins.png')

# ---------- épisode 3 : la citronnade ----------
LEM, LEM2 = (250, 214, 70), (255, 236, 150)
def bottle(d, x, y, w, h, parts, full, sub=1, mark=0):
    """une bouteille vue comme une colonne : 'parts' étages, 'full' pleins (en bas) ; sub : recoupe verticale"""
    d.rounded_rectangle((x + w * .32, y - 40, x + w * .68, y + 6), 8, fill=(235, 240, 245), outline=INK, width=4)
    for i in range(parts):
        y1 = y + h - h * i / parts; y0 = y + h - h * (i + 1) / parts
        if i < full:
            for j in range(sub):
                x0 = x + w * j / sub; x1 = x + w * (j + 1) / sub
                d.rectangle((x0, y0, x1, y1), fill=LEM if (mark and j == 0) or not mark else LEM2)
        if i: d.line((x, y1, x + w, y1), fill=INK, width=4)
    for j in range(1, sub): d.line((x + w * j / sub, y, x + w * j / sub, y + h), fill=(110, 110, 130), width=3)
    d.rectangle((x, y, x + w, y + h), outline=INK, width=6)
def e3():
    im, d = card(760, 540); bottle(d, 90, 80, 170, 380, 4, 3); text(d, (175, 495), '1 litre', 28, GREY)
    expr(d, 520, 230, [('f', 1, 2, BLUE), ('t', 'de', GREY), ('f', 3, 4, GOLD)], 80); text(d, (520, 380), '= ?', 70, RED); im.save(f'{OUT}/e3-question.png')
    im, d = card(760, 470); expr(d, 375, 200, [('t', 'la moitié de', GREY), ('f', 3, 4, GOLD)], 64); expr(d, 375, 360, [('t', '=', INK), ('f', 1, 2, BLUE), ('t', '×', INK), ('f', 3, 4, GOLD)], 80); im.save(f'{OUT}/e3-fois.png')
    im, d = card(760, 520); bottle(d, 90, 90, 170, 380, 4, 3, sub=1); bottle(d, 460, 90, 170, 380, 4, 3, sub=2, mark=1)
    d.line((300, 280, 400, 280), fill=INK, width=8); d.polygon([(400, 262), (430, 280), (400, 298)], fill=INK); text(d, (700, 280), '3\nsur\n8', 34, RED); im.save(f'{OUT}/e3-dessin.png')
    im, d = card(760, 520); bottle(d, 90, 90, 170, 380, 4, 3, sub=2, mark=1); expr(d, 510, 270, [('f', 1, 2, BLUE), ('t', '×', INK), ('f', 3, 4, GOLD), ('t', '=', INK), ('f', 3, 8, RED)], 70); im.save(f'{OUT}/e3-resultat.png')
    im, d = card(760, 470); expr(d, 375, 200, [('f', 1, 2, BLUE), ('t', '×', INK), ('f', 3, 4, GOLD), ('t', '=', INK), ('f', '1 × 3', '2 × 4', INK), ('t', '=', INK), ('f', 3, 8, RED)], 66)
    text(d, (375, 360), 'haut × haut, bas × bas', 38, BLUE); im.save(f'{OUT}/e3-regle.png')
    im, d = card(760, 520)
    bar(d, 60, 60, 630, 120, 6, [LEM] * 6, sub=1); d.line((60 + 420, 40, 60 + 420, 200), fill=RED, width=5); text(d, (270, 225), '1 litre = 4 quarts', 28, GREY); text(d, (585, 225), '+ ½ L', 28, GREY)
    expr(d, 375, 370, [('f', 3, 2, GOLD), ('t', '÷', INK), ('f', 1, 4, BLUE), ('t', '= 6 verres', RED)], 74); im.save(f'{OUT}/e3-verres.png')
    im, d = card(760, 470); expr(d, 375, 190, [('t', '÷', INK), ('f', 1, 4, BLUE), ('t', '=', INK), ('t', '×', INK), ('f', 4, 1, RED)], 92); text(d, (375, 370), 'on retourne la fraction', 38, BLUE); im.save(f'{OUT}/e3-inverse.png')
    im, d = card(760, 470); expr(d, 375, 200, [('f', 3, 2, GOLD), ('t', '×', INK), ('f', 4, 1, RED), ('t', '=', INK), ('f', 12, 2, INK), ('t', '= 6', RED)], 76); text(d, (375, 370), '6 verres d’un quart de litre', 34, BLUE); im.save(f'{OUT}/e3-calcul.png')
e1(); e2(); e3()
