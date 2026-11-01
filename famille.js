/*
 * Famille Missaoui — petit module commun à tous les jeux et cours.
 *   Famille.player()                     -> prénom du joueur sur cet appareil (ou null)
 *   Famille.choosePlayer({title})        -> ouvre « Qui joue ? », renvoie le prénom choisi
 *   Famille.score(game, variant, score)  -> envoie une partie au serveur, renvoie {rank, best, personalBest} ou null
 *   Famille.highscores(game, variant, n) -> meilleurs scores en ligne, ou null hors ligne
 *   Famille.track(course, player, keys)  -> envoie régulièrement les progrès gardés dans le navigateur
 *   Famille.load(course, player)         -> relit les progrès gardés sur le serveur (jeux autorisés seulement)
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
      '.fm-back{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:16px;background:rgba(16,12,32,.72);font-family:Fredoka,Nunito,ui-rounded,system-ui,sans-serif}' +
      '.fm-box{background:#fffdf7;color:#1b1533;border-radius:30px;padding:24px;max-width:560px;width:100%;display:flex;flex-direction:column;gap:16px;box-shadow:0 20px 60px rgba(0,0,0,.4);animation:fmPop .35s cubic-bezier(.2,1.5,.4,1)}' +
      '@keyframes fmPop{from{transform:scale(.6);opacity:0}}' +
      '.fm-box h2{margin:0;color:#1b1533;font-family:Sniglet,"Bricolage Grotesque",Fredoka,sans-serif;font-weight:800;font-size:clamp(28px,6vw,38px);text-align:center}' +
      '.fm-kids{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}' +
      '@media (max-width:420px){.fm-kids{grid-template-columns:1fr}}' +
      '.fm-kid{border:0;cursor:pointer;color:#fff;font:inherit;border-radius:22px;padding:16px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;box-shadow:0 6px 0 rgba(0,0,0,.3);touch-action:manipulation}' +
      '.fm-kid span{font-size:46px;line-height:1}.fm-kid b{font-size:24px}' +
      '.fm-kid.on{outline:5px solid #ffd23f;outline-offset:2px}' +
      '.fm-kid:active{transform:translateY(4px);box-shadow:0 2px 0 rgba(0,0,0,.3)}' +
      '.fm-other{display:flex;gap:8px;flex-wrap:wrap}' +
      '.fm-other input{flex:1 1 180px;min-width:0;font:inherit;font-size:20px;padding:12px 16px;border-radius:16px;border:3px solid #ddd3f0;background:#fff;color:#1b1533}' +
      '.fm-other button,.fm-cancel{font:inherit;font-size:20px;font-weight:600;border:0;cursor:pointer;border-radius:16px;padding:12px 18px;background:#8be08f;color:#14321a}' +
      '.fm-cancel{background:transparent;color:#6b6290;font-size:16px;align-self:center;padding:4px 10px}' +
      '.fm-msg{color:#d7263d;font-weight:600;text-align:center;min-height:1.2em;margin:-6px 0}';
    document.head.appendChild(st);
  }
  function choosePlayer(opts){
    opts = opts || {};
    css();
    return new Promise(function(resolve){
      var cur = get('famille-joueur', null);
      var back = document.createElement('div'); back.className = 'fm-back';
      back.innerHTML = '<div class="fm-box" role="dialog" aria-modal="true" aria-label="Qui joue ?"><h2>' + esc(opts.title || 'Qui joue ?') + '</h2>' +
        '<div class="fm-kids">' + KIDS.map(function(k){ return '<button class="fm-kid' + (cur === k.name ? ' on' : '') + '" data-n="' + k.name + '" style="background:' + k.color + '"><span>' + k.emoji + '</span><b>' + k.name + '</b></button>'; }).join('') + '</div>' +
        '<form class="fm-other"><input id="fm-name" maxlength="20" placeholder="Un autre prénom…" autocomplete="off" value="' + (cur && !KIDS.some(function(k){ return k.name === cur; }) ? esc(cur) : '') + '"><button type="submit">OK</button></form>' +
        '<div class="fm-msg" id="fm-msg"></div>' + (opts.cancel === false ? '' : '<button class="fm-cancel" type="button">Annuler</button>') + '</div>';
      document.body.appendChild(back);
      function done(name){ back.remove(); if(name){ set('famille-joueur', name); } resolve(name); }
      back.querySelectorAll('.fm-kid').forEach(function(b){ b.onclick = function(){ done(b.dataset.n); }; });
      back.querySelector('form').onsubmit = function(e){
        e.preventDefault();
        var n = cleanName(back.querySelector('#fm-name').value);
        if(!n){ back.querySelector('#fm-msg').textContent = 'Écris un prénom (des lettres seulement).'; return; }
        done(n);
      };
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
  function track(course, player, keys){
    if(!online) return;
    var lastSent = get('famille-sync:' + course + ':' + player, '');
    function snapshot(){
      var d = {};
      keys.forEach(function(k){ try{ var v = localStorage.getItem(k); if(v !== null){ try{ d[k] = JSON.parse(v); }catch(e){ d[k] = v; } } }catch(e){} });
      return JSON.stringify(d);
    }
    function send(beacon){
      var data = snapshot();
      if(data === '{}' || data === lastSent) return;
      var f = {action:'progress', player:player, course:course, data:data};
      if(beacon && navigator.sendBeacon){
        var fd = new FormData(); Object.keys(f).forEach(function(k){ fd.append(k, f[k]); });
        if(navigator.sendBeacon(API, fd)){ lastSent = data; set('famille-sync:' + course + ':' + player, data); }
        return;
      }
      post(f).then(function(){ lastSent = data; set('famille-sync:' + course + ':' + player, data); }).catch(function(){});
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

  window.Famille = {
    kids: KIDS,
    player: function(){ return get('famille-joueur', null); },
    setPlayer: function(n){ n = cleanName(n); if(n) set('famille-joueur', n); return n; },
    choosePlayer: choosePlayer,
    score: score,
    highscores: highscores,
    track: track,
    load: load,
    online: online
  };
})();
