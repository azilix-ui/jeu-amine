/* « Amine & Kiko » (21/11) : fabrique la leçon n° window.KIKON (données dans kiko/lecons.js) pour le moteur commun salma/ollie/cours.js.
   Amine a 5 ans et ne lit pas encore : tout est à l'oral et en images. Le français est dit par Lulu (C.lulu), l'anglais par Alice.
   6 étapes : écoute et touche, répète (avoir répété suffit : C.indulgent), oui ou non (👍 / 👎), Kiko dit…, mes petites phrases, la fête.
   Suivi : clé amine-kiko<n> (Famille.track), carte « Amine & Kiko » dans Progression. */
(function(){
  'use strict';
  const L = window.LECONS_KIKO.find(x => x.n === window.KIKON), M = L.mots;
  const E = t => `<i lang="en">${t}</i>`;
  const shuffle = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const mot = w => M.find(m => m[0] === w);
  const autres = (m, k) => shuffle(M.filter(x => x !== m)).slice(0, k);
  const img = x => ({ v:x[0], html:`<span class="emo2">${x[1]}</span>` });
  const KIKO = `<svg class="owl" viewBox="0 0 120 130" aria-hidden="true">
    <ellipse cx="60" cy="125" rx="36" ry="5" fill="#0002"/>
    <path d="M38 96 v26 M52 100 v24 M70 100 v24 M84 96 v26" stroke="#d9b98a" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="62" cy="88" rx="34" ry="20" fill="#e8cfa4"/><path d="M48 72 q14 -22 28 0 Z" fill="#e8cfa4"/>
    <path d="M44 78 q18 -8 36 0 l-2 14 q-16 6 -32 0 Z" fill="#d7263d"/><path d="M46 84 h32 M48 90 h28" stroke="#ffd23f" stroke-width="2.5"/><path d="M47 81 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4" stroke="#1f6b44" stroke-width="2" fill="none"/>
    <path d="M30 80 q-6 -20 2 -38" stroke="#e8cfa4" stroke-width="14" stroke-linecap="round" fill="none"/>
    <ellipse cx="34" cy="36" rx="20" ry="17" fill="#efd9b4"/><ellipse cx="24" cy="44" rx="11" ry="8" fill="#f6e6c8"/>
    <circle cx="36" cy="32" r="5" fill="#2b1d12"/><circle cx="37.5" cy="30.5" r="1.6" fill="#fff"/><path d="M31 26 l-2 -3 M35 25 v-3 M39 26 l2 -3" stroke="#2b1d12" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M18 46 q6 4 12 0" stroke="#2b1d12" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="17" cy="42" r="1.6" fill="#2b1d12"/>
    <path d="M24 22 q10 -12 22 -2 l-2 6 q-10 -4 -18 0 Z" fill="#c8102e"/><path d="M36 12 v-4" stroke="#222" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="50" cy="28" rx="4" ry="6" fill="#e2c597"/>
  </svg>`;
  const ecoute = m => ({ t:'choix', q:'Écoute Kiko, et touche la bonne image.', voice:'Écoute, et touche la bonne image.', en:m[0],
    opts:shuffle([m, ...autres(m, 2)]).map(img), good:m[0], item:'e-' + m[0], indice:`Écoute encore : ${E(m[0])}. C'est ${m[2]}.`, expl:`${E(m[0])}, c'est ${m[2]} !` });
  const repete = m => ({ t:'repete', q:'Écoute, puis <b>répète</b> bien fort !', voice:'Écoute, puis répète bien fort.', en:m[0], aussi:m[3] || [], body:`<div class="emo">${m[1]}</div>`, item:'r-' + m[0], expl:`${E(m[0])}, c'est ${m[2]}.` });
  const article = w => /^[aeiou]/.test(w) ? 'an ' : 'a ';
  const question = w => (L.ouiTpl && L.ouiTpl[w]) || L.oui.replace('{a}', article(w)).replace('{w}', w);
  const ouinon = (w, vrai) => { const m = mot(w), montre = vrai ? m : autres(m, 1)[0], q = question(w);
    return { t:'choix', q:`Kiko demande : <b lang="en">${q}</b>`, voice:'Écoute Kiko. Oui ou non ?', en:q, body:`<div class="emo">${montre[1]}</div>`,
      opts:[{ v:'yes', html:'<span class="emo2">👍</span><b lang="en">Yes</b>' }, { v:'no', html:'<span class="emo2">👎</span><b lang="en">No</b>' }], good:vrai ? 'yes' : 'no', item:'o-' + w,
      indice:vrai ? `Regarde bien l'image. ${E(w)}, c'est ${m[2]}.` : `Regarde bien : ${E(w)}, c'est ${m[2]}.`,
      expl:vrai ? `${E('Yes!')} C'est ${m[2]}.` : `${E('No!')} Ce n'est pas ${m[2]}, c'est ${montre[2]}. ${E(montre[0])} !` }; };
  const dit = d => { const m = mot(d[1]);
    return { t:'choix', q:`Kiko dit : <b lang="en">${d[0]}</b>`, voice:'Kiko dit :', en:d[0], opts:shuffle([m, ...autres(m, 2)]).map(img), good:m[0], item:'k-' + d[0],
      indice:`${E(d[0])} : ${d[2]}.`, expl:`${E(d[0])} : ${d[2]} !` }; };
  const phrase = p => ({ t:'repete', q:'Répète la phrase de Kiko !', voice:'Écoute, puis répète la phrase.', en:p[0].replace(/[!.?]$/, ''), body:`<div class="emo">${p[2]}</div>`, item:'p-' + p[0], expl:`${E(p[0])} : ${p[1]}` });
  const oui6 = () => { const ws = shuffle(L.ouiMots); return ws.slice(0, 6).map((w, k) => ouinon(w, k % 2 === 0)).sort(() => Math.random() - .5); };
  const CH = [
    { id:'ecoute', name:'Listen!', sub:'écoute et touche', icon:'👂', edge:'#2a7fb4', make:() => shuffle(M).slice(0, 6).map(ecoute), rule:`Écoute bien Kiko, et touche l'image. Voici les mots :<div class="mots-l">${M.map(m => `<span>${m[1]} ${E(m[0])}</span>`).join('')}</div>` },
    { id:'repete', name:'Say it!', sub:'répète', icon:'🎤', edge:'#c2577a', make:() => shuffle(M).slice(0, 5).map(repete), rule:'Touche le micro 🎤 et répète le mot bien fort !' },
    { id:'ouinon', name:'Yes or no?', sub:'👍 ou 👎', icon:'👍', edge:'#1f6b44', make:oui6, rule:`Kiko te pose une question en anglais. Si c'est vrai, touche 👍 ${E('Yes')}. Si c'est faux, touche 👎 ${E('No')}.` },
    { id:'kiko', name:'Kiko says…', sub:'fais ce que dit Kiko', icon:'🐫', edge:'#e0a100', make:() => shuffle(L.dit).slice(0, 5).map(dit), rule:'Kiko te demande quelque chose en anglais. Écoute bien, et touche la bonne image !' },
    { id:'phrases', name:'My sentences', sub:'mes petites phrases', icon:'💬', edge:'#7a4fe0', make:() => L.phrases.map(phrase), rule:'Écoute Kiko dire une petite phrase, et répète-la avec lui !' },
    { id:'fete', name:'Party!', sub:'la grande fête', icon:'🎉', edge:'#c8473a', make:() => shuffle([...shuffle(M).slice(0, 2).map(ecoute), ...oui6().slice(0, 2), ...shuffle(L.dit).slice(0, 2).map(dit)]), rule:'Un peu de tout ! Trois étoiles si tout est juste du premier coup.' },
  ];
  // 22/11 : les mots anglais de la leçon (cours.js s'en sert pour faire lire en anglais ceux qui sont écrits sans balise de langue)
  const enTexte = h => String(h).replace(/<(\w+)[^>]*\blang="?(?!en)\w+"?[^>]*>[\s\S]*?<\/\1>/g, ' ');   // dans les textes : seulement ce qui est marqué en anglais
  const motsEN = [...new Set([...M.map(m => m[0]), ...L.phrases.map(p => p[0]), ...L.dit.map(d => d[0]), L.oui, ...Object.values(L.ouiTpl || {}), ...L.scenes.map(x => x.txt), 'yes', 'no'].map(h => /lang="?en/.test(String(h)) ? [...String(h).matchAll(/<(\w+)[^>]*\blang="?en"?[^>]*>([\s\S]*?)<\/\1>/g)].map(x => x[2]).join(' ') : String(h))
    .join(' ').replace(/<[^>]+>/g, ' ').toLowerCase().match(/[a-z][a-z']*/g) || [])].map(w => w.replace(/'s$/, ''));
  window.COURS = { motsEN, enfant:'Amine', prof:KIKO, voix:'ollie', lulu:true, indulgent:true, key:'amine-kiko' + L.n, track:'amine-kiko' + L.n, retour:'Mon chemin', titre:`${L.icon} ${L.titre}`, sous:`Amine & Kiko · leçon ${L.n} / 10`, controle:true, reflexion:1800,
    bandeau:`<div class="kikoband"><span>🐫 Amine & Kiko · ${L.n}</span><a href="english-kiko.html">Les leçons</a></div>`,
    histoire:{ titre:L.histoire, scenes:L.scenes.map((s, k) => ({ img:`kiko/img/k${L.n}_${k}.webp`, vid:`kiko/img/k${L.n}_${k}.mp4`, txt:s.txt })) },
    bonjour:`${E('Hello, Amine!')} C'est moi, Kiko ! Aujourd'hui : ${L.sous}. On regarde le dessin animé, et après on joue !`,
    confetti:['🐫', '⭐', '🎟️', '🌴', L.icon], revoir:'Mes mots à revoir', CH,
    fiche:[{ h:'Mes mots', tag:'words', html:`<div class="mots-l">${M.map(m => `<span>${m[1]} ${E(m[0])} <small>${m[2]}</small></span>`).join('')}</div>`, lire:M.map(m => `${m[2]} : ${E(m[0])}.`).join(' ') },
      { h:'Mes phrases', tag:'sentences', html:`<div class="mots-l">${L.phrases.map(p => `<span>${p[2]} ${E(p[0])} <small>${p[1]}</small></span>`).join('')}</div>`, lire:L.phrases.map(p => `${p[1]} ${E(p[0])}`).join(' ') }] };
})();
