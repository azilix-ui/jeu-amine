/* « Salma & Pip » (21/11) : fabrique la leçon n° window.PIPN (données dans pip/lecons.js) pour le moteur commun ollie/cours.js.
   Le prof, c'est Pip, le bébé cigogne (dessin à nous). Le français est lu par Céline, l'anglais par Alice (api/voix.php).
   8 étapes : écoute, répète (la tablette écoute), lis, la règle (phrases à trous), écris, mes phrases (ordre puis à voix haute),
   le dialogue avec Pip, le bilan. Suivi : clé salma-pip<n> (Famille.track), carte « Salma & Pip » dans Progression. */
(function(){
  'use strict';
  const L = window.LECONS_PIP.find(x => x.n === window.PIPN), M = L.mots;
  const E = t => `<i lang="en">${t}</i>`;
  const shuffle = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const autres = (m, k) => shuffle(M.filter(x => x !== m)).slice(0, k);
  const img = x => ({ v:x[0], html:`<span class="emo2">${x[1]}</span>` });
  const enOpt = x => ({ v:x, html:`<span lang="en" class="en">${x}</span>` });
  const PIP = `<svg class="owl" viewBox="0 0 120 130" aria-hidden="true">
    <ellipse cx="60" cy="125" rx="34" ry="5" fill="#0002"/>
    <path d="M50 104 L46 124 M70 104 L74 124" stroke="#f08a24" stroke-width="5" stroke-linecap="round"/><path d="M40 124 h12 M68 124 h12" stroke="#f08a24" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="60" cy="78" rx="32" ry="30" fill="#fff" stroke="#e6ecf3" stroke-width="2"/>
    <path d="M30 74 q-10 16 4 30 q10 -6 10 -18 Z M90 74 q10 16 -4 30 q-10 -6 -10 -18 Z" fill="#fff" stroke="#e6ecf3" stroke-width="2"/><path d="M28 92 q4 10 8 12 l2 -8 Z M92 92 q-4 10 -8 12 l-2 -8 Z" fill="#222"/>
    <circle cx="60" cy="40" r="26" fill="#fff" stroke="#e6ecf3" stroke-width="2"/>
    <circle cx="50" cy="38" r="8" fill="#fff" stroke="#9cc9ff" stroke-width="2"/><circle cx="70" cy="38" r="8" fill="#fff" stroke="#9cc9ff" stroke-width="2"/>
    <circle cx="51" cy="39" r="5" fill="#2a7fd4"/><circle cx="69" cy="39" r="5" fill="#2a7fd4"/><circle cx="52.5" cy="37" r="1.8" fill="#fff"/><circle cx="70.5" cy="37" r="1.8" fill="#fff"/>
    <path d="M56 48 L60 47 L86 54 L60 56 Z" fill="#f08a24"/>
    <path d="M36 62 q24 12 48 0 l2 8 q-26 12 -52 0 Z" fill="#d7263d"/><path d="M44 66 v6 M54 68 v6 M64 68 v6 M74 66 v6" stroke="#fff" stroke-width="3"/><path d="M78 68 l6 18 l6 -2 l-6 -16 Z" fill="#d7263d"/>
  </svg>`;
  /* les questions */
  const ecoute = m => ({ t:'choix', q:'Écoute Pip, et touche la bonne image.', voice:'Écoute, et touche la bonne image.', en:m[0],
    opts:shuffle([m, ...autres(m, 3)]).map(img), good:m[0], item:'e-' + m[0], indice:`Réécoute (🔊) : « ${m[0]} », c'est « ${m[2]} ».`, expl:`${E(m[0])}, c'est <b>${m[2]}</b> ${m[1]}.` });
  const repete = m => ({ t:'repete', q:`Écoute Pip, puis <b>répète</b> à voix haute.`, voice:'Écoute, puis répète à voix haute.', en:m[0], aussi:m[3] || [], body:`<div class="emo">${m[1]}</div>`, item:'r-' + m[0], expl:`${E(m[0])} : ${m[2]}.` });
  const lis = m => ({ t:'choix', q:`Lis le mot : <b lang="en" class="en" style="font-size:1.4em">${m[0]}</b>. Quelle image ?`, voice:'Lis le mot anglais, et trouve la bonne image.',
    opts:shuffle([m, ...autres(m, 3)]).map(img), good:m[0], item:'l-' + m[0], indice:`« ${m[0]} » veut dire « ${m[2]} ».`, expl:`${E(m[0])} = <b>${m[2]}</b> ${m[1]}.` });
  const trou = g => ({ t:'choix', q:`Complète : <span lang="en" class="en">${g[0].replace('___', '<b class="trou">___</b>')}</span>`, voice:'Complète la phrase.',
    opts:shuffle([g[1], ...g[2]]).map(enOpt), good:g[1], cols:3, item:'g-' + g[0], expl:`${E(g[0].replace('___', g[1]))} ${g[3]}`, indice:g[3].replace(/<[^>]+>/g, '') });
  const ecris = m => ({ t:'epelle', q:`Écris en anglais : ${m[1]} <b>${m[2]}</b>`, voice:`Écris en anglais : ${m[2]}.`, en:m[0], word:m[0].toUpperCase(), item:'s-' + m[0],
    indice:`Écoute le mot (🔊).`, expl:`${m[2]} : <b>${m[0].toUpperCase()}</b>.` });
  const ordre = p => ({ t:'ordre', q:`Remets la phrase dans l'ordre : <i>« ${p[1]} »</i>`, voice:`Remets la phrase anglaise dans l'ordre. Elle veut dire : ${p[1]}`, words:p[0], fin:p[2] || '.', item:'o-' + p[0].join(' '),
    indice:'Commence par le mot qui a une majuscule.', expl:`${E(p[0].join(' ') + (p[2] || '.'))} : ${p[1]}.` });
  const dis = p => ({ t:'repete', q:`Dis la phrase : <i>« ${p[1]} »</i>`, voice:'Écoute, puis dis la phrase à voix haute.', en:p[0].join(' ') + (p[2] === '?' ? '?' : ''), item:'d-' + p[0].join(' '), expl:`${E(p[0].join(' '))} : ${p[1]}.` });
  const dialogue = d => ({ t:'choix', q:`Pip te dit : <b lang="en" class="en">${d[0]}</b><br>Que réponds-tu ?`, voice:'Pip te parle. Que réponds-tu ?', en:d[0],
    opts:shuffle([d[1], ...d[2]]).map(enOpt), good:d[1], cols:1, item:'q-' + d[0], expl:`${E(d[1])} ${d[3]}`, indice:d[3].replace(/<[^>]+>/g, '') });
  const motsL = `<div class="mots-l">${M.map(m => `<span>${m[1]} ${E(m[0])} <small>${m[2]}</small></span>`).join('')}</div>`;
  const CH = [
    { id:'ecoute', name:'Listen!', sub:'écoute et trouve', icon:'👂', edge:'#2a7fb4', make:() => shuffle(M).slice(0, 6).map(ecoute), rule:`Écoute bien Pip (🔊 pour réécouter), puis touche l'image. Les mots de la leçon :${motsL}` },
    { id:'repete', name:'Say it!', sub:'répète, la tablette écoute', icon:'🎤', edge:'#c2577a', make:() => shuffle(M).slice(0, 5).map(repete), rule:'Touche 🔊 pour entendre le mot, puis 🎤 et <b>répète-le bien fort</b>, près de la tablette.' },
    { id:'lis', name:'Read!', sub:'lis le mot', icon:'📖', edge:'#e0a100', make:() => shuffle(M).slice(0, 6).map(lis), rule:'Lis le mot anglais et trouve son image. Attention : en anglais, on n\'écrit pas comme on prononce !' },
    { id:'gram', name:'The rule', sub:L.sous.split(',')[0], icon:'📐', edge:'#1f6b44', make:() => shuffle(L.gram).map(trou), rule:L.regle },
    { id:'ecris', name:'Write!', sub:'écris le mot', icon:'✍️', edge:'#7a4fe0', make:() => shuffle(M.filter(m => /^[a-z ]+$/i.test(m[0]) && m[0].length <= 10)).slice(0, 5).map(ecris), rule:'Écris le mot anglais lettre par lettre. Écoute-le (🔊) pour t\'aider.' },
    { id:'phrases', name:'My sentences', sub:'dans l\'ordre, puis à voix haute', icon:'🧩', edge:'#c8473a', make:() => shuffle(L.phrases).slice(0, 3).flatMap(p => [ordre(p), dis(p)]),
      rule:`Remets les mots dans l'ordre, puis <b>dis la phrase</b>.<div class="mots-l">${L.phrases.map(p => `<span>${E(p[0].join(' ') + (p[2] || '.'))} <small>${p[1]}</small></span>`).join('')}</div>` },
    { id:'dialogue', name:'Talk with Pip', sub:'réponds à Pip', icon:'💬', edge:'#147a66', make:() => shuffle(L.dialogue).map(dialogue), rule:'Pip te parle en anglais. Écoute (🔊) et choisis la bonne réponse : comme une vraie conversation !' },
    { id:'bilan', name:'Final test', sub:'le bilan de la leçon', icon:'🏆', edge:'#1f3c88', make:() => shuffle([...shuffle(M).slice(0, 3).map(ecoute), ...shuffle(L.gram).slice(0, 3).map(trou), ...shuffle(M).slice(0, 2).map(lis), ...shuffle(L.dialogue).slice(0, 2).map(dialogue)]),
      rule:'Dix questions de toute la leçon. Trois étoiles si tout est juste du premier coup !' },
  ];
  window.COURS = { enfant:'Salma', prof:PIP, voix:'ollie', key:'salma-pip' + L.n, track:'salma-pip' + L.n, retour:'Mon chemin', titre:`${L.icon} ${L.titre}`, sous:`Salma & Pip · leçon ${L.n} / 10 · ${L.sous}`, controle:true, reflexion:1200,
    bandeau:`<div class="pipband"><span>🇬🇧 Salma & Pip · Lesson ${L.n}</span><a href="english-pip.html">Les leçons</a></div>`,
    histoire:{ titre:L.histoire, scenes:L.scenes.map((s, k) => ({ img:`pip/img/p${L.n}_${k}.webp`, vid:`pip/img/p${L.n}_${k}.mp4`, txt:s.txt })) },
    bonjour:`${E('Hello, Salma!')} C'est moi, Pip ! Aujourd'hui : <b>${L.sous}</b>. On regarde d'abord le dessin animé, puis 8 étapes. Chaque bonne réponse te donne un ticket 🎟️ pour Serpent Légendes.`,
    confetti:['🇬🇧', '⭐', '🎟️', '🕊️', L.icon], revoir:'Mes mots à revoir', CH,
    fiche:[{ h:'Mes mots', tag:'words', html:motsL, lire:M.map(m => `${m[2]} : ${E(m[0])}.`).join(' ') },
      { h:'La règle', tag:'grammar', html:L.regle, lire:L.regle },
      { h:'Mes phrases', tag:'sentences', html:`<div class="mots-l">${L.phrases.map(p => `<span>${E(p[0].join(' ') + (p[2] || '.'))} <small>${p[1]}</small></span>`).join('')}</div>`, lire:L.phrases.map(p => `${p[1]} : ${E(p[0].join(' '))}.`).join(' ') }] };
})();
