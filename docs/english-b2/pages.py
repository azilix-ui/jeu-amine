"""English B2 · Essil (21/11) : fabrique essil/english-b2-<n>.html (les 10 leçons) et la page des leçons essil/english-b2.html."""
import re, json, os
R = os.path.join(os.path.dirname(__file__), '..', '..')
src = open(os.path.join(R, 'essil/english/lecons.js')).read()
lec = [(int(m.group(1)), m.group(2), m.group(3)) for m in re.finditer(r"\{ n:(\d+), icon:'([^']+)', titre:'((?:[^'\\]|\\.)*)'", src)]
TITRES = [(n, i, t.replace("\\'", "'")) for n, i, t in lec]
SOUS = [s.replace("\\'", "'") for s in re.findall(r"sous:'((?:[^'\\]|\\.)*)'", src)]
HEAD = '''<!doctype html>
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
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E%F0%9F%87%AC%F0%9F%87%A7%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800&display=swap">
'''
CSS = '''<style>
/* English B2 (21/11) : couleurs d'Essil (bleu nuit et rail rouge), un ciel de Sidi Bou Saïd */
:root{ --pen:#1f3c88; --plum:#d7263d; --sun:#f2c230; }
body{background:linear-gradient(#cfe7ff,#f3f8ff 40%,#fff8ec) fixed}
h1{color:#1f3c88}.lead,.help{color:#33415c;text-shadow:none}.en{color:#1f3c88;font-weight:800}
.b2band{width:100%;border-radius:22px;background:linear-gradient(90deg,#1f3c88,#2a5bd7);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;box-shadow:0 6px 0 #d7263d;font-family:'Baloo 2',sans-serif;font-size:22px}
.b2band a{background:#fff;color:#1f3c88;border-radius:14px;padding:6px 12px;font-size:16px;text-decoration:none}
.lettre{background:#fffdf5;border:2px solid #e8dcc0;border-radius:12px;padding:10px 14px;text-align:left;font-size:17px;line-height:1.5}
.tableau{width:100%;border-collapse:collapse;font-size:16px}.tableau th,.tableau td{border-bottom:1px solid #e3e8f2;padding:6px 8px;text-align:left}.tableau th{background:#eef2f8;white-space:nowrap}
.trou{color:#d7263d}
</style>
'''
for n, icon, t in TITRES:
    open(os.path.join(R, f'essil/english-b2-{n}.html'), 'w').write(HEAD.format(titre=f'English B2 · {t}') + '<link rel="stylesheet" href="../salma/ollie/cours.css?v=5">\n' + CSS +
      f'''</head>
<body>
<main class="wrap" id="app"></main>
<!-- English B2, leçon {n}/10 (21/11) : données essil/english/lecons.js, code essil/english/b2.js, moteur salma/ollie/cours.js -->
<script src="../famille.js"></script>
<script src="../amine/lire/voix.php"></script>
<script>window.B2N = {n};</script>
<script src="english/lecons.js?v=1"></script>
<script src="english/b2.js?v=1"></script>
<script src="../salma/ollie/cours.js?v=9"></script>
</body></html>
''')
cartes = '\n'.join(f'''    <a class="lec" href="english-b2-{n}.html" data-k="essil-en{n}"><img src="english/img/l{n}_0.webp" alt="" loading="lazy"><span class="num">{n}</span><b>{icon} {t}</b><small>{SOUS[k]}</small><i class="et"></i></a>''' for k, (n, icon, t) in enumerate(TITRES))
open(os.path.join(R, 'essil/english-b2.html'), 'w').write(HEAD.format(titre='English B2 · Essil') + CSS + '''<style>
.wrapb{max-width:980px;margin:0 auto;padding:calc(14px + env(safe-area-inset-top)) 16px 40px;font-family:Nunito,system-ui,sans-serif;color:#1c2340}
.wrapb h1{font-family:'Baloo 2',sans-serif;font-size:clamp(34px,7vw,56px);margin:10px 0 0;line-height:1}
.wrapb .lead{font-size:18px;margin:6px 0 16px}
.back{display:inline-flex;align-items:center;min-height:48px;padding:0 16px;border-radius:999px;background:#fff;box-shadow:0 4px 0 #0002;color:#1f3c88;font-weight:800;text-decoration:none}
.grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px}
.lec{position:relative;display:flex;flex-direction:column;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 6px 0 #1f3c8822;text-decoration:none;color:inherit;padding-bottom:12px}
.lec img{width:100%;aspect-ratio:16/9;object-fit:cover;background:#cfe7ff}
.lec .num{position:absolute;left:10px;top:10px;width:40px;height:40px;border-radius:50%;background:#d7263d;color:#fff;display:grid;place-items:center;font:800 20px 'Baloo 2'}
.lec b{font-family:'Baloo 2',sans-serif;font-size:21px;margin:8px 12px 0;line-height:1.1;color:#1f3c88}
.lec small{margin:2px 12px 0;color:#5b6478;font-size:14px}
.lec .et{font-style:normal;margin:6px 12px 0;font-weight:800;color:#c99a00}
</style>
</head>
<body>
<div class="wrapb">
  <a class="back" href="./">← Espace Essil</a>
  <h1>English B2 🇬🇧</h1>
  <p class="lead">10 leçons pour parler comme une vraie <b>B2</b> : chaque leçon commence par un dessin animé dont tu es l'héroïne, puis la grammaire, la conjugaison, le vocabulaire, l'oral et un bilan. Miss Yasmine te guide, Alice lit l'anglais.</p>
  <div class="grille">
''' + cartes + '''
  </div>
</div>
<script src="../famille.js"></script>
<script>
// les étoiles gagnées dans chaque leçon (8 étapes × 3 étoiles)
document.querySelectorAll('.lec').forEach(a => { let d = null; try{ d = JSON.parse(localStorage.getItem(a.dataset.k) || 'null'); }catch(e){}
  const s = d && d.stars ? Object.values(d.stars).reduce((x, y) => x + y, 0) : 0; a.querySelector('.et').textContent = s ? '⭐ ' + s + ' / 24' : 'Pas encore commencée'; });
if(window.Famille && Famille.track){ for(let n = 1; n <= 10; n++) Famille.load('essil-en' + n, 'Essil').then(r => { const d = r && r['essil-en' + n]; const a = document.querySelector(`[data-k="essil-en${n}"]`); if(d && d.stars && a){ const s = Object.values(d.stars).reduce((x, y) => x + y, 0); if(s) a.querySelector('.et').textContent = '⭐ ' + s + ' / 24'; } }).catch(() => {}); }
</script>
</body></html>
''')
print(len(TITRES), 'leçons')
