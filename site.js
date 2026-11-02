/* Famille Missaoui : chargé par toutes les pages.
   1. installe le site comme une application (service worker) et prépare le bouton « Installer » ;
   2. note chaque ouverture de page dans le journal des visites (vu seulement par les parents, gardé 60 jours). */
(function(){
  'use strict';
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if('serviceWorker' in navigator && location.protocol === 'https:'){
    addEventListener('load', function(){ navigator.serviceWorker.register('/sw.js').catch(function(){}); });
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
      var ref = ''; try{ if(document.referrer){ var rh = new URL(document.referrer).host; if(rh !== location.host) ref = rh; } }catch(e){}
      var f = new FormData();
      f.append('action', 'visit'); f.append('page', page.slice(0, 120)); f.append('player', String(who).slice(0, 20));
      f.append('app', standalone ? '1' : '0'); f.append('screen', screen.width + 'x' + screen.height); f.append('ref', ref.slice(0, 80));
      var url = '/api/famille.php';
      if(!(navigator.sendBeacon && navigator.sendBeacon(url, f))) fetch(url, { method:'POST', body:f, keepalive:true }).catch(function(){});
    }
  }catch(e){}
})();
