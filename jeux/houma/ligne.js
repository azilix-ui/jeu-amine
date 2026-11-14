/* =====================================================================
   MA HOUMA EN LIGNE (14/11/2026, demandé par le papa)
   Les enfants jouent ensemble : qui est là, aller chez l'autre (on regarde, on joue, rien ne change chez lui),
   « Viens voir ! », la discussion (texte libre, émojis, phrases prêtes, messages vocaux) et le troc d'objets
   validé par les deux. Serveur : api/houma.php (les tablettes demandent les nouveautés toutes les 3 secondes).
   Chargé après le code de ma-houma.html : il utilise ses variables (S, player, place, go, panel, toast, say…).
   ===================================================================== */
(function(){
const API = '../api/houma.php';
const FAMILLE = ['Essil', 'Salma', 'Amine', 'Anis', 'Imen'];
const MAISON = { essil:'e-chambre', salma:'s-chambre', amine:'a-chambre' };
const EMOJIS = ['😀', '😂', '😍', '❤️', '👍', '👏', '🎉', '🐑', '🐔', '🥚', '🏠', '🚀'];
const PHRASES = ['Coucou !', 'Viens chez moi !', 'On échange ?', 'Bravo !', 'Trop beau !', 'Merci !', 'Je mange, à tout à l’heure !', 'Bonne nuit !'];
const PANIER_N = { oeuf:'un œuf', lait:'du lait', laine:'de la laine' };
const HL = window.HL = { visite:null, msgs:[], enLigne:[], trocs:[], dernier:0, pret:false, rec:null, rentre, aller:visite };
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const moi = () => cap(player || '');
const client = (() => { let c = store.get('houma-client', ''); if(!/^[0-9a-z]{8,40}$/.test(c)){ c = Math.random().toString(36).slice(2) + Date.now().toString(36); store.set('houma-client', c); } return c; })();
const lieuN = l => l && PLACES[l] ? PLACES[l].n : 'la carte du quartier';
const heure = ts => { const d = new Date(ts * 1000); return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); };
function tete(nom){ const k = String(nom).toLowerCase(); if(CH[k]) return AV + CH[k].img + '.webp';
  const h = window.Famille && Famille.head && Famille.head(nom); return h && h.img ? '../jeux/' + (h.img.split('/jeux/')[1] || 'avatars/mascotte-nour.webp') : AV + 'mascotte-nour.webp'; }
async function api(f, file){ const fd = new FormData(); Object.entries(f).forEach(([k, v]) => fd.append(k, v)); if(file) fd.append('audio', file, 'voix');
  const r = await fetch(API, { method:'POST', body:fd, cache:'no-store' }); let j = null; try{ j = await r.json(); }catch(e){}
  if(!r.ok || !j) throw new Error((j && j.error) || 'La houma en ligne ne répond pas. Réessaie dans un moment.'); return j; }

/* ---------- l'interface : boutons, bandeau de visite, têtes des amis, petites cartes ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
.tb .hlb{position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;border-radius:11px;background:var(--red);color:#fff;font-size:14px;line-height:22px;padding:0 5px;display:none}.tb .hlb.on{display:block}#bAmis,#bChat{position:relative}
#hlOn{position:fixed;right:max(10px,env(safe-area-inset-right));top:calc(var(--bar) + env(safe-area-inset-top) + 8px);z-index:25;display:flex;gap:6px}
#hlOn button{width:54px;height:54px;border-radius:50%;padding:0;border:3px solid #fff;background:#fff;box-shadow:0 3px 0 #0003;position:relative}#hlOn img{width:100%;height:100%;border-radius:50%;object-fit:cover}
#hlOn button::after{content:'';position:absolute;right:-2px;bottom:-2px;width:16px;height:16px;border-radius:50%;background:#2ecc71;border:3px solid #fff}
#hlVis{position:fixed;left:max(10px,env(safe-area-inset-left));top:calc(var(--bar) + env(safe-area-inset-top) + 8px);z-index:26;display:none;align-items:center;gap:10px;background:#fff;border:4px solid var(--sun);border-radius:999px;padding:4px 6px 4px 6px;box-shadow:0 4px 0 #0003;font-weight:800;font-size:18px;max-width:calc(100vw - 150px)}
#hlVis.on{display:flex}#hlVis img{width:42px;height:42px;border-radius:50%;object-fit:cover}#hlVis button{min-height:44px;border-radius:999px;background:var(--blue);color:#fff;font-weight:800;padding:0 14px;font-size:16px;white-space:nowrap}
#hlNotes{position:fixed;left:max(10px,env(safe-area-inset-left));bottom:calc(96px + env(safe-area-inset-bottom));z-index:55;display:grid;gap:8px;max-width:min(420px,calc(100vw - 20px))}
.hlnote{display:flex;align-items:center;gap:10px;background:#fff;border-radius:20px;padding:8px 10px;box-shadow:0 5px 0 #0003,0 0 0 3px var(--sun);font-weight:800;animation:hlin .35s cubic-bezier(.3,1.4,.6,1)}
.hlnote img{width:46px;height:46px;border-radius:50%;object-fit:cover;flex:none}.hlnote span{flex:1;font-size:16px;line-height:1.2}.hlnote button{min-height:44px;border-radius:14px;background:var(--blue);color:#fff;font-weight:800;padding:0 12px;flex:none}.hlnote .x{background:#e6edf6;color:var(--ink)}
@keyframes hlin{from{transform:translateY(30px);opacity:0}}
.hlami{display:flex;align-items:center;gap:10px;background:#eef4fb;border-radius:18px;padding:8px;margin:6px 0;text-align:left}.hlami img{width:56px;height:56px;border-radius:50%;object-fit:cover;flex:none;border:3px solid #fff}
.hlami .q{flex:1;min-width:0}.hlami b{display:block;font-size:19px}.hlami small{font-size:14px;color:#55657d}.hlami button{min-height:48px;border-radius:14px;background:var(--blue);color:#fff;font-weight:800;padding:0 10px;font-size:15px;flex:none}.hlami button.t{background:var(--jas)}
.hlmsgs{height:min(34vh,380px);overflow-y:auto;background:#f3f7fc;border-radius:18px;padding:8px;display:flex;flex-direction:column;gap:8px;text-align:left;user-select:text;-webkit-user-select:text}
.hlm{display:flex;gap:8px;align-items:flex-end;max-width:88%}.hlm.moi{align-self:flex-end;flex-direction:row-reverse}.hlm img{width:38px;height:38px;border-radius:50%;object-fit:cover;flex:none}
.hlm .b{background:#fff;border-radius:16px;padding:6px 10px;box-shadow:0 2px 0 #0001;font-size:17px;line-height:1.3;word-break:break-word}.hlm.moi .b{background:#d9ecff}.hlm .b small{display:block;font-size:12px;color:#7a879a;font-weight:800}
.hlm .b button{min-height:40px;border-radius:12px;background:var(--blue);color:#fff;font-weight:800;padding:0 10px;margin-top:4px}.hlm .b .ec{background:#e6edf6;color:var(--ink);min-height:34px;padding:0 8px;margin-left:4px}
.hlquick{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin:8px 0}.hlquick button{min-height:44px;min-width:44px;border-radius:12px;background:#eef4fb;font-size:22px;padding:0 6px}.hlquick .ph{font-size:15px;font-weight:800;padding:0 10px}
.hlsaisie{display:flex;gap:6px;align-items:center}.hlsaisie input{flex:1;min-width:0;height:52px;border-radius:16px;border:3px solid #c3cfdf;padding:0 12px;font:inherit;font-size:18px;user-select:text;-webkit-user-select:text}
.hlsaisie button{height:52px;min-width:52px;border-radius:16px;background:var(--blue);color:#fff;font-size:22px;font-weight:800;padding:0 12px}.hlsaisie .mic{background:var(--red)}.hlsaisie .mic.on{background:#8b1d1d;animation:hlpulse 1s infinite}
@keyframes hlpulse{50%{box-shadow:0 0 0 6px #d83a3a55}}
.hlobj{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;margin:8px 0;max-height:46vh;overflow-y:auto}
.hlobj button{background:#eef4fb;border-radius:16px;padding:6px 4px;display:grid;justify-items:center;gap:2px;font-size:13px;font-weight:800;line-height:1.1}.hlobj img{width:80px;height:80px;object-fit:contain}.hlobj button:active{background:var(--sun)}
.hlobj h4{grid-column:1/-1;margin:6px 0 0;text-align:left;font-size:16px}
.hlech{display:flex;align-items:center;justify-content:center;gap:12px;margin:10px 0;flex-wrap:wrap}.hlech div{display:grid;justify-items:center;background:#eef4fb;border-radius:18px;padding:8px 12px;font-weight:800;min-width:120px}.hlech img.o{width:96px;height:96px;object-fit:contain}.hlech img.t{width:40px;height:40px;border-radius:50%}.hlech .fl{font-size:40px}
</style>`);
$('bDisc').insertAdjacentHTML('beforebegin', `<button class="tb" id="bAmis" aria-label="Les amis de la houma : aller chez eux, échanger">👫<span class="hlb" id="hlBA"></span></button><button class="tb" id="bChat" aria-label="Discuter avec les autres">💬<span class="hlb" id="hlBC"></span></button>`);
document.body.insertAdjacentHTML('beforeend', `<div id="hlOn" aria-label="Qui est dans la houma"></div><div id="hlVis" role="status"></div><div id="hlNotes" aria-live="polite"></div>`);
$('bAmis').onclick = () => { sfx.tap(); amis(); };
$('bChat').onclick = () => { sfx.tap(); chat(); };
$('hlOn').onclick = e => { const b = e.target.closest('[data-n]'); if(b){ sfx.tap(); const p = HL.enLigne.find(x => x.nom === b.dataset.n); visite(b.dataset.n, p && !p.chez ? p.lieu : ''); } };

function note(nom, texte, bouton, action, ms = 9000){
  const el = document.createElement('div'); el.className = 'hlnote';
  el.innerHTML = `<img src="${tete(nom)}" alt=""><span>${esc(texte)}</span>${bouton ? `<button>${esc(bouton)}</button>` : ''}<button class="x" aria-label="Fermer">✕</button>`;
  const fin = () => el.remove();
  el.querySelector('.x').onclick = fin; if(bouton) el.querySelector('button').onclick = () => { fin(); action(); };
  $('hlNotes').appendChild(el); while($('hlNotes').children.length > 3) $('hlNotes').firstChild.remove();
  setTimeout(fin, ms);
}
function badges(){
  const lu = store.get('houma-lu:' + moi(), 0), n = HL.msgs.filter(m => m.id > lu && m.nom !== moi()).length;
  const a = HL.trocs.filter(aFaire).length;
  $('hlBC').textContent = n > 9 ? '9+' : n; $('hlBC').classList.toggle('on', n > 0);
  $('hlBA').textContent = a; $('hlBA').classList.toggle('on', a > 0);
  $('hlOn').innerHTML = HL.enLigne.filter(p => p.nom !== moi()).slice(0, 4).map(p => `<button data-n="${esc(p.nom)}" aria-label="${esc(p.nom)} est là : aller chez ${esc(p.nom)}"><img src="${tete(p.nom)}" alt=""></button>`).join('');
}
const aFaire = t => (t.a === moi() && t.statut === 'offre') || (t.de === moi() && t.statut === 'contre');

/* ---------- le va-et-vient avec le serveur ---------- */
let enCours = false;
async function salut(){
  if(enCours || !player || document.hidden) return; enCours = true;
  try{
    const r = await api({ action:'salut', client, nom:moi(), lieu:place || '', chez:HL.visite ? HL.visite.nom : '', depuis:HL.dernier });
    HL.enLigne = r.en_ligne || [];
    const nouveaux = (r.msgs || []).filter(m => m.id > HL.dernier);
    if(nouveaux.length){ HL.msgs = HL.msgs.concat(nouveaux).slice(-120); HL.dernier = Math.max(HL.dernier, ...nouveaux.map(m => m.id)); if(HL.pret) nouveaux.filter(m => m.nom !== moi()).forEach(annonce); }
    HL.trocs = r.trocs || []; trocs();
    HL.pret = true; if($('hlMsgs')) listeMsgs(); else badges();
  }catch(e){}
  enCours = false;
}
setInterval(salut, 3000);
document.addEventListener('visibilitychange', () => { if(!document.hidden) salut(); });
let dernierJoueur = null;
setInterval(() => { if(player !== dernierJoueur){ dernierJoueur = player; HL.msgs = []; HL.dernier = 0; HL.pret = false; salut(); } }, 500);

function annonce(m){
  const ouvert = !!$('hlMsgs');
  if(m.type === 't'){ const t = `${m.nom} dit : ${m.texte}`; sfx.tap(); if(ouvert) say(t); else note(m.nom, t, 'Répondre', chat); if(!ouvert) say(t); }
  else if(m.type === 'v'){ tone(880, .1, 'sine', .08); tone(1170, .12, 'sine', .08, .12); if(!ouvert) note(m.nom, `🎤 ${m.nom} t'envoie un message vocal`, '▶ Écouter', () => joue(m.id)); say(`${m.nom} t'envoie un message vocal`); }
  else if(m.type === 'm'){ sfx.star(); note(m.nom, `📣 ${m.nom} te montre ${lieuN(m.lieu)} !`, '🚪 J’y vais', () => { closePanel(); visite(m.nom, m.lieu); }, 15000); say(`${m.nom} te montre ${lieuN(m.lieu)}. Viens voir !`); }
}

/* ---------- aller chez un ami ---------- */
let rafraichit = 0;
async function visite(nom, lieu){
  if(!player) return; if(nom === moi()){ rentre(); return; }
  const r = window.Famille && await Famille.load('houma', nom), d = r && r['houma:' + nom];
  if(!d){ toast(`${nom} n'a pas encore de monde dans la houma 🏗️`); return; }
  if(!HL.visite){ found('chezami'); saveNow(); HL.visite = { nom, mien:S, retour:place || 'map', t:0 }; }
  HL.visite.nom = nom; HL.visite.t = d.t || 0; S = fill(JSON.parse(JSON.stringify(d)));
  const p = HL.enLigne.find(x => x.nom === nom && !x.chez);
  const but = PLACES[lieu] ? lieu : p && PLACES[p.lieu] ? p.lieu : MAISON[nom.toLowerCase()] || 'm-salon';
  closePanel(); sfx.open(); go(but); bandeau();
  toast(`Bienvenue chez ${nom} ! Tu peux regarder et jouer : rien ne change chez ${nom}.`, 4200);
  clearInterval(rafraichit); rafraichit = setInterval(suitAmi, 6000);
}
// pendant la visite : le monde de l'ami se met à jour quand il change quelque chose (il arrive 15 à 20 secondes après)
async function suitAmi(){
  if(!HL.visite || D || $('veil').classList.contains('on')) return; const nom = HL.visite.nom;
  const r = await Famille.load('houma', nom), d = r && r['houma:' + nom];
  if(!HL.visite || HL.visite.nom !== nom || !d || (d.t || 0) <= HL.visite.t || D) return;
  HL.visite.t = d.t || 0; S = fill(d); if(place) render();
}
function rentre(){
  if(!HL.visite) return; clearInterval(rafraichit);
  S = HL.visite.mien; const r = HL.visite.retour; HL.visite = null; bandeau();
  sfx.close(); go(PLACES[r] ? r : 'map'); toast('Te revoilà chez toi 🏡');
}
function bandeau(){ const b = $('hlVis'); if(!HL.visite){ b.classList.remove('on'); b.innerHTML = ''; return; }
  b.innerHTML = `<img src="${tete(HL.visite.nom)}" alt=""><span>Chez ${esc(HL.visite.nom)}</span><button id="hlRentre">🏡 Rentrer chez moi</button>`; b.classList.add('on');
  $('hlRentre').onclick = rentre; }

/* ---------- le panneau des amis ---------- */
function amis(){
  if(!player){ choose(); return; }
  const noms = [...new Set(FAMILLE.concat(HL.enLigne.map(p => p.nom)))].filter(n => n !== moi());
  const etat = n => { const p = HL.enLigne.find(x => x.nom === n); return !p ? 'n’est pas là en ce moment' : p.chez ? `🟢 est chez ${esc(p.chez)}` : `🟢 est là : ${esc(lieuN(p.lieu))}`; };
  const T = HL.trocs.filter(t => ['offre', 'contre'].includes(t.statut));
  const montre = place && isRoom(place) && !HL.visite;
  panel(`<h2>👫 La houma en ligne</h2><p>Va chez tes amis, montre-leur ta maison et échangez des objets.</p>
    ${noms.map(n => `<div class="hlami"><img src="${tete(n)}" alt=""><div class="q"><b>${esc(n)}</b><small>${etat(n)}</small></div><button data-v="${esc(n)}">🚪 Aller chez ${esc(n)}</button><button class="t" data-t="${esc(n)}">🤝 Échanger</button></div>`).join('')}
    ${T.length ? `<p><b>🤝 Les échanges en cours</b></p>${T.map(t => { const de = t.de === moi(); const qui = de ? t.a : t.de; const txt = de ? (t.statut === 'offre' ? `Tu proposes ${t.donne.n} à ${qui}. On attend sa réponse.` : `${qui} a répondu !`) : (t.statut === 'offre' ? `${qui} te propose ${t.donne.n}.` : `Tu as répondu à ${qui}. On attend.`);
      return `<div class="hlami"><img src="${decoRoot}${t.donne.t}.webp" alt="" style="border-radius:12px;background:#fff"><div class="q"><b>${esc(qui)}</b><small>${esc(txt)}</small></div>${aFaire(t) ? `<button data-x="${t.id}">👀 Voir</button>` : ''}<button class="t" data-an="${t.id}" style="background:#c3cfdf;color:var(--ink)">Annuler</button></div>`; }).join('')}` : ''}
    ${montre ? `<button class="pill" id="hlMontre">📣 Viens voir ! Montrer ${esc(lieuN(place))}</button><br>` : ''}
    ${HL.visite ? `<button class="pill" id="hlR2">🏡 Rentrer chez moi</button><br>` : ''}<button class="pill ghost" data-close>Fermer</button>`);
  $('panel').querySelectorAll('[data-v]').forEach(b => b.onclick = () => visite(b.dataset.v));
  $('panel').querySelectorAll('[data-t]').forEach(b => b.onclick = () => propose(b.dataset.t));
  $('panel').querySelectorAll('[data-x]').forEach(b => b.onclick = () => { const t = HL.trocs.find(x => x.id === +b.dataset.x); if(t) ouvreTroc(t); });
  $('panel').querySelectorAll('[data-an]').forEach(b => b.onclick = async () => { try{ await api({ action:'annule', id:b.dataset.an, nom:moi() }); toast('Échange annulé'); await salut(); amis(); }catch(e){ toast(e.message); } });
  if($('hlMontre')) $('hlMontre').onclick = async () => { try{ await api({ action:'montre', nom:moi(), lieu:place, titre:lieuN(place) }); closePanel(); toast('📣 Les autres sont prévenus ! Ils peuvent venir voir.'); found('montrer'); salut(); }catch(e){ toast(e.message); } };
  if($('hlR2')) $('hlR2').onclick = () => { closePanel(); rentre(); };
}

/* ---------- le troc ---------- */
const monde = () => HL.visite ? HL.visite.mien : S;
function mesObjets(){ const w = monde(), L = [];
  Object.entries(w.panier || {}).forEach(([t, n]) => { if(n > 0 && PANIER_N[t]) L.push({ g:'🧺 Mon panier', o:{ k:'p', t, n:PANIER_N[t] }, c:n }); });
  Object.entries(w.deco || {}).forEach(([u, d]) => { const K = KAT[d.t]; if(K) L.push({ g:(PLACES[d.p] ? PLACES[d.p].n : 'Ma maison'), o:{ k:'d', t:d.t, u, n:K.n, g:d.k || 1 } }); });
  return L; }
function choisir(titre, texte, cb, plus, avant){
  const L = mesObjets(); let g = '';
  panel(`<h2>${titre}</h2>${avant || ''}<p>${texte}</p><div class="hlobj">${L.length ? L.map((x, i) => (x.g !== g ? `<h4>${esc(g = x.g)}</h4>` : '') + `<button data-i="${i}"><img src="${decoRoot}${x.o.t}.webp" alt="" loading="lazy"><span>${esc(x.o.n.replace(/^(le |la |les |l'|l’)/, ''))}${x.c > 1 ? ' ×' + x.c : ''}</span></button>`).join('') : '<p style="grid-column:1/-1">Tu n’as encore rien à échanger : décore ta maison ou ramasse des œufs à la ferme !</p>'}</div>${plus || ''}<button class="pill ghost" data-close>Retour</button>`);
  $('panel').querySelector('.hlobj').onclick = e => { const b = e.target.closest('[data-i]'); if(b){ sfx.tap(); cb(L[+b.dataset.i].o); } };
  say(texte);
}
function propose(ami){
  choisir(`🤝 Échanger avec ${esc(ami)}`, `Quel objet veux-tu proposer à ${ami} ?`, async o => {
    try{ await api({ action:'propose', de:moi(), a:ami, donne:JSON.stringify(o) }); closePanel(); toast(`🤝 Proposition envoyée à ${ami} ! Il va choisir ce qu'il te donne.`); salut(); }catch(e){ toast(e.message); } });
}
function ouvreTroc(t){
  if(t.a === moi() && t.statut === 'offre'){
    choisir(`🤝 ${esc(t.de)} te propose…`, `${t.de} te propose ${t.donne.n}. Que donnes-tu en échange ?`, async o => {
      try{ await api({ action:'repond', id:t.id, nom:moi(), contre:JSON.stringify(o) }); closePanel(); toast(`C'est envoyé ! ${t.de} doit dire d'accord 🤝`); salut(); }catch(e){ toast(e.message); salut(); } },
      `<button class="pill" id="hlCadeau">🎁 Je ne donne rien : c'est un cadeau ?</button><br><button class="pill red" id="hlNon">Non merci</button><br>`, `<div class="hlech"><div><img class="o" src="${decoRoot}${t.donne.t}.webp" alt="">${esc(t.donne.n)}<small>de ${esc(t.de)}</small></div></div>`);
    $('hlCadeau').onclick = async () => { try{ await api({ action:'repond', id:t.id, nom:moi(), contre:'' }); closePanel(); toast(`Tu as demandé à ${t.de} si c'est un cadeau 🎁`); salut(); }catch(e){ toast(e.message); } };
    $('hlNon').onclick = async () => { try{ await api({ action:'repond', id:t.id, nom:moi(), non:1 }); closePanel(); toast('Tu as dit non merci'); salut(); }catch(e){ toast(e.message); } };
    return;
  }
  if(t.de === moi() && t.statut === 'contre'){
    const c = t.contre, txt = c ? `${t.a} te donne ${c.n} contre ${t.donne.n}. D'accord ?` : `${t.a} voudrait ${t.donne.n} en cadeau. D'accord ?`;
    panel(`<h2>🤝 ${esc(t.a)} a répondu !</h2><p>${esc(txt)}</p><div class="hlech"><div><img class="o" src="${decoRoot}${t.donne.t}.webp" alt="">${esc(t.donne.n)}<small>tu donnes</small></div><span class="fl">⇄</span><div>${c ? `<img class="o" src="${decoRoot}${c.t}.webp" alt="">${esc(c.n)}` : '<span style="font-size:70px">🎁</span>rien : un cadeau'}<small>tu reçois</small></div></div>
      <button class="pill" id="hlOui">✅ D'accord !</button><br><button class="pill red" id="hlNon2">❌ Non</button><br><button class="pill ghost" data-close>Plus tard</button>`);
    say(txt);
    $('hlOui').onclick = async () => { try{ await api({ action:'conclut', id:t.id, nom:moi(), oui:1 }); echange(t.donne, c); closePanel(); sfx.star(); toast(c ? `Échange fait ! Tu as reçu ${c.n} 🎉` : `Tu as offert ${t.donne.n} à ${t.a} 🎁`); found('troc'); salut(); }catch(e){ toast(e.message); salut(); } };
    $('hlNon2').onclick = async () => { try{ await api({ action:'conclut', id:t.id, nom:moi(), oui:0 }); closePanel(); toast('Échange refusé'); salut(); }catch(e){ toast(e.message); } };
  }
}
const appliques = new Set();
function trocs(){
  const vus = store.get('houma-trocs-vus:' + moi(), []), marque = k => { if(!vus.includes(k)){ vus.push(k); store.set('houma-trocs-vus:' + moi(), vus.slice(-200)); return true; } return false; };
  HL.trocs.forEach(t => {
    if(t.a === moi() && t.statut === 'fait' && !t.app_b && !appliques.has(t.id)){ appliques.add(t.id);
      api({ action:'applique', id:t.id, nom:moi() }).then(r => { if(!r.ok) return; echange(t.contre, t.donne); sfx.star(); found('troc');
        note(t.de, t.contre ? `🎉 Échange fait avec ${t.de} : tu as reçu ${t.donne.n} !` : `🎁 ${t.de} t'offre ${t.donne.n} !`, '', null, 12000); say(t.contre ? `Échange fait ! Tu as reçu ${t.donne.n}` : `${t.de} t'offre ${t.donne.n}`); }).catch(() => appliques.delete(t.id));
      return; }
    if(!HL.pret) { marque(t.id + t.statut); return; }   // au premier passage : on ne réveille pas les vieilles nouvelles
    if(aFaire(t) && marque(t.id + t.statut)){ const qui = t.a === moi() ? t.de : t.a; const txt = t.statut === 'offre' ? `🤝 ${qui} te propose ${t.donne.n} !` : `🤝 ${qui} a répondu à ton échange !`;
      sfx.star(); note(qui, txt, '👀 Voir', () => ouvreTroc(t), 20000); say(txt); }
    if(['non', 'perime'].includes(t.statut) && t.de === moi() && marque(t.id + t.statut)) note(t.a, `${t.a} a dit non merci pour ${t.donne.n}`, '', null);
    if(t.statut === 'annule' && marque(t.id + t.statut)) note(t.de === moi() ? t.a : t.de, `L'échange de ${t.donne.n} est annulé`, '', null);
  });
}
// l'échange dans MON monde : on enlève ce que je donne, on range ce que je reçois chez moi
function echange(donne, recu){
  const w = monde(), cur = S; S = w;
  try{
    if(donne){ if(donne.k === 'p'){ w.panier[donne.t] = Math.max(0, (w.panier[donne.t] || 0) - 1); }
      else { const u = w.deco[donne.u] ? donne.u : Object.keys(w.deco).find(k => w.deco[k].t === donne.t); if(u) enleve(w, u); } }
    if(recu){ if(recu.k === 'p'){ w.panier[recu.t] = (w.panier[recu.t] || 0) + 1; }
      else { const B = MB[recu.t] || {}, ferme = B.ferme !== undefined, pid = ferme ? 'f-enclos' : MAISON[moi().toLowerCase()] || 'm-salon';
        const u = addDeco(recu.t, 340 + Math.round(Math.random() * 600), null, pid, true); if(u){ w.deco[u].k = Math.max(.35, Math.min(3, +recu.g || 1)); } } }
    w.t = Date.now();
  } finally { S = cur; }
  if(HL.visite) store.set('houma:' + player, w); else { saveNow(); if(place) render(); }
}
function enleve(w, uid){ const d = w.deco[uid];
  Object.values(w.deco).forEach(o => { if(o.on === uid){ o.on = ''; o.y = Math.max(FLOOR_Y[0], Math.min(FLOOR_Y[1], d.y)); } });
  Object.values(w.chars).forEach(c => { if((c.a || '').startsWith(uid + ':')){ c.a = ''; c.pose = ''; c.y = 664; } });
  delete w.deco[uid]; delete (w.ferme || {})[uid]; if(!HL.visite){ delete FIXED['d:' + uid]; if(sel === uid) unselect(); } }

/* ---------- la discussion ---------- */
function chat(){
  if(!player){ choose(); return; }
  panel(`<h2>💬 On discute</h2><div class="hlmsgs" id="hlMsgs" aria-live="polite"></div>
    <div class="hlquick">${EMOJIS.map(e => `<button data-q="${e}">${e}</button>`).join('')}</div>
    <div class="hlquick">${PHRASES.map(p => `<button class="ph" data-q="${esc(p)}">${esc(p)}</button>`).join('')}</div>
    <div class="hlsaisie"><input id="hlTxt" maxlength="300" placeholder="Écris ici…" enterkeyhint="send" autocomplete="off"><button id="hlEnv" aria-label="Envoyer">➤</button><button class="mic" id="hlMic" aria-label="Enregistrer un message vocal">🎤</button></div>
    <p id="hlMsgErr" style="color:var(--red);min-height:1.2em;margin:4px 0"></p><button class="pill ghost" data-close>Fermer</button>`);
  listeMsgs();
  $('panel').querySelectorAll('[data-q]').forEach(b => b.onclick = () => envoie(b.dataset.q));
  $('hlEnv').onclick = () => envoie($('hlTxt').value);
  $('hlTxt').onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); envoie($('hlTxt').value); } };
  $('hlMic').onclick = micro;
  $('hlMsgs').onclick = e => { const b = e.target.closest('button'); if(!b) return;
    if(b.dataset.son) joue(+b.dataset.son); else if(b.dataset.lit) say(b.dataset.lit); else if(b.dataset.va){ const m = HL.msgs.find(x => x.id === +b.dataset.va); if(m){ closePanel(); visite(m.nom, m.lieu); } } };
}
function listeMsgs(){ const el = $('hlMsgs'); if(!el) return; const bas = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  el.innerHTML = HL.msgs.length ? HL.msgs.map(m => { const mien = m.nom === moi();
    const corps = m.type === 'v' ? `<button data-son="${m.id}">▶ 🎤 ${m.duree} s</button>` : m.type === 'm' ? `📣 Viens voir ${esc(m.texte || lieuN(m.lieu))} !${mien ? '' : `<br><button data-va="${m.id}">🚪 J'y vais</button>`}` : `${esc(m.texte)}<button class="ec" data-lit="${esc(m.texte)}" aria-label="Écouter">🔊</button>`;
    return `<div class="hlm${mien ? ' moi' : ''}"><img src="${tete(m.nom)}" alt=""><div class="b"><small>${esc(m.nom)} · ${heure(m.ts)}</small>${corps}</div></div>`; }).join('') : '<p style="text-align:center;color:#7a879a">Personne n’a encore écrit. Dis coucou ! 👋</p>';
  if(bas || !el.dataset.vu){ el.scrollTop = el.scrollHeight; el.dataset.vu = 1; }
  if(HL.dernier) store.set('houma-lu:' + moi(), HL.dernier); badges(); }
async function envoie(t){ t = String(t || '').trim(); if(!t) return; const err = $('hlMsgErr');
  try{ await api({ action:'dit', nom:moi(), texte:t }); if($('hlTxt') && $('hlTxt').value.trim() === t) $('hlTxt').value = ''; if(err) err.textContent = ''; sfx.tap(); found('bavard'); await salut(); }
  catch(e){ if(err) err.textContent = e.message; else toast(e.message); } }
let lecteur = null;
function joue(id){ try{ if(lecteur) lecteur.pause(); hush(); lecteur = new Audio(API + '?son=' + id); lecteur.play().catch(() => toast('Le message vocal ne veut pas se lire 😕')); }catch(e){} }

// le message vocal : on touche 🎤 pour parler, on touche encore pour envoyer (60 secondes au plus)
async function micro(){
  const b = $('hlMic'), err = $('hlMsgErr');
  if(HL.rec){ HL.rec.stop(); return; }
  if(!navigator.mediaDevices || !window.MediaRecorder){ err.textContent = 'Cette tablette ne sait pas enregistrer la voix ici.'; return; }
  let flux; try{ flux = await navigator.mediaDevices.getUserMedia({ audio:true }); }catch(e){ err.textContent = 'Le micro n’est pas autorisé : il faut dire « Autoriser » quand la tablette le demande.'; return; }
  const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  const rec = HL.rec = new MediaRecorder(flux, type ? { mimeType:type } : undefined), bouts = [], t0 = Date.now();
  if(lecteur) lecteur.pause(); hush();
  rec.ondataavailable = e => { if(e.data && e.data.size) bouts.push(e.data); };
  const tic = setInterval(() => { const s = Math.round((Date.now() - t0) / 1000); if($('hlMic')) $('hlMic').textContent = '⏹ ' + s + ' s'; if(s >= 60) rec.stop(); }, 250);
  rec.onstop = async () => { clearInterval(tic); flux.getTracks().forEach(t => t.stop()); HL.rec = null;
    if($('hlMic')){ $('hlMic').textContent = '🎤'; $('hlMic').classList.remove('on'); }
    const duree = Math.round((Date.now() - t0) / 1000); if(duree < 1){ if(err) err.textContent = 'Garde le doigt un peu plus : parle, puis touche ⏹.'; return; }
    const blob = new Blob(bouts, { type:rec.mimeType || type || 'audio/webm' });
    if(err) err.textContent = 'J’envoie ton message…';
    try{ await api({ action:'voix', nom:moi(), duree }, blob); if(err) err.textContent = ''; sfx.star(); found('bavard'); salut(); }catch(e){ if(err) err.textContent = e.message; } };
  rec.start(250); b.classList.add('on'); b.textContent = '⏹ 0 s'; err.textContent = 'Parle maintenant… puis touche ⏹ pour envoyer.';
}
})();
