# Fabrique salma/ardoise-arabe.html à partir de l'Ardoise magique d'Amine (amine/ardoise-magique.html) :
# même scène 3D, même correction ; les modèles viennent de salma/ardoise/lettres-ar.js (traces.py).
# Rejouable : python3 docs/ardoise-arabe/fabrique_page.py
import pathlib, re
R = pathlib.Path(__file__).resolve().parents[2]
s = (R / 'amine/ardoise-magique.html').read_text()

def rep(a, b, n=1):
    global s
    c = s.count(a)
    assert c == n, (c, a[:80])
    s = s.replace(a, b)

def rx(p, b):
    global s
    s2, c = re.subn(p, b, s, flags=re.S)
    assert c == 1, p[:80]
    s = s2

rep("<title>L'Ardoise magique</title>", "<title>L'Ardoise arabe de Salma</title>")
rep("/* L'Ardoise magique : Amine apprend à écrire les lettres sur une ardoise en 3D, dans le monde de Serpent Légendes.",
    "/* L'Ardoise arabe : Salma apprend à écrire les lettres arabes (seules, au début, au milieu, à la fin d'un mot),\n   sur la même ardoise 3D que l'Ardoise magique d'Amine, dans le monde de Serpent Légendes.")
# styles en plus : nom des lettres, mot d'exemple en arabe
rep("family=Sniglet:wght@400;800&family=Fredoka:wght@400;500;600&display=swap", "family=Sniglet:wght@400;800&family=Fredoka:wght@400;500;600&family=Noto+Naskh+Arabic:wght@700&display=swap")
rep('content:"⭐ le plus important"', 'content:"⭐ pour commencer"')
rep("@media (prefers-reduced-motion:reduce)",
    ".lt small{font-size:14px;color:var(--mist);font-weight:600}\n.ar{font-family:'Noto Naskh Arabic','Geeza Pro','Arial',serif;direction:rtl;unicode-bidi:isolate}\n"
    ".word{cursor:pointer;pointer-events:auto;min-height:52px;display:inline-flex;align-items:center;gap:8px}\n.word .ar{font-size:30px;line-height:1}\n"
    ".title p{margin:6px 0 0;font-size:clamp(26px,4.5vw,40px);color:#fff;text-shadow:0 3px 0 #0006}\n@media (prefers-reduced-motion:reduce)")
rep('<img src="ardoise-amine.webp" alt="Amine devant son ardoise magique, avec le serpent">',
    '<img src="ardoise/ardoise-salma.webp" alt="Salma devant son ardoise, avec le serpent" onerror="this.remove()">')
rep('''<a class="back" href="./">← Les jeux d'Amine</a>''', '''<a class="back" href="./">← L'espace de Salma</a>''')
rep('''<div class="title"><h1>L'Ardoise <span>magique</span></h1></div>''',
    '''<div class="title"><h1>L'Ardoise <span>arabe</span></h1><p class="ar">لَوْحَتِي السِّحْرِيَّة</p></div>''')
rx(r'<div class="tiles">.*?</div>\n    <div class="row">', '''<div class="tiles">
      <button class="tile star" data-style="iso"><canvas width="300" height="140" data-prev="iso:ba"></canvas><b>Toute seule</b><small>la lettre isolée</small></button>
      <button class="tile" data-style="ini"><canvas width="300" height="140" data-prev="ini:ba"></canvas><b>Au début</b><small>au début d'un mot</small></button>
      <button class="tile" data-style="med"><canvas width="300" height="140" data-prev="med:ba"></canvas><b>Au milieu</b><small>au milieu d'un mot</small></button>
      <button class="tile" data-style="fin"><canvas width="300" height="140" data-prev="fin:ba"></canvas><b>À la fin</b><small>à la fin d'un mot</small></button>
    </div>
    <div class="row">''')
rep('<script src="lettres.js"></script>', '<script src="ardoise/lettres-ar.js"></script>')
rep("const LT = window.LETTRES;", "const LT = window.LETTRES_AR;")

