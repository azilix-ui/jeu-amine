/* Yajour (ياجور, « les briques ») — la physique et les règles, sans dessin (testées en Node : docs/yajour/test-monde.mjs).
   D'après le cahier des charges du papa (17/11, « Let's Go Mightycat », puzzle physique 3D), adapté au site : un jeu ORIGINAL,
   tunisien : le héros de la famille, en costume de super-héros avec sa cape, s'élance d'une rosace de zellige et fait tomber
   des constructions de briques (yajour), de pierre, de jarres… à Sidi Bou Saïd, à El Jem et au Sahara.
   Moteur physique : Rapier (lib/rapier3d-compat-0.14.0.es.js, licence Apache 2.0), pas fixe 1/60 s, tout déterministe.
   Unités : mètres. Le plateau est centré en (0, 0, 0), son dessus à y = 0 ; le héros part de LANCE (derrière, côté z négatif). */

export const REGLAGES = {
  gravite:-9.81, pas:1 / 60, sousPas:1,
  heros:{ rayon:.42, masse:2, restitution:.25, friction:.6 },
  vitesse:16,                   // m/s au départ (chaque niveau peut la changer)
  repos:{ vitesse:.15, duree:1.5, max:8 },   // au repos quand tout va moins vite que .15 m/s pendant 1,5 s, ou au bout de 8 s
  lourd:3,                      // le pouvoir « lourd » multiplie la masse
  boum:{ rayon:3.2, force:26 }, // explosion (caisse de feux d'artifice, pouvoir « boum ») : impulsion qui décroît avec la distance
  casse:7,                      // une jarre se casse au-delà de cet élan (impulsion de contact, N·s)
};
export const LANCE = { x:0, y:1.1, z:-13 };

// les matières : densité (kg/m³ ramenée à notre échelle), frottement, rebond, points
export const MATIERES = {
  brique:  { d:1.6, f:.75, r:.05, pts:100 },
  bois:    { d:.6,  f:.6,  r:.1,  pts:100 },
  pierre:  { d:2.4, f:.8,  r:.02, pts:150 },
  palmier: { d:.8,  f:.7,  r:.1,  pts:100 },
  marbre:  { d:2.2, f:.04, r:.05, pts:150 },   // glisse
  matelas: { d:.4,  f:.9,  r:.95, pts:50 },    // rebondit
  jarre:   { d:1.2, f:.6,  r:.05, pts:200, fragile:true },
  feux:    { d:.7,  f:.6,  r:.1,  pts:200, explose:true },
  zellige: { d:2,   f:.8,  r:.02, pts:0, fixe:true },   // pilier ancré : ne bouge pas
  chat:    { d:.5,  f:.9,  r:.0,  pts:0 },
};

/* ---------- petits outils pour écrire les niveaux ---------- */
const B = (t, x, y, z, sx, sy, sz, o = {}) => Object.assign({ t, p:[x, y, z], s:[sx, sy, sz] }, o);
const cube = (t, x, y, z, c = 1, o) => B(t, x, y + c / 2, z, c, c, c, o);
const tour = (t, x, z, n, c = 1, y0 = 0) => Array.from({ length:n }, (_, k) => cube(t, x, y0 + k * c, z, c));
function mur(t, x, z, larg, haut, y0 = 0){   // briques posées en quinconce (0,8 × 0,4 × 0,4)
  const out = [], L = .8, H = .4;
  for(let r = 0; r < haut; r++){ const dec = r % 2 ? L / 2 : 0, n = r % 2 ? larg - 1 : larg;
    for(let k = 0; k < n; k++) out.push(B(t, x - (larg - 1) * L / 2 + k * L + dec, y0 + H / 2 + r * H, z, L * .98, H * .98, H)); }
  return out;
}
function pyramide(t, x, z, base, c = .8){ const out = []; for(let r = 0; r < base; r++) for(let k = 0; k < base - r; k++) out.push(cube(t, x - (base - r - 1) * c / 2 + k * c, r * c, z, c * .98)); return out; }
const dalle = (t, x, y, z, larg, prof = 1.2, ep = .25) => B(t, x, y + ep / 2, z, larg, ep, prof);
const colonne = (t, x, z, h, r = .35, y0 = 0) => ({ t, forme:'cyl', p:[x, y0 + h / 2, z], s:[r * 2, h, r * 2] });
const jarre = (x, y, z, o = {}) => Object.assign({ t:'jarre', forme:'jarre', p:[x, y + .45, z], s:[.6, .9, .6] }, o);
function cage(x, y, z){   // le chat dans une cage de planches : 4 barreaux, un toit
  const c = [], h = .9;
  for(const [dx, dz] of [[-.4, -.4], [.4, -.4], [-.4, .4], [.4, .4]]) c.push(B('bois', x + dx, y + h / 2, z + dz, .14, h, .14, { cage:true }));
  c.push(B('bois', x, y + h + .07, z, 1.0, .14, 1.0, { cage:true }));
  c.push(B('chat', x, y + .25, z, .4, .5, .4, { chat:true }));
  return c;
}

