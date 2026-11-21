"""Anglais A1 (21/11) : fabrique les pages de « Salma & Pip » (salma/english-pip-<n>.html + salma/english-pip.html)
et de « Amine & Kiko » (amine/english-kiko-<n>.html + amine/english-kiko.html), d'après salma/pip/lecons.js et amine/kiko/lecons.js."""
import re, os
R = os.path.join(os.path.dirname(__file__), '..', '..')
V = {'cours': 8, 'lecons': 1, 'code': 1}
def lecons(path):
    src = open(os.path.join(R, path)).read()
    t = [(int(m.group(1)), m.group(2), m.group(3).replace("\\'", "'")) for m in re.finditer(r"\{ n:(\d+), icon:'([^']+)', titre:'((?:[^'\\]|\\.)*)'", src)]
    s = [x.replace("\\'", "'") for x in re.findall(r"sous:'((?:[^'\\]|\\.)*)'", src)]
    return [(n, i, ti, s[k]) for k, (n, i, ti) in enumerate(t)]
HEAD = '''<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Missaoui">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<script src="/site.js" defer></script>
<meta name="theme-color" content="{theme}">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{titre}</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E{ico}%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800&display=swap">
'''
CFG = {
  'pip': dict(dir='salma', js='pip', var='PIPN', data='pip/lecons.js', code='pip/pip.js', moteur='ollie/cours.js', css='ollie/cours.css?v=4', key='salma-pip', qui='Salma', theme='#1f6b44', ico='%F0%9F%95%8A%EF%B8%8F',
    titre='Salma & Pip', img='pip/img/p{n}_0.webp', max=24, couleur='#1f6b44', rail='#5aaedc',
    lead="10 leçons pour commencer l'anglais avec <b>Pip</b>, le bébé cigogne venu d'Angleterre. Chaque leçon commence par un dessin animé dont tu es l'héroïne, puis tu écoutes, tu répètes, tu lis, tu écris et tu parles avec Pip. Niveau <b>A1</b> ; les leçons 11 à 20 t'emmèneront au <b>A2</b>.",
    css2='''body{background:linear-gradient(#d6efff,#f2fbff 40%,#fff9ef) fixed}h1{color:#1f6b44}.lead,.help{color:#2d4a3a;text-shadow:none}.en{color:#1f6b44;font-weight:800}
.pipband{width:100%;border-radius:22px;background:linear-gradient(90deg,#1f6b44,#2f9a66);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;box-shadow:0 6px 0 #5aaedc;font-family:'Baloo 2',sans-serif;font-size:22px}
.pipband a{background:#fff;color:#1f6b44;border-radius:14px;padding:6px 12px;font-size:16px;text-decoration:none}
.tab{border-collapse:collapse;margin:6px 0}.tab td{border-bottom:1px solid #dfe8e2;padding:4px 10px}.trou{color:#d7263d}'''),
  'kiko': dict(dir='amine', js='kiko', var='KIKON', data='kiko/lecons.js', code='kiko/kiko.js', moteur='../salma/ollie/cours.js', css='../salma/ollie/cours.css?v=4', key='amine-kiko', qui='Amine', theme='#2a1f4f', ico='%F0%9F%90%AB',
    titre='Amine & Kiko', img='kiko/img/k{n}_0.webp', max=18, couleur='#2a1f4f', rail='#ff8c1a',
    lead="Kiko, le bébé chameau du désert, ne parle qu'anglais ! Avec lui, Amine écoute, répète et joue : 10 leçons, un dessin animé à chaque fois, et rien à lire.",
    css2='''body{background:linear-gradient(#ffe9c7,#fff6e6 45%,#fffdf8) fixed}h1{color:#2a1f4f}.lead,.help{color:#3b2f5e;text-shadow:none}
.kikoband{width:100%;border-radius:22px;background:linear-gradient(90deg,#2a1f4f,#4b3a8a);color:#fff1bf;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;box-shadow:0 6px 0 #ff8c1a;font-family:'Baloo 2',sans-serif;font-size:22px}
.kikoband a{background:#fff1bf;color:#2a1f4f;border-radius:14px;padding:6px 12px;font-size:16px;text-decoration:none}
.answers .ans .emo2{font-size:64px}.answers .ans b{display:block;font-size:22px}.emo{font-size:clamp(90px,18vw,140px)}'''),
}
for nom, c in CFG.items():
    L = lecons(os.path.join(c['dir'], c['data']))
    for n, icon, t, s in L:
        open(os.path.join(R, c['dir'], f'english-{nom}-{n}.html'), 'w').write(HEAD.format(titre=f"{c['titre']} · {t}", theme=c['theme'], ico=c['ico']) +
          f'''<link rel="stylesheet" href="{c['css']}">
<style>{c['css2']}</style>
</head>
<body>
<main class="wrap" id="app"></main>
<!-- {c['titre']}, leçon {n}/10 (21/11) : données {c['dir']}/{c['data']}, code {c['dir']}/{c['code']}, moteur salma/ollie/cours.js ; page fabriquée par docs/english-a1/pages.py -->
<script src="../famille.js"></script>
<script src="../amine/lire/voix.php"></script>
<script>window.{c['var']} = {n};</script>
<script src="{c['data']}?v={V['lecons']}"></script>
<script src="{c['code']}?v={V['code']}"></script>
<script src="{c['moteur']}?v={V['cours']}"></script>
</body></html>
''')
    cartes = '\n'.join(f'''    <a class="lec" href="english-{nom}-{n}.html" data-k="{c['key']}{n}"><img src="{c['img'].format(n=n)}" alt="" loading="lazy"><span class="num">{n}</span><b>{icon} {t}</b><small>{s}</small><i class="et"></i></a>''' for n, icon, t, s in L)
    open(os.path.join(R, c['dir'], f'english-{nom}.html'), 'w').write(HEAD.format(titre=c['titre'], theme=c['theme'], ico=c['ico']) + f'''<style>
{c['css2']}
.wrapb{{max-width:980px;margin:0 auto;padding:calc(14px + env(safe-area-inset-top)) 16px 40px;font-family:Nunito,system-ui,sans-serif;color:#1c2340}}
.wrapb h1{{font-family:'Baloo 2',sans-serif;font-size:clamp(34px,7vw,56px);margin:10px 0 0;line-height:1;color:{c['couleur']}}}
.wrapb .lead{{font-size:18px;margin:6px 0 16px}}
.back{{display:inline-flex;align-items:center;min-height:48px;padding:0 16px;border-radius:999px;background:#fff;box-shadow:0 4px 0 #0002;color:{c['couleur']};font-weight:800;text-decoration:none}}
.ecoute{{min-height:48px;border:0;border-radius:999px;padding:0 16px;margin-left:8px;background:{c['rail']};color:#fff;font:800 16px Nunito,sans-serif}}
.grille{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}}
.lec{{position:relative;display:flex;flex-direction:column;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 6px 0 {c['rail']}55;text-decoration:none;color:inherit;padding-bottom:12px}}
.lec img{{width:100%;aspect-ratio:16/9;object-fit:cover;background:#eee}}
.lec .num{{position:absolute;left:10px;top:10px;width:44px;height:44px;border-radius:50%;background:{c['rail']};color:#fff;display:grid;place-items:center;font:800 22px 'Baloo 2'}}
.lec b{{font-family:'Baloo 2',sans-serif;font-size:21px;margin:8px 12px 0;line-height:1.1;color:{c['couleur']}}}
.lec small{{margin:2px 12px 0;color:#5b6478;font-size:14px}}
.lec .et{{font-style:normal;margin:6px 12px 0;font-weight:800;color:#c99a00}}
</style>
</head>
<body>
<div class="wrapb">
  <a class="back" href="./">← Espace {c['qui']}</a>{'<button class="ecoute" id="ecoute">🔊 Écouter</button>' if nom == 'kiko' else ''}
  <h1>{c['titre']} 🇬🇧</h1>
  <p class="lead" id="lead">{c['lead']}</p>
  <div class="grille">
{cartes}
  </div>
</div>
<script src="../famille.js"></script>
<script>
// les étoiles gagnées dans chaque leçon (3 étoiles par étape)
const MAX = {c['max']}, KEY = '{c['key']}', QUI = '{c['qui']}';
const somme = d => d && d.stars ? Object.values(d.stars).reduce((x, y) => x + y, 0) : 0;
document.querySelectorAll('.lec').forEach(a => {{ let d = null; try{{ d = JSON.parse(localStorage.getItem(a.dataset.k) || 'null'); }}catch(e){{}}
  const s = somme(d); a.querySelector('.et').textContent = s ? '⭐ ' + s + ' / ' + MAX : 'Pas encore commencée'; }});
if(window.Famille && Famille.load){{ for(let n = 1; n <= 10; n++) Famille.load(KEY + n, QUI).then(r => {{ const d = r && r[KEY + n], a = document.querySelector(`[data-k="${{KEY + n}}"]`), s = somme(d); if(s && a) a.querySelector('.et').textContent = '⭐ ' + s + ' / ' + MAX; }}).catch(() => {{}}); }}
const ec = document.getElementById('ecoute'); if(ec) ec.onclick = () => {{ try{{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance("Kiko, le bébé chameau, ne parle qu'anglais ! Choisis une leçon, regarde le dessin animé, puis joue avec Kiko."); u.lang = 'fr-FR'; speechSynthesis.speak(u); }}catch(e){{}} }};
</script>
</body></html>
''')
    print(nom, len(L), 'leçons')
