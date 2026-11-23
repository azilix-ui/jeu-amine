/* Le studio vidéo du mur de la famille (21/11, demandé par les enfants et le papa).
   On filme avec la caméra, on choisit une vidéo de la tablette, ou des photos (1 à 6) qui s'animent ; on choisit une musique
   (mur/musique/liste.js) et on règle les deux volumes ; la tablette FABRIQUE elle-même la vidéo finale (540 × 960, 30 s au plus) :
   le dessin passe dans un canvas, le son dans Web Audio, et MediaRecorder enregistre le tout. Rien d'autre n'est envoyé :
   la vidéo d'origine (et ses infos cachées, position GPS…) reste dans la tablette. Puis api/mur.php?action=video.
   Studio.ouvre({ qui, jeton, api, reste, envoiMax, fini }) ; window.__studio pour les tests. */
(function(){
'use strict';
const W = 1080, H = 1920, MAXS = 30, FPS = 30, DEBIT = 8000000;   // 23/11 : le format des réseaux (Instagram, TikTok) : 1080 × 1920, 8 Mbit/s   // 22/11 : 720 × 1280 et 6 Mbit/s (avant 540 × 960 et 2 Mbit/s : l'iPad descendait à 0,15 Mbit/s, image « cassée »)
/* 22/11 (demande du papa : « meilleure qualité, lecture fluide, sans l'effet vidéo coupée ») : une vidéo FILMÉE, ou une vidéo de la tablette
   de 30 s au plus, n'est plus refabriquée (chaque nouvel encodage de l'iPad abîmait l'image) : on envoie l'original. La musique et le petit mot
   sont alors posés par-dessus à la lecture, dans le fil (comme TikTok). Seules les photos animées, ou une vidéo qu'on coupe, passent encore
   par la fabrication. Pour une vidéo de la tablette, on efface d'abord ses infos cachées (position GPS, appareil) : nettoie(). */
// les boîtes « udta » et « meta » d'un MP4/MOV (où l'iPhone et l'iPad rangent le lieu et l'appareil) deviennent des boîtes « free » :
// même taille, rien ne bouge dans le fichier, et plus aucun lecteur ne les lit.
function nettoie(buf){ const u = new Uint8Array(buf), dv = new DataView(buf); let n = 0;
  const typ = p => String.fromCharCode(u[p], u[p + 1], u[p + 2], u[p + 3]);
  const parcourt = (de, a, prof) => { let p = de; while(p + 8 <= a){ let t = dv.getUint32(p), h = 8; if(t === 1 && p + 16 <= a){ t = Number(dv.getBigUint64(p + 8)); h = 16; } else if(t === 0) t = a - p;
      if(t < 8 || p + t > a) break; const k = typ(p + 4);
      if(k === 'udta' || k === 'meta'){ u.set([102, 114, 101, 101], p + 4); n++; }
      else if(prof < 4 && ['moov', 'trak', 'mdia', 'minf'].includes(k)) parcourt(p + h, p + t, prof + 1);
      p += t; } };
  parcourt(0, u.length, 0); return n; }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const MUS = () => window.MUR_MUSIQUES || [];
const typeRec = () => { if(!window.MediaRecorder) return '';
  for(const t of ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']) if(MediaRecorder.isTypeSupported(t)) return t; return ''; };
const peutFiltrer = (() => { try{ const g = document.createElement('canvas').getContext('2d'); g.filter = 'blur(2px)'; return g.filter === 'blur(2px)'; }catch(e){ return false; } })();
let AC = null; const ac = () => { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if(AC.state === 'suspended') AC.resume(); return AC; };
const tampons = {};
async function musique(id){ const m = MUS().find(x => x.id === id); if(!m) return null; if(tampons[id]) return tampons[id];
  const r = await fetch(m.src); const b = await r.arrayBuffer(); return tampons[id] = await new Promise((ok, ko) => { const p = ac().decodeAudioData(b, ok, ko); if(p && p.then) p.then(ok, ko); }); }

function ouvre(o){
  const back = document.createElement('div'); back.className = 'cabine studio'; document.body.appendChild(back);
  // l'état du montage : la source (vidéo ou photos), la musique, les volumes, le petit mot
  const S = { type:'', blobUrl:'', debut:0, duree:0, photos:[], musique:'', volV:1, volM:.7, mot:'', flux:null, rec:null, face:'user', brut:null };
  window.__studio = { S, back };
  let anim = 0, lecteur = null, srcNode = null, gV = null, gM = null, mSrc = null, vid = null, dest = null, fin = null;
  const coupeFlux = () => { if(S.flux){ S.flux.getTracks().forEach(t => t.stop()); S.flux = null; } };
  const stopTout = () => { cancelAnimationFrame(anim); try{ coupeMusA(); }catch(e){} try{ mSrc && mSrc.stop(); }catch(e){} mSrc = null; if(vid){ vid.pause(); } };
  const ferme = () => { stopTout(); coupeFlux(); if(S.blobUrl) URL.revokeObjectURL(S.blobUrl); back.remove(); delete window.__studio; };

  /* ---------- 1 · choisir ---------- */
  function choix(){
    stopTout(); coupeFlux();
    back.innerHTML = `<h2>🎬 Le studio vidéo</h2><p class="reste">Il te reste ${o.reste} vidéo${o.reste > 1 ? 's' : ''} aujourd'hui · 30 secondes au plus</p>
      <div class="st-choix">
        <button data-c="filme"><span>🎥</span><b>Filmer</b><small>avec la caméra</small></button>
        <label><span>📁</span><b>Une vidéo</b><small>de la tablette</small><input type="file" accept="video/*" hidden id="stVid"></label>
        <label><span>🖼️</span><b>Des photos</b><small>1 à 6, elles s'animent</small><input type="file" accept="image/*" multiple hidden id="stPh"></label>
      </div>
      ${typeRec() ? '' : '<p class="msgerr">Cette tablette ne sait pas fabriquer de vidéo (navigateur trop ancien) 😕</p>'}
      <div class="cab-btns"><button class="t" id="stFerme">✕ Fermer</button></div>`;
    back.querySelector('#stFerme').onclick = ferme;
    back.querySelector('[data-c=filme]').onclick = filme;
    back.querySelector('#stVid').onchange = async e => { const f = e.target.files[0]; if(!f) return; S.type = 'video'; S.blobUrl = URL.createObjectURL(f); S.debut = 0; S.miroir = false; S.brut = null;
      if(f.size <= o.envoiMax && /mp4|quicktime|webm/.test(f.type || 'video/mp4')){ try{ const buf = await f.arrayBuffer(); if(!/webm/.test(f.type)) nettoie(buf); S.brut = new Blob([buf], { type:/webm/.test(f.type) ? 'video/webm' : 'video/mp4' }); }catch(err){ S.brut = null; } }
      monte(); };
    back.querySelector('#stPh').onchange = async e => { const fs = [...e.target.files].slice(0, 6); if(!fs.length) return;
      S.type = 'photos'; S.brut = null; S.photos = await Promise.all(fs.map(f => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = URL.createObjectURL(f); })));
      S.photos = S.photos.filter(Boolean); if(!S.musique && MUS()[0]) S.musique = MUS()[0].id; monte(); };
  }

  /* ---------- 2a · filmer ---------- */
  async function filme(){
    back.innerHTML = `<h2>🎥 Filme ta vidéo</h2><div class="st-ecran"><video playsinline autoplay muted class="${S.face === 'user' ? 'miroir' : ''}"></video><div class="decompte" id="stCdn"></div><div class="st-temps" id="stT" hidden></div></div>
      <div class="cab-btns"><button class="t" id="stRet">← Retour</button><button class="declencheur" id="stRec" aria-label="Filmer"></button><button class="t" id="stTour" hidden>🔄 Retourner</button></div><p class="msgerr" id="stErr"></p>`;
    back.querySelector('#stRet').onclick = choix;
    const v = back.querySelector('video');
    try{ coupeFlux(); S.flux = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:S.face, width:{ ideal:1080 }, height:{ ideal:1920 }, frameRate:{ ideal:30 } }, audio:{ echoCancellation:true, noiseSuppression:true } });
      v.srcObject = S.flux; await v.play().catch(() => {});
      const cams = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
      if(cams.length > 1){ const t = back.querySelector('#stTour'); t.hidden = false; t.onclick = () => { S.face = S.face === 'user' ? 'environment' : 'user'; filme(); }; }
    }catch(e){ back.querySelector('#stErr').textContent = 'La caméra ne s\'ouvre pas 😕 Vérifie que le site a le droit d\'utiliser la caméra et le micro, ou choisis « Une vidéo ».'; return; }
    const bouton = back.querySelector('#stRec'), tps = back.querySelector('#stT');
    bouton.onclick = async () => {
      if(S.rec){ S.rec.stop(); return; }
      bouton.disabled = true; const cdn = back.querySelector('#stCdn');
      for(const n of [3, 2, 1]){ cdn.textContent = n; await new Promise(r => setTimeout(r, 700)); } cdn.textContent = '';
      const morceaux = [], t = typeRec(); S.rec = new MediaRecorder(S.flux, t ? { mimeType:t, videoBitsPerSecond:DEBIT, audioBitsPerSecond:128000 } : undefined);
      S.rec.ondataavailable = e => { if(e.data.size) morceaux.push(e.data); };
      S.rec.onstop = () => { clearInterval(S.chrono); const b = new Blob(morceaux, { type:S.rec.mimeType || t || 'video/webm' }); S.rec = null; coupeFlux();
        S.type = 'video'; S.blobUrl = URL.createObjectURL(b); S.debut = 0; S.miroir = false; S.brut = b; monte(); };   // l'original part tel quel (pas de miroir : on se voit comme les autres nous voient)
      S.rec.start(500); bouton.disabled = false; bouton.classList.add('enreg'); tps.hidden = false; const t0 = Date.now();
      S.chrono = setInterval(() => { const s = (Date.now() - t0) / 1000; tps.textContent = '● ' + Math.floor(s) + ' / ' + MAXS + ' s'; if(s >= MAXS && S.rec) S.rec.stop(); }, 200);
    };
  }

  /* ---------- le dessin d'une image du montage (aperçu et fabrication) ---------- */
  function couvre(g, src, sw, sh, k = 1, dx = 0, dy = 0){ const s = Math.max(W / sw, H / sh) * k, w = sw * s, h = sh * s; g.drawImage(src, (W - w) / 2 + dx, (H - h) / 2 + dy, w, h); }
  function contient(g, src, sw, sh, k = 1, dx = 0, dy = 0){ const s = Math.min(W / sw, H / sh) * k, w = sw * s, h = sh * s; g.drawImage(src, (W - w) / 2 + dx, (H - h) / 2 + dy, w, h); }
  function fond(g, src, sw, sh){ g.save(); if(peutFiltrer) g.filter = 'blur(22px) brightness(.7)'; couvre(g, src, sw, sh, 1.15); g.restore(); if(!peutFiltrer){ g.fillStyle = '#000a'; g.fillRect(0, 0, W, H); } }
  function dessine(g, t, sansMot){
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    if(S.type === 'video' && vid && vid.videoWidth){ const vw = vid.videoWidth, vh = vid.videoHeight;
      g.save(); if(S.miroir){ g.translate(W, 0); g.scale(-1, 1); }
      if(vh / vw > 1.6) couvre(g, vid, vw, vh); else { fond(g, vid, vw, vh); contient(g, vid, vw, vh); }
      g.restore(); }
    if(S.type === 'photos' && S.photos.length){ const per = S.duree / S.photos.length, i = Math.min(S.photos.length - 1, Math.floor(t / per)), u = (t - i * per) / per;
      const une = (im, uu, a) => { if(!im) return; g.globalAlpha = a; const k = 1.02 + .1 * uu, dx = (i % 2 ? -1 : 1) * 18 * (uu - .5);
        if(im.height / im.width > 1.3) couvre(g, im, im.width, im.height, k, dx); else { fond(g, im, im.width, im.height); contient(g, im, im.width, im.height, k * .98, dx); } g.globalAlpha = 1; };
      une(S.photos[i], u, 1);
      const fondu = .45 / per; if(u > 1 - fondu && i < S.photos.length - 1) une(S.photos[i + 1], 0, (u - (1 - fondu)) / fondu);
      if(t < .4) { g.fillStyle = `rgba(0,0,0,${1 - t / .4})`; g.fillRect(0, 0, W, H); } }
    if(S.mot && !sansMot){ g.font = '700 66px Nunito, sans-serif'; g.textAlign = 'center'; const l = S.mot.slice(0, 60);
      g.fillStyle = '#0008'; const lw = Math.min(W - 40, g.measureText(l).width + 36); g.fillRect((W - lw) / 2, H - 300, lw, 108); g.fillStyle = '#fff'; g.fillText(l, W / 2, H - 225); }
  }

  /* ---------- le son : la vidéo et la musique passent par Web Audio (on règle les deux volumes) ---------- */
  function sonPret(){ const a = ac(); if(!dest) dest = a.createMediaStreamDestination(); if(!gV){ gV = a.createGain(); gV.connect(a.destination); gV.connect(dest); } if(!gM){ gM = a.createGain(); gM.connect(a.destination); gM.connect(dest); } }
  async function lanceMusique(depuis){ try{ mSrc && mSrc.stop(); }catch(e){} mSrc = null; if(!S.musique) return; const b = await musique(S.musique).catch(() => null); if(!b) return;
    const a = ac(); mSrc = a.createBufferSource(); mSrc.buffer = b; mSrc.loop = true; mSrc.connect(gM); gM.gain.cancelScheduledValues(a.currentTime); gM.gain.setValueAtTime(S.volM, a.currentTime);
    const reste = S.duree - depuis; if(reste > 1.2){ gM.gain.setValueAtTime(S.volM, a.currentTime + reste - 1.2); gM.gain.linearRampToValueAtTime(0, a.currentTime + reste); }
    mSrc.start(0, depuis % b.duration); }

  /* ---------- 2b · le montage ---------- */
  async function monte(){
    stopTout();
    back.innerHTML = `<h2>✨ Monte ta vidéo</h2>
      <div class="st-monte"><div class="st-ecran"><canvas width="${W}" height="${H}" id="stCv"></canvas><button class="st-play" id="stPlay" hidden>▶</button></div>
      <div class="st-reglages">
        <div id="stDebutL" hidden><label>✂️ Le début de ta vidéo : <b id="stDebutV">0 s</b></label><input type="range" id="stDebut" min="0" max="0" step=".5" value="0"></div>
        <label>🎵 La musique</label><div class="st-mus" id="stMus"></div>
        <label id="stVolVL">🎤 Le son de ta vidéo</label><input type="range" id="stVolV" min="0" max="1" step=".05" value="${S.volV}">
        <label>🎶 Le volume de la musique</label><input type="range" id="stVolM" min="0" max="1" step=".05" value="${S.volM}">
        <label>✏️ Un petit mot (sur la vidéo)</label><input type="text" id="stMot" maxlength="60" placeholder="Écris un petit mot…" value="${esc(S.mot)}">
      </div></div>
      <div class="cab-btns"><button class="t" id="stRet">← Recommencer</button><button class="t go" id="stFab">✨ Fabriquer ma vidéo</button></div><p class="msgerr" id="stErr"></p>`;
    const cv = back.querySelector('#stCv'), g = cv.getContext('2d');
    back.querySelector('#stRet').onclick = () => { if(S.blobUrl){ URL.revokeObjectURL(S.blobUrl); S.blobUrl = ''; } S.type = ''; choix(); };
    back.querySelector('#stMus').innerHTML = `<button data-m="" class="${S.musique ? '' : 'on'}">🔇 Sans musique</button>` + MUS().map(m => `<button data-m="${m.id}" class="${S.musique === m.id ? 'on' : ''}">${m.emoji} ${esc(m.titre)}</button>`).join('');
    back.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { S.musique = b.dataset.m; back.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); rejoue(); });
    back.querySelector('#stVolV').oninput = e => { S.volV = +e.target.value; if(gV) gV.gain.value = S.volV; };
    back.querySelector('#stVolM').oninput = e => { S.volM = +e.target.value; if(gM) gM.gain.value = S.volM; };
    back.querySelector('#stMot').oninput = e => { S.mot = e.target.value; };
    sonPret();
    if(S.type === 'video'){
      vid = document.createElement('video'); vid.playsInline = true; vid.preload = 'auto'; vid.src = S.blobUrl; vid.crossOrigin = 'anonymous';
      await new Promise(ok => { vid.onloadedmetadata = ok; vid.onerror = ok; setTimeout(ok, 6000); });
      if(!vid.videoWidth && !isFinite(vid.duration)){ back.querySelector('#stErr').textContent = 'Cette vidéo ne s\'ouvre pas sur la tablette 😕'; return; }
      // un enregistrement MediaRecorder n'a pas toujours de durée : on la fait calculer en allant tout au bout
      if(!isFinite(vid.duration)){ vid.currentTime = 1e6; await new Promise(ok => { vid.ondurationchange = ok; setTimeout(ok, 3000); }); vid.currentTime = 0; }
      const total = isFinite(vid.duration) ? vid.duration : MAXS;
      if(total > MAXS + .5){ const r = back.querySelector('#stDebut'); back.querySelector('#stDebutL').hidden = false; r.max = Math.floor(total - MAXS); r.value = S.debut;
        r.oninput = () => { S.debut = +r.value; back.querySelector('#stDebutV').textContent = S.debut + ' s'; S.duree = Math.min(MAXS, total - S.debut); rejoue(); }; }
      S.duree = Math.min(MAXS, total - S.debut);
      if(total > MAXS + .5) S.brut = null;   // plus de 30 s : il faut couper, donc refabriquer
      try{ srcNode = ac().createMediaElementSource(vid); srcNode.connect(gV); }catch(e){}
      gV.gain.value = S.volV;
    } else { back.querySelector('#stVolV').hidden = back.querySelector('#stVolVL').hidden = true; S.duree = Math.min(MAXS, Math.max(6, S.photos.length * 3.2)); }
    lecteur = { cv, g }; rejoue();
    back.querySelector('#stFab').onclick = () => S.brut ? direct() : fabrique();
    if(S.brut) back.querySelector('#stFab').textContent = '✅ C\'est prêt !';
  }
  // l'aperçu tourne en boucle, avec le son
  async function rejoue(){ if(!lecteur) return; stopTout(); const { g } = lecteur; const btn = back.querySelector('#stPlay');
    if(S.type === 'video'){ vid.currentTime = S.debut; try{ await vid.play(); btn.hidden = true; }catch(e){ btn.hidden = false; btn.onclick = () => { ac(); rejoue(); }; return; } }
    const t0 = performance.now(); await lanceMusique(0);
    const boucle = () => { const t = S.type === 'video' ? vid.currentTime - S.debut : (performance.now() - t0) / 1000;
      if(t >= S.duree || (S.type === 'video' && vid.ended)){ rejoue(); return; } dessine(g, t); anim = requestAnimationFrame(boucle); };
    boucle(); }

  // l'aperçu d'un original : la musique jouée à côté de la vidéo (Web Audio : sur iPad, le volume d'un lecteur ne se règle pas)
  let musA = null; const coupeMusA = () => { if(musA){ try{ musA.src.stop(); }catch(e){} musA = null; } };
  async function lecteurMus(v){ const b = await musique(S.musique).catch(() => null); if(!b) return; const a = ac(), gn = a.createGain(); gn.gain.value = S.volM; gn.connect(a.destination);
    const go = () => { coupeMusA(); if(v.paused || !document.body.contains(v)) return; const src = a.createBufferSource(); src.buffer = b; src.loop = true; src.connect(gn); src.start(0, v.currentTime % b.duration); musA = { src }; };
    v.addEventListener('play', go); v.addEventListener('playing', go); v.addEventListener('pause', coupeMusA); v.addEventListener('seeked', go); go(); }
  /* ---------- 3a · l'original, sans refabriquer : juste une image d'affiche ---------- */
  async function direct(){
    stopTout(); const { cv, g } = lecteur;
    vid.currentTime = Math.min(.8, Math.max(0, S.duree - .1)); await new Promise(ok => { vid.onseeked = ok; setTimeout(ok, 1500); });
    dessine(g, .8, true); resultat(S.brut, cv.toDataURL('image/jpeg', .82), true);
  }
  /* ---------- 3 · la fabrication : on rejoue une fois en enregistrant le canvas et le son ---------- */
  async function fabrique(debit = DEBIT){
    stopTout(); const t = typeRec(); if(!t){ back.querySelector('#stErr').textContent = 'Cette tablette ne sait pas fabriquer de vidéo 😕'; return; }
    const { cv, g } = lecteur; ac(); back.querySelector('#stFab').disabled = true; back.querySelector('#stRet').disabled = true;
    const barre = document.createElement('div'); barre.className = 'st-barre'; barre.innerHTML = '<i></i><span>Je fabrique ta vidéo… regarde !</span>'; back.querySelector('.st-ecran').appendChild(barre);
    const flux = cv.captureStream(FPS), piste = flux.getVideoTracks()[0]; dest.stream.getAudioTracks().forEach(tr => flux.addTrack(tr));
    const morceaux = [], rec = new MediaRecorder(flux, { mimeType:t, videoBitsPerSecond:debit, audioBitsPerSecond:128000 }); let poster = '';
    rec.ondataavailable = e => { if(e.data.size) morceaux.push(e.data); };
    const fini = new Promise(ok => { rec.onstop = ok; });
    if(S.type === 'video'){ vid.currentTime = S.debut; await new Promise(ok => { vid.onseeked = ok; setTimeout(ok, 1500); }); }
    dessine(g, 0); rec.start(1000);
    if(S.type === 'video') await vid.play().catch(() => {});
    const t0 = performance.now(); await lanceMusique(0);
    await new Promise(ok => { const boucle = () => { const tt = S.type === 'video' ? vid.currentTime - S.debut : (performance.now() - t0) / 1000;
        dessine(g, Math.min(tt, S.duree - .01)); if(piste && piste.requestFrame) piste.requestFrame(); barre.querySelector('i').style.width = Math.min(100, tt / S.duree * 100) + '%';
        if(!poster && tt > .8) poster = cv.toDataURL('image/jpeg', .8);
        if(tt >= S.duree || (S.type === 'video' && vid.ended)){ ok(); return; } anim = requestAnimationFrame(boucle); }; boucle(); });
    stopTout(); rec.stop(); await fini;
    const blob = new Blob(morceaux, { type:t.split(';')[0] });
    if(!poster) poster = cv.toDataURL('image/jpeg', .8);
    if(blob.size > o.envoiMax && debit > 1500000){ barre.remove(); return fabrique(Math.round(debit * .6)); }   // trop lourde : on refait plus légère
    resultat(blob, poster);
  }

  /* ---------- 4 · on regarde, puis on publie ---------- */
  function resultat(blob, poster, brut){
    const u = URL.createObjectURL(blob);
    back.innerHTML = `<h2>🎉 Ta vidéo est prête !</h2><div class="st-ecran"><video src="${u}" controls playsinline autoplay loop poster="${poster}"></video></div>
      <p class="reste">${(blob.size / 1e6).toFixed(1).replace('.', ',')} Mo · ${Math.round(S.duree)} s${S.musique ? ' · ' + esc((MUS().find(m => m.id === S.musique) || {}).titre || '') : ''}</p>
      <div class="cab-btns"><button class="t" id="stRe">↺ Refaire le montage</button><button class="t" id="stAnn">✕ Annuler</button><button class="t go" id="stPub">📌 Publier sur le mur</button></div><div class="st-barre envoi" hidden><i></i><span>J'envoie…</span></div><p class="msgerr" id="stErr"></p>`;
    window.__studio.blob = blob;
    back.querySelector('#stRe').onclick = () => { URL.revokeObjectURL(u); monte(); };
    if(brut){ const ap = back.querySelector('.st-ecran video'); ap.volume = S.volV; ap.muted = S.volV === 0;
      if(S.musique) musique(S.musique).then(() => { lecteurMus(ap); }).catch(() => {});
      if(S.mot) back.querySelector('.st-ecran').insertAdjacentHTML('beforeend', `<div class="st-mot">${esc(S.mot)}</div>`); }
    back.querySelector('#stAnn').onclick = ferme;
    back.querySelector('#stPub').onclick = () => {
      if(blob.size > o.envoiMax){ back.querySelector('#stErr').textContent = 'Ta vidéo est trop lourde pour le site : raccourcis-la un peu.'; return; }
      const fd = new FormData(); fd.append('action', 'video'); fd.append('auteur', o.qui); fd.append('jeton', o.jeton); fd.append('texte', S.mot.trim()); fd.append('musique', S.musique); fd.append('poster', poster); fd.append('brut', brut ? '1' : ''); fd.append('volv', S.volV); fd.append('volm', S.volM);
      fd.append('video', blob, 'video.' + (blob.type.includes('mp4') ? 'mp4' : 'webm'));
      const x = new XMLHttpRequest(), barre = back.querySelector('.st-barre.envoi'); barre.hidden = false; back.querySelector('#stPub').disabled = true;
      x.upload.onprogress = e => { if(e.lengthComputable) barre.querySelector('i').style.width = (e.loaded / e.total * 100) + '%'; };
      x.onload = () => { let j = {}; try{ j = JSON.parse(x.responseText); }catch(e){}
        if(x.status === 200 && j.ok){ URL.revokeObjectURL(u); ferme(); o.fini && o.fini(j.id); }
        else { back.querySelector('#stErr').textContent = j.error || 'L\'envoi n\'a pas marché : réessaie.'; back.querySelector('#stPub').disabled = false; barre.hidden = true; } };
      x.onerror = () => { back.querySelector('#stErr').textContent = 'Pas de connexion : réessaie.'; back.querySelector('#stPub').disabled = false; barre.hidden = true; };
      x.open('POST', o.api); x.send(fd);
    };
  }
  choix();
}
window.Studio = { ouvre, typeRec };
})();
