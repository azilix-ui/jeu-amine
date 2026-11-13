/* Bruitages enregistrés (ElevenLabs, formule Starter du papa : usage libre, sans mention obligatoire).
   Sons.charger('jasmin', ['saut', ...]) précharge jeux/sons/jasmin-saut.mp3 ...
   Sons.jouer(AC, dest, 'saut') joue le son s'il est prêt et renvoie true ; sinon false (le jeu garde son bip de secours).
   Sons.boucle(AC, dest, 'souk', vol) lance une ambiance en boucle ; Sons.stop() l'arrête. */
window.Sons = (function(){
  const raw = {}, buf = {}, base = (document.currentScript && document.currentScript.src || '').replace(/sons\.js.*$/, '');
  let amb = null, ambNom = '', AClast = null, OFF = null;
  try{ OFF = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 1, 44100); }catch(e){}   // décode dès le chargement, sans attendre le premier toucher
  function charger(prefixe, noms){
    noms.filter(n => !raw[n] && !charger.en[n]).forEach(n => (charger.en[n] = 1) && fetch(`${base}${prefixe}-${n}.mp3`).then(r => r.ok ? r.arrayBuffer() : null)
      .then(a => { if(a){ raw[n] = a; if(OFF || AClast) decode(OFF || AClast, n); } }).catch(() => {}));
  }
  charger.en = {};
  function decode(AC, n){
    if(buf[n] || !raw[n] || raw[n].enCours) return;
    raw[n].enCours = 1;
    const ok = b => { buf[n] = b; if(ambNom === n && !amb && ambArgs) boucle(...ambArgs); };
    const ko = () => { raw[n].enCours = 0; if(AC === OFF && AClast) decode(AClast, n); };
    try{ const p = AC.decodeAudioData(raw[n].slice(0), ok, ko); if(p && p.catch) p.catch(() => {}); }catch(e){ ko(); }   // forme à rappels : marche aussi sur les vieux iPad
  }
  function prep(AC){ if(!AC || AClast === AC) return; AClast = AC; Object.keys(raw).forEach(n => decode(AC, n)); }
  function jouer(AC, dest, n, vol = 1, vitesse = 1){
    if(!AC) return false; prep(AC);
    if(!buf[n]) return false;
    try{
      const s = AC.createBufferSource(), g = AC.createGain();
      s.buffer = buf[n]; s.playbackRate.value = vitesse; g.gain.value = vol;
      s.connect(g).connect(dest || AC.destination); s.start();
      return true;
    }catch(e){ return false; }
  }
  let ambArgs = null;
  function boucle(AC, dest, n, vol = .35){
    if(ambNom === n && amb) return;
    stop(); ambNom = n; ambArgs = [AC, dest, n, vol];
    if(!AC) return; prep(AC);
    if(!buf[n]) return;               // relancé tout seul dès que le son est décodé
    try{
      const s = AC.createBufferSource(), g = AC.createGain();
      s.buffer = buf[n]; s.loop = true; g.gain.setValueAtTime(0, AC.currentTime); g.gain.linearRampToValueAtTime(vol, AC.currentTime + 1.2);
      s.connect(g).connect(dest || AC.destination); s.start();
      amb = { s, g, AC };
    }catch(e){ amb = null; }
  }
  function stop(){
    ambNom = ''; ambArgs = null;
    if(!amb) return;
    const { s, g, AC } = amb; amb = null;
    try{ g.gain.cancelScheduledValues(AC.currentTime); g.gain.setValueAtTime(g.gain.value, AC.currentTime); g.gain.linearRampToValueAtTime(0, AC.currentTime + .6); s.stop(AC.currentTime + .7); }catch(e){}
  }
  return { charger, jouer, boucle, stop, prep, pret: n => !!buf[n] };
})();
