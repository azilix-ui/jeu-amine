/* Famille Missaoui : chargé par toutes les pages.
   1. installe le site comme une application (service worker) et prépare le bouton « Installer » ;
   2. note chaque ouverture de page dans le journal des visites (vu seulement par les parents, gardé 60 jours) ;
   3. (16/11) compte le temps passé sur la page (seulement quand elle est visible) et l'envoie chaque minute : bulles de Progression. */
(function(){
  'use strict';
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if('serviceWorker' in navigator && location.protocol === 'https:'){
    addEventListener('load', function(){ navigator.serviceWorker.register('/sw.js').catch(function(){}); });
    // 28/11 : si le site ne répond pas (coupure, souci de certificat, CDN), la page vient de la copie gardée sur l'appareil.
    // On le dit au lieu de montrer en silence une ancienne version : un bandeau « version gardée » avec « Réessayer ».
    addEventListener('load', function(){
      if(!navigator.serviceWorker.controller) return;
      setTimeout(function(){
        fetch('/version.js?ping=' + Date.now(), { cache: 'no-store' }).then(function(r){ if(!r.ok) throw 0; }).catch(function(){
          if(document.getElementById('famille-hors-ligne')) return;
          var b = document.createElement('div'); b.id = 'famille-hors-ligne'; b.setAttribute('role', 'status');
          b.style.cssText = 'position:fixed;left:50%;bottom:calc(12px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483000;max-width:min(94vw,560px);display:flex;align-items:center;gap:12px;padding:10px 12px 10px 16px;border-radius:16px;background:#1f2937;color:#fff;font:600 15px/1.35 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.3)';
          b.innerHTML = '<span>📶 Le site ne répond pas : tu vois peut-être une <b>ancienne version</b> gardée sur cet appareil.</span>';
          var k = document.createElement('button'); k.type = 'button'; k.textContent = 'Réessayer';
          k.style.cssText = 'min-height:48px;padding:0 16px;border:0;border-radius:12px;background:#0f766e;color:#fff;font:700 15px system-ui,sans-serif;cursor:pointer;flex:none';
          k.onclick = function(){ location.reload(); };
          b.appendChild(k); (document.body || document.documentElement).appendChild(b);
        });
      }, 1500);
    });
  }
  var deferred = null;
  addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferred = e; document.dispatchEvent(new Event('famille-installable')); });
  addEventListener('appinstalled', function(){ deferred = null; document.dispatchEvent(new Event('famille-installed')); });
  var ua = navigator.userAgent || '';
  var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  window.FamilleApp = {
    standalone: standalone, ios: ios,
    canPrompt: function(){ return !!deferred; },
    install: function(){ if(!deferred) return Promise.resolve(false); var d = deferred; deferred = null; d.prompt(); return d.userChoice.then(function(c){ return c && c.outcome === 'accepted'; }); }
  };
  // journal des visites
  try{
    var page = location.pathname, k = 'famille-vu:' + page, now = Date.now(), last = +(sessionStorage.getItem(k) || 0);
    if(now - last > 10 * 60 * 1000){
      sessionStorage.setItem(k, String(now));
      var who = ''; try{ who = JSON.parse(localStorage.getItem('famille-joueur') || 'null') || ''; }catch(e){}
      /* 21/11 : d'où vient la visite, gardé pour tout l'onglet : un autre site (moteur de recherche, WhatsApp…), « direct » (adresse tapée, favori), « app » (appli installée) */
      var ref = ''; try{ ref = sessionStorage.getItem('famille-origine') || ''; if(!ref){ ref = 'direct'; if(standalone) ref = 'app';
        if(document.referrer){ var rh = new URL(document.referrer).host; if(rh !== location.host) ref = rh; }
        sessionStorage.setItem('famille-origine', ref); } }catch(e){}
      var f = new FormData();
      f.append('action', 'visit'); f.append('page', page.slice(0, 120)); f.append('player', String(who).slice(0, 20));
      f.append('app', standalone ? '1' : '0'); f.append('screen', screen.width + 'x' + screen.height); f.append('ref', ref.slice(0, 80));
      var url = '/api/famille.php';
      if(!(navigator.sendBeacon && navigator.sendBeacon(url, f))) fetch(url, { method:'POST', body:f, keepalive:true }).catch(function(){});
    }
  }catch(e){}
  // temps passé sur la page : compté seulement quand la page est visible, envoyé par minute (et ce qui reste quand on la quitte)
  try{
    var vu = 0, depuis = document.hidden ? 0 : Date.now();
    var joueur = function(){ try{ return String(JSON.parse(localStorage.getItem('famille-joueur') || 'null') || '').slice(0, 20); }catch(e){ return ''; } };
    var compte = function(){ if(depuis){ vu += (Date.now() - depuis) / 1000; depuis = Date.now(); } };
    var envoie = function(fin){ compte(); var s = Math.round(vu), p = joueur(); if(s < (fin ? 5 : 60) || !p) return; vu = 0;
      var g = new FormData(); g.append('action', 'temps'); g.append('page', location.pathname.slice(0, 120)); g.append('player', p); g.append('sec', String(Math.min(120, s)));
      if(!(navigator.sendBeacon && navigator.sendBeacon('/api/famille.php', g))) fetch('/api/famille.php', { method:'POST', body:g, keepalive:true }).catch(function(){}); };
    document.addEventListener('visibilitychange', function(){ if(document.hidden){ envoie(true); depuis = 0; } else depuis = Date.now(); });
    addEventListener('pagehide', function(){ envoie(true); });
    setInterval(function(){ envoie(false); }, 60000);
  }catch(e){}
})();