# ---------- données ----------
rx(r"const KEY = 'amine-ecriture';.*?const WORDS = \{[^\n]*\n",
   r"""const KEY = 'salma-arabe';
const fresh = () => ({ stars:{}, done:{}, tickets:0, cards:[], slate:{ frame:'bois', board:'vert', chalk:'blanche' }, t:0 });
let data = Object.assign(fresh(), store.get(KEY, {}));
function save(){ data.t = Date.now(); store.set(KEY, data); }
const totalStars = () => Object.values(data.stars).reduce((a, b) => a + b, 0);
const SK = { iso:'i', ini:'d', med:'m', fin:'f' };
const IDS = Object.keys(LT);
// l'ordre de l'alphabet ; au début et au milieu, seulement les lettres qui s'attachent à gauche
const ORDER = { iso:IDS, fin:IDS.filter(id => LT[id].f.fin), ini:IDS.filter(id => LT[id].f.ini), med:IDS.filter(id => LT[id].f.med) };
const NAMES = Object.fromEntries(IDS.map(id => [id, LT[id].fr]));
const WORDS = { alif:['أَرْنَب','🐇','un lapin'], ba:['بَطَّة','🦆','un canard'], ta:['تُفَّاحَة','🍎','une pomme'], tha:['ثَعْلَب','🦊','un renard'], jim:['جَمَل','🐪','un chameau'],
  ha:['حِصَان','🐴','un cheval'], kha:['خَرُوف','🐑','un mouton'], dal:['دُبّ','🐻','un ours'], dhal:['ذِئْب','🐺','un loup'], ra:['رِيشَة','🪶','une plume'], zay:['زَرَافَة','🦒','une girafe'],
  sin:['سَمَكَة','🐟','un poisson'], shin:['شَمْس','☀️','le soleil'], sad:['صَقْر','🦅','un faucon'], dad:['ضِفْدَع','🐸','une grenouille'], tta:['طَائِرَة','✈️','un avion'], zza:['ظَرْف','✉️','une enveloppe'],
  ayn:['عِنَب','🍇','du raisin'], ghayn:['غَيْمَة','☁️','un nuage'], fa:['فِيل','🐘','un éléphant'], qaf:['قِطّ','🐱','un chat'], kaf:['كَلْب','🐶','un chien'], lam:['لَيْمُون','🍋','un citron'],
  mim:['مَوْز','🍌','une banane'], nun:['نَحْلَة','🐝','une abeille'], hha:['هِلَال','🌙','un croissant de lune'], waw:['وَرْدَة','🌹','une rose'], ya:['يَد','✋','une main'] };
const FORME = { iso:'toute seule', ini:'au début d\'un mot', med:'au milieu d\'un mot', fin:'à la fin d\'un mot' };
""")

# ---------- voix : le français par Céline, les noms arabes par Mohammad (explorateur.js → api/voix.php) ----------
rep("function speak(t){ try{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'fr-FR'; if(frVoice) u.voice = frVoice; u.rate = .92; u.pitch = 1.1; speechSynthesis.speak(u); }catch(e){} }",
    """function utt(t, ar){ const u = new SpeechSynthesisUtterance(t); u.lang = ar ? 'ar' : 'fr-FR'; if(!ar && frVoice) u.voice = frVoice; u.rate = .92; return u; }
// parle([['fr', '…'], ['ar', '…'], …]) : une suite de morceaux, chacun dans sa langue
function parle(parts){ try{ speechSynthesis.cancel(); parts.forEach(([l, t]) => t && speechSynthesis.speak(utt(t, l === 'ar'))); }catch(e){} }
function speak(t){ parle([['fr', t]]); }
const nomAr = id => LT[id] ? LT[id].ar : '';""")
rep("function say(t, voice = true){ $('say').textContent = t; if(voice) speak(t); }",
    "function say(t, voice = true, ar){ $('say').textContent = t; if(voice) parle(ar ? [['fr', t.split(' · ')[0]], ['ar', ar]] : [['fr', t]]); }")

