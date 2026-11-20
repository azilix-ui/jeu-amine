/* « My First English » (20/11) : 5 cours d'anglais pour commencer, demandés par le papa : un dessin animé, des exercices,
   et la PRONONCIATION (l'enfant répète, la tablette écoute : type « repete » du moteur ollie/cours.js).
   Chaque page déclare window.LECON = { n, key, titre, sous, scenes:[{img, vid, txt}], mots:[[en, emoji, fr, aussi?]],
   phrases:[[mots…], fr], bonjour } puis charge ce fichier, puis le moteur. L'anglais est dit par Alice (ElevenLabs). */
(function(){
  'use strict';
  const L = window.LECON, M = L.mots, P = L.phrases;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const autres = (m, k) => shuffle(M.filter(x => x !== m)).slice(0, k);
  const E = t => `<i lang="en">${t}</i>`;
  const tous = (f, n) => shuffle(M).slice(0, n).map(f);
  /* 1. Écoute et trouve l'image */
  const ecoute = m => ({ t:'choix', q:'Écoute Ollie, et touche la bonne image.', voice:'Écoute, et touche la bonne image.', en:m[0],
    opts:shuffle([m, ...autres(m, 2)]).map(x => ({ v:x[0], html:`<span class="emo2">${x[1]}</span>` })), good:m[0], item:'e-' + m[0], indice:`Écoute encore (🔊) : « ${m[0]} », c'est « ${m[2]} ».`, expl:`« ${E(m[0])} », c'est <b>${m[2]}</b> ${m[1]}.` });
  /* 2. Lis le mot et trouve l'image */
  const lis = m => ({ t:'choix', q:`Lis le mot : <b lang="en" style="font-size:1.4em">${m[0]}</b>. Quelle image ?`, voice:'Lis le mot anglais, et trouve la bonne image.',
    opts:shuffle([m, ...autres(m, 2)]).map(x => ({ v:x[0], html:`<span class="emo2">${x[1]}</span>` })), good:m[0], item:'l-' + m[0], indice:`« ${m[0]} » veut dire « ${m[2]} ».`, expl:`${E(m[0])} = <b>${m[2]}</b> ${m[1]}.` });
  /* 3. Répète ! (prononciation) */
  const repete = m => ({ t:'repete', q:`Écoute Ollie, puis <b>répète</b> à voix haute : ${m[1]}`, voice:'Écoute, puis répète à voix haute.', en:m[0], aussi:m[3] || [], body:`<div class="emo">${m[1]}</div>`,
    item:'r-' + m[0], expl:`${E(m[0])} : ${m[2]}.` });
  /* 4. Le mot français → le mot anglais */
  const traduis = m => ({ t:'choix', q:`Comment dit-on <b>« ${m[2]} »</b> en anglais ?`, voice:`Comment dit-on ${m[2]} en anglais ?`, opts:shuffle([m, ...autres(m, 2)]).map(x => x[0]), good:m[0], item:'t-' + m[0],
    indice:`Pense au dessin animé, et à l'image ${m[1]}.`, expl:`« ${m[2]} » se dit ${E(m[0])}.` });
  /* 5. Épelle le mot */
  const epelle = m => ({ t:'epelle', q:`Écris en anglais : ${m[1]} <b>${m[2]}</b>`, voice:`Écris en anglais : ${m[2]}.`, en:m[0], word:m[0].toUpperCase(), item:'s-' + m[0],
    indice:`Écoute (🔊) et pense aux lettres : il y en a ${m[0].replace(/ /g, '').length}.`, expl:`${m[2]} : <b>${m[0].toUpperCase()}</b>.` });
  /* 6. La phrase dans l'ordre, puis la répéter */
  const ordre = p => ({ t:'ordre', q:`Remets la phrase en anglais dans l'ordre : <i>« ${p[1]} »</i>`, voice:`Remets la phrase anglaise dans l'ordre. Elle veut dire : ${p[1]}.`, words:p[0], fin:p[2] || '.', item:'o-' + p[0].join(' '),
    indice:`Commence par le mot avec une majuscule.`, expl:`${E(p[0].join(' ') + (p[2] || '.'))} : ${p[1]}.` });
  const dis = p => ({ t:'repete', q:`Répète la phrase : <i>« ${p[1]} »</i>`, voice:'Écoute, puis répète la phrase.', en:p[0].join(' '), aussi:p[3] || [], item:'d-' + p[0].join(' '), expl:`${E(p[0].join(' '))} : ${p[1]}.` });
  const CH = [
    { id:'ecoute', name:'Écoute et trouve', sub:'Ollie dit un mot', icon:'👂', edge:'#2a7fb4', make:() => tous(ecoute, 6),
      rule:`Écoute bien Ollie (🔊 pour réécouter), puis touche l'image du mot. Voici les mots :<div class="mots-l">${M.map(m => `<span>${m[1]} ${E(m[0])} <small>${m[2]}</small></span>`).join('')}</div>` },
    { id:'repete', name:'Répète !', sub:'la prononciation', icon:'🎤', edge:'#c2577a', make:() => tous(repete, 6),
      rule:`Touche 🔊 pour entendre le mot, puis 🎤 et <b>répète-le bien fort</b>. La tablette t'écoute ! Si elle n'entend pas bien, réessaie en parlant clairement, près de la tablette.` },
    { id:'lis', name:'Lis et trouve', sub:'le mot écrit', icon:'📖', edge:'#e0a100', make:() => tous(lis, 6),
      rule:`Lis le mot anglais et trouve son image. Attention : en anglais, on n'écrit pas comme on prononce !` },
    { id:'traduis', name:'En anglais, s\'il te plaît', sub:'français → anglais', icon:'🇬🇧', edge:'#147a66', make:() => tous(traduis, 6),
      rule:`Je te dis le mot en français : trouve-le en anglais.` },
    { id:'epelle', name:'Épelle le mot', sub:'les lettres', icon:'✍️', edge:'#7a4fe0', make:() => tous(epelle, 5),
      rule:`Écris le mot anglais lettre par lettre. Écoute-le (🔊) pour t'aider.` },
    { id:'phrases', name:'Mes premières phrases', sub:'dans l\'ordre, puis à voix haute', icon:'💬', edge:'#c8473a', make:() => shuffle(P).slice(0, 4).flatMap(p => [ordre(p), dis(p)]),
      rule:`Remets les mots dans l'ordre, puis <b>répète la phrase</b> à voix haute.<div class="mots-l">${P.map(p => `<span>${E(p[0].join(' ') + (p[2] || '.'))} <small>${p[1]}</small></span>`).join('')}</div>` },
  ];
  window.COURS = { voix:'ollie', key:L.key, track:L.key, retour:L.titre, titre:L.titre, sous:L.sous, controle:true, reflexion:1200,
    histoire:{ titre:L.histoire, scenes:L.scenes }, bonjour:L.bonjour, confetti:['🇬🇧', '⭐', '🎟️', '🎤', L.mots[0][1]], revoir:'Mes mots à revoir', CH,
    fiche:[{ h:'Mes mots', tag:'1', html:`<div class="mots-l">${M.map(m => `<span>${m[1]} ${E(m[0])} <small>${m[2]}</small></span>`).join('')}</div>`, lire:M.map(m => `${m[2]} : ${E(m[0])}.`).join(' ') },
      { h:'Mes phrases', tag:'2', html:`<div class="mots-l">${P.map(p => `<span>${E(p[0].join(' ') + (p[2] || '.'))} <small>${p[1]}</small></span>`).join('')}</div>`, lire:P.map(p => `${p[1]} : ${E(p[0].join(' '))}.`).join(' ') }] };
})();
