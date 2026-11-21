"""Les angles · Essil, 5e (21/11) : fabrique essil/angles.html (les 3 leçons) et essil/angles-1..3.html.
Usage : python3 docs/angles/pages.py"""
import os
R = os.path.join(os.path.dirname(__file__), '..', '..')
TETE = '''<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Missaoui">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<script src="/site.js" defer></script>
<meta name="theme-color" content="#1f3c88">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{titre}</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E%F0%9F%93%90%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800&display=swap">
<link rel="stylesheet" href="maths5/maths5.css?v=1">
<link rel="stylesheet" href="triangles/tri.css?v=1">
'''
TITRES = ['Les angles et les angles adjacents', 'Complémentaires, supplémentaires, opposés', 'Parallèles et sécante']
for n in (1, 2, 3):
    open(os.path.join(R, 'essil', f'angles-{n}.html'), 'w').write(TETE.format(titre=f'Les angles · {TITRES[n - 1]}') + f'''</head>
<body>
<main id="app"></main>
<!-- Les angles, leçon {n}/3 (21/11) : données essil/angles/lecons.js, moteur essil/angles/moteur.js (fabriqué par docs/angles/pages.py) -->
<script src="../famille.js"></script>
<script>window.ANGN = {n};</script>
<script src="angles/lecons.js?v=1"></script>
<script src="angles/moteur.js?v=1"></script>
</body></html>
''')
cartes = ''.join(f'''<a class="lecon" href="angles-{n}.html" data-n="{n}"><img src="angles/img/a{n}_{[0, 0, 0][n - 1]}.webp" alt=""><span><b>Leçon {n}</b>{t}</span><i class="et" id="e{n}"></i></a>''' for n, t in zip((1, 2, 3), TITRES))
open(os.path.join(R, 'essil', 'angles.html'), 'w').write(TETE.format(titre='Les angles · Essil') + '''<style>
.lecons{ display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:14px; margin-top:14px; }
.lecon{ display:flex; flex-direction:column; background:#fff; border-radius:22px; overflow:hidden; box-shadow:0 6px 0 #0002; text-decoration:none; color:var(--encre); }
.lecon img{ width:100%; aspect-ratio:16/9; object-fit:cover; } .lecon span{ padding:12px 16px 4px; font-size:19px; font-weight:800; display:flex; flex-direction:column; }
.lecon b{ font-family:'Baloo 2', sans-serif; color:var(--rouge); font-size:16px; } .lecon .et{ padding:0 16px 14px; color:#c99a00; font-style:normal; font-size:20px; }
.intro{ background:#fff; border-radius:20px; padding:14px 18px; box-shadow:0 4px 0 #0001; line-height:1.55; font-size:18px; }
</style>
</head>
<body>
<main id="app">
<div class="haut"><a class="chip" href="index.html">← Mon espace</a></div>
<div class="titre"><span class="num">📐</span><div><h1>Les angles</h1><p>3 leçons · programme de 5e</p></div></div>
<p class="intro">De la barrière du paddock à la porte de l'écurie, tu vas apprendre à <b>nommer et mesurer</b> les angles, reconnaître les <b>angles adjacents</b>, <b>complémentaires</b>, <b>supplémentaires</b> et <b>opposés par le sommet</b>, puis les angles <b>alternes-internes</b> et <b>correspondants</b> pour reconnaître des droites parallèles. Chaque leçon : un dessin animé, le cours au tableau, un atelier pour manipuler, le mémo, des flash cards et trois séries d'exercices.</p>
<div class="lecons">''' + cartes + '''</div>
</main>
<script src="../famille.js"></script>
<script>
// les étoiles de chaque leçon (sur 21) : copie de la tablette, puis celle du serveur
for(const n of [1, 2, 3]){ const k = 'essil-ang' + n, aff = d => { const e = d && d.etoiles ? Object.values(d.etoiles).reduce((a, b) => a + b, 0) : 0; document.getElementById('e' + n).textContent = '⭐ ' + e + ' / 21'; };
  try{ aff(JSON.parse(localStorage.getItem(k) || 'null')); }catch(e){ aff(null); }
  if(window.Famille) Famille.load(k, 'Essil').then(r => { const d = r && r[k], l = JSON.parse(localStorage.getItem(k) || 'null'); if(d && (!l || (d.t || 0) > (l.t || 0))) aff(d); }).catch(() => {}); }
</script>
</body></html>
''')
print('4 pages')
