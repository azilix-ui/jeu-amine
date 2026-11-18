/* « La vie du Prophète ﷺ » : l'accueil, le film (images qui bougent doucement + voix), le livre (pages à tourner),
   les jeux de chaque enfant, les étoiles et la sauvegarde. Les textes et les jeux sont dans episodes.js.
   Les voix (ElevenLabs, api/voix.php) : papa = Jon (v=jon), maman = Céline, l'arabe = Mohammad. Les versets du Coran
   sont affichés (police Amiri Quran) mais jamais lus par la voix artificielle : seul leur sens en français est lu. */
// une même page pour chaque série : <body data-serie="prophete"> (la vie du Prophète ﷺ) ou "prophetes" (les histoires des prophètes)
const SERIE = document.body.dataset.serie || 'prophete';
const { EPISODES, COUVERTURE } = await import('../' + SERIE + '/episodes.js');

const $ = id => document.getElementById(id);
const IMG = n => (n === 'papa' || n === 'maman' ? 'prophete' : SERIE) + '/img/' + n + '.webp';
const VID = n => SERIE + '/vid/' + n + '.mp4';   // le dessin animé (saison 2) : une petite vidéo qui va et revient, à la place de l'image
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const melange = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const arabe = n => String(n);   // chiffres 1, 2, 3 (demande du papa, 18/11)
const NOMBRES_AR = ['', 'وَاحِد', 'اِثْنَان', 'ثَلَاثَة', 'أَرْبَعَة', 'خَمْسَة', 'سِتَّة', 'سَبْعَة', 'ثَمَانِيَة', 'تِسْعَة', 'عَشَرَة', 'أَحَدَ عَشَرَ'];
const DEBUT_VERSET = { 93:6, 9:40 };
/* 18/11 (demande du papa) : les versets sont récités par un vrai récitant, cheikh Mahmoud Khalil Al-Husary (murattal),
   enregistrements offerts en accès libre par Islamic Network (cdn.islamic.network, « an open CDN serving ayah audio »).
   Le numéro d'un verset dans tout le Coran = AVANT[sourate] + numéro du verset. La voix artificielle ne lit toujours que le sens. */
const AVANT = { 2:7, 9:1235, 11:1473, 12:1596, 19:2250, 20:2348, 21:2483, 93:6079, 96:6106, 105:6188 };
const RECIT = n => 'https://cdn.islamic.network/quran/audio/128/ar.husary/' + n + '.mp3';
async function recite(q, carte){   // joue les versets l'un après l'autre (le verset entendu s'allume) ; false si on a été interrompu
  stop(); const moi = jeton, d = q.d || DEBUT_VERSET[q.s] || 1;
  if(AVANT[q.s] == null) return true;
  for(let k = 0; k < q.v.length; k++){
    if(jeton !== moi) return false;
    const vs = carte ? carte.querySelectorAll('.vs') : []; vs.forEach((e, j) => e.classList.toggle('lit', j === k));
    const ok = await new Promise(res => { const a = audio = new Audio(RECIT(AVANT[q.s] + d + k)); let f = false; const fin = r => { if(!f){ f = true; res(r); } };
      a.onended = () => fin(true); a.onerror = () => fin(false); a.play().catch(() => fin(false)); });
    if(!ok && jeton === moi){ (carte ? carte.querySelectorAll('.vs') : []).forEach(e => e.classList.remove('lit')); return true; }   // pas de réseau : on continue sans la récitation
  }
  (carte ? carte.querySelectorAll('.vs') : []).forEach(e => e.classList.remove('lit'));
  return jeton === moi;
}

