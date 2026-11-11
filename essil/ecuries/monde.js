/* Les Écuries d'Essil — le monde en 3D : l'écurie (voir ses chevaux, les panser, les nourrir) et les concours (CSO, cross, dressage).
   createWorld(THREE, canvas, api) ; api = { sfx(nom), toast(msg), hud(obj), finish(resultat), pick(i), spot(evt), sparkle() } */
import { makeHorse } from './cheval.js';
import { COAT } from './data.js';

export function createWorld(THREE, canvas, api){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(42, 1, .1, 600);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8f8266, 1.5)); const sun = new THREE.DirectionalLight(0xfff2d8, 1.7); sun.position.set(30, 60, 20); scene.add(sun);
  let mode = 'off', group = null, raf = 0, last = 0, W = 1, H = 1;
  const L = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color:c }, o || {}));
  const box = (p, w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); p.add(m); return m; };
  const cyl = (p, r1, r2, h, mat, x, y, z, seg = 10) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat); m.position.set(x, y, z); p.add(m); return m; };
  function label(txt, o = {}){ const c = document.createElement('canvas'); c.width = o.w || 256; c.height = o.h || 96; const g = c.getContext('2d');
    if(o.bg){ g.fillStyle = o.bg; g.beginPath(); g.roundRect(4, 4, c.width - 8, c.height - 8, 18); g.fill(); }
    g.font = `800 ${o.fs || 54}px "Baloo 2", Nunito, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = o.fg || '#fff'; if(o.stroke){ g.lineWidth = 8; g.strokeStyle = o.stroke; g.strokeText(txt, c.width / 2, c.height / 2 + 3); } g.fillText(txt, c.width / 2, c.height / 2 + 3, c.width - 20);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  function sprite(tex, w, h, x, y, z, parent, depth = true){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthTest:depth })); s.scale.set(w, h, 1); s.position.set(x, y, z); (parent || group).add(s); return s; }
  function resize(){ const r = canvas.getBoundingClientRect(); W = Math.max(2, r.width); H = Math.max(2, r.height); renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); }
  addEventListener('resize', () => { if(mode !== 'off') resize(); });
  function clear(){ if(group){ scene.remove(group); group.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); } group = new THREE.Group(); scene.add(group); }
  function stop(){ mode = 'off'; cancelAnimationFrame(raf); clear(); }
  function loop(t){ raf = requestAnimationFrame(loop); const dt = Math.min(.05, (t - last) / 1000 || .016); last = t; if(mode === 'stable') stableTick(dt); else if(mode === 'ride') rideTick(dt); renderer.render(scene, cam); }
  function start(m){ mode = m; resize(); cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop); }
  const v = new THREE.Vector3();
  const toScreen = o => { o.getWorldPosition(v).project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z]; };

  /* =====================================================================
     L'ÉCURIE
     ===================================================================== */
  const SW = 3.5; let ST = null;
  const blob = (draw) => { const c = document.createElement('canvas'); c.width = c.height = 64; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const TEX = {};
  function spotTex(kind){
    if(TEX[kind]) return TEX[kind];
    const R = (a, b) => a + Math.random() * (b - a);
    return TEX[kind] = blob(g => {
      const blobs = (col, n, r) => { g.fillStyle = col; for(let i = 0; i < n; i++){ g.beginPath(); g.ellipse(32 + R(-14, 14), 32 + R(-12, 12), R(r * .6, r), R(r * .5, r), R(0, 3), 0, 7); g.fill(); } };
      if(kind === 'boue'){ blobs('#4a3120', 7, 13); blobs('#6b4a30', 4, 7); }
      else if(kind === 'poussiere'){ blobs('rgba(214,196,160,.75)', 8, 12); blobs('rgba(240,230,205,.8)', 6, 5); }
      else if(kind === 'terne'){ g.strokeStyle = 'rgba(120,120,120,.85)'; g.lineWidth = 3; for(let i = 0; i < 9; i++){ g.beginPath(); g.moveTo(R(10, 54), R(10, 54)); g.lineTo(R(10, 54), R(10, 54)); g.stroke(); } blobs('rgba(150,150,150,.35)', 4, 14); }
      else if(kind === 'yeux'){ blobs('#d8c76a', 3, 8); blobs('#f1e7a8', 2, 4); }
      else if(kind === 'noeud'){ g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); for(let a = 0; a < 16; a += .4) g.lineTo(32 + Math.cos(a) * (4 + a), 32 + Math.sin(a * 1.3) * (3 + a)); g.stroke(); g.strokeStyle = '#7a5a3a'; g.lineWidth = 2.5; g.stroke(); }
      else if(kind === 'pied'){ blobs('#3a2a1e', 6, 11); g.fillStyle = '#8a8a8a'; g.beginPath(); g.arc(26, 30, 4, 0, 7); g.fill(); g.beginPath(); g.arc(40, 38, 3, 0, 7); g.fill(); }
      else if(kind === 'corne'){ g.fillStyle = 'rgba(190,180,165,.9)'; g.beginPath(); g.ellipse(32, 34, 18, 12, 0, 0, 7); g.fill(); g.strokeStyle = '#7d7468'; g.lineWidth = 2; for(let i = 0; i < 4; i++){ g.beginPath(); g.moveTo(20 + i * 8, 26); g.lineTo(18 + i * 8, 42); g.stroke(); } }
      else if(kind === 'etoile'){ g.fillStyle = '#fff6b0'; g.beginPath(); for(let i = 0; i < 8; i++){ const a = i * Math.PI / 4, r = i % 2 ? 7 : 28; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.fill(); }
      else if(kind === 'coeur'){ g.font = '48px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('💛', 32, 36); }
    });
  }
  const NEED = { pied:'curepied', corne:'graisse', boue:'etrille', poussiere:'bouchon', terne:'brossedouce', yeux:'eponge', noeud:'peigne' };
  function spawnSpots(h, level){
    const S = [], add = (kind, a, size = .34) => { const o = h.anchors[a]; if(!o) return; const sp = sprite(spotTex(kind), size, size, 0, 0, 0, o, false); sp.renderOrder = 5; S.push({ kind, need:NEED[kind], a, o, sp, hp:1, size }); };
    if(level <= 0) return S;
    [0, 1, 2, 3].forEach(i => add('pied', 'sabot' + i, .26));
    ['epaule', 'croupe', 'flanc', 'cuisse', 'dos'].slice(0, Math.max(2, Math.ceil(level * 5))).forEach(a => add('boue', a, .42));
    if(level > .35){ add('poussiere', 'canon', .26); add('poussiere', 'jarret', .26); }
    add('terne', 'encolure', .4); add('terne', 'chanfrein', .24); add('yeux', 'oeil', .16); add('yeux', 'naseau', .16);
    add('noeud', 'criniere1', .28); add('noeud', 'criniere2', .28); add('noeud', 'queue', .32);
    return S;
  }
  // list : [{ def, eq, dirt (0..1) }]
  function openStable(list, o = {}){
    clear(); scene.background = new THREE.Color('#e9d9b5'); scene.fog = null;
    const n = list.length, x0 = -SW / 2, x1 = (n - 1) * SW + SW / 2, wood = L('#9a6a3c'), dark = L('#6e4a28'), straw = L('#e2c56f');
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 30, 30), L('#cdb98e')); fl.rotation.x = -Math.PI / 2; fl.position.set((x0 + x1) / 2, 0, 4); group.add(fl);
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 3.6), straw); bed.rotation.x = -Math.PI / 2; bed.position.set((x0 + x1) / 2, .02, -.9); group.add(bed);
    box(group, x1 - x0 + 30, 5, .3, L('#b98a55'), (x0 + x1) / 2, 2.5, -2.9);
    for(let k = 0; k < (x1 - x0 + 30) / .9; k++) box(group, .04, 5, .05, dark, x0 - 15 + k * .9, 2.5, -2.73);
    box(group, x1 - x0 + 30, .35, 1.2, dark, (x0 + x1) / 2, 3.6, -2.3);
    const horses = [];
    for(let i = 0; i <= n; i++){ const x = x0 + i * SW; box(group, .14, 1.7, 3.4, wood, x, .85, -1.1); box(group, .2, 3.6, .2, dark, x, 1.8, .6); box(group, .1, .1, 3.4, dark, x, 1.72, -1.1); }
    list.forEach((it, i) => {
      const x = i * SW, h = makeHorse(THREE, it.def, COAT[it.def.robe]); h.root.position.set(x, 0, -.75); h.root.rotation.y = -Math.PI / 2; group.add(h.root);
      h.setEquip(it.eq, { tack:false }); h.item = it; h.spots = []; horses.push(h);
      sprite(label(it.def.n, { bg:'#5a3a1e', fg:'#ffe9a8', fs:50 }), 1.2, .45, x, 2.72, .72);
      box(group, .9, .7, .5, L('#7a5530'), x + 1.15, .35, -2.3); box(group, .8, .14, .4, straw, x + 1.15, .72, -2.3);                        // mangeoire
      cyl(group, .22, .18, .34, L('#3f6fb5'), x - 1.2, .17, -2.2);                                                                           // seau
      box(group, .9, .9, .06, L('#bfe4ff'), x, 2.6, -2.72); box(group, 1, .08, .1, dark, x, 2.6, -2.7); box(group, .08, 1, .1, dark, x, 2.6, -2.7);   // fenêtre
    });
    ST = { list, horses, sel:-1, camX:o.at != null ? o.at * SW : 0, tx:o.at != null ? o.at * SW : 0, zoom:0, tool:null, eat:0, harn:false, fx:[], x0:0, x1:(n - 1) * SW };
    start('stable'); stableCam(1);
    if(o.select != null) select(o.select);
  }
  function fitDist(width, height){ const vf = cam.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect); return Math.max(width / 2 / Math.tan(hf / 2), height / 2 / Math.tan(vf / 2)); }
  function stableCam(k){
    const s = ST; if(!s) return; const sel = s.sel >= 0 ? s.horses[s.sel] : null, t = sel ? sel.def.t : 1;
    const d = sel ? fitDist(3.5 * t, 3.5 * t) + 1.1 : fitDist(Math.min(cam.aspect < 1 ? 1.25 : 2.2, s.list.length) * SW + .4, 4.2) + 1, y = sel ? 1.2 * t : 1.7, ly = sel ? .72 * t : 1.15;
    s.camX += (s.tx - s.camX) * k; s.d = (s.d || d) + (d - (s.d || d)) * k; s.y = (s.y || y) + (y - (s.y || y)) * k; s.ly = (s.ly || ly) + (ly - (s.ly || ly)) * k;
    cam.position.set(s.camX, s.y, -.75 + s.d); cam.lookAt(s.camX, s.ly, -.75);
  }
  function select(i){ const s = ST; if(!s) return; s.sel = i; if(i >= 0){ s.tx = i * SW; const h = s.horses[i]; if(!h.spots.length && h.item.dirt > .02) h.spots = spawnSpots(h, h.item.dirt); } }
  function harness(on){ const s = ST; if(!s || s.sel < 0) return; s.harn = on; const h = s.horses[s.sel]; h.setEquip(h.item.eq, { tack:on }); h.spots.forEach(p => p.sp.visible = !on); }
  function refreshEquip(){ const s = ST; if(!s || s.sel < 0) return; const h = s.horses[s.sel]; h.setEquip(h.item.eq, { tack:s.harn }); }
  function fx(kind, o, n = 5){ const s = ST; for(let i = 0; i < n; i++){ o.getWorldPosition(v); const sp = sprite(spotTex(kind), .16, .16, v.x + (Math.random() - .5) * .3, v.y + (Math.random() - .5) * .3, v.z + .3, group, false); sp.renderOrder = 9; s.fx.push({ sp, t:0, vy:.5 + Math.random() * .6, vx:(Math.random() - .5) * .5 }); } }
  function stableTick(dt){
    const s = ST; stableCam(Math.min(1, dt * 6));
    s.horses.forEach((h, i) => h.update(dt, { gait:0, eat:i === s.sel && s.eat > 0 }));
    if(s.eat > 0) s.eat -= dt;
    for(let i = s.fx.length - 1; i >= 0; i--){ const f = s.fx[i]; f.t += dt; f.sp.position.y += f.vy * dt; f.sp.position.x += f.vx * dt; f.sp.material.opacity = Math.max(0, 1 - f.t / .9); f.sp.scale.setScalar(.16 + f.t * .12); if(f.t > .9){ group.remove(f.sp); f.sp.material.dispose(); s.fx.splice(i, 1); } }
  }
  // gestes : en vue d'ensemble on glisse pour se promener et on touche un cheval ; en soin, on frotte
  const PT = { down:false, x:0, y:0, moved:0, hint:0, pet:0 };
  canvas.addEventListener('pointerdown', e => { if(mode !== 'stable') return; e.preventDefault(); try{ canvas.setPointerCapture(e.pointerId); }catch(_){} PT.down = true; PT.x = e.clientX; PT.y = e.clientY; PT.moved = 0; });
  canvas.addEventListener('pointermove', e => {
    if(mode !== 'stable' || !PT.down) return; const s = ST, dx = e.clientX - PT.x, dy = e.clientY - PT.y, mv = Math.hypot(dx, dy); PT.x = e.clientX; PT.y = e.clientY; PT.moved += mv;
    if(s.sel < 0){ s.tx = Math.max(s.x0, Math.min(s.x1, s.tx - dx * (s.d || 10) / W * 1.1)); return; }
    if(!s.tool || s.harn) return; const h = s.horses[s.sel], r = canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, reach = Math.max(34, W * .05);
    let hit = false, wrong = null;
    h.spots.forEach(p => { if(p.hp <= 0) return; const [sx, sy] = toScreen(p.o); if(Math.hypot(sx - px, sy - py) > reach) return;
      if(p.need !== s.tool){ wrong = wrong || p; return; } hit = true; p.hp -= mv / (W * .42); p.sp.material.opacity = .25 + .75 * Math.max(0, p.hp); if(Math.random() < .25) fx(p.kind === 'boue' || p.kind === 'pied' ? 'poussiere' : 'etoile', p.o, 1);
      if(p.hp <= 0){ const next = p.kind === 'boue' ? 'poussiere' : p.kind === 'pied' ? 'corne' : null; fx('etoile', p.o, 6);
        if(next){ p.kind = next; p.need = NEED[next]; p.hp = 1; p.sp.material.map = spotTex(next); p.sp.material.opacity = 1; p.sp.material.needsUpdate = true; } else { p.o.remove(p.sp); p.sp.material.dispose(); }
        api.spot({ done:p, left:h.spots.filter(q => q.hp > 0).length, horse:h.item }); } });
    if(hit) api.sfx('brosse');
    else if(wrong && performance.now() - PT.hint > 2200){ PT.hint = performance.now(); api.spot({ wrong:wrong.kind, need:wrong.need, tool:s.tool }); }
    else if(!wrong && !h.spots.some(q => q.hp > 0)){ const [sx, sy] = toScreen(h.anchors.flanc); if(Math.hypot(sx - px, sy - py) < W * .22){ PT.pet += mv; if(PT.pet > W * .9){ PT.pet = 0; fx('coeur', h.anchors.dos, 1); api.spot({ pet:true, horse:h.item }); } if(Math.random() < .12) fx('etoile', h.anchors.flanc, 1); api.sfx('brosse'); } }
  });
  const up = e => { if(mode !== 'stable' || !PT.down) return; PT.down = false; const s = ST; if(s.sel >= 0 || PT.moved > 14) return;
    const r = canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; let best = -1, bd = 1e9; s.horses.forEach((h, i) => { const [sx, sy] = toScreen(h.anchors.flanc), d = Math.hypot(sx - px, (sy - py) * .7); if(d < bd){ bd = d; best = i; } });
    if(best >= 0 && bd < W * .2) api.pick(best); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', () => { PT.down = false; });
  function feed(){ const s = ST; if(!s || s.sel < 0) return; s.eat = 2.2; }
  const spotsLeft = () => { const s = ST; if(!s || s.sel < 0) return {}; const c = {}; s.horses[s.sel].spots.forEach(p => { if(p.hp > 0) c[p.need] = (c[p.need] || 0) + 1; }); return c; };

  /* =====================================================================
     LES CONCOURS
     ===================================================================== */
  let R = null;
  const fwd = a => [Math.sin(a), Math.cos(a)];
  function tree(x, z, s = 1){ cyl(group, .25 * s, .35 * s, 2.2 * s, L('#7a5a3a'), x, 1.1 * s, z, 6); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9 * s, 0), L(['#3f8f4a', '#4fa055', '#357f45'][Math.floor(Math.random() * 3)])); c.position.set(x, 3.4 * s, z); c.rotation.y = Math.random() * 3; group.add(c); }
  function fence(x0, z0, x1, z1, col = '#ffffff', h = 1.1){ const len = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0), m = L(col); [h, h * .55].forEach(y => { const r = box(group, .08, .1, len, m, (x0 + x1) / 2, y, (z0 + z1) / 2); r.rotation.y = a; }); const n = Math.ceil(len / 4); for(let i = 0; i <= n; i++) box(group, .12, h + .1, .12, m, x0 + (x1 - x0) * i / n, (h + .1) / 2, z0 + (z1 - z0) * i / n); }
  function stripeTex(c1, c2){ return blob(g => { for(let i = 0; i < 8; i++){ g.fillStyle = i % 2 ? c1 : c2; g.fillRect(0, i * 8, 64, 8); } }); }
  const POLE = [['#e8333a', '#ffffff'], ['#1f6fd8', '#ffffff'], ['#2f9e44', '#ffffff'], ['#ffc928', '#1f3c88'], ['#8a4fd8', '#ffffff'], ['#ff7a1a', '#ffffff']];
  // un obstacle : { x, z, a (sens du passage), w, h, type }
  function buildObstacle(o, i){
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); g.rotation.y = o.a; group.add(g); o.g = g; o.bars = [];
    const w = o.w, flag = (x, col) => { const f = new THREE.Mesh(new THREE.ConeGeometry(.16, .4, 4), L(col)); f.position.set(x, Math.max(1.9, o.h + .95), 0); g.add(f); };
    // vu par le cavalier qui arrive : le fanion rouge est à sa droite (côté -X local), le blanc à sa gauche
    if(o.type === 'vertical' || o.type === 'oxer'){
      const cols = POLE[i % POLE.length], tex = stripeTex(cols[0], cols[1]); tex.wrapT = THREE.RepeatWrapping;
      const planes = o.type === 'oxer' ? [-.45, .45] : [0];
      planes.forEach(dz => { [1, -1].forEach(s => { box(g, .16, o.h + .7, .16, L('#f4f4f4'), s * (w / 2 + .1), (o.h + .7) / 2, dz); box(g, .5, .08, .5, L(cols[0]), s * (w / 2 + .1), .04, dz); });
        const n = Math.max(1, Math.round(o.h / .32)); for(let k = 0; k < n; k++){ const y = o.h - k * (o.h / n); const b = cyl(g, .05, .05, w, new THREE.MeshLambertMaterial({ map:tex }), 0, y, dz, 8); b.rotation.z = Math.PI / 2; if(k === 0) o.bars.push(b); } });
    } else if(o.type === 'tronc'){ const b = cyl(g, o.h / 2, o.h / 2, w, L('#7a5230'), 0, o.h / 2, 0, 10); b.rotation.z = Math.PI / 2; [1, -1].forEach(s => cyl(g, o.h / 2 + .01, o.h / 2 + .01, .06, L('#d9b98a'), s * w / 2, o.h / 2, 0, 10).rotation.z = Math.PI / 2); }
    else if(o.type === 'haie'){ box(g, w, o.h * .5, .5, L('#7a5230'), 0, o.h * .25, 0); box(g, w, o.h * .55, .7, L('#3f8f4a'), 0, o.h * .75, 0); }
    else if(o.type === 'stere'){ for(let r = 0; r < 3; r++) for(let k = 0; k < Math.floor(w / .34) - r; k++) { const b = cyl(g, o.h / 6, o.h / 6, .9, L(k % 2 ? '#8a5f38' : '#a07040'), -w / 2 + .2 + r * .17 + k * .34, o.h / 6 + r * o.h / 3.4, 0, 7); b.rotation.x = Math.PI / 2; } }
    else if(o.type === 'gue'){ const p = new THREE.Mesh(new THREE.PlaneGeometry(w + 6, 12), new THREE.MeshLambertMaterial({ color:'#5fb6e8', transparent:true, opacity:.85 })); p.rotation.x = -Math.PI / 2; p.position.set(0, .03, 3); g.add(p); [1, -1].forEach(s => box(g, .12, 1.9, .12, L('#f4f4f4'), s * w / 2, .95, 0)); }
    else if(o.type === 'fin'){ [1, -1].forEach(s => box(g, .14, 3, .14, L('#f4f4f4'), s * w / 2, 1.5, 0)); const b = box(g, w, .5, .06, new THREE.MeshLambertMaterial({ map:label('ARRIVÉE', { bg:'#1f3c88', fs:60, w:512, h:96 }) }), 0, 2.9, 0); }
    if(o.type !== 'fin'){ flag(-(w / 2 + .1), '#e8333a'); flag(w / 2 + .1, '#ffffff'); o.num = sprite(label(String(i + 1), { bg:'#1c2340', fs:64, w:96, h:96 }), .9, .9, 0, Math.max(2.6, o.h + 1.7), 0, g); }
  }
  function grass(size, col = '#7fbf5f'){ const p = new THREE.Mesh(new THREE.PlaneGeometry(size, size), L(col)); p.rotation.x = -Math.PI / 2; group.add(p); }
  function rect(w, d, col, y = .02, x = 0, z = 0){ const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), L(col)); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); group.add(p); return p; }

  const CSO = [[-10, -14, 1.5708, 'vertical'], [12, -14, 1.5708, 'oxer'], [25, 0, 0, 'vertical'], [10, 14, -1.5708, 'vertical'], [-10, 8, -2.2, 'oxer'], [-22, -7, 3.1416, 'vertical'], [-9, -3, .35, 'vertical'], [0, 11, 1.0, 'oxer'], [15, 6, 2.4, 'vertical'], [25, -11, 3.1416, 'oxer']];
  function courseCSO(ep){
    scene.background = new THREE.Color('#aee0ff'); scene.fog = new THREE.Fog('#aee0ff', 90, 220); grass(500); rect(70, 50, '#e3cf9f');
    fence(-35, -25, 35, -25); fence(35, -25, 35, 25); fence(35, 25, -35, 25); fence(-35, 25, -35, -25);
    for(let i = 0; i < 40; i++){ const a = i / 40 * 6.283, r = 52 + Math.random() * 30; tree(Math.cos(a) * r * 1.2, Math.sin(a) * r, .9 + Math.random() * .8); }
    for(let i = 0; i < 3; i++) for(let k = 0; k < 12; k++) box(group, 1.6, .5, 1, L(['#d7263d', '#1f3c88', '#ffc928'][(i + k) % 3]), -18 + k * 3.2, .5 + i * .7, 28 + i * 1.2);   // la tribune
    const obs = CSO.slice(0, ep.nb).map(([x, z, a, type], i) => ({ x, z, a, type, w:3.6, h:ep.h * (type === 'oxer' ? .95 : 1) }));
    return { obs, start:[-29, -19, 1.5708], bounds:[-34, 34, -24, 24], opt:ep.nb * 6.2 + 12, kind:'cso' };
  }
  function courseCross(ep){
    scene.background = new THREE.Color('#b9e3ff'); scene.fog = new THREE.Fog('#b9e3ff', 110, 300); grass(900, '#86c463');
    const P = t => [Math.cos(t) * (82 + 16 * Math.sin(3 * t)), Math.sin(t) * (60 + 12 * Math.cos(2 * t))], types = ['tronc', 'haie', 'stere'];
    const obs = []; const n = ep.nb, gue = Math.floor(n / 2);
    for(let i = 0; i < n; i++){ const t = -1.9 + (i + 1) / (n + 1.2) * 6.0, [x, z] = P(t), [x2, z2] = P(t + .02), a = Math.atan2(x2 - x, z2 - z), type = i === gue ? 'gue' : types[i % 3]; obs.push({ x, z, a, type, w:type === 'gue' ? 7 : 4.6, h:type === 'gue' ? 0 : ep.h * (type === 'tronc' ? .9 : 1) }); }
    for(let k = 0; k < 220; k++){ const t = -1.9 + k / 220 * 6.1, [x, z] = P(t); if(k % 2 === 0){ const d = new THREE.Mesh(new THREE.CircleGeometry(1.5, 8), L('#9fd07a')); d.rotation.x = -Math.PI / 2; d.position.set(x, .015, z); group.add(d); } }
    for(let i = 0; i < 150; i++){ const x = (Math.random() - .5) * 320, z = (Math.random() - .5) * 260; let ok = true; for(let k = 0; k < 60; k++){ const [px, pz] = P(-1.9 + k / 60 * 6.1); if(Math.hypot(px - x, pz - z) < 11){ ok = false; break; } } if(ok) tree(x, z, .9 + Math.random() * 1.2); }
    const [sx, sz] = P(-1.9), [sx2, sz2] = P(-1.88);
    return { obs, start:[sx, sz, Math.atan2(sx2 - sx, sz2 - sz)], bounds:[-170, 170, -140, 140], opt:(ep.id === 'cross3' ? 78 : ep.id === 'cross2' ? 88 : 100), kind:'cross' };
  }
  // dressage : carrière de 20 × 40. Quand on entre en A et qu'on regarde C, K-E-H sont à gauche (+X), F-B-M à droite.
  const LET = { A:[0, -20], K:[10, -14], E:[10, 0], H:[10, 14], C:[0, 20], M:[-10, 14], B:[-10, 0], F:[-10, -14], X:[0, 0] };
  function courseDressage(ep){
    scene.background = new THREE.Color('#aee0ff'); scene.fog = new THREE.Fog('#aee0ff', 80, 200); grass(400); rect(20, 40, '#e3cf9f');
    fence(-10, -20, -10, 20, '#ffffff', .4); fence(10, -20, 10, 20, '#ffffff', .4); fence(-10, 20, 10, 20, '#ffffff', .4); fence(-10, -20, -1.5, -20, '#ffffff', .4); fence(1.5, -20, 10, -20, '#ffffff', .4);
    Object.entries(LET).forEach(([k, [x, z]]) => { if(k === 'X') return; const ox = x === 0 ? 0 : Math.sign(x) * 1.2, oz = x === 0 ? Math.sign(z) * 1.2 : 0; box(group, .7, .8, .7, L('#ffffff'), x + ox, .4, z + oz); sprite(label(k, { fg:'#1c2340', fs:80, w:96, h:96 }), .9, .9, x + ox, 1.3, z + oz); });
    box(group, 3, 2.4, 2.4, L('#b4235a'), 0, 1.2, 25); box(group, 3.4, .2, 2.8, L('#ffffff'), 0, 2.5, 25);                                   // la cabane du juge
    for(let i = 0; i < 30; i++){ const a = i / 30 * 6.283, r = 40 + Math.random() * 26; tree(Math.cos(a) * r, Math.sin(a) * r * 1.2, .9 + Math.random() * .7); }
    const T = 9, ZT = 19;   // la piste, à 1 m de la lice
    const line = (...pts) => pts, circ = (cx, cz, r, a0, turns, dir) => { const p = []; for(let i = 0; i <= 48 * turns; i++){ const a = a0 + dir * i / 48 * 6.2832; p.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return p; };
    const halt = (txt) => ({ txt, halt:[0, 0] });
    let M;
    if(ep.id === 'dres1') M = [
      { txt:'Entre en A au trot, tout droit sur la ligne du milieu', g:2, p:line([0, -23], [0, -1]) }, halt('Arrêt en X : immobile 3 secondes, c\'est le salut'),
      { txt:'Pars au pas jusqu\'à C, puis piste à main gauche', g:1, p:line([0, 0], [0, ZT], [T, ZT], [T, 14]) },
      { txt:'De H à E au trot', g:2, p:line([T, 14], [T, 0]) },
      { txt:'En E, un grand cercle de 20 m au trot', g:2, p:circ(0, 0, T, 0, 1, -1) },
      { txt:'Continue au trot : K, A, F', g:2, p:line([T, 0], [T, -ZT], [-T, -ZT], [-T, -14]) },
      { txt:'De F à M au pas', g:1, p:line([-T, -14], [-T, 14]) },
      { txt:'Au trot : C, H, puis doubler en E vers X', g:2, p:line([-T, 14], [-T, ZT], [T, ZT], [T, 0], [1, 0]) }, halt('Arrêt en X et salut : bravo !') ];
    else if(ep.id === 'dres2') M = [
      { txt:'Entre en A au trot, ligne du milieu', g:2, p:line([0, -23], [0, -1]) }, halt('Arrêt en X, salut'),
      { txt:'Au trot jusqu\'à C, piste à main gauche jusqu\'à E', g:2, p:line([0, 0], [0, ZT], [T, ZT], [T, 0]) },
      { txt:'En E, cercle de 20 m au trot', g:2, p:circ(0, 0, T, 0, 1, -1) },
      { txt:'Au trot : K, A, F', g:2, p:line([T, 0], [T, -ZT], [-T, -ZT], [-T, -14]) },
      { txt:'Diagonale F, X, H au trot (on change de main)', g:2, p:line([-T, -14], [T, 14]) },
      { txt:'De H à M par C, au pas', g:1, p:line([T, 14], [T, ZT], [-T, ZT], [-T, 14]) },
      { txt:'De M à F au galop !', g:3, p:line([-T, 14], [-T, -14]) },
      { txt:'Trot en F, puis A et ligne du milieu', g:2, p:line([-T, -14], [-T, -ZT], [0, -ZT], [0, -1]) }, halt('Arrêt en X et salut') ];
    else M = [
      { txt:'Entre en A au galop, ligne du milieu', g:3, p:line([0, -23], [0, -2]) }, halt('Arrêt en X, salut'),
      { txt:'Au trot vers C, piste à main gauche jusqu\'à H', g:2, p:line([0, 0], [0, ZT], [T, ZT], [T, 14]) },
      { txt:'Serpentine de 3 boucles, de H à F, au trot', g:2, p:serp() },
      { txt:'De F à A, puis K : au pas', g:1, p:line([-T, -14], [-T, -ZT], [T, -ZT], [T, -14]) },
      { txt:'De K à E au galop', g:3, p:line([T, -14], [T, 0]) },
      { txt:'En E, cercle de 15 m au galop', g:3, p:circ(1.5, 0, 7.5, 0, 1, -1) },
      { txt:'Transition : trot de E à H', g:2, p:line([T, 0], [T, 14]) },
      { txt:'Diagonale H, X, F au galop', g:3, p:line([T, 14], [-T, -14]) },
      { txt:'Trot : A et ligne du milieu', g:2, p:line([-T, -14], [-T, -ZT], [0, -ZT], [0, -1]) }, halt('Arrêt en X, salut final') ];
    function serp(){ const p = []; for(let i = 0; i <= 90; i++){ const k = i / 90; p.push([T * Math.cos(k * Math.PI * 3), 14 - k * 28]); } return p; }
    // on découpe chaque figure en petits points (tous les 0,5 m)
    M.forEach(m => { if(!m.p) return; const d = []; for(let i = 0; i < m.p.length - 1; i++){ const [x0, z0] = m.p[i], [x1, z1] = m.p[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / .5)); for(let k = 0; k < n; k++) d.push([x0 + (x1 - x0) * k / n, z0 + (z1 - z0) * k / n]); } d.push(m.p[m.p.length - 1]); m.d = d; });
    return { obs:[], moves:M, start:[0, -30, 0], bounds:[-30, 30, -36, 30], kind:'dressage' };
  }
  const DOT = { geo:null };
  function showPath(m){
    if(R.path){ group.remove(R.path); R.path.geometry.dispose(); R.path.material.dispose(); R.path = null; }
    if(!m || !m.d) { if(m && m.halt){ const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 2, 24), new THREE.MeshBasicMaterial({ color:'#ffc928' })); ring.rotation.x = -Math.PI / 2; ring.position.set(m.halt[0], .05, m.halt[1]); group.add(ring); R.path = ring; } return; }
    const pts = m.d.filter((_, i) => i % 2 === 0), im = new THREE.InstancedMesh(new THREE.CircleGeometry(.16, 8), new THREE.MeshBasicMaterial({ color:['', '#58b6e8', '#ffc928', '#ff6fa8'][m.g] }), pts.length), o = new THREE.Object3D();
    pts.forEach(([x, z], i) => { o.position.set(x, .05, z); o.rotation.x = -Math.PI / 2; o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); group.add(im); R.path = im;
  }

  // it : { def, eq } ; ep : l'épreuve
  function openRide(it, ep, o = {}){
    clear(); const c = ep.k === 'cso' ? courseCSO(ep) : ep.k === 'cross' ? courseCross(ep) : courseDressage(ep);
    c.obs.forEach(buildObstacle);
    const h = makeHorse(THREE, it.def, COAT[it.def.robe]); h.setEquip(it.eq, { rider:true, jacket:o.jacket }); group.add(h.root);
    const s = it.def.s, form = o.form == null ? 1 : o.form;   // forme : 0.8 à 1.05 selon les soins
    R = { c, ep, h, it, x:c.start[0], z:c.start[1], a:c.start[2], v:0, gait:0, y:0, vy:0, airT:0, airLen:1, steer:0, next:0, pen:0, refus:0, bars:0, t:0, go:false, count:3.4, done:false, stam:100, msgT:0,
      vmax:[0, 1.7, 3.7, (6.0 + .5 * s[0]) * form], jumpH:(.78 + .17 * s[1]) * (.9 + .1 * form), endu:s[3], tol:.35 + .09 * s[2], mi:0, idx:0, dev:0, devN:0, gOK:0, gN:0, notes:[], haltT:0, falls:[], path:null, camP:new THREE.Vector3(), camL:new THREE.Vector3(), first:true };
    if(c.kind === 'dressage') showPath(c.moves[0]);
    h.root.position.set(R.x, 0, R.z); h.root.rotation.y = R.a; start('ride'); rideCam(1); hud();
  }
  function rideCam(k){ const [fx, fz] = fwd(R.a), t = R.h.def.t, tall = cam.aspect < .8, back = (tall ? 9.5 : 7) * (.7 + .3 * t), hi = (tall ? 4.6 : 3.3) * (.7 + .3 * t);
    v.set(R.x - fx * back, hi + R.y * .5, R.z - fz * back); R.camP.lerp(v, R.first ? 1 : k); v.set(R.x + fx * 5, 1.2 + R.y * .6, R.z + fz * 5); R.camL.lerp(v, R.first ? 1 : k); R.first = false; cam.position.copy(R.camP); cam.lookAt(R.camL); }
  function msg(m, kind){ api.hud({ msg:m, kind }); }
  function hud(){ const c = R.c, o = { time:R.t, pen:R.pen, gait:R.gait, stam:R.stam, kind:c.kind, count:R.go ? 0 : Math.ceil(R.count - .4) };
    if(c.kind === 'dressage'){ const m = c.moves[R.mi]; o.move = m ? m.txt : ''; o.want = m && m.g; o.mi = R.mi; o.mn = c.moves.length; o.notes = R.notes; }
    else { o.next = R.next; o.nb = c.obs.length; o.opt = c.opt; const t = c.obs[R.next]; if(t){ const dx = t.x - R.x, dz = t.z - R.z; o.dist = Math.hypot(dx, dz); let d = Math.atan2(dx, dz) - R.a; while(d > Math.PI) d -= 6.2832; while(d < -Math.PI) d += 6.2832; o.dir = d; } }
    o.map = { x:R.x, z:R.z, a:R.a, obs:c.obs.map((b, i) => [b.x, b.z, b.a, i < R.next ? 1 : i === R.next ? 2 : 0, b.w]), b:c.bounds, letters:c.kind === 'dressage' ? LET : null, path:c.kind === 'dressage' && c.moves[R.mi] ? c.moves[R.mi].d : null, halt:c.kind === 'dressage' && c.moves[R.mi] ? c.moves[R.mi].halt : null };
    api.hud(o); }
  function setGait(g){ if(!R || R.done) return; g = Math.max(0, Math.min(3, g)); if(g === 3 && R.stam < 8){ msg('Ton cheval est fatigué : laisse-le souffler au trot', 'warn'); g = 2; } if(g !== R.gait){ R.gait = g; api.sfx('tap'); } }
  function jump(){ if(!R || R.done || !R.go || R.y > 0) return; if(R.c.kind === 'dressage'){ msg('Pas de saut en dressage 🙂', 'warn'); return; } if(R.v < 2.2){ msg('Il faut de l\'élan : au trot ou au galop !', 'warn'); return; }
    R.vy = Math.sqrt(2 * 9.8 * R.jumpH); R.y = .001; R.airT = 0; R.airLen = 2 * R.vy / 9.8; api.sfx('saut'); }
  function refuse(o, why){ const [fx, fz] = fwd(o.a), side = ((R.x - o.x) * fx + (R.z - o.z) * fz) < 0 ? -1 : 1; R.x = o.x + fx * 3.6 * side; R.z = o.z + fz * 3.6 * side; R.v = 0; R.gait = 1; R.y = 0; R.vy = 0; api.sfx('refus');
    if(why === 'ordre'){ msg('Ce n\'est pas le bon obstacle : cherche le n° ' + (R.next + 1), 'warn'); return; }
    if(why === 'envers'){ msg('À l\'envers ! Le fanion rouge doit être à ta droite', 'warn'); return; }
    R.refus++; R.pen += R.c.kind === 'cso' ? 4 : 20; msg(R.c.kind === 'cso' ? 'Refus : 4 points' : 'Refus : 20 points', 'bad');
    if(R.refus >= 3) end(true); }
  function end(elim){ if(R.done) return; R.done = true; R.gait = Math.min(R.gait, 1); const c = R.c; let res = { kind:c.kind, time:R.t, elim:!!elim };
    if(c.kind === 'dressage'){ const tot = R.notes.reduce((a, b) => a + b, 0), pct = R.notes.length ? tot / (R.notes.length * 10) * 100 : 0; res.notes = R.notes; res.pct = pct; res.rank = elim ? 3 : pct >= 70 ? 0 : pct >= 60 ? 1 : pct >= 50 ? 2 : 3; }
    else { const over = Math.max(0, R.t - c.opt), tp = c.kind === 'cso' ? Math.ceil(over / 4) : Math.round(over * .4 * 10) / 10; res.timePen = tp; res.jumpPen = R.pen; res.pen = R.pen + tp; res.bars = R.bars; res.refus = R.refus; res.opt = c.opt;
      res.rank = elim ? 3 : res.pen === 0 ? 0 : res.pen <= 4 ? 1 : res.pen <= (c.kind === 'cso' ? 8 : 20) ? 2 : 3; }
    api.sfx(res.rank < 3 ? 'bravo' : 'fin'); setTimeout(() => api.finish(res), 1400); }
  function rideTick(dt){
    const c = R.c, h = R.h;
    if(!R.go){ R.count -= dt; if(R.count <= .4){ R.go = true; api.sfx('cloche'); if(c.kind !== 'dressage') R.gait = 2; } h.update(dt, { gait:0 }); rideCam(1); hud(); return; }
    if(!R.done) R.t += dt;
    // l'allure et la vitesse
    const target = R.vmax[R.gait], acc = R.v < target ? 3.6 : 6; R.v += Math.max(-acc * dt, Math.min(acc * dt, target - R.v));
    if(R.gait === 3 && !R.done){ R.stam -= dt * (7.5 - R.endu) * (c.kind === 'cross' ? 1 : .55); if(R.stam <= 0){ R.stam = 0; R.gait = 2; msg('Ton cheval est fatigué : il repasse au trot', 'warn'); } } else R.stam = Math.min(100, R.stam + dt * (R.gait === 2 ? 5 : 11));
    const turn = (R.v < .3 ? 1.3 : 1.9 - R.v * .07) * (R.y > 0 ? .25 : 1); R.a += R.steer * turn * dt;
    const [fx, fz] = fwd(R.a), px = R.x, pz = R.z; R.x += fx * R.v * dt; R.z += fz * R.v * dt;
    const b = c.bounds; if(R.x < b[0] || R.x > b[1] || R.z < b[2] || R.z > b[3]){ R.x = Math.max(b[0], Math.min(b[1], R.x)); R.z = Math.max(b[2], Math.min(b[3], R.z)); if(c.kind === 'cso') R.v = Math.min(R.v, 2); }
    // le saut
    let air = null; if(R.y > 0){ R.airT += dt; R.vy -= 9.8 * dt; R.y += R.vy * dt; air = R.airT / R.airLen; if(R.y <= 0){ R.y = 0; R.vy = 0; api.sfx('pose'); } }
    // les obstacles
    for(let i = 0; i < c.obs.length && !R.done; i++){ const o = c.obs[i], [nx, nz] = fwd(o.a), d0 = (px - o.x) * nx + (pz - o.z) * nz, d1 = (R.x - o.x) * nx + (R.z - o.z) * nz; if((d0 < 0) === (d1 < 0)) continue;
      const lat = (R.x - o.x) * nz - (R.z - o.z) * nx; if(Math.abs(lat) > o.w / 2 + .55) continue; const forward = d0 < 0, isNext = i === R.next;
      if(o.type === 'gue'){ if(isNext && forward && Math.abs(lat) < o.w / 2){ R.next++; api.sfx('plouf'); msg('Splash ! Le gué est passé', 'good'); } continue; }
      if(Math.abs(lat) > o.w / 2){ refuse(o, isNext ? 'chandelier' : 'ordre'); break; }
      const need = o.h * (o.type === 'oxer' ? 1.08 : 1);
      if(R.y < need * .5){ refuse(o, isNext ? (forward ? 'refus' : 'envers') : 'ordre'); break; }
      if(!isNext){ continue; } if(!forward){ refuse(o, 'envers'); break; }
      if(R.y < need - .04){ if(o.bars.length){ R.bars++; R.pen += 4; msg('Une barre tombe : 4 points', 'bad'); api.sfx('barre'); o.bars.forEach(bm => R.falls.push({ m:bm, vy:0 })); } else msg('Ouf, ça touche !', 'warn'); }
      else { msg(['Sans faute !', 'Joli saut !', 'Bravo !'][Math.floor(Math.random() * 3)], 'good'); api.sfx('ok'); }
      if(o.num) o.num.material.opacity = .35; R.next++; if(R.next >= c.obs.length) end(false);
    }
    R.falls.forEach(f => { if(f.m.position.y > .06){ f.vy -= 9.8 * dt; f.m.position.y = Math.max(.06, f.m.position.y + f.vy * dt); f.m.position.z += dt * 1.2; } });
    // le dressage : on suit la figure dessinée au sol, à la bonne allure
    if(c.kind === 'dressage' && !R.done){ const m = c.moves[R.mi];
      if(m && m.halt){ const dist = Math.hypot(R.x - m.halt[0], R.z - m.halt[1]); R.haltD = Math.min(R.haltD == null ? 99 : R.haltD, dist);
        if(R.v < .15 && dist < 3){ R.haltT += dt; if(R.haltT >= 3) note(Math.max(4, 10 - Math.max(0, dist - .5) * 2.4)); } else { R.haltT = 0; if(R.haltD < 3 && dist > 7) note(3); }
        api.hud({ halt:R.haltT / 3 }); }
      else if(m){ let best = 1e9, bi = R.idx; for(let k = R.idx; k < Math.min(m.d.length, R.idx + 14); k++){ const dd = Math.hypot(R.x - m.d[k][0], R.z - m.d[k][1]); if(dd < best){ best = dd; bi = k; } } R.idx = bi;
        if(R.v > .3){ R.dev += Math.min(best, 4) * dt; R.devN += dt; R.gN += dt; if(R.gait === m.g) R.gOK += dt; }
        if(R.idx >= m.d.length - 3 || (best > 13 && R.devN > 4)){ const avg = R.devN ? R.dev / R.devN : 4, gf = R.gN ? R.gOK / R.gN : 0; note(best > 13 ? 3 : 10 - Math.max(0, avg - R.tol) * 3.4 - (1 - gf) * 5); } }
    }
    h.root.position.set(R.x, R.y, R.z); h.root.rotation.y = R.a; h.update(dt, { gait:R.v < .2 ? 0 : R.v < 2.6 ? 1 : R.v < 5 ? 2 : 3, air, speedK:R.v < 2.6 ? R.v / 1.7 : R.v < 5 ? R.v / 3.7 : R.v / 7 });
    const st = R.v < .2 ? 0 : R.v < 2.6 ? 1 : R.v < 5 ? 2 : 3; R.beat = (R.beat || 0) + dt * [0, 3, 5.2, 6.8][st]; if(st && R.y <= 0 && R.beat >= 1){ R.beat = 0; api.sfx('sabot' + st); }
    rideCam(Math.min(1, dt * 4.5)); hud();
  }
  function note(n){ n = Math.round(Math.max(0, Math.min(10, n)) * 2) / 2; R.notes.push(n); msg('Note : ' + String(n).replace('.', ',') + ' / 10', n >= 7 ? 'good' : n >= 5 ? 'warn' : 'bad'); api.sfx(n >= 7 ? 'ok' : 'tap');
    R.mi++; R.idx = 0; R.dev = R.devN = R.gOK = R.gN = 0; R.haltT = 0; R.haltD = null; const m = R.c.moves[R.mi]; showPath(m); if(!m) end(false); }

  return { __cam:cam, openStable, select, harness, refreshEquip, feed, spotsLeft, setTool:t => { if(ST) ST.tool = t; }, stable:() => ST, openRide, setGait, gaitBy:d => R && setGait(R.gait + d), jump, steer:s => { if(R) R.steer = s; }, ride:() => R, stop, resize, mode:() => mode };
}
