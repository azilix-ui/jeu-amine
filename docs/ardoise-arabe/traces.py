"""Ardoise arabe de Salma : fabrique les modèles de tracés (gestes) des lettres arabes.
Police Noto Naskh Arabic (OFL), mise en forme par HarfBuzz (formes isolée, début, milieu, fin, mots),
dessin de chaque glyphe en grand, squelette (ligne du milieu du trait), puis chemins dans le sens de l'écriture :
le corps d'abord (de droite à gauche, de haut en bas), les points et les petits signes ensuite.
Usage : python3 traces.py <naskh.ttf> <sortie lettres-ar.js> [planche.png]
Unités de sortie comme l'Ardoise d'Amine : 80 = ligne d'écriture, 15 = haut de l'alif.
"""
import sys, json, math
import numpy as np
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen, DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen
from PIL import Image, ImageDraw
from skimage.morphology import skeletonize
from skimage.measure import label, regionprops

TTF = sys.argv[1]; OUT = sys.argv[2]; PLANCHE = sys.argv[3] if len(sys.argv) > 3 else None
font_tt = TTFont(TTF); gs = font_tt.getGlyphSet()
face = hb.Face(hb.Blob.from_file_path(TTF)); hfont = hb.Font(face)
Z = '‍'
PX = 0.5          # pixels par unité de police pour le squelette
ALIF = None
DOT = 30

def shape(t):
    b = hb.Buffer(); b.add_str(t); b.guess_segment_properties(); hb.shape(hfont, b, {})
    out = []; x = 0
    for i, p in zip(b.glyph_infos, b.glyph_positions):
        n = hfont.glyph_to_string(i.codepoint)
        if n not in ('space', 'uni200D', 'zerowidthjoiner'): out.append((n, x + p.x_offset, p.y_offset, i.cluster))
        x += p.x_advance
    return out, x

def contours(name, dx, dy):
    """Les contours du glyphe (polygones) en unités de police."""
    rp0 = DecomposingRecordingPen(gs); gs[name].draw(rp0); rp = RecordingPen(); rp0.replay(TransformPen(rp, (1, 0, 0, 1, dx, dy)))
    polys = []; cur = []; last = None
    def bez(p0, ps):
        pts = [p0] + list(ps); n = 8; res = []
        for k in range(1, n + 1):
            t = k / n; q = pts[:]
            while len(q) > 1: q = [((1 - t) * a[0] + t * b[0], (1 - t) * a[1] + t * b[1]) for a, b in zip(q, q[1:])]
            res.append(q[0])
        return res
    for op, args in rp.value:
        if op == 'moveTo': cur = [args[0]]; last = args[0]
        elif op == 'lineTo': cur.append(args[0]); last = args[0]
        elif op == 'curveTo': cur += bez(last, args); last = args[-1]
        elif op == 'qCurveTo':
            # quadratiques en suite (TrueType) : points implicites au milieu
            pts = list(args); p0 = last
            for k in range(len(pts) - 1):
                c = pts[k]; e = pts[k + 1] if k == len(pts) - 2 else ((pts[k][0] + pts[k + 1][0]) / 2, (pts[k][1] + pts[k + 1][1]) / 2)
                cur += bez(p0, [c, e]); p0 = e
            last = p0
        elif op in ('closePath', 'endPath'):
            if len(cur) > 2: polys.append(cur)
            cur = []
    return polys

def rasterize(glyphs):
    """glyphs = [(nom, x, y)] → image binaire, origine et échelle."""
    allp = []
    per = []
    for n, x, y in glyphs:
        ps = contours(n, x, y); per.append(ps); allp += [pt for poly in ps for pt in poly]
    if not allp: return None
    xs = [p[0] for p in allp]; ys = [p[1] for p in allp]
    x0, x1, y0, y1 = min(xs) - 40, max(xs) + 40, min(ys) - 40, max(ys) + 40
    W, H = int((x1 - x0) * PX) + 1, int((y1 - y0) * PX) + 1
    im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
    # règle pair-impair : on dessine chaque contour en XOR
    acc = np.zeros((H, W), bool)
    for ps in per:
        for poly in ps:
            m = Image.new('1', (W, H), 0); ImageDraw.Draw(m).polygon([((p[0] - x0) * PX, (y1 - p[1]) * PX) for p in poly], fill=1)
            acc ^= np.array(m, bool)
    return acc, x0, y1

N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]

def graphe(sk):
    pts = set(zip(*np.nonzero(sk)))
    nb = {p: [(p[0] + a, p[1] + b) for a, b in N8 if (p[0] + a, p[1] + b) in pts] for p in pts}
    return nb

