/* English B2 · Essil (21/11) : fabrique le cours n° window.B2N (données dans lecons.js) pour le moteur commun salma/ollie/cours.js.
   La prof : Miss Yasmine, une fennec à lunettes (dessin à nous). Le français est lu par Céline, l'anglais par Alice (ElevenLabs, api/voix.php).
   Étapes : grammaire (phrases à trous), conjugaison (épeler la forme), compréhension du dessin animé, vocabulaire, phrases dans l'ordre,
   à voix haute (la tablette écoute), chasse aux erreurs, et le bilan. Suivi : clé essil-en<n> (Famille.track), carte dans Progression. */
(function(){
  'use strict';
  const L = window.LECONS_B2.find(x => x.n === window.B2N);
  const E = t => `<i lang="en">${t}</i>`;
  const shuffle = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const enOpt = x => ({ v:x, html:`<span lang="en" class="en">${x}</span>` });
  /* 22/11 (remarque du papa) : dans les règles, les tableaux et la conjugaison, les mots anglais écrits au milieu du français
     (present simple, always, she / grow…) étaient lus par la voix française. tagEN les entoure de <span lang="en"> (sans changer l'affichage) :
     le moteur des cours les fait lire par Alice. On ne touche pas aux balises ni à ce qui a déjà une langue. */
  const MOTS_EN = ['present simple', 'present continuous', 'past simple', 'past continuous', 'present perfect', 'past perfect', 'future continuous', 'be going to', 'going to',
    'phrasal verbs', 'phrasal verb', 'will be', 'would have', 'have to', "don't have to", "mustn't", "shouldn't", "can't", "didn't", "doesn't", "don't", "isn't", "haven't", 'be able to',
    'every day', 'twice a week', 'right now', 'at the moment', 'this week', 'last week', 'in 2019', 'for three years', 'since 2020', 'by the time', 'as if', 'that day', 'the next day',
    'told me', 'he said he', 'she said she', 'pick up', 'set up', 'hand out', 'turn up', 'give up', 'find out', 'look after', 'run out of', 'told her to watch', 'has gone yesterday', 'I am knowing',
    'is made', 'was found', 'has been stolen', 'had been made', 'is being cleaned', 'was being cleaned', 'will be sold', 'must be kept', 'have/has', 'was/were', 'be + V-ing', 'V-ing',
    'always', 'usually', 'often', 'now', 'today', 'tomorrow', 'yesterday', 'know', 'believe', 'love', 'want', 'understand', 'seem', 'belong', 'spend', 'spent', 'swim', 'swam', 'buy', 'bought',
    'for', 'since', 'ever', 'never', 'already', 'yet', 'just', 'ago', 'before', 'after', 'If', 'if', 'by', 'will', 'would', 'can', 'could', 'must', 'should', 'may', 'might', 'had', 'has', 'have', 'be',
    'said', 'told', 'asked', 'say', 'tell', 'present', 'past', 'then', 'here', 'there', 'this', 'that', 'who', 'which', 'whose', 'where', 'participle',
    'grow', 'watch', 'like', 'listen', 'study', 'play', 'go', 'catch', 'sleep', 'write', 'take', 'finish', 'keep', 'see', 'leave', 'eat', 'forget', 'find', 'run', 'ride', 'practise', 'meet', 'rain',
    'fly', 'pass', 'steal', 'sell', 'clean', 'make', 'do', 'lose', 'rest', 'she', 'he', 'they', 'you', 'we', 'I', 'it', 'am', 'is', 'are', 'was', 'were', 'wait', 'seen', 'her', 'to'];
  const RE_EN = new RegExp(`(?<![\\p{L}'’])(?:${[...MOTS_EN].sort((a, b) => b.length - a.length).map(m => m.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')).join('|')})(?![\\p{L}'’])`, 'giu');
  const tagEN = html => String(html).split(/(<(\w+)[^>]*\blang="?(?:en|de|la|fr)"?[^>]*>[\s\S]*?<\/\2>|<[^>]+>)/).map((p, i, a) => {
    if(p === undefined || i % 3 === 2) return '';   // le nom de balise capturé
    if(i % 3 === 1) return p;                        // une balise, ou un passage qui a déjà sa langue
    return p.replace(RE_EN, m => `<span lang="en">${m}</span>`); }).join('')
    .replace(/<\/span>(\s*[,/+]?\s*)<span lang="en">/g, '$1');   // « always, usually, often » : un seul morceau lu d'un trait
  // la consigne de conjugaison : « present simple, négatif · they / like » → l'anglais lu en anglais, « / » devient une virgule
  const conjLu = t => tagEN(t.replace(/\s*\/\s*/g, ', ').replace(/\s*·\s*/g, ' : ').replace(/\(3e pers\.\)/, '(troisième personne)'));
  const IMG = 'english/img/';
  const MISS = `<svg class="owl" viewBox="0 0 120 130" aria-hidden="true">
    <ellipse cx="60" cy="124" rx="38" ry="5" fill="#0002"/>
    <path d="M18 58 L8 8 L44 40 Z M102 58 L112 8 L76 40 Z" fill="#e8c48f"/><path d="M20 50 L14 18 L38 40 Z M100 50 L106 18 L82 40 Z" fill="#f6d7d0"/>
    <ellipse cx="60" cy="68" rx="38" ry="34" fill="#efcf9c"/><ellipse cx="60" cy="82" rx="22" ry="18" fill="#fff4e2"/>
    <circle cx="45" cy="64" r="12" fill="#fff" stroke="#1f3c88" stroke-width="4"/><circle cx="75" cy="64" r="12" fill="#fff" stroke="#1f3c88" stroke-width="4"/><path d="M57 64 h6" stroke="#1f3c88" stroke-width="4"/>
    <circle cx="46" cy="65" r="5" fill="#2b1d12"/><circle cx="74" cy="65" r="5" fill="#2b1d12"/><circle cx="47.5" cy="63" r="1.6" fill="#fff"/><circle cx="75.5" cy="63" r="1.6" fill="#fff"/>
    <ellipse cx="60" cy="80" rx="5" ry="4" fill="#2b1d12"/><path d="M52 88 q8 6 16 0" stroke="#2b1d12" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M30 100 q30 18 60 0 L94 122 L26 122 Z" fill="#d7263d"/><path d="M48 104 l12 10 l12 -10" stroke="#fff" stroke-width="3" fill="none"/>
    <circle cx="86" cy="42" r="6" fill="#fff"/><circle cx="86" cy="42" r="2.5" fill="#ffd23f"/>
  </svg>`;
  const qGap = g => ({ t:'choix', q:`Complète : <span lang="en" class="en">${g[0].replace('___', '<b class="trou">___</b>')}</span>`, voice:'Complète la phrase.',
    opts:shuffle([g[1], ...g[2]]).map(enOpt), good:g[1], cols:1, item:'g-' + g[0], expl:`${E(g[0].replace('___', g[1]))} ${tagEN(g[3])}`, indice:tagEN(g[3]) });
  const qConj = c => ({ t:'epelle', q:`Écris la forme : <b>${tagEN(c[0])}</b>`, voice:`Écris la forme : ${conjLu(c[0])}.`, word:c[1], item:'c-' + c[0], expl:`${conjLu(c[0])} : ${E(c[1].toLowerCase())}.` });
  const qCompr = c => ({ t:'choix', q:`${E(c[0])}`, voice:E(c[0]), opts:shuffle([c[1], ...c[2]]).map(enOpt), good:c[1], cols:1, item:'q-' + c[0], expl:`${E(c[1])}`, indice:'Revois le dessin animé si tu as un doute (bouton 🎬 sur le chemin).' });
  const qVocab = (v, k) => k % 2 ? ({ t:'choix', q:`Que veut dire ${E('<b>' + v[0] + '</b>')} ?`, voice:`Que veut dire : ${E(v[0])} ?`, en:v[0], opts:shuffle([v[1], ...shuffle(L.vocab.filter(x => x !== v).map(x => x[1])).slice(0, 2)]), good:v[1], cols:1, item:'v-' + v[0], expl:`${E(v[0])} = <b>${v[1]}</b>.` })
    : ({ t:'choix', q:`Comment dit-on <b>« ${v[1]} »</b> en anglais ?`, voice:`Comment dit-on ${v[1]} en anglais ?`, opts:shuffle([v, ...shuffle(L.vocab.filter(x => x !== v)).slice(0, 2)]).map(x => enOpt(x[0])), good:v[0], cols:1, item:'v-' + v[0], expl:`${v[1]} = ${E(v[0])}.` });
  const qOrdre = o => ({ t:'ordre', q:`Remets dans l'ordre : <i>« ${o[1]} »</i>`, voice:`Remets la phrase dans l'ordre. Elle veut dire : ${o[1]}`, words:o[0], fin:o[2] || '.', item:'o-' + o[0].join(' '), expl:`${E(o[0].join(' ') + (o[2] || '.'))}` });
  const qDis = d => ({ t:'repete', q:'Écoute, puis <b>dis la phrase</b> à voix haute.', voice:'Écoute, puis dis la phrase à voix haute.', en:d, item:'d-' + d, expl:E(d) });
  const qErr = e => ({ t:'choix', q:`Cette phrase a une erreur : <s lang="en" class="en">${e[0]}</s><br>Quelle est la bonne phrase ?`, voice:'Cette phrase a une erreur. Trouve la bonne phrase.',
    opts:shuffle([e[1], e[0]]).map(enOpt), good:e[1], cols:1, item:'x-' + e[0], expl:`${E(e[1])} ${tagEN(e[2])}` });
  const regle = `${tagEN(L.regle)}<div style="margin-top:10px">${tagEN(L.tableau)}</div>`;
  const CH = [
    { id:'gram', name:'Grammar', sub:L.sous.split(':')[0], icon:'📐', edge:'#1f3c88', make:() => shuffle(L.gap).map(qGap), rule:regle },
    { id:'conj', name:'Conjugation', sub:'écris la bonne forme', icon:'✍️', edge:'#d7263d', make:() => shuffle(L.conj).map(qConj), rule:tagEN(L.tableau) + '<p>Touche les lettres dans l\'ordre (l\'espace se met tout seul).</p>' },
    { id:'compr', name:'Did you understand?', sub:'le dessin animé', icon:'🎬', edge:'#147a66', make:() => shuffle(L.compr).map(qCompr),
      rule:`Les questions portent sur le dessin animé « ${E(L.histoire)} ». Voici le texte :<div class="lettre" lang="en">${L.scenes.map(s => `<p>${s}</p>`).join('')}</div>` },
    { id:'vocab', name:'Vocabulary', sub:'les mots du dessin animé', icon:'📚', edge:'#e0a100', make:() => shuffle(L.vocab).map(qVocab),
      rule:`<div class="mots-l">${L.vocab.map(v => `<span>${E(v[0])} <small>${v[1]}</small></span>`).join('')}</div>` },
    { id:'ordre', name:'Word order', sub:'remets la phrase dans l\'ordre', icon:'🧩', edge:'#7a4fe0', make:() => shuffle(L.ordre).map(qOrdre), rule:'Commence par le mot qui a une majuscule ; pense à la règle de la leçon.' },
    { id:'dis', name:'Speak!', sub:'à voix haute', icon:'🎤', edge:'#c2577a', make:() => L.dis.map(qDis), rule:'Touche 🔊 pour écouter Alice, puis 🎤 et <b>dis la phrase</b>. La tablette t\'écoute (avec indulgence).' },
    { id:'err', name:'Spot the mistake', sub:'la chasse aux erreurs', icon:'🔎', edge:'#c8473a', make:() => shuffle(L.erreurs).map(qErr), rule:'Chaque phrase a <b>une</b> erreur, celle qu\'on fait le plus souvent. Choisis la phrase correcte.' },
    { id:'bilan', name:'Final test', sub:'le bilan de la leçon', icon:'🏆', edge:'#1f3c88', make:() => shuffle([...shuffle(L.gap).slice(0, 4).map(qGap), ...shuffle(L.conj).slice(0, 2).map(qConj), ...shuffle(L.vocab).slice(0, 2).map(qVocab), ...shuffle(L.erreurs).slice(0, 2).map(qErr)]),
      rule:'Dix questions de toute la leçon, sans aide. Trois étoiles si tout est juste du premier coup !' },
  ];
  window.COURS = { enfant:'Essil', prof:MISS, voix:'ollie', key:'essil-en' + L.n, track:'essil-en' + L.n, retour:'Mon chemin', titre:`${L.icon} ${L.titre}`, sous:`English B2 · lesson ${L.n} / 10 · ${L.sous}`, controle:true, reflexion:900,
    bandeau:`<div class="b2band"><span>English B2 · Lesson ${L.n}</span><a href="english-b2.html">Les 10 leçons</a></div>`,
    histoire:{ titre:L.histoire, scenes:L.scenes.map((t, k) => ({ img:`${IMG}l${L.n}_${k}.webp`, vid:`${IMG}l${L.n}_${k}.mp4`, txt:E(t) })) },
    bonjour:`${E('Hello Essil!')} Je suis Miss Yasmine. Aujourd'hui : <b>${L.sous}</b>. On commence par le dessin animé, puis 8 étapes. Chaque bonne réponse te donne un ticket 🎟️ pour Serpent Légendes.`,
    confetti:['🇬🇧', '⭐', '🎟️', L.icon, '🌸'], revoir:'Mes points à revoir', CH,
    fiche:[{ h:'La règle', tag:'grammar', html:regle, lire:tagEN(L.regle) },
      { h:'Les mots', tag:'vocabulary', html:`<div class="mots-l">${L.vocab.map(v => `<span>${E(v[0])} <small>${v[1]}</small></span>`).join('')}</div>`, lire:L.vocab.map(v => `${v[1]} : ${E(v[0])}.`).join(' ') },
      { h:'Les pièges', tag:'mistakes', html:L.erreurs.map(e => `<p><s lang="en">${e[0]}</s> → <b lang="en">${e[1]}</b><br><small>${e[2]}</small></p>`).join(''), lire:L.erreurs.map(e => `${E(e[1])} ${tagEN(e[2])}`).join(' ') }] };
})();
