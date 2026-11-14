"""Stage 2, monde 1 « Les ruelles de la médina de Tunis » : fabrique la carte (caractères) et l'écrit dans jeux/stage2/cartes/m1.js.
Légende : voir jeux/stage2/niveaux.js. Une case = 32 px. On peut aussi retoucher m1.js à la main (c'est la carte qui compte)."""
import os
W, H = 172, 22
G = [['.'] * W for _ in range(H)]
def rect(x0, x1, y0, y1, c='#'):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): G[y][x] = c
def put(x, y, c): G[y][x] = c
def row(x0, x1, y, c):
    for x in range(x0, x1 + 1): G[y][x] = c
# le sol de la rue
rect(0, W - 1, 19, 21)
# 1. départ, jarre, chat
put(2, 18, '@'); put(4, 18, '!'); row(8, 12, 16, '$'); rect(14, 14, 17, 18); put(16, 18, '!'); put(18, 18, 'J'); put(24, 18, 'z')
# 2. le mur trop haut et la caisse
put(27, 18, '!'); put(30, 18, 'C'); rect(34, 49, 15, 21); row(37, 41, 13, '$')
# 3. l'échelle et le toit A
put(46, 14, '!'); rect(49, 49, 9, 14, 'H'); rect(50, 70, 9, 21); put(52, 8, 'c'); put(58, 8, 'g'); row(63, 66, 6, '='); put(65, 5, '*'); row(54, 57, 7, '$')
# 4. la ruelle aux cactus, le toit B, la plateforme mobile, le toit C
rect(71, 73, 9, 18, '.'); rect(71, 73, 19, 21); put(72, 18, '^'); rect(73, 73, 9, 18, 'H')
rect(74, 84, 9, 21); put(76, 8, 'c'); put(82, 8, 'z'); row(78, 80, 6, '$')
rect(85, 90, 9, 18, '.'); row(86, 89, 18, '^'); rect(90, 90, 8, 18, 'H'); put(85, 9, 'M'); row(86, 89, 6, '$')
rect(91, 100, 8, 21); put(98, 7, 'l'); row(93, 95, 5, '$')
# 5. descente, ballon, levier, grille, chien
rect(101, 101, 8, 18, 'H'); put(102, 18, '!'); put(104, 18, 'O'); row(104, 105, 17, '='); row(106, 108, 15, '='); put(109, 13, 'L')
rect(113, 113, 14, 18, 'G'); rect(113, 113, 0, 13); put(120, 18, 'd'); row(116, 119, 16, '$')
# 6. l'étal du souk (ramper dessous), son toit
put(125, 18, '!'); rect(128, 140, 12, 17); row(130, 138, 18, '$'); rect(141, 141, 12, 18, 'H'); put(134, 11, '*'); row(129, 132, 11, '$')
put(143, 18, 'c'); put(144, 18, 'P'); put(145, 18, '!')
# 7. la maison au mur fissuré (pièce secrète), la clé sur le toit, la porte fermée, la sortie
rect(146, 146, 12, 18, 'H'); rect(147, 156, 12, 18); rect(147, 147, 16, 18, 'B'); rect(148, 155, 16, 18, '.'); put(152, 18, '*'); row(149, 151, 18, '$')
put(153, 11, 'K'); put(150, 11, 'r'); put(158, 18, '!')
rect(162, 162, 0, 14); rect(162, 162, 15, 18, 'D'); put(168, 18, 'E'); put(166, 13, 'm'); row(164, 166, 16, '$')
os.makedirs('jeux/stage2/cartes', exist_ok=True)
lignes = [''.join(r) for r in G]
open('jeux/stage2/cartes/m1.js', 'w').write('/* Stage 2, monde 1 : la carte (faite par docs/stage2/carte_m1.py ; on peut la retoucher ici). Une lettre = une case de 32 px, légende dans niveaux.js. */\n(window.S2_CARTES = window.S2_CARTES || {})[1] = [\n' + ',\n'.join("'" + l + "'" for l in lignes) + '\n];\n')
print('\n'.join(''.join(r)[:172] for r in G))
