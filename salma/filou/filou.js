/* « Salma & Filou » (24/11) : fabrique la leçon de français n° window.FILOUN (données dans filou/lecons.js) pour le moteur commun ollie/cours.js.
   Le prof, c'est Filou, le bébé fennec de Douz (dessin à nous). Tout est lu par Céline (api/voix.php), la dictée aussi.
   8 étapes : j'observe, je complète, je transforme, la dictée (écrire le mot entendu lettre par lettre), les phrases dans l'ordre,
   je lis à voix haute (la tablette écoute), les pièges, le bilan. Suivi : clé salma-fr<n>, carte « Salma & Filou » dans Progression. */
(function(){
  'use strict';
  const L = window.LECONS_FILOU.find(x => x.n === window.FILOUN);
  const shuffle = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sans = h => String(h).replace(/<[^>]+>/g, '');
  const opt = x => ({ v:x, html:`<span>${x}</span>` });
  const FILOU = `<svg class="owl" viewBox="0 0 120 130" aria-hidden="true">
    <ellipse cx="60" cy="125" rx="32" ry="5" fill="#0002"/>
    <path d="M30 40 L14 2 L48 30 Z M90 40 L106 2 L72 30 Z" fill="#e9c08a" stroke="#c99a5e" stroke-width="2"/><path d="M30 34 L20 10 L42 30 Z M90 34 L100 10 L78 30 Z" fill="#f6a3a3"/>
    <ellipse cx="60" cy="96" rx="26" ry="26" fill="#efcf9e" stroke="#c99a5e" stroke-width="2"/><ellipse cx="60" cy="102" rx="15" ry="17" fill="#fbecd3"/>
    <path d="M86 106 q22 -2 20 -24 q-6 10 -18 10 Z" fill="#efcf9e" stroke="#c99a5e" stroke-width="2"/><path d="M100 82 q6 -2 6 0 q-2 6 -6 4 Z" fill="#fff"/>
    <ellipse cx="60" cy="52" rx="30" ry="25" fill="#efcf9e" stroke="#c99a5e" stroke-width="2"/><ellipse cx="60" cy="62" rx="16" ry="11" fill="#fbecd3"/>
    <circle cx="48" cy="50" r="6.5" fill="#3a2410"/><circle cx="72" cy="50" r="6.5" fill="#3a2410"/><circle cx="50" cy="48" r="2.2" fill="#fff"/><circle cx="74" cy="48" r="2.2" fill="#fff"/>
    <ellipse cx="60" cy="60" rx="4.5" ry="3.2" fill="#2a1a0c"/><path d="M54 66 q6 5 12 0" stroke="#2a1a0c" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M46 30 q14 -12 28 0 l-2 -9 q-12 -6 -24 0 Z" fill="#d7263d"/><path d="M60 20 q6 -4 8 2" stroke="#1d1d1d" stroke-width="2" fill="none"/>
    <path d="M40 82 L80 112" stroke="#1f5fbf" stroke-width="5" stroke-linecap="round"/><rect x="72" y="106" width="18" height="14" rx="3" fill="#2b6fd6"/>
  </svg>`;
  /* les questions */
  const qcm = (pre, voix, id) => x => ({ t:'choix', q:pre + x[0], voice:voix + ' ' + sans(x[0]), opts:shuffle([x[1], ...x[2]]).map(opt), good:x[1], cols:x[1].length > 18 ? 1 : 3, item:id + '-' + sans(x[0]) + x[1],
    indice:sans(x[3]), expl:`Réponse : <b>${x[1]}</b>. ${x[3]}` });
  const trou = g => ({ t:'choix', q:`Complète : <b>${g[0].replace('___', '<b class="trou">___</b>')}</b>`, voice:'Complète la phrase : ' + g[0].replace('___', '…'),
    opts:shuffle([g[1], ...g[2]]).map(opt), good:g[1], cols:3, item:'g-' + g[0], expl:`${g[0].replace('___', '<b>' + g[1] + '</b>')} ${g[3]}`, indice:sans(g[3]) });
  const dictee = d => ({ t:'epelle', q:`Écoute Filou, et écris le mot : ${d[1]} <i>${d[2]}</i>`, voice:`Écris le mot.`, en:d[0], lang:'fr', word:d[0].toUpperCase(), item:'d-' + d[0],
    indice:'Réécoute le mot (🔊) et pense à la règle.', expl:`On écrit : <b>${d[0]}</b> (${d[2]}).` });
  const ordre = p => ({ t:'ordre', q:'Remets les mots dans l\'ordre pour faire une phrase.', voice:'Remets les mots dans l\'ordre pour faire une phrase.', words:p[0], fin:p[1], item:'o-' + p[0].join(' '),
    indice:'Commence par le mot qui a une majuscule.', expl:`${p[0].join(' ')}${p[1]}` });
  const lis = p => ({ t:'repete', q:'Lis la phrase à voix haute, bien distinctement.', voice:'Lis la phrase à voix haute.', en:p[0].join(' ') + (p[1] === '.' ? '' : ' ' + p[1]), lang:'fr', item:'l-' + p[0].join(' '), expl:`${p[0].join(' ')}${p[1]}` });
  const CH = [
    { id:'obs', name:'J\'observe', sub:'je regarde bien', icon:'🔎', edge:'#2a7fb4', make:() => shuffle(L.obs).map(qcm('', 'Regarde bien.', 'b')), rule:L.regle },
    { id:'gram', name:'Je complète', sub:'la règle en action', icon:'✏️', edge:'#1f6b44', make:() => shuffle(L.gram).map(trou), rule:L.regle },
    { id:'trans', name:'Je transforme', sub:'je change la phrase', icon:'🔄', edge:'#c2577a', make:() => shuffle(L.trans).map(qcm('', '', 't')), rule:L.regle },
    { id:'dictee', name:'La dictée', sub:'j\'écris le mot entendu', icon:'🖊️', edge:'#7a4fe0', make:() => shuffle(L.dictee).slice(0, 6).map(dictee), rule:'Écoute le mot (🔊 pour réécouter), puis écris-le lettre par lettre. Pense à la règle de la leçon !' },
    { id:'phrases', name:'Mes phrases', sub:'dans l\'ordre', icon:'🧩', edge:'#c8473a', make:() => shuffle(L.phrases).map(ordre), rule:'Remets les mots dans l\'ordre. La majuscule montre le premier mot, le point est à la fin.' },
    { id:'lis', name:'Je lis', sub:'à voix haute, la tablette écoute', icon:'🎤', edge:'#e0a100', make:() => shuffle(L.phrases).slice(0, 3).map(lis), rule:'Touche 🔊 pour entendre la phrase, puis 🎤 et <b>lis-la bien fort</b>, près de la tablette.' },
    { id:'pieges', name:'Les pièges', sub:'attention, ça se ressemble !', icon:'🪤', edge:'#147a66', make:() => shuffle(L.pieges).map(qcm('', 'Attention au piège !', 'p')), rule:'Ces questions ressemblent à des pièges : lis bien toutes les réponses avant de choisir.' },
    { id:'bilan', name:'Le bilan', sub:'toute la leçon', icon:'🏆', edge:'#1f3c88', make:() => shuffle([...shuffle(L.obs).slice(0, 2).map(qcm('', 'Regarde bien.', 'b')), ...shuffle(L.gram).slice(0, 3).map(trou), ...shuffle(L.trans).slice(0, 2).map(qcm('', '', 't')), ...shuffle(L.dictee).slice(0, 1).map(dictee), ...shuffle(L.pieges).slice(0, 2).map(qcm('', 'Attention au piège !', 'p'))]),
      rule:'Dix questions de toute la leçon. Trois étoiles si tout est juste du premier coup !' },
  ];
  window.COURS = { enfant:'Salma', prof:FILOU, voix:'ollie', key:'salma-fr' + L.n, track:'salma-fr' + L.n, retour:'Mon chemin', titre:`${L.icon} ${L.titre}`, sous:`Salma & Filou · leçon ${L.n} / 5 · ${L.sous}`, controle:true, reflexion:1200,
    bandeau:`<div class="pipband"><span>📒 Salma & Filou · Leçon ${L.n}</span><a href="francais-filou.html">Les leçons</a></div>`,
    histoire:{ titre:L.histoire, scenes:L.scenes.map((s, k) => ({ img:`filou/img/f${L.n}_${k}.webp`, vid:`filou/img/f${L.n}_${k}.mp4`, txt:s.txt })) },
    bonjour:`Bonjour Salma ! C'est moi, Filou, le petit fennec ! Aujourd'hui : <b>${L.sous}</b>. On regarde d'abord le dessin animé, puis 8 étapes. Chaque bonne réponse te donne un ticket 🎟️ pour Serpent Légendes.`,
    confetti:['📒', '⭐', '🎟️', '🦊', L.icon], revoir:'Mes mots à revoir', CH,
    fiche:[{ h:'La règle', tag:'règle', html:L.regle, lire:L.regle },
      { h:'Mes mots', tag:'dictée', html:`<div class="mots-l">${L.dictee.map(d => `<span>${d[1]} <b>${d[0]}</b> <small>${d[2]}</small></span>`).join('')}</div>`, lire:L.dictee.map(d => `${d[0]}.`).join(' ') },
      { h:'Mes phrases', tag:'phrases', html:`<div class="mots-l">${L.phrases.map(p => `<span>${p[0].join(' ')}${p[1]}</span>`).join('')}</div>`, lire:L.phrases.map(p => p[0].join(' ') + p[1]).join(' ') }] };
})();
