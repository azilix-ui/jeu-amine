/* Zarbia en ligne : le salon (qui est là, inviter, créer ou rejoindre une partie) et la partie entre tablettes.
   Chaque tablette fait avancer son propre joueur (et la tablette qui a créé la partie, les joueurs de la machine),
   et envoie toutes les 120 ms : les positions, les captures (liste de cases compressée), les fils coupés, les naissances.
   Les autres joueurs sont dessinés là où leur tablette les a vus, un peu en avance (on prolonge leur direction).
   Le départ est le même partout : même graine, mêmes joueurs dans le même ordre → mêmes places de départ.
   Une partie dure quelques minutes ; à la fin, la plus grande zarbia gagne. */
import { placeLibre, nait, elimine, appliqueCases, compresse, decompresse, classement, resynchro, casesDe, N } from './moteur.js';

const API = new URL('../../api/zarbia.php', import.meta.url).href;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const BOTS = [['amsalah', 'Am Salah'], ['fatma', 'Khalti Fatma'], ['hedi', 'Hédi'], ['leila', 'Leïla'], ['bechir', 'Béchir'], ['nour', 'Rim'], ['moncef', 'Moncef'], ['zohra', 'Zohra'], ['taher', 'Taher'], ['yasmine', 'Fella']];
const COUL_BOTS = ['#e0a21b', '#e8742a', '#8e2441', '#8a5a2b', '#6a8f2a', '#5f7d95', '#c2185b', '#1fa3a8'];
async function post(data){ const f = new FormData(); for(const k in data) f.append(k, typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k]);
  const r = await fetch(API, { method:'POST', body:f, credentials:'same-origin' }); const j = await r.json().catch(() => ({ error:'Le serveur ne répond pas.' })); if(!r.ok) throw new Error(j.error || 'Erreur'); return j; }
async function get(q){ const r = await fetch(API + '?' + new URLSearchParams(q), { credentials:'same-origin', cache:'no-store' }); const j = await r.json().catch(() => ({})); if(!r.ok) throw new Error(j.error || 'Erreur'); return j; }
function clientId(){ let c = null; try{ c = localStorage.getItem('zarbia-client'); }catch(e){} if(!c || !/^[a-z0-9]{8,20}$/.test(c)){ c = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); try{ localStorage.setItem('zarbia-client', c); }catch(e){} } return c; }

export class Reseau {
  constructor(o){ this.o = o; this.client = clientId(); this.code = null; this.room = null; this.host = null; this.online = []; this.status = 'menu'; this.since = 0; this.sortants = []; this.enJeu = false;
    this.hello(); setInterval(() => this.hello(), 4000); }

