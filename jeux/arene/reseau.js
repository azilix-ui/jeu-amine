/* Serpent Légendes · l'Arène en ligne (21/11) : le salon (qui est là, inviter, créer ou rejoindre une partie) et la partie entre tablettes.
   Même principe que Zarbia (api/arene.php, copie de zarbia.php) : chaque tablette fait avancer son serpent (et la tablette qui a créé
   la partie, les serpents de la machine), et envoie toutes les 120 ms : les têtes [id, x, y, angle, masse, boost], et les événements
   (perles mangées, perles tombées, serpents tombés avec leur pluie de perles, renaissances).
   Les serpents des autres tablettes vont vers là où ils ont été vus (un peu en avance) ; leur corps suit leur tête.
   C'est la tablette du serpent qui décide s'il est tombé (elle voit les corps des autres) : elle le dit à tout le monde.
   Les perles « fixes » sont les mêmes partout (même graine) ; on ne perd jamais pour de bon : on renaît après 2 secondes.
   La partie dure 3, 5 ou 10 minutes ; à la fin, le plus long serpent (sa plus grande longueur pendant la partie) gagne. */
import { CFG, ajouteDrop, mangeFixe, meurt, renait, pousseChemin, rayon } from './moteur.js';

const API = new URL('../../api/arene.php', import.meta.url).href;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const r1 = v => Math.round(v * 10) / 10;
async function post(data){ const f = new FormData(); for(const k in data) f.append(k, typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k]);
  const r = await fetch(API, { method:'POST', body:f, credentials:'same-origin' }); const j = await r.json().catch(() => ({ error:'Le serveur ne répond pas.' })); if(!r.ok) throw new Error(j.error || 'Erreur'); return j; }
async function get(q){ const r = await fetch(API + '?' + new URLSearchParams(q), { credentials:'same-origin', cache:'no-store' }); const j = await r.json().catch(() => ({})); if(!r.ok) throw new Error(j.error || 'Erreur'); return j; }
function clientId(){ let c = null; try{ c = localStorage.getItem('arene-client'); }catch(e){} if(!c || !/^[a-z0-9]{8,20}$/.test(c)){ c = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); try{ localStorage.setItem('arene-client', c); }catch(e){} } return c; }

export class Reseau {
  constructor(o){ this.o = o; this.client = clientId(); this.code = null; this.room = null; this.host = null; this.online = []; this.status = 'menu'; this.since = 0; this.sortants = []; this.enJeu = false;
    this.hello(); setInterval(() => this.hello(), 4000); }

