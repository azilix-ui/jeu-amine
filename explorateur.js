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
    oublier: function(){ try{ sessionStorage.removeItem('famille-profil'); Object.keys(sessionStorage).forEach(function(k){ if(k.indexOf(PFX) === 0) sessionStorage.removeItem(k); }); }catch(e){} document.cookie = 'famille_explo=; path=/; max-age=0; SameSite=Lax'; }
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


  /* ---------- le salon du site ---------- */
  var API = '/api/houma.php', FAMILLE = ['anis', 'imen', 'essil', 'salma', 'amine'];
  var cap = function(s){ s = String(s || '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; };
  function moi(){ if(profil && profil.nom) return cap(profil.nom); try{ return cap(JSON.parse(VRAI.getItem('famille-joueur') || 'null')); }catch(e){ return ''; } }
  function sansAccent(s){ return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function tete(nom, av){ var k = sansAccent(nom); if(FAMILLE.indexOf(k) >= 0) return '/jeux/avatars/' + k + '.webp';
    if(['nour', 'yasmine', 'fares'].indexOf(av) >= 0) return '/jeux/avatars/mascotte-' + av + '.webp';
    if(['nour', 'yasmine', 'fares'].indexOf(k) >= 0) return '/jeux/avatars/mascotte-' + k + '.webp';
    var h = 0; for(var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0; return '/jeux/avatars/mascotte-' + ['nour', 'yasmine', 'fares'][h % 3] + '.webp'; }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function lit(t){ try{ if(!explo && 'speechSynthesis' in window){ var u = new SpeechSynthesisUtterance(t); u.lang = 'fr-FR'; speechSynthesis.speak(u); } }catch(e){} }
  var sget = function(k, d){ try{ var v = sessionStorage.getItem(k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } };
  var sset = function(k, v){ try{ sessionStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  var client = sget('salon-client', ''); if(!/^[0-9a-z]{8,40}$/.test(client)){ client = Math.random().toString(36).slice(2) + Date.now().toString(36); sset('salon-client', client); }
  var S = { enLigne:[], msgs:[], vue:null, avec:null, pret:false, stop:false };

  function css(){ var st = document.createElement('style'); st.textContent =
    '#famExplo{position:fixed;left:12px;bottom:12px;z-index:2147483000;display:flex;align-items:center;gap:8px;background:#0f766e;color:#fff;border-radius:999px;padding:5px 14px 5px 5px;box-shadow:0 3px 0 #0b5a54,0 6px 18px #0003;font:800 15px/1.1 Nunito,system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab;min-height:48px;box-sizing:border-box}' +
    '#famExplo.enfant{padding:5px;background:#2563eb;box-shadow:0 3px 0 #1d4ed8,0 6px 18px #0003}#famExplo.cache{display:none}' +
    '#famExplo img{width:38px;height:38px;border-radius:50%;object-fit:cover;background:#d7f1ee;border:2px solid #fff;pointer-events:none}#famExplo .t{display:flex;flex-direction:column;pointer-events:none}#famExplo small{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#bfeee8}' +
    '#famExplo .n{position:absolute;top:-6px;right:-6px;min-width:22px;height:22px;border-radius:11px;background:#d7263d;color:#fff;font-size:13px;display:none;place-items:center;padding:0 5px;box-sizing:border-box}#famExplo .n.on{display:grid}' +
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
    B.innerHTML = '<img alt="" src="' + tete(moi(), profil && profil.av) + '">' + (explo ? '<span class="t"><small>Explorateur du site</small><span></span></span><span class="v" title="sur le site en ce moment"></span>' : '') + '<span class="n"></span>';
    if(explo) B.querySelector('.t span').textContent = moi(); else { B.classList.add('enfant', 'cache'); }
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
    B.addEventListener('pointerup', function(){ if(!d) return; if(d.bouge) sset('salon-pos', { l:parseFloat(B.style.left), b:parseFloat(B.style.bottom) }); else bascule(); d = null; });
    B.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); bascule(); } });
    P.addEventListener('click', clicPanneau);
    P.addEventListener('submit', function(e){ e.preventDefault(); var i = P.querySelector('input'); envoie(i.value); });
    salut(); setInterval(salut, 8000);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) salut(); });
  }
  function bascule(){ if(P.classList.contains('on')){ P.classList.remove('on'); return; } S.vue = S.avec ? 'conv' : 'liste'; dessine(); P.classList.add('on'); place(); }
  function autres(){ var m = moi(); return S.enLigne.filter(function(p){ return p.nom !== m; }); }
  function nonLus(nom){ var lu = sget('salon-lu:' + moi(), {}); return S.msgs.filter(function(m){ return m.nom === nom && m.a === moi() && m.id > (lu[nom] || 0); }).length; }
  function badges(){
    if(!B) return; var n = 0, m = moi(); S.msgs.forEach(function(x){ if(x.a === m && x.id > (sget('salon-lu:' + m, {})[x.nom] || 0)) n++; });
    var e = B.querySelector('.n'); e.textContent = n > 9 ? '9+' : n; e.classList.toggle('on', n > 0);
    var v = B.querySelector('.v'); if(v){ var k = autres().length; v.textContent = k ? '👥 ' + k : ''; v.style.display = k ? '' : 'none'; }
    if(!explo && (n > 0 || S.msgs.length)) B.classList.remove('cache');
  }
  function dessine(){
    var m = moi();
    if(S.vue === 'conv' && S.avec){
      var a = S.avec, p = S.enLigne.filter(function(x){ return x.nom === a; })[0];
      var L = S.msgs.filter(function(x){ return (x.nom === a && x.a === m) || (x.nom === m && x.a === a); });
      P.innerHTML = '<header><button type="button" data-r aria-label="Retour">←</button><img alt="" src="' + tete(a, p && p.av) + '"><b>' + esc(a) + (p ? '' : ' <small style="font-weight:600;opacity:.8">(parti)</small>') + '</b><button type="button" data-f aria-label="Fermer">✕</button></header>' +
        '<div class="corps">' + (L.length ? L.map(function(x){ var d = new Date(x.ts * 1000); return '<div class="m' + (x.nom === m ? ' moi' : '') + '"><small>' + esc(x.nom) + ' · ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0') + '</small>' + esc(x.texte) + '</div>'; }).join('') : '<p class="vide">Écris le premier message à ' + esc(a) + ' 👋</p>') + '</div>' +
        '<div class="emo">' + ['👋', '😀', '😂', '❤️', '👍', '🎉', '⭐', '🏠'].map(function(e){ return '<button type="button" data-e="' + e + '">' + e + '</button>'; }).join('') + '</div>' +
        '<form><input maxlength="300" placeholder="Ton message à ' + esc(a) + '…" autocomplete="off" enterkeyhint="send"><button type="submit">Envoyer</button></form>';
      var c = P.querySelector('.corps'); c.scrollTop = c.scrollHeight;
      var lu = sget('salon-lu:' + m, {}); L.forEach(function(x){ if(x.nom === a) lu[a] = Math.max(lu[a] || 0, x.id); }); sset('salon-lu:' + m, lu); badges();
      return;
    }
    var O = autres(), deja = {}; O.forEach(function(p){ deja[p.nom] = 1; });
    var anciens = []; S.msgs.forEach(function(x){ var q = x.nom === m ? x.a : x.nom; if(q && !deja[q] && anciens.indexOf(q) < 0) anciens.push(q); });
    P.innerHTML = '<header><b>Sur le site en ce moment</b><button type="button" data-f aria-label="Fermer">✕</button></header><div class="corps">' +
      (O.length ? O.map(function(p){ var n = nonLus(p.nom); return '<div class="qui"><img alt="" src="' + tete(p.nom, p.av) + '"><span><b>' + esc(p.nom) + '</b><small>' + (p.page ? 'sur ' + esc(p.page) : 'sur le site') + '</small></span><button type="button" data-a="' + esc(p.nom) + '">💬 Écrire' + (n ? '<i>' + n + '</i>' : '') + '</button></div>'; }).join('')
        : '<p class="vide">Personne d\'autre n\'est sur le site pour l\'instant.</p>') +
      (anciens.length ? '<p class="vide" style="padding:6px 0 0;text-align:left">Discussions de tout à l\'heure</p>' + anciens.map(function(q){ var n = nonLus(q); return '<div class="qui"><img alt="" src="' + tete(q) + '"><span><b>' + esc(q) + '</b><small>n\'est plus là</small></span><button type="button" data-a="' + esc(q) + '">💬 Relire' + (n ? '<i>' + n + '</i>' : '') + '</button></div>'; }).join('') : '') +
      '</div><div class="pied">' + (explo ? '<a href="/?profil">⇄ Changer d\'avatar</a>' : '<span></span>') + '<button type="button" class="g" data-f>Fermer</button></div>';
  }
  function clicPanneau(e){ var t = e.target.closest('button,a'); if(!t) return;
    if(t.hasAttribute('data-f')){ P.classList.remove('on'); return; }
    if(t.hasAttribute('data-r')){ S.avec = null; S.vue = 'liste'; dessine(); place(); return; }
    if(t.dataset.a){ S.avec = t.dataset.a; S.vue = 'conv'; dessine(); place(); var i = P.querySelector('input'); if(i && !('ontouchstart' in window)) i.focus(); return; }
    if(t.dataset.e) envoie(t.dataset.e);
  }
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
    d.querySelector('b').textContent = m.nom; d.querySelector('q').textContent = m.texte;
    d.querySelector('button').onclick = function(){ d.remove(); S.avec = m.nom; S.vue = 'conv'; dessine(); P.classList.add('on'); place(); };
    d.querySelector('.x').onclick = function(){ d.remove(); };
    document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 12000);
    lit('Message de ' + m.nom + ' : ' + m.texte);
  }
  var occupe = false;
  function salut(){
    var m = moi(); if(!m || S.stop || document.hidden || occupe) return; occupe = true;
    var cle = 'salon-dernier:' + m, dernier = sget(cle, -1);
    var fd = new FormData(); fd.append('action', 'site'); fd.append('client', client); fd.append('nom', m); fd.append('av', (profil && profil.av) || '');
    fd.append('page', (document.title || location.pathname).replace(/\s*[·|–-]\s*Famille Missaoui.*$/i, '').slice(0, 60));
    var plusGrand = S.msgs.length ? S.msgs[S.msgs.length - 1].id : 0; fd.append('depuis', plusGrand);
    fetch(API, { method:'POST', body:fd, cache:'no-store' }).then(function(r){ if(r.status === 401 || r.status === 403){ S.stop = true; return null; } return r.ok ? r.json() : null; }).then(function(j){
      occupe = false; if(!j) return;
      S.enLigne = j.en_ligne || [];
      var nv = (j.msgs || []).filter(function(x){ return x.id > plusGrand; });
      if(nv.length){ S.msgs = S.msgs.concat(nv).slice(-200);
        var max = S.msgs[S.msgs.length - 1].id;
        if(dernier >= 0) nv.filter(function(x){ return x.a === m && x.id > dernier; }).forEach(function(x){ if(!(P.classList.contains('on') && S.vue === 'conv' && S.avec === x.nom)) bulle(x); });
        sset(cle, Math.max(max, dernier));
      } else if(dernier < 0) sset(cle, 0);
      var sig = JSON.stringify(S.enLigne) + '|' + S.msgs.length, change = sig !== S.sig; S.sig = sig;
      if(change && P.classList.contains('on')){ var c = P.querySelector('.corps'), haut = c ? c.scrollTop : 0, enBas = c && c.scrollHeight - c.scrollTop - c.clientHeight < 40, i = P.querySelector('input'), val = i ? i.value : '', foc = i && document.activeElement === i;
        dessine(); var c2 = P.querySelector('.corps'); if(c2 && !enBas) c2.scrollTop = haut; var i2 = P.querySelector('input'); if(i2){ i2.value = val; if(foc) i2.focus(); } }
      badges();
    }).catch(function(){ occupe = false; });
  }
  if(document.body) construit(); else document.addEventListener('DOMContentLoaded', construit);
})();