  /* ---------- le salon ---------- */
  async hello(){
    const nom = this.o.joueur(); if(!nom || document.hidden) return;
    try{ const r = await post({ action:'hello', client:this.client, name:nom, tete:this.o.tete(nom) || '', status:this.status, code:this.code || '' });
      this.online = r.online || []; (r.invites || []).forEach(i => this.invitation(i)); if(this.status === 'salon' && !this.room) this.rendSalon(); else if(this.room && this.status === 'salon') this.rendSalle(); }catch(e){}
  }
  invitation(i){ if(this.enJeu || this.code === i.code) return; const d = $('invit');
    d.innerHTML = `<div class="carte" style="display:flex;gap:10px;align-items:center;margin:0">${i.tete ? `<img src="${esc(i.tete)}" style="width:48px;height:48px;border-radius:50%">` : '🧶'}<b>${esc(i.name)} t'invite à jouer à Zarbia !</b><button class="pill" style="background:#b0462a;color:#fff" id="invOk">Rejoindre</button><button class="pill" id="invNo">✕</button></div>`;
    d.classList.add('on'); this.o.SON.gagne(); $('invOk').onclick = () => { d.classList.remove('on'); this.rejoindre(i.code); }; $('invNo').onclick = () => d.classList.remove('on'); setTimeout(() => d.classList.remove('on'), 30000); }
  ouvreSalon(){ this.status = 'salon'; this.o.montre('salon'); $('salonRetour').onclick = () => this.quitteSalon(); if(this.room) this.rendSalle(); else this.rendSalon(); this.hello(); }
  quitteSalon(){ this.status = 'menu'; this.code = null; this.room = null; clearInterval(this.poll); this.o.menu(); }
  rendSalon(){
    const gens = this.online.filter(g => g.status !== 'joue');
    $('salonCorps').innerHTML = `<h2>Créer une partie</h2><p style="margin:0 0 10px">Tu crées la partie, puis tu invites tes frère et sœurs (ou tu leur donnes le code).</p>
      <button class="grand" id="sCree" style="font-size:24px">🧶 Créer une partie</button>
      <h2 style="margin-top:20px">Rejoindre avec un code</h2><div style="display:flex;gap:10px"><input id="sCode" maxlength="4" placeholder="ABCD" style="font:800 28px 'Baloo 2';text-transform:uppercase;width:150px;padding:6px 12px;border-radius:14px;border:3px solid #e9d6b4;letter-spacing:4px"><button class="pill" id="sJoin" style="background:#1f6fd8;color:#fff">Rejoindre</button></div>
      <h2 style="margin-top:20px">Sur Zarbia en ce moment</h2>${gens.length ? `<div class="gens">${gens.map(g => `<button disabled>${g.tete ? `<img src="${esc(g.tete)}">` : '🙂'}<span>${esc(g.name)}<small>${g.status === 'salon' && g.code ? 'dans la partie ' + g.code : 'au menu'}</small></span></button>`).join('')}</div>` : '<p class="none">Personne d\'autre pour l\'instant. Demande à ton frère ou ta sœur d\'ouvrir Zarbia sur sa tablette !</p>'}`;
    $('sCree').onclick = () => this.cree(); $('sJoin').onclick = () => { const c = $('sCode').value.trim().toUpperCase(); if(c.length === 4) this.rejoindre(c); };
  }
  moiInfo(){ const nom = this.o.joueur(), sv = this.o.sv(); return { client:this.client, nom, tete:this.o.tete(nom) || '', couleur:sv.couleur, motif:sv.motif || 1 }; }
  async cree(){
    try{ const st = { etat:'attente', mode:'tranquille', bots:3, duree:180, seed:(Math.random() * 1e9) | 0, joueurs:[this.moiInfo()] };
      const r = await post({ action:'create', client:this.client, state:st }); this.code = r.code; this.room = st; this.host = this.client; this.status = 'salon'; this.attend(); this.rendSalle(); this.hello(); }catch(e){ this.o.message(e.message); }
  }
  async rejoindre(code){
    try{ const m = this.moiInfo(); const r = await post({ action:'join', code, client:this.client, name:m.nom, tete:m.tete, couleur:m.couleur, motif:m.motif }); this.code = code; this.room = r.state; this.host = r.host; this.status = 'salon'; this.o.montre('salon'); $('salonRetour').onclick = () => this.quitteSalon(); this.attend(); this.rendSalle(); this.hello(); }
    catch(e){ this.o.message(e.message); }
  }
  attend(){ clearInterval(this.poll); this.poll = setInterval(async () => { if(!this.code || this.enJeu) return; try{ const r = await get({ action:'room', code:this.code }); this.room = r.state; this.host = r.host; if(r.state.etat === 'jeu') this.commence(); else this.rendSalle(); }catch(e){} }, 1500); }
  rendSalle(){
    const s = this.room, hote = this.host === this.client; if(!s || this.enJeu) return;
    const libres = this.online.filter(g => g.status !== 'joue' && !s.joueurs.some(j => j.client === g.client));
    $('salonCorps').innerHTML = `<p style="margin:0">Code de la partie :</p><div class="code">${this.code}</div>
      <h2>Les joueurs (${s.joueurs.length} / 4)</h2><div class="gens">${s.joueurs.map(j => `<button disabled style="box-shadow:inset 0 0 0 4px ${j.couleur}">${j.tete ? `<img src="${esc(j.tete)}">` : '🙂'}<span>${esc(j.nom)}<small>${j.client === this.host ? 'a créé la partie' : 'prêt'}</small></span></button>`).join('')}</div>
      ${libres.length ? `<h2 style="margin-top:16px">Inviter</h2><div class="gens">${libres.map(g => `<button data-inv="${g.client}">${g.tete ? `<img src="${esc(g.tete)}">` : '🙂'}<span>${esc(g.name)}<small>✉️ inviter</small></span></button>`).join('')}</div>` : ''}
      ${hote ? `<h2 style="margin-top:16px">Réglages</h2>
        <div class="modes"><button class="mode ${s.mode === 'tranquille' ? 'on' : ''}" data-sm="tranquille"><b>🐢 Tranquille</b><span>On recommence quand le fil est coupé.</span></button><button class="mode ${s.mode === 'champion' ? 'on' : ''}" data-sm="champion"><b>🐆 Champion</b><span>Fil coupé = tu regardes la fin.</span></button></div>
        <p style="margin:12px 0 6px;font-weight:800">Joueurs de la machine</p><div class="couleurs">${[0, 3, 6].map(n => `<button class="pill ${s.bots === n ? 'on' : ''}" data-sb="${n}" style="width:auto;border-radius:999px;${s.bots === n ? 'background:#b0462a;color:#fff' : ''}">${n === 0 ? 'Aucun' : n}</button>`).join('')}</div>
        <p style="margin:12px 0 6px;font-weight:800">Durée</p><div class="couleurs">${[120, 180, 300].map(n => `<button class="pill" data-sd="${n}" style="width:auto;border-radius:999px;${s.duree === n ? 'background:#b0462a;color:#fff' : ''}">${n / 60} min</button>`).join('')}</div>
        <button class="grand" id="sGo">▶ Commencer</button>` : `<p style="margin-top:16px;font-weight:800">En attente : c'est ${esc((s.joueurs.find(j => j.client === this.host) || {}).nom || 'le créateur')} qui lance la partie…</p>`}`;
    $('salonCorps').onclick = async e => { const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.inv){ const m = this.moiInfo(); try{ await post({ action:'invite', client:this.client, name:m.nom, tete:m.tete, to:b.dataset.inv, code:this.code }); b.querySelector('small').textContent = '✔ invité'; }catch(err){ this.o.message(err.message); } return; }
      if(!hote) return;
      if(b.dataset.sm){ s.mode = b.dataset.sm; } else if(b.dataset.sb){ s.bots = +b.dataset.sb; } else if(b.dataset.sd){ s.duree = +b.dataset.sd; } else if(b.id === 'sGo'){ s.etat = 'jeu'; s.seed = (Math.random() * 1e9) | 0; }
      else return;
      try{ await post({ action:'update', code:this.code, client:this.client, state:s }); }catch(err){ this.o.message(err.message); }
      if(s.etat === 'jeu') this.commence(); else this.rendSalle(); };
  }

  /* ---------- la partie ---------- */
  commence(){
    if(this.enJeu) return; this.enJeu = true; this.status = 'joue'; clearInterval(this.poll);
    const s = this.room, hote = this.host === this.client, o = this.o;
    const G = o.nouvellePartie({ mode:s.mode, seed:s.seed, net:this }); const M = G.M; this.G = G;
    s.joueurs.forEach((j, i) => { const l = placeLibre(M); const p = o.joueurDe(M, { nom:j.nom, couleur:j.couleur, motif:j.motif, tete:j.tete, humain:true, client:j.client }, l.x, l.y); p.local = j.client === this.client; if(p.local) G.moi = p; else p.vitesse = 0; });
    for(let i = 0; i < s.bots; i++){ const [id, n] = BOTS[(s.seed + i * 3) % BOTS.length], l = placeLibre(M); const p = o.joueurDe(M, { nom:n, couleur:COUL_BOTS[i % COUL_BOTS.length], motif:1 + (i % 3), tete:o.tete(null, id), bot:id, niveau:i % 3 === 2 ? 'normal' : 'facile' }, l.x, l.y); p.local = hote; if(!hote) p.vitesse = 0; }
    M.events.length = 0; this.since = 0; this.sortants = []; this.finT = performance.now() + s.duree * 1000; this.envoiT = 0; this.vus = {};
    o.demarre(); o.message('C\'est parti pour ' + s.duree / 60 + ' minutes ! 🧶', 3000);
    this.boucle();
  }
  async boucle(){
    while(this.enJeu){
      const t0 = performance.now(), G = this.G;
      const pos = G.M.joueurs.filter(p => p && p.local && p.vivant).map(p => [p.id, Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.a * 100) / 100]);
      // toutes les 4 s, la zarbia complète d'un de mes joueurs (les tablettes se recalent si elles ont un peu dérivé)
      if(t0 - (this.toutT || 0) > 4000 / Math.max(1, G.M.joueurs.filter(p => p && p.local && p.vivant).length)){ this.toutT = t0; const mes = G.M.joueurs.filter(p => p && p.local && p.vivant); if(mes.length){ const p = mes[(this.toutI = (this.toutI || 0) + 1) % mes.length]; this.sortants.push({ k:'tout', id:p.id, c:compresse(casesDe(G.M, p.id)) }); } }
      const e = this.sortants; this.sortants = [];
      try{ const r = await post({ action:'sync', code:this.code, client:this.client, since:this.since, msgs:{ p:pos, e } }); if(this.since === 0) this.since = r.id; else { this.since = r.id; r.msgs.forEach(m => this.recoit(m.m)); } }catch(err){ this.sortants = e.concat(this.sortants); }
      if(performance.now() > this.finT && !this.G.fini) this.termine();
      const reste = 120 - (performance.now() - t0); if(reste > 0) await new Promise(r => setTimeout(r, reste));
    }
  }
  recoit(m){
    const M = this.G.M, now = performance.now();
    (m.p || []).forEach(([id, x, y, a]) => { const p = M.joueurs[id]; if(!p || p.local) return; p.net = { x, y, a, t:now }; });
    (m.e || []).forEach(e => { const p = M.joueurs[e.id]; if(!p) return;
      if(e.k === 'cap' && !p.local){ appliqueCases(M, e.id, decompresse(e.c)); }
      else if(e.k === 'tout' && !p.local && p.vivant){ resynchro(M, e.id, decompresse(e.c)); }
      else if(e.k === 'mort' && p.vivant){ this.recu = true; elimine(M, p, e.par); this.recu = false; }
      else if(e.k === 'nait' && !p.local && !p.vivant){ nait(M, p, e.x, e.y); p.net = { x:e.x + .5, y:e.y + .5, a:p.a, t:now }; } });
  }
  // avant chaque pas : les joueurs des autres tablettes vont vers là où ils ont été vus (un peu en avance)
  avant(){
    const M = this.G.M, now = performance.now();
    for(const p of M.joueurs){ if(!p || p.local || !p.vivant || !p.net) continue;
      const age = Math.min(.5, (now - p.net.t) / 1000), px = p.net.x + Math.cos(p.net.a) * 16 * age, py = p.net.y + Math.sin(p.net.a) * 16 * age;
      const d = Math.hypot(px - p.x, py - p.y);
      if(d > 6){ p.x = px; p.y = py; p.a = p.vise = p.net.a; p.vitesse = 16; continue; }
      const tx = px + Math.cos(p.net.a) * 1.5, ty = py + Math.sin(p.net.a) * 1.5; p.vise = Math.atan2(ty - p.y, tx - p.x); p.vitesse = 16 * Math.max(.7, Math.min(1.5, .8 + d * .25)); }
  }
  apres(){}
  capture(p, cells){ this.sortants.push({ k:'cap', id:p.id, c:compresse(cells) }); }
  mort(p, par){ if(this.recu) return; const tueur = this.G.M.joueurs[par]; if(p.local || (tueur && tueur.local)) this.sortants.push({ k:'mort', id:p.id, par }); }
  nait(p){ this.sortants.push({ k:'nait', id:p.id, x:Math.floor(p.x), y:Math.floor(p.y) }); }
  moiMort(pourquoi){ this.o.message(pourquoi + ' : tu regardes la fin de la partie 👀', 4000); }
  termine(){
    const G = this.G; if(G.fini) return; G.fini = true;
    const cl = classement(G.M).concat(G.M.joueurs.filter(p => p && !p.vivant && !p.libre)), moi = G.moi, rang = cl.indexOf(moi) + 1;
    const fmt = v => (Math.round(v * 10) / 10).toString().replace('.', ',') + ' %';
    this.o.SON.gagne();
    this.o.modal(`<div style="font-size:60px">${rang === 1 ? '🏆' : '🧶'}</div><h2>${rang === 1 ? 'Tu as gagné !' : 'Fin de la partie'}</h2>
      <div class="res">${cl.slice(0, 6).map((p, i) => `<span>${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'} ${esc(p.nom)}${p === moi ? ' (toi)' : ''}</span><b>${p.vivant ? fmt(p.score) : '✂️'}</b>`).join('')}</div>
      <p style="margin:0">Ta plus grande zarbia : <b>${fmt(moi.meilleur)}</b> · fils coupés : <b>${moi.kills}</b></p>
      <div class="rang"><button class="pill go" id="mSalon">🧶 Revenir au salon</button><button class="pill" id="mMenu2">🏠 Menu</button></div>`);
    $('mSalon').onclick = () => { this.quitte(); this.o.quitter(); this.room.etat = 'attente'; this.ouvreSalon(); if(this.host === this.client) post({ action:'update', code:this.code, client:this.client, state:this.room }).catch(() => {}); this.attend(); };
    $('mMenu2').onclick = () => { this.quitte(); this.code = null; this.room = null; this.o.quitter(); };
  }
  quitte(){ this.enJeu = false; this.status = this.code ? 'salon' : 'menu'; }
}