def chaines(nb):
    """Découpe le squelette en arêtes (suites de pixels) entre nœuds (bouts et carrefours)."""
    noeuds = {p for p, v in nb.items() if len(v) != 2}
    vus = set(); aretes = []
    def marche(a, b):
        ch = [a, b]; prev, cur = a, b
        while cur not in noeuds:
            nx = [q for q in nb[cur] if q != prev and (cur, q) not in vus]
            if not nx: break
            vus.add((cur, nx[0])); vus.add((nx[0], cur))
            prev, cur = cur, nx[0]; ch.append(cur)
        return ch
    for a in noeuds:
        for b in nb[a]:
            if (a, b) in vus: continue
            vus.add((a, b)); vus.add((b, a)); aretes.append(marche(a, b))
    # boucles sans nœud (anneau fermé)
    reste = [p for p in nb if p not in noeuds and not any((p, q) in vus for q in nb[p])]
    while reste:
        a = reste[0]; b = nb[a][0]; vus.add((a, b)); vus.add((b, a)); ch = [a, b]; prev, cur = a, b
        while True:
            nx = [q for q in nb[cur] if q != prev and (cur, q) not in vus]
            if not nx: break
            vus.add((cur, nx[0])); vus.add((nx[0], cur)); prev, cur = cur, nx[0]; ch.append(cur)
        aretes.append(ch); reste = [p for p in reste if not any((p, q) in vus for q in nb[p])]
    return aretes

def longueur(ch): return sum(math.dist(a, b) for a, b in zip(ch, ch[1:]))

def elague(aretes, mini):
    """Enlève les petites épines du squelette (bouts libres plus courts que l'épaisseur du trait)."""
    for _ in range(4):
        deg = {}
        for ch in aretes:
            for e in (ch[0], ch[-1]): deg[e] = deg.get(e, 0) + 1
        nouv = [ch for ch in aretes if not ((deg[ch[0]] == 1) != (deg[ch[-1]] == 1) and longueur(ch) < mini)]
        if len(nouv) == len(aretes): break
        aretes = fusion(nouv)
    return aretes

def fusion(aretes):
    """Recolle les arêtes qui se suivent à un nœud de degré 2."""
    chg = True
    while chg:
        chg = False; deg = {}
        for i, ch in enumerate(aretes):
            for e in (ch[0], ch[-1]): deg.setdefault(e, []).append(i)
        for n, l in deg.items():
            if len(l) == 2 and l[0] != l[1]:
                a, b = aretes[l[0]], aretes[l[1]]
                if a[-1] != n: a = a[::-1]
                if b[0] != n: b = b[::-1]
                aretes = [c for k, c in enumerate(aretes) if k not in l] + [a + b[1:]]; chg = True; break
    return aretes

def score_debut(p):   # au début d'un geste arabe : à droite et en haut (p = (ligne, colonne))
    return p[1] - 0.6 * p[0]

def parcours(aretes, ligne=None, dents=True):
    """Un chemin le plus long possible dans le graphe des arêtes (en repassant au besoin une petite arête),
    puis ce qui reste en gestes à part."""
    gestes = []; reste = list(aretes)
    while reste:
        adj = {}
        for i, ch in enumerate(reste):
            adj.setdefault(ch[0], []).append(i); adj.setdefault(ch[-1], []).append(i)
        bouts = [n for n, l in adj.items() if len(l) == 1] or list(adj)
        meilleur = None
        cands = sorted(bouts, key=score_debut, reverse=True)[:6]
        if ligne is not None and not gestes:   # la lettre est attachée à droite : on part du trait d'attache (le bout le plus à droite, sur la ligne)
            bas = [b for b in bouts if abs(b[0] - ligne) < 32]
            if bas: cands = [max(bas, key=lambda b: b[1])]
        for dep in cands:
            # recherche en profondeur du plus long chemin d'arêtes non répétées
            pile = [(dep, [], set())]
            while pile:
                n, ch, us = pile.pop()
                if meilleur is None or sum(longueur(reste[i]) for i in ch) > meilleur[0]: meilleur = (sum(longueur(reste[i]) for i in ch), dep, ch)
                for i in adj.get(n, []):
                    if i in us: continue
                    a = reste[i]; nx = a[-1] if a[0] == n else a[0]
                    if len(us) < 12: pile.append((nx, ch + [i], us | {i}))
        _, dep, idx = meilleur
        if not idx: break
        pts = []; n = dep
        for i in idx:
            a = reste[i]; a = a if a[0] == n else a[::-1]; pts += a if not pts else a[1:]; n = a[-1]
        if (ligne is None or len(gestes)) and score_debut(pts[-1]) > score_debut(pts[0]) + 2: pts = pts[::-1]
        reste = [c for k, c in enumerate(reste) if k not in idx]
        # les dents (س, ب au milieu…) : une petite branche qui part du chemin et finit en l'air ;
        # la plume y monte et redescend sans se lever, on l'insère donc à son carrefour (aller-retour)
        deg = {}
        for c in reste:
            for e in (c[0], c[-1]): deg[e] = deg.get(e, 0) + 1
        P = np.array(pts, float)
        def proche(q):
            d = np.hypot(P[:, 0] - q[0], P[:, 1] - q[1]); i = int(np.argmin(d)); return i if d[i] <= 3 else None
        ins = []
        for k, c in enumerate(reste):
            for a_, b_ in ((c[0], c[-1]), (c[-1], c[0])):
                i = proche(a_)
                if dents and i is not None and deg.get(b_, 0) == 1 and proche(b_) is None and longueur(c) < 190:
                    br = c if c[0] == a_ else c[::-1]; br = [pts[i]] + br; ins.append((i, br, k)); break
        for i, br, k in sorted(ins, key=lambda t: -t[0]):
            pts = pts[:i + 1] + br[1:] + br[::-1][1:] + pts[i + 1:]
        pris = {k for _, _, k in ins}
        reste = [c for k, c in enumerate(reste) if k not in pris]
        gestes.append(pts)
        reste = [c for c in reste if longueur(c) > 22]
    return gestes

