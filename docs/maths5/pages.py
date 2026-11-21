"""Maths 5e · Essil (21/11) : fabrique essil/maths-5e-<n>.html (les 10 cours) et la page des cours essil/maths-5e.html."""
import re, os
R = os.path.join(os.path.dirname(__file__), '..', '..')
src = open(os.path.join(R, 'essil/maths5/lecons.js')).read()
L = [(int(m.group(1)), m.group(2), m.group(3).replace("\\'", "'"), m.group(4).replace("\\'", "'")) for m in re.finditer(r"\{ n:(\d+), icon:'([^']+)', titre:'((?:[^'\\]|\\.)*)', sous:'((?:[^'\\]|\\.)*)'", src)]
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
<title>{t}</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E%F0%9F%93%90%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800&display=swap">
<link rel="stylesheet" href="maths5/maths5.css?v=1">
'''
for n, ic, t, s in L:
    open(os.path.join(R, f'essil/maths-5e-{n}.html'), 'w').write(HEAD.format(t=f'Maths 5e · {t}') + f'''</head>
<body>
<main id="app"></main>
<!-- Maths 5e, cours {n}/10 (21/11) : données essil/maths5/lecons.js, moteur essil/maths5/moteur.js -->
<script src="../famille.js"></script>
<script>window.M5N = {n};</script>
<script src="maths5/lecons.js?v=1"></script>
<script src="maths5/moteur.js?v=1"></script>
</body></html>
''')
cartes = '\n'.join(f'    <a class="cours" href="maths-5e-{n}.html" data-k="essil-m5-{n}"><span class="num">{n}</span><b>{ic} {t}</b><small>{s}</small><i class="et"></i></a>' for n, ic, t, s in L)
open(os.path.join(R, 'essil/maths-5e.html'), 'w').write(HEAD.format(t='Maths 5e · Essil') + '''<style>
.wrapb{max-width:980px;margin:0 auto;padding:calc(14px + env(safe-area-inset-top)) 16px 40px}
.wrapb h1{font-family:'Baloo 2',sans-serif;font-size:clamp(34px,7vw,56px);margin:10px 0 0;line-height:1;color:#1f3c88}
.wrapb .lead{font-size:18px;margin:6px 0 16px}
.grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px}
.cours{position:relative;display:flex;flex-direction:column;gap:4px;background:#fff;border-radius:22px;padding:16px 16px 14px 70px;box-shadow:0 6px 0 #1f3c8822;text-decoration:none;color:inherit;min-height:120px}
.cours .num{position:absolute;left:14px;top:16px;width:44px;height:44px;border-radius:50%;background:#d7263d;color:#fff;display:grid;place-items:center;font:800 22px 'Baloo 2'}
.cours b{font-family:'Baloo 2',sans-serif;font-size:21px;line-height:1.1;color:#1f3c88}
.cours small{color:#5b6478;font-size:14px}
.cours .et{font-style:normal;font-weight:800;color:#c99a00}
.tableau-noir{background:#183028;border:10px solid #7a5230;border-radius:22px;color:#f4f1e6;padding:16px 20px;font-family:'Baloo 2',sans-serif;font-size:20px;margin-bottom:16px}
</style>
</head>
<body>
<div class="wrapb">
  <a class="chip" href="./">← Espace Essil</a>
  <h1>Maths 5e 📐</h1>
  <p class="lead">Le programme de 5e en 10 cours. Dans chacun : <b>une vidéo</b> qui explique pas à pas avec un exemple de la vraie vie, <b>le mémo</b> à relire, <b>des flash cards</b>, <b>des exercices</b> en 3 séries (les nombres changent à chaque fois) et ton bilan.</p>
  <div class="tableau-noir">Conseil du prof : une vidéo, puis le mémo, puis les flash cards le soir et les exercices le lendemain. C'est en revenant plusieurs fois qu'on retient ! ✏️</div>
  <div class="grille">
''' + cartes + '''
  </div>
</div>
<script src="../famille.js"></script>
<script>
document.querySelectorAll('.cours').forEach(a => { let d = null; try{ d = JSON.parse(localStorage.getItem(a.dataset.k) || 'null'); }catch(e){}
  const s = d && d.etoiles ? Object.values(d.etoiles).reduce((x, y) => x + y, 0) : 0; a.querySelector('.et').textContent = s ? '⭐ ' + s + ' / 15' : 'Pas encore commencé'; });
if(window.Famille && Famille.load){ for(let n = 1; n <= 10; n++) Famille.load('essil-m5-' + n, 'Essil').then(r => { const d = r && r['essil-m5-' + n], a = document.querySelector(`[data-k="essil-m5-${n}"]`); if(d && d.etoiles && a){ const s = Object.values(d.etoiles).reduce((x, y) => x + y, 0); if(s) a.querySelector('.et').textContent = '⭐ ' + s + ' / 15'; } }).catch(() => {}); }
</script>
</body></html>
''')
print(len(L), 'cours')
