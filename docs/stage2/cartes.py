"""Stage 2 : fabrique les cartes des 10 mondes (jeux/stage2/cartes/m<n>.js) et les vérifie (verifie.py : on ne reste jamais coincé).
Légende des lettres : voir jeux/stage2/niveaux.js. Une case = 32 px ; 22 lignes ; le héros « debout en ligne y » a les pieds sur la ligne y+1.
Usage : python3 docs/stage2/cartes.py   (depuis la racine du dépôt)"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from verifie import verifie

H = 22
class Carte:
    def __init__(s, W): s.W = W; s.g = [['.'] * W for _ in range(H)]
    def rect(s, x0, x1, y0, y1, c='#'):
        for y in range(max(0, y0), min(H - 1, y1) + 1):
            for x in range(max(0, x0), min(s.W - 1, x1) + 1): s.g[y][x] = c
        return s
    def put(s, x, y, c): s.g[y][x] = c; return s
    def row(s, x0, x1, y, c): return s.rect(x0, x1, y, y, c)
    def col(s, x, y0, y1, c='H'): return s.rect(x, x, y0, y1, c)
    def lignes(s): return [''.join(r) for r in s.g]

# ------------------------------------------------------------------ monde 1 : les ruelles de la médina (Tunis)
def m1():
    c = Carte(172)
    c.rect(0, 171, 19, 21)
    c.put(2, 18, '@'); c.put(4, 18, '!'); c.row(8, 12, 16, '$'); c.rect(14, 14, 17, 18); c.put(16, 18, '!'); c.put(18, 18, 'J'); c.put(24, 18, 'z')
    c.put(27, 18, '!'); c.put(30, 18, 'C'); c.rect(34, 49, 15, 21); c.row(37, 41, 13, '$')
    c.put(46, 14, '!'); c.col(49, 9, 14); c.rect(50, 70, 9, 21); c.put(52, 8, 'c'); c.put(58, 8, 'g'); c.row(63, 66, 6, '='); c.put(65, 5, '*'); c.row(54, 57, 7, '$')
    c.rect(71, 73, 9, 18, '.'); c.rect(71, 73, 19, 21); c.put(72, 18, '^'); c.col(73, 9, 18)
    c.rect(74, 84, 9, 21); c.put(76, 8, 'c'); c.put(82, 8, 'z'); c.row(78, 80, 6, '$')
    c.rect(85, 90, 9, 18, '.'); c.row(86, 89, 18, '^'); c.col(90, 8, 18); c.col(85, 9, 18); c.put(86, 9, 'M'); c.row(86, 89, 6, '$')   # une échelle de chaque côté de la fosse aux cactus
    c.rect(91, 100, 8, 21); c.put(98, 7, 'l'); c.row(93, 95, 5, '$')
    c.col(101, 8, 18); c.put(102, 18, '!'); c.put(104, 18, 'O'); c.row(104, 105, 17, '='); c.row(106, 108, 15, '='); c.put(109, 13, 'L')
    c.rect(113, 113, 14, 18, 'G'); c.rect(113, 113, 0, 13); c.put(120, 18, 'd'); c.row(116, 119, 16, '$')
    c.put(125, 18, '!'); c.rect(128, 140, 12, 17); c.row(130, 138, 18, '$'); c.col(141, 12, 18); c.put(134, 11, '*'); c.row(129, 132, 11, '$')
    c.put(143, 18, 'c'); c.put(144, 18, 'P'); c.put(145, 18, '!')
    c.col(146, 12, 18); c.rect(147, 156, 12, 18); c.rect(147, 147, 16, 18, 'B'); c.rect(148, 155, 16, 18, '.'); c.put(152, 18, '*'); c.row(149, 151, 18, '$')
    c.put(153, 11, 'K'); c.put(150, 11, 'r'); c.col(157, 12, 18); c.put(159, 18, '!')   # 15/11 : l'échelle de droite (on pouvait descendre sans la clé et rester coincé devant la porte)
    c.rect(162, 162, 0, 14); c.rect(162, 162, 15, 18, 'D'); c.put(168, 18, 'E'); c.put(166, 13, 'm'); c.row(164, 166, 16, '$')
    return c

# ------------------------------------------------------------------ monde 2 : les toits de la médina
def m2():
    c = Carte(182)
    c.rect(0, 181, 19, 21)                       # la ruelle tout en bas
    bat = lambda x0, x1, top: c.rect(x0, x1, top, 18)
    bat(0, 14, 13); c.put(3, 12, '@'); c.put(6, 12, '!'); c.row(8, 11, 10, '$')
    c.col(17, 12, 18); bat(18, 30, 12); c.put(20, 11, 'c'); c.put(26, 11, 'z'); c.row(15, 17, 9, '$')
    c.row(31, 34, 12, 'X'); c.row(31, 35, 9, '$'); c.col(35, 13, 18) if False else None
    bat(36, 50, 13); c.col(36, 13, 13, '#'); c.col(35, 13, 18); c.put(38, 12, 'g'); c.put(28, 11, '!')
    c.put(45, 12, '!'); c.row(47, 48, 13, 'U'); c.col(51, 13, 18)
    bat(52, 62, 7); c.put(54, 6, 'c'); c.put(58, 3, '*'); c.put(60, 6, 'm'); c.put(61, 6, '!')
    c.col(65, 10, 18); bat(66, 80, 10); c.rect(70, 77, 15, 18, '.'); c.put(73, 18, 'T'); c.put(75, 18, '*'); c.row(71, 72, 18, '$'); c.put(76, 18, '$')
    c.put(68, 9, 'p'); c.put(70, 9, '!'); c.put(76, 9, '!'); c.put(78, 9, 'T')
    c.row(84, 85, 12, '='); c.row(89, 90, 11, '='); c.put(86, 18, 'z'); c.row(84, 90, 16, '$'); c.col(93, 10, 18)
    bat(94, 110, 10); c.put(95, 9, '!'); c.put(97, 8, 'L'); c.rect(101, 101, 6, 9, 'G'); c.rect(101, 101, 0, 5); c.put(104, 9, 'r'); c.row(105, 108, 7, '$')
    c.col(113, 8, 18); bat(114, 130, 8); c.row(118, 121, 8, 'X'); c.put(116, 7, 'c'); c.put(125, 7, 'p'); c.rect(118, 121, 9, 18, '.'); c.col(121, 9, 18) if False else None
    c.col(117, 8, 18) if False else None
    c.col(122, 8, 18)   # sous les tuiles qui tombent : on remonte par cette échelle
    c.col(133, 11, 18); bat(134, 150, 11); c.put(140, 4, 'm'); c.put(146, 10, 'g'); c.row(138, 140, 8, '='); c.put(139, 7, '*'); c.put(136, 10, '!')
    c.col(153, 12, 18); bat(154, 181, 12); c.row(156, 159, 9, '$'); c.put(160, 11, 'z'); c.row(165, 166, 12, 'U'); c.row(166, 170, 5, '$'); c.put(176, 11, 'E')
    return c

# ------------------------------------------------------------------ monde 3 : le TGM et le métro léger
def m3():
    c = Carte(198)
    c.rect(0, 197, 19, 21)
    c.rect(0, 40, 15, 18); c.put(3, 14, '@'); c.put(8, 14, '!'); c.put(12, 14, 'S'); c.put(20, 14, 'c'); c.put(30, 14, 't'); c.row(14, 18, 11, '$')
    c.col(41, 15, 18); c.put(41, 15, 'Q'); c.col(58, 15, 18); c.put(48, 18, 'd'); c.row(46, 52, 17, '$')      # la voie : le train va et vient
    c.rect(59, 90, 15, 18); c.put(61, 14, 'c'); c.put(66, 14, 'z'); c.row(70, 74, 12, '='); c.put(72, 11, '*'); c.put(80, 14, 't'); c.put(25, 14, '!'); c.put(63, 14, 'J')
    c.col(91, 15, 18); c.put(93, 18, '!'); c.put(95, 18, 'N'); c.put(98, 18, '!')                            # la route du bord de mer : le scooter
    for x in (106, 118, 131, 142): c.put(x, 18, '^')
    c.row(100, 104, 16, '$'); c.row(110, 115, 15, '$'); c.put(118, 15, '*'); c.row(124, 128, 16, '$'); c.put(136, 18, 'd'); c.put(125, 13, 'm'); c.row(145, 149, 16, '$')
    c.put(148, 18, 'P'); c.col(151, 15, 18); c.rect(152, 165, 15, 18); c.rect(152, 152, 16, 18, 'B'); c.rect(153, 158, 16, 18, '.'); c.put(156, 18, '*'); c.row(154, 155, 18, '$'); c.put(157, 18, '$')
    c.put(160, 14, 'c'); c.put(163, 14, '!'); c.put(166, 15, 'Q'); c.col(183, 15, 18); c.put(172, 18, 'd')
    c.rect(184, 197, 15, 18); c.put(186, 14, 't'); c.put(193, 14, 'E')
    return c

# ------------------------------------------------------------------ monde 4 : les citernes de Carthage (dans le noir)
def m4():
    c = Carte(172)
    c.rect(0, 171, 0, 3)                          # la voûte
    c.rect(0, 171, 17, 21)                        # le sol de pierre
    pool = lambda x0, x1: c.rect(x0, x1, 17, 18, 'W')
    c.put(2, 16, '@'); c.put(4, 16, '!'); c.put(8, 16, 'c'); c.row(12, 22, 17, 'I'); c.put(11, 16, '!'); c.row(14, 20, 14, '$')
    pool(24, 26); c.put(35, 16, 'a'); c.put(40, 16, '!')
    pool(41, 48); c.put(42, 17, 'M'); c.put(52, 4, 'b'); c.put(50, 16, 'c')
    c.col(56, 11, 16); c.row(57, 66, 11, '='); c.put(64, 10, '*'); c.row(58, 62, 9, '$')
    c.row(60, 68, 17, 'I'); pool(71, 73); c.put(76, 16, '!'); c.put(80, 4, 'b'); c.put(92, 4, 'b'); c.put(86, 16, 'a'); c.row(82, 88, 14, '$')
    pool(101, 110); c.row(103, 104, 15, '='); c.row(107, 108, 15, '=')
    c.put(114, 16, 'c'); c.put(120, 16, 'a'); c.put(125, 4, 'b'); c.put(128, 16, 'P'); c.put(130, 16, '!')
    c.col(140, 12, 16); c.rect(141, 149, 12, 12); c.rect(141, 141, 13, 16, 'B'); c.rect(149, 149, 13, 16); c.col(150, 12, 16); c.put(145, 16, '*'); c.row(143, 147, 16, '$') if False else None
    c.row(143, 144, 16, '$'); c.put(147, 16, '$'); c.row(142, 147, 10, '$')
    pool(155, 157); c.put(162, 16, 'a'); c.put(166, 16, 'E')
    return c

# ------------------------------------------------------------------ monde 5 : les catacombes de Sousse (trois galeries, dans le noir)
def m5():
    c = Carte(172)
    c.rect(0, 171, 0, 21)
    gal = lambda x0, x1, y0, y1: c.rect(x0, x1, y0, y1, '.')
    gal(1, 60, 4, 7); gal(64, 80, 4, 7); gal(30, 120, 10, 13); gal(1, 170, 16, 19)
    c.put(3, 7, '@'); c.put(6, 7, '!'); c.put(10, 7, 'c')
    for x in (14, 22, 30, 48): c.put(x, 4, 'R')
    c.put(26, 7, 'a'); c.row(16, 20, 6, '$'); c.put(58, 7, '*'); c.put(52, 7, '!')
    c.col(40, 8, 13)                                            # galerie 1 → galerie 2
    c.row(50, 55, 14, 'X'); c.rect(50, 55, 15, 15, '.'); c.put(47, 13, '!'); c.put(60, 13, 'c'); c.put(66, 13, 's'); c.put(70, 13, 'T'); c.put(72, 13, '!')
    c.put(66, 7, 'T'); c.put(74, 7, 'K'); c.put(78, 7, '*'); c.row(69, 72, 6, '$')   # la chambre secrète : la clé et un jasmin
    for x in (84, 96): c.put(x, 10, 'R')
    c.put(100, 13, 'a'); c.row(88, 92, 12, '$')
    c.col(45, 14, 19); c.col(90, 14, 19); c.col(118, 14, 19)   # galerie 3 → galerie 2
    c.put(20, 19, 'a'); c.put(30, 16, 'b'); c.put(60, 19, 's'); c.put(75, 16, 'b'); c.put(100, 19, 'P'); c.put(98, 19, 'c')
    c.rect(110, 110, 16, 19, 'B'); c.put(113, 19, '*'); c.row(111, 112, 19, '$')
    c.put(130, 19, 'a'); c.put(135, 16, 'b'); c.put(140, 19, 'c'); c.put(144, 19, '!'); c.rect(150, 150, 16, 19, 'D'); c.put(158, 19, 's'); c.put(165, 19, 'E')
    for x in (126, 146): c.put(x, 16, 'R')
    return c

# ------------------------------------------------------------------ monde 6 : le port de La Goulette (boss : le Crabe géant)
def m6():
    c = Carte(164)
    c.rect(0, 163, 18, 21, 'W')                   # la mer
    quai = lambda x0, x1, top=15: c.rect(x0, x1, top, 21)
    quai(0, 25); c.put(2, 14, '@'); c.put(5, 14, '!'); c.row(14, 22, 15, 'I'); c.put(12, 14, '!'); c.put(20, 14, 'x'); c.row(8, 11, 12, '$')
    c.put(26, 17, 'M'); c.row(28, 31, 14, '$')
    quai(35, 60); c.put(38, 14, 'c'); c.put(40, 14, '!'); c.put(45, 14, 'x'); c.put(55, 14, 'z'); c.put(50, 8, 'm'); c.col(51, 11, 14); c.row(52, 54, 11, '='); c.put(53, 10, '*')
    c.put(61, 17, 'M'); c.put(70, 17, 'M'); c.put(68, 9, 'm'); c.row(63, 66, 14, '$'); c.row(71, 74, 14, '$')
    quai(79, 160); c.put(82, 14, 'c'); c.put(86, 14, 'x'); c.row(90, 100, 15, 'I'); c.put(96, 14, 'z'); c.put(98, 14, 'x'); c.put(105, 14, 'T'); c.put(103, 14, '!'); c.row(92, 97, 12, '$')
    c.rect(114, 119, 12, 21); c.put(116, 11, 'T'); c.put(117, 11, '*'); c.put(115, 11, '$')       # l'îlot : seulement par le passage secret
    c.rect(114, 119, 15, 17, '#')
    c.put(122, 14, '!'); c.rect(124, 124, 12, 14); c.put(126, 14, 'c')                            # l'arène du Crabe géant
    for x in (128, 132, 136): c.put(x, 14, 'J')
    c.put(130, 14, 'P'); c.row(140, 143, 12, '='); c.put(141, 11, '*'); c.put(150, 14, 'w'); c.rect(161, 163, 3, 14); c.put(158, 14, 'E')
    return c

# ------------------------------------------------------------------ monde 7 : le village de Chenini (en terrasses)
def m7():
    c = Carte(178)
    c.rect(0, 177, 19, 21)
    ter = lambda x0, x1, top: c.rect(x0, x1, top, 21)
    c.put(2, 18, '@'); c.put(5, 18, '!'); c.put(14, 18, 's'); c.row(8, 12, 16, '$'); c.put(20, 18, 'c')
    c.col(30, 15, 18); ter(31, 60, 15); c.put(36, 14, '!'); c.put(50, 14, 'h'); c.put(42, 8, 'm'); c.row(40, 46, 12, '$')
    c.col(60, 11, 14); ter(61, 84, 11); c.rect(70, 84, 0, 3); c.put(75, 4, 'R'); c.put(81, 4, 'R'); c.put(64, 10, 'c'); c.put(68, 10, '!'); c.put(78, 10, 's')
    c.row(85, 88, 11, 'X'); c.rect(85, 89, 12, 18, '.'); c.col(89, 11, 18) if False else None; c.col(90, 11, 18) if False else None
    ter(90, 100, 11); c.col(85, 12, 18) if False else None
    c.put(87, 18, '*'); c.col(89, 11, 18)   # sous le pont qui s'effondre : un jasmin, et l'échelle pour remonter
    c.put(83, 10, '!')
    c.col(100, 7, 10); ter(101, 130, 7); c.put(104, 6, 'c'); c.put(112, 6, 'h'); c.put(115, 2, 'm'); c.put(120, 4, '*'); c.row(106, 110, 4, '$'); c.put(108, 6, '!')
    c.rect(125, 129, 8, 10, '.'); c.rect(130, 130, 8, 10, 'B'); c.put(127, 10, '*'); c.row(125, 126, 10, '$')    # le grenier secret (ghorfa)
    ter(131, 150, 11); c.col(131, 7, 10); c.put(135, 10, 'P'); c.put(142, 10, 's'); c.rect(138, 150, 0, 2); c.put(144, 3, 'R')
    c.col(151, 11, 18); ter(152, 177, 15); c.put(158, 14, 'c'); c.put(164, 14, 'h'); c.put(174, 14, 'E'); c.row(160, 163, 11, '$')
    return c

# ------------------------------------------------------------------ monde 8 : le Sahara de Douz (sable mou, tapis volant)
def m8():
    c = Carte(172)
    c.rect(0, 40, 17, 21); c.row(10, 35, 17, 'Y'); c.put(2, 16, '@'); c.put(6, 16, '!'); c.put(16, 16, '!'); c.put(20, 16, 'n'); c.put(30, 16, 'n'); c.put(38, 14, '*'); c.row(24, 28, 14, '$')
    c.rect(41, 48, 15, 21); c.row(41, 48, 15, 'Y'); c.rect(49, 56, 13, 21); c.row(49, 56, 13, 'Y'); c.put(52, 12, 's')
    c.rect(57, 62, 13, 21); c.put(58, 12, '!'); c.put(60, 12, 'A'); c.put(57, 12, 'c')
    c.rect(63, 120, 20, 21); c.col(63, 13, 19); c.col(120, 13, 19)                     # le canyon (on peut aussi le traverser à pied)
    c.rect(80, 82, 9, 21); c.col(79, 9, 19); c.col(83, 9, 19); c.rect(100, 102, 9, 21); c.col(99, 9, 19); c.col(103, 9, 19)
    c.put(101, 8, '*'); c.row(86, 96, 8, '$'); c.put(85, 5, 'm'); c.put(105, 5, 'm'); c.put(70, 19, 's'); c.put(92, 19, 'n'); c.put(110, 19, 's'); c.row(68, 74, 11, '$')
    c.rect(121, 140, 13, 21); c.row(121, 140, 13, 'Y'); c.put(124, 12, '!'); c.put(128, 12, 'n'); c.put(134, 12, 's'); c.put(138, 12, '!')
    c.rect(141, 171, 15, 21); c.put(143, 14, 'c'); c.put(147, 14, 'n'); c.col(149, 10, 14); c.row(150, 152, 10, '='); c.put(151, 9, '*'); c.put(160, 14, 's'); c.put(156, 8, 'm'); c.put(168, 14, 'E')
    return c

# ------------------------------------------------------------------ monde 9 : les souks de Kairouan
def m9():
    c = Carte(142)
    c.rect(0, 141, 0, 2); c.rect(0, 141, 19, 21)
    c.put(2, 18, '@'); c.put(10, 18, '!'); c.row(14, 15, 19, 'U'); c.row(12, 28, 12, '='); c.put(25, 11, '*'); c.row(16, 22, 9, '$')
    c.put(32, 18, '!'); c.row(34, 44, 19, 'I'); c.put(40, 18, 'z'); c.put(47, 18, '!'); c.put(50, 18, 'p'); c.put(38, 18, 'c')
    c.put(55, 18, '!'); c.row(57, 58, 19, 'U'); c.put(60, 18, 'T'); c.rect(61, 75, 12, 18); c.put(68, 11, 'g'); c.row(64, 72, 9, '$'); c.put(77, 18, 'T')
    c.put(80, 18, 'c'); c.put(88, 18, 'z'); c.put(94, 18, '!'); c.put(95, 18, 'l'); c.row(98, 99, 19, 'U'); c.row(96, 100, 12, '='); c.row(101, 102, 12, 'U'); c.row(103, 107, 6, '='); c.put(105, 5, 'K'); c.row(100, 104, 3, '$') if False else None
    c.put(105, 18, 'g'); c.put(110, 18, 'p'); c.put(116, 18, 'c'); c.rect(125, 125, 3, 14); c.rect(125, 125, 15, 18, 'D')
    c.row(128, 129, 19, 'U'); c.row(130, 134, 12, '='); c.put(132, 11, '*'); c.put(137, 18, 'E')
    return c

# ------------------------------------------------------------------ monde 10 : le palais du Bardo (boss : le Scorpion d'Or)
def m10():
    c = Carte(134)
    c.rect(0, 133, 0, 2); c.rect(0, 133, 19, 21)
    c.put(2, 18, '@'); c.put(5, 18, '!'); c.row(8, 38, 19, 'I'); c.put(20, 18, 'g'); c.put(35, 18, 'r'); c.row(12, 20, 16, '='); c.put(16, 15, '*'); c.row(24, 30, 16, '$'); c.put(10, 18, 'c')
    c.put(42, 18, '!'); c.rect(46, 47, 16, 18); c.rect(60, 61, 16, 18); c.col(54, 13, 18); c.row(55, 70, 13, '='); c.put(68, 12, '*'); c.put(52, 18, 'g'); c.put(65, 18, 'r'); c.put(62, 12, 'g'); c.row(56, 60, 10, '$')
    c.row(72, 76, 19, 'I'); c.put(74, 18, 'c'); c.put(78, 18, '!'); c.put(81, 18, 'L'); c.rect(85, 85, 13, 18, 'G'); c.rect(85, 85, 3, 12)
    c.put(88, 18, '!'); c.rect(90, 90, 17, 18)
    for x in (93, 97, 101): c.put(x, 18, 'J')
    c.put(105, 18, 'P'); c.row(109, 112, 16, '='); c.put(110, 15, '*'); c.put(120, 18, 'y'); c.rect(131, 133, 3, 18); c.put(128, 18, 'E')
    return c


# ================================================================== 16/11 : dix mondes de plus (11 à 20)
# ------------------------------------------------------------------ monde 11 : le Chott el Jérid (lac salé, mirages)
def m11():
    c = Carte(160)
    c.rect(0, 159, 19, 21)
    c.put(2, 18, '@'); c.put(5, 18, '!'); c.row(8, 30, 19, 'I'); c.row(10, 14, 16, '$'); c.put(18, 18, 's'); c.put(26, 18, '!')
    c.rect(32, 37, 19, 20, 'W'); c.row(33, 36, 16, '='); c.row(33, 36, 14, '$')
    c.put(40, 18, 'c'); c.put(46, 18, 'n'); c.row(44, 48, 15, '$'); c.put(52, 18, '!')
    c.rect(54, 58, 16, 18); c.put(56, 15, '*'); c.put(62, 18, 's'); c.row(64, 90, 19, 'I'); c.put(72, 12, 'm'); c.row(70, 76, 16, '$'); c.put(84, 18, 'n')
    c.put(92, 18, '!'); c.put(94, 18, 'A')
    c.rect(97, 124, 19, 21, 'W')
    c.row(99, 101, 17, '='); c.rect(105, 107, 17, 21); c.put(106, 16, '*'); c.row(110, 112, 16, '='); c.rect(115, 117, 17, 21); c.put(116, 16, 'x'); c.row(119, 122, 17, '=')
    c.row(102, 112, 12, '$'); c.put(110, 8, 'm')
    c.put(128, 18, 'c'); c.put(134, 18, 's'); c.put(138, 18, '!'); c.put(140, 18, 'P')
    c.rect(144, 144, 12, 18, 'B'); c.rect(144, 144, 0, 11); c.rect(147, 149, 16, 18); c.put(148, 15, '*'); c.put(151, 18, 'n'); c.row(152, 154, 16, '$'); c.put(156, 18, 'E')
    return c

# ------------------------------------------------------------------ monde 12 : l'oasis de Tozeur (palmiers, canaux)
def m12():
    c = Carte(166)
    c.rect(0, 165, 19, 21)
    c.put(2, 18, '@'); c.put(5, 18, '!'); c.row(8, 12, 16, '$')
    c.rect(14, 16, 19, 20, 'W'); c.put(20, 18, 'z'); c.put(24, 18, '!')
    c.col(28, 11, 18); c.row(29, 34, 11, '='); c.put(32, 10, '*'); c.row(29, 33, 8, '$'); c.put(34, 10, 'm')              # le premier palmier : on grimpe au tronc
    c.rect(36, 38, 19, 20, 'W'); c.put(42, 18, 'h'); c.put(40, 18, 'c'); c.put(48, 18, '!')
    c.row(50, 51, 19, 'U'); c.row(52, 58, 12, '='); c.row(53, 57, 10, '$')
    c.rect(60, 66, 19, 20, 'W'); c.row(61, 65, 16, '=')
    c.rect(68, 82, 15, 18); c.put(70, 14, 'c'); c.put(74, 14, 'h'); c.put(80, 14, '!'); c.row(72, 76, 12, '$')
    c.col(84, 9, 18); c.row(85, 92, 9, '='); c.put(90, 8, '*'); c.put(88, 5, 'm'); c.row(86, 89, 6, '$')
    c.rect(94, 98, 19, 20, 'W'); c.put(96, 17, 'M')
    c.put(102, 18, 'z'); c.put(106, 18, '!'); c.put(108, 18, 'L'); c.rect(112, 112, 13, 18, 'G'); c.rect(112, 112, 0, 12)
    c.put(116, 18, 'h'); c.row(118, 119, 19, 'U'); c.row(120, 126, 13, '='); c.put(123, 12, '*'); c.row(121, 125, 10, '$')
    c.rect(128, 132, 19, 20, 'W'); c.row(129, 131, 16, '=')
    c.put(136, 18, 'c'); c.put(142, 18, 'z'); c.col(146, 13, 18); c.rect(147, 158, 13, 18); c.put(150, 12, 'h'); c.row(150, 154, 10, '$'); c.col(159, 13, 18); c.put(162, 18, 'E')
    return c

# ------------------------------------------------------------------ monde 13 : l'amphithéâtre d'El Jem (gradins, souterrains de l'arène)
def m13():
    c = Carte(170)
    c.rect(0, 169, 19, 21)
    c.put(2, 18, '@'); c.put(5, 18, '!'); c.put(10, 18, 'g'); c.row(12, 16, 16, '$')
    for i in range(5): c.rect(20 + i * 3, 22 + i * 3, 17 - i * 2, 18)          # les gradins qui montent
    c.put(26, 14, '!'); c.rect(35, 50, 9, 18); c.put(38, 8, 'c'); c.put(44, 8, 'r'); c.row(40, 46, 6, '$')
    c.rect(36, 49, 0, 2); c.put(42, 3, 'R'); c.put(47, 3, 'R')
    c.row(51, 54, 9, 'X'); c.rect(51, 54, 10, 18, '.'); c.put(52, 18, '*'); c.col(55, 9, 18)
    for i in range(5): c.rect(56 + i * 3, 58 + i * 3, 9 + i * 2, 18)           # les gradins qui descendent
    c.put(72, 18, '!'); c.put(74, 18, 'T'); c.put(80, 18, 'g')
    c.rect(84, 120, 13, 18); c.rect(86, 118, 15, 17, '.'); c.put(88, 17, 'T'); c.put(95, 17, 'a'); c.put(100, 17, 'K'); c.put(105, 17, 'a'); c.put(110, 17, '*'); c.row(92, 98, 17, '$'); c.put(116, 17, 'T')    # les souterrains de l'arène
    c.put(86, 12, 'c'); c.put(92, 12, 'r'); c.put(102, 12, '!'); c.put(112, 12, 'g'); c.put(118, 12, 'T'); c.row(96, 100, 9, '$')
    c.col(121, 13, 18); c.put(124, 18, 'J'); c.put(128, 18, 'g'); c.put(132, 18, '!'); c.put(134, 18, 'L'); c.rect(138, 138, 13, 18, 'G'); c.rect(138, 138, 0, 12)
    c.put(142, 18, 'c'); c.put(148, 18, 'r'); c.rect(156, 156, 0, 14); c.rect(156, 156, 15, 18, 'D'); c.put(152, 18, '!'); c.put(164, 18, 'E'); c.row(159, 162, 16, '$')
    return c

# ------------------------------------------------------------------ monde 14 : la forêt d'Aïn Draham (neige, verglas)
def m14():
    c = Carte(168)
    c.rect(0, 167, 19, 21)
    c.put(2, 18, '@'); c.put(5, 18, '!'); c.row(10, 26, 19, 'I'); c.row(12, 16, 16, '$'); c.put(20, 18, 'd'); c.put(28, 18, '!')
    c.rect(30, 44, 16, 18); c.row(30, 44, 16, 'I'); c.put(32, 15, 'c'); c.put(40, 15, 'd'); c.row(34, 38, 13, '$')
    c.rect(45, 52, 19, 21, '.'); c.row(46, 51, 21, '^'); c.put(47, 16, 'M'); c.col(53, 15, 18)
    c.rect(54, 70, 15, 18); c.put(58, 14, '!'); c.put(62, 9, 'm'); c.rect(56, 70, 0, 3); c.put(60, 4, 'R'); c.put(66, 4, 'R')
    c.col(71, 15, 18); c.put(74, 18, 'c'); c.row(76, 90, 19, 'I'); c.put(82, 18, 'd'); c.put(86, 18, '!')
    c.col(92, 10, 18); c.row(93, 100, 10, '='); c.put(98, 9, '*'); c.row(94, 98, 7, '$'); c.put(100, 6, 'm')
    c.rect(102, 108, 19, 21, '.'); c.row(103, 107, 21, '^'); c.row(103, 107, 17, '='); c.put(105, 14, '*')
    c.put(112, 18, 'c'); c.put(116, 18, 'P'); c.put(118, 18, '!'); c.rect(122, 122, 12, 18, 'B'); c.rect(122, 122, 0, 11)
    c.row(124, 140, 19, 'I'); c.put(128, 18, 'd'); c.put(134, 18, 'r'); c.col(142, 13, 18); c.rect(143, 156, 13, 18); c.put(146, 12, 'c'); c.put(150, 12, 'd'); c.put(153, 9, '*'); c.row(144, 148, 10, '$'); c.col(157, 13, 18)
    c.put(162, 18, 'E')
    return c

# ------------------------------------------------------------------ monde 15 : les potiers de Guellala (Djerba)
def m15():
    c = Carte(164)
    c.rect(0, 163, 19, 21)
    c.put(2, 18, '@'); c.put(5, 18, '!'); c.row(10, 30, 19, 'Y'); c.put(14, 18, 'J'); c.put(22, 18, 'x'); c.row(16, 20, 16, '$')
    c.put(30, 18, 'l'); c.put(28, 18, '!'); c.row(34, 35, 19, 'U'); c.row(36, 44, 12, '='); c.put(40, 11, '*'); c.row(37, 43, 9, '$')
    c.rect(46, 60, 15, 18); c.put(48, 14, 'c'); c.put(52, 14, 'J'); c.put(56, 14, 'z'); c.put(50, 9, 'm')
    c.rect(62, 66, 19, 21, 'W'); c.put(63, 17, 'M')
    c.row(68, 90, 19, 'Y'); c.put(72, 18, 'x'); c.put(76, 18, '!'); c.put(80, 18, 'l'); c.row(84, 85, 19, 'U'); c.row(86, 94, 12, '='); c.put(92, 11, '*'); c.row(87, 91, 9, '$')
    c.put(96, 18, 'c'); c.put(100, 18, 'S'); c.put(102, 18, '!'); c.rect(106, 106, 12, 18, 'B'); c.rect(106, 106, 0, 11)
    c.put(110, 18, 'x'); c.put(114, 18, 'J'); c.put(118, 18, 'l'); c.put(122, 10, 'm'); c.row(124, 125, 19, 'U'); c.row(126, 134, 12, '='); c.put(132, 11, '*'); c.row(127, 131, 9, '$')
    c.put(138, 18, 'c'); c.put(144, 18, 'x'); c.put(150, 18, 'z'); c.put(160, 18, 'E'); c.row(152, 156, 16, '$')
    return c

# ------------------------------------------------------------------ monde 16 : le Lézard rouge dans les gorges de Selja (train, falaises)
def m16():
    c = Carte(196)
    c.rect(0, 195, 19, 21)
    c.rect(0, 30, 15, 18); c.put(3, 14, '@'); c.put(6, 14, '!'); c.put(14, 14, 'h'); c.row(10, 14, 11, '$'); c.put(22, 14, 'c'); c.put(26, 14, '!')
    c.col(31, 15, 18); c.put(31, 15, 'Q'); c.col(48, 15, 18); c.put(38, 18, 'n'); c.row(36, 42, 17, '$')
    c.rect(49, 80, 15, 18); c.put(52, 14, 'c'); c.rect(50, 80, 0, 4); for_ = [56, 62, 70, 76]
    for x in for_: c.put(x, 5, 'R')
    c.put(60, 14, '!'); c.put(66, 14, 'h'); c.row(64, 68, 11, '$'); c.put(74, 14, 'X'); c.row(72, 76, 15, 'X'); c.rect(72, 76, 16, 18, '.'); c.put(74, 18, '*'); c.col(77, 15, 18)
    c.col(81, 15, 18); c.put(81, 15, 'Q'); c.col(98, 15, 18); c.put(88, 18, 'n'); c.row(86, 92, 17, '$')
    c.rect(99, 140, 15, 18); c.put(102, 14, 'c'); c.put(106, 14, '!'); c.put(110, 14, 'h'); c.col(116, 9, 14); c.row(117, 124, 9, '='); c.put(122, 8, '*'); c.put(120, 5, 'm'); c.put(130, 14, 's'); c.put(136, 14, 'P')
    c.rect(141, 141, 6, 14, 'B'); c.rect(141, 141, 0, 5); c.rect(141, 141, 15, 18); c.rect(142, 160, 15, 18); c.put(146, 14, 'c'); c.put(150, 14, 'h'); c.put(156, 14, '!')
    c.col(161, 15, 18); c.put(161, 15, 'Q'); c.col(178, 15, 18); c.rect(179, 195, 15, 18); c.put(182, 14, 'h'); c.put(190, 14, 'E'); c.row(184, 188, 11, '$')
    return c

# ------------------------------------------------------------------ monde 17 : les maisons troglodytes de Matmata (dans le noir)
def m17():
    c = Carte(166)
    c.rect(0, 165, 0, 21)
    gal = lambda x0, x1, y0, y1: c.rect(x0, x1, y0, y1, '.')
    gal(1, 70, 14, 18); gal(1, 30, 3, 18)                                          # la première cour, ouverte vers le ciel
    c.put(3, 18, '@'); c.put(6, 18, '!'); c.put(10, 18, 'c'); c.row(12, 16, 16, '$'); c.put(20, 18, 'a'); c.put(26, 14, 'b')
    c.put(34, 18, '!'); c.put(40, 18, 'a'); c.put(46, 14, 'b'); c.put(50, 18, 'T'); c.put(56, 18, 'c'); c.put(62, 18, 'a'); c.row(44, 50, 16, '$')
    gal(30, 60, 6, 9); c.col(32, 6, 13); c.rect(32, 32, 10, 13, 'H'); c.put(34, 9, 'T'); c.put(40, 9, 'K'); c.put(46, 9, '*'); c.put(52, 9, 'a'); c.row(42, 45, 8, '$'); c.col(58, 6, 13); c.rect(58, 58, 10, 13, 'H')
    gal(72, 100, 3, 18); c.rect(71, 71, 14, 18, '.'); c.put(74, 18, 'c'); c.put(80, 18, 'a'); c.put(84, 14, 'b'); c.col(88, 10, 18); c.row(89, 96, 10, '='); c.put(94, 9, '*'); c.put(92, 4, 'b'); c.row(90, 94, 7, '$')
    gal(101, 160, 14, 18); c.put(104, 18, '!'); c.put(110, 18, 'a'); c.put(116, 14, 'b'); c.put(120, 18, 'c'); c.put(126, 18, 'P'); c.rect(130, 130, 14, 18, 'B'); c.put(134, 18, '*'); c.row(132, 133, 18, '$')
    c.put(140, 18, 'a'); c.put(144, 18, '!'); c.rect(150, 150, 14, 18, 'D'); c.put(156, 18, 'E'); c.put(146, 14, 'b')
    return c

# ------------------------------------------------------------------ monde 18 : le ksar Ouled Soltane (greniers en étages)
def m18():
    c = Carte(170)
    c.rect(0, 169, 19, 21)
    c.put(2, 18, '@'); c.put(5, 18, '!'); c.put(12, 18, 'p'); c.row(8, 12, 16, '$')
    c.rect(18, 60, 15, 18); c.col(17, 15, 18); c.put(20, 14, 'c'); c.put(26, 14, 'h'); c.put(30, 14, '!')        # le rez-de-chaussée des greniers
    c.rect(22, 56, 11, 11); c.col(34, 11, 14); c.put(38, 10, 'p'); c.put(44, 10, '!'); c.row(46, 50, 11, 'X'); c.put(48, 14, '*')   # 1er étage (une tuile qui s'effondre au-dessus d'un jasmin)
    c.rect(26, 55, 7, 7); c.col(52, 7, 10); c.put(30, 6, 'h'); c.put(40, 6, '*'); c.row(34, 38, 4, '$'); c.put(28, 6, 'P')     # 2e étage, et la pierre
    c.rect(56, 56, 3, 6, 'B'); c.rect(56, 56, 0, 2); c.rect(57, 64, 7, 7); c.put(62, 6, 'K'); c.col(61, 8, 18)               # le grenier fermé par un mur fissuré : la clé
    c.put(66, 18, 'c'); c.put(72, 18, 'p'); c.put(76, 18, '!'); c.rect(80, 120, 13, 18); c.col(79, 13, 18); c.put(82, 12, 'h'); c.put(90, 12, 'p')
    c.row(94, 98, 13, 'X'); c.rect(94, 98, 14, 18, '.'); c.col(99, 13, 18)
    c.put(104, 12, 'c'); c.put(110, 12, 'h'); c.put(116, 9, '*'); c.row(112, 118, 10, '='); c.put(118, 12, '!')
    c.col(121, 13, 18); c.put(124, 18, 'p'); c.rect(130, 130, 0, 14); c.rect(130, 130, 15, 18, 'D'); c.put(128, 18, '!')
    c.put(134, 18, 'h'); c.put(140, 18, 'c'); c.put(148, 18, 'p'); c.row(150, 154, 16, '$'); c.put(164, 18, 'E')
    return c

# ------------------------------------------------------------------ monde 19 : le lac Ichkeul (barques, roseaux, flamants)
def m19():
    c = Carte(164)
    c.rect(0, 163, 18, 21, 'W')
    quai = lambda x0, x1, top=15: c.rect(x0, x1, top, 21)
    quai(0, 24); c.put(2, 14, '@'); c.put(5, 14, '!'); c.row(10, 20, 15, 'I'); c.put(14, 14, 'x'); c.row(8, 12, 12, '$'); c.put(22, 14, '!')
    c.put(25, 17, 'M'); c.row(27, 30, 14, '$')
    quai(34, 56); c.put(36, 14, 'c'); c.put(42, 14, 'x'); c.row(46, 47, 15, 'U'); c.row(48, 54, 9, '='); c.put(52, 8, '*'); c.put(50, 6, 'm'); c.put(54, 14, '!')
    c.put(57, 17, 'M'); c.put(66, 17, 'M'); c.put(70, 8, 'm'); c.row(60, 64, 14, '$')
    quai(75, 100); c.put(78, 14, 'c'); c.row(80, 92, 15, 'I'); c.put(84, 14, 'x'); c.put(90, 14, 'z'); c.put(94, 14, '!'); c.put(96, 14, 'T')
    c.rect(104, 108, 12, 21); c.put(106, 11, 'T'); c.put(107, 11, '*'); c.put(105, 11, '$')
    c.put(101, 17, 'M'); c.put(110, 17, 'M')
    quai(116, 163); c.put(118, 14, 'c'); c.put(122, 14, 'x'); c.row(126, 127, 15, 'U'); c.row(128, 134, 10, '='); c.put(130, 9, '*'); c.put(136, 8, 'm'); c.put(140, 14, 'x'); c.put(146, 14, 'z'); c.put(150, 14, '!'); c.put(158, 14, 'E'); c.row(152, 156, 12, '$')
    return c

# ------------------------------------------------------------------ monde 20 : le fort de Kélibia (boss : le Scorpion d'Or, la revanche)
def m20():
    c = Carte(150)
    c.rect(0, 149, 0, 2); c.rect(0, 149, 19, 21)
    c.put(2, 18, '@'); c.put(5, 18, '!'); c.put(10, 18, 'c'); c.row(12, 30, 19, 'I'); c.put(18, 18, 'g'); c.put(28, 18, 'r'); c.row(14, 22, 16, '='); c.put(18, 15, '*'); c.row(24, 28, 16, '$')
    c.put(34, 18, '!'); c.col(38, 11, 18); c.rect(39, 60, 11, 12); c.put(42, 10, 'g'); c.put(50, 10, 'r'); c.put(56, 10, 'K'); c.row(44, 48, 8, '$'); c.col(61, 11, 18); c.put(48, 18, 'g'); c.put(54, 18, 'a')
    c.put(64, 18, 'c'); c.put(66, 18, '!'); c.rect(70, 70, 3, 14); c.rect(70, 70, 15, 18, 'D')
    c.put(74, 18, 'g'); c.put(78, 18, '!'); c.put(80, 18, 'L'); c.rect(84, 84, 13, 18, 'G'); c.rect(84, 84, 3, 12); c.col(76, 12, 18); c.row(77, 82, 12, '='); c.put(80, 11, '*')
    c.put(88, 18, '!'); c.put(90, 18, 'c'); c.rect(92, 92, 17, 18)
    for x in (95, 99, 103): c.put(x, 18, 'J')
    c.put(107, 18, 'P'); c.row(111, 114, 16, '='); c.put(112, 15, '$'); c.put(124, 18, 'y'); c.rect(147, 149, 3, 18); c.put(144, 18, 'E')
    return c

# ------------------------------------------------------------------ monde 21 : la médina de Sfax (les remparts, le souk de l'huile d'olive) — 20/11
def m21():
    c = Carte(170)
    c.rect(0, 169, 19, 21)
    c.put(2, 18, '@'); c.put(5, 18, '!'); c.row(8, 12, 16, '$'); c.put(14, 18, 'a'); c.put(18, 18, 'c')
    c.put(22, 18, '!'); c.row(24, 34, 19, 'I'); c.put(30, 18, 'S'); c.put(36, 18, 'l'); c.row(26, 32, 16, '='); c.put(29, 15, '*')        # le souk de l'huile : ça glisse
    c.put(40, 18, '!'); c.col(44, 12, 18); c.rect(45, 70, 12, 12); c.put(48, 11, 'p'); c.put(56, 11, 'z'); c.put(64, 11, 'K'); c.row(50, 54, 9, '$'); c.col(71, 12, 18)   # le chemin de ronde des remparts, la clé
    c.put(52, 18, 'a'); c.put(60, 18, 'C'); c.put(66, 18, 'g')
    c.put(74, 18, 'c'); c.put(76, 18, '!'); c.rect(80, 80, 3, 14); c.rect(80, 80, 15, 18, 'D')                                      # Bab Diwan : la porte fermée à clé
    c.put(84, 18, 'l'); c.row(86, 98, 19, 'I'); c.put(90, 18, 'S'); c.put(96, 18, 'p'); c.rect(100, 103, 16, 18); c.row(100, 103, 13, '='); c.put(101, 12, '*')
    c.put(106, 18, '!'); c.put(110, 18, 'C'); c.rect(114, 114, 14, 18, 'B'); c.put(118, 18, 'a'); c.put(124, 18, 'c')               # un mur fissuré : la caisse le casse
    c.rect(128, 140, 15, 18); c.col(127, 15, 18); c.put(132, 14, 'g'); c.row(134, 138, 12, '='); c.put(136, 11, '*'); c.row(130, 133, 12, '$')
    c.put(146, 18, 'z'); c.put(150, 18, 'l'); c.row(152, 156, 16, '$'); c.put(164, 18, 'E')
    return c

# ------------------------------------------------------------------ monde 22 : Mahdia (la Skifa Kahla, le cap et le port des pêcheurs) — 20/11
def m22():
    c = Carte(166)
    c.rect(0, 165, 18, 21, 'W')
    quai = lambda x0, x1, top=15: c.rect(x0, x1, top, 21)
    quai(0, 30); c.put(2, 14, '@'); c.put(5, 14, '!'); c.row(8, 12, 12, '$'); c.put(14, 14, 'x'); c.put(18, 14, 'c'); c.rect(22, 22, 9, 11); c.row(20, 26, 8, '#'); c.put(24, 14, 'g'); c.put(27, 14, '!')   # la Skifa Kahla, la porte noire
    c.put(31, 17, 'M'); c.row(33, 36, 13, '$')
    quai(40, 62); c.row(42, 52, 15, 'I'); c.put(46, 14, 'x'); c.put(50, 8, 'm'); c.row(54, 60, 10, '='); c.put(57, 9, '*'); c.col(54, 11, 14); c.put(60, 14, '!')
    c.put(63, 17, 'M'); c.put(72, 17, 'M'); c.put(76, 8, 'm'); c.row(66, 70, 14, '$')
    quai(81, 112); c.put(84, 14, 'c'); c.put(88, 14, 'J'); c.put(92, 14, 'x'); c.put(98, 14, 'z'); c.row(100, 101, 15, 'U'); c.row(102, 108, 9, '='); c.put(105, 8, '*'); c.put(110, 14, '!')
    c.put(113, 17, 'M'); c.put(122, 17, 'M'); c.put(126, 9, 'm')
    quai(131, 165); c.put(134, 14, 'c'); c.put(138, 14, 'x'); c.row(140, 150, 15, 'I'); c.put(146, 14, 'g'); c.put(152, 14, '!'); c.row(154, 158, 12, '$'); c.put(160, 14, 'E')
    return c

# ------------------------------------------------------------------ monde 23 : Bulla Regia (les villas romaines sous la terre) — 20/11
def m23():
    c = Carte(168)
    c.rect(0, 167, 19, 21)
    c.put(2, 18, '@'); c.put(5, 18, '!'); c.row(8, 12, 16, '$'); c.put(14, 18, 's'); c.put(18, 18, 'c'); c.put(24, 18, 'n'); c.put(28, 18, 'R')
    c.put(32, 18, '!'); c.rect(36, 70, 8, 13); c.rect(37, 69, 9, 12, '.'); c.col(38, 9, 18); c.put(42, 12, 'b'); c.put(48, 12, 'P'); c.put(56, 12, 's'); c.row(52, 58, 10, '$'); c.put(66, 12, '*'); c.col(68, 13, 18)   # la villa de la chasse, sous la terre
    c.put(46, 18, 'h'); c.put(58, 18, 'R')
    c.put(74, 18, 'c'); c.rect(78, 78, 14, 18, 'B'); c.put(76, 18, '!')                                                              # un mur fissuré : la pierre du dessous le casse
    c.rect(82, 120, 15, 18); c.col(81, 15, 18); c.put(86, 14, 'n'); c.row(96, 104, 11, '='); c.put(100, 10, '*'); c.col(96, 11, 14); c.put(108, 14, 's'); c.put(114, 14, 'h')
    c.put(124, 18, 'c'); c.put(128, 18, 'R'); c.put(132, 18, '!'); c.put(136, 18, 'b'); c.row(140, 146, 15, 'X'); c.rect(140, 146, 16, 18, '.'); c.col(147, 15, 18); c.put(143, 14, '*'); c.col(139, 15, 18)
    c.put(150, 18, 'n'); c.row(152, 156, 16, '$'); c.put(162, 18, 'E')
    return c

MONDES = { 1:(m1, 4), 2:(m2, 4), 3:(m3, 5), 4:(m4, 4), 5:(m5, 4), 6:(m6, 5), 7:(m7, 4), 8:(m8, 4), 9:(m9, 4), 10:(m10, 4), 11:(m11, 4), 12:(m12, 4), 13:(m13, 4), 14:(m14, 4), 15:(m15, 4), 16:(m16, 5), 17:(m17, 4), 18:(m18, 4), 19:(m19, 5), 20:(m20, 4), 21:(m21, 4), 22:(m22, 5), 23:(m23, 4) }
if __name__ == '__main__':
    racine = os.path.join(os.path.dirname(__file__), '..', '..')
    tout = []
    for n, (f, dist) in MONDES.items():
        lignes = f().lignes()
        pb = verifie(lignes, f'monde {n}', plat_dist=dist, bavard=True); tout += pb
        for p in pb: print('  ⚠', p)
        open(os.path.join(racine, 'jeux', 'stage2', 'cartes', f'm{n}.js'), 'w').write(
            f'/* Stage 2, monde {n} : la carte (faite par docs/stage2/cartes.py, vérifiée par verifie.py). Une lettre = une case de 32 px, légende dans niveaux.js. */\n'
            f'(window.S2_CARTES = window.S2_CARTES || {{}})[{n}] = [\n' + ',\n'.join("'" + l + "'" for l in lignes) + '\n];\n')
        print(f'monde {n} : {len(lignes[0])} × {len(lignes)}, panneaux {sum(l.count("!") for l in lignes)}')
    print('PROBLÈMES :', len(tout))