/* ---------- les niveaux : 3 mondes de 5 (le prototype du cahier : 15 niveaux) ---------- */
export const MONDES = [
  { id:'sidibou', nom:'Sidi Bou Saïd', ar:'سيدي بو سعيد', sol:'sol_sidibou', pano:'pano_sidibou', ciel:0x8fd0ff },
  { id:'eljem', nom:'El Jem', ar:'الجم', sol:'sol_eljem', pano:'pano_eljem', ciel:0xa9cdf0 },
  { id:'sahara', nom:'Le Sahara', ar:'الصحراء', sol:'sol_sahara', pano:'pano_sahara', ciel:0xf0a070 },
];
export const NIVEAUX = [
  // Sidi Bou Saïd : briques et bois (on apprend)
  { m:0, nom:'La petite tour', tirs:3, but:{ type:'tomber', min:3 }, par:900, aide:'Glisse le doigt pour viser, lâche pour t’envoler ! Fais tomber 3 blocs du toit.', blocs:[...tour('bois', 0, 0, 4)] },
  { m:0, nom:'Le mur de yajour', tirs:3, but:{ type:'tomber', min:8 }, par:1600, aide:'Un mur de briques : vise le milieu !', blocs:[...mur('brique', 0, 0, 5, 5)] },
  { m:0, nom:'Les deux tours', tirs:3, but:{ type:'tomber', min:7 }, par:1100, aide:'Deux tours : peux-tu les faire tomber toutes les deux ?', blocs:[...tour('bois', -1.4, .5, 4), ...tour('brique', 1.4, .5, 4), dalle('bois', 0, 4, .5, 3.6)] },
  { m:0, nom:'Le chat sur le toit', tirs:3, but:{ type:'chat' }, par:1200, aide:'Un chaton est enfermé ! Casse sa cage sans le faire tomber du toit.', blocs:[...cage(0, 0, 1.5), ...tour('bois', -1.5, -.5, 2), ...tour('bois', 1.5, -.5, 2)] },
  { m:0, nom:'La jarre d’or', tirs:3, but:{ type:'cible' }, par:1000, aide:'Touche la jarre d’or cachée derrière le mur.', blocs:[...mur('brique', 0, -.5, 4, 3), jarre(0, 0, 1.2, { cible:true }), ...tour('bois', -2.3, 1.2, 3), ...tour('bois', 2.3, 1.2, 3)] },
  // El Jem : pierre, colonnes, jarres fragiles, marbre glissant
  { m:1, nom:'Les colonnes', tirs:3, vitesse:18, but:{ type:'tomber', min:3 }, par:1200, aide:'Les colonnes de pierre sont lourdes : vise le haut pour les renverser.', blocs:[colonne('pierre', -1.5, 0, 2.6), colonne('pierre', 0, 0, 2.6), colonne('pierre', 1.5, 0, 2.6), dalle('pierre', 0, 2.6, 0, 4.2, 1)] },
  { m:1, nom:'Les jarres de Nabeul', tirs:3, but:{ type:'cible' }, par:1050, aide:'Les jarres se cassent quand on les cogne fort. Casse les deux jarres d’or !', blocs:[...tour('pierre', -1.6, 0, 2), jarre(-1.6, 2, 0, { cible:true }), ...tour('pierre', 1.6, 0, 2), jarre(1.6, 2, 0, { cible:true }), dalle('marbre', 0, 0, 1.5, 2)] },
  { m:1, nom:'Le sol de marbre', tirs:3, but:{ type:'tomber', min:6 }, par:1000, aide:'Le marbre glisse : pousse les blocs jusqu’au bord !', blocs:[dalle('zellige', 0, -.25, .5, 6, 3, .25), ...[-1.5, -.5, .5, 1.5].map(x => cube('marbre', x, 0, .5, .8)), ...[-1, 0, 1].map(x => cube('pierre', x, .8, .5, .8))] },
  { m:1, nom:'L’arène', tirs:4, vitesse:17, but:{ type:'tomber', min:7 }, par:1700, aide:'Une arène comme à El Jem : fais tout tomber !', blocs:[...[-2.2, -.75, .75, 2.2].map(x => colonne('pierre', x, 1, 1.8, .3)), dalle('pierre', -1.5, 1.8, 1, 1.9, 1), dalle('pierre', 1.5, 1.8, 1, 1.9, 1), ...tour('brique', 0, 1, 2, .8), ...pyramide('brique', 0, -1.2, 3)] },
  { m:1, nom:'Le chaton des gradins', tirs:3, but:{ type:'chat' }, par:1100, aide:'Libère le chaton, mais attention : il ne doit pas tomber !', blocs:[dalle('zellige', 0, -.25, 1.5, 3, 3, .25), ...cage(0, 0, 1.5), ...tour('pierre', -1.8, -.5, 3, .8), ...tour('pierre', 1.8, -.5, 3, .8), jarre(0, 0, -.6)] },
  // Le Sahara : troncs de palmier, caisses de feux d'artifice qui explosent, matelas qui rebondissent
  { m:2, nom:'Le feu d’artifice', tirs:2, but:{ type:'tomber', min:8 }, par:1500, aide:'La caisse rouge est pleine de feux d’artifice : touche-la et… boum !', blocs:[...tour('palmier', -1.2, .5, 3), ...tour('palmier', 1.2, .5, 3), cube('feux', 0, 0, .5, .9), ...tour('palmier', 0, -1, 2, .8)] },
  { m:2, nom:'Le matelas', tirs:3, but:{ type:'tomber', min:5 }, par:1100, aide:'Rebondis sur le matelas pour atteindre la tour du fond.', blocs:[B('matelas', 0, .3, -1.6, 2.6, .6, 1.4), ...tour('palmier', 0, 2, 5, .8)] },
  { m:2, nom:'L’oasis', tirs:3, but:{ type:'cible' }, par:1700, aide:'Les jarres d’or sont près de l’oasis. Une caisse de feux peut t’aider !', blocs:[jarre(-1.8, 0, 1.2, { cible:true }), jarre(1.8, 0, 1.2, { cible:true }), cube('feux', 0, 0, 1.2, .9), ...mur('brique', 0, -.6, 5, 2)] },
  { m:2, nom:'La caravane', tirs:4, but:{ type:'tomber', min:12 }, par:1700, aide:'Une grande caravane de caisses : fais tout tomber du plateau !', blocs:[...pyramide('palmier', -1.6, .5, 3), ...pyramide('palmier', 1.6, .5, 3), cube('feux', 0, 0, .5, .8), ...tour('brique', 0, -1.5, 3, .6)] },
  { m:2, nom:'Le grand final', tirs:4, but:{ type:'chat' }, par:1500, aide:'Le dernier chaton est tout en haut ! Libère-le sans le faire tomber.', blocs:[dalle('zellige', 0, 1.6, 1, 2.4, 2.4, .3), colonne('zellige', -.9, 1, 1.6, .25), colonne('zellige', .9, 1, 1.6, .25), ...cage(0, 1.9, 1), cube('feux', -2.2, 0, -.5, .8), ...tour('palmier', 2.2, -.5, 3, .8)] },
];
export const PLATEAU = { demi:4.5 };   // le plateau fait 9 m × 9 m

