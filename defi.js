/*
 * Famille Missaoui — le défi du jour (13/11/2026).
 * Chaque jour, une petite mission pour Essil, Salma et Amine, la même sur toutes les tablettes (tirée au hasard à partir de la date) :
 * Amine 4 questions (compter, lettres, couleurs, sons), Salma 5 (soustraction, conjugaison, anglais, monnaie, géométrie),
 * Essil 5 (allemand, latin, calcul, fractions). On recommence une question ratée jusqu'à la trouver.
 * Défi réussi : 5 tickets du savoir 🎟️ (Boutique du savoir de Serpent Légendes) + 10 minutes de jeu ce jour-là (temps d'écran),
 * et 10 tickets de plus tous les 7 jours d'affilée.
 * Sauvegarde : localStorage « defi:<Prénom> » = {jours:{AAAA-MM-JJ:{ok, essais}}, tickets, serie, record}, envoyée au serveur (cours « defi »).
 * Usage : <div id="defi" data-enfant="Amine"></div><script src="/defi.js" defer></script> (dans l'espace de l'enfant, avec famille.js).
 */
(function(){
  'use strict';
  var box = document.getElementById('defi'); if(!box) return;
  var QUI = box.dataset.enfant, CLE = 'defi:' + QUI;
  var TICKETS = 5, BONUS_SERIE = 10;
  function jour(d){ d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function get(){ try{ return JSON.parse(localStorage.getItem(CLE)) || {}; }catch(e){ return {}; } }
  function put(v){ try{ localStorage.setItem(CLE, JSON.stringify(v)); }catch(e){} }
  // un hasard qui donne la même suite pour une même date et un même enfant (le défi est le même sur toutes les tablettes)
  function graine(s){ var h = 2166136261; for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return function(){ h += 0x6D2B79F5; var t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var R = graine(QUI + jour());
  function rnd(a, b){ return a + Math.floor(R() * (b - a + 1)); }
  function pick(a){ return a[Math.floor(R() * a.length)]; }
  function mele(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(R() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pres(v, d){ var s = [v + 1, v - 1, v + d, v - d, v + 10, v - 10].filter(function(x){ return x >= 0 && x !== v; }); return mele(s.filter(function(x, i){ return s.indexOf(x) === i; })).slice(0, 3); }
  function nb(v, d){ return mele([v].concat(pres(v, d))).map(String); }

  var Q = {
    Amine: [
      function(){ var n = rnd(2, 9), e = pick(['🍊', '🐪', '⭐', '🌼', '🐟', '🍉', '🎈', '🐞']); return { q:'Combien vois-tu de ' + e + ' ?<span class="df-em">' + e.repeat(n) + '</span>', a:String(n), o:mele([n].concat(pres(n, 2).slice(0, 2)).filter(function(x){ return x > 0; })).map(String), dit:'Combien vois-tu de dessins ?' }; },
      function(){ var L = pick(['A', 'M', 'I', 'N', 'E', 'S', 'O', 'T', 'L', 'R', 'P', 'U']); return { q:'Touche la lettre <b>' + L + '</b>', a:L, o:mele([L].concat(mele('ABCDEFGIJLMNOPRSTUV'.split('').filter(function(c){ return c !== L; })).slice(0, 3))), dit:'Touche la lettre ' + L }; },
      function(){ var a = rnd(1, 5), b = rnd(1, 4); return { q:'<span class="df-em">' + '🪙'.repeat(a) + ' + ' + '🪙'.repeat(b) + '</span>Ça fait combien ?', a:String(a + b), o:mele([a + b].concat(pres(a + b, 2).slice(0, 2)).filter(function(x){ return x > 0; })).map(String), dit:a + ' pièces plus ' + b + ' pièces, ça fait combien ?' }; },
      function(){ var c = pick([['rouge', '🔴'], ['bleu', '🔵'], ['vert', '🟢'], ['jaune', '🟡'], ['violet', '🟣'], ['orange', '🟠']]); return { q:'Touche la couleur <b>' + c[0] + '</b>', a:c[1], o:mele(['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'].filter(function(x){ return x !== c[1]; })).slice(0, 3).concat([c[1]]).sort(function(){ return R() - .5; }), dit:'Touche la couleur ' + c[0] }; },
      function(){ var m = pick([['🐟', 'POISSON', 'P'], ['🍉', 'MELON', 'M'], ['🦁', 'LION', 'L'], ['🐱', 'CHAT', 'C'], ['☀️', 'SOLEIL', 'S'], ['🚂', 'TRAIN', 'T'], ['🍎', 'POMME', 'P'], ['🌙', 'LUNE', 'L'], ['🦋', 'PAPILLON', 'P'], ['🐭', 'SOURIS', 'S'], ['🥕', 'RADIS', 'R'], ['🦊', 'RENARD', 'R']]);
        return { q:'<span class="df-em">' + m[0] + '</span>Par quelle lettre commence <b>' + m[1].toLowerCase() + '</b> ?', a:m[2], o:mele([m[2]].concat(mele('ABDFLMNPRST'.split('').filter(function(c){ return c !== m[2]; })).slice(0, 2))), dit:'Par quelle lettre commence le mot ' + m[1].toLowerCase() + ' ?' }; },
      function(){ var n = rnd(1, 9); return { q:'Quel nombre vient <b>après ' + n + '</b> ?', a:String(n + 1), o:mele([n + 1, n - 1 < 0 ? n + 2 : n - 1, n + 3]).map(String), dit:'Quel nombre vient après ' + n + ' ?' }; }
    ],
    Salma: [
      function(){ var a = rnd(3, 9) * 10 + rnd(0, 9), b = rnd(11, 39), r = a - b; return { q:a + ' − ' + b + ' = ?', a:String(r), o:nb(r, 10) }; },
      function(){ var a = rnd(2, 9), b = rnd(2, 9); return { q:a + ' × ' + b + ' = ?', a:String(a * b), o:nb(a * b, a) }; },
      function(){ return pick([{ q:'Nous ___ (finir)', a:'finissons', o:['finons', 'finissons', 'finisons', 'finissez'] }, { q:'Je ___ (prendre)', a:'prends', o:['prend', 'prends', 'prendre', 'prent'] }, { q:'Ils ___ (aller)', a:'vont', o:['allent', 'vont', 'vas', 'allons'] }, { q:'Vous ___ (faire)', a:'faites', o:['faisez', 'faites', 'faitent', 'fesez'] }, { q:'Nous ___ (manger)', a:'mangeons', o:['mangons', 'mangeons', 'mangeont', 'mangez'] }, { q:'Tu ___ (pouvoir)', a:'peux', o:['peut', 'peux', 'pouves', 'peus'] }, { q:'Elles ___ (être)', a:'sont', o:['sont', 'ont', 'étent', 'est'] }, { q:'Je ___ (avoir)', a:'ai', o:['ai', 'as', 'a', 'ais'] }]); },
      function(){ return pick([{ q:'« cat » en français ?', a:'le chat', o:['le chien', 'le chat', 'la vache', 'le cheval'] }, { q:'« blue » en français ?', a:'bleu', o:['rouge', 'vert', 'bleu', 'jaune'] }, { q:'« seven » = ?', a:'7', o:['6', '7', '8', '11'] }, { q:'« Monday » = ?', a:'lundi', o:['lundi', 'mardi', 'dimanche', 'samedi'] }, { q:'« rain » = ?', a:'la pluie', o:['le soleil', 'la pluie', 'la neige', 'le vent'] }, { q:'« apple » = ?', a:'la pomme', o:['la poire', 'la pomme', 'la banane', 'l\'orange'] }, { q:'« horse » = ?', a:'le cheval', o:['le cheval', 'la maison', 'le chien', 'l\'oiseau'] }]); },
      function(){ return pick([{ q:'1 € = combien de centimes ?', a:'100', o:['10', '100', '1000', '50'] }, { q:'Combien de pièces de 10 c pour faire 1 € ?', a:'10', o:['5', '10', '20', '100'] }, { q:'2 € 50 = combien de centimes ?', a:'250', o:['25', '205', '250', '2050'] }, { q:'Combien de pièces de 50 c dans 2 € ?', a:'4', o:['2', '4', '5', '10'] }, { q:'Combien de côtés a un hexagone ?', a:'6', o:['5', '6', '7', '8'] }, { q:'Un carré a combien d\'angles droits ?', a:'4', o:['1', '2', '3', '4'] }]); }
    ],
    Essil: [
      function(){ return pick([{ q:'der Hund = ?', a:'le chien', o:['le chat', 'le chien', 'la maison', 'l\'arbre'] }, { q:'die Katze = ?', a:'le chat', o:['le chat', 'la vache', 'la chaise', 'le chien'] }, { q:'das Haus = ?', a:'la maison', o:['la main', 'la maison', 'le chapeau', 'la ville'] }, { q:'Danke = ?', a:'merci', o:['bonjour', 'merci', 'au revoir', 'pardon'] }, { q:'der Bahnhof = ?', a:'la gare', o:['la gare', 'le pont', 'la banque', 'le port'] }, { q:'die Schule = ?', a:'l\'école', o:['la chaussure', 'l\'école', 'la neige', 'la soupe'] }, { q:'« Ich ___ zwölf Jahre alt. »', a:'bin', o:['bin', 'bist', 'ist', 'sind'] }, { q:'« Wir ___ Deutsch. »', a:'lernen', o:['lerne', 'lernst', 'lernen', 'lernt'] }]); },
      function(){ return pick([{ q:'rosa = ?', a:'la rose', o:['la rose', 'la route', 'la reine', 'le roi'] }, { q:'aqua = ?', a:'l\'eau', o:['l\'air', 'l\'eau', 'la terre', 'le feu'] }, { q:'puella = ?', a:'la jeune fille', o:['le garçon', 'la jeune fille', 'la mère', 'la poule'] }, { q:'dominus = ?', a:'le maître', o:['le maître', 'la maison', 'le dieu', 'l\'esclave'] }, { q:'via = ?', a:'la route', o:['la vie', 'la route', 'la ville', 'le vin'] }, { q:'« amo » = ?', a:'j\'aime', o:['j\'aime', 'tu aimes', 'il aime', 'aimer'] }]); },
      function(){ var a = rnd(12, 25), b = rnd(3, 9); return { q:a + ' × ' + b + ' = ?', a:String(a * b), o:nb(a * b, b) }; },
      function(){ var d = pick([2, 3, 4, 5, 6, 8]), n = rnd(1, d - 1), k = rnd(2, 4); return { q:n + '/' + d + ' = ?/' + (d * k), a:String(n * k), o:mele([n * k, n * k + 1, n + k, n * k - 1].filter(function(x, i, s){ return x > 0 && s.indexOf(x) === i; })).map(String) }; },
      function(){ var a = rnd(-9, 9), b = rnd(-9, 9); return { q:'(' + a + ') + (' + b + ') = ?', a:String(a + b), o:mele([a + b, a - b, -(a + b), a + b + 1].filter(function(x, i, s){ return s.indexOf(x) === i; })).map(String) }; }
    ]
  };
  var NB = QUI === 'Amine' ? 4 : 5;
  var ordre = mele(Q[QUI].map(function(_, i){ return i; }));
  var QS = []; for(var i = 0; i < NB; i++) QS.push(Q[QUI][ordre[i % ordre.length]]());
  QS.forEach(function(q){ if(q.o.indexOf(q.a) < 0) q.o[0] = q.a; q.o = q.o.filter(function(x, i, s){ return s.indexOf(x) === i; }); });

  function parle(t){ if(QUI !== 'Amine' || !window.speechSynthesis || !t) return; try{ speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t.replace(/<[^>]+>/g, ' ')); u.lang = 'fr-FR'; u.rate = .9; speechSynthesis.speak(u); }catch(e){} }
  function serie(d){ var n = 0, t = new Date(); for(;;){ if(d.jours && d.jours[jour(t)] && d.jours[jour(t)].ok){ n++; t.setDate(t.getDate() - 1); } else break; } return n; }

  var st = document.createElement('style');
  st.textContent = '#defi{--df:#ff8c1a}.df-carte{display:flex;align-items:center;gap:16px;flex-wrap:wrap;border-radius:26px;padding:18px 20px;background:linear-gradient(135deg,#fff4dc,#ffe2b8);color:#3a2600;box-shadow:0 6px 0 #e3b25c;margin:0 0 22px}' +
    '.df-carte .df-ico{font-size:44px;line-height:1}.df-carte .df-t{flex:1 1 220px;min-width:0}.df-carte b{display:block;font-size:22px;font-family:var(--display,inherit)}.df-carte small{font-size:15px;opacity:.85}' +
    '.df-go{font:inherit;font-weight:800;font-size:19px;min-height:54px;padding:0 22px;border:0;border-radius:18px;background:#ff8c1a;color:#fff;box-shadow:0 5px 0 #c4620a;cursor:pointer}.df-go:active{transform:translateY(3px);box-shadow:0 2px 0 #c4620a}' +
    '.df-fait{background:linear-gradient(135deg,#e3f4ea,#c8ecd6);color:#123d27;box-shadow:0 6px 0 #8ccaa4}' +
    '.df-back{position:fixed;inset:0;z-index:100000;background:rgba(16,12,32,.75);display:grid;place-items:center;padding:16px;overflow:auto}' +
    '.df-box{background:#fffdf7;color:#1b1533;border-radius:28px;padding:22px;width:min(560px,100%);display:flex;flex-direction:column;gap:16px;box-shadow:0 20px 60px rgba(0,0,0,.4);font-family:Fredoka,Nunito,system-ui,sans-serif}' +
    '.df-barre{display:flex;gap:6px}.df-barre i{flex:1;height:10px;border-radius:5px;background:#eee6d6}.df-barre i.ok{background:#2e9e6e}.df-barre i.la{background:#ff8c1a}' +
    '.df-q{font-size:clamp(24px,5vw,32px);font-weight:700;text-align:center;line-height:1.3}.df-em{display:block;font-size:clamp(30px,8vw,44px);letter-spacing:4px;margin:8px 0;line-height:1.3}' +
    '.df-o{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.df-o button{font:inherit;font-size:clamp(20px,4.5vw,26px);font-weight:700;min-height:64px;border:0;border-radius:18px;background:#efe9fb;color:#1b1533;cursor:pointer;box-shadow:0 5px 0 #d2c6ee;touch-action:manipulation}' +
    '.df-o button.non{background:#fde8eb;box-shadow:0 5px 0 #f2b8c1;animation:dfNon .35s}.df-o button.oui{background:#bff0d2;box-shadow:0 5px 0 #6fc796}@keyframes dfNon{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}' +
    '.df-fin{text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center}.df-fin .gros{font-size:72px;line-height:1}.df-fin h3{margin:0;font-size:28px}.df-fin p{margin:0;font-size:19px;line-height:1.4}' +
    '.df-ferme{align-self:center;background:none;border:0;color:#6b6290;font:inherit;font-size:16px;cursor:pointer;padding:6px 12px}.df-haut{background:none;border:0;font-size:26px;cursor:pointer;align-self:center}';
  document.head.appendChild(st);

  function carte(){
    var d = get(), fait = d.jours && d.jours[jour()] && d.jours[jour()].ok, s = serie(d);
    box.innerHTML = '<div class="df-carte' + (fait ? ' df-fait' : '') + '"><span class="df-ico" aria-hidden="true">' + (fait ? '🏅' : '🎯') + '</span><span class="df-t"><b>' + (fait ? 'Défi du jour réussi !' : 'Ton défi du jour') + '</b><small>' +
      (fait ? '+' + TICKETS + ' tickets 🎟️ et 10 minutes de jeu en plus aujourd\'hui. Reviens demain pour un nouveau défi !' : NB + ' questions rapides : gagne ' + TICKETS + ' tickets 🎟️ et 10 minutes de jeu.') +
      (s > 1 ? ' · 🔥 ' + s + ' jours d\'affilée' : '') + '</small></span>' + (fait ? '' : '<button class="df-go" type="button">C\'est parti !</button>') + '</div>';
    var b = box.querySelector('.df-go'); if(b) b.onclick = joue;
  }
  function joue(){
    var k = 0, essais = 0, back = document.createElement('div'); back.className = 'df-back';
    document.body.appendChild(back);
    function montre(){
      var q = QS[k];
      back.innerHTML = '<div class="df-box" role="dialog" aria-modal="true" aria-label="Défi du jour"><div class="df-barre">' + QS.map(function(_, i){ return '<i class="' + (i < k ? 'ok' : i === k ? 'la' : '') + '"></i>'; }).join('') + '</div>' +
        '<div class="df-q">' + q.q + '</div>' + (QUI === 'Amine' ? '<button class="df-haut" type="button" aria-label="Écouter la question">🔊</button>' : '') +
        '<div class="df-o">' + q.o.map(function(o){ return '<button type="button">' + o + '</button>'; }).join('') + '</div><button class="df-ferme" type="button">Plus tard</button></div>';
      back.querySelectorAll('.df-o button').forEach(function(b){ b.onclick = function(){
        if(b.textContent === q.a){ b.classList.add('oui'); k++; setTimeout(function(){ k < QS.length ? montre() : fini(); }, 450); }
        else { essais++; b.classList.add('non'); b.disabled = true; }
      }; });
      back.querySelector('.df-ferme').onclick = function(){ back.remove(); try{ speechSynthesis.cancel(); }catch(e){} };
      var h = back.querySelector('.df-haut'); if(h) h.onclick = function(){ parle(q.dit || q.q); };
      parle(q.dit || q.q);
    }
    function fini(){
      var d = get(); d.jours = d.jours || {}; var deja = d.jours[jour()] && d.jours[jour()].ok;
      d.jours[jour()] = { ok:true, essais:essais };
      var s = serie(d), gain = 0;
      if(!deja){ gain = TICKETS + (s > 0 && s % 7 === 0 ? BONUS_SERIE : 0); d.tickets = (d.tickets || 0) + gain; }
      d.serie = s; d.record = Math.max(d.record || 0, s);
      Object.keys(d.jours).sort().slice(0, -60).forEach(function(j){ delete d.jours[j]; });   // on garde 60 jours
      put(d);
      back.innerHTML = '<div class="df-box"><div class="df-fin"><span class="gros">🏅</span><h3>Bravo ' + QUI + ' !</h3><p>Défi du jour réussi' + (essais ? '' : ' du premier coup') + ' !<br><b>+' + (gain || TICKETS) + ' tickets 🎟️</b> pour la Boutique du savoir<br>et <b>10 minutes de jeu</b> en plus aujourd\'hui.' +
        (s > 1 ? '<br>🔥 ' + s + ' jours d\'affilée' + (s % 7 === 0 ? ' : +' + BONUS_SERIE + ' tickets de bonus !' : '') : '') + '</p><button class="df-go" type="button">Super !</button></div></div>';
      parle('Bravo ' + QUI + ' ! Défi réussi !');
      back.querySelector('.df-go').onclick = function(){ back.remove(); carte(); };
    }
    montre();
  }
  // relit le défi sur le serveur (fait sur une autre tablette ?) puis l'envoie régulièrement
  if(window.Famille){
    Famille.load('defi', QUI).then(function(srv){ var s = srv && srv[CLE]; if(s && s.jours){ var d = get(); d.jours = Object.assign({}, s.jours, d.jours || {}); d.tickets = Math.max(d.tickets || 0, s.tickets || 0); d.record = Math.max(d.record || 0, s.record || 0); put(d); carte(); } });
    Famille.track('defi', QUI, [CLE]);
  }
  carte();
})();