# ---------- pièces : une lettre arabe dans une de ses 4 formes ----------
rx(r"function piece\(style, text\)\{.*?\n\}\n", """function piece(style, text){
  const g = LT[text] && (LT[text].f[style] || LT[text].f.iso), strokes = [];
  if(g) g.s.forEach((d, i) => { const s = sample(d); strokes.push({ pts:s.pts, len:s.len, dot:s.len < 3, d, dx:0, k:(g.k || '')[i] }); });
  return { style, text, w:g ? g.w : 10, strokes };
}
""")
# hauteurs : les lettres arabes descendent sous la ligne (jusqu'à ~116) ; cadre de 10 à 120
rep("const s = Math.min((H - 10) / 100, (W - 16) / P.w), ox = (W - P.w * s) / 2, oy = (H - 100 * s) / 2 - 10 * s;",
    "const s = Math.min((H - 10) / 110, (W - 16) / P.w), ox = (W - P.w * s) / 2, oy = (H - 110 * s) / 2 - 10 * s;")
rep("[15, 50, 80, 105].forEach(y =>", "[15, 50, 80, 112].forEach(y =>")
rep("""  const s = Math.min(7.4, (BW - 170) / P.w, (BH - 60) / 112);
  lay = { s, ox:(BW - P.w * s) / 2, oy:(BH - 100 * s) / 2 - 10 * s };""",
    """  const s = Math.min(7.2, (BW - 220) / P.w, (BH - 60) / 114);
  lay = { s, ox:(BW - P.w * s) / 2, oy:(BH - 110 * s) / 2 - 10 * s };""")
rep("[105, 'rgba(255,255,255,.22)', 2]]", "[112, 'rgba(255,255,255,.22)', 2]]")
# modèle en petit (« tout seul ») : en haut à droite, car l'arabe commence à droite
rep("const ms = s * .32, mx = 34, my = 18;", "const ms = s * .32, mx = BW - 34 - P.w * ms, my = 14;")
rep("g.fillRect(mx - 10, my, P.w * ms + 20, 108 * ms);", "g.fillRect(mx - 10, my, P.w * ms + 20, 118 * ms);")
rep("P.strokes.forEach(st => { g.beginPath(); st.pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](mx + p.x * ms, my + (p.y - 8) * ms)); g.stroke(); });",
    "P.strokes.forEach(st => { g.beginPath(); st.pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](mx + p.x * ms, my + (p.y - 8) * ms)); st.dot && g.lineTo(mx + st.pts[0].x * ms + .5, my + (st.pts[0].y - 8) * ms); g.stroke(); });")
# ardoise au repos : ب ت ث… écrit de droite à gauche
rep("g.globalAlpha = .9; const P = piece('cursive', 'amine'); const s = Math.min(5, (BW - 300) / P.w), ox = (BW - P.w * s) / 2, oy = BH * .5 - 70 * s;",
    """g.globalAlpha = .9; const row = ['alif', 'ba', 'ta', 'jim'].map(id => piece('iso', id)), gap = 14, Wt = row.reduce((a, p) => a + p.w + gap, -gap);
  const s = Math.min(5.2, (BW - 260) / Wt), oy = BH * .5 - 70 * s; let x = (BW + Wt * s) / 2;
  g.strokeStyle = g.fillStyle; g.lineWidth = s * 2.6; g.lineCap = 'round'; g.lineJoin = 'round';
  row.forEach(P => { x -= P.w * s; const ox = x; x -= gap * s;""")
