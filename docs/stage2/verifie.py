"""Stage 2 : vérifie qu'une carte se termine et qu'on n'y reste jamais coincé (demande du papa, 15/11 : « le jeu est coincé ? »).
On modélise les déplacements du héros case par case (marcher, tomber, sauter de 3 cases au plus, échelles, planches,
auvents qui font rebondir, caisses marchepieds, passages secrets, plateformes mobiles, tapis volant, sable mou qui fait sauter moins haut)
et on avance par étapes : ce qui est atteignable porte fermée → on trouve la clé / le levier / la pierre → on ouvre → …
À chaque étape, de CHAQUE case atteignable on doit pouvoir rejoindre ce qui débloque la suite (ou la sortie à la fin) :
sinon c'est un piège (on peut y tomber sans pouvoir revenir). On vérifie aussi que les 3 jasmins d'or sont atteignables.
Usage : from verifie import verifie ; verifie(lignes, nom) -> liste de problèmes (vide = tout va bien)."""
from collections import deque

SOL = set('#BIYXU')
ENNEMIS = set('grdlzmbsxanpthwy')
OBJ = set('CJOPSK')

def verifie(rows, nom='', plat_dist=4, train_dist=12, bavard=False):
    H, W = len(rows), len(rows[0])
    g = [list(r) for r in rows]
    pos = {}
    for y in range(H):
        for x in range(W):
            c = g[y][x]
            pos.setdefault(c, []).append((x, y))
    def at(x, y):
        if x < 0 or x >= W: return '#'
        if y < 0: return '.'
        if y >= H: return '.'
        return g[y][x]
    # surfaces des plateformes mobiles (on les considère partout sur leur trajet)
    surf = set()
    for (x, y) in pos.get('M', []):
        for k in range(x, x + 2 + plat_dist): surf.add((k, y))
    for (x, y) in pos.get('V', []):
        for k in range(0, plat_dist + 1):
            surf.add((x, y - k)); surf.add((x + 1, y - k))
    for (x, y) in pos.get('Q', []):
        for k in range(x, x + 5 + train_dist): surf.add((k, y))
    passages = sorted(pos.get('T', []))
    tapis = pos.get('A', [])
    caisses = pos.get('C', [])

    def solide(x, y, o):
        c = at(x, y)
        if c in SOL: return not (c == 'B' and o['B'])
        if c == 'G': return not o['G']
        if c == 'D': return not o['D']
        return False
    def libre(x, y, o):
        c = at(x, y)
        return not solide(x, y, o) and c != '^' and c != 'W'
    def debout(x, y, o):  # une case où le héros peut se tenir (pieds dans la case y)
        if not (0 <= x < W and 0 <= y < H): return False
        if not libre(x, y, o): return False
        if at(x, y) == 'H': return True
        b = at(x, y + 1)
        return solide(x, y + 1, o) or b == '=' or (b == 'H') or (x, y + 1) in surf
    def tete(x, y, o):  # place pour la tête (sinon il faut ramper : on autorise, le héros se baisse tout seul)
        return True
    def chute(x, y, o):  # tombe depuis (x, y) jusqu'à se poser ; None si eau / hors du monde
        while y < H:
            if not libre(x, y, o): return None
            if debout(x, y, o) and at(x, y) != 'H': return (x, y)
            if at(x, y) == 'H': return (x, y)
            y += 1
        return None
    def chemin(x, y, x2, y2, a, o):  # monte en x jusqu'à la ligne a, traverse, redescend en x2 (pieds et tête libres)
        for yy in range(a, y + 1):
            if not libre(x, yy, o): return False
        if not libre(x, a - 1, o) and a < y: return False
        s = 1 if x2 >= x else -1
        for xx in range(x, x2 + s, s):
            if not libre(xx, a, o): return False
            if a < min(y, y2) and not libre(xx, a - 1, o): return False
        for yy in range(a, y2 + 1):
            if not libre(x2, yy, o): return False
        return True
    def voisins(n, o):
        x, y = n
        out = []
        sous = at(x, y + 1)
        sable = sous == 'Y'
        # marcher / tomber
        for d in (-1, 1):
            if libre(x + d, y, o):
                if debout(x + d, y, o): out.append((x + d, y))
                else:
                    c = chute(x + d, y, o)
                    if c: out.append(c)
        # une tuile qui s'effondre : on passe à travers
        if sous == 'X':
            c = chute(x, y + 2, o)
            if c: out.append(c)
        # échelle
        if at(x, y) == 'H' or at(x, y + 1) == 'H':
            for d in (-1, 1):
                yy = y + d
                if 0 <= yy < H and (at(x, yy) == 'H' or (d == -1 and at(x, y) == 'H' and debout(x, yy, o)) or (d == 1 and libre(x, yy, o) and debout(x, yy, o))):
                    out.append((x, yy))
        # sauter
        if at(x, y) != 'H' or True:
            haut = 7 if sous == 'U' else 2 if sable else 3
            if haut == 3 and any(abs(cx - x) <= 6 and cy == y for (cx, cy) in caisses) and sous != 'U': haut = 4
            for dy in range(-haut, 8):
                if dy <= -3: rx = 2
                elif dy <= -2: rx = 3
                elif dy <= 0: rx = 4
                else: rx = min(7, 4 + dy // 2)
                if sous == 'U': rx = 4
                for dx in range(-rx, rx + 1):
                    if dx == 0 and dy == 0: continue
                    x2, y2 = x + dx, y + dy
                    if not debout(x2, y2, o): continue
                    top = min(y, y2) - (0 if dy < 0 else 0)
                    ok_ = False
                    for a in range(min(y, y2), max(min(y, y2) - 4, y - haut - 1), -1):
                        if a < 0: break
                        if chemin(x, y, x2, y2, a, o): ok_ = True; break
                    if ok_: out.append((x2, y2))
        # passages secrets
        if (x, y) in passages:
            i = passages.index((x, y)); j = i - 1 if i % 2 else i + 1
            if 0 <= j < len(passages): out.append(passages[j])
        return out
    def noeuds(o):
        return [(x, y) for y in range(H) for x in range(W) if debout(x, y, o)]
    def graphe(o):
        N = noeuds(o); G = {n: set(voisins(n, o)) for n in N}
        # le tapis volant : depuis sa case, on vole partout dans l'air relié (8 directions) et on se pose où l'on veut
        for (tx, ty) in tapis:
            if (tx, ty) not in G: continue
            vu = {(tx, ty)}; q = deque([(tx, ty)])
            while q:
                x, y = q.popleft()
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        p = (x + dx, y + dy)
                        if p in vu or not (0 <= p[0] < W and 1 <= p[1] < H): continue
                        if solide(p[0], p[1], o) or solide(p[0], p[1] - 1, o) or at(*p) == 'W': continue
                        vu.add(p); q.append(p)
            for p in vu:
                if p in G: G[(tx, ty)].add(p)
        return G
    def atteint(G, depart):
        vu = {depart}; q = deque([depart])
        while q:
            n = q.popleft()
            for m in G.get(n, ()):
                if m not in vu: vu.add(m); q.append(m)
        return vu
    def remonte(G, cibles):
        inv = {}
        for n, ms in G.items():
            for m in ms: inv.setdefault(m, set()).add(n)
        vu = set(c for c in cibles if c in G); q = deque(vu)
        while q:
            n = q.popleft()
            for m in inv.get(n, ()):
                if m not in vu: vu.add(m); q.append(m)
        return vu
    def pres(cases, R, dist=1):  # une case de R tout près d'une des cases
        return [r for r in R if any(abs(r[0] - c[0]) <= dist and abs(r[1] - c[1]) <= 1 for c in cases)]

    pb = []
    depart = pos['@'][0]; sortie = pos['E'][0]
    o = {'G': not pos.get('G'), 'D': not pos.get('D'), 'B': not pos.get('B')}
    etapes = []
    while True:
        G = graphe(o); R = atteint(G, depart)
        # qu'est-ce qui débloque la suite ?
        cles = []
        if not o['G'] and pos.get('L'):
            c = pres(pos['L'], R, 1)
            if c: cles.append(('G', pres(pos['L'], G.keys(), 1)))
        if not o['D'] and pos.get('K'):
            if any(k in R for k in pos['K']) or pres(pos['K'], R, 0): cles.append(('D', pres(pos['K'], G.keys(), 0)))
        if not o['B'] and pos.get('B'):
            pierres = [p for p in pos.get('P', []) + pos.get('C', []) + pos.get('S', []) if pres([p], R, 0)]
            proche = [r for r in R if any(abs(r[0] - b[0]) <= 5 and abs(r[1] - b[1]) <= 2 for b in pos['B'])]
            if pierres and proche: cles.append(('B', pres(pierres, G.keys(), 0)))
        etapes.append((dict(o), G, R, cles))
        if not cles: break
        for k, _ in cles: o[k] = True
    # la sortie et les jasmins
    Gf, Rf = etapes[-1][1], etapes[-1][2]
    if sortie not in Rf: pb.append(f'{nom} : la sortie {sortie} n’est pas atteignable')
    for j in pos.get('*', []):
        saut = lambda r: 2 if at(r[0], r[1] + 1) == 'Y' else 7 if at(r[0], r[1] + 1) == 'U' else 3
        if j not in Rf and not any(abs(j[0] - r[0]) <= 1 and 0 <= r[1] - j[1] <= saut(r) and all(libre(r[0], yy, etapes[-1][0]) for yy in range(j[1], r[1])) for r in Rf): pb.append(f'{nom} : le jasmin {j} n’est pas atteignable')
    # aucun piège : de chaque case atteignable, on rejoint ce qui débloque la suite (ou la sortie)
    for i, (oo, G, R, cles) in enumerate(etapes):
        cibles = [c for _, cs in cles for c in cs] if cles else [sortie]
        ok_ = remonte(G, cibles)
        coince = sorted(n for n in R if n not in ok_)
        if coince:
            pb.append(f'{nom} : étape {i} ({"".join(k for k, v in oo.items() if v) or "tout fermé"}) : {len(coince)} cases d’où l’on ne peut plus avancer, ex. {coince[:6]}')
    if bavard: print(nom, 'étapes', len(etapes), 'atteint', len(Rf))
    return pb
