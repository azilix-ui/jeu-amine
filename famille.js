/*
 * Famille Missaoui — petit module commun à tous les jeux et cours.
 *   Famille.player()                     -> prénom du joueur sur cet appareil (ou null)
 *   Famille.choosePlayer({title, extra, avatar}) -> ouvre « Qui joue ? » (extra : autres joueurs, ex. les parents ; avatar(k) : HTML de l'image), renvoie le prénom
 *   Famille.score(game, variant, score)  -> envoie une partie au serveur, renvoie {rank, best, personalBest} ou null
 *   Famille.highscores(game, variant, n) -> meilleurs scores en ligne, ou null hors ligne
 *   Famille.track(course, player, keys)  -> envoie régulièrement les progrès gardés dans le navigateur
 *   Famille.load(course, player)         -> relit les progrès gardés sur le serveur (jeux autorisés seulement)
 *   Famille.head(name)                   -> la tête choisie par un joueur hors famille : {id, name, color, img} (null pour la famille)
 *   Famille.loadHeads()                  -> relit sur le serveur les têtes de tous les joueurs (pour les classements), renvoie une promesse
 * Tout fonctionne aussi sans connexion : le jeu continue, les envois attendent le retour du réseau.
 */
(function(){
  'use strict';
  var script = document.currentScript;
  var API = script ? new URL('api/famille.php', script.src).href : '/api/famille.php';
  var online = /^https?:$/.test(location.protocol);
  var KIDS = [
    {name:'Essil', color:'#1f3c88', emoji:'🚆'},
    {name:'Salma', color:'#2e8b57', emoji:'🦉'},
    {name:'Amine', color:'#3a2a6e', emoji:'🎃'}
  ];
  // Les têtes des invités : trois mascottes tunisiennes (Higgsfield), à choisir dans « Qui joue ? »
  var BASE = script ? new URL('./', script.src).href : '/';
  var MASCOTS = [
    {id:'nour', name:'Nour', color:'#1fa3a8'},
    {id:'yasmine', name:'Yasmine', color:'#d9466a'},
    {id:'fares', name:'Farès', color:'#2a3f9a'}
  ];
  MASCOTS.forEach(function(m){ m.img = BASE + 'jeux/avatars/mascotte-' + m.id + '.webp'; });
  var FAMILY = ['essil', 'salma', 'amine', 'anis', 'imen'];
  function mascot(id){ for(var i = 0; i < MASCOTS.length; i++) if(MASCOTS[i].id === id) return MASCOTS[i]; return null; }
  function head(name){
    var k = String(name || '').toLowerCase(); if(!k || FAMILY.indexOf(k) >= 0) return null;
    var m = mascot(get('famille-tetes', {})[k]); if(m) return m;
    var h = 0; for(var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0; return MASCOTS[h % MASCOTS.length];
  }
  function saveHead(name, id){
    var t = get('famille-tetes', {}); t[String(name).toLowerCase()] = id; set('famille-tetes', t);
    if(online) post({action:'progress', player:name, course:'profil', data:JSON.stringify({tete:id})}).catch(function(){});
  }
  function loadHeads(){
    if(!online) return Promise.resolve(get('famille-tetes', {}));
    return fetch(API + '?action=heads', {cache:'no-store'}).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
      if(j && j.heads){ var t = get('famille-tetes', {}); Object.keys(j.heads).forEach(function(n){ if(mascot(j.heads[n])) t[n.toLowerCase()] = j.heads[n]; }); set('famille-tetes', t); }
      return get('famille-tetes', {});
    }).catch(function(){ return get('famille-tetes', {}); });
  }
  function get(k, d){ try{ var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } }
  function set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function cleanName(n){
    n = String(n || '').replace(/\s+/g, ' ').trim();
    if(!n || n.length > 20 || !/^[\p{L}][\p{L}\p{M} '\-]*$/u.test(n)) return null;
    return n.charAt(0).toLocaleUpperCase('fr') + n.slice(1);
  }

  /* ---------- Envois au serveur (avec file d'attente hors ligne) ---------- */
  function post(fields){
    var fd = new FormData();
    Object.keys(fields).forEach(function(k){ fd.append(k, fields[k]); });
    return fetch(API, {method:'POST', body:fd}).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(j){ if(!r.ok) throw Object.assign(new Error(j.error || 'Erreur'), {status:r.status}); return j; });
    });
  }
  function queue(fields){ var q = get('famille-attente', []); q.push(fields); set('famille-attente', q.slice(-50)); }
  function flush(){
    if(!online || !navigator.onLine) return;
    var q = get('famille-attente', []); if(!q.length) return;
    set('famille-attente', []);
    q.reduce(function(p, f){ return p.then(function(){ return post(f).catch(function(e){ if(!e.status || e.status >= 500 || e.status === 429) queue(f); }); }); }, Promise.resolve());
  }
  if(online){ addEventListener('online', flush); setTimeout(flush, 2500); }

  /* ---------- Qui joue ? ---------- */
  var cssDone = false;
  function css(){
    if(cssDone) return; cssDone = true;
    var st = document.createElement('style');
    st.textContent =
      '.fm-back{position:fixed;inset:0;z-index:100000;display:grid;grid-template-columns:minmax(0,560px);justify-content:center;place-items:center;padding:16px;overflow:auto;background:rgba(16,12,32,.72);font-family:Fredoka,Nunito,ui-rounded,system-ui,sans-serif}' +
      '.fm-box{background:#fffdf7;color:#1b1533;border-radius:30px;padding:24px;max-width:560px;width:100%;max-height:calc(100vh - 32px);overflow:auto;display:flex;flex-direction:column;gap:16px;box-shadow:0 20px 60px rgba(0,0,0,.4);animation:fmPop .35s cubic-bezier(.2,1.5,.4,1)}' +
      '@keyframes fmPop{from{transform:scale(.6);opacity:0}}' +
      '.fm-box h2{margin:0;color:#1b1533;font-family:Sniglet,"Bricolage Grotesque",Fredoka,sans-serif;font-weight:800;font-size:clamp(28px,6vw,38px);text-align:center}' +
      '.fm-kids{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}' +
      '@media (max-width:420px){.fm-kids{grid-template-columns:1fr}}' +
      '.fm-kid{border:0;cursor:pointer;color:#fff;font:inherit;border-radius:22px;padding:16px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;box-shadow:0 6px 0 rgba(0,0,0,.3);touch-action:manipulation}' +
      '.fm-kid span{font-size:46px;line-height:1}.fm-kid b{font-size:24px}' +
      '.fm-kid img{width:64px;height:64px;border-radius:50%;object-fit:cover;display:block;border:3px solid rgba(255,255,255,.6)}' +
      '.fm-kids.fm-parents{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:-2px}.fm-parents .fm-kid{padding:10px 8px;flex-direction:row;justify-content:center;gap:10px}.fm-parents .fm-kid span{font-size:30px}.fm-parents .fm-kid img{width:44px;height:44px}.fm-parents .fm-kid b{font-size:20px}' +
      '.fm-kid.on{outline:5px solid #ffd23f;outline-offset:2px}' +
      '.fm-kid:active{transform:translateY(4px);box-shadow:0 2px 0 rgba(0,0,0,.3)}' +
      '.fm-other{display:flex;gap:8px;flex-wrap:wrap}' +
      '.fm-other input{flex:1 1 180px;min-width:0;font:inherit;font-size:20px;padding:12px 16px;border-radius:16px;border:3px solid #ddd3f0;background:#fff;color:#1b1533}' +
      '.fm-other button,.fm-cancel{font:inherit;font-size:20px;font-weight:600;border:0;cursor:pointer;border-radius:16px;padding:12px 18px;background:#8be08f;color:#14321a}' +
      '.fm-cancel{background:transparent;color:#6b6290;font-size:16px;align-self:center;padding:4px 10px}' +
      '.fm-guest{background:#f3eefc;border-radius:22px;padding:12px;display:flex;flex-direction:column;gap:10px}' +
      '.fm-guest p{margin:0;font-weight:600;color:#4a3f78;text-align:center}' +
      '.fm-heads{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}' +
      '.fm-head{border:0;cursor:pointer;font:inherit;color:#fff;border-radius:18px;padding:8px 4px;display:flex;flex-direction:column;align-items:center;gap:4px;box-shadow:0 5px 0 rgba(0,0,0,.25);touch-action:manipulation;opacity:.75}' +
      '.fm-head img{width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.7)}.fm-head b{font-size:17px}' +
      '.fm-head.on{opacity:1;outline:5px solid #ffd23f;outline-offset:2px}' +
      '.fm-msg{color:#d7263d;font-weight:600;text-align:center;min-height:1.2em;margin:-6px 0}' +
      '.fm-pause{background:rgba(16,12,32,.92);z-index:2147483000}.fm-p{margin:0;text-align:center;font-size:19px;line-height:1.45;color:#4a3f78}' +
      '.fm-btn{display:flex;align-items:center;justify-content:center;min-height:58px;border-radius:18px;background:#8be08f;color:#14321a;font-weight:700;font-size:21px;text-decoration:none;box-shadow:0 6px 0 #4c9a52}' +
      '.fm-dem{width:100%;border:0;font:inherit;background:#ffd36b;color:#4a3300;box-shadow:0 6px 0 #c9962a;cursor:pointer}.fm-dem[disabled]{opacity:.75;cursor:default}.fm-dmsg{margin:0;text-align:center;font-size:17px;font-weight:700;color:#4a3f78;min-height:1.2em}' +
      '.fm-parent summary{cursor:pointer;color:#6b6290;text-align:center;font-size:15px;padding:8px}.fm-parent .fm-other{margin-top:8px}' +
      '.fm-toast{position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:2147483001;background:#1b1533;color:#fff;font:600 18px Fredoka,Nunito,system-ui,sans-serif;padding:12px 20px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.4)}' +
      '.fm-known{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}.fm-known button{border:0;cursor:pointer;font:inherit;font-weight:600;font-size:17px;display:flex;align-items:center;gap:8px;padding:6px 14px 6px 6px;border-radius:999px;color:#fff;min-height:48px;box-shadow:0 4px 0 rgba(0,0,0,.25)}' +
      '.fm-known img{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.7)}' +
      '.fm-confirm{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.fm-confirm button{font:inherit;font-weight:600;font-size:18px;border:0;cursor:pointer;border-radius:14px;padding:10px 16px;background:#8be08f;color:#14321a}.fm-confirm button.non{background:#eee8fa;color:#4a3f78}';
    document.head.appendChild(st);
  }
  function choosePlayer(opts){
    opts = opts || {};
    css();
    return new Promise(function(resolve){
      var cur = get('famille-joueur', null);
      var all = KIDS.concat(opts.extra || []);
      function chip(k){ return '<button class="fm-kid' + (cur === k.name ? ' on' : '') + '" data-n="' + k.name + '" style="background:' + k.color + '"><span>' + (opts.avatar ? opts.avatar(k) : k.emoji) + '</span><b>' + k.name + '</b></button>'; }
      var back = document.createElement('div'); back.className = 'fm-back';
      back.innerHTML = '<div class="fm-box" role="dialog" aria-modal="true" aria-label="Qui joue ?"><h2>' + esc(opts.title || 'Qui joue ?') + '</h2>' +
        '<div class="fm-kids">' + KIDS.map(chip).join('') + '</div>' +
        (opts.extra && opts.extra.length ? '<div class="fm-kids fm-parents">' + opts.extra.map(chip).join('') + '</div>' : '') +
        '<div class="fm-guest"><div class="fm-known" id="fm-known" hidden></div><p>Un autre joueur ? Écris ton pseudo, puis choisis ta tête :</p>' +
        '<form class="fm-other"><input id="fm-name" maxlength="20" placeholder="Ton pseudo…" autocomplete="off" value="' + (cur && !all.some(function(k){ return k.name === cur; }) ? esc(cur) : '') + '"><button type="submit">OK</button></form>' +
        '<div class="fm-heads">' + MASCOTS.map(function(m){ return '<button type="button" class="fm-head" data-h="' + m.id + '" style="background:' + m.color + '"><img src="' + m.img + '" alt=""><b>' + esc(m.name) + '</b></button>'; }).join('') + '</div></div>' +
        '<div class="fm-msg" id="fm-msg"></div>' + (opts.cancel === false ? '' : '<button class="fm-cancel" type="button">Annuler</button>') + '</div>';
      document.body.appendChild(back);
      function done(name){ back.remove(); if(name){ set('famille-joueur', name); try{ document.dispatchEvent(new Event('famille-joueur')); }catch(e){} } resolve(name); }
      back.querySelectorAll('.fm-kid').forEach(function(b){ b.onclick = function(){ done(b.dataset.n); }; });
      var inp = back.querySelector('#fm-name'), pick = null, msg = back.querySelector('#fm-msg');
      function mark(id){ pick = id; back.querySelectorAll('.fm-head').forEach(function(b){ b.classList.toggle('on', b.dataset.h === id); }); }
      function known(){ var n = cleanName(inp.value); var t = get('famille-tetes', {}); if(n && t[n.toLowerCase()]) mark(t[n.toLowerCase()]); }
      // les invités déjà venus (leur tête est gardée) : un bouton chacun, pour ne pas retaper son prénom (13/11 : fini les « Aniss », « K », « Test »)
      function connus(t){
        var box = back.querySelector('#fm-known'); if(!box) return;
        var noms = Object.keys(t || {}).filter(function(n){ return FAMILY.indexOf(n) < 0 && mascot(t[n]) && cleanName(n); }).sort().slice(0, 12);
        box.innerHTML = noms.map(function(n){ var m = mascot(t[n]); var nom = cleanName(n); return '<button type="button" data-n="' + esc(nom) + '" style="background:' + m.color + '"><img src="' + m.img + '" alt="">' + esc(nom) + '</button>'; }).join('');
        box.hidden = !noms.length;
        box.querySelectorAll('button').forEach(function(b){ b.onclick = function(){ done(b.dataset.n); }; });
      }
      inp.addEventListener('input', function(){ attente = null; msg.innerHTML = ''; known(); }); known(); connus(get('famille-tetes', {})); loadHeads().then(function(t){ known(); connus(t); });
      function dist(a, b){ var m = [], i, j; for(i = 0; i <= a.length; i++){ m[i] = [i]; } for(j = 1; j <= b.length; j++) m[0][j] = j;
        for(i = 1; i <= a.length; i++) for(j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i-1][j] + 1, m[i][j-1] + 1, m[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)); return m[a.length][b.length]; }
      function sansAccent(x){ return x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
      var attente = null;
      function demande(html, oui, non){ msg.innerHTML = '<span style="color:#4a3f78">' + html + '</span><div class="fm-confirm" style="margin-top:8px"><button type="button" class="oui">' + oui[0] + '</button><button type="button" class="non">' + non[0] + '</button></div>';
        msg.querySelector('.oui').onclick = oui[1]; msg.querySelector('.non').onclick = non[1]; }
      function go(){
        var n = cleanName(inp.value);
        if(!n){ msg.textContent = 'Écris ton pseudo (des lettres seulement).'; inp.focus(); return; }
        if(FAMILY.indexOf(n.toLowerCase()) >= 0){ done(all.filter(function(k){ return k.name.toLowerCase() === n.toLowerCase(); }).map(function(k){ return k.name; })[0] || n); return; }
        var t = get('famille-tetes', {}), deja = !!t[n.toLowerCase()];
        if(!deja && attente !== n){
          // une faute de frappe sur un prénom connu (« Aniss », « Fares ») ?
          var proches = FAMILY.concat(Object.keys(t)).filter(function(x){ var a = sansAccent(x), b = sansAccent(n); return a !== b ? dist(a, b) <= (b.length > 4 ? 2 : 1) : true; });
          var p = proches[0] && cleanName(proches[0]);
          if(p && p.toLowerCase() !== n.toLowerCase()){ attente = n; demande('Tu voulais dire <b>' + esc(p) + '</b> ?', ['Oui, c\'est ' + esc(p), function(){ inp.value = p; attente = null; msg.innerHTML = ''; known(); go(); }], ['Non, je suis ' + esc(n), function(){ go(); }]); return; }
          // un mélange de lettres (« Lhchvckdhc… ») ?
          var voy = (sansAccent(n).match(/[aeiouy]/g) || []).length;
          if(n.length >= 7 && voy / n.length < .2 || /(.)\1\1/i.test(n)){ msg.textContent = 'Ce pseudo ressemble à des lettres au hasard 🙂 Écris ton vrai prénom.'; inp.focus(); return; }
          attente = n; demande('Nouveau joueur : tu t\'appelles bien <b>' + esc(n) + '</b> ?', ['Oui, c\'est moi', function(){ go(); }], ['Je corrige', function(){ attente = null; msg.innerHTML = ''; inp.focus(); }]); return;
        }
        if(!pick){ msg.textContent = 'Choisis ta tête : Nour, Yasmine ou Farès 🙂'; return; }
        saveHead(n, pick); done(n);
      }
      back.querySelectorAll('.fm-head').forEach(function(b){ b.onclick = function(){ mark(b.dataset.h); msg.textContent = ''; if(cleanName(inp.value)) go(); else inp.focus(); }; });
      back.querySelector('form').onsubmit = function(e){ e.preventDefault(); go(); };
      var c = back.querySelector('.fm-cancel'); if(c) c.onclick = function(){ done(null); };
    });
  }

  /* ---------- Scores ---------- */
  function score(game, variant, value, player){
    player = player || get('famille-joueur', null);
    if(!player) return Promise.resolve(null);
    var f = {action:'score', player:player, game:game, variant:variant, score:String(Math.max(0, Math.round(value)))};
    if(!online) return Promise.resolve(null);
    return post(f).catch(function(e){ if(!e.status || e.status >= 500 || e.status === 429) queue(f); return null; });
  }
  function highscores(game, variant, limit){
    if(!online) return Promise.resolve(null);
    return fetch(API + '?action=highscores&game=' + encodeURIComponent(game) + '&variant=' + encodeURIComponent(variant) + '&limit=' + (limit || 10), {cache:'no-store'})
      .then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ return j ? j.scores : null; }).catch(function(){ return null; });
  }

  /* ---------- Suivi des progrès ---------- */
  /* Remise à zéro par un parent (page Progression) : le serveur garde la date et l'état voulu ;
     chaque tablette l'applique une fois (les clés du cours sont vidées ou remises à l'état choisi), puis la page se recharge. */
  function applyReset(course, player, keys, r){
    try{
      var d = r.data || {};
      keys.forEach(function(k){ try{ if(d[k] === undefined || d[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, typeof d[k] === 'string' ? d[k] : JSON.stringify(d[k])); }catch(e){} });
      localStorage.removeItem('famille-sync:' + course + ':' + player);
      set('famille-rst:' + course + ':' + player, r.ts);
      // la page a encore l'ancien état en mémoire : on l'empêche de le réécrire pendant le rechargement
      var orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k){ if(this === localStorage && keys.indexOf(k) >= 0) return; return orig.apply(this, arguments); };
    }catch(e){}
    location.reload();
  }
  function track(course, player, keys){
    if(!online) return;
    var lastSent = get('famille-sync:' + course + ':' + player, '');
    var ack = function(){ return +get('famille-rst:' + course + ':' + player, 0) || 0; };
    var ready = false, stopped = false;
    function gotReset(r){ if(r && r.ts > ack()){ stopped = true; applyReset(course, player, keys, r); return true; } return false; }
    fetch(API + '?action=resets&course=' + encodeURIComponent(course) + '&player=' + encodeURIComponent(player), {cache:'no-store'})
      .then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ if(!gotReset(j)) ready = true; }).catch(function(){ ready = true; });
    function snapshot(){
      var d = {};
      keys.forEach(function(k){ try{ var v = localStorage.getItem(k); if(v !== null){ try{ d[k] = JSON.parse(v); }catch(e){ d[k] = v; } } }catch(e){} });
      return JSON.stringify(d);
    }
    function send(beacon){
      if(stopped || !ready) return;
      var data = snapshot();
      if(data === '{}' || data === lastSent) return;
      var f = {action:'progress', player:player, course:course, data:data, rst:String(ack())};
      if(beacon && navigator.sendBeacon){
        var fd = new FormData(); Object.keys(f).forEach(function(k){ fd.append(k, f[k]); });
        if(navigator.sendBeacon(API, fd)){ lastSent = data; set('famille-sync:' + course + ':' + player, data); return; }
        // trop gros pour un envoi « en partant » : on tente l'envoi normal
      }
      post(f).then(function(j){ if(j && j.reset){ gotReset(j.reset); return; } lastSent = data; set('famille-sync:' + course + ':' + player, data); }).catch(function(){});
    }
    setTimeout(send, 3000);
    setInterval(send, 15000);
    addEventListener('pagehide', function(){ send(true); });
    document.addEventListener('visibilitychange', function(){ if(document.hidden) send(true); });
  }

  function load(course, player){
    if(!online || !player) return Promise.resolve(null);
    return fetch(API + '?action=load&course=' + encodeURIComponent(course) + '&player=' + encodeURIComponent(player), {cache:'no-store'})
      .then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ return j ? j.data : null; }).catch(function(){ return null; });
  }


  /* ---------- Temps d'écran (13/11) ----------
     Sur les pages de JEUX seulement (les cours restent libres) : pour Essil, Salma et Amine, le temps passé sur la page (visible)
     est envoyé chaque minute au serveur, qui renvoie la limite du jour (réglée par les parents dans Progression, + 10 min si le
     défi du jour est réussi). Limite atteinte ou heure du coucher : un écran doux « C'est l'heure de faire une pause » couvre le jeu ;
     un parent peut débloquer 15 minutes avec le mot de passe parent. */
  var JEUX = /^\/(jeux\/(serpent-legendes|ludo-legendes|grimpe-glace|legende-du-jasmin(-2|-3)?|medina-express|ma-houma|les-ecuries|atelier-du-jasmin)|essil\/les-ecuries|amine\/(serpentin|la-nuit-d-amine(-2)?))\.html$/;
  var ESPACE = {Essil:'/essil/', Salma:'/salma/', Amine:'/amine/'};
  function hm(s){ var p = String(s || '').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); }
  function ecranWatch(){
    if(!online || !JEUX.test(location.pathname)) return;
    var etat = null, vu = 0, cache = null, prev = Date.now(), averti = false;
    function moi(){ var p = get('famille-joueur', null); return ESPACE[p] ? p : null; }
    function debloque(){ var d = get('famille-ecran-deblocage', null); return d && d.p === moi() && d.jusqua > Date.now(); }
    function bloque(){
      if(!etat || etat.libre || debloque()) return null;
      var n = new Date(), m = n.getHours() * 60 + n.getMinutes(), nuit = hm(etat.nuit), matin = hm(etat.matin);
      if(nuit > matin ? (m >= nuit || m < matin) : (m >= nuit && m < matin)) return 'nuit';
      if(etat.utilise >= etat.limite) return 'fini';
      return null;
    }
    function toast(t){ css(); var d = document.createElement('div'); d.className = 'fm-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 6000); }
    function stopTouches(e){ if(cache && !cache.contains(e.target)){ e.stopImmediatePropagation(); e.preventDefault(); } }
    function montre(pourquoi){
      if(cache) return; css();
      var p = moi(), k = KIDS.filter(function(x){ return x.name === p; })[0] || {};
      cache = document.createElement('div'); cache.className = 'fm-back fm-pause';
      cache.innerHTML = '<div class="fm-box" role="dialog" aria-modal="true" aria-label="Pause"><div style="font-size:64px;text-align:center">' + (pourquoi === 'nuit' ? '🌙' : '⏳') + '</div>' +
        '<h2>' + (pourquoi === 'nuit' ? 'Bonne nuit, ' + esc(p) + ' !' : 'C\'est l\'heure de faire une pause, ' + esc(p) + ' !') + '</h2>' +
        '<p class="fm-p">' + (pourquoi === 'nuit' ? 'Les jeux dorment jusqu\'à demain matin. Les cours restent ouverts si tu veux encore apprendre.' : 'Tu as bien joué aujourd\'hui ! Les jeux reviennent demain. Les cours, eux, restent ouverts.' + (etat && !etat.bonus ? ' Astuce : réussis ton défi du jour pour gagner 10 minutes de jeu.' : '')) + '</p>' +
        '<a class="fm-btn" href="' + (ESPACE[p] || '/') + '">📚 Aller à mes cours</a>' +
        '<button class="fm-btn fm-dem" type="button">🙋 Demander plus de temps</button><p class="fm-dmsg" aria-live="polite"></p>' +
        '<details class="fm-parent"><summary>Un parent débloque 15 minutes</summary><form class="fm-other"><input type="password" placeholder="Mot de passe parent" autocomplete="current-password"><button type="submit">OK</button></form><div class="fm-msg"></div></details></div>';
      document.body.appendChild(cache);
      cache.querySelector('.fm-dem').onclick = function(){
        var b = this; b.disabled = true; b.textContent = '📨 J\'envoie ta demande…';
        post({action:'demande', player:p}).then(function(j){ etat = j; demandeUI(); dis(j.envoye === false ? 'Oups, la notification n\'est pas partie. Va voir papa ou maman !' : 'C\'est envoyé ! Papa ou maman va répondre.'); })
          .catch(function(err){ b.disabled = false; b.textContent = '🙋 Demander plus de temps'; var m = cache && cache.querySelector('.fm-dmsg'); if(m) m.textContent = (err && err.message && err.status === 429) ? err.message : 'Le serveur ne répond pas.'; });
      };
      demandeUI();
      ['keydown', 'keyup', 'pointerdown', 'touchstart', 'mousedown'].forEach(function(t){ addEventListener(t, stopTouches, true); });
      cache.querySelector('form').onsubmit = function(e){
        e.preventDefault(); var inp = cache.querySelector('input'), msg = cache.querySelector('.fm-msg');
        post({action:'ecran_plus', pass:inp.value, player:p, min:'15'}).then(function(j){ set('famille-ecran-deblocage', {p:p, jusqua:Date.now() + 15 * 60000}); etat = j; enleve(); toast('15 minutes de plus 🎉'); })
          .catch(function(err){ msg.textContent = err.status === 403 ? 'Ce n\'est pas le bon mot de passe.' : 'Le serveur ne répond pas.'; });
      };
    }
    // « 🙋 Demander plus de temps » (14/11) : l'état de la dernière demande du jour vient du serveur (etat.demande)
    function dis(t){ try{ if('speechSynthesis' in window){ speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t); u.lang = 'fr-FR'; speechSynthesis.speak(u); } }catch(e){} }
    function demandeUI(){
      if(!cache || !etat) return; var b = cache.querySelector('.fm-dem'), m = cache.querySelector('.fm-dmsg'), d = etat.demande, t = etat.now || Date.now() / 1000;
      if(d && d.statut === 'attente' && d.ts > t - 7200){ b.disabled = true; b.textContent = '📨 Demande envoyée…'; m.textContent = 'On attend la réponse de papa ou maman.'; }
      else if(d && d.statut === 'non' && d.maj > t - 1800){ b.hidden = true; m.textContent = 'Papa ou maman a dit non pour cette fois 💛'; }
      else { b.hidden = false; b.disabled = false; b.textContent = '🙋 Demander plus de temps'; m.textContent = ''; }
    }
    function reponse(){   // un « oui » lève la pause pendant les minutes données (même la nuit) ; un « non » s'affiche une fois
      var d = etat && etat.demande, p = moi(); if(!d || !p || d.statut === 'attente') return;
      var vue = get('famille-demande-vue', 0); if(vue === d.id) return;
      if(d.statut === 'oui'){ var fin = Date.now() + ((d.maj + d.min * 60) - (etat.now || Date.now() / 1000)) * 1000;
        if(fin > Date.now()){ set('famille-ecran-deblocage', {p:p, jusqua:fin}); toast('🎉 Papa ou maman t\'a donné ' + d.min + ' minutes de plus !'); dis('Bonne nouvelle ! Tu as ' + d.min + ' minutes de jeu en plus.'); } }
      else if(d.statut === 'non' && cache){ dis('Papa ou maman a dit non pour cette fois.'); }
      set('famille-demande-vue', d.id);
    }
    function enleve(){ if(!cache) return; cache.remove(); cache = null; ['keydown', 'keyup', 'pointerdown', 'touchstart', 'mousedown'].forEach(function(t){ removeEventListener(t, stopTouches, true); }); }
    function verifie(){
      reponse(); demandeUI();
      var b = bloque(); if(b) montre(b); else enleve();
      if(etat && !etat.libre && !b && !averti && !debloque() && etat.limite - etat.utilise <= 300 && etat.limite > etat.utilise){ averti = true; toast('Encore 5 minutes de jeu ⏳'); }
    }
    function lit(){ var p = moi(); if(!p){ etat = null; enleve(); return; }
      fetch(API + '?action=ecran&player=' + encodeURIComponent(p), {cache:'no-store'}).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ if(j){ etat = j; verifie(); } }).catch(function(){}); }
    setInterval(function(){
      var t = Date.now(), dt = Math.min(5, (t - prev) / 1000); prev = t;
      if(!document.hidden && !cache && moi()) vu += dt;
      if(cache && etat && etat.demande && etat.demande.statut === 'attente' && !document.hidden){ lit(); return; }   // on attend la réponse : on relit toutes les 5 s
      if(vu >= 60 && moi()){ var s = Math.round(vu); vu = 0; post({action:'ecran', player:moi(), sec:String(Math.min(60, s))}).then(function(j){ if(j){ etat = j; verifie(); } }).catch(function(){}); }
      else verifie();
    }, 5000);
    addEventListener('storage', function(e){ if(e.key === 'famille-joueur') lit(); }); document.addEventListener('famille-joueur', lit);   // le joueur a changé dans « Qui joue ? »
    var setP = Famille.setPlayer; Famille.setPlayer = function(n){ var r = setP(n); lit(); return r; };
    lit();
  }

  window.Famille = {
    kids: KIDS,
    player: function(){ return get('famille-joueur', null); },
    setPlayer: function(n){ n = cleanName(n); if(n) set('famille-joueur', n); return n; },
    choosePlayer: choosePlayer,
    mascots: MASCOTS,
    head: head,
    loadHeads: loadHeads,
    score: score,
    highscores: highscores,
    track: track,
    load: load,
    online: online
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ecranWatch); else ecranWatch();
})();
