/* Serpent Légendes · l'arène : les serpents de la machine (21/11).
   Une petite machine à états, comme le demande le cahier des charges : FUIR (corps et bords devant : toujours en premier),
   MANGER (le meilleur coin de perles autour), CHASSER (couper la route d'un serpent plus petit, avec un boost),
   PROMENER. Elles décident toutes les 120 à 350 ms selon leur niveau, voient à une distance limitée et se trompent un peu. */
import { CFG, rayon, corpsProches } from './moteur.js';

const NIV = { facile:{ reac:.35, vue:260, erreur:.35, chasse:0 }, normal:{ reac:.2, vue:340, erreur:.18, chasse:.25 }, difficile:{ reac:.11, vue:420, erreur:.07, chasse:.55 } };

export function pensent(A, dt){
  for(const s of A.serpents){
    if(!s.vivant || !s.local || !s.bot) continue;
    const n = NIV[s.niveau] || NIV.normal;
    s.ia = s.ia || { t:Math.random() * n.reac, etat:'promener', cible:null, tBoost:0 };
    const I = s.ia; I.t -= dt; I.tBoost -= dt;
    // 1. FUIR (à chaque pas, pas seulement quand elle réfléchit) : on regarde devant ; si un corps ou le bord est proche, on prend la direction la plus libre
    const r = rayon(s.masse), voir = 70 + r * 2.5, dirs = [0, -.5, .5, -1, 1, -1.6, 1.6, -2.3, 2.3];
    const libre = da => { const a = s.a + da; let m = 1e9;
      for(const k of [.3, .6, 1]){ const x = s.x + Math.cos(a) * voir * k, y = s.y + Math.sin(a) * voir * k;
        const bord = Math.min(x, y, A.taille - x, A.taille - y); if(bord < r + 30) m = Math.min(m, bord);
        corpsProches(A, x, y, 40, (o, px, py, ro) => { if(o === s) return; const d = Math.hypot(px - x, py - y) - ro - r; if(d < m) m = d; }); }
      return m; };
    const devant = libre(s.vise - s.a);
    if(devant < 30 && Math.random() > n.erreur * .15){ let best = 0, bv = -1e9; for(const d of dirs){ const v = libre(d) - Math.abs(d) * 8; if(v > bv){ bv = v; best = d; } } s.vise = s.a + best; I.etat = 'fuir'; I.t = Math.max(I.t, .12);
      s.veutBoost = bv > 60 && devant < 5 && s.masse > 140 && Math.random() < .3; if(s.veutBoost) I.tBoost = .3; continue; }
    if(I.t > 0){ s.veutBoost = s.veutBoost && I.tBoost > 0; continue; }
    I.t = n.reac * (.8 + Math.random() * .5);
    // 2. CHASSER : un serpent plus petit tout près, on passe devant lui
    if(Math.random() < n.chasse){
      let proie = null, pd = 1e9; for(const o of A.serpents){ if(o === s || !o.vivant || o.masse > s.masse * .9) continue; const d = Math.hypot(o.x - s.x, o.y - s.y); if(d < n.vue && d < pd){ pd = d; proie = o; } }
      if(proie){ const px = proie.x + Math.cos(proie.a) * 120, py = proie.y + Math.sin(proie.a) * 120; s.vise = Math.atan2(py - s.y, px - s.x); I.etat = 'chasser';
        if(s.masse > 160 && pd < 220){ s.veutBoost = true; I.tBoost = .5; } continue; }
    }
    // 3. MANGER : la perle la plus intéressante (valeur / distance) dans le champ de vision
    let bp = null, bv = 0; for(const p of A.perles.values()){ const dx = p.x - s.x, dy = p.y - s.y; if(Math.abs(dx) > n.vue || Math.abs(dy) > n.vue) continue; const d = Math.hypot(dx, dy) + 30;
      const derriere = Math.cos(Math.atan2(dy, dx) - s.a) < -.3 ? 2.2 : 1; const v = p.v / (d * derriere); if(v > bv){ bv = v; bp = p; } }
    if(bp){ s.vise = Math.atan2(bp.y - s.y, bp.x - s.x) + (Math.random() - .5) * n.erreur; I.etat = 'manger'; s.veutBoost = false; continue; }
    // 4. PROMENER : vers le centre, en ondulant
    const c = A.taille / 2; s.vise = Math.atan2(c - s.y, c - s.x) + Math.sin(A.t + s.id) * .9; I.etat = 'promener'; s.veutBoost = false;
  }
}
