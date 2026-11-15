/* Les Écuries — « nos écuries » en photos réalistes (15/11, demandé par le papa ; les concours restent en 3D).
   Vue d'ensemble : chaque cheval (photo ComfyUI détourée, img/h-<id>.webp) devant sa porte de box ; on glisse pour se promener,
   on touche un cheval pour s'en occuper. Soins : la photo en grand dans l'aire de pansage, des taches posées sur les repères
   (ancres.js : sabots, œil, naseau, crinière, queue, épaule, flanc…), chacune demande la bonne brosse.
   createPhoto(canvas, api, IMG) ; api = { sfx(nom), pick(i), spot(evt) } — même contrat que l'écurie 3D de monde.js. */
import { ANCRES } from './ancres.js';

export function createPhoto(canvas, api, IMG){
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, DPR = 1, raf = 0, last = 0, on = false, ST = null;
  const IM = {};
  const img = src => { if(IM[src]) return IM[src]; const i = new Image(); i.src = src; IM[src] = i; return i; };
  const ok = i => i && i.complete && i.naturalWidth > 0;
  function resize(){ const r = canvas.getBoundingClientRect(); DPR = Math.min(2, devicePixelRatio || 1); W = Math.max(2, r.width); H = Math.max(2, r.height); canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR); }
  addEventListener('resize', () => { if(on) resize(); });

  /* ---------- les taches (mêmes dessins que l'écurie 3D) ---------- */
  const TEX = {};
  function spotTex(kind){
    if(TEX[kind]) return TEX[kind];
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), R = (a, b) => a + Math.random() * (b - a);
    const blobs = (col, n, r) => { g.fillStyle = col; for(let i = 0; i < n; i++){ g.beginPath(); g.ellipse(32 + R(-14, 14), 32 + R(-12, 12), R(r * .6, r), R(r * .5, r), R(0, 3), 0, 7); g.fill(); } };
    if(kind === 'boue'){ blobs('#4a3120', 7, 13); blobs('#6b4a30', 4, 7); }
    else if(kind === 'poussiere'){ blobs('rgba(214,196,160,.75)', 8, 12); blobs('rgba(240,230,205,.8)', 6, 5); }
    else if(kind === 'terne'){ g.strokeStyle = 'rgba(150,150,150,.85)'; g.lineWidth = 3; for(let i = 0; i < 9; i++){ g.beginPath(); g.moveTo(R(10, 54), R(10, 54)); g.lineTo(R(10, 54), R(10, 54)); g.stroke(); } blobs('rgba(170,170,170,.35)', 4, 14); }
    else if(kind === 'yeux'){ blobs('#d8c76a', 3, 8); blobs('#f1e7a8', 2, 4); }
    else if(kind === 'noeud'){ g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); for(let a = 0; a < 16; a += .4) g.lineTo(32 + Math.cos(a) * (4 + a), 32 + Math.sin(a * 1.3) * (3 + a)); g.stroke(); g.strokeStyle = '#7a5a3a'; g.lineWidth = 2.5; g.stroke(); }
    else if(kind === 'pied'){ blobs('#3a2a1e', 6, 11); g.fillStyle = '#8a8a8a'; g.beginPath(); g.arc(26, 30, 4, 0, 7); g.fill(); g.beginPath(); g.arc(40, 38, 3, 0, 7); g.fill(); }
    else if(kind === 'corne'){ g.fillStyle = 'rgba(190,180,165,.9)'; g.beginPath(); g.ellipse(32, 34, 18, 12, 0, 0, 7); g.fill(); g.strokeStyle = '#7d7468'; g.lineWidth = 2; for(let i = 0; i < 4; i++){ g.beginPath(); g.moveTo(20 + i * 8, 26); g.lineTo(18 + i * 8, 42); g.stroke(); } }
    else if(kind === 'sueur'){ blobs('rgba(255,255,255,.55)', 9, 12); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; for(let i = 0; i < 6; i++){ g.beginPath(); g.arc(R(14, 50), R(14, 50), R(3, 7), 0, 7); g.stroke(); } }
    else if(kind === 'etoile'){ g.fillStyle = '#fff6b0'; g.beginPath(); for(let i = 0; i < 8; i++){ const a = i * Math.PI / 4, r = i % 2 ? 7 : 28; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.fill(); }
    else if(kind === 'coeur'){ g.font = '48px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('💛', 32, 36); }
    else if(kind === 'foin'){ g.font = '48px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🌾', 32, 36); }
    return TEX[kind] = c;
  }
  const NEED = { pied:'curepied', corne:'graisse', boue:'etrille', poussiere:'bouchon', terne:'brossedouce', yeux:'eponge', noeud:'peigne', sueur:'couteau' };
  const ALT = { noeud:['peigne', 'brossecrins'] };   // la brosse à crins démêle aussi (deux fois plus vite)
  const TAILLE = { pied:.085, corne:.08, boue:.15, poussiere:.1, terne:.13, yeux:.06, noeud:.1, sueur:.17 };
  function spawnSpots(it){
    const S = [], add = (kind, a) => { if(!ancre(it.def.id, a)) return; S.push({ kind, need:NEED[kind], a, hp:1, j:[(Math.random() - .5) * .02, (Math.random() - .5) * .02] }); };
    const level = it.dirt;
    if(it.sueur) ['epaule', 'flanc', 'dos', 'encolure'].forEach(a => add('sueur', a));
    if(level <= .02) return S;
    [0, 1, 2, 3].forEach(i => add('pied', 'sabot' + i));
    ['epaule', 'croupe', 'flanc', 'cuisse', 'dos'].slice(0, Math.max(2, Math.ceil(level * 5))).forEach(a => add('boue', a));
    if(level > .35){ add('poussiere', 'canon'); add('poussiere', 'jarret'); }
    add('terne', 'encolure'); add('terne', 'chanfrein'); add('yeux', 'oeil'); add('yeux', 'naseau');
    add('noeud', 'criniere1'); add('noeud', 'criniere2'); add('noeud', 'queue');
    return S;
  }
  const ancre = (id, a) => ANCRES[id] && ANCRES[id].a[a];

  /* ---------- ouvrir l'écurie ---------- */
  function openStable(list, o = {}){
    ST = { list, sel:-1, camX:0, tx:0, eat:0, fx:[], tool:null, spots:[], lustre:false, ptr:null };
    list.forEach(it => img(IMG + 'h-' + it.def.id + '.webp'));
    img(IMG + 'fond-ecurie.webp'); img(IMG + 'fond-pansage.webp');
    on = true; resize(); const sp = espace(); ST.camX = ST.tx = (o.at || 0) * sp; cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop);
  }
  const espace = () => Math.max(250, Math.min(W * .48, H * .62));
  function select(i){ const s = ST; if(!s) return; s.sel = i; s.lustre = false; if(i >= 0){ s.tx = i * espace(); const it = s.list[i]; s.spots = spawnSpots(it); } else s.spots = []; }
  function stop(){ on = false; cancelAnimationFrame(raf); ST = null; }
  function loop(t){ raf = requestAnimationFrame(loop); const dt = Math.min(.05, (t - last) / 1000 || .016); last = t; tick(dt, t / 1000); draw(t / 1000); }
  function tick(dt){ const s = ST; s.camX += (s.tx - s.camX) * Math.min(1, dt * 7); if(s.eat > 0) s.eat -= dt;
    for(let i = s.fx.length - 1; i >= 0; i--){ const f = s.fx[i]; f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; if(f.t > f.vie) s.fx.splice(i, 1); } }

  /* ---------- où est le cheval à l'écran ---------- */
  function placeEnsemble(i){ const s = ST, it = s.list[i], im = IM[IMG + 'h-' + it.def.id + '.webp'], A = ANCRES[it.def.id] || { w:760, h:640 };
    const hh = Math.min(H * .5, W * .55) * (.62 + .38 * (it.def.t || 1)), w = hh * A.w / A.h, cx = W / 2 + i * espace() - s.camX, bot = H * .9;
    return { x:cx - w / 2, y:bot - hh, w, h:hh, im }; }
  function placeSoin(){ const s = ST, it = s.list[s.sel], im = IM[IMG + 'h-' + it.def.id + '.webp'], A = ANCRES[it.def.id] || { w:760, h:640 };
    const portrait = W < H, haut = portrait ? 180 : 110, bas = portrait ? 215 : 205;
    let hh = Math.min(H - haut - bas, (W * (portrait ? .96 : .74)) * A.h / A.w) * (.86 + .14 * Math.min(1.1, it.def.t || 1)); const w = hh * A.w / A.h;
    const bob = s.eat > 0 ? Math.sin(s.eat * 9) * 3 : 0;
    return { x:W / 2 - w / 2, y:H - bas - hh + bob, w, h:hh, im }; }
  const pt = (P, a) => [P.x + a[0] * P.w, P.y + a[1] * P.h];

  /* ---------- le dessin ---------- */
  function cover(im, par = 0){ if(!ok(im)){ ctx.fillStyle = '#d9c39a'; ctx.fillRect(0, 0, W, H); return; } const k = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k; ctx.drawImage(im, (W - w) / 2 - par, (H - h) / 2, w, h); }
  function draw(t){
    const s = ST; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if(s.sel < 0){
      // l'allée de l'écurie : la photo des boxes, qui défile un peu moins vite que les chevaux
      const f = IM[IMG + 'fond-ecurie.webp'];
      if(ok(f)){ const h = H, w = h * f.naturalWidth / f.naturalHeight, off = ((s.camX * .7) % w + w) % w; for(let x = -off; x < W; x += w) ctx.drawImage(f, x, 0, w, h); } else { ctx.fillStyle = '#c8a36e'; ctx.fillRect(0, 0, W, H); }
      const sol = ctx.createLinearGradient(0, H * .78, 0, H); sol.addColorStop(0, 'rgba(120,90,50,0)'); sol.addColorStop(1, 'rgba(90,64,36,.45)'); ctx.fillStyle = sol; ctx.fillRect(0, H * .78, W, H * .22);
      s.list.forEach((it, i) => { const P = placeEnsemble(i); if(P.x > W + 50 || P.x + P.w < -50) return;
        ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(P.x + P.w / 2, P.y + P.h * .985, P.w * .42, P.h * .035, 0, 0, 7); ctx.fill();
        const resp = 1 + Math.sin(t * 1.6 + i) * .004; ctx.translate(P.x + P.w / 2, P.y + P.h); ctx.scale(1, resp); if(ok(P.im)) ctx.drawImage(P.im, -P.w / 2, -P.h, P.w, P.h); ctx.restore();
        // la plaque avec son nom
        const nx = P.x + P.w / 2, ny = P.y - 14; ctx.font = '800 20px "Baloo 2", Nunito, sans-serif'; const tw = ctx.measureText(it.def.n).width + 30;
        ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(nx - tw / 2, ny - 18, tw, 34, 10) : ctx.rect(nx - tw / 2, ny - 18, tw, 34); ctx.fill(); ctx.fillStyle = '#ffe9a8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(it.def.n + (it.dirt > .5 || it.sueur ? ' 🧽' : ''), nx, ny); });
    } else {
      cover(IM[IMG + 'fond-pansage.webp']);
      const P = placeSoin(), it = s.list[s.sel];
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(P.x + P.w / 2, P.y + P.h * .985, P.w * .45, P.h * .04, 0, 0, 7); ctx.fill();
      const resp = 1 + Math.sin(t * 1.6) * .005; ctx.translate(P.x + P.w / 2, P.y + P.h); ctx.scale(1, resp); if(ok(P.im)) ctx.drawImage(P.im, -P.w / 2, -P.h, P.w, P.h); ctx.restore();
      // les taches
      s.spots.forEach(p => { if(p.hp <= 0) return; const a = ancre(it.def.id, p.a); if(!a) return; const [x, y] = pt(P, [a[0] + p.j[0], a[1] + p.j[1]]), r = P.h * TAILLE[p.kind];
        ctx.globalAlpha = .3 + .7 * Math.max(0, p.hp); ctx.drawImage(spotTex(p.kind), x - r / 2, y - r / 2, r, r); ctx.globalAlpha = 1; });
      if(s.eat > 0){ const a = ancre(it.def.id, 'naseau'); if(a){ const [x, y] = pt(P, a); ctx.font = `${Math.round(P.h * .09)}px serif`; ctx.textAlign = 'center'; ctx.fillText('🌾', x + Math.sin(s.eat * 6) * 4, y + P.h * .06); } }
      // la brosse dans la main
      if(s.ptr && s.tool){ const ti = img(IMG + 'o-' + s.tool + '.webp'); if(ok(ti)){ const z = Math.max(54, P.h * .13); ctx.save(); ctx.translate(s.ptr[0], s.ptr[1]); ctx.rotate(Math.sin(t * 18) * .12); ctx.beginPath(); ctx.arc(0, 0, z / 2, 0, 7); ctx.closePath(); ctx.save(); ctx.clip(); ctx.drawImage(ti, -z / 2, -z / 2, z, z); ctx.restore(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); } }
    }
    s.fx.forEach(f => { ctx.globalAlpha = Math.max(0, 1 - f.t / f.vie); const z = f.z * (1 + f.t * .8); ctx.drawImage(spotTex(f.k), f.x - z / 2, f.y - z / 2, z, z); }); ctx.globalAlpha = 1;
  }
  function fx(k, x, y, n = 5, z = 22){ for(let i = 0; i < n; i++) ST.fx.push({ k, x:x + (Math.random() - .5) * 30, y:y + (Math.random() - .5) * 30, vx:(Math.random() - .5) * 60, vy:-30 - Math.random() * 60, t:0, vie:.9, z }); }

  /* ---------- les gestes ---------- */
  const PT = { down:false, x:0, y:0, moved:0, hint:0, pet:0, lus:0 };
  canvas.addEventListener('pointerdown', e => { if(!on) return; e.preventDefault(); try{ canvas.setPointerCapture(e.pointerId); }catch(_){} PT.down = true; PT.x = e.clientX; PT.y = e.clientY; PT.moved = 0; const r = canvas.getBoundingClientRect(); if(ST.sel >= 0) ST.ptr = [e.clientX - r.left, e.clientY - r.top]; });
  canvas.addEventListener('pointermove', e => {
    if(!on || !PT.down) return; const s = ST, dx = e.clientX - PT.x, dy = e.clientY - PT.y, mv = Math.hypot(dx, dy); PT.x = e.clientX; PT.y = e.clientY; PT.moved += mv;
    if(s.sel < 0){ s.tx = Math.max(0, Math.min((s.list.length - 1) * espace(), s.tx - dx)); s.camX = s.tx; return; }
    const r = canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; s.ptr = [px, py];
    if(!s.tool) return; const P = placeSoin(), it = s.list[s.sel], reach = Math.max(34, P.h * .085);
    let hit = false, wrong = null;
    s.spots.forEach(p => { if(p.hp <= 0) return; const a = ancre(it.def.id, p.a); const [sx, sy] = pt(P, [a[0] + p.j[0], a[1] + p.j[1]]); if(Math.hypot(sx - px, sy - py) > reach) return;
      const bons = ALT[p.kind] || [p.need]; if(!bons.includes(s.tool)){ wrong = wrong || p; return; }
      hit = true; p.hp -= mv / (W * .42) * (s.tool === 'brossecrins' ? 2 : 1); if(Math.random() < .25) fx(p.kind === 'boue' || p.kind === 'pied' ? 'poussiere' : 'etoile', sx, sy, 1, 18);
      if(p.hp <= 0){ const next = p.kind === 'boue' ? 'poussiere' : p.kind === 'pied' ? 'corne' : null; fx('etoile', sx, sy, 6, 20);
        if(next){ p.kind = next; p.need = NEED[next]; p.hp = 1; }
        api.spot({ done:p, left:s.spots.filter(q => q.hp > 0).length, horse:it }); } });
    if(hit) api.sfx('brosse');
    else if(wrong && performance.now() - PT.hint > 2200){ PT.hint = performance.now(); api.spot({ wrong:wrong.kind, need:wrong.need, tool:s.tool }); }
    else if(!wrong && !s.spots.some(q => q.hp > 0)){ const a = ancre(it.def.id, 'flanc'), [fx0, fy0] = pt(P, a);
      if(Math.hypot(fx0 - px, (fy0 - py) * 1.4) < P.w * .3){
        if(s.tool === 'lustrant'){ PT.lus += mv; if(Math.random() < .3) fx('etoile', px, py, 1, 24); if(PT.lus > W * 1.2 && !s.lustre){ s.lustre = true; PT.lus = 0; fx('etoile', fx0, fy0, 16, 30); api.spot({ lustre:true, horse:it }); } api.sfx('brosse'); return; }
        PT.pet += mv * (s.tool === 'gant' ? 2 : 1); if(PT.pet > W * .9){ PT.pet = 0; const d = ancre(it.def.id, 'dos'), [hx, hy] = pt(P, d); fx('coeur', hx, hy, 1, 34); api.spot({ pet:true, gant:s.tool === 'gant', horse:it }); } if(Math.random() < .12) fx('etoile', px, py, 1, 18); api.sfx('brosse'); } }
  });
  const up = e => { if(!on || !PT.down) return; PT.down = false; const s = ST; s.ptr = null; if(s.sel >= 0 || PT.moved > 14) return;
    const r = canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; let best = -1, bd = 1e9;
    s.list.forEach((it, i) => { const P = placeEnsemble(i); if(px < P.x - 20 || px > P.x + P.w + 20 || py < P.y - 50 || py > P.y + P.h + 20) return; const d = Math.abs(P.x + P.w / 2 - px); if(d < bd){ bd = d; best = i; } });
    if(best >= 0) api.pick(best); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', () => { PT.down = false; if(ST) ST.ptr = null; });
  function feed(){ if(ST && ST.sel >= 0) ST.eat = 2.2; }
  const spotsLeft = () => { const s = ST; if(!s || s.sel < 0) return {}; const c = {}; s.spots.forEach(p => { if(p.hp > 0) c[p.need] = (c[p.need] || 0) + 1; }); return c; };
  return { openStable, select, feed, spotsLeft, setTool:t => { if(ST) ST.tool = t; }, stop, resize, stable:() => ST, harness(){}, refreshEquip(){} };
}