/* ---------- le monde physique d'un niveau ---------- */
export function monde(RAPIER, niv, reg = REGLAGES){
  const W = new RAPIER.World({ x:0, y:reg.gravite, z:0 }); W.timestep = reg.pas;
  const evq = new RAPIER.EventQueue(true);
  // le plateau (fixe)
  W.createCollider(RAPIER.ColliderDesc.cuboid(PLATEAU.demi, .5, PLATEAU.demi).setTranslation(0, -.5, 0).setFriction(.8));
  // le sol tout autour, plus bas (ce qui tombe du plateau est « sorti »)
  W.createCollider(RAPIER.ColliderDesc.cuboid(60, .5, 60).setTranslation(0, -4.5, 0).setFriction(.9));
  const corps = [];
  niv.blocs.forEach((b, id) => {
    const M = MATIERES[b.t], fixe = !!M.fixe;
    const rb = W.createRigidBody((fixe ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic().setLinearDamping(.05).setAngularDamping(.2).setCanSleep(true))
      .setTranslation(b.p[0], b.p[1], b.p[2]));
    let cd;
    if(b.forme === 'cyl') cd = RAPIER.ColliderDesc.cylinder(b.s[1] / 2, b.s[0] / 2);
    else if(b.forme === 'jarre') cd = RAPIER.ColliderDesc.cylinder(b.s[1] / 2, b.s[0] / 2 * .85);
    else cd = RAPIER.ColliderDesc.cuboid(b.s[0] / 2, b.s[1] / 2, b.s[2] / 2);
    cd.setDensity(M.d).setFriction(M.f).setRestitution(M.r).setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS).setContactForceEventThreshold(5);
    const col = W.createCollider(cd, rb);
    corps.push({ id, b, M, rb, col, depart:[...b.p], sorti:false, casse:false, explose:false });
  });
  const parCol = new Map(); corps.forEach(c => parCol.set(c.col.handle, c));
  const S = { W, RAPIER, reg, niv, evq, corps, parCol, heros:[], t:0, ev:[], calme:0 };
  return S;
}

