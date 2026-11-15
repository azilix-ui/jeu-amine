/* Chkobba : les voix de la famille. Chacun peut prêter sa voix à un adversaire (Si Hamadi, Am Lamine, Fethi, Si Mokhtar)
   ou au commentateur, pour chaque situation du jeu. Les voix sont gardées sur le site (api/chkobba_voix.php)
   et jouées pendant la partie, en plus des bulles écrites. */
const API = new URL('../../api/chkobba_voix.php', import.meta.url).href;
const IMG = new URL('./img/', import.meta.url).href;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export const QUI = [
  { id:'garde', nom:'Si Hamadi' }, { id:'marchand', nom:'Am Lamine' }, { id:'voleur', nom:'Fethi' }, { id:'controleur', nom:'Si Mokhtar' },
  { id:'commentateur', nom:'Le commentateur', emoji:'🎙️' },
];
const SITU_PERSO = [
  ['chk', 'Quand il fait une chkobba', '« Chkobba ! Tfarrej ! »'],
  ['haya', 'Quand il prend la haya (7♦)', '« El haya mte3i ! »'],
  ['boude', 'Quand on lui fait une chkobba', '« Yaa khsara… »'],
  ['pose', 'Quand il réfléchit et pose une carte', '« Hmm… à toi, ya sghir ! »'],
  ['gagne', 'Quand il gagne la partie', '« Barcha behi ! »'],
  ['perd', 'Quand il perd la partie', '« Mabrouk, t\'as gagné ! »'],
];
const SITU_COMM = [
  ['debut', 'Au début de chaque manche (on coupe, on distribue)', '« Allez, on distribue ! »'],
  ['chk', 'Quand quelqu\'un fait une chkobba', '« Ouuuh, chkobba ! »'],
  ['haya', 'Quand quelqu\'un prend la haya', '« La haya est partie ! »'],
  ['manche', 'À la fin de chaque manche', '« On compte les points ! »'],
  ['gagne', 'Quand tu gagnes la partie', '« Bravo, champion ! »'],
  ['perd', 'Quand tu perds la partie', '« Ce sera pour la prochaine ! »'],
];
export const situations = p => p === 'commentateur' ? SITU_COMM : SITU_PERSO;

let liste = {}, getAC = () => null, joue = null, finJoue = 0;
const BUF = {};
const ON = () => { try{ return localStorage.getItem('chkobba-voix') !== 'non'; }catch(e){ return true; } };
const url = (p, s, id) => API + '?son=' + p + '-' + s + '-' + id;

export function init(ac){ getAC = ac; return charge(); }
export async function charge(){ try{ liste = (await fetch(API + '?liste=1', { cache:'no-store' }).then(r => r.json())).voix || {}; }catch(e){ liste = {}; } return liste; }
async function tampon(k){ if(BUF[k] !== undefined) return BUF[k]; BUF[k] = null; const a = getAC(); if(!a) return null;
  try{ const b = await fetch(k).then(r => { if(!r.ok) throw 0; return r.arrayBuffer(); }); BUF[k] = await new Promise((ok, ko) => a.decodeAudioData(b, ok, ko)); }catch(e){ BUF[k] = false; } return BUF[k]; }
/* préparer à l'avance les voix des personnages présents (pour qu'elles partent tout de suite) */
export function prepare(persos){ for(const p of persos) for(const s in (liste[p] || {})) for(const v of liste[p][s]) tampon(url(p, s, v.id)); }
export const a = (p, s) => !!(liste[p] && liste[p][s] && liste[p][s].length);
/* dire une phrase : false s'il n'y a pas de voix ou si quelqu'un parle déjà */
export function dit(p, s){
  if(!ON() || !a(p, s) || performance.now() < finJoue) return false;
  const l = liste[p][s], v = l[Math.floor(Math.random() * l.length)], k = url(p, s, v.id), b = BUF[k], ctx = getAC();
  if(b && ctx){ const src = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = 1.3; src.buffer = b; src.connect(g); g.connect(ctx.destination); src.start(); finJoue = performance.now() + b.duration * 1000 + 200; return true; }
  const au = new Audio(k); au.play().catch(() => {}); finJoue = performance.now() + 2500; au.onloadedmetadata = () => { finJoue = performance.now() + au.duration * 1000; }; tampon(k); return true;
}