/* ---------- le joueur et ses étoiles ---------- */
let joueur = null, sv = { ep:{}, lang:'deux', t:0 };
const COURS = 'eveil-' + SERIE, cle = () => COURS + ':' + joueur;
function sauve(){ if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); }
const etoiles = n => { const e = sv.ep[n] || {}; return (e.vu ? 1 : 0) + (e.jeu ? 1 : 0) + (e.quiz ? 1 : 0); };
function note(n, quoi){ sv.ep[n] = sv.ep[n] || {}; if(!sv.ep[n][quoi]){ sv.ep[n][quoi] = true; sauve(); } }
async function setJoueur(n){
  joueur = n; sv = Object.assign({ ep:{}, lang:'deux', t:0 }, store.get(cle(), {}) || {});
  if(window.Famille && Famille.track){ Famille.track(COURS, n, [cle()]);
    try{ const r = await Famille.load(COURS, n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = Object.assign({ ep:{}, lang:'deux' }, d); store.set(cle(), sv); } }catch(e){} }
  listeAccueil(); if(EP && $('e-episode').classList.contains('on')) episode(EP.n);
}
async function choisirJoueur(){
  if(!window.Famille){ await setJoueur('Invité'); return; }
  const n = await Famille.choosePlayer({ title:'Qui regarde l’histoire ?', cancel:!!joueur,
    extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }],
    avatar:k => `<img src="/jeux/avatars/reel/${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` });
  if(n) await setJoueur(n);
}
const quelJeu = () => ({ Amine:'amine', Salma:'salma', Essil:'essil' }[joueur] || 'essil');

/* ---------- les voix ---------- */
let jeton = 0, audio = null;
const voixCoupee = () => !!(window.FamilleVoix && FamilleVoix.on && !FamilleVoix.on());
function morceaux(t){   // api/voix.php prend 400 caractères au plus : on coupe aux fins de phrases
  const ph = t.match(/[^.!?؟»]+[.!?؟»]*\s*/g) || [t], out = []; let cur = '';
  for(const p of ph){ if((cur + p).length > 380 && cur){ out.push(cur.trim()); cur = ''; } cur += p; }
  if(cur.trim()) out.push(cur.trim()); return out;
}
function stop(){ jeton++; if(audio){ try{ audio.pause(); }catch(e){} audio = null; } try{ speechSynthesis.cancel(); }catch(e){} }
const pause = ms => new Promise(r => setTimeout(r, ms));
// dit un texte : qui = 'papa' | 'maman' | 'ar'. Rend une promesse finie quand la voix a fini (ou le temps de lire, voix coupée)
async function dire(t, qui){
  stop(); const moi = jeton; if(!t) return true;
  if(voixCoupee()){ await pause(Math.max(2500, t.length * 60)); return jeton === moi; }
  const l = qui === 'ar' ? 'ar' : 'fr', v = qui === 'papa' ? '&v=jon' : '';
  for(const m of morceaux(t)){
    if(jeton !== moi) return false;
    const ok = await new Promise(res => {
      const a = audio = new Audio('/api/voix.php?l=' + l + '&t=' + encodeURIComponent(m) + v);
      let fini = false; const fin = r => { if(!fini){ fini = true; res(r); } };
      a.onended = () => fin(true); a.onerror = () => fin(false);
      a.play().catch(() => fin(false));
    });
    if(jeton !== moi) return false;
    if(!ok){   // pas de voix du site (hors ligne, plafond du mois) : la voix de la tablette
      await new Promise(res => { try{ const u = new SpeechSynthesisUtterance(m); u.lang = l === 'ar' ? 'ar' : 'fr-FR'; u.onend = u.onerror = () => res(); speechSynthesis.speak(u); setTimeout(res, Math.max(4000, m.length * 90)); }catch(e){ res(); } });
    }
  }
  return jeton === moi;
}

/* ---------- les écrans ---------- */
function ecran(id){ if(id !== 'e-film'){ const v = document.getElementById('f-vid'); if(v){ try{ v.pause(); }catch(e){} } } document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('on', e.id === id)); window.scrollTo(0, 0); }
function rondEtoiles(n){ const k = etoiles(n); return '<span class="et">' + [0, 1, 2].map(i => i < k ? '⭐' : '<i>☆</i>').join('') + '</span>'; }

