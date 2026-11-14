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
       4. une étiquette « Explorateur du site : <nom> » en haut à droite, avec « Changer » pour revenir à l'accueil. */
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
    choisir: function(nom, type){
      try{
        Object.keys(sessionStorage).forEach(function(k){ if(k.indexOf(PFX) === 0) sessionStorage.removeItem(k); });
        sessionStorage.setItem('famille-profil', JSON.stringify({ nom:nom, type:type }));
        if(type === 'explo') sessionStorage.setItem(PFX + 'famille-joueur', JSON.stringify(nom));
        else if(VRAI) VRAI.setItem('famille-joueur', JSON.stringify(nom));
      }catch(e){}
    },
    oublier: function(){ try{ sessionStorage.removeItem('famille-profil'); Object.keys(sessionStorage).forEach(function(k){ if(k.indexOf(PFX) === 0) sessionStorage.removeItem(k); }); }catch(e){} document.cookie = 'famille_explo=; path=/; max-age=0; SameSite=Lax'; }
  };

  if(!explo){ document.cookie = 'famille_explo=; path=/; max-age=0; SameSite=Lax'; return; }
  document.cookie = 'famille_explo=' + encodeURIComponent(profil.nom) + '; path=/; SameSite=Lax';

  // 1. le bac à sable de localStorage
  try{
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

  // 4. l'étiquette « Explorateur du site »
  function etiquette(){
    if(document.getElementById('famExplo')) return;
    var n = profil.nom, k = n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    var img = ['anis', 'imen', 'essil', 'salma', 'amine'].indexOf(k) >= 0 ? '/jeux/avatars/' + k + '.webp' : '/jeux/avatars/mascotte-' + k + '.webp';
    var st = document.createElement('style');
    st.textContent = '#famExplo{position:fixed;top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));z-index:2147483000;display:flex;align-items:center;gap:8px;background:#0f766e;color:#fff;border-radius:999px;padding:4px 4px 4px 5px;box-shadow:0 3px 0 #0b5a54,0 6px 18px #0003;font:800 15px/1.1 Nunito,system-ui,sans-serif}' +
      '#famExplo img{width:36px;height:36px;border-radius:50%;object-fit:cover;background:#d7f1ee;border:2px solid #fff}#famExplo .t{display:flex;flex-direction:column}#famExplo small{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#bfeee8}' +
      '#famExplo a{min-height:40px;display:grid;place-items:center;padding:0 12px;border-radius:999px;background:#fff;color:#0f766e;text-decoration:none}#famExplo.mini .t,#famExplo.mini a{display:none}#famExplo button{all:unset;cursor:pointer;display:flex;align-items:center;gap:8px}';
    var d = document.createElement('div'); d.id = 'famExplo'; d.setAttribute('role', 'status');
    d.innerHTML = '<button type="button" aria-label="Réduire ou ouvrir l\'étiquette"><img alt="" src="' + img + '"><span class="t"><small>Explorateur du site</small><span></span></span></button><a href="/?profil">Changer</a>';
    d.querySelector('.t span').textContent = n;
    d.querySelector('button').onclick = function(){ d.classList.toggle('mini'); };
    document.head.appendChild(st); document.body.appendChild(d);
  }
  if(document.body) etiquette(); else document.addEventListener('DOMContentLoaded', etiquette);
})();