/* ---------- le studio : enregistrer, écouter, garder, enlever ---------- */
let choix = 'garde', rec = null;
export function studio(el, qui, retour){
  const on = ON(), Q = QUI.find(q => q.id === choix), l = liste[choix] || {};
  el.innerHTML = `<p style="margin:0 0 10px">Prête ta voix aux joueurs de la chkobba ! Choisis qui parle, puis enregistre une petite phrase (8 secondes au plus) pour chaque moment du jeu. Tu peux en mettre plusieurs : le jeu en choisit une au hasard.</p>
    <div class="choix" id="vOn"><button data-v="oui" class="${on ? 'on' : ''}">🔊 Entendre les voix en jouant</button><button data-v="non" class="${on ? '' : 'on'}">🔇 Seulement les bulles</button></div>
    <h2 style="margin-top:12px">Qui parle ?</h2>
    <div class="qui">${QUI.map(q => `<button data-q="${q.id}" class="${q.id === choix ? 'on' : ''}">${q.emoji ? `<span class="emo">${q.emoji}</span>` : `<img src="${IMG}${q.id}-malin.webp" alt="">`}<b>${q.nom}</b><small>${Object.values(liste[q.id] || {}).reduce((n, v) => n + v.length, 0)} voix</small></button>`).join('')}</div>
    <h2 style="margin-top:14px">${choix === 'commentateur' ? 'La voix du commentateur' : 'La voix de ' + esc(Q.nom)}</h2>
    ${situations(choix).map(([s, t, ex]) => `<div class="situ" data-s="${s}"><div><b>${t}</b><small>Par exemple : ${ex}</small></div>
      <div class="clips">${(l[s] || []).map(v => `<span class="clip"><button data-ecoute="${v.id}" title="Écouter">▶</button>${esc(v.de || '')}<button data-enleve="${v.id}" title="Enlever">🗑️</button></span>`).join('')}
      <button class="rec" data-rec="${s}">🎙️ Enregistrer</button></div></div>`).join('')}
    <p class="err" id="vErr" style="color:#b42318;font-weight:800"></p>`;
  el.onclick = async e => {
    const b = e.target.closest('button'); if(!b) return; const err = el.querySelector('#vErr');
    if(b.parentElement.id === 'vOn'){ try{ localStorage.setItem('chkobba-voix', b.dataset.v); }catch(x){} return studio(el, qui, retour); }
    if(b.dataset.q){ choix = b.dataset.q; return studio(el, qui, retour); }
    const s = b.closest('.situ') && b.closest('.situ').dataset.s;
    if(b.dataset.ecoute){ const au = new Audio(url(choix, s, b.dataset.ecoute)); au.play().catch(() => {}); return; }
    if(b.dataset.enleve){ if(!confirm('Enlever cette voix ?')) return; await envoie({ action:'enleve', perso:choix, situation:s, id:b.dataset.enleve }).catch(x => err.textContent = x.message); await charge(); return studio(el, qui, retour); }
    if(b.dataset.rec){ if(rec){ rec.stop(); return; } enregistre(b, s, el, qui, retour).catch(x => { err.textContent = x.message; rec = null; }); }
    if(b.dataset.garde){ const blob = b._blob; b.disabled = true; b.textContent = '⏳';
      try{ const f = new FormData(); f.append('action', 'ajoute'); f.append('perso', choix); f.append('situation', s); f.append('de', qui() || ''); f.append('audio', blob, 'voix'); await envoie(f); await charge(); studio(el, qui, retour); }catch(x){ err.textContent = x.message; b.disabled = false; b.textContent = '✅ Garder'; } }
    if(b.dataset.refait){ studio(el, qui, retour); }
  };
}
async function envoie(d){ let body = d; if(!(d instanceof FormData)){ body = new FormData(); for(const k in d) body.append(k, d[k]); }
  const r = await fetch(API, { method:'POST', body, credentials:'same-origin' }); const j = await r.json().catch(() => ({ error:'Le serveur ne répond pas.' })); if(!r.ok) throw new Error(j.error || 'Erreur'); return j; }
async function enregistre(b, s, el, qui, retour){
  if(!navigator.mediaDevices || !window.MediaRecorder) throw new Error('Cette tablette ne sait pas enregistrer la voix ici.');
  let flux; try{ flux = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:true, noiseSuppression:true } }); }catch(e){ throw new Error('Le micro n’est pas autorisé : il faut dire « Autoriser » quand la tablette le demande.'); }
  const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  const r = rec = new MediaRecorder(flux, type ? { mimeType:type } : undefined), bouts = []; let n = 8;
  b.classList.add('enreg'); b.textContent = '⏹️ Arrêter (8)';
  const tic = setInterval(() => { n--; b.textContent = `⏹️ Arrêter (${n})`; if(n <= 0) r.stop(); }, 1000);
  r.ondataavailable = e => { if(e.data && e.data.size) bouts.push(e.data); };
  r.onstop = () => { clearInterval(tic); flux.getTracks().forEach(t => t.stop()); rec = null;
    const blob = new Blob(bouts, { type:r.mimeType || type || 'audio/webm' }), u = URL.createObjectURL(blob);
    const zone = b.parentElement; b.remove();
    const p = document.createElement('span'); p.className = 'essai';
    p.innerHTML = `<button data-ecoute2>▶ Réécouter</button><button data-garde="1" class="go">✅ Garder</button><button data-refait="1">↺ Recommencer</button>`;
    zone.appendChild(p); p.querySelector('[data-garde]')._blob = blob;
    const au = new Audio(u); au.play().catch(() => {}); p.querySelector('[data-ecoute2]').onclick = ev => { ev.stopPropagation(); au.currentTime = 0; au.play().catch(() => {}); };
  };
  r.start();
}