function accueil(){ stop(); ecran('e-accueil'); listeAccueil(); }
function listeAccueil(){   // refaite aussi quand on change de joueur, sans quitter l'écran en cours (film, jeu…)
  $('qui').innerHTML = joueur ? `<img src="/jeux/avatars/reel/${esc(joueur.toLowerCase())}.webp" alt="" onerror="this.remove()"> ${esc(joueur)}` : '👤 Qui regarde ?';
  const total = EPISODES.reduce((a, e) => a + etoiles(e.n), 0);
  $('total').textContent = '⭐ ' + total + ' / ' + EPISODES.length * 3;
  $('liste').innerHTML = EPISODES.map(e => `<button class="carte" data-ep="${e.n}">
      <div class="vign" style="background-image:url(${IMG(e.img)})"><b>${e.n}</b></div>
      <div class="txt"><h3>${esc(e.titre)}</h3><p class="ar" lang="ar" dir="rtl">${esc(e.ar)}</p>${rondEtoiles(e.n)}</div></button>`).join('');
}

let EP = null;
function episode(n){
  stop(); EP = EPISODES.find(e => e.n === n); if(!EP) return accueil();
  ecran('e-episode');
  $('ep-img').style.backgroundImage = `url(${IMG(EP.img)})`;
  $('ep-num').textContent = 'Épisode ' + EP.n; $('ep-titre').textContent = EP.titre; $('ep-ar').textContent = EP.ar;
  $('ep-et').innerHTML = rondEtoiles(EP.n);
  const e = sv.ep[EP.n] || {};
  $('ep-film').classList.toggle('fait', !!e.vu); $('ep-jeu').classList.toggle('fait', !!e.jeu);
}

