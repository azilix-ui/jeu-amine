/* Famille Missaoui — « Qui es-tu ? » et le mode explorateur (14/11/2026, demandé par le papa).
   Ce petit script est mis en TOUT PREMIER dans chaque page par la porte du site (acces/porte.php), avant les autres scripts.

   Le profil choisi sur l'accueil vit le temps de la visite (sessionStorage « famille-profil » = {nom, type}) :
   - un enfant (Essil, Salma, Amine) : rien de spécial, ses cours et ses jeux comptent comme d'habitude ;
   - papa, maman ou un invité (Nour, Yasmine, Farès) : MODE EXPLORATEUR. On peut tout ouvrir et faire les exercices des enfants,
     mais rien ne compte :
       1. tout ce que les pages écrivent dans localStorage reste dans l'onglet (une couche par-dessus, dans sessionStorage) :
          les vraies données des enfants sur la tablette ne bougent pas ;
       2. un cookie « famille_explo » dit au serveur (api/famille.php) de ne rien enregistrer au nom d'un enfant ;
       3. le joueur de cette visite est l'explorateur (les jeux de famille le proposent, la limite de temps ne s'applique pas) ;
       4. une étiquette « Explorateur du site : <nom> » (en bas à gauche, déplaçable).
   LE SALON DU SITE (pour tout le monde) : chaque page dit au serveur qui est là (api/houma.php, action « site », toutes les 8 s).
   Toucher l'étiquette ouvre « Sur le site en ce moment » : qui est connecté, sur quelle page, et une discussion privée avec chacun.
   Un enfant n'a pas d'étiquette : une petite bulle apparaît (et le message est lu à voix haute) quand on lui écrit. */
