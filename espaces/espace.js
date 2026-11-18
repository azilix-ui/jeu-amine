/* Les espaces des enfants (18/11) : le film du haut (se montre quand il est prêt, se met en pause hors de l'écran),
   le moteur scroll-craft (glissement du monde, titres et cartes qui arrivent), et le bouton « Reprendre » :
   le cours le plus récemment travaillé, d'après les sauvegardes de la tablette (champ t). */
(function(){
  var v = document.querySelector('.monde video');
  if(v){
    var pret = function(){ v.classList.add('pret'); };
    v.addEventListener('playing', pret);
    if(v.readyState >= 3) pret();
    try{ new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting) v.play().catch(function(){}); else v.pause(); }); }).observe(v); }catch(e){}
  }
  if(window.ScrollCraft) try{ ScrollCraft.mount(document.body); }catch(e){}
  // 18/11 : l'enfant arrive ici depuis « Qui es-tu ? ». Le lien du haut devient « Changer d'avatar »,
  // et on lui montre son temps de jeu du jour (comme l'ancienne vue de l'accueil).
  try{
    var P = window.FamilleProfil && FamilleProfil.actuel(), d = document.getElementById('defi');
    var moi = P && P.type === 'enfant' && d && P.nom === d.getAttribute('data-enfant');
    var r = document.querySelector('.monde .retour');
    if(P && P.type === 'enfant' && r){ r.href = '/?profil'; r.textContent = '⇄ Changer d’avatar'; }
    if(moi){
      var dur = function(s){ var m = Math.max(0, Math.round(s / 60)); return m >= 60 ? Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') : m + ' min'; };
      var hm = function(s){ var p = String(s || '').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); };
      var lit = function(){
        fetch('/api/famille.php?action=ecran_tous', { cache:'no-store' }).then(function(x){ return x.ok ? x.json() : null; }).then(function(j){
          var e = j && j.enfants && j.enfants[P.nom]; if(!e) return;
          var n = new Date(), m = n.getHours() * 60 + n.getMinutes(), nuit = hm(e.nuit), matin = hm(e.matin);
          var dort = nuit > matin ? (m >= nuit || m < matin) : (m >= nuit && m < matin);
          var dm = e.demande, t = e.now || Date.now() / 1000, grace = dm && dm.statut === 'oui' ? (dm.maj + dm.min * 60) - t : 0;
          var reste = e.limite - e.utilise, txt;
          if(e.libre) txt = '🎮 Pas de limite de jeu aujourd’hui';
          else if(grace > 0) txt = '🎁 Temps en plus : encore ' + dur(grace);
          else if(dort) txt = '🌙 Pause de nuit : les jeux reviennent à ' + String(e.matin).replace(':', ' h ');
          else if(reste <= 0) txt = '⏳ Temps de jeu fini pour aujourd’hui (les cours restent ouverts)';
          else txt = '⏳ Il te reste ' + dur(reste) + ' de jeu aujourd’hui';
          var el = document.getElementById('temps');
          if(!el){ el = document.createElement('p'); el.id = 'temps'; el.className = 'temps'; var q = document.querySelector('.monde .qui'); q.parentNode.insertBefore(el, q.nextSibling); }
          el.textContent = txt;
        }).catch(function(){});
      };
      lit(); setInterval(lit, 60000);
    }
  }catch(e){}
  // « Reprendre » : les liens marqués data-cle="<clé localStorage>" ; on garde celui dont la sauvegarde est la plus récente
  var b = document.getElementById('reprendre'); if(!b) return;
  var mieux = null, t0 = 0;
  document.querySelectorAll('[data-cle]').forEach(function(a){
    try{ var d = JSON.parse(localStorage.getItem(a.getAttribute('data-cle')) || 'null'); var t = d && (d.t || 0); if(t > t0){ t0 = t; mieux = a; } }catch(e){}
  });
  if(mieux){ b.href = mieux.getAttribute('href'); b.querySelector('span').textContent = (b.getAttribute('data-mot') || 'Reprendre') + ' : ' + (mieux.getAttribute('data-titre') || mieux.textContent.trim().split('\n')[0]); b.hidden = false; }
})();