/* ---------- le film ---------- */
let F = null;   // { i, enPause }
function scenesFilm(){ return [...EP.scenes, { lecon:EP.lecon }]; }
function film(){ stop(); ecran('e-film'); F = { i:0, enPause:false, sens:0, tok:0 }; $('f-fin').hidden = true; $('f-lang').textContent = libLang(); joueScene(); }
const libLang = () => ({ fr:'FR', ar:'عربي', deux:'FR + عربي' }[sv.lang] || 'FR + عربي');
function montreScene(s){
  const im = $('f-img'), url = IMG(s.img || EP.img);
  F.sens = (F.sens + 1) % 4;
  im.className = 'f-img'; void im.offsetWidth; im.style.backgroundImage = `url(${url})`; im.classList.add('kb' + F.sens);
  const v = $('f-vid'), nomV = s.vid === true ? (s.img || EP.img) : s.vid;
  if(nomV){ v.poster = url; if(v.dataset.n !== nomV){ v.dataset.n = nomV; v.src = VID(nomV); } v.hidden = false; v.play().catch(() => {}); }
  else { v.hidden = true; try{ v.pause(); }catch(e){} }
  const b = $('f-bulle'), c = $('f-coran'), l = $('f-lecon');
  b.hidden = !s.qui; c.hidden = !s.coran; l.hidden = !s.lecon;
  if(s.qui){
    $('f-conteur').src = IMG(s.qui); $('f-nom').textContent = s.qui === 'papa' ? 'Papa raconte' : 'Maman raconte';
    $('f-fr').textContent = s.fr; $('f-fr').hidden = sv.lang === 'ar';
    $('f-arb').textContent = s.ar || ''; $('f-arb').hidden = sv.lang === 'fr' || !s.ar;
    $('f-mot').hidden = !s.mot; if(s.mot) $('f-mot').textContent = s.mot;
  }
  if(s.coran) c.innerHTML = carteCoran(s.coran);
  if(s.lecon){ $('f-lecon-fr').textContent = s.lecon.fr; $('f-lecon-ar').textContent = s.lecon.ar; }
  $('f-pos').textContent = (F.i + 1) + ' / ' + scenesFilm().length;
}
function carteCoran(q){
  const d = q.d || DEBUT_VERSET[q.s] || 1;
  return `<div class="cadre"><p class="sourate">📖 Sourate ${esc(q.nom)}</p>
    <p class="basmala" lang="ar" dir="rtl">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</p>
    <div class="versets" lang="ar" dir="rtl">${q.v.map((v, k) => `<span class="vs">${esc(v[0])} <span class="num">﴿${arabe(d + k)}﴾</span></span>`).join(' ')}</div>
    ${AVANT[q.s] != null ? '<p class="c"><button class="hp grand" data-recite>▶ Écouter la récitation</button></p>' : ''}
    <div class="sens">${q.v.map(v => `<p>${esc(v[1])}</p>`).join('')}</div>
    <p class="note">Récitation : cheikh Mahmoud Khalil Al-Husary (enregistrement en accès libre, Islamic Network). Le Coran n’est jamais lu par une voix d’ordinateur : elle lit seulement le sens en français. Répétez après le récitant, avec papa ou maman.</p></div>`;
}
async function joueScene(){
  const sc = scenesFilm(), s = sc[F.i]; if(!s) return;
  montreScene(s); const t = ++F.tok;
  $('f-play').textContent = F.enPause ? '▶' : '⏸';
  if(F.enPause) return;
  const encore = () => t === F.tok && !F.enPause && $('e-film').classList.contains('on');
  let ok = true;
  if(s.qui){
    if(sv.lang !== 'ar') ok = await dire(s.fr, s.qui);
    if(ok && encore() && sv.lang !== 'fr' && s.ar){ await pause(350); ok = encore() && await dire(s.ar, 'ar'); }
  } else if(s.coran){
    ok = await dire('Écoutons le Coran, dans la sourate ' + s.coran.nom.replace(/\(.*\)/, '').replace(/,.*$/, '') + '.', 'maman');
    if(ok && encore() && !voixCoupee()) ok = await recite(s.coran, $('f-coran'));
    if(ok && encore()) ok = await dire('Voici ce que cela veut dire : ' + s.coran.v.map(v => v[1]).join(' '), 'maman');
    if(ok) await pause(2500);
  } else if(s.lecon){
    ok = await dire('Ce que nous retenons : ' + s.lecon.fr, 'maman');
    if(ok && encore() && sv.lang !== 'fr'){ await pause(300); ok = encore() && await dire(s.lecon.ar, 'ar'); }
    if(ok && encore()){ note(EP.n, 'vu'); fete(); $('f-fin').hidden = false; }
    return;
  }
  if(!ok || !encore()) return;
  await pause(900);
  if(encore() && F.i < sc.length - 1){ F.i++; joueScene(); }
}
function va(d){ const sc = scenesFilm(); const i = Math.max(0, Math.min(sc.length - 1, F.i + d)); if(i === F.i) return; stop(); F.i = i; $('f-fin').hidden = true; joueScene(); }

