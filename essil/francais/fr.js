/* Français 5e · Essil (21/11) : fabrique le cours n° window.FR5N (données dans francais/lecons.js, fabriqué par docs/francais5/lecons.py)
   pour le moteur commun salma/ollie/cours.js. La prof : Plume, une huppe (dessin à nous). Les consignes sont lues par Céline.
   Étapes : ⭐ facile, ⭐⭐ moyen, ⭐⭐⭐ difficile, les pièges, les phrases dans l'ordre, le texte à trous, le bilan.
   Suivi : clé essil-fr<n> (Famille.track), carte « Français 5e » dans Progression. */
(function(){
  'use strict';
  const L = window.LECONS_FR5.find(x => x.n === window.FR5N);
  const shuffle = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const PLUME = `<svg class="owl" viewBox="0 0 120 130" aria-hidden="true">
    <ellipse cx="60" cy="125" rx="34" ry="5" fill="#0002"/>
    <path d="M52 104 l-4 18 M68 104 l4 18" stroke="#6b4a2b" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="60" cy="84" rx="28" ry="24" fill="#e0a36b"/>
    <path d="M36 80 q-12 10 -8 26 q16 -2 22 -16 Z" fill="#2b2b2b"/><path d="M33 88 l10 -4 M31 95 l12 -4 M33 102 l10 -5" stroke="#fff" stroke-width="3"/>
    <path d="M84 80 q12 10 8 26 q-16 -2 -22 -16 Z" fill="#2b2b2b"/><path d="M87 88 l-10 -4 M89 95 l-12 -4 M87 102 l-10 -5" stroke="#fff" stroke-width="3"/>
    <circle cx="60" cy="50" r="22" fill="#e8b07a"/>
    <path d="M44 34 q-6 -22 6 -28 q4 14 6 22 q2 -16 10 -24 q6 14 2 26 q8 -12 16 -12 q-2 14 -12 22 Z" fill="#e0a36b"/>
    <path d="M50 8 l3 8 M62 6 l1 9 M75 12 l-3 8" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>
    <circle cx="52" cy="48" r="5" fill="#2b1d12"/><circle cx="53.5" cy="46.5" r="1.6" fill="#fff"/>
    <path d="M64 52 q22 2 40 14 q-22 -4 -40 -6 Z" fill="#3a2a1a"/>
    <path d="M40 62 q20 10 40 0 l0 6 q-20 10 -40 0 Z" fill="#1f3c88"/><path d="M82 64 l8 14 l-6 2 Z" fill="#d7263d"/>
  </svg>`;
  const fr = t => `<span class="phr">${t.replace('___', '<b class="trou">___</b>')}</span>`;
  const qChoix = (g, k) => ({ t:'choix', q:`Complète ou choisis : ${fr(esc(g[0]))}`, voice:'Lis bien la phrase, et choisis la bonne réponse.', opts:shuffle([g[1], ...g[2]]), good:g[1], cols:1, item:k + '-' + g[0],
    expl:`<b>${esc(g[1])}</b>. ${g[3]}`, indice:g[3].replace(/<[^>]+>/g, '') });
  const qOrdre = o => ({ t:'ordre', q:`Remets la phrase dans l'ordre : <i>${esc(o[2])}</i>`, voice:'Remets les mots dans l\'ordre pour faire une belle phrase.', words:o[0], fin:o[1] || '.', item:'o-' + o[0].join(' '),
    indice:'Commence par le mot qui a une majuscule.', expl:`${esc(o[0].join(' ') + (o[1] || '.'))}` });
  const morceaux = L.texte[0].split('___');
  const qTexte = i => { const tr = L.texte[1][i];
    const html = morceaux.map((m, j) => esc(m) + (j < morceaux.length - 1 ? (j < i ? `<b>${esc(L.texte[1][j][0])}</b>` : j === i ? '<b class="trou">___</b>' : '…') : '')).join('');
    return { t:'choix', q:`Le texte, trou ${i + 1} sur ${L.texte[1].length} :<div class="lettre">${html}</div>`, voice:'Lis le texte, et complète le trou.', opts:shuffle([tr[0], ...tr[1]]), good:tr[0], cols:1, item:'t-' + i,
      expl:`<b>${esc(tr[0])}</b>. ${tr[2]}`, indice:tr[2].replace(/<[^>]+>/g, '') }; };
  const CH = [
    { id:'n1', name:'⭐ Facile', sub:'je reconnais', icon:'🌱', edge:'#147a66', make:() => shuffle(L.n1).map(g => qChoix(g, 'a')), rule:L.regle },
    { id:'n2', name:'⭐⭐ Moyen', sub:'je choisis la bonne forme', icon:'🌿', edge:'#2a7fb4', make:() => shuffle(L.n2).map(g => qChoix(g, 'b')), rule:L.regle },
    { id:'n3', name:'⭐⭐⭐ Difficile', sub:'je réfléchis', icon:'🌳', edge:'#1f3c88', make:() => shuffle(L.n3).map(g => qChoix(g, 'c')), rule:L.regle },
    { id:'pieges', name:'Les pièges', sub:'attention !', icon:'🪤', edge:'#c8473a', make:() => shuffle(L.pieges).map(g => qChoix(g, 'p')), rule:'Ces phrases cachent les erreurs les plus fréquentes. Prends ton temps.' },
    { id:'ordre', name:'Dans l\'ordre', sub:'des phrases du dessin animé', icon:'🧩', edge:'#7a4fe0', make:() => shuffle(L.ordre).map(qOrdre), rule:'Remets les mots dans l\'ordre : ce sont des phrases du dessin animé.' },
    { id:'texte', name:'Le texte', sub:'je complète un petit texte', icon:'📜', edge:'#e0a100', make:() => L.texte[1].map((_, i) => qTexte(i)), rule:'Un petit texte avec des trous : complète-les un par un, dans l\'ordre.' },
    { id:'bilan', name:'Le bilan', sub:'tout le cours', icon:'🏆', edge:'#d7263d', make:() => shuffle([...shuffle(L.n1).slice(0, 2).map(g => qChoix(g, 'a')), ...shuffle(L.n2).slice(0, 3).map(g => qChoix(g, 'b')), ...shuffle(L.n3).slice(0, 3).map(g => qChoix(g, 'c')), ...shuffle(L.pieges).slice(0, 2).map(g => qChoix(g, 'p'))]),
      rule:'Dix questions de tout le cours, sans aide. Trois étoiles si tout est juste du premier coup !' },
  ];
  window.COURS = { enfant:'Essil', prof:PLUME, key:'essil-fr' + L.n, track:'essil-fr' + L.n, retour:'Mon chemin', titre:`${L.icon} ${L.titre}`, sous:`Français 5e · cours ${L.n} / 6 · ${L.sous}`, controle:true, reflexion:1000,
    bandeau:`<div class="b2band"><span>📚 Français 5e · Cours ${L.n}</span><a href="francais-5e.html">Les 6 cours</a></div>`,
    histoire:{ titre:L.histoire, scenes:L.scenes.map((s, k) => ({ img:`francais/img/f${L.n}_${k}.webp`, vid:`francais/img/f${L.n}_${k}.mp4`, txt:s.txt })) },
    bonjour:`Bonjour Essil ! Je suis Plume, la huppe. Aujourd'hui : <b>${L.sous}</b>. On regarde d'abord le dessin animé, puis on s'entraîne du plus facile au plus difficile. Chaque bonne réponse te donne un ticket 🎟️.`,
    confetti:['📚', '⭐', '🎟️', '✒️', L.icon], revoir:'Mes points à revoir', CH,
    fiche:[{ h:'La règle', tag:'leçon', html:L.regle, lire:L.regle },
      { h:'Le dessin animé', tag:'histoire', html:`<div class="lettre">${L.scenes.map(s => `<p>${s.txt}</p>`).join('')}</div>`, lire:L.scenes.map(s => s.txt).join(' ') }] };
})();
