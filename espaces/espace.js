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
  // « Reprendre » : les liens marqués data-cle="<clé localStorage>" ; on garde celui dont la sauvegarde est la plus récente
  var b = document.getElementById('reprendre'); if(!b) return;
  var mieux = null, t0 = 0;
  document.querySelectorAll('[data-cle]').forEach(function(a){
    try{ var d = JSON.parse(localStorage.getItem(a.getAttribute('data-cle')) || 'null'); var t = d && (d.t || 0); if(t > t0){ t0 = t; mieux = a; } }catch(e){}
  });
  if(mieux){ b.href = mieux.getAttribute('href'); b.querySelector('span').textContent = (b.getAttribute('data-mot') || 'Reprendre') + ' : ' + (mieux.getAttribute('data-titre') || mieux.textContent.trim().split('\n')[0]); b.hidden = false; }
})();