/* ---------- le livre ---------- */
let L = 0;
function livre(){ stop(); ecran('e-livre'); L = 0; page(); }
function page(){
  const sc = scenesFilm(), s = sc[L];
  $('l-img').style.backgroundImage = `url(${IMG(s.img || EP.img)})`;
  let h = '';
  if(s.qui) h = `<p class="qui"><img src="${IMG(s.qui)}" alt=""> ${s.qui === 'papa' ? 'Papa' : 'Maman'}</p>
    <p class="fr">${esc(s.fr)} <button class="hp" data-dit="fr">🔊</button></p>
    ${s.ar ? `<p class="ar" lang="ar" dir="rtl">${esc(s.ar)} <button class="hp" data-dit="ar">🔊</button></p>` : ''}`;
  else if(s.coran) h = carteCoran(s.coran) + '<p class="c"><button class="hp grand" data-dit="sens">🔊 Écouter le sens</button></p>';
  else h = `<h3>🌟 Ce que nous retenons</h3><p class="fr">${esc(s.lecon.fr)} <button class="hp" data-dit="lfr">🔊</button></p><p class="ar" lang="ar" dir="rtl">${esc(s.lecon.ar)} <button class="hp" data-dit="lar">🔊</button></p>
    <p class="c"><button class="gros" data-va="jeu">🎮 Le jeu de l’épisode</button></p>`;
  $('l-texte').innerHTML = h; $('l-texte').scrollTop = 0;
  $('l-pos').textContent = (L + 1) + ' / ' + sc.length;
  $('l-prec').disabled = L === 0; $('l-suiv').disabled = L === sc.length - 1;
  if(L === sc.length - 1) note(EP.n, 'vu');
}
function ditPage(quoi){
  const s = scenesFilm()[L];
  if(quoi === 'fr') dire(s.fr, s.qui); else if(quoi === 'ar') dire(s.ar, 'ar');
  else if(quoi === 'sens') dire(s.coran.v.map(v => v[1]).join(' '), 'maman');
  else if(quoi === 'lfr') dire(s.lecon.fr, 'maman'); else if(quoi === 'lar') dire(s.lecon.ar, 'ar');
}

