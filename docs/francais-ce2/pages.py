"""Français CE2 (24/11) : fabrique les pages de « Salma & Filou » (salma/francais-filou-<n>.html + salma/francais-filou.html)
à partir des pages de « Salma & Pip » (même moteur, mêmes styles) et de salma/filou/lecons.js."""
import re, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
src = open(os.path.join(R, 'salma/filou/lecons.js')).read()
L = [(int(m.group(1)), m.group(2), m.group(3).replace("\\'", "'"), m.group(4).replace("\\'", "'")) for m in re.finditer(r"\{ n:(\d+), icon:'([^']+)', titre:'((?:[^'\\]|\\.)*)', sous:'((?:[^'\\]|\\.)*)'", src)]
ICO = '%F0%9F%93%92'
p1 = open(os.path.join(R, 'salma/english-pip-1.html')).read()
for n, ic, ti, so in L:
    h = p1.replace('<title>Salma & Pip · Hello, Pip!</title>', f'<title>Salma & Filou · {ti}</title>')
    h = h.replace('%F0%9F%95%8A%EF%B8%8F', ICO)
    h = re.sub(r'<!-- Salma & Pip.*?-->', f'<!-- Salma & Filou, leçon {n}/5 (24/11) : données salma/filou/lecons.js, code salma/filou/filou.js, moteur salma/ollie/cours.js ; page fabriquée par docs/francais-ce2/pages.py -->', h)
    h = h.replace('<script>window.PIPN = 1;</script>', f'<script>window.FILOUN = {n};</script>').replace('<script src="pip/lecons.js?v=1"></script>', '<script src="filou/lecons.js?v=1"></script>').replace('<script src="pip/pip.js?v=2"></script>', '<script src="filou/filou.js?v=1"></script>')
    h = h.replace('background:linear-gradient(#d6efff,#f2fbff 40%,#fff9ef) fixed', 'background:linear-gradient(#ffe9c9,#fff6e8 40%,#fffdf6) fixed')
    assert 'filou/filou.js' in h and 'FILOUN' in h
    open(os.path.join(R, f'salma/francais-filou-{n}.html'), 'w').write(h)
ix = open(os.path.join(R, 'salma/english-pip.html')).read()
ix = ix.replace('<title>Salma & Pip</title>', '<title>Salma & Filou</title>')
ix = ix.replace('%F0%9F%95%8A%EF%B8%8F', ICO)
ix = ix.replace('<h1>Salma & Pip 🇬🇧</h1>', '<h1>Salma & Filou 📒</h1>')
ix = re.sub(r'<p class="lead" id="lead">.*?</p>', '<p class="lead" id="lead">5 leçons de français de CE2 avec <b>Filou</b>, le petit fennec de Douz qui écrit son carnet de voyage. Chaque leçon commence par un dessin animé dont tu es l\'héroïne, puis tu observes, tu complètes, tu transformes, tu fais la dictée, tu lis à voix haute… et tu évites les pièges !</p>', ix, flags=re.S)
cartes = '\n'.join(f'    <a class="lec" href="francais-filou-{n}.html" data-k="salma-fr{n}"><img src="filou/img/f{n}_0.webp" alt="" loading="lazy"><span class="num">{n}</span><b>{ic} {ti}</b><small>{so}</small><i class="et"></i></a>' for n, ic, ti, so in L)
ix = re.sub(r'  <div class="grille">.*?\n  </div>', '  <div class="grille">\n' + cartes + '\n  </div>', ix, flags=re.S)
ix = ix.replace("const MAX = 24, KEY = 'salma-pip', QUI = 'Salma';", "const MAX = 24, KEY = 'salma-fr', QUI = 'Salma';").replace('for(let n = 1; n <= 10; n++)', 'for(let n = 1; n <= 5; n++)')
ix = ix.replace('background:linear-gradient(#d6efff,#f2fbff 40%,#fff9ef) fixed', 'background:linear-gradient(#ffe9c9,#fff6e8 40%,#fffdf6) fixed')
open(os.path.join(R, 'salma/francais-filou.html'), 'w').write(ix)
print(len(L), 'leçons')
