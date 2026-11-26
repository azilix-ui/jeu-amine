"""Arabe (26/11) : fabrique les pages de « Salma & Ghazala » (salma/arabe-ghazala-<n>.html + salma/arabe-ghazala.html)
à partir des pages de « Salma & Pip » (même moteur, mêmes styles) et de salma/arabe/lecons.js.
Usage : python3 docs/arabe-ghazala/pages.py"""
import re, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
src = open(os.path.join(R, 'salma/arabe/lecons.js')).read()
L = [(int(m.group(1)), m.group(2), m.group(3), m.group(4).replace("\\'", "'"), m.group(5).replace("\\'", "'"))
     for m in re.finditer(r"\{ n:(\d+), id:'\w+', l:'(.)', icon:'([^']+)', titre:'((?:[^'\\]|\\.)*)', sous:'((?:[^'\\]|\\.)*)'", src)]
assert len(L) == 10, len(L)
ICO = '%F0%9F%A6%8C'   # 🦌
FONT = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800&family=Noto+Naskh+Arabic:wght@500;700&display=swap">'
STYLE = """<style>body{background:linear-gradient(#fbe9d0,#fff6e9 40%,#fffdf8) fixed}h1{color:#8a4b14}.lead,.help{color:#4a3520;text-shadow:none}
.ar{font-family:'Noto Naskh Arabic','Geeza Pro',serif;direction:rtl;unicode-bidi:isolate;font-weight:700;color:#8a4b14}
.arb{font-size:46px;line-height:1.5}.arm{font-size:38px;line-height:1.5;display:inline-block;margin:0 6px}
[lang="ar"]{font-family:'Noto Naskh Arabic','Geeza Pro',serif}
.dis b[lang="ar"]{font-size:56px;direction:rtl;unicode-bidi:isolate}
.formes{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;direction:rtl;margin:8px 0}
.formes span{display:flex;flex-direction:column;align-items:center;background:#fff7ea;border:2px solid #f0d2a8;border-radius:16px;padding:4px 14px;min-width:84px}
.formes small{font-family:Nunito,sans-serif;font-size:14px;color:#6b5236;direction:ltr}
.arband{width:100%;border-radius:22px;background:linear-gradient(90deg,#8a4b14,#c8742a);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 16px;box-shadow:0 6px 0 #e0a868;font-family:'Baloo 2',sans-serif;font-size:21px;flex-wrap:wrap}
.arband .ar{color:#fff;font-size:34px;margin-left:6px}.arband .liens{display:flex;gap:8px}
.arband a{background:#fff;color:#8a4b14;border-radius:14px;padding:8px 12px;font-size:16px;text-decoration:none;min-height:44px;display:inline-flex;align-items:center}
.tab{border-collapse:collapse;margin:6px 0}.tab td{border-bottom:1px solid #eadfce;padding:4px 10px}</style>"""
p1 = open(os.path.join(R, 'salma/english-pip-1.html')).read()
for n, l, ic, ti, so in L:
    h = p1.replace('<title>Salma & Pip · Hello, Pip!</title>', f'<title>Salma & Ghazala · {ti}</title>')
    h = h.replace('<html lang="fr">', '<html lang="fr">').replace('%F0%9F%95%8A%EF%B8%8F', ICO).replace('<meta name="theme-color" content="#1f6b44">', '<meta name="theme-color" content="#8a4b14">')
    h = re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com/css2\?[^"]+">', FONT, h)
    h = re.sub(r'<style>.*?</style>', STYLE, h, flags=re.S)
    h = re.sub(r'<!-- Salma & Pip.*?-->', f'<!-- Salma & Ghazala, épisode {n}/10 (26/11) : données salma/arabe/lecons.js, code salma/arabe/arabe.js, moteur salma/ollie/cours.js ; page fabriquée par docs/arabe-ghazala/pages.py -->', h)
    h = h.replace('<script>window.PIPN = 1;</script>', f'<script>window.ARN = {n};</script>').replace('<script src="pip/lecons.js?v=1"></script>', '<script src="arabe/lecons.js?v=1"></script>').replace('<script src="pip/pip.js?v=2"></script>', '<script src="arabe/arabe.js?v=1"></script>')
    assert 'arabe/arabe.js' in h and 'ARN' in h and 'Noto+Naskh' in h
    open(os.path.join(R, f'salma/arabe-ghazala-{n}.html'), 'w').write(h)
ix = open(os.path.join(R, 'salma/english-pip.html')).read()
ix = ix.replace('<title>Salma & Pip</title>', '<title>Salma & Ghazala · l\'arabe lettre par lettre</title>').replace('%F0%9F%95%8A%EF%B8%8F', ICO).replace('<meta name="theme-color" content="#1f6b44">', '<meta name="theme-color" content="#8a4b14">')
ix = re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com/css2\?[^"]+">', FONT, ix)
ix = ix.replace('<h1>Salma & Pip 🇬🇧</h1>', '<h1>Salma & Ghazala <span class="ar" lang="ar">أ ب ت</span></h1>')
ix = re.sub(r'<p class="lead" id="lead">.*?</p>', '<p class="lead" id="lead">L\'arabe <b>lettre par lettre</b> avec <b>Ghazala</b>, le bébé gazelle sorti de la vieille boîte de Jedda. Chaque épisode commence par un dessin animé dont tu es l\'héroïne, puis tu écoutes la lettre, ses petites voyelles, ses formes, tu lis et tu répètes des mots. Pour l\'écrire : <a href="ardoise-arabe.html">✍️ l\'Ardoise arabe</a>.</p>', ix, flags=re.S)
cartes = '\n'.join(f'    <a class="lec" href="arabe-ghazala-{n}.html" data-k="salma-ar{n}"><img src="arabe/img/a{n}_0.webp" alt="" loading="lazy"><span class="num">{n}</span><span class="lt ar" lang="ar">{l}</span><b>{ic} {ti}</b><small>{so}</small><i class="et"></i></a>' for n, l, ic, ti, so in L)
ix = re.sub(r'  <div class="grille">.*?\n  </div>', '  <div class="grille">\n' + cartes + '\n  </div>', ix, flags=re.S)
ix = ix.replace("const MAX = 24, KEY = 'salma-pip', QUI = 'Salma';", "const MAX = 24, KEY = 'salma-ar', QUI = 'Salma';")
ix = ix.replace('body{background:linear-gradient(#d6efff,#f2fbff 40%,#fff9ef) fixed}h1{color:#1f6b44}', 'body{background:linear-gradient(#fbe9d0,#fff6e9 40%,#fffdf8) fixed}h1{color:#8a4b14}')
ix = ix.replace('.wrapb h1{', '.ar{font-family:\'Noto Naskh Arabic\',\'Geeza Pro\',serif;direction:rtl;unicode-bidi:isolate}\n.lec .lt{position:absolute;right:10px;top:6px;width:58px;height:58px;border-radius:50%;background:#fff;color:#8a4b14;display:grid;place-items:center;font-size:34px;box-shadow:0 3px 0 #0002}\n.wrapb h1{')
ix = ix.replace('color:#1f6b44', 'color:#8a4b14').replace('#5aaedc', '#e0a868')
open(os.path.join(R, 'salma/arabe-ghazala.html'), 'w').write(ix)
print(len(L), 'épisodes')