/* ---------- les jeux ---------- */
let J = null;
function jeu(qui){
  stop(); ecran('e-jeu'); qui = qui || quelJeu();
  document.querySelectorAll('[data-niv]').forEach(b => b.classList.toggle('on', b.dataset.niv === qui));
  J = { qui };
  const zone = $('j-zone'); zone.innerHTML = '';
  if(qui === 'amine') touche(zone, EP.jeux.amine);
  else if(qui === 'salma') ordre(zone, EP.jeux.salma);
  else quiz(zone, EP.jeux.essil.quiz, true);
}
function touche(zone, g){
  zone.innerHTML = `<div class="touche" style="background-image:url(${IMG(g.fond)})"><p class="consigne">${esc(g.consigne)} <button class="hp" data-dit-j="c">🔊</button><br><span class="ar" lang="ar" dir="rtl">${esc(g.ar)}</span></p><div class="compte" id="j-compte"></div></div>`;
  const t = zone.firstChild; let fait = 0;
  dire(g.consigne, 'maman');
  J.dit = () => dire(g.consigne, 'maman');
  // g.objets = [[emoji, nom arabe], …] (saison 2 : la voix dit le nom de l'animal en arabe) ; sinon g.objet répété g.n fois (la voix compte)
  const objs = g.objets || Array.from({ length:g.n }, () => [g.objet, '']), total = objs.length;
  for(let k = 0; k < total; k++){
    const o = document.createElement('button'); o.className = 'objet'; o.textContent = objs[k][0];
    o.style.left = (8 + Math.random() * 78) + '%'; o.style.top = (30 + Math.random() * 55) + '%'; o.style.animationDelay = (-Math.random() * 3) + 's';
    o.onclick = () => { if(o.classList.contains('pris')) return; o.classList.add('pris'); fait++;
      $('j-compte').innerHTML = `<b>${fait}</b> <span lang="ar">${objs[k][1] ? esc(objs[k][1]) : arabe(fait)}</span>`; dire(objs[k][1] || NOMBRES_AR[fait] || String(fait), 'ar');
      if(fait === total) setTimeout(async () => { note(EP.n, 'jeu'); await dire('Bravo ' + (joueur || '') + ' !', 'maman'); dire('أَحْسَنْتَ!', 'ar'); fete(); }, 900); };
    t.appendChild(o);
  }
}
function ordre(zone, g){
  const n = g.ordre.length, places = Array(n).fill(null);
  zone.innerHTML = `<p class="consigne">Remets l’histoire dans l’ordre : touche la première image, puis la suivante… <button class="hp" data-dit-j="c">🔊</button></p>
    <div class="cases">${g.ordre.map((_, k) => `<div class="case" data-k="${k}"><b>${k + 1}</b></div>`).join('')}</div>
    <div class="pioche">${melange(g.ordre.map((im, k) => k)).map(k => `<button class="piece" data-k="${k}" style="background-image:url(${IMG(g.ordre[k])})"></button>`).join('')}</div><div id="j-suite"></div>`;
  const consigne = 'Remets l’histoire dans l’ordre : touche la première image, puis la suivante.';
  J.dit = () => dire(consigne, 'maman'); dire(consigne, 'maman');
  let suivant = 0;
  zone.querySelectorAll('.piece').forEach(p => p.onclick = () => {
    const k = +p.dataset.k;
    if(k !== suivant){ p.classList.remove('non'); void p.offsetWidth; p.classList.add('non'); dire('Pas encore… regarde bien !', 'maman'); return; }
    const c = zone.querySelector(`.case[data-k="${k}"]`);
    c.innerHTML = `<div class="img" style="background-image:url(${IMG(g.ordre[k])})"></div><span>${esc(g.legendes[k])}</span>`; c.classList.add('ok'); p.remove();
    dire(g.legendes[k], 'maman'); suivant++; places[k] = true;
    if(suivant === n){ note(EP.n, 'jeu'); setTimeout(() => { fete(); $('j-suite').innerHTML = '<h3 class="c">Et maintenant, deux petites questions !</h3>'; const q = document.createElement('div'); $('j-suite').appendChild(q); quiz(q, g.quiz, false); }, 1600); }
  });
}
function quiz(zone, qs, melanger){
  const liste = melanger ? melange(qs) : qs.slice(); let i = 0, bons = 0;
  const box = document.createElement('div'); box.className = 'quiz'; zone.appendChild(box);
  function q(){
    if(i >= liste.length){
      const parfait = bons === liste.length || (liste.length >= 5 && bons >= 4);
      box.innerHTML = `<div class="fin"><h3>${bons} / ${liste.length} bonnes réponses</h3><p>${parfait ? '🌟 Bravo, une étoile de plus !' : 'C’est bien ! Regarde encore le film et réessaie.'}</p><button class="gros" data-rejouer>🔁 Rejouer</button> <button class="gros" data-va="accueil">🏠 Les épisodes</button></div>`;
      if(parfait){ note(EP.n, 'quiz'); fete(); dire('Bravo ! ' + bons + ' bonnes réponses sur ' + liste.length + '.', 'maman'); } else dire(bons + ' bonnes réponses. C’est bien, continue !', 'maman');
      box.querySelector('[data-rejouer]').onclick = () => jeu(J.qui); return;
    }
    const x = liste[i], ordre = melange(x.c.map((_, k) => k));
    box.innerHTML = `<p class="qn">Question ${i + 1} / ${liste.length}</p><h3>${esc(x.q)} <button class="hp" data-dq>🔊</button></h3>
      <div class="choix">${ordre.map(k => `<button data-c="${k}" ${/[؀-ۿ]/.test(x.c[k]) ? 'class="arc"' : ''}>${esc(x.c[k])}</button>`).join('')}</div><p class="ex" id="j-ex"></p>`;
    const lit = () => dire(x.q.replace(/[«»]/g, ''), 'maman'); box.querySelector('[data-dq]').onclick = lit; J.dit = lit;
    if(J.qui === 'salma') lit();
    box.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
      if(box.dataset.fige) return; box.dataset.fige = '1';
      const bon = +b.dataset.c === x.b; if(bon) bons++;
      b.classList.add(bon ? 'bon' : 'faux'); box.querySelector(`[data-c="${x.b}"]`).classList.add('bon');
      $('j-ex').textContent = (bon ? '✅ Oui ! ' : '❌ La bonne réponse : ' + x.c[x.b] + '. ') + (x.ex || '');
      dire(bon ? 'Oui, bravo !' : 'Non, la bonne réponse est : ' + x.c[x.b].replace(/\(.*\)/, ''), 'maman');
      setTimeout(() => { delete box.dataset.fige; i++; q(); }, bon ? 1800 : 3200);
    });
  }
  q();
}