(function(){
  'use strict';
  var PFX = 'explo:', SUPPR = '\u0000', VRAI = null;
  try{ VRAI = window.localStorage; }catch(e){}   // le vrai, pris avant de poser le bac à sable
  var ENFANTS = ['Essil', 'Salma', 'Amine'];
  var profil = null;
  try{ profil = JSON.parse(sessionStorage.getItem('famille-profil') || 'null'); }catch(e){}
  /* 20/11 : SESSIONS PAR PERSONNE (acces/session.php). Quand l'interrupteur est en marche, la porte donne à la page
     window.FAMILLE_QUI = {actif, nom, role, av, ctrl, v} : c'est le serveur qui dit qui est là, plus l'onglet.
     - un enfant dans sa session → profil « enfant » ; un parent, un invité → « explo » (bac à sable, rien ne compte pour les enfants) ;
     - Anis qui fait des essais (ctrl) → la session de l'enfant, en bac à sable (sauf s'il a demandé d'enregistrer pour de vrai) ;
     - personne : direction « Qui es-tu ? ». */
  var QUI = window.FAMILLE_QUI && window.FAMILLE_QUI.actif ? window.FAMILLE_QUI : null;
  if(QUI){
    var voulu = null, sess = window.sessionStorage;
    if(QUI.nom){ var enf = QUI.role === 'enfant' && (!QUI.ctrl || QUI.ctrl.ecrit);
      voulu = { nom:QUI.nom, type:enf ? 'enfant' : 'explo', av:QUI.av || '', ctrl:QUI.ctrl || null, v:QUI.v }; }
    if(!profil || !voulu || profil.v !== voulu.v || profil.nom !== voulu.nom || profil.type !== voulu.type) try{
      Object.keys(sess).forEach(function(k){ if(k.indexOf(PFX) === 0) sess.removeItem(k); });
      if(voulu){ sess.setItem('famille-profil', JSON.stringify(voulu));
        if(voulu.type === 'explo'){ sess.setItem(PFX + 'famille-joueur', JSON.stringify(voulu.nom));
          if(voulu.av){ var tt = {}; try{ tt = JSON.parse(VRAI.getItem('famille-tetes') || '{}') || {}; }catch(e){} tt[voulu.nom.toLowerCase()] = voulu.av; sess.setItem(PFX + 'famille-tetes', JSON.stringify(tt)); } }
        else if(VRAI) VRAI.setItem('famille-joueur', JSON.stringify(voulu.nom)); }
      else sess.removeItem('famille-profil');
    }catch(e){}
    profil = voulu;
    if(!QUI.nom && !/^\/(index\.html)?$/.test(location.pathname) && location.pathname.indexOf('/acces/') !== 0)
      location.replace('/?suite=' + encodeURIComponent(location.pathname + location.search));
  }
  var explo = !!(profil && profil.type === 'explo' && profil.nom);

  window.FamilleProfil = {
    actuel: function(){ return profil; },
    explorateur: function(){ return explo ? profil.nom : null; },
    // choisir un profil : on recharge la page pour que tout reparte du bon pied
    choisir: function(nom, type, av){
      try{
        Object.keys(sessionStorage).forEach(function(k){ if(k.indexOf(PFX) === 0) sessionStorage.removeItem(k); });
        sessionStorage.setItem('famille-profil', JSON.stringify({ nom:nom, type:type, av:av || '' }));
        if(type === 'explo'){ sessionStorage.setItem(PFX + 'famille-joueur', JSON.stringify(nom));
          if(av){ var t = {}; try{ t = JSON.parse(VRAI.getItem('famille-tetes') || '{}') || {}; }catch(e){} t[nom.toLowerCase()] = av; sessionStorage.setItem(PFX + 'famille-tetes', JSON.stringify(t)); } }
        else if(VRAI) VRAI.setItem('famille-joueur', JSON.stringify(nom));
      }catch(e){}
    },
    oublier: function(){ if(QUI) try{ var f = new FormData(); f.append('action', 'sortir'); navigator.sendBeacon('/api/qui.php', f); }catch(e){} try{ sessionStorage.removeItem('famille-profil'); Object.keys(sessionStorage).forEach(function(k){ if(k.indexOf(PFX) === 0) sessionStorage.removeItem(k); }); }catch(e){} document.cookie = 'famille_explo=; path=/; max-age=0; SameSite=Lax'; }
  };

  if(!explo) document.cookie = 'famille_explo=; path=/; max-age=0; SameSite=Lax';
  else document.cookie = 'famille_explo=' + encodeURIComponent(profil.nom) + '; path=/; SameSite=Lax';

  // 1. le bac à sable de localStorage (explorateur seulement)
  if(explo) try{
    var vrai = VRAI, ss = window.sessionStorage;
    var cles = function(){ var o = {}, i, k;
      for(i = 0; i < vrai.length; i++){ k = vrai.key(i); if(k !== null) o[k] = 1; }
      for(i = 0; i < ss.length; i++){ k = ss.key(i); if(k && k.indexOf(PFX) === 0){ if(ss.getItem(k) === SUPPR) delete o[k.slice(PFX.length)]; else o[k.slice(PFX.length)] = 1; } }
      return Object.keys(o); };
    var bac = {
      getItem: function(k){ k = String(k); var v = ss.getItem(PFX + k); if(v === SUPPR) return null; return v !== null ? v : vrai.getItem(k); },
      setItem: function(k, v){ try{ ss.setItem(PFX + String(k), String(v)); }catch(e){} },
      removeItem: function(k){ try{ ss.setItem(PFX + String(k), SUPPR); }catch(e){} },
      clear: function(){ cles().forEach(function(k){ bac.removeItem(k); }); },
      key: function(i){ var c = cles(); return i >= 0 && i < c.length ? c[i] : null; }
    };
    var proxy = new Proxy(bac, {
      get: function(t, p){ if(p === 'length') return cles().length; if(typeof p === 'symbol' || p in t) return t[p]; return t.getItem(p); },
      set: function(t, p, v){ t.setItem(p, v); return true; },
      deleteProperty: function(t, p){ t.removeItem(p); return true; },
      has: function(t, p){ return p in t || t.getItem(p) !== null; },
      ownKeys: function(){ return cles(); },
      getOwnPropertyDescriptor: function(t, p){ var v = t.getItem(p); return v === null ? undefined : { value:v, enumerable:true, configurable:true, writable:true }; }
    });
    Object.defineProperty(window, 'localStorage', { configurable:true, get:function(){ return proxy; } });
  }catch(e){}


  /* ---------- 21/11 : l'aide de chaque jeu + le badge « Jeu propulsé par Anis Missaoui » (jeux/aide.js) ---------- */
  if(/^\/(jeux\/[\w-]+|essil\/(les-ecuries|concours-vrai|concours-epreuves)|amine\/(serpentin|la-nuit-d-amine(-2)?))\.html$/.test(location.pathname)) (function(){
    var sc = document.createElement('script'); sc.src = '/jeux/aide.js?v=2'; sc.defer = true; (document.head || document.documentElement).appendChild(sc); })();

  /* ---------- 20/11 : le bandeau « Papa fait des essais » (prise de main d'Anis, ou « voir le site comme… ») ---------- */
  if(profil && profil.ctrl) (function(){
    var c = profil.ctrl, d = document.createElement('div'); d.id = 'famCtrl';
    var st = document.createElement('style');
    st.textContent = '#famCtrl{position:fixed;left:50%;top:max(6px,env(safe-area-inset-top));transform:translateX(-50%);z-index:2147483600;display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;' +
      'max-width:calc(100vw - 16px);box-sizing:border-box;background:#7c2d12;color:#fff;border-radius:16px;padding:7px 8px 7px 14px;font:800 15px/1.25 Nunito,system-ui,sans-serif;box-shadow:0 4px 0 #431407,0 8px 22px #0005}' +
      '#famCtrl small{font-weight:700;opacity:.9}#famCtrl button{min-height:40px;border:0;border-radius:12px;background:#fff;color:#7c2d12;font:inherit;padding:0 14px;cursor:pointer}';
    function texte(){ var m = Math.max(0, Math.ceil((c.fin * 1000 - Date.now()) / 60000));
      return '🔧 ' + (c.retour ? 'Tu vois le site comme ' : 'Papa fait des essais sur la session de ') + '<b></b> <small>· ' + (c.ecrit ? 'enregistré pour de vrai' : 'rien n\'est enregistré') + ' · fin dans ' + m + ' min</small>'; }
    function pose(){ if(!document.body){ setTimeout(pose, 50); return; }
      document.head.appendChild(st); d.innerHTML = texte() + '<button type="button">' + (c.retour ? 'Revenir à moi' : 'Rendre la tablette') + '</button>';
      d.querySelector('b').textContent = profil.nom; document.body.appendChild(d);
      d.querySelector('button').onclick = function(){ var f = new FormData(); f.append('action', 'rendre');
        fetch('/api/qui.php', { method:'POST', body:f }).then(function(){ location.href = c.retour ? '/' : location.href; }).catch(function(){ location.reload(); }); };
      setInterval(function(){ if(Date.now() > c.fin * 1000 + 2000){ location.reload(); return; } var b = d.querySelector('small'); if(b){ var t = document.createElement('div'); t.innerHTML = texte(); b.innerHTML = t.querySelector('small').innerHTML; } }, 20000); }
    pose();
  })();

  /* ---------- FamilleSon : UN seul lecteur de son pour les voix (19/11, tablettes) ----------
     Sur tablette (surtout iPad), chaque nouveau « new Audio() » lancé sans toucher l'écran peut être refusé, et des dizaines
     de lecteurs ouverts finissent par faire taire la tablette. Ici : un seul lecteur, « débloqué » au premier toucher,
     réutilisé pour toutes les voix (consignes, conteurs, récitation). Un son refusé fait apparaître « 🔊 Touche pour entendre ».
     FamilleSon.joue(url, {onStart, onTemps(ms), volume}) → true (fini), false (arrêté), null (impossible) ;
     stop(), pause(), reprend(), precharge(url) ; avantMicro() / apresMicro() autour de l'écoute au micro
     (iPad : le son repasse sur le haut-parleur, à plein volume, après le micro). */
  (function(){
    var SILENCE = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//NwwAAAAAAAAAAAAEluZm8AAAAPAAAACAAAA/oAR0dHR0dHR0dHR0dHYmJiYmJiYmJiYmJifHx8fHx8fHx8fHx8fJaWlpaWlpaWlpaWlrGxsbGxsbGxsbGxsbHLy8vLy8vLy8vLy8vl5eXl5eXl5eXl5eXl////////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQC1AAAAAAAAAP6yysejgAAAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';
    var el = document.createElement('audio'); el.preload = 'auto'; el.setAttribute('playsinline', ''); el.setAttribute('webkit-playsinline', '');
    var debloque = false, gen = 0, courant = null, bouton = null, enAttente = null, vus = {};
    function session(t){ try{ if(navigator.audioSession && navigator.audioSession.type !== t) navigator.audioSession.type = t; }catch(e){} }
    session('playback');
    function deverrouille(){
      if(courant){ if(el.paused && !enAttente) try{ el.play().catch(function(){}); }catch(e){} return; }   // une voix coupée par un appel reprend au toucher
      if(debloque) return;
      try{ el.src = SILENCE; var p = el.play(); if(p && p.then) p.then(function(){ debloque = true; }, function(){}); else debloque = true; }catch(e){}
    }
    ['touchend', 'click', 'keydown'].forEach(function(t){ document.addEventListener(t, deverrouille, true); });
    // 20/11 : après un appel FaceTime (ou Siri, une alarme), l'iPad reprend le son à la page sans le lui rendre : on redébloque au prochain toucher
    document.addEventListener('visibilitychange', function(){ if(!document.hidden){ debloque = false; session('playback'); } });
    window.addEventListener('pageshow', function(){ debloque = false; session('playback'); });
    function cacheBouton(){ if(bouton){ bouton.remove(); bouton = null; } enAttente = null; }
    function montreBouton(){   // le son a été refusé : un toucher le relance (c'est le toucher qui l'autorise)
      if(bouton) return; bouton = document.createElement('button'); bouton.type = 'button'; bouton.textContent = '🔊 Touche pour entendre';
      bouton.style.cssText = 'position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483646;font:800 20px Nunito,system-ui,sans-serif;padding:14px 24px;border:0;border-radius:30px;background:#0f766e;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.35)';
      bouton.onclick = function(){ var f = enAttente; cacheBouton(); debloque = true; if(f) f(); };
      (document.body || document.documentElement).appendChild(bouton);
    }
    function joue(url, o){
      o = o || {}; stop(); var g = ++gen;
      return new Promise(function(res){
        var fini = false, raf = 0, minu = 0, parti = false;
        var fin = function(r){ if(fini) return; fini = true; cancelAnimationFrame(raf); clearTimeout(minu); if(courant === fin) courant = null; if(enAttente) cacheBouton(); res(r); };
        courant = fin;
        var tic = function(){ if(fini || g !== gen) return; if(o.onTemps) try{ o.onTemps(el.currentTime * 1000); }catch(e){} raf = requestAnimationFrame(tic); };
        el.onended = function(){ if(g === gen) fin(true); };
        el.onerror = function(){ if(g === gen && el.src !== SILENCE) fin(null); };
        el.onplaying = function(){ if(g !== gen || parti) return; parti = true; clearTimeout(minu); if(o.onStart) try{ o.onStart(); }catch(e){} };
        var lance = function(){
          if(fini || g !== gen) return;
          var p; try{ p = el.play(); }catch(e){ return fin(null); }
          if(p && p.then) p.then(function(){ if(g === gen && !fini){ debloque = true; raf = requestAnimationFrame(tic); } }, function(err){
            if(g !== gen || fini) return;
            if(err && err.name === 'NotAllowedError'){ enAttente = lance; montreBouton(); }   // on attend le toucher, sans passer à la suite
            else if(err && err.name === 'AbortError'){ /* src changé : rien */ }
            else fin(null); });
          else raf = requestAnimationFrame(tic);
          minu = setTimeout(function(){ if(!parti && !enAttente && g === gen) fin(null); }, o.attente || 20000);
        };
        try{ el.pause(); }catch(e){}
        el.volume = o.volume == null ? 1 : Math.max(0, Math.min(1, +o.volume));
        el.src = url; vus[url] = 1;
        lance();
      });
    }
    function stop(){ gen++; cacheBouton(); try{ el.pause(); }catch(e){} var c = courant; courant = null; if(c) c(false); }
    function precharge(url){   // prépare le son suivant pendant que celui-ci joue (la voix arrive tout de suite, en phase avec le texte)
      if(!url || vus[url]) return; vus[url] = 1;
      try{ var meme = url.charAt(0) === '/' || url.indexOf(location.origin) === 0; fetch(url, meme ? { credentials:'same-origin' } : { mode:'no-cors' }).catch(function(){}); }catch(e){}
    }
    window.FamilleSon = {
      joue: joue, stop: stop, precharge: precharge,
      pause: function(){ try{ el.pause(); }catch(e){} },
      reprend: function(){ if(courant) try{ el.play().catch(function(){}); }catch(e){} },
      enCours: function(){ return !!courant; },
      avantMicro: function(){ stop(); session('play-and-record'); },
      apresMicro: function(){ session('playback'); return new Promise(function(r){ setTimeout(r, 450); }); },
      element: el
    };
  })();

  /* ---------- les moteurs audio des pages (Web Audio) après une interruption (20/11) ----------
     Sur iPad, un appel FaceTime met chaque AudioContext en « interrupted » ou « suspended », et il ne repart pas tout seul :
     la page reste muette jusqu'au rechargement. On garde la liste des moteurs créés par la page et on les relance
     au retour sur la page et au premier toucher (c'est le toucher qui l'autorise). Vaut pour tous les jeux et cours du site. */
  (function(){
    var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; var tous = [];
    function Moteur(o){ var c = o ? new AC(o) : new AC(); tous.push(c); return c; }
    Moteur.prototype = AC.prototype;
    try{ window.AudioContext = Moteur; if(window.webkitAudioContext) window.webkitAudioContext = Moteur; }catch(e){ return; }
    function reveille(){ tous = tous.filter(function(c){ return c.state !== 'closed'; });
      tous.forEach(function(c){ if(c.state !== 'running') try{ c.resume().catch(function(){}); }catch(e){} }); }
    ['touchend', 'click', 'keydown'].forEach(function(t){ document.addEventListener(t, reveille, true); });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) reveille(); });
    window.addEventListener('pageshow', reveille); window.addEventListener('focus', reveille);
  })();

  /* ---------- la voix des consignes (16/11, demandé par le papa) ----------
     Toutes les pages qui parlent avec la voix de la tablette (speechSynthesis) parlent désormais avec les voix ElevenLabs
     du site (api/voix.php, la clé API du papa ; chaque phrase n'est fabriquée qu'une fois puis gardée sur le serveur) :
     Céline en français, Alice en anglais, Toni en allemand, Mohammad en arabe (17/11) ; pour Amine (ou dans son espace), la voix « dessin animé » de Lulu.
     Si le serveur ne répond pas : la voix de la tablette, comme avant.
     On coupe ou remet les consignes orales avec la touche V (P sert déjà de pause dans les jeux), le bouton 🗣️ de l'étiquette
     « Explorateur », ou FamilleVoix.basculer() depuis une page (ex. le menu du Jasmin · Stage 2). Réglage gardé sur l'appareil. */
  (function(){
    var NAT = window.speechSynthesis || null, natSpeak = NAT ? NAT.speak.bind(NAT) : null, natCancel = NAT ? NAT.cancel.bind(NAT) : null;
    var off = false; try{ off = VRAI && VRAI.getItem('famille-voix') === 'off'; }catch(e){}
    var file = [], cur = null, jeton = 0, ecoute = [];
    if(!window.SpeechSynthesisUtterance){   // tablette sans voix : une phrase toute simple qui sait dire « fini »
      window.SpeechSynthesisUtterance = function(t){ var et = document.createElement('span'); et.text = t || ''; et.lang = 'fr-FR'; et.rate = 1; et.volume = 1; return et; };
    }
    function fire(u, type){ try{ u.dispatchEvent(new Event(type)); }catch(e){} }
    function pourAmine(){ var m = ''; try{ m = moi(); }catch(e){} return m === 'Amine' || (m !== 'Anis' && m !== 'Imen' && /^\/amine\//.test(location.pathname)); }
    function morceaux(t){ var out = [], c = ''; String(t).split(/(?<=[.!?;:])\s+/).forEach(function(p){ while(p.length > 330){ out.push(p.slice(0, 330)); p = p.slice(330); } if((c + ' ' + p).trim().length > 330){ if(c) out.push(c.trim()); c = p; } else c = (c + ' ' + p).trim(); }); if(c.trim()) out.push(c.trim()); return out; }
    function nettoie(t){ return String(t || '').replace(/<[^>]+>/g, ' ').replace(/[\u{1F000}-\u{1FAFF}☀-➿️◀▶▲▼←→↑↓]/gu, ' ').replace(/\s+/g, ' ').trim(); }
    function adresses(it){ var l = it.l, a = pourAmine() && l === 'fr' ? '&p=amine' : '';
      return morceaux(it.t).map(function(m){ return '/api/voix.php?l=' + l + '&t=' + encodeURIComponent(m) + a; }); }
    function suivant(){ cur = file.shift() || null; if(!cur) return; var it = cur, j = jeton, i = 0, urls = it.urls;
      if(file[0]) FamilleSon.precharge(file[0].urls[0]);
      var secours = function(){ if(j !== jeton) return;   // le serveur n'a pas pu : la voix de la tablette
        if(natSpeak){ it.u.addEventListener('end', function(){ if(j === jeton && cur === it) suivant(); }, { once:true }); it.u.addEventListener('error', function(){ if(j === jeton && cur === it) suivant(); }, { once:true }); try{ natSpeak(it.u); }catch(e){ suivant(); } }
        else { suivant(); fire(it.u, 'end'); } };
      var un = function(){ if(j !== jeton) return; if(i >= urls.length){ suivant(); fire(it.u, 'end'); return; }
        var k = i++; if(urls[k + 1]) FamilleSon.precharge(urls[k + 1]);
        FamilleSon.joue(urls[k], { volume:it.u.volume == null ? 1 : +it.u.volume, onStart:k === 0 ? function(){ fire(it.u, 'start'); } : null }).then(function(r){
          if(j !== jeton) return;
          if(r === true) un(); else if(r === false){ if(cur === it){ cur = null; fire(it.u, 'end'); } } else if(k === 0) secours(); else un(); }); };
      un(); }
    var api = {
      speak: function(u){ if(!u) return; var t = nettoie(u.text), l = String(u.lang || 'fr').slice(0, 2).toLowerCase();
        if(off || !t){ setTimeout(function(){ fire(u, 'end'); }, 0); return; }
        if(['fr', 'en', 'de', 'ar'].indexOf(l) < 0){ if(natSpeak) natSpeak(u); else setTimeout(function(){ fire(u, 'end'); }, 0); return; }   // l'arabe, la derja… : la tablette
        var it = { u:u, t:t, l:l }; it.urls = adresses(it); file.push(it); if(!cur) suivant(); },
      cancel: function(){ jeton++; if(cur) FamilleSon.stop(); file = []; cur = null; if(natCancel) try{ natCancel(); }catch(e){} },
      pause: function(){ if(cur) FamilleSon.pause(); if(NAT) try{ NAT.pause(); }catch(e){} },
      resume: function(){ if(cur) FamilleSon.reprend(); if(NAT) try{ NAT.resume(); }catch(e){} },
      getVoices: function(){ return NAT ? NAT.getVoices() : []; }
    };
    if(NAT){ ['speak', 'cancel', 'pause', 'resume'].forEach(function(k){ try{ NAT[k] = api[k]; }catch(e){} });
      try{ Object.defineProperty(NAT, 'speaking', { configurable:true, get:function(){ return !!cur; } }); Object.defineProperty(NAT, 'pending', { configurable:true, get:function(){ return file.length > 0; } }); }catch(e){} }
    else { try{ window.speechSynthesis = { speak:api.speak, cancel:api.cancel, pause:api.pause, resume:api.resume, getVoices:api.getVoices, get speaking(){ return !!cur; }, get pending(){ return file.length > 0; }, addEventListener:function(){}, onvoiceschanged:null }; }catch(e){} }

    function bulleVoix(){ var d = document.getElementById('famVoixBulle'); if(d) d.remove(); d = document.createElement('div'); d.id = 'famVoixBulle';
      d.textContent = off ? '🔇 Consignes orales coupées · touche V pour les remettre' : '🗣️ Consignes orales remises · touche V pour les couper';
      d.style.cssText = 'position:fixed;z-index:2147483003;left:50%;top:14px;transform:translateX(-50%);background:#18202e;color:#fff;border-radius:999px;padding:10px 18px;font:800 15px Nunito,system-ui,sans-serif;box-shadow:0 8px 24px #0005;pointer-events:none;max-width:calc(100vw - 24px);text-align:center';
      (document.body || document.documentElement).appendChild(d); setTimeout(function(){ d.remove(); }, 2600); }
    window.FamilleVoix = {
      on: function(){ return !off; },
      regler: function(oui){ off = !oui; try{ VRAI && VRAI.setItem('famille-voix', off ? 'off' : 'on'); }catch(e){} if(off) api.cancel(); ecoute.forEach(function(f){ try{ f(!off); }catch(e){} }); },
      basculer: function(){ this.regler(off); bulleVoix(); return !off; },
      change: function(f){ ecoute.push(f); }
    };
    addEventListener('keydown', function(e){ if(e.code !== 'KeyV' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; var t = e.target;
      if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return; FamilleVoix.basculer(); }, true);
  })();

  /* ---------- le salon du site ---------- */
  var API = '/api/houma.php', FAMILLE = ['anis', 'imen', 'essil', 'salma', 'amine'];
  var cap = function(s){ s = String(s || '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; };
  function moi(){ if(profil && profil.nom) return cap(profil.nom); if(QUI) return '';   /* 20/11 : personne n'est entré : pas de salon */ try{ return cap(JSON.parse(VRAI.getItem('famille-joueur') || 'null')); }catch(e){ return ''; } }
  function sansAccent(s){ return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function tete(nom, av){ var k = sansAccent(nom); if(FAMILLE.indexOf(k) >= 0) return '/jeux/avatars/' + k + '.webp';
    if(/^f-(essil|salma|amine|anis|imen)$/.test(av || '')) return '/jeux/avatars/' + av.slice(2) + '.webp';
    if(['nour', 'yasmine', 'fares'].indexOf(av) >= 0) return '/jeux/avatars/mascotte-' + av + '.webp';
    if(['nour', 'yasmine', 'fares'].indexOf(k) >= 0) return '/jeux/avatars/mascotte-' + k + '.webp';
    var h = 0; for(var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0; return '/jeux/avatars/mascotte-' + ['nour', 'yasmine', 'fares'][h % 3] + '.webp'; }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function lit(t){ try{ if(!explo && 'speechSynthesis' in window){ var u = new SpeechSynthesisUtterance(t); u.lang = 'fr-FR'; speechSynthesis.speak(u); } }catch(e){} }
  /* 18/11 (demande du papa) : les messages du salon sont lus avec la voix ElevenLabs DE CELUI QUI ÉCRIT
     (Anis = Jon, Imen = Céline, Amine = Lulu, Essil et Salma = leur voix, voir api/voix.php VX_AUTRES ; les invités = Céline),
     et les messages vocaux (🎤, surtout pour Amine qui n'écrit pas encore) se réécoutent d'un toucher. */
  var VOIX_DE = { anis:'anis', imen:'imen', amine:'amine', essil:'essil', salma:'salma' }, sonSalon = null;
  function stopSon(){ if(sonSalon){ try{ sonSalon.pause(); }catch(e){} sonSalon = null; } try{ speechSynthesis.cancel(); }catch(e){} }
  function joueListe(urls, i){ i = i || 0; if(i >= urls.length){ sonSalon = null; return; } var a = sonSalon = new Audio(urls[i]);
    a.onended = function(){ if(sonSalon === a) joueListe(urls, i + 1); }; a.onerror = function(){ if(sonSalon === a) joueListe(urls, i + 1); }; a.play().catch(function(){}); }
  function urlVoix(t, nom){ var v = VOIX_DE[sansAccent(nom || '')] || ''; return '/api/voix.php?l=fr&t=' + encodeURIComponent(String(t).slice(0, 380)) + (v ? '&v=' + v : ''); }
  function litMessage(x, annonce){ return; if(!FamilleVoix.on()) return; stopSon(); var u = [];
    if(annonce) u.push('/api/voix.php?l=fr&t=' + encodeURIComponent((x.type === 'v' ? 'Message vocal de ' : 'Message de ') + x.nom) + (moi() === 'Amine' ? '&p=amine' : ''));
    if(x.type === 'v') u.push(API + '?son=' + x.id); else { var t = String(x.texte || '').replace(/[\u{1F000}-\u{1FAFF}☀-➿️]/gu, ' ').trim(); if(t) u.push(urlVoix(t, x.nom)); }
    if(u.length) joueListe(u); }
  var sget = function(k, d){ try{ var v = sessionStorage.getItem(k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } };
  var sset = function(k, v){ try{ sessionStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  // ce qui a été lu est gardé dans le vrai localStorage de l'appareil (avant : sessionStorage, oublié à chaque visite → la pastille revenait)
  var luGet = function(m){ try{ var v = VRAI && VRAI.getItem('salon-lu:' + m); return v ? JSON.parse(v) || {} : null; }catch(e){ return {}; } };
  var luSet = function(m, o){ try{ VRAI && VRAI.setItem('salon-lu:' + m, JSON.stringify(o)); }catch(e){} };
  var client = sget('salon-client', ''); if(!/^[0-9a-z]{8,40}$/.test(client)){ client = Math.random().toString(36).slice(2) + Date.now().toString(36); sset('salon-client', client); }
  var S = { enLigne:[], msgs:[], vue:null, avec:null, pret:false, stop:false };

  function css(){ var st = document.createElement('style'); st.textContent =
    '#famExplo{position:fixed;left:12px;bottom:12px;z-index:2147483000;display:flex;align-items:center;gap:8px;background:#0f766e;color:#fff;border-radius:999px;padding:5px 14px 5px 5px;box-shadow:0 3px 0 #0b5a54,0 6px 18px #0003;font:800 15px/1.1 Nunito,system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab;min-height:48px;box-sizing:border-box}' +
    '#famExplo.enfant{padding:5px;background:#2563eb;box-shadow:0 3px 0 #1d4ed8,0 6px 18px #0003}#famExplo.cache{display:none}' +
    '#famExplo img{width:38px;height:38px;border-radius:50%;object-fit:cover;background:#d7f1ee;border:2px solid #fff;pointer-events:none}#famExplo .t{display:flex;flex-direction:column;pointer-events:none}#famExplo small{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#bfeee8}' +
    '#famExplo .porte{display:grid;place-items:center;width:40px;height:40px;margin:0 -8px 0 4px;border-radius:50%;background:#ffffff26;font-size:20px;cursor:pointer}#famExplo .porte:hover{background:#ffffff40}#famExplo .n{position:absolute;top:-6px;left:28px;min-width:22px;height:22px;border-radius:11px;background:#d7263d;color:#fff;font-size:13px;display:none;place-items:center;padding:0 5px;box-sizing:border-box}#famExplo .n.on{display:grid}' +
    '#famExplo.replie{padding:5px}#famExplo.replie .t,#famExplo.replie .v,#famExplo.replie .porte{display:none}' +
    '#famExplo .v{font-size:12px;background:#ffffff2e;border-radius:999px;padding:2px 8px;pointer-events:none}' +
    '#famSalon{position:fixed;z-index:2147483001;width:min(380px,calc(100vw - 16px));max-height:min(70vh,560px);display:none;flex-direction:column;background:#fff;color:#18202e;border-radius:22px;box-shadow:0 18px 50px #0005;font:600 16px/1.35 Nunito,system-ui,sans-serif;overflow:hidden}#famSalon.on{display:flex}' +
    '#famSalon header{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#0f766e;color:#fff}#famSalon header b{flex:1;font-size:17px}#famSalon header button{all:unset;cursor:pointer;min-width:40px;min-height:40px;display:grid;place-items:center;border-radius:12px;font-size:20px}#famSalon header img{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #fff;background:#fff}' +
    '#famSalon .corps{overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px;flex:1}#famSalon .vide{color:#5b667a;text-align:center;padding:16px 8px}' +
    '#famSalon .qui{display:flex;align-items:center;gap:10px;background:#f1f5f9;border-radius:16px;padding:8px}#famSalon .qui img{width:46px;height:46px;border-radius:50%;object-fit:cover;flex:none}#famSalon .qui span{flex:1;min-width:0}#famSalon .qui small{display:block;color:#5b667a;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#famSalon .qui button,#famSalon .pied a,#famSalon .pied button,#famSalon form button{min-height:44px;border:0;border-radius:14px;background:#0f766e;color:#fff;font:800 15px Nunito,system-ui,sans-serif;padding:0 12px;cursor:pointer;text-decoration:none;display:inline-grid;place-items:center;position:relative}' +
    '#famSalon .qui i{position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;border-radius:10px;background:#d7263d;color:#fff;font-style:normal;font-size:12px;display:grid;place-items:center}' +
    '#famSalon .pied{display:flex;gap:8px;justify-content:space-between;padding:10px;border-top:1px solid #e2e8f0}#famSalon .pied .g{background:#e2e8f0;color:#18202e}' +
    '#famSalon .m{max-width:82%;padding:7px 11px;border-radius:16px;background:#f1f5f9;align-self:flex-start;word-break:break-word}#famSalon .m.moi{align-self:flex-end;background:#d1fae5}#famSalon .m small{display:block;font-size:11px;color:#64748b}' +
    '#famSalon .emo{display:flex;gap:4px;flex-wrap:wrap;padding:6px 10px 0}#famSalon .emo button{all:unset;cursor:pointer;font-size:22px;min-width:40px;min-height:40px;display:grid;place-items:center;border-radius:10px;background:#f1f5f9}' +
    '#famSalon .m .hp{all:unset;cursor:pointer;font-size:15px;padding:0 4px;opacity:.75}#famSalon .m .vo{all:unset;cursor:pointer;font-weight:800;padding:6px 4px;display:inline-block}' +
    '#famSalon form .mic{min-width:52px;background:#ff8c1a;font-size:22px;padding:0 8px}#famSalon form .mic.on{background:#d7263d;font-size:15px;animation:famMic 1s infinite}@keyframes famMic{50%{box-shadow:0 0 0 6px #d7263d44}}' +
    '#famSalon .av{position:relative;flex:none}#famSalon .av u{position:absolute;right:0;bottom:0;width:13px;height:13px;border-radius:50%;background:#94a3b8;border:2px solid #fff}#famSalon .av u.on{background:#22c55e}#famSalon .qui.fam{background:#fff3d6}' +
    '#famSalon .emo.ph button{font:800 13px Nunito,system-ui,sans-serif;padding:0 10px;background:#e0f2fe}' +
    '#famSalon form{display:flex;gap:6px;padding:10px}#famSalon input{flex:1;min-width:0;height:46px;border:2px solid #cbd5e1;border-radius:14px;padding:0 12px;font:600 16px Nunito,system-ui,sans-serif}' +
    '#famBulle{position:fixed;z-index:2147483002;left:12px;max-width:min(380px,calc(100vw - 24px));display:flex;align-items:center;gap:10px;background:#fff;color:#18202e;border-radius:18px;padding:8px 10px;box-shadow:0 10px 30px #0004,0 0 0 3px #ffd23f;font:800 15px/1.25 Nunito,system-ui,sans-serif}#famBulle img{width:42px;height:42px;border-radius:50%;object-fit:cover;flex:none}#famBulle span{flex:1}#famBulle button{min-height:42px;border:0;border-radius:12px;background:#0f766e;color:#fff;font:800 14px Nunito,system-ui,sans-serif;padding:0 10px;cursor:pointer}#famBulle .x{background:#e2e8f0;color:#18202e}' +
    '@media (prefers-color-scheme:dark){#famSalon,#famBulle{background:#1a2130;color:#eef1f6}#famSalon .qui,#famSalon .m,#famSalon .emo button{background:#232c3d}#famSalon .m.moi{background:#14463f}#famSalon input{background:#10141c;color:#eef1f6;border-color:#2a3447}#famSalon .pied .g,#famBulle .x{background:#2a3447;color:#eef1f6}#famSalon .qui small,#famSalon .vide{color:#a3aec2}}';
    document.head.appendChild(st); }

  var B, P;   // l'étiquette et le panneau
  function place(){   // le panneau s'ouvre au-dessus (ou au-dessous) de l'étiquette, sans sortir de l'écran
    var r = B.getBoundingClientRect(), w = P.offsetWidth || 380, x = Math.max(8, Math.min(innerWidth - w - 8, r.left));
    P.style.left = x + 'px';
    if(r.top > innerHeight / 2){ P.style.top = ''; P.style.bottom = (innerHeight - r.top + 8) + 'px'; } else { P.style.bottom = ''; P.style.top = (r.bottom + 8) + 'px'; }
  }
  function construit(){
    css();
    B = document.createElement('div'); B.id = 'famExplo'; B.setAttribute('role', 'button'); B.tabIndex = 0;
    B.setAttribute('aria-label', explo ? 'Explorateur du site : ' + moi() + '. Toucher pour voir qui est sur le site et discuter.' : 'Les messages');
    B.innerHTML = '<img alt="" src="' + tete(moi(), profil && profil.av) + '">' + (explo ? '<span class="t"><small>Explorateur du site</small><span></span></span><span class="v" title="sur le site en ce moment"></span><span class="porte" title="Sortir : revenir à « Qui es-tu ? »" aria-label="Sortir">🚪</span>' : '') + '<span class="n"></span>';
    if(explo) B.querySelector('.t span').textContent = moi(); else { B.classList.add('enfant'); }   // 20/11 : toujours visible pour les enfants (avant : seulement après un message reçu)
    B.classList.add('replie');   // 17/11 (demande du papa) : repliée = juste l'avatar ; on la touche, elle se déplie (nom, 🚪) et le salon s'ouvre
    var pos = sget('salon-pos', null);
    if(pos){ B.style.left = pos.l + 'px'; B.style.bottom = pos.b + 'px'; }
    P = document.createElement('div'); P.id = 'famSalon'; P.setAttribute('role', 'dialog'); P.setAttribute('aria-label', 'Sur le site en ce moment');
    document.body.appendChild(B); document.body.appendChild(P);
    // déplacer l'étiquette (glisser) ou l'ouvrir (toucher)
    var d = null;
    B.addEventListener('pointerdown', function(e){ d = { x:e.clientX, y:e.clientY, l:B.getBoundingClientRect().left, b:innerHeight - B.getBoundingClientRect().bottom, bouge:false }; try{ B.setPointerCapture(e.pointerId); }catch(_){} });
    B.addEventListener('pointermove', function(e){ if(!d) return; var dx = e.clientX - d.x, dy = e.clientY - d.y; if(!d.bouge && Math.hypot(dx, dy) < 8) return; d.bouge = true;
      var l = Math.max(4, Math.min(innerWidth - B.offsetWidth - 4, d.l + dx)), b = Math.max(4, Math.min(innerHeight - B.offsetHeight - 4, d.b - dy));
      B.style.left = l + 'px'; B.style.bottom = b + 'px'; if(P.classList.contains('on')) place(); });
    B.addEventListener('pointerup', function(e){ if(!d) return; if(d.bouge) sset('salon-pos', { l:parseFloat(B.style.left), b:parseFloat(B.style.bottom) }); else if(!B.classList.contains('replie') && (e.target.closest && e.target.closest('.porte') || porteVisee(e))) sortir(); else bascule(); d = null; });
    B.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); bascule(); } });
    P.addEventListener('click', clicPanneau);
    P.addEventListener('submit', function(e){ e.preventDefault(); var i = P.querySelector('input'); envoie(i.value); });
    salut(); setInterval(function(){ if(!P.classList.contains('on')) salut(); }, 8000); setInterval(function(){ if(P.classList.contains('on')) salut(); }, 3000);   // 20/11 : toutes les 3 s quand le panneau est ouvert
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) salut(); });
  }
  function porteVisee(e){ var p = B.querySelector('.porte'); if(!p) return false; var r = p.getBoundingClientRect(); return e.clientX >= r.left - 4 && e.clientX <= r.right + 4 && e.clientY >= r.top - 4 && e.clientY <= r.bottom + 4; }
  function sortir(){ location.href = '/?profil'; }   // l'accueil oublie le profil et montre « Qui es-tu ? »
  function replie(){ P.classList.remove('on'); B.classList.add('replie'); }
  function bascule(){ if(!B.classList.contains('replie')){ replie(); return; } B.classList.remove('replie'); S.vue = S.avec ? 'conv' : 'liste'; dessine(); P.classList.add('on'); place(); }
  function autres(){ var m = moi(); return S.enLigne.filter(function(p){ return p.nom !== m; }); }
  var FAMN = ['Anis', 'Imen', 'Essil', 'Salma', 'Amine'], NOMS = { Anis:'Papa', Imen:'Maman' };
  var deFamille = function(){ return FAMN.indexOf(moi()) >= 0; };
  var conv = function(a, m){ return a === 'Famille' ? S.msgs.filter(function(x){ return x.a === 'Famille'; }) : S.msgs.filter(function(x){ return (x.nom === a && x.a === m) || (x.nom === m && x.a === a); }); };
  // 20/11 : un petit « ding » quand un message arrive (sons du navigateur) ; 21/11 (demande du papa) : jamais pour les enfants, qui ne doivent pas être dérangés pendant un cours
  var ding = function(){ try{ var C = window.AudioContext || window.webkitAudioContext, a = ding.c = ding.c || new C(), t = a.currentTime; [880, 1320].forEach(function(f, i){ var o = a.createOscillator(), g = a.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.12, t + i * .12); g.gain.exponentialRampToValueAtTime(.001, t + i * .12 + .25); o.connect(g).connect(a.destination); o.start(t + i * .12); o.stop(t + i * .12 + .3); }); }catch(e){} };
  function nonLus(nom){ var lu = luGet(moi()) || {}, m = moi(); if(nom === 'Famille') return S.msgs.filter(function(x){ return x.a === 'Famille' && x.nom !== m && x.id > (lu.Famille || 0); }).length; return S.msgs.filter(function(x){ return x.nom === nom && x.a === m && x.id > (lu[nom] || 0); }).length; }
  function badges(){
    if(!B) return; var n = 0, m = moi(), lu = luGet(m) || {}; S.msgs.forEach(function(x){ if((x.a === m && x.id > (lu[x.nom] || 0)) || (x.a === 'Famille' && x.nom !== m && x.id > (lu.Famille || 0))) n++; });
    var e = B.querySelector('.n'); e.textContent = n > 9 ? '9+' : n; e.classList.toggle('on', n > 0);
    var v = B.querySelector('.v'); if(v){ var k = autres().length; v.textContent = k ? '👥 ' + k : ''; v.style.display = k ? '' : 'none'; }
    if(!explo && (n > 0 || S.msgs.length)) B.classList.remove('cache');
  }
  function dessine(){
    var m = moi();
    if(S.vue === 'conv' && S.avec){
      var a = S.avec, p = S.enLigne.filter(function(x){ return x.nom === a; })[0];
      var L = conv(a, m);
      P.innerHTML = '<header><button type="button" data-r aria-label="Retour">←</button>' + (a === 'Famille' ? '<span style="font-size:28px">👨‍👩‍👧‍👦</span><b>Toute la famille</b>' : '<img alt="" src="' + tete(a, p && p.av) + '"><b>' + esc(NOMS[a] || a) + (p ? ' <small style="font-weight:600;opacity:.8">● en ligne</small>' : ' <small style="font-weight:600;opacity:.8">(lira plus tard)</small>') + '</b>') + '<button type="button" data-f aria-label="Fermer">✕</button></header>' +
        '<div class="corps">' + (L.length ? L.map(function(x){ var d = new Date(x.ts * 1000); return '<div class="m' + (x.nom === m ? ' moi' : '') + '"><small>' + esc(x.nom) + ' · ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0') + '</small>' + (x.type === 'v' ? '<i>🎤 ancien message vocal</i>' : esc(x.texte)) + '</div>'; }).join('') : '<p class="vide">' + (a === 'Famille' ? 'Ici, tout le monde lit tout le monde : papa, maman, Essil, Salma et Amine 👋' : 'Écris le premier message à ' + esc(NOMS[a] || a) + ' 👋') + '</p>') + '</div>' +
        '<div class="emo">' + ['👋', '😀', '😂', '❤️', '👍', '🎉', '⭐', '🏠'].map(function(e){ return '<button type="button" data-e="' + e + '">' + e + '</button>'; }).join('') + '</div>' +
        '<div class="emo ph">' + ['Je t\'aime ❤️', 'Viens jouer avec moi ! 🎮', 'Bravo ! 👏', 'J\'ai fini mes devoirs ✅', 'Tu me manques 🥰', 'J\'arrive ! 🏃'].map(function(e){ return '<button type="button" data-e="' + esc(e) + '">' + esc(e) + '</button>'; }).join('') + '</div>' +
        '<form>' + (REC ? '<button type="button" class="mic' + (S.rec ? ' on' : '') + '" data-mic aria-label="Message vocal">' + (S.rec ? '⏹ ' + S.rec.s + ' s' : '🎤') + '</button>' : '') + '<input maxlength="300" placeholder="' + ('Ton message à ' + (a === 'Famille' ? 'toute la famille' : esc(NOMS[a] || a)) + '…') + '" autocomplete="off" enterkeyhint="send"><button type="submit">Envoyer</button></form>';
      var c = P.querySelector('.corps'); c.scrollTop = c.scrollHeight;
      var lu = luGet(m) || {}; L.forEach(function(x){ if(x.nom !== m) lu[a] = Math.max(lu[a] || 0, x.id); }); luSet(m, lu); badges();
      return;
    }
    var O = autres(), deja = {}; O.forEach(function(p){ deja[p.nom] = 1; });
    var anciens = []; S.msgs.forEach(function(x){ var q = x.nom === m ? x.a : x.nom; if(q && !deja[q] && anciens.indexOf(q) < 0) anciens.push(q); });
    var enL = {}; S.enLigne.forEach(function(p){ enL[p.nom] = p; });
    var ligne = function(nom, sous, bt){ var n = nonLus(nom), p = enL[nom]; return '<div class="qui"><span class="av"><img alt="" src="' + tete(nom, p && p.av) + '"><u class="' + (p ? 'on' : '') + '"></u></span><span><b>' + esc(NOMS[nom] || nom) + '</b><small>' + sous + '</small></span><button type="button" data-a="' + esc(nom) + '">' + bt + (n ? '<i>' + n + '</i>' : '') + '</button></div>'; };
    var famille = deFamille() ? '<div class="qui fam"><span style="font-size:34px;width:46px;text-align:center">👨‍👩‍👧‍👦</span><span><b>Toute la famille</b><small>un message pour tout le monde</small></span><button type="button" data-a="Famille">💬 Écrire' + (nonLus('Famille') ? '<i>' + nonLus('Famille') + '</i>' : '') + '</button></div>' +
      FAMN.filter(function(f){ return f !== m; }).map(function(f){ var p = enL[f]; return ligne(f, p ? '● en ligne' + (p.page ? ' · sur ' + esc(p.page) : '') : 'pas là : lira plus tard', '💬 Écrire'); }).join('') : '';
    O = O.filter(function(p){ return !deFamille() || FAMN.indexOf(p.nom) < 0; }); anciens = anciens.filter(function(q){ return q !== 'Famille' && (!deFamille() || FAMN.indexOf(q) < 0); });
    P.innerHTML = '<header><b>' + (deFamille() ? '💬 Les messages' : 'Sur le site en ce moment') + '</b><button type="button" data-f aria-label="Fermer">✕</button></header><div class="corps">' + famille +
      (O.length ? O.map(function(p){ var n = nonLus(p.nom); return '<div class="qui"><img alt="" src="' + tete(p.nom, p.av) + '"><span><b>' + esc(p.nom) + '</b><small>' + (p.page ? 'sur ' + esc(p.page) : 'sur le site') + '</small></span><button type="button" data-a="' + esc(p.nom) + '">💬 Écrire' + (n ? '<i>' + n + '</i>' : '') + '</button></div>'; }).join('')
        : (famille ? '' : '<p class="vide">Personne d\'autre n\'est sur le site pour l\'instant.</p>')) +
      (anciens.length ? '<p class="vide" style="padding:6px 0 0;text-align:left">Discussions de tout à l\'heure</p>' + anciens.map(function(q){ var n = nonLus(q); return '<div class="qui"><img alt="" src="' + tete(q) + '"><span><b>' + esc(q) + '</b><small>n\'est plus là</small></span><button type="button" data-a="' + esc(q) + '">💬 Relire' + (n ? '<i>' + n + '</i>' : '') + '</button></div>'; }).join('') : '') +
      '</div><div class="pied">' + (explo ? '<a href="/?profil">⇄ Changer d\'avatar</a>' : '<span></span>') + (explo ? '<button type="button" class="g" data-voix title="Touche V">' + (FamilleVoix.on() ? '🗣️ Consignes' : '🔇 Consignes') + '</button>' : '') + '<button type="button" class="g" data-f>Fermer</button></div>';
  }
  function clicPanneau(e){ var t = e.target.closest('button,a'); if(!t) return;
    if(t.hasAttribute('data-voix')){ FamilleVoix.basculer(); t.textContent = FamilleVoix.on() ? '🗣️ Consignes' : '🔇 Consignes'; return; }
    if(t.hasAttribute('data-f')){ replie(); return; }
    if(t.hasAttribute('data-r')){ S.avec = null; S.vue = 'liste'; dessine(); place(); return; }
    if(t.dataset.a){ S.avec = t.dataset.a; S.vue = 'conv'; dessine(); place(); var i = P.querySelector('input'); if(i && !('ontouchstart' in window)) i.focus(); return; }
    if(t.dataset.e) envoie(t.dataset.e);
    if(t.dataset.ecoute){ var x = S.msgs.filter(function(y){ return y.id === +t.dataset.ecoute; })[0]; if(x){ if(x.type === 'v' && !FamilleVoix.on()){ stopSon(); joueListe([API + '?son=' + x.id]); } else litMessage(x, false); } return; }
    if(t.hasAttribute('data-mic')){ if(S.rec) finEnregistre(true); else enregistre(); return; }
  }
  // 🎤 le message vocal : on touche le micro, on parle (30 s au plus), on touche ⏹ : il part tout seul
  // 20/11 (soir, décision du papa) : plus de messages vocaux ni de lecture à voix haute dans le salon : du texte et des émojis seulement
  var REC = false;
  function majMic(){ var b = P.querySelector('[data-mic]'); if(b){ b.classList.toggle('on', !!S.rec); b.textContent = S.rec ? '⏹ ' + S.rec.s + ' s' : '🎤'; } }
  function enregistre(){ stopSon();
    navigator.mediaDevices.getUserMedia({ audio:true }).then(function(flux){
      var types = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'], ty = types.filter(function(x){ return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(x); })[0] || '';
      var mr = new MediaRecorder(flux, ty ? { mimeType:ty } : undefined), bouts = [], r = S.rec = { mr:mr, flux:flux, s:0, t0:Date.now(), envoie:false };
      mr.ondataavailable = function(e){ if(e.data && e.data.size) bouts.push(e.data); };
      mr.onstop = function(){ flux.getTracks().forEach(function(k){ k.stop(); }); clearInterval(r.tic); var a = S.avec; S.rec = null; majMic();
        if(!r.envoie || !a) return; var duree = Math.max(1, Math.round((Date.now() - r.t0) / 1000)); if(duree < 1) return;
        var fd = new FormData(); fd.append('action', 'voix'); fd.append('nom', moi()); fd.append('a', a); fd.append('duree', duree); fd.append('audio', new Blob(bouts, { type:mr.mimeType || 'audio/webm' }), 'vocal');
        fetch(API, { method:'POST', body:fd }).then(function(x){ return x.json().then(function(j){ if(!x.ok) throw new Error(j.error || 'Erreur'); }); }).then(salut)
          .catch(function(err){ var i = P.querySelector('input'); if(i) i.placeholder = err.message; }); };
      r.tic = setInterval(function(){ r.s = Math.round((Date.now() - r.t0) / 1000); majMic(); if(r.s >= 30) finEnregistre(true); }, 250);
      mr.start(); majMic();
    }).catch(function(){ var i = P.querySelector('input'); if(i) i.placeholder = 'Le micro n\'est pas autorisé 🎤'; });
  }
  function finEnregistre(envoyer){ var r = S.rec; if(!r) return; r.envoie = envoyer; try{ r.mr.stop(); }catch(e){} }
  function envoie(texte){ texte = String(texte || '').trim(); if(!texte || !S.avec) return;
    var fd = new FormData(); fd.append('action', 'ecrit'); fd.append('de', moi()); fd.append('a', S.avec); fd.append('texte', texte);
    fetch(API, { method:'POST', body:fd }).then(function(r){ return r.json().then(function(j){ if(!r.ok) throw new Error(j.error || 'Erreur'); }); })
      .then(function(){ var i = P.querySelector('input'); if(i) i.value = ''; salut(); })
      .catch(function(err){ var i = P.querySelector('input'); if(i){ i.value = ''; i.placeholder = err.message; } });
  }
  function bulle(m){
    var old = document.getElementById('famBulle'); if(old) old.remove();
    var r = B.getBoundingClientRect(), d = document.createElement('div'); d.id = 'famBulle';
    d.style.bottom = (innerHeight - r.top + 10) + 'px'; d.style.left = Math.max(8, Math.min(innerWidth - 390, r.left)) + 'px';
    d.innerHTML = '<img alt="" src="' + tete(m.nom) + '"><span>💬 <b></b> : <q></q></span><button type="button">Répondre</button><button type="button" class="x" aria-label="Fermer">✕</button>';
    d.querySelector('b').textContent = (NOMS[m.nom] || m.nom) + (m.a === 'Famille' ? ' (à toute la famille)' : ''); d.querySelector('q').textContent = m.type === 'v' ? '🎤 (ancien message vocal)' : m.texte;
    d.querySelector('button').onclick = function(){ d.remove(); S.avec = m.a === 'Famille' ? 'Famille' : m.nom; S.vue = 'conv'; B.classList.remove('replie'); dessine(); P.classList.add('on'); place(); };
    d.querySelector('.x').onclick = function(){ d.remove(); };
    document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 12000);
    litMessage(m, true);
  }
  var occupe = false;
  function salut(){
    var m = moi(); if(!m || S.stop || document.hidden || occupe) return; occupe = true;
    var cle = 'salon-dernier:' + m, dernier = sget(cle, -1);
    var fd = new FormData(); fd.append('action', 'site'); fd.append('client', client); fd.append('nom', m); fd.append('av', (profil && profil.av) || '');
    fd.append('page', (document.title || location.pathname).replace(/\s*[·|–-]\s*Famille Missaoui.*$/i, '').slice(0, 60));
    fd.append('url', location.pathname.slice(0, 80));
    var plusGrand = S.msgs.length ? S.msgs[S.msgs.length - 1].id : 0; fd.append('depuis', plusGrand);
    fetch(API, { method:'POST', body:fd, cache:'no-store' }).then(function(r){ if(r.status === 401 || r.status === 403){ S.stop = true; return null; } return r.ok ? r.json() : null; }).then(function(j){
      occupe = false; if(!j) return;
      // 20/11 : la session a changé ailleurs (Anis prend ou rend la main, session fermée) : on recharge la page
      if(QUI && j.quiv && j.quiv !== QUI.v && !window.__quiRecharge){ window.__quiRecharge = 1; setTimeout(function(){ location.reload(); }, 600); }
      S.enLigne = j.en_ligne || [];
      var nv = (j.msgs || []).filter(function(x){ return x.id > plusGrand; });
      if(nv.length){ S.msgs = S.msgs.concat(nv).slice(-200);
        if(luGet(m) === null){ var lu0 = {}, vieux = Date.now() / 1000 - 86400; S.msgs.forEach(function(x){ if(x.a === m && x.ts < vieux) lu0[x.nom] = Math.max(lu0[x.nom] || 0, x.id); }); luSet(m, lu0); }   // nouvel appareil : les messages de plus d'un jour ne comptent pas
        var max = S.msgs[S.msgs.length - 1].id;
        if(explo && dernier >= 0 && nv.some(function(x){ return (x.a === m || x.a === 'Famille') && x.nom !== m && x.id > dernier; })) ding();
        if(dernier >= 0) nv.filter(function(x){ return (x.a === m || x.a === 'Famille') && x.nom !== m && x.id > dernier; }).forEach(function(x){ var ici = x.a === 'Famille' ? 'Famille' : x.nom; if(!(P.classList.contains('on') && S.vue === 'conv' && S.avec === ici)) bulle(x); else litMessage(x, false); });
        sset(cle, Math.max(max, dernier));
      } else if(dernier < 0) sset(cle, 0);
      var sig = JSON.stringify(S.enLigne) + '|' + S.msgs.length, change = sig !== S.sig; S.sig = sig;
      if(change && P.classList.contains('on')){ var c = P.querySelector('.corps'), haut = c ? c.scrollTop : 0, enBas = c && c.scrollHeight - c.scrollTop - c.clientHeight < 40, i = P.querySelector('input'), val = i ? i.value : '', foc = i && document.activeElement === i;
        dessine(); var c2 = P.querySelector('.corps'); if(c2 && !enBas) c2.scrollTop = haut; var i2 = P.querySelector('input'); if(i2){ i2.value = val; if(foc) i2.focus(); } }
      badges();
    }).catch(function(){ occupe = false; });
  }
  if(QUI && !QUI.nom){} /* 20/11 : personne n'est entré : pas d'étiquette */ else if(document.body) construit(); else document.addEventListener('DOMContentLoaded', construit);
})();