rep("""  g.strokeStyle = g.fillStyle; g.lineWidth = s * 2.6; g.lineCap = 'round'; g.lineJoin = 'round';
  P.strokes.forEach(st => { g.beginPath(); st.pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](ox + p.x * s, oy + p.y * s)); if(st.dot) g.lineTo(ox + st.pts[0].x * s + .5, oy + st.pts[0].y * s); g.stroke(); });
  g.restore();""",
    """  P.strokes.forEach(st => { g.beginPath(); st.pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](ox + p.x * s, oy + p.y * s)); if(st.dot) g.lineTo(ox + st.pts[0].x * s + .5, oy + st.pts[0].y * s); g.stroke(); }); });
  g.restore();""")

# ---------- correction ----------
rep("return strokeFail('Mets le point juste au-dessus !');", "return strokeFail(st.pts[0].y > 80 ? 'Mets le point à sa place, en dessous !' : 'Mets le point à sa place, au-dessus !');")
rep("say(pick(['Bravo !', 'Super !', 'Magnifique !', 'Très bien Amine !']));", "say(pick(['Bravo !', 'Super !', 'Magnifique !', 'Très bien Salma !']));")
rep("else say(L.P.strokes.length > 1 ? 'Très bien ! Maintenant le trait suivant, au point vert.' : 'Très bien !');",
    "else say(L.P.strokes[L.si].dot ? 'Très bien ! Maintenant le point : touche le rond vert.' : 'Très bien ! Maintenant le trait suivant, au point vert.');")
# « tout seul » : les points comptent aussi (ث = 1 trait + 3 points)
rep("const tplAll = L.P.strokes.flatMap(st => st.dot ? [] : st.pts).map(U);", "const tplAll = L.P.strokes.flatMap(st => st.pts).map(U);")
rep("const strokesOk = Math.abs(L.cur.length - L.P.strokes.filter(st => !st.dot).length) <= 2;",
    "const nCorps = L.P.strokes.filter(st => !st.dot).length, strokesOk = L.cur.length >= Math.max(1, nCorps - 1) && L.cur.length <= L.P.strokes.length + 2;")
rep("if(user.length < 5){ say('Écris la lettre sur l\\'ardoise, puis appuie sur ✔.'); return; }",
    "if(user.length < 5){ say('Écris la lettre sur l\\'ardoise, de droite à gauche, puis appuie sur ✔.'); return; }")

# ---------- déroulé ----------
rep("""  const w = !word ? WORDS[text.toLowerCase()] : null;
  $('word').textContent = w ? `${w[1]} ${w[0]}` : (style === 'caps' ? 'AMINE' : 'amine');""",
    """  const w = WORDS[text];
  $('word').innerHTML = w ? `${w[1]} <span class="ar" lang="ar">${w[0]}</span>` : '';
  $('word').onclick = () => { if(w) parle([['ar', w[0]], ['fr', w[2]]]); };""")
rep("const name = L.text.length > 1 ? 'ton prénom' : `la lettre ${L.style === 'caps' ? 'majuscule ' : ''}${NAMES[L.text.toLowerCase()]}`;",
    "const name = `la lettre ${NAMES[L.text]}`, ar = nomAr(L.text), forme = FORME[L.style];")
rep("if(L.phase === 'demo'){ const me = L; say(`Regarde bien comment on écrit ${name}${L.style === 'cursive' ? ' en attaché' : ''}.`); await sleep(1600);",
    "if(L.phase === 'demo'){ const me = L; say(`Regarde bien comment on écrit ${name}, ${forme} · ${ar}`, true, ar); await sleep(2600);")
rep("else { say(L.plan.indexOf('free') === L.step ? `Maintenant, écris ${name} tout seul ! Puis appuie sur ✔.` : 'Encore une fois tout seul !'); }",
    "else { say(L.plan.indexOf('free') === L.step ? `Maintenant, écris ${name} toute seule, de droite à gauche ! Puis appuie sur ✔.` : 'Encore une fois toute seule !'); }")