/* ---------- la fête (étoiles qui tombent) ---------- */
function fete(){
  const f = $('fete'); f.innerHTML = '';
  for(let k = 0; k < 26; k++){ const s = document.createElement('i'); s.textContent = ['⭐', '✨', '🌙', '💛'][k % 4];
    s.style.left = Math.random() * 100 + '%'; s.style.animationDelay = Math.random() * .8 + 's'; s.style.fontSize = (20 + Math.random() * 22) + 'px'; f.appendChild(s); }
  f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 3200);
}

/* ---------- les boutons ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('button, [data-ep]'); if(!b) return;
  if(b.dataset.ep) return episode(+b.dataset.ep);
  if(b.hasAttribute('data-recite')){ const c = b.closest('.cadre'), sc = $('e-film').classList.contains('on') ? scenesFilm()[F.i] : scenesFilm()[L]; if(sc && sc.coran){ if($('e-film').classList.contains('on')){ F.enPause = true; $('f-play').textContent = '▶'; } recite(sc.coran, c); } return; }
  if(b.dataset.dit) return ditPage(b.dataset.dit);
  if(b.dataset.ditJ) return J && J.dit && J.dit();
  if(b.dataset.niv) return jeu(b.dataset.niv);
  const ou = b.dataset.va;
  if(ou === 'accueil') return accueil();
  if(ou === 'episode') return episode(EP.n);
  if(ou === 'film') return film();
  if(ou === 'livre') return livre();
  if(ou === 'jeu') return jeu();
  if(ou === 'suivant'){ const n = EP.n < EPISODES.length ? EP.n + 1 : 1; return episode(n); }
  if(b.id === 'qui') return choisirJoueur();
  if(b.id === 'f-play'){ F.enPause = !F.enPause; if(F.enPause) stop(); joueScene(); return; }
  if(b.id === 'f-prec') return va(-1);
  if(b.id === 'f-suiv') return va(1);
  if(b.id === 'f-lang'){ sv.lang = { deux:'fr', fr:'ar', ar:'deux' }[sv.lang] || 'deux'; sauve(); b.textContent = libLang(); stop(); joueScene(); return; }
  if(b.id === 'l-prec'){ if(L > 0){ stop(); L--; page(); } return; }
  if(b.id === 'l-suiv'){ if(L < scenesFilm().length - 1){ stop(); L++; page(); } return; }
});
document.addEventListener('keydown', e => {
  if($('e-film').classList.contains('on')){ if(e.key === 'ArrowRight') va(1); else if(e.key === 'ArrowLeft') va(-1); else if(e.key === ' '){ e.preventDefault(); $('f-play').click(); } else if(e.key === 'Escape') episode(EP.n); }
  else if($('e-livre').classList.contains('on')){ if(e.key === 'ArrowRight') $('l-suiv').click(); else if(e.key === 'ArrowLeft') $('l-prec').click(); }
});
// glisser le doigt pour tourner les pages du livre
let x0 = null; $('e-livre').addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive:true });
$('e-livre').addEventListener('touchend', e => { if(x0 == null) return; const d = e.changedTouches[0].clientX - x0; x0 = null; if(Math.abs(d) > 60) $(d < 0 ? 'l-suiv' : 'l-prec').click(); });
document.addEventListener('visibilitychange', () => { if(document.hidden){ stop(); if(F) F.enPause = true; } });

$('couv').style.backgroundImage = `url(${IMG(COUVERTURE)})`;
(async () => {
  let n = null; try{ n = window.Famille && Famille.player ? Famille.player() : null; }catch(e){}
  accueil(); if(n) await setJoueur(n); else choisirJoueur();
  const p = new URLSearchParams(location.search).get('ep'); if(p) episode(+p);
})();