/* le lancer : direction donnée par l'azimut (gauche/droite, en degrés) et l'élévation (vers le haut, en degrés) */
export function direction(az, el){ const a = az * Math.PI / 180, e = el * Math.PI / 180; return { x:Math.sin(a) * Math.cos(e), y:Math.sin(e), z:Math.cos(a) * Math.cos(e) }; }
export function lance(S, az, el, pouvoir = null){
  const { RAPIER, W, reg } = S, v = S.niv.vitesse || reg.vitesse, d = direction(az, el), n = pouvoir === 'triple' ? 3 : 1;
  for(let k = 0; k < n; k++){
    const da = n === 3 ? (k - 1) * 4 : 0, dd = direction(az + da, el);
    const rb = W.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(LANCE.x, LANCE.y, LANCE.z).setLinvel(dd.x * v, dd.y * v, dd.z * v).setCcdEnabled(true).setAngularDamping(.5));
    const m = reg.heros.masse * (pouvoir === 'lourd' ? reg.lourd : 1), vol = 4 / 3 * Math.PI * reg.heros.rayon ** 3;
    const col = W.createCollider(RAPIER.ColliderDesc.ball(reg.heros.rayon).setDensity(m / vol).setRestitution(reg.heros.restitution).setFriction(reg.heros.friction)
      .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS).setContactForceEventThreshold(5), rb);
    S.heros.push({ rb, col, pouvoir, boum:pouvoir === 'boum', t:0 });
  }
  S.calme = 0; S.ev.push({ k:'lance', n });
}

/* l'arc prévu (sans les chocs) : pour la ligne de visée */
export function arc(S, az, el, pts = 40, dt = .05){ const v = S.niv.vitesse || S.reg.vitesse, d = direction(az, el), g = S.reg.gravite, out = [];
  for(let q = 1; q <= pts; q++){ const t = q * dt, y = LANCE.y + d.y * v * t + g * t * t / 2; out.push([LANCE.x + d.x * v * t, y, LANCE.z + d.z * v * t]); if(y < -4) break; }
  return out; }
/* viser un point : l'élévation (tir tendu) qui y mène à la vitesse du niveau, ou null si c'est trop loin */
export function viser(S, x, y, z){ const v = S.niv.vitesse || S.reg.vitesse, g = -S.reg.gravite, dx = x - LANCE.x, dz = z - LANCE.z, dy = y - LANCE.y, h = Math.hypot(dx, dz);
  const az = Math.atan2(dx, dz) * 180 / Math.PI, r = v ** 4 - g * (g * h * h + 2 * dy * v * v); if(r < 0) return null;
  return { az, el:Math.atan((v * v - Math.sqrt(r)) / (g * h)) * 180 / Math.PI }; }

function explosion(S, x, y, z, src){ const { rayon, force } = S.reg.boum;
  for(const c of S.corps){ if(c.casse || c.M.fixe) continue; const p = c.rb.translation(), dx = p.x - x, dy = p.y - y, dz = p.z - z, d = Math.hypot(dx, dy, dz);
    if(d > rayon || d < 1e-3) continue; const f = force * (1 - d / rayon) * Math.min(1, c.rb.mass() / 2 + .3); c.rb.wakeUp(); c.rb.applyImpulse({ x:dx / d * f, y:dy / d * f + f * .4, z:dz / d * f }, true); }
  S.ev.push({ k:'boum', p:[x, y, z], src }); }

