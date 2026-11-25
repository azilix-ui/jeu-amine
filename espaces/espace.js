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
    if(P && P.type === 'enfant' && r){ r.href = '/?profil'; r.textContent = '⇄ Changer d’avatar';
      // 20/11 (demande du papa) : l'enfant peut aussi aller sur l'accueil de toute la famille (sans être renvoyé ici)
      var m = document.createElement('a'); m.className = 'retour'; m.href = '/?accueil'; m.textContent = '🏠 Accueil de la famille'; r.parentNode.insertBefore(m, r.nextSibling); r.parentNode.style.display = 'flex'; r.parentNode.style.flexWrap = 'wrap'; r.parentNode.style.gap = '8px'; }
    // 26/11 (demande du papa) : Mechmoum, le réseau de la famille, depuis le haut de chaque espace
    if(r){ var mc = document.createElement('a'); mc.className = 'retour'; mc.href = '/reseau/'; mc.textContent = '🌼 Mechmoum';
      mc.style.cssText = 'background:linear-gradient(135deg,#0f766e,#1f5fbf);color:#fff;border-color:transparent';
      var apres = r.nextElementSibling && r.nextElementSibling.classList.contains('retour') ? r.nextElementSibling : r;
      if(!(P && P.type === 'enfant')) mc.style.marginLeft = '8px';
      r.parentNode.insertBefore(mc, apres.nextSibling); }
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

/* 20/11 (demande du papa : « Amine n'a pas accès à tous les jeux ») : en bas de chaque espace, TOUS les jeux de la famille,
   d'une seule liste (à compléter ici quand un jeu arrive), en grandes tuiles avec leur image (Amine ne lit pas encore). */
(function(){
  if(document.getElementById('tous-jeux')) return; var main = document.querySelector('main'), pied = document.querySelector('footer, .pied');
  var enf = (document.getElementById('defi') || {}).getAttribute ? document.getElementById('defi').getAttribute('data-enfant') : '';
  var J = [
    ['/jeux/legende-du-jasmin-3.html', '🌼', 'Le Jasmin'], ['/jeux/jasmin-stage2.html', '🏰', 'Jasmin · Stage 2'], ['/jeux/yajour.html', '🦸', 'Yajour'],
    ['/jeux/tebni.html', '🧱', 'Tebni'], ['/jeux/kassar.html', '💥', 'Kassar'], ['/jeux/khyout.html', '🧶', 'Khyout'], ['/jeux/kelma.html', '🔤', 'Kelma'],
    ['/jeux/koora.html', '⚽', 'Koora'], ['/jeux/zarbia.html', '🟥', 'Zarbia'], ['/jeux/serpent-arene.html', '🐍', 'L\'Arène'], ['/jeux/chkobba.html', '🃏', 'Chkobba'], ['/jeux/medina-express.html', '🚋', 'Médina Express'],
    ['/jeux/ma-houma.html', '🏘️', 'Ma Houma'], [enf === 'Essil' ? '/essil/les-ecuries.html' : '/jeux/les-ecuries.html', '🐴', 'Les Écuries'],
    ['/jeux/serpent-legendes.html', '🐉', 'Serpent Légendes'], ['/jeux/ludo-legendes.html', '🎲', 'Ludo'], ['/jeux/grimpe-glace.html', '❄️', 'Grimpe-Glace'],
    ['/jeux/atelier-du-jasmin.html', '🎨', 'Atelier du Jasmin'], ['/jeux/legende-du-jasmin-2.html', '🌸', 'Jasmin 2'], ['/mur.html', '📌', 'Le mur de la famille'], ['/eveil/', '🌙', 'Éveil religieux'] ];
  var st = document.createElement('style');
  st.textContent = '#tous-jeux{margin:28px auto 10px;max-width:1100px;padding:0 14px}#tous-jeux h2{font-size:clamp(22px,4vw,30px);margin:0 0 12px}'
    + '#tous-jeux .g{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}'
    + '#tous-jeux a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:104px;border-radius:20px;background:rgba(255,255,255,.92);color:#1d2740;text-decoration:none;font-weight:800;font-size:15px;text-align:center;padding:10px 6px;box-shadow:0 5px 0 rgba(0,0,0,.18)}'
    + '#tous-jeux a span{font-size:40px;line-height:1}#tous-jeux a:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.18)}';
  document.head.appendChild(st);
  var s = document.createElement('section'); s.id = 'tous-jeux';
  s.innerHTML = '<h2>🎮 Tous les jeux de la famille</h2><div class="g">' + J.map(function(j){ return '<a href="' + j[0] + '" data-dit="' + j[2] + '"><span>' + j[1] + '</span>' + j[2] + '</a>'; }).join('') + '</div>';
  if(main) main.appendChild(s); else if(pied) pied.parentNode.insertBefore(s, pied); else document.body.appendChild(s);
})();