  /* ---------- le salon ---------- */
  async hello(){
    const nom = this.o.joueur(); if(!nom || document.hidden) return;
    try{ const r = await post({ action:'hello', client:this.client, name:nom, tete:this.o.tete(this.o.skin().split(':')[0]).replace(location.origin, ''), status:this.status, code:this.code || '' });
      this.online = r.online || []; (r.invites || []).forEach(i => this.invitation(i)); if(this.status === 'salon' && !this.room) this.rendSalon(); else if(this.room && this.status === 'salon') this.rendSalle(); }catch(e){}
  }
  invitation(i){ if(this.enJeu || this.code === i.code) return; const d = $('invit');
    d.innerHTML = `<div class="carte" style="display:flex;gap:10px;align-items:center;margin:0;flex-wrap:wrap">${i.tete ? `<img src="${esc(i.tete)}" style="width:48px;height:48px;object-fit:contain">` : '🐍'}<b style="flex:1">${esc(i.name)} t'invite dans l'Arène !</b><button class="pill" style="background:#c8412f;color:#fff" id="invOk">Rejoindre</button><button class="pill" id="invNo">✕</button></div>`;
    d.classList.add('on'); this.o.SON.invite(); $('invOk').onclick = () => { d.classList.remove('on'); this.rejoindre(i.code); }; $('invNo').onclick = () => d.classList.remove('on'); setTimeout(() => d.classList.remove('on'), 30000); }
  ouvreSalon(){ this.status = 'salon'; this.o.montre('salon'); $('salonRetour').onclick = () => this.quitteSalon(); if(this.room) this.rendSalle(); else this.rendSalon(); this.hello(); }
  quitteSalon(){ this.status = 'menu'; this.code = null; this.room = null; clearInterval(this.poll); this.o.menu(); }
  rendSalon(){
    const gens = this.online.filter(g => g.status !== 'joue');
    $('salonCorps').innerHTML = `<h2>Créer une partie</h2><p style="margin:0 0 10px">Tu crées la partie, puis tu invites tes frère et sœurs (ou tu leur donnes le code).</p>
      <button class="grand" id="sCree" style="font-size:24px">🐍 Créer une partie</button>
      <h2 style="margin-top:20px">Rejoindre avec un code</h2><div style="display:flex;gap:10px"><input id="sCode" maxlength="4" placeholder="ABCD" style="font:800 28px 'Baloo 2';text-transform:uppercase;width:150px;padding:6px 12px;border-radius:14px;border:3px solid #e9d6b4;letter-spacing:4px"><button class="pill" id="sJoin" style="background:#1d5c63;color:#fff">Rejoindre</button></div>
      <h2 style="margin-top:20px">Dans l'Arène en ce moment</h2>${gens.length ? `<div class="gens">${gens.map(g => `<button disabled>${g.tete ? `<img src="${esc(g.tete)}" style="object-fit:contain">` : '🙂'}<span>${esc(g.name)}<small>${g.status === 'salon' && g.code ? 'dans la partie ' + g.code : 'au menu'}</small></span></button>`).join('')}</div>` : '<p class="none">Personne d\'autre pour l\'instant. Demande à ton frère ou ta sœur d\'ouvrir l\'Arène sur sa tablette !</p>'}`;
    $('sCree').onclick = () => this.cree(); $('sJoin').onclick = () => { const c = $('sCode').value.trim().toUpperCase(); if(c.length === 4) this.rejoindre(c); };
  }
  moiInfo(){ const nom = this.o.joueur(), sk = this.o.skin(); return { client:this.client, nom, tete:this.o.tete(sk.split(':')[0]).replace(location.origin, ''), skin:sk }; }
  async cree(){
    try{ const st = { etat:'attente', bots:8, duree:300, graine:(Math.random() * 1e9) | 0, joueurs:[this.moiInfo()] };
      const r = await post({ action:'create', client:this.client, state:st }); this.code = r.code; this.room = st; this.host = this.client; this.status = 'salon'; this.attend(); this.rendSalle(); this.hello(); }catch(e){ this.o.message(e.message); }
  }
  async rejoindre(code){
    try{ const m = this.moiInfo(); const r = await post({ action:'join', code, client:this.client, name:m.nom, tete:m.tete, skin:m.skin }); this.code = code; this.room = r.state; this.host = r.host; this.status = 'salon'; this.o.montre('salon'); $('salonRetour').onclick = () => this.quitteSalon(); this.attend(); this.rendSalle(); this.hello(); }
    catch(e){ this.o.message(e.message); }
  }
  attend(){ clearInterval(this.poll); this.poll = setInterval(async () => { if(!this.code || this.enJeu) return; try{ const r = await get({ action:'room', code:this.code }); this.room = r.state; this.host = r.host; if(r.state.etat === 'jeu') this.commence(); else this.rendSalle(); }catch(e){} }, 1500); }
  rendSalle(){
    const s = this.room, hote = this.host === this.client; if(!s || this.enJeu) return;
    const libres = this.online.filter(g => g.status !== 'joue' && !s.joueurs.some(j => j.client === g.client));
    const pastille = (v, cle, txt) => `<button class="pill" data-${cle}="${v}" style="${s[cle === 'sb' ? 'bots' : 'duree'] === v ? 'background:#1d5c63;color:#fff' : ''}">${txt}</button>`;
    $('salonCorps').innerHTML = `<p style="margin:0">Code de la partie :</p><div class="code">${this.code}</div>
      <h2>Les joueurs (${s.joueurs.length} / 6)</h2><div class="gens">${s.joueurs.map(j => `<button disabled>${j.tete ? `<img src="${esc(j.tete)}" style="object-fit:contain">` : '🙂'}<span>${esc(j.nom)}<small>${j.client === this.host ? 'a créé la partie' : 'prêt'}</small></span></button>`).join('')}</div>
      ${libres.length ? `<h2 style="margin-top:16px">Inviter</h2><div class="gens">${libres.map(g => `<button data-inv="${g.client}">${g.tete ? `<img src="${esc(g.tete)}" style="object-fit:contain">` : '🙂'}<span>${esc(g.name)}<small>✉️ inviter</small></span></button>`).join('')}</div>` : ''}
      ${hote ? `<h2 style="margin-top:16px">Réglages</h2>
        <p style="margin:6px 0;font-weight:800">Serpents de la machine</p><div class="choix">${[0, 8, 16].map(n => pastille(n, 'sb', n === 0 ? 'Aucun' : n)).join('')}</div>
        <p style="margin:12px 0 6px;font-weight:800">Durée</p><div class="choix">${[180, 300, 600].map(n => pastille(n, 'sd', n / 60 + ' min')).join('')}</div>
        <button class="grand" id="sGo">▶ Commencer</button>` : `<p style="margin-top:16px;font-weight:800">En attente : c'est ${esc((s.joueurs.find(j => j.client === this.host) || {}).nom || 'le créateur')} qui lance la partie…</p>`}`;
    $('salonCorps').onclick = async e => { const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.inv){ const m = this.moiInfo(); try{ await post({ action:'invite', client:this.client, name:m.nom, tete:m.tete, to:b.dataset.inv, code:this.code }); b.querySelector('small').textContent = '✔ invité'; }catch(err){ this.o.message(err.message); } return; }
      if(!hote) return;
      if(b.dataset.sb){ s.bots = +b.dataset.sb; } else if(b.dataset.sd){ s.duree = +b.dataset.sd; } else if(b.id === 'sGo'){ s.etat = 'jeu'; s.graine = (Math.random() * 1e9) | 0; }
      else return;
      try{ await post({ action:'update', code:this.code, client:this.client, state:s }); }catch(err){ this.o.message(err.message); }
      if(s.etat === 'jeu') this.commence(); else this.rendSalle(); };
  }

  /* ---------- la partie ---------- */
  commence(){
    if(this.enJeu) return; this.enJeu = true; this.status = 'joue'; clearInterval(this.poll);
    const s = this.room, hote = this.host === this.client, o = this.o, moiI = s.joueurs.findIndex(j => j.client === this.client);
    const G = o.nouvellePartie({ mode:'enligne', graine:s.graine, net:this, prefixe:'c' + Math.max(0, moiI) }); const A = G.A; this.G = G;
    // les places de départ : sur un grand cercle, dans l'ordre des joueurs (pareil sur toutes les tablettes)
    const n = s.joueurs.length + s.bots, place = i => { const a = i / n * 2 * Math.PI, c = A.taille / 2, R = A.taille * .33; return { x:c + Math.cos(a) * R, y:c + Math.sin(a) * R, a:a + Math.PI / 2 }; };   /* on part en tournant autour du centre, pas tous vers le milieu */
    s.joueurs.forEach((j, i) => { const sn = o.serpentDe(A, Object.assign(place(i), { id:i, nom:j.nom, skin:j.skin, client:j.client, local:j.client === this.client })); if(sn.local) G.moi = sn; });
    for(let i = 0; i < s.bots; i++) o.serpentDe(A, Object.assign(place(s.joueurs.length + i), { id:100 + i, nom:o.BOTS[(s.graine + i * 5) % o.BOTS.length], skin:o.skinBot(s.graine % 7 + i), bot:true, niveau:i % 3 === 2 ? 'normal' : 'facile', local:hote }));
    if(!G.moi){ this.enJeu = false; o.message('Tu n\'es pas dans cette partie.'); return; }
    A.events.length = 0; this.since = 0; this.sortants = []; this.finT = performance.now() + s.duree * 1000;
    this.ordre = s.joueurs.map(j => j.client); this.partis = new Set(); this.vuT = {}; const t0 = performance.now(); this.ordre.forEach(c => this.vuT[c] = t0);
    o.demarre(); o.message('C\'est parti pour ' + s.duree / 60 + ' minutes ! 🐍', 3000);
    this.boucle();
  }
  async boucle(){
    while(this.enJeu){
      const t0 = performance.now(), G = this.G;
      const pos = G.A.serpents.filter(s => s.local && s.vivant).map(s => [s.id, r1(s.x), r1(s.y), Math.round(s.a * 100) / 100, Math.round(s.masse), s.boost ? 1 : 0]);
      if(this.pdrops && this.pdrops.length){ this.sortants.push({ k:'p', l:this.pdrops }); this.pdrops = []; }
      const e = this.sortants; this.sortants = [];
      try{ const r = await post({ action:'sync', code:this.code, client:this.client, since:this.since, msgs:{ p:pos, e } });
        if(this.since === 0) this.since = r.id; else { this.since = r.id; const now = performance.now(); r.msgs.forEach(m => { this.vuT[m.c] = now; this.recoit(m.m); }); } }
      catch(err){ this.sortants = e.concat(this.sortants).slice(-400); }
      if(performance.now() > this.finT && !G.fini) this.termine();
      if(this.enJeu) for(const c of this.ordre){ if(c !== this.client && !this.partis.has(c) && performance.now() - (this.vuT[c] || 0) > 8000) this.depart(c, true); }
      const reste = 120 - (performance.now() - t0); if(reste > 0) await new Promise(r => setTimeout(r, reste));
    }
  }
  serpent(id){ return this.G.A.serpents.find(s => s.id === id); }
  recoit(m){
    const A = this.G.A, now = performance.now();
    (m.p || []).forEach(([id, x, y, a, masse, b]) => { const s = this.serpent(id); if(!s || s.local) return; s.net = { x, y, a, t:now }; s.masse = masse; s.boost = !!b; if(masse > s.meilleur) s.meilleur = masse;
      if(!s.vivant && !s.mortRecu){ renait(A, s, { x, y, a }); s.masse = masse; } });
    (m.e || []).forEach(e => {
      if(e.k === 'part'){ this.depart(e.client); return; }
      if(e.k === 'f'){ mangeFixe(A, e.i, e.g); return; }
      if(e.k === 'd'){ A.perles.delete(e.id); return; }
      if(e.k === 'p'){ e.l.forEach(([id, x, y, v, c]) => ajouteDrop(A, x, y, v, c, id)); return; }
      const s = this.serpent(e.id); if(!s) return;
      if(e.k === 'mort' && s.vivant){ (e.l || []).forEach(([id, x, y, v, c]) => ajouteDrop(A, x, y, v, c, id)); s.mortRecu = true; this.recu = true; meurt(A, s, e.par != null ? this.serpent(e.par) : null, false); this.recu = false; }
      else if(e.k === 'nait' && !s.local){ s.mortRecu = false; renait(A, s, { x:e.x, y:e.y, a:e.a }); s.net = { x:e.x, y:e.y, a:e.a, t:now };
        if(e.nom){ s.nom = e.nom; } } });
  }
  // avant chaque pas : les serpents des autres tablettes vont vers là où ils ont été vus (un peu en avance), leur corps suit
  avant(dt){
    const now = performance.now();
    for(const s of this.G.A.serpents){ if(s.local || !s.vivant || !s.net) continue;
      s.px = s.x; s.py = s.y; s.pa = s.a; if(s.invinc > 0) s.invinc -= dt;
      const v = s.boost ? CFG.boost : CFG.vitesse, age = Math.min(.4, (now - s.net.t) / 1000), tx = s.net.x + Math.cos(s.net.a) * v * age, ty = s.net.y + Math.sin(s.net.a) * v * age;
      const d = Math.hypot(tx - s.x, ty - s.y);
      if(d > 160){ s.x = tx; s.y = ty; s.a = s.net.a; s.chemin = [{ x:s.x, y:s.y }]; }
      else { const pasMax = v * dt * (d > 20 ? 1.6 : 1.05), k = Math.min(1, pasMax / (d || 1)); s.x += (tx - s.x) * k; s.y += (ty - s.y) * k; if(d > 1) s.a = Math.atan2(ty - s.py, tx - s.px); }
      pousseChemin(s); }
  }
  // ce qui se passe sur cette tablette et que les autres doivent savoir
  evenement(e){
    if(this.recu) return; const s = e.s;
    if(e.k === 'mangeF') this.sortants.push({ k:'f', i:e.i, g:e.g });
    else if(e.k === 'mangeD') this.sortants.push({ k:'d', id:e.id });
    else if(e.k === 'drop'){ const p = e.p; this.pdrops = this.pdrops || []; this.pdrops.push([p.id, r1(p.x), r1(p.y), p.v, p.c]); if(this.pdrops.length >= 6){ this.sortants.push({ k:'p', l:this.pdrops }); this.pdrops = []; } }
    else if(e.k === 'mort' && s.local) this.sortants.push({ k:'mort', id:s.id, par:e.par ? e.par.id : null, l:e.drops.map(p => [p.id, r1(p.x), r1(p.y), p.v, p.c]) });
  }
  nait(s){ this.sortants.push({ k:'nait', id:s.id, x:r1(s.x), y:r1(s.y), a:Math.round(s.a * 100) / 100, nom:s.bot ? s.nom : undefined }); }
  // le bouton ⏸ en ligne : pas de pause (les autres jouent), mais on peut quitter ; la machine prend la place
  demandeQuitter(){ this.o.modal(`<h2>🚪 Quitter la partie ?</h2><p>Les autres continuent : la machine prendra ta place.</p><div class="rang"><button class="pill go" id="mReste">▶ Je reste</button><button class="pill" id="mPart">🚪 Quitter</button></div>`);
    $('mReste').onclick = () => $('modal').classList.remove('on'); $('mPart').onclick = () => this.partir(); }
  async partir(){ const code = this.code; this.o.enregistre(this.G); this.quitte(); post({ action:'sync', code, client:this.client, since:this.since || 1, msgs:{ p:[], e:[{ k:'part', client:this.client }] } }).catch(() => {}); this.code = null; this.room = null; this.o.quitter(); }
  // un joueur est parti : s'il avait créé la partie, la tablette suivante reprend les machines ; sa place est jouée par la machine
  depart(c, silence){
    if(!this.enJeu || this.partis.has(c) || c === this.client) return; this.partis.add(c);
    const A = this.G.A, j = (this.room.joueurs.find(x => x.client === c) || {}), q = A.serpents.find(s => s.client === c);
    if(c === this.host) this.host = this.ordre.find(x => !this.partis.has(x));
    if(q){ q.nom = (j.nom || q.nom) + ' 🤖'; q.bot = true; q.niveau = 'normal'; q.ia = null; }
    if(this.host === this.client) for(const s of A.serpents){ if(s.local) continue; if(s.bot && (!s.client || this.partis.has(s.client))){ s.local = true; s.ia = null; s.net = null; s.mortRecu = false; if(!s.vivant) s.mortT = A.t; } }
    this.o.message(`${j.nom || 'Un joueur'} ${silence ? 'ne répond plus' : 'a quitté la partie'} : la machine prend sa place 🤖`, 3500);
  }
  termine(){
    const G = this.G; if(G.fini) return; G.fini = true;
    const cl = [...G.A.serpents].sort((a, b) => b.meilleur - a.meilleur), moi = G.moi, rang = cl.indexOf(moi) + 1;
    this.o.SON.gagne(); this.o.dit('fin', '', true); this.o.enregistre(G);
    this.o.modal(`<div style="font-size:60px">${rang === 1 ? '🏆' : '🐍'}</div><h2>${rang === 1 ? 'Tu as gagné !' : 'Fin de la partie'}</h2>
      <div class="res">${cl.slice(0, 6).map((s, i) => `<span>${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'} ${esc(s.nom)}${s === moi ? ' (toi)' : ''}</span><b>${Math.round(s.meilleur)}</b>`).join('')}</div>
      <p style="margin:0">Serpents tombés : <b>${G.killsPartie}</b> · perles : <b>${G.perlesPartie}</b></p>
      <div class="rang"><button class="pill go" id="mSalon">🐍 Revenir au salon</button><button class="pill" id="mMenu2">🏠 Menu</button></div>`);
    $('mSalon').onclick = () => { this.quitte(); this.o.quitter(); this.room.etat = 'attente'; this.ouvreSalon(); if(this.host === this.client) post({ action:'update', code:this.code, client:this.client, state:this.room }).catch(() => {}); this.attend(); };
    $('mMenu2').onclick = () => { this.quitte(); this.code = null; this.room = null; this.o.quitter(); };
  }
  quitte(){ this.enJeu = false; this.status = this.code ? 'salon' : 'menu'; }
}
