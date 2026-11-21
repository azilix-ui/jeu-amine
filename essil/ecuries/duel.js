/* Les Écuries · « Concours entre nous » (21/11, demandé par Essil : jouer avec Salma ou Amine et faire des concours entre nous trois).
   Un salon comme Zarbia et l'Arène (api/ecuries.php) : on crée un concours, on invite (ou on donne le code), celui qui l'a créé
   choisit l'épreuve, et tout le monde part en même temps, chacun sur sa tablette avec son propre cheval.
   Pendant le parcours : un petit tableau montre où en sont les autres, et leurs points sont sur la carte.
   À la fin : le podium du concours (le classement suit les règles de l'épreuve) et une prime pour les trois premiers. */
const API = new URL('../../api/ecuries.php', import.meta.url).href;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const COUL = ['#d7263d', '#1f6fd8', '#2f9e44', '#f2b632', '#8a4fd8', '#ff7a1a'];
async function post(data){ const f = new FormData(); for(const k in data) f.append(k, typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k]);
  const r = await fetch(API, { method:'POST', body:f, credentials:'same-origin' }); const j = await r.json().catch(() => ({ error:'Le serveur ne répond pas.' })); if(!r.ok) throw new Error(j.error || 'Erreur'); return j; }
async function get(q){ const r = await fetch(API + '?' + new URLSearchParams(q), { credentials:'same-origin', cache:'no-store' }); const j = await r.json().catch(() => ({})); if(!r.ok) throw new Error(j.error || 'Erreur'); return j; }
function clientId(){ let c = null; try{ c = localStorage.getItem('ecuries-client'); }catch(e){} if(!c || !/^[a-z0-9]{8,20}$/.test(c)){ c = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); try{ localStorage.setItem('ecuries-client', c); }catch(e){} } return c; }

// le score d'un résultat, pour comparer (plus petit = mieux) selon le genre d'épreuve
export function cle(res){
  if(!res) return [9, 0, 0];
  if(res.elim) return [8, 0, res.time || 0];
  if(res.kind === 'dressage' || res.kind === 'hunter') return [0, -(res.pct || 0), res.time || 0];
  if(res.kind === 'course') return [0, res.place || 9, res.time || 0];
  if(res.kind === 'western') return [0, res.total || res.time || 0, 0];
  return [0, res.pen || 0, res.time || 0];
}
const compare = (a, b) => { const x = cle(a), y = cle(b); for(let i = 0; i < 3; i++) if(x[i] !== y[i]) return x[i] - y[i]; return 0; };
const f1 = n => String(Math.round((n || 0) * 10) / 10).replace('.', ',');
export function resume(res){
  if(!res) return '…'; if(res.elim) return 'éliminé·e';
  if(res.kind === 'dressage' || res.kind === 'hunter') return f1(res.pct) + ' %';
  if(res.kind === 'course') return res.place + (res.place === 1 ? 'er' : 'e') + ' · ' + f1(res.time) + ' s';
  if(res.kind === 'western') return f1(res.total) + ' s';
  return f1(res.pen) + ' pt · ' + f1(res.time) + ' s';
}

