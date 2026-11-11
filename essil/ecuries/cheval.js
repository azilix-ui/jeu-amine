/* Les Écuries d'Essil — le cheval en 3D, fabriqué par le code (aucun modèle à télécharger).
   Le cheval regarde vers +Z ; son côté gauche (celui où on se place pour seller) est vers +X.
   makeHorse(THREE, def, coat) -> { root, anchors, setEquip(eq, opts), update(dt, state) } */
import { HEX } from './data.js';

function rnd(seed){ let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const hash = str => { let h = 7; for(const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

// la robe : une petite image peinte (taches de la pie, pommelures du gris, points du tacheté)
function coatTexture(THREE, coat, seed){
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), R = rnd(seed);
  g.fillStyle = coat.b; g.fillRect(0, 0, 128, 128);
  if(coat.p === 'pie'){ g.fillStyle = coat.c2; for(let i = 0; i < 7; i++){ const x = R() * 128, y = R() * 128; for(let k = 0; k < 5; k++){ g.beginPath(); g.ellipse(x + (R() - .5) * 34, y + (R() - .5) * 30, 10 + R() * 16, 8 + R() * 14, R() * 3, 0, 7); g.fill(); } } }
  if(coat.p === 'taches'){ g.fillStyle = coat.c2; for(let i = 0; i < 90; i++){ g.beginPath(); g.arc(R() * 128, R() * 128, 1.5 + R() * 3.2, 0, 7); g.fill(); } }
  if(coat.p === 'pomme'){ for(let i = 0; i < 70; i++){ g.fillStyle = `rgba(235,236,238,${.25 + R() * .3})`; g.beginPath(); g.arc(R() * 128, R() * 128, 3 + R() * 4, 0, 7); g.fill(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

export function makeHorse(THREE, def, coat){
  const L = (color, map) => new THREE.MeshLambertMaterial({ color, map: map || null });
  const tex = coat.p ? coatTexture(THREE, coat, hash(def.id)) : null;
  const mBody = tex ? L('#ffffff', tex) : L(coat.b), mMane = L(coat.m), mLeg = L(coat.l), mHoof = L('#2a2522'), mWhite = L('#f3efe6'), mDark = L('#151214');
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const A = {};   // repères pour le pansage
  const mark = (parent, name, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); A[name] = o; return o; };

  // le tronc
  const trunk = add(body, new THREE.CapsuleGeometry(.33, .86, 6, 14), mBody, 0, 1.27, 0); trunk.rotation.x = Math.PI / 2; trunk.scale.set(1, 1, 1.08);
  add(body, new THREE.SphereGeometry(.345, 14, 10), mBody, 0, 1.3, -.5).scale.set(1, 1.02, 1.05);     // la croupe
  add(body, new THREE.SphereGeometry(.33, 14, 10), mBody, 0, 1.26, .5).scale.set(.98, 1.05, 1);        // le poitrail
  mark(body, 'epaule', .31, 1.3, .45); mark(body, 'flanc', .34, 1.22, .05); mark(body, 'dos', .2, 1.56, -.05); mark(body, 'croupe', .3, 1.42, -.5); mark(body, 'ventre', .3, 1.02, -.15); mark(body, 'cuisse', .3, 1.15, -.62);

  // l'encolure et la tête
  const neck = new THREE.Group(); neck.position.set(0, 1.42, .62); neck.rotation.x = .62; body.add(neck);
  const neckM = add(neck, new THREE.CylinderGeometry(.15, .25, .82, 10), mBody, 0, .38, 0); neckM.scale.set(.85, 1, 1.25);
  const mane = add(neck, new THREE.BoxGeometry(.07, .78, .16), mMane, 0, .42, -.2);
  if(def.race === 'Frison' || def.race === 'Pure race espagnole' || def.race === 'Shetland'){ const fl = add(neck, new THREE.BoxGeometry(.05, .7, .34), mMane, .12, .34, -.08); fl.rotation.z = -.12; }
  if(def.race === 'Fjord'){ mane.scale.set(1.5, 1, .8); add(neck, new THREE.BoxGeometry(.035, .8, .15), mDark, 0, .42, -.2); mane.material = mWhite; }
  mark(neck, 'criniere1', .12, .62, -.14); mark(neck, 'criniere2', .12, .28, -.18); mark(neck, 'encolure', .18, .4, .05);
  const head = new THREE.Group(); head.position.set(0, .8, .0); head.rotation.x = .3; head.scale.setScalar(1.22); neck.add(head);
  const skull = add(head, new THREE.CylinderGeometry(.095, .165, .6, 10), mBody, 0, -.03, .27); skull.rotation.x = Math.PI / 2; skull.scale.set(.9, 1, 1.12);
  add(head, new THREE.SphereGeometry(.1, 10, 8), coat.p === 'pie' || coat.b === coat.l ? mBody : L(shade(THREE, coat.b, -.28)), 0, -.03, .57).scale.set(.95, 1.05, .8);   // le bout du nez
  const earG = new THREE.ConeGeometry(.045, .15, 6); const ears = [add(head, earG, mBody, .075, .15, -.02), add(head, earG, mBody, -.075, .15, -.02)];
  add(head, new THREE.BoxGeometry(.09, .1, .2), mMane, 0, .12, .1);                                    // le toupet
  [1, -1].forEach(s => { add(head, new THREE.SphereGeometry(.026, 8, 6), mDark, s * .135, .03, .16); add(head, new THREE.SphereGeometry(.014, 6, 4), mDark, s * .05, -.02, .65); });
  if(def.liste) add(head, new THREE.BoxGeometry(.06, .02, .46), mWhite, 0, .125, .3).rotation.x = .1;
  mark(head, 'oeil', .16, .03, .16); mark(head, 'naseau', .1, -.03, .62); mark(head, 'chanfrein', .14, .04, .38); mark(head, 'bouche', 0, -.12, .6);

  // la queue
  const tail = new THREE.Group(); tail.position.set(0, 1.48, -.84); body.add(tail);
  const tailM = add(tail, new THREE.CylinderGeometry(.05, .07, .8, 8), mMane, 0, -.4, .02); tailM.rotation.x = -.1;
  if(def.race === 'Frison' || def.race === 'Shetland' || def.race === 'Pure race espagnole') tailM.scale.set(1.35, 1.15, 1.35);
  mark(tail, 'queue', .1, -.5, -.05);

  // les quatre jambes : épaule ou hanche -> genou ou jarret -> sabot
  const legs = [];
  [[.19, .5, 1], [-.19, .5, 1], [.2, -.55, 0], [-.2, -.55, 0]].forEach(([x, z, front], i) => {
    const hip = new THREE.Group(); hip.position.set(x, 1.06, z); body.add(hip);
    add(hip, new THREE.CylinderGeometry(front ? .11 : .14, .068, .52, 8), tex && coat.p !== 'pomme' ? mBody : (coat.p === 'pomme' ? L(shade(THREE, coat.b, -.12)) : mBody), 0, -.25, 0);
    const knee = new THREE.Group(); knee.position.y = -.5; hip.add(knee);
    const white = (def.bal || 0) >= 4 || ((def.bal || 0) >= 2 && !front);
    add(knee, new THREE.CylinderGeometry(.058, .05, .44, 8), white ? mWhite : mLeg, 0, -.21, 0);
    add(knee, new THREE.CylinderGeometry(.06, .078, .11, 8), mHoof, 0, -.475, .01);
    if(def.race === 'Frison' || def.race === 'Percheron' || def.race === 'Shetland') add(knee, new THREE.CylinderGeometry(.06, .1, .14, 8), def.race === 'Shetland' ? mWhite : mLeg, 0, -.37, -.01);   // les fanons
    const g = add(knee, new THREE.CylinderGeometry(.075, .07, .27, 10), L('#888'), 0, -.2, 0); g.visible = false;
    let c = null; if(front){ c = add(knee, new THREE.CylinderGeometry(.065, .105, .12, 10), L('#888'), 0, -.455, .01); c.visible = false; }
    mark(knee, 'sabot' + i, .04, -.47, .02); if(i === 0) mark(knee, 'canon', .06, -.2, 0); if(i === 2) mark(knee, 'jarret', .06, -.12, 0);
    legs.push({ hip, knee, front, guetre:g, cloche:c });
  });

  // l'ombre au sol
  const sh = add(root, new THREE.CircleGeometry(.75, 20), new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:.22, depthWrite:false }), 0, .012, -.05); sh.rotation.x = -Math.PI / 2; sh.scale.set(.75, 1.5, 1);

  // ---------- le matériel (sellerie) ----------
  const tack = new THREE.Group(); body.add(tack);          // sur le dos
  const headTack = new THREE.Group(); head.add(headTack);   // sur la tête
  const rider = new THREE.Group(); body.add(rider); rider.visible = false;
  let reins = null, hands = null, bitL = null, bitR = null;
  const strap = (parent, mat, a, b, w = .028) => { const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), len = va.distanceTo(vb), m = new THREE.Mesh(new THREE.BoxGeometry(w, w * .5, len), mat); m.position.copy(va).add(vb).multiplyScalar(.5); m.lookAt(vb); parent.add(m); return m; };
  const ring = (parent, mat, r, tube, x, y, z, rx = 0, ry = 0) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, 18), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); parent.add(m); return m; };
  function clear(g){ while(g.children.length){ const o = g.children.pop(); o.traverse(n => { if(n.geometry) n.geometry.dispose(); }); } }

  function setEquip(eq = {}, o = {}){
    clear(tack); clear(headTack); clear(rider); rider.visible = !!o.rider; reins = null;
    const col = k => eq[k] ? HEX[eq[k]] || '#555' : null, harn = o.tack !== false;
    // tapis, amortisseur, selle
    const arc = (r, len, half, mat, z, y = 1.27) => { const m = add(tack, new THREE.CylinderGeometry(r, r, len, 18, 1, true, Math.PI - half, half * 2), mat, 0, y, z); m.rotation.x = Math.PI / 2; mat.side = THREE.DoubleSide; return m; };
    if(harn && col('tapis')){ arc(.36, .66, 1.32, L('#f4f1ea'), .08); arc(.364, .62, 1.28, L(col('tapis')), .08); }
    if(harn && col('amortisseur')){ arc(.38, .5, .6, L(col('amortisseur')), .06); arc(.376, .54, .64, L('#f4f1ea'), .06); }
    if(harn && col('selle')){
      const m = L(col('selle')), seat = add(tack, new THREE.BoxGeometry(.3, .07, .46), m, 0, 1.675, .05); seat.geometry.translate(0, 0, 0);
      add(tack, new THREE.BoxGeometry(.2, .1, .1), m, 0, 1.72, .27).rotation.x = -.35;      // pommeau
      add(tack, new THREE.BoxGeometry(.3, .12, .09), m, 0, 1.73, -.2).rotation.x = .45;     // troussequin
      [1, -1].forEach(s => { const q = add(tack, new THREE.BoxGeometry(.03, .5, .4), m, s * .355, 1.4, .1); q.rotation.z = s * .12; q.rotation.x = .1;
        add(tack, new THREE.BoxGeometry(.012, .42, .03), L('#3a2a20'), s * .385, 1.3, .12);                                   // étrivière
        ring(tack, L('#c9ced6'), .055, .012, s * .39, 1.05, .12, 0, Math.PI / 2); });                                          // étrier
      const sg = add(tack, new THREE.CylinderGeometry(.35, .35, .08, 18, 1, true, -1.9, 3.8), L('#3a2a20'), 0, 1.27, .22); sg.rotation.x = Math.PI / 2; sg.material.side = THREE.DoubleSide;   // sangle
    }
    // guêtres et cloches
    legs.forEach(l => { l.guetre.visible = harn && !!col('guetres'); if(col('guetres')) l.guetre.material.color.set(col('guetres')); if(l.cloche){ l.cloche.visible = harn && !!col('cloches'); if(col('cloches')) l.cloche.material.color.set(col('cloches')); } });
    // sur la tête : le filet pour monter, sinon le licol
    const filet = harn && o.filet !== false && col('filet');
    if(filet){
      const m = L(col('filet')), steel = L('#cfd4dc');
      ring(headTack, m, .128, .012, 0, -.03, .43);                         // muserolle
      ring(headTack, m, .178, .012, 0, .0, .02, 0, 0);                     // têtière + sous-gorge
      strap(headTack, m, [.165, .06, .07], [-.165, .06, .07], .024).position.y = .1;   // frontal
      [1, -1].forEach(s => { strap(headTack, m, [s * .17, .04, .04], [s * .118, -.07, .5], .024); const b = ring(headTack, steel, .035, .009, s * .125, -.09, .52, 0, Math.PI / 2); if(s > 0) bitL = b; else bitR = b; });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3));
      reins = new THREE.Line(g, new THREE.LineBasicMaterial({ color:col('filet') })); reins.frustumCulled = false; body.add(reins); tack.userData.reins = reins;
    } else if(col('licol') && o.licol !== false){
      const m = L(col('licol'));
      ring(headTack, m, .134, .017, 0, -.03, .4); ring(headTack, m, .182, .017, 0, 0, .03);
      [1, -1].forEach(s => strap(headTack, m, [s * .175, 0, .04], [s * .13, -.04, .4], .034));
      ring(headTack, L('#d9c58a'), .03, .008, 0, -.17, .38, Math.PI / 2, 0);
    }
    // la cavalière
    if(o.rider){
      const jacket = L(o.jacket || '#1f3c88'), white = L('#f1ece2'), skin = L('#e8b48a'), boot = L('#1c1a1d'), hair = L('#5a3a22');
      const torso = new THREE.Group(); torso.position.set(0, 1.74, .0); rider.add(torso); rider.userData.torso = torso;
      add(torso, new THREE.BoxGeometry(.3, .44, .19), jacket, 0, .26, 0);
      add(torso, new THREE.SphereGeometry(.115, 12, 10), skin, 0, .6, .01);
      const helm = add(torso, new THREE.SphereGeometry(.128, 12, 8, 0, 6.3, 0, 1.75), boot, 0, .62, 0); add(torso, new THREE.BoxGeometry(.16, .02, .08), boot, 0, .63, .14);
      add(torso, new THREE.CylinderGeometry(.035, .02, .3, 6), hair, 0, .42, -.13).rotation.x = -.25;                       // la queue-de-cheval
      [1, -1].forEach(s => { const arm = add(torso, new THREE.BoxGeometry(.075, .3, .08), jacket, s * .185, .3, .09); arm.rotation.x = -.75; const fore = add(torso, new THREE.BoxGeometry(.065, .26, .07), jacket, s * .17, .16, .28); fore.rotation.x = -1.35; add(torso, new THREE.SphereGeometry(.04, 6, 6), skin, s * .13, .12, .41);
        const th = add(rider, new THREE.BoxGeometry(.13, .44, .15), white, s * .26, 1.6, .14); th.rotation.x = -.95; th.rotation.z = s * .22;
        add(rider, new THREE.BoxGeometry(.1, .44, .11), boot, s * .37, 1.24, .22).rotation.x = .12; add(rider, new THREE.BoxGeometry(.09, .07, .2), boot, s * .38, 1.03, .28); });
      hands = new THREE.Object3D(); hands.position.set(0, .12, .41); torso.add(hands);
    }
  }

  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
  const GAIT = [null, { f:1.45, amp:.36, off:[0, .5, .75, .25], bob:.012 }, { f:2.5, amp:.55, off:[0, .5, .5, 0], bob:.045 }, { f:2.25, amp:.82, off:[.42, .58, 0, .16], bob:.06 }];
  let ph = 0, idle = Math.random() * 9, eat = 0;
  // state : { gait:0..3, air:null|0..1, eat:bool, speedK }
  function update(dt, st = {}){
    idle += dt; const g = GAIT[st.gait || 0], air = st.air;
    if(g) ph += dt * g.f * (st.speedK || 1);
    legs.forEach((l, i) => {
      let hipA = 0, kneeA = 0;
      if(air != null){ const k = Math.sin(Math.PI * Math.min(1, Math.max(0, air))); if(l.front){ hipA = -1.0 * k - .1; kneeA = 1.9 * k; } else { hipA = .15 + .75 * (air > .5 ? k : k * .3); kneeA = .7 * k; } }
      else if(g){ const a = (ph + g.off[i]) * Math.PI * 2; hipA = g.amp * Math.sin(a) * (l.front ? 1 : .85); kneeA = Math.max(0, Math.sin(a + 1.25)) * g.amp * (l.front ? 1.7 : 1.2); }
      l.hip.rotation.x += (hipA - l.hip.rotation.x) * Math.min(1, dt * 18); l.knee.rotation.x += (kneeA - l.knee.rotation.x) * Math.min(1, dt * 18);
    });
    let by = 0, pitch = 0, nod = 0;
    if(air != null){ pitch = -.42 * Math.cos(Math.PI * air); nod = .25 * Math.cos(Math.PI * air); }
    else if(g){ const a = ph * Math.PI * 2; by = Math.abs(Math.sin(a * (st.gait === 3 ? 1 : 2) / (st.gait === 3 ? 2 : 1) * (st.gait === 3 ? 2 : 1))) * g.bob; if(st.gait === 3){ pitch = Math.sin(a) * .07; nod = Math.sin(a + .6) * .12; } else nod = Math.sin(a * 2) * (st.gait === 1 ? .07 : .03); }
    else { by = Math.sin(idle * 1.4) * .004; nod = Math.sin(idle * .7) * .03; }
    eat += ((st.eat ? 1 : 0) - eat) * Math.min(1, dt * 3);
    body.position.y += (by - body.position.y) * Math.min(1, dt * 20); body.rotation.x += (pitch - body.rotation.x) * Math.min(1, dt * 10);
    neck.rotation.x = .62 + nod + eat * 1.25 + (st.gait === 3 ? .12 : 0) + (st.eat ? Math.sin(idle * 9) * .03 : 0); head.rotation.x = .3 - nod * .5 - eat * .1;
    tail.rotation.x = (g ? .25 + (st.gait - 1) * .22 : .05) + Math.sin(idle * 2.1) * .05; tail.rotation.z = Math.sin(idle * (g ? 5 : 1.3)) * (g ? .12 : .18);
    ears[0].rotation.z = -.2 + Math.sin(idle * 1.9) * .08; ears[1].rotation.z = .2 + Math.sin(idle * 2.3 + 1) * .08;
    const torso = rider.userData.torso; if(torso && rider.visible){ torso.rotation.x = air != null ? .55 * Math.sin(Math.PI * air) + .15 : (st.gait === 3 ? .16 + pitch * -.5 : st.gait === 2 ? .06 : 0); torso.position.y = 1.74 + (st.gait === 2 ? Math.max(0, Math.sin(ph * Math.PI * 4)) * .05 : 0); }
    if(reins && bitL){
      body.updateWorldMatrix(true, true); const p = reins.geometry.attributes.position, inv = body.matrixWorld.clone().invert();
      bitL.getWorldPosition(v1).applyMatrix4(inv); bitR.getWorldPosition(v2).applyMatrix4(inv);
      if(hands && rider.visible) hands.getWorldPosition(v3).applyMatrix4(inv); else v3.set(0, 1.64, .34);
      p.setXYZ(0, v1.x, v1.y, v1.z); p.setXYZ(1, v1.x * .9, (v1.y + v3.y) / 2 - .12, (v1.z + v3.z) / 2); p.setXYZ(2, v3.x + .06, v3.y, v3.z);
      p.setXYZ(3, v3.x - .06, v3.y, v3.z); p.setXYZ(4, v2.x * .9, (v2.y + v3.y) / 2 - .12, (v2.z + v3.z) / 2); p.setXYZ(5, v2.x, v2.y, v2.z); p.needsUpdate = true;
    }
  }
  root.scale.setScalar(def.t || 1);
  return { root, body, anchors:A, setEquip, update, def };
}
function shade(THREE, hex, k){ const c = new THREE.Color(hex); c.offsetHSL(0, 0, k * .5); return '#' + c.getHexString(); }