/* un pas de simulation : les chocs, les jarres qui cassent, les caisses qui explosent, ce qui tombe */
export function pas(S){
  const { W, evq, reg } = S;
  W.step(evq); S.t += reg.pas;
  const aExploser = [];
  evq.drainContactForceEvents(e => {
    const a = S.parCol.get(e.collider1()), b = S.parCol.get(e.collider2()), f = e.totalForceMagnitude() * reg.pas;   // élan échangé pendant ce pas
    const h = S.heros.find(x => x.col.handle === e.collider1() || x.col.handle === e.collider2());
    for(const c of [a, b]){ if(!c || c.casse) continue;
      if(c.M.fragile && f > reg.casse){ c.casse = true; S.ev.push({ k:'casse', c }); }
      if(c.M.explose && !c.explose && f > reg.casse * .8){ c.explose = true; aExploser.push(c); } }
    if(h && h.boum && !h.aExplose && (a || b)){ h.aExplose = true; const p = h.rb.translation(); explosion(S, p.x, p.y, p.z, 'heros'); }
    if(f > 2 && (a || b)) S.ev.push({ k:'choc', f, c:a || b, heros:!!h });
  });
  for(const c of aExploser){ const p = c.rb.translation(); c.casse = true; explosion(S, p.x, p.y, p.z, 'feux'); }
  // les corps cassés quittent le monde
  for(const c of S.corps) if(c.casse && !c.parti){ c.parti = true; W.removeRigidBody(c.rb); }
  // ce qui est sorti du plateau
  for(const c of S.corps){ if(c.parti || c.sorti || c.M.fixe) continue; const p = c.rb.translation();
    if(p.y < -.6){ c.sorti = true; S.ev.push({ k:'sorti', c }); } }   // tombé plus bas que le dessus du plateau
  for(const h of S.heros) h.t += reg.pas;
  // le calme : tout est (presque) arrêté ?
  let vmax = 0; for(const c of S.corps) if(!c.parti && !c.M.fixe && c.rb.translation().y > -3.9){ const v = c.rb.linvel(); vmax = Math.max(vmax, Math.hypot(v.x, v.y, v.z)); }
  for(const h of S.heros){ const p = h.rb.translation(); if(p.y > -3.9){ const v = h.rb.linvel(); vmax = Math.max(vmax, Math.hypot(v.x, v.y, v.z)); } }
  S.calme = vmax < reg.repos.vitesse ? S.calme + reg.pas : 0;
}
/* jusqu'au repos (ou 8 s) : rend le temps passé */
export function auRepos(S){ return S.calme >= S.reg.repos.duree || S.tTir != null && S.t - S.tTir >= S.reg.repos.max; }
export function simuleTir(S, az, el, pouvoir){ lance(S, az, el, pouvoir); S.tTir = S.t; let n = 0; do{ pas(S); n++; }while(!auRepos(S) && n < 60 * 12); }

/* ---------- les objectifs ---------- */
export function bilan(S){
  const niv = S.niv, but = niv.but, mobiles = S.corps.filter(c => !c.M.fixe && !c.b.chat);
  const sortis = mobiles.filter(c => c.sorti || c.casse).length;
  const cibles = S.corps.filter(c => c.b.cible), cTouchees = cibles.filter(c => c.casse || c.sorti).length;
  let ok = false, fait = 0, total = 1;
  if(but.type === 'tomber'){ fait = Math.min(sortis, but.min); total = but.min; ok = sortis >= but.min; }
  else if(but.type === 'cible'){ fait = cTouchees; total = cibles.length; ok = cTouchees === cibles.length; }
  else if(but.type === 'chat'){
    const chat = S.corps.find(c => c.b.chat), cage = S.corps.filter(c => c.b.cage);
    const libre = c => { if(c.sorti || c.casse) return true; const p = c.rb.translation(); return Math.hypot(p.x - c.depart[0], p.y - c.depart[1], p.z - c.depart[2]) > .6; };
    fait = cage.filter(libre).length; total = cage.length;
    const chatOk = chat && !chat.sorti && !chat.casse;
    ok = fait === total && chatOk; if(!chatOk) S.chatTombe = true;
  }
  return { ok, fait, total, sortis, cibles:cTouchees, chatTombe:!!S.chatTombe };
}
export function score(S, tirsRestants){ const b = bilan(S); return b.sortis * 100 + b.cibles * 50 + (b.ok ? 300 : 0) + tirsRestants * 200; }
export function etoiles(S, tirsRestants){ const b = bilan(S); if(!b.ok) return 0; const sc = score(S, tirsRestants), par = S.niv.par || 1500; return sc >= par * .9 ? 3 : sc >= par * .65 ? 2 : 1; }
export const pieces = sc => Math.min(80, 20 + Math.floor(sc / 500));
