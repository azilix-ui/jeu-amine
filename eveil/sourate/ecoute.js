/* Rubrique « Sourate » (18/11) : écouter l'enfant qui répète un verset.
   1) La reconnaissance vocale de la tablette (choix du papa, gratuite) : SpeechRecognition en arabe (ar-SA) ; Chrome, Android
      et iPad (Siri activé) la proposent. La voix passe par le service de Google ou d'Apple ; rien n'est gardé par le site.
   2) Sans elle (Firefox, refus, panne) : on enregistre l'enfant, on regarde s'il a parlé (niveau du micro), et il se réécoute.
   La comparaison est indulgente : on compte les mots du verset retrouvés dans ce qui a été entendu, sans voyelles,
   avec une petite faute permise par mot. Les fonctions de comparaison sont pures (testées dans Node : docs/eveil/test-sourate.mjs). */

// arabe sans voyelles ni signes : أ إ آ ٱ -> ا, ة -> ه, ى -> ي, ؤ -> و, ئ -> ي ; l'alif suscrit (ٰ) devient un vrai alif
export function normAr(t){
  return String(t || '')
    .replace(/ـٰ|ٰ/g, 'ا')                  // ـٰ / ٰ (alif suscrit)
    .replace(/[ً-ٟۖ-ۭـ]/g, '')     // voyelles, tanwin, chadda, soukoun, petits signes coraniques, tatwil
    .replace(/[ٱآأإٲٳ]/g, 'ا')
    .replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ء/g, '')
    .replace(/[^ء-ي\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
export const motsAr = t => normAr(t).split(' ').filter(Boolean);

export function distance(a, b){   // Levenshtein
  if(a === b) return 0; const m = a.length, n = b.length; if(!m) return n; if(!n) return m;
  let p = Array.from({ length:n + 1 }, (_, j) => j);
  for(let i = 1; i <= m; i++){ const c = [i]; for(let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
  return p[n];
}
// deux mots « pareils » : égaux, ou une faute pour un mot de 4 lettres et plus (2 pour 7 et plus) ; « و » collé ou décollé
export function pareil(cible, dit){
  if(!cible || !dit) return false;
  const c = cible.replace(/^و(?=ا)/, ''), d = dit.replace(/^و(?=ا)/, '');
  if(c === d || cible === dit) return true;
  const n = Math.max(c.length, d.length), tol = n >= 7 ? 2 : n >= 4 ? 1 : 0;
  return distance(c, d) <= tol;
}
// quels mots du verset ont été entendus (dans l'ordre, en sautant ce qui manque) ; textes = plusieurs propositions de la tablette
export function aligne(cibles, textes){
  const C = cibles.map(normAr), vu = new Array(C.length).fill(false);
  for(const t of [].concat(textes || [])){
    const D = motsAr(t); let j = 0;
    for(let i = 0; i < C.length && j < D.length; i++){
      let k = j; while(k < D.length && k < j + 4 && !pareil(C[i], D[k])) k++;   // on cherche le mot un peu plus loin (mots en trop)
      if(k < D.length && k < j + 4){ vu[i] = true; j = k + 1; }
    }
    // mots isolés retrouvés ailleurs (la tablette a pu tout mélanger)
    C.forEach((c, i) => { if(!vu[i] && D.some(d => pareil(c, d))) vu[i] = true; });
  }
  return vu;
}
export const score = (cibles, textes) => { const v = aligne(cibles, textes); return v.length ? v.filter(Boolean).length / v.length : 0; };
// le verdict selon l'âge : 'bravo' | 'moitie' | 'rien'
export const SEUILS = { Essil:.6, Salma:.5, Amine:.25 };
export function verdict(s, joueur, aParle){
  const seuil = SEUILS[joueur] ?? .5;
  if(s >= seuil) return 'bravo';
  if(s > 0 || aParle) return joueur === 'Amine' && aParle ? 'bravo' : 'moitie';   // Amine : s'il a parlé, c'est bravo
  return 'rien';
}

/* ---------- dans le navigateur ---------- */
const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
let srCasse = false;   // la reconnaissance a refusé (permission, réseau) : on passe à l'enregistrement pour la suite
export const peutReconnaitre = () => !!SR && !srCasse;

/* écoute pendant au plus `duree` ms (et s'arrête après un silence quand quelque chose a été dit).
   onPartiel(textes) à chaque morceau entendu. Rend { mode:'sr', textes, aParle } ou { mode:'rec', aParle, url } (enregistrement). */
export function ecouter({ duree = 8000, silence = 1800, onPartiel, signal } = {}){
  if(peutReconnaitre()) return ecouterSR({ duree, silence, onPartiel, signal }).catch(e => { srCasse = true; return enregistrer({ duree, signal }); });
  return enregistrer({ duree, signal });
}
function ecouterSR({ duree, silence, onPartiel, signal }){
  return new Promise((res, rej) => {
    const r = new SR(); r.lang = 'ar-SA'; r.interimResults = true; r.maxAlternatives = 5; r.continuous = true;
    let textes = [], final = [], dernier = 0, fini = false, t0 = Date.now(), aParle = false;
    const fin = (err) => { if(fini) return; fini = true; clearInterval(tic); try{ r.abort(); }catch(e){}
      if(err) rej(err); else res({ mode:'sr', textes:final.concat(textes), aParle }); };
    r.onresult = e => {
      const alts = []; let tout = '';
      for(let i = 0; i < e.results.length; i++){ const x = e.results[i];
        for(let a = 0; a < x.length; a++) if(x[a].transcript) alts.push(x[a].transcript);
        tout += ' ' + (x[0] && x[0].transcript || ''); }
      textes = [tout.trim()].concat(alts); final = []; aParle = aParle || !!tout.trim(); dernier = Date.now();
      if(onPartiel) try{ onPartiel(textes); }catch(_){}
    };
    r.onspeechstart = () => { aParle = true; dernier = Date.now(); };
    r.onerror = e => { if(e.error === 'no-speech' || e.error === 'aborted') return fin(); fin(new Error(e.error || 'sr')); };
    r.onend = () => fin();
    const tic = setInterval(() => { const now = Date.now();
      if(signal && signal.stop) return fin();
      if(now - t0 > duree || (dernier && now - dernier > silence)) fin(); }, 150);
    try{ r.start(); }catch(e){ fin(e); }
  });
}
// sans reconnaissance : micro + niveau sonore pour savoir si l'enfant a parlé, et l'enregistrement pour qu'il se réécoute
async function enregistrer({ duree, signal }){
  let flux;
  try{ flux = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:true, noiseSuppression:true } }); }
  catch(e){ return { mode:'aucun', aParle:false }; }
  const AC = window.AudioContext || window.webkitAudioContext, ac = new AC(), src = ac.createMediaStreamSource(flux), an = ac.createAnalyser();
  an.fftSize = 1024; src.connect(an); const buf = new Float32Array(an.fftSize);
  let morceaux = [], rec = null; try{ rec = new MediaRecorder(flux); rec.ondataavailable = e => e.data.size && morceaux.push(e.data); rec.start(); }catch(e){}
  let voix = 0, dernier = 0; const t0 = Date.now();
  await new Promise(res => { const tic = setInterval(() => {
    an.getFloatTimeDomainData(buf); let s = 0; for(const v of buf) s += v * v; const rms = Math.sqrt(s / buf.length);
    if(rms > .03){ voix += 100; dernier = Date.now(); }
    const now = Date.now();
    if((signal && signal.stop) || now - t0 > duree || (voix > 600 && now - dernier > 1600)){ clearInterval(tic); res(); } }, 100); });
  const url = await new Promise(res => { if(!rec) return res(null); rec.onstop = () => res(morceaux.length ? URL.createObjectURL(new Blob(morceaux, { type:rec.mimeType || 'audio/webm' })) : null); try{ rec.stop(); }catch(e){ res(null); } });
  flux.getTracks().forEach(t => t.stop()); try{ ac.close(); }catch(e){}
  return { mode:'rec', aParle:voix >= 400, url };
}