rep("  const word = text.length > 1;\n", "  const word = false;\n")
rep("  const txt = L.text.length > 1 ? 'ton prénom' : (L.style === 'caps' ? L.text : L.text);\n", "")
rep("box.innerHTML = `<h2>Bravo Amine !</h2>", "box.innerHTML = `<h2>Bravo Salma !</h2>")
rep("show('win'); speak(`Bravo Amine ! ${stars} étoile${stars > 1 ? 's' : ''} !`);",
    "show('win'); parle([['fr', `Bravo Salma ! ${stars} étoile${stars > 1 ? 's' : ''} !`], ['ar', 'أَحْسَنْتِ']]);")
rep("function nextLetter(style, text){ if(text.length > 1 || !ORDER[style]) return null;", "function nextLetter(style, text){ if(!ORDER[style]) return null;")

# ---------- écrans ----------
rep("const TITLES = { cursive:'✍️ Attaché', caps:'🅰️ MAJUSCULES', script:'🔤 minuscules', prenom:'🧒 Mon prénom' };",
    "const TITLES = { iso:'Toute seule', ini:'Au début du mot', med:'Au milieu du mot', fin:'À la fin du mot' };")
rep("let curStyle = 'cursive';", "let curStyle = 'iso';")
rep("const items = style === 'prenom' ? [['caps', 'AMINE', 'p:caps'], ['cursive', 'amine', 'p:cur'], ['script', 'amine', 'p:script']] : ORDER[style].map(ch => [style, ch, SK[style] + ':' + ch]);",
    "const items = ORDER[style].map(id => [style, id, SK[style] + ':' + id]);")
rep('''aria-label="${tx}" style="${st === 'cursive' && tx.length > 1 || tx.length > 1 ? 'grid-column:span 2' : ''}"><canvas width="${tx.length > 1 ? 400 : 200}" height="170"></canvas><span class="st">''',
    '''aria-label="${NAMES[tx]}"><canvas width="200" height="170"></canvas><small>${NAMES[tx]}</small><span class="st">''')
rep("""  const st = { cursive:'l\\'écriture attachée', caps:'les majuscules', script:'les minuscules', prenom:'ton prénom' }[style];
  speak(`Choisis une lettre${style === 'prenom' ? '' : ''} pour ${st}. La lettre qui brille, c'est la prochaine !`);""",
    """  speak(style === 'iso' ? 'Choisis une lettre. La lettre qui brille, c\\'est la prochaine !' : `Voici les lettres ${FORME[style]}. Choisis une lettre. La lettre qui brille, c'est la prochaine !`);""")
rep("const serp = store.get('serpent3d:Amine', null);", "const serp = store.get('serpent3d:Salma', null);")
rep('''$('introGo').onclick = () => { sfx.tap(); show('home'); speak("Bonjour Amine ! Choisis ton cahier."); };
setTimeout(() => speak('Bonjour Amine ! Choisis : l\\'écriture attachée, les majuscules, les minuscules, ou ton prénom.'), 600);''',
    '''$('introGo').onclick = () => { sfx.tap(); show('home'); parle([['ar', 'مَرْحَبًا سَلْمَى'], ['fr', 'Choisis ton cahier : la lettre toute seule, au début, au milieu ou à la fin d\\'un mot.']]); };
setTimeout(() => parle([['fr', 'Bonjour Salma ! Sur cette ardoise, tu vas apprendre à écrire les lettres arabes. En arabe, on écrit de droite à gauche !']]), 600);''')
rep("  try{ Famille.setPlayer && Famille.player() !== 'Amine' && null; }catch(e){}\n", "")
rep("Famille.track('amine-ecriture', 'Amine', [KEY]);", "Famille.track('salma-arabe', 'Salma', [KEY]);")
rep("Famille.load('amine-ecriture', 'Amine')", "Famille.load('salma-arabe', 'Salma')")
rep("window.__ardoise = {", "window.__ardoise = { LT, ORDER, WORDS,")
assert 'Amine' not in s.split('<script type="module">')[1].replace('Ardoise magique', ''), [l for l in s.splitlines() if 'Amine' in l]
(R / 'salma/ardoise-arabe.html').write_text(s)
print('ok', len(s))
