"""Détourage d'un personnage sur fond vert (images ComfyUI). Le vert varie d'une image à l'autre (plus ou moins bleuté, ombre au sol) :
on enlève tout ce qui est « plutôt vert » et relié au bord de l'image, plus les trous franchement verts (entre un bras et le corps).
Un short turquoise ou une veste verte ne partent pas : ils ne sont pas assez verts, ou pas reliés au bord par du vert."""
from PIL import Image, ImageChops, ImageDraw, ImageFilter
def cut(path, fond='green'):
    im = Image.open(path).convert('RGB'); w, h = im.size; r, g, b = im.split()
    if fond == 'blue': g, b = b, g   # fond bleu (pour ce qui est vert, comme le cactus) : on échange les deux couleurs, puis on les remet
    def over(a, c, d):   # masque : a > c + d
        return ImageChops.subtract(a, c).point(lambda v: 255 if v > d else 0)
    loose = ImageChops.multiply(over(g, r, 30), over(g, b, 30)); strict = ImageChops.multiply(over(g, r, 45), over(g, b, 50))
    fl = loose.copy()
    for x in range(0, w, 8):
        for y in (0, h - 1):
            if fl.getpixel((x, y)) == 255: ImageDraw.floodfill(fl, (x, y), 128)
    for y in range(0, h, 8):
        for x in (0, w - 1):
            if fl.getpixel((x, y)) == 255: ImageDraw.floodfill(fl, (x, y), 128)
    bg = ImageChops.lighter(fl.point(lambda v: 255 if v == 128 else 0), strict)
    alpha = bg.point(lambda v: 255 - v).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.7))
    g2 = ImageChops.darker(g, ImageChops.add(ImageChops.lighter(r, b), Image.new('L', (w, h), 10)))   # retire le reflet vert
    edge = alpha.point(lambda v: 255 if v < 250 else 0); g = Image.composite(g2, g, edge)
    if fond == 'blue': g, b = b, g
    out = Image.merge('RGBA', (r, g, b, alpha)); return out