def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, b = np.array(pts[0], float), np.array(pts[-1], float); ab = b - a; L = np.hypot(*ab) or 1
    d = [abs(ab[0] * (p[1] - a[1]) - ab[1] * (p[0] - a[0])) / L for p in pts[1:-1]]
    i = int(np.argmax(d)) + 1
    if d[i - 1] > eps: return rdp(pts[:i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]

def lisse(pts, n=3):
    if len(pts) < 5: return pts
    a = np.array(pts, float); out = a.copy()
    for _ in range(n): out[1:-1] = (out[:-2] + out[1:-1] * 2 + out[2:]) / 4
    return [tuple(p) for p in out]

def modele(texte, entree=False, dents=True):
    """Le modèle d'une lettre ou d'un mot : largeur et gestes (chemins SVG) en unités d'ardoise."""
    gl, adv = shape(texte)
    if not gl: return None
    r = rasterize([(n, x, y) for n, x, y, c in gl]); acc, x0, y1 = r
    lab = label(acc, connectivity=2); props = regionprops(lab)
    S = 65 / ALIF                     # unités de police → unités d'ardoise (alif = 65)
    to = lambda rc: (round((rc[1] / PX + x0) * S, 1), round(80 - (y1 - rc[0] / PX) * S, 1))
    epais = None
    corps, marques = [], []
    for p in props:   # petit comme un point ou un petit signe → après le corps
        h, w = p.bbox[2] - p.bbox[0], p.bbox[3] - p.bbox[1]
        (marques if max(h, w) < 2.6 * DOT else corps).append(p)
    if not corps: corps, marques = marques, []
    gc = max(p.area for p in corps)
    marques += [p for p in corps if p.area < gc * 0.15]; corps = [p for p in corps if p.area >= gc * 0.15]
    gestes = []
    # les corps (groupes de lettres liées) : de droite à gauche
    for p in sorted(corps, key=lambda p: -p.area):   # le grand corps d abord (une lettre seule)
        m = lab == p.label
        dist = np.sqrt(p.area / max(1, skeletonize(m).sum()))
        sk = skeletonize(m)
        ar = elague(fusion(chaines(graphe(sk))), mini=dist * 2.2)
        for g in parcours(ar, ligne=(y1 * PX) if entree else None, dents=dents):
            g = lisse(g); g = rdp(g, 0.8)
            gestes.append(('c', [to(q) for q in g], p.centroid))
    # les points et petits signes, après le corps, de droite à gauche
    for p in sorted(marques, key=lambda p: (-p.centroid[1])):
        h, w = p.bbox[2] - p.bbox[0], p.bbox[3] - p.bbox[1]
        if max(h, w) < 1.5 * DOT and max(h, w) < 1.9 * min(h, w):   # un point
            c = to(p.centroid); gestes.append(('p', [c, (c[0] + .1, c[1] + .1)], p.centroid))
        else:
            m = lab == p.label; sk = skeletonize(m)
            for g in parcours(elague(fusion(chaines(graphe(sk))), mini=3)):
                g = rdp(lisse(g), 0.8); gestes.append(('m', [to(q) for q in g], p.centroid))
    L_ = lambda g: sum(math.dist(a, b) for a, b in zip(g[1], g[1][1:]))
    gestes = [g for k, g in enumerate(gestes) if g[0] == 'p' or L_(g) > (5 if k == 0 or g[0] == 'm' else 14)]
    xs = [q[0] for _, g, _ in gestes for q in g]
    gx0 = min(xs) - 4; w = round(max(xs) - gx0 + 4, 1)
    def d(g): return 'M' + ' L'.join(f'{round(x - gx0, 1)} {y}' for x, y in g)
    return {'w': w, 's': [d(g) for _, g, _ in gestes], 'k': ''.join(t for t, _, _ in gestes)}

LETTRES = [  # id, lettre, nom en français, nom en arabe
 ('alif','ا','alif','أَلِف'), ('ba','ب','ba','بَاء'), ('ta','ت','ta','تَاء'), ('tha','ث','tha','ثَاء'), ('jim','ج','jim','جِيم'),
 ('ha','ح','ḥa','حَاء'), ('kha','خ','kha','خَاء'), ('dal','د','dal','دَال'), ('dhal','ذ','dhal','ذَال'), ('ra','ر','ra','رَاء'),
 ('zay','ز','zay','زَاي'), ('sin','س','sin','سِين'), ('shin','ش','chin','شِين'), ('sad','ص','ṣad','صَاد'), ('dad','ض','ḍad','ضَاد'),
 ('tta','ط','ṭa','طَاء'), ('zza','ظ','ẓa','ظَاء'), ('ayn','ع','ʿayn','عَيْن'), ('ghayn','غ','ghayn','غَيْن'), ('fa','ف','fa','فَاء'),
 ('qaf','ق','qaf','قَاف'), ('kaf','ك','kaf','كَاف'), ('lam','ل','lam','لَام'), ('mim','م','mim','مِيم'), ('nun','ن','noun','نُون'),
 ('hha','ه','ha','هَاء'), ('waw','و','waw','وَاو'), ('ya','ي','ya','يَاء')]
SEULES = {'alif','dal','dhal','ra','zay','waw'}   # ne s'attachent pas à la lettre suivante

def main():
    global ALIF, DOT
    rp = RecordingPen(); g, _ = shape('ا'); from fontTools.pens.boundsPen import BoundsPen
    bp = BoundsPen(gs); gs[g[0][0]].draw(bp); ALIF = bp.bounds[3] - max(0, bp.bounds[1])
    bp = BoundsPen(gs); gs['dotbelowar'].draw(bp); b = bp.bounds; DOT = max(b[2] - b[0], b[3] - b[1]) * PX
    out = {}
    for id_, ch, fr, ar in LETTRES:
        dn = id_ not in ('tta', 'zza')   # ط ظ : la barre se fait à part, après la boucle
        f = {'iso': modele(ch, dents=dn), 'fin': modele(Z + ch, True, dn)}
        if id_ not in SEULES: f['ini'] = modele(ch + Z, dents=dn); f['med'] = modele(Z + ch + Z, True, dn)
        out[id_] = {'l': ch, 'fr': fr, 'ar': ar, 'f': f}
    js = '/* Modèles des lettres arabes de l\'Ardoise de Salma (fabriqués par docs/ardoise-arabe/traces.py,\n   police Noto Naskh Arabic, OFL). 80 = ligne d\'écriture. s = gestes dans l\'ordre, k = c corps / p point / m petit signe. */\n'
    js += 'window.LETTRES_AR = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(OUT, 'w').write(js)
    if PLANCHE: planche(out)

def planche(out):
    from PIL import ImageFont
    cases = [(id_, k, f) for id_, v in out.items() for k, f in v['f'].items()]
    C, cols = 200, 12; rows = math.ceil(len(cases) / cols)
    im = Image.new('RGB', (C * cols, C * rows), '#244a2f'); d = ImageDraw.Draw(im)
    for n, (id_, k, f) in enumerate(cases):
        ox, oy = (n % cols) * C, (n // cols) * C; s = min(1.5, (C - 30) / max(f['w'], 1))
        d.line([(ox, oy + 80 * s * .9 + 20), (ox + C, oy + 80 * s * .9 + 20)], fill='#ff7878')
        for i, path in enumerate(f['s']):
            pts = [tuple(map(float, q.strip().split())) for q in path[1:].split('L')]
            P = [(ox + 10 + x * s, oy + 20 + y * s * .9) for x, y in pts]
            col = ['#ffffff', '#ffe066', '#8fd8ff', '#ff9ccf', '#9be89b'][i % 5]
            if len(P) > 1: d.line(P, fill=col, width=3)
            d.ellipse([P[0][0] - 5, P[0][1] - 5, P[0][0] + 5, P[0][1] + 5], fill='#3ddc84')
        d.text((ox + 4, oy + C - 16), f'{id_}.{k} {len(f["s"])}', fill='#cccccc')
    im.save(PLANCHE)

if __name__ == '__main__': main()