export class Duel {
  constructor(o){ this.o = o; this.client = clientId(); this.code = null; this.room = null; this.host = null; this.online = []; this.status = 'menu'; this.since = 0; this.actif = false; this.autres = {}; this.res = {}; this.moi = null;
    this.hello(); setInterval(() => this.hello(), 4000); }
  async hello(){
    const nom = this.o.joueur(); if(!nom || document.hidden) return;
    try{ const r = await post({ action:'hello', client:this.client, name:nom, tete:this.o.avatar(nom), status:this.status, code:this.code || '' });
      this.online = r.online || []; (r.invites || []).forEach(i => this.invitation(i)); if(this.status === 'salon' && this.o.ecran() === 'duel') this.rend(); }catch(e){}
  }
  invitation(i){ if(this.actif || this.code === i.code) return; const d = document.createElement('div'); d.className = 'invit';
    d.innerHTML = `${i.tete ? `<img src="${esc(i.tete)}" alt="">` : '🐴'}<b>${esc(i.name)} t'invite à un concours !</b><button class="pill go">Venir</button><button class="pill">✕</button>`;
    document.body.appendChild(d); this.o.sfx('cloche'); const [ok, no] = d.querySelectorAll('button'); ok.onclick = () => { d.remove(); this.rejoindre(i.code); }; no.onclick = () => d.remove(); setTimeout(() => d.remove(), 30000); }
  ouvre(){ this.status = 'salon'; this.rend(); this.hello(); }
  quitte(){ this.status = 'menu'; this.code = null; this.room = null; this.actif = false; clearInterval(this.poll); }
  moiInfo(){ const nom = this.o.joueur(); return { client:this.client, nom, tete:this.o.avatar(nom) }; }
  rend(){
    const B = $('dBody'); if(!B) return;
    if(!this.room){
      const gens = this.online.filter(g => g.status !== 'joue');
      B.innerHTML = `<div class="dcard"><h3>Créer un concours</h3><p>Tu crées le concours, tu invites tes frère et sœurs (ou tu leur donnes le code), tu choisis l'épreuve, et vous partez tous en même temps, chacun avec son cheval.</p><button class="pill go big" id="dCree">🏆 Créer un concours</button></div>
        <div class="dcard"><h3>Rejoindre avec un code</h3><div class="row"><input id="dCode" maxlength="4" placeholder="ABCD" autocomplete="off"><button class="pill sun" id="dJoin">Rejoindre</button></div></div>
        <div class="dcard"><h3>Aux écuries en ce moment</h3>${gens.length ? `<div class="gens">${gens.map(g => `<div>${g.tete ? `<img src="${esc(g.tete)}" alt="">` : '🙂'}<span>${esc(g.name)}<small>${g.code ? 'dans le concours ' + g.code : 'aux écuries'}</small></span></div>`).join('')}</div>` : '<p>Personne d\'autre pour l\'instant. Demande à ta sœur ou ton frère d\'ouvrir les Écuries sur sa tablette, puis « Concours entre nous ».</p>'}</div>`;
      $('dCree').onclick = () => this.cree(); $('dJoin').onclick = () => { const c = $('dCode').value.trim().toUpperCase(); if(c.length === 4) this.rejoindre(c); }; return;
    }
    const s = this.room, hote = this.host === this.client, ep = this.o.EPREUVES.find(x => x.id === s.ep) || this.o.EPREUVES[0];
    const libres = this.online.filter(g => g.status !== 'joue' && !s.joueurs.some(j => j.client === g.client));
    B.innerHTML = `<div class="dcard"><p style="margin:0">Code du concours :</p><div class="dcode">${this.code}</div>
      <h3>Les cavaliers (${s.joueurs.length} / 6)</h3><div class="gens">${s.joueurs.map((j, i) => `<div style="box-shadow:inset 0 0 0 3px ${COUL[i % 6]}">${j.tete ? `<img src="${esc(j.tete)}" alt="">` : '🙂'}<span>${esc(j.nom)}<small>${j.client === this.host ? 'organise le concours' : 'prêt·e'}</small></span></div>`).join('')}</div>
      ${libres.length ? `<h3>Inviter</h3><div class="gens">${libres.map(g => `<button data-inv="${g.client}">${g.tete ? `<img src="${esc(g.tete)}" alt="">` : '🙂'}<span>${esc(g.name)}<small>✉️ inviter</small></span></button>`).join('')}</div>` : ''}</div>
      <div class="dcard"><h3>L'épreuve : ${ep.ic} ${esc(ep.n)}</h3><p style="margin:0 0 8px">${esc(ep.d)}</p>
      ${hote ? `<div class="eplist" id="dEps">${this.o.EPREUVES.map(e => `<button class="ep ${e.id === s.ep ? 'on' : ''}" data-ep="${e.id}"><span>${e.ic}</span><div><b>${esc(e.n)}</b><small>${esc(e.d)}</small></div></button>`).join('')}</div>
        <p style="margin:10px 0 0;color:var(--mist)">Chacun monte <b>le cheval qu'il a choisi</b> dans « Les concours ». Ton cheval : <b>${esc(this.o.cheval())}</b>.</p><button class="pill go big" id="dGo">🏁 Tout le monde en selle !</button>`
        : `<p style="margin:0;font-weight:800">${esc((s.joueurs.find(j => j.client === this.host) || {}).nom || 'L\'organisateur')} choisit l'épreuve et lance le départ… Ton cheval : ${esc(this.o.cheval())}.</p>`}</div>`;
    B.onclick = async e => { const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.inv){ const m = this.moiInfo(); try{ await post({ action:'invite', client:this.client, name:m.nom, tete:m.tete, to:b.dataset.inv, code:this.code }); b.querySelector('small').textContent = '✔ invité'; }catch(err){ this.o.toast(err.message); } return; }
      if(!hote) return;
      if(b.dataset.ep){ s.ep = b.dataset.ep; } else if(b.id === 'dGo'){ if(!this.o.peutMonter()) return; s.etat = 'jeu'; s.manche = (s.manche || 0) + 1; } else return;
      this.o.sfx('tap'); try{ await post({ action:'update', code:this.code, client:this.client, state:s }); }catch(err){ this.o.toast(err.message); }
      if(s.etat === 'jeu') this.commence(); else this.rend(); };
  }
  async cree(){ try{ const st = { etat:'attente', ep:this.o.EPREUVES[0].id, manche:0, joueurs:[this.moiInfo()] };
      const r = await post({ action:'create', client:this.client, state:st }); this.code = r.code; this.room = st; this.host = this.client; this.status = 'salon'; this.attend(); this.rend(); this.hello(); }catch(e){ this.o.toast(e.message); } }
  async rejoindre(code){
    try{ const m = this.moiInfo(); const r = await post({ action:'join', code, client:this.client, name:m.nom, tete:m.tete }); this.code = code; this.room = r.state; this.host = r.host; this.status = 'salon'; this.o.go('duel'); this.attend(); this.rend(); this.hello(); }
    catch(e){ this.o.toast(e.message); }
  }
  attend(){ clearInterval(this.poll); this.poll = setInterval(async () => { if(!this.code || this.actif) return; try{ const r = await get({ action:'room', code:this.code }); this.room = r.state; this.host = r.host;
    if(r.state.etat === 'jeu' && (r.state.manche || 0) !== this.mancheJouee) this.commence(); else if(this.o.ecran() === 'duel') this.rend(); }catch(e){} }, 1500); }

  /* ---------- la manche ---------- */
  commence(){
    if(this.actif) return; const s = this.room; if(!this.o.peutMonter()){ this.o.toast('Choisis un cheval avec un filet et une selle, et qui n\'a pas trop faim.'); return; }
    this.actif = true; this.status = 'joue'; this.mancheJouee = s.manche || 0; this.autres = {}; this.res = {}; this.moi = null; this.since = 0; this.sortant = null;
    const ep = this.o.EPREUVES.find(x => x.id === s.ep); this.ep = ep;
    this.o.depart(ep); this.boucle();
  }
  hud(o){ if(!this.actif || o.msg || o.time == null) return; this.etat = o; }
  async boucle(){
    while(this.actif){
      const t0 = performance.now(), o = this.etat; let msg = null;
      if(this.sortant){ msg = { f:this.sortant, cheval:this.o.cheval() }; }
      else if(o && o.map){ msg = { x:Math.round(o.map.x * 10) / 10, z:Math.round(o.map.z * 10) / 10, n:o.next, nb:o.nb || o.mn || o.tours, pen:o.kind === 'hunter' ? Math.round(o.score) : o.pen, k:o.kind, pl:o.place, t:Math.round(o.time) }; }
      try{ const r = await post({ action:'sync', code:this.code, client:this.client, since:this.since, msgs:msg || [] });
        if(this.since === 0) this.since = r.id; else { this.since = r.id; r.msgs.forEach(m => this.recoit(m.c, m.m)); } }catch(e){}
      this.tableau();
      if(this.res[this.client] && this.room.joueurs.every(j => this.res[j.client] || (this.autres[j.client] && performance.now() - this.autres[j.client].vu > 15000)) && !this.podiumFait) this.podium();
      const reste = 400 - (performance.now() - t0); if(reste > 0) await new Promise(r => setTimeout(r, reste));
    }
  }
  recoit(c, m){ if(c === this.client || !m) return; const a = this.autres[c] = Object.assign(this.autres[c] || {}, { vu:performance.now() });
    if(m.f){ this.res[c] = m.f; a.cheval = m.cheval; } else if(m.x != null) Object.assign(a, m); }
  fin(res){ if(!this.actif) return; const r = { kind:res.kind, elim:!!res.elim, pen:res.pen, time:res.time, pct:res.pct, place:res.place, total:res.total }; this.res[this.client] = r; this.sortant = r; this.podiumFait = false; this.tableau(); }
  nom(c){ return (this.room.joueurs.find(j => j.client === c) || {}).nom || '?'; }
  couleur(c){ const i = this.room.joueurs.findIndex(j => j.client === c); return COUL[(i < 0 ? 5 : i) % 6]; }
  // le petit tableau des autres pendant le parcours
  tableau(){
    let T = $('duelHud'); if(!T){ T = document.createElement('div'); T.id = 'duelHud'; document.body.appendChild(T); }
    if(!this.actif || this.o.ecran() !== 'ride'){ T.style.display = 'none'; return; } T.style.display = '';
    T.innerHTML = '<b>🏆 Concours entre nous</b>' + this.room.joueurs.map(j => { const c = j.client, a = this.autres[c] || {}, r = this.res[c], moi = c === this.client;
      const txt = r ? '🏁 ' + resume(r) : moi ? 'toi' : a.n != null ? (a.k === 'dressage' ? 'figure ' + (a.n + 1) : a.k === 'course' ? (a.pl || '?') + (a.pl === 1 ? 'er' : 'e') : 'obstacle ' + Math.min((a.n || 0) + 1, a.nb || 99)) + (a.k === 'hunter' ? ' · ' + a.pen + ' %' : a.pen != null && a.k !== 'dressage' && a.k !== 'course' ? ' · ' + a.pen + ' pt' : '') : 'en route…';
      return `<div><i style="background:${this.couleur(c)}"></i>${esc(j.nom)}<span>${txt}</span></div>`; }).join(''); }
  // les autres cavaliers sur la petite carte
  carte(g, X, Y){ if(!this.actif) return; for(const c in this.autres){ const a = this.autres[c]; if(a.x == null || this.res[c]) continue; g.fillStyle = this.couleur(c); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(X(a.x), Y(a.z), 7, 0, 7); g.fill(); g.stroke(); } }
  podium(){
    this.podiumFait = true; const cl = this.room.joueurs.map(j => ({ j, r:this.res[j.client] })).sort((a, b) => compare(a.r, b.r)), moi = cl.findIndex(x => x.j.client === this.client), prime = [50, 30, 20][moi] || 0;
    if(prime && cl.length > 1) this.o.coins(prime);
    const D = document.createElement('div'); D.className = 'modal on'; D.id = 'duelPodium';
    D.innerHTML = `<div class="box"><div class="medal">${moi === 0 ? '🏆' : ['🥇', '🥈', '🥉'][moi] || '🎗️'}</div><h2>Le podium du concours</h2><p style="margin:0;text-align:center;color:var(--mist)">${this.ep.ic} ${esc(this.ep.n)}</p>
      <div class="res">${cl.map((x, i) => `<span>${['🥇', '🥈', '🥉'][i] || (i + 1) + 'e'} ${esc(x.j.nom)}${x.j.client === this.client ? ' (toi)' : ''}${x.r ? '' : ' · parti·e'}</span><b>${resume(x.r)}</b>`).join('')}</div>
      ${prime && cl.length > 1 ? `<p style="margin:0;text-align:center">Prime du concours : <b>+ ${prime} 🪙</b></p>` : ''}
      <div class="row c"><button class="pill go" id="dRev">🔁 Une autre manche</button><button class="pill" id="dFin">🏠 Fini</button></div></div>`;
    document.body.appendChild(D); this.o.sfx('bravo'); this.o.party();
    const ferme = () => { D.remove(); this.actif = false; this.status = 'salon'; this.tableau(); };
    D.querySelector('#dRev').onclick = () => { ferme(); this.o.fermeModal(); this.room.etat = 'attente'; if(this.host === this.client) post({ action:'update', code:this.code, client:this.client, state:this.room }).catch(() => {}); this.o.go('duel'); this.rend(); this.attend(); };
    D.querySelector('#dFin').onclick = () => { ferme(); this.o.fermeModal(); this.quitte(); this.o.go('hub'); };
  }
}
