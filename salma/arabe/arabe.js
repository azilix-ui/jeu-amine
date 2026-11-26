/* « Salma & Ghazala » (26/11) : fabrique l'épisode n° window.ARN (données dans arabe/lecons.js) pour le moteur commun ollie/cours.js.
   La prof, c'est Ghazala, le bébé gazelle (dessin à nous). Le français est lu par Céline, l'arabe par Mohammad (api/voix.php, l=ar) :
   tout ce qui est arabe est balisé lang="ar". 8 étapes contrôlées : j'écoute la lettre, les petites voyelles, les formes, mes mots,
   je lis, je répète (la tablette écoute, en arabe), je retiens, le bilan. L'écriture se fait sur l'Ardoise arabe (lien dans le bandeau).
   Suivi : clé salma-ar<n> (Famille.track), carte « Salma & Ghazala » dans Progression. */
(function(){
  'use strict';
  const TOUS = window.LECONS_AR, L = TOUS.find(x => x.n === window.ARN), M = L.mots;
  // l'arabe des règles et des questions est lu par la voix arabe
  L.regle = L.regle.replace(/<span class="ar">/g, '<span class="ar" lang="ar">');
  const AVANT = TOUS.filter(x => x.n < L.n);                       // les lettres déjà apprises
  const E = t => `<i lang="ar">${t}</i>`;                            // de l'arabe dans une phrase (lu en arabe)
  const A = (t, c = '') => `<span class="ar ${c}" lang="ar">${t}</span>`;   // de l'arabe à montrer
  const shuffle = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uniq = a => [...new Set(a)];
  const TIMIDES = ['ا', 'د', 'ذ', 'ر', 'ز', 'و'];
  const timide = TIMIDES.includes(L.l);
  const FAMILLES = [['ب', 'ت', 'ث', 'ن', 'ي'], ['ج', 'ح', 'خ'], ['د', 'ذ', 'ر', 'ز'], ['ا', 'ل', 'ك'], ['س', 'ش', 'ص'], ['ع', 'غ', 'ف', 'ق']];
  const ALPHA = 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي'.split(' ');
  const FORME = { alif:'un grand trait droit', ba:'le petit bateau avec un point en dessous', ta:'le petit bateau avec deux points au-dessus', tha:'le petit bateau avec trois points au-dessus',
    jim:'le crochet avec un point dans le ventre', ha:'le crochet sans point', kha:'le crochet avec un point au-dessus', dal:'le petit coude sans point', dhal:'le petit coude avec un point au-dessus', ra:'le toboggan qui glisse sous la ligne' };
  const NOM = { alif:'alif', ba:'ba', ta:'ta', tha:'tha', jim:'jim', ha:'ḥa', kha:'kha', dal:'dal', dhal:'dhal', ra:'ra' };
  const NOMAR = { alif:'أَلِف', ba:'بَاء', ta:'تَاء', tha:'ثَاء', jim:'جِيم', ha:'حَاء', kha:'خَاء', dal:'دَال', dhal:'ذَال', ra:'رَاء' };
  const nom = NOM[L.id];
  const VOY = ['a', 'i', 'ou'], VOYN = ['la fatha (un petit trait au-dessus)', 'la kasra (un petit trait en dessous)', 'la damma (un petit 9 au-dessus)'];
  const PLACE = { d:'au début', m:'au milieu', f:'à la fin' };
  // les lettres à proposer à côté de la bonne : d'abord sa famille, puis les lettres déjà vues, puis le reste de l'alphabet
  const voisines = (l, k) => { const fam = (FAMILLES.find(f => f.includes(l)) || []).filter(x => x !== l);
    return uniq([...shuffle(fam), ...shuffle(AVANT.map(x => x.l).filter(x => x !== l)), ...shuffle(ALPHA.filter(x => x !== l))]).slice(0, k); };
  const lettreOpt = l => ({ v:l, html:A(l, 'arb') });
  const motOpt = m => ({ v:m[0], html:`<span class="emo2">${m[1]}</span>` });
  const sansVoy = t => t.replace(/[ً-ٰٟ]/g, '');
  const forme = (l, f) => f === 'ini' ? l + 'ـ' : f === 'med' ? 'ـ' + l + 'ـ' : f === 'fin' ? 'ـ' + l : l;
  const FORMES = timide ? ['iso', 'fin'] : ['iso', 'ini', 'med', 'fin'];
  const FN = { iso:'toute seule', ini:'au début', med:'au milieu', fin:'à la fin' };
  const tousMots = uniq([...M, ...AVANT.flatMap(x => x.mots)].map(m => m[0])).map(w => [...M, ...AVANT.flatMap(x => x.mots)].find(m => m[0] === w));
  const autresMots = (m, k) => shuffle(tousMots.filter(x => x[0] !== m[0] && x[1] !== m[1])).slice(0, k);

  /* ---------- les questions ---------- */
  // 1. j'écoute : un son → la bonne lettre
  const ecouteLettre = (s, lec = L) => ({ t:'choix', lang:'ar', q:'Écoute Ghazala, et touche la bonne lettre.', voice:'Écoute, et touche la bonne lettre.', en:s[0],
    opts:shuffle([lec.l, ...voisines(lec.l, 3)]).map(lettreOpt), good:lec.l, cols:2, item:'e-' + s[0],
    indice:`Réécoute (🔊). Cherche ${FORME[lec.id]}.`, expl:`${E(s[0])} se dit <b>${s[1]}</b> : c'est la lettre <b>${NOM[lec.id]}</b> ${A(lec.l)}, ${FORME[lec.id]}.` });
  const ecouteNom = () => ({ t:'choix', lang:'ar', q:'Ghazala dit le nom d\'une lettre. Touche-la.', voice:'Écoute le nom de la lettre, et touche-la.', en:NOMAR[L.id],
    opts:shuffle([L.l, ...voisines(L.l, 3)]).map(lettreOpt), good:L.l, cols:2, item:'n-' + L.id,
    indice:`Le nom de la lettre, c'est ${nom}. Cherche ${FORME[L.id]}.`, expl:`${E(NOMAR[L.id])}, c'est la lettre ${A(L.l)}.` });
  // 2. les petites voyelles
  const sonsVoisins = s => { const k = L.sons.indexOf(s), autre = AVANT.length ? shuffle(AVANT)[0].sons[k] : null; return uniq([...L.sons.map(x => x[0]), ...(autre ? [autre[0]] : [])]); };
  const voyelle = s => { const k = L.sons.indexOf(s); return { t:'choix', lang:'ar', q:'Écoute, et touche ce que dit Ghazala.', voice:'Écoute bien la petite voyelle, et touche le bon son.', en:s[0],
    opts:shuffle(sonsVoisins(s)).map(lettreOpt), good:s[0], cols:2, item:'v-' + s[0],
    indice:'Écoute la fin du son : a, i ou ou ? Le petit trait en haut fait a, en bas fait i, le petit 9 fait ou.', expl:`${E(s[0])} se dit <b>${s[1]}</b> : c'est ${VOYN[k]}.` }; };
  const lisSon = s => { const k = L.sons.indexOf(s); return { t:'choix', q:`Comment se lit ${A(s[0], 'arm')} ?`, voice:'Comment se lit ce son ?',
    opts:shuffle(L.sons.map(x => x[1])), good:s[1], cols:3, item:'s-' + s[0],
    indice:'Regarde la petite voyelle : en haut, en bas, ou un petit 9 ?', expl:`${E(s[0])} se lit <b>${s[1]}</b> : ${VOYN[k]} fait <b>${VOY[k]}</b>.` }; };
  // 3. les formes
  const ouForme = f => ({ t:'choix', q:`Voici la lettre <b>${nom}</b> : ${A(forme(L.l, f), 'arm')}<br>Où est-elle dans le mot ?`, voice:'Regarde cette forme de la lettre. Où est-elle dans le mot ?',
    opts:shuffle(FORMES.map(x => FN[x])), good:FN[f], cols:FORMES.length > 2 ? 2 : 1, item:'f-' + f,
    indice:timide ? 'Cette lettre est timide : elle n\'a que deux formes, toute seule ou à la fin.' : 'Le petit trait (le lien) montre de quel côté la lettre donne la main. Le début du mot est à droite !',
    expl:`${A(forme(L.l, f))} : c'est le ${nom} <b>${FN[f]}</b>${f === 'iso' ? '' : f === 'ini' ? ', il donne la main à gauche' : f === 'med' ? ', il donne la main des deux côtés' : ', il donne la main à droite'}.` });
  const trouveForme = f => ({ t:'choix', q:`Touche le ${nom} <b>${FN[f]}</b> ${f === 'iso' ? '' : 'du mot'}.`, voice:`Touche la lettre ${nom}, ${FN[f]}${f === 'iso' ? '' : ' du mot'}.`,
    opts:shuffle(FORMES.map(x => ({ v:x, html:A(forme(L.l, x), 'arb') }))), good:f, cols:2, item:'t-' + f,
    indice:f === 'ini' ? 'Au début, la lettre donne la main à gauche seulement.' : f === 'med' ? 'Au milieu, elle donne la main des deux côtés.' : f === 'fin' ? 'À la fin, elle donne la main à droite seulement.' : 'Toute seule : pas de lien.',
    expl:`Le ${nom} ${FN[f]}, c'est ${A(forme(L.l, f))}.` });
  const timideQ = () => ({ t:'choix', q:`La lettre ${A(L.l, 'arm')} s'attache-t-elle à la lettre qui vient <b>après</b> elle ?`, voice:`La lettre ${nom} s'attache-t-elle à la lettre qui vient après elle ?`,
    opts:shuffle(['Oui', 'Non, jamais', 'Seulement au milieu']), good:timide ? 'Non, jamais' : 'Oui', cols:1, item:'a-' + L.id,
    indice:'Les lettres timides : alif, dal, dhal, ra… Elles ne donnent jamais la main après elles.', expl:timide ? `Le ${nom} est une lettre timide : jamais attaché après lui.` : `Le ${nom} donne la main à la lettre suivante : il a 4 formes.` });
  // 4. mes mots : j'entends le mot → l'image
  const motImage = m => ({ t:'choix', lang:'ar', q:'Écoute le mot arabe, et touche la bonne image.', voice:'Écoute le mot, et touche la bonne image.', en:m[0],
    opts:shuffle([m, ...autresMots(m, 3)]).map(motOpt), good:m[0], cols:2, item:'m-' + m[0],
    indice:'Réécoute le mot (🔊), et repense au dessin animé de Ghazala.', expl:`${E(m[0])}, c'est <b>${m[2]}</b> ${m[1]}.` });
  // 5. je lis : je lis le mot → l'image ; où est la lettre ?
  const lisMot = m => ({ t:'choix', q:`Lis le mot : ${A(m[0], 'arm')}<br>Quelle image ?`, voice:'Lis le mot arabe, et trouve la bonne image.',
    opts:shuffle([m, ...autresMots(m, 3)]).map(motOpt), good:m[0], cols:2, item:'l-' + m[0],
    indice:`Lis de droite à gauche, lettre après lettre. Le mot a la lettre ${nom} ${PLACE[m[3]]}.`, expl:`${E(m[0])} = <b>${m[2]}</b> ${m[1]}.` });
  const place = m => ({ t:'choix', q:`${m[1]} ${A(m[0], 'arm')} <small>(${m[2]})</small><br>Où est la lettre <b>${nom}</b> ${A(L.l)} ?`, voice:`Où est la lettre ${nom} dans ce mot ?`,
    opts:shuffle(['au début', 'au milieu', 'à la fin']), good:PLACE[m[3]], cols:3, item:'p-' + m[0],
    indice:'Attention : en arabe, le début du mot est à droite !', expl:`Dans ${E(m[0])}, la lettre ${nom} est <b>${PLACE[m[3]]}</b>.` });
  // 6. je répète (la tablette écoute en arabe)
  const repete = m => ({ t:'repete', lang:'ar', q:'Écoute Ghazala, puis <b>répète</b> le mot à voix haute.', voice:'Écoute, puis répète le mot à voix haute.', en:m[0], aussi:[sansVoy(m[0])],
    body:`<div class="emo">${m[1]}</div>`, item:'r-' + m[0], expl:`${E(m[0])} : ${m[2]}.` });
  // 7. je retiens : les questions de la règle
  const optHtml = t => /[؀-ۿ]/.test(t) ? { v:t, html:A(t, 'arb') } : t;
  const arDans = (t, f) => t.replace(/([\u0600-\u06FF][\u0600-\u06FF ]*)/g, m => f(m.trim()) + (/ $/.test(m) ? ' ' : ''));
  const quiz = x => ({ t:'choix', q:arDans(x[0], t => A(t)), voice:arDans(x[0], E),
    opts:shuffle([x[1], ...x[2]]).map(optHtml), good:x[1], cols:1, item:'q-' + x[0], indice:x[3], expl:`<b>${/[؀-ۿ]/.test(x[1]) ? A(x[1]) : x[1]}</b> : ${x[3]}` });

  const formesL = `<div class="formes">${FORMES.map(f => `<span>${A(forme(L.l, f), 'arb')}<small>${FN[f]}</small></span>`).join('')}</div>`;
  const motsL = `<div class="mots-l">${M.map(m => `<span>${m[1]} ${A(m[0])} <small>${m[2]}</small></span>`).join('')}</div>`;
  const sonsL = `<div class="formes">${L.sons.map(s => `<span>${A(s[0], 'arb')}<small>${s[1]}</small></span>`).join('')}</div>`;
  const revision = AVANT.length ? shuffle(AVANT).slice(0, 2).map(x => ecouteLettre(shuffle(x.sons)[0], x)) : [];
  const CH = [
    { id:'ecoute', name:'J\'écoute la lettre', sub:'le son → la lettre', icon:'👂', edge:'#2a7fb4', make:() => shuffle([...L.sons.map(s => ecouteLettre(s)), ecouteNom(), ...revision]),
      rule:`Voici la lettre <b>${nom}</b> ${A(L.l, 'arb')} : ${FORME[L.id]}. Écoute Ghazala (🔊 pour réécouter), puis touche la bonne lettre.${AVANT.length ? ' Il y a aussi des lettres des épisodes d\'avant !' : ''}` },
    { id:'voyelles', name:'Les petites voyelles', sub:'a, i, ou', icon:'🎵', edge:'#c2577a', make:() => [...shuffle(L.sons).map(voyelle), ...shuffle(L.sons).map(lisSon)],
      rule:`Les 3 petites voyelles : la <b>fatha</b> fait <b>a</b>, la <b>kasra</b> fait <b>i</b>, la <b>damma</b> fait <b>ou</b>.${sonsL}` },
    { id:'formes', name:'Les formes', sub:timide ? 'la lettre timide' : 'seule, début, milieu, fin', icon:'🧩', edge:'#e0a100', make:() => shuffle([...FORMES.map(ouForme), ...shuffle(FORMES).slice(0, 2).map(trouveForme), timideQ()]),
      rule:`${timide ? `Le ${nom} est une lettre <b>timide</b> : il ne s'attache jamais à la lettre d'après. Il a 2 formes :` : `Dans un mot, les lettres se donnent la main. Le ${nom} a 4 formes :`}${formesL}<p><a class="btn" href="ardoise-arabe.html">✍️ Je l'écris sur l'ardoise</a></p>` },
    { id:'mots', name:'Mes mots', sub:'j\'écoute → l\'image', icon:'📖', edge:'#1f6b44', make:() => shuffle(M).slice(0, 6).map(motImage), rule:`Écoute le mot arabe et touche son image. Les mots de l'épisode :${motsL}` },
    { id:'lis', name:'Je lis', sub:'je lis, je cherche la lettre', icon:'👀', edge:'#7a4fe0', make:() => [...shuffle(M).slice(0, 3).map(lisMot), ...shuffle(M).slice(0, 3).map(place)],
      rule:'Lis le mot <b>de droite à gauche</b>, et trouve son image. Puis cherche où se cache la lettre : au début (à droite), au milieu, ou à la fin (à gauche).' },
    { id:'repete', name:'Je répète', sub:'la tablette écoute', icon:'🎤', edge:'#c8473a', make:() => shuffle(M).slice(0, 4).map(repete),
      rule:'Touche 🔊 pour entendre le mot, puis 🎤 et <b>répète-le bien fort</b>, près de la tablette. Si elle ne t\'entend pas, ce n\'est pas grave !' },
    { id:'regle', name:'Je retiens', sub:'la règle de l\'épisode', icon:'📐', edge:'#147a66', make:() => shuffle(L.quiz).map(quiz), rule:L.regle },
    { id:'bilan', name:'Le bilan', sub:'tout l\'épisode', icon:'🏆', edge:'#1f3c88', make:() => shuffle([ecouteLettre(shuffle(L.sons)[0]), ...shuffle(L.sons).slice(0, 2).map(voyelle), ouForme(shuffle(FORMES)[0]), ...shuffle(M).slice(0, 2).map(motImage), lisMot(shuffle(M)[0]), place(shuffle(M)[0]), ...shuffle(L.quiz).slice(0, 2).map(quiz)]),
      rule:'Dix questions de tout l\'épisode. Trois étoiles si tout est juste du premier coup !' },
  ];
  const GHAZALA = `<svg class="owl" viewBox="0 0 120 130" aria-hidden="true">
    <ellipse cx="60" cy="125" rx="30" ry="5" fill="#0002"/>
    <path d="M44 22 q-10 -16 -2 -20 q4 10 9 20 Z M76 22 q10 -16 2 -20 q-4 10 -9 20 Z" fill="#6b4a2b"/>
    <path d="M36 40 q-22 -6 -26 4 q12 8 28 4 Z M84 40 q22 -6 26 4 q-12 8 -28 4 Z" fill="#d99a5b" stroke="#b97a3f" stroke-width="2"/><path d="M18 44 q8 2 16 1 M102 44 q-8 2 -16 1" stroke="#f6c9a0" stroke-width="3" stroke-linecap="round"/>
    <path d="M60 18 q26 0 28 30 q2 26 -14 40 q-6 6 -14 6 q-8 0 -14 -6 q-16 -14 -14 -40 q2 -30 28 -30 Z" fill="#e0a868" stroke="#b97a3f" stroke-width="2"/>
    <path d="M60 52 q14 2 16 22 q0 14 -16 18 q-16 -4 -16 -18 q2 -20 16 -22 Z" fill="#fbead6"/>
    <ellipse cx="48" cy="48" rx="7" ry="8" fill="#fff"/><ellipse cx="72" cy="48" rx="7" ry="8" fill="#fff"/><circle cx="49" cy="49" r="5" fill="#3a2414"/><circle cx="71" cy="49" r="5" fill="#3a2414"/><circle cx="50.5" cy="47" r="1.8" fill="#fff"/><circle cx="72.5" cy="47" r="1.8" fill="#fff"/>
    <ellipse cx="60" cy="78" rx="6" ry="4" fill="#3a2414"/><path d="M54 86 q6 5 12 0" stroke="#3a2414" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M38 96 q22 14 44 0 l4 10 q-26 16 -52 0 Z" fill="#d7263d"/><path d="M44 101 l4 4 M54 105 l4 3 M64 105 l4 -3 M74 101 l4 -4" stroke="#fff" stroke-width="3"/><path d="M76 104 l8 16 l6 -3 l-7 -14 Z" fill="#d7263d"/>
  </svg>`;
  window.COURS = { enfant:'Salma', prof:GHAZALA, key:'salma-ar' + L.n, track:'salma-ar' + L.n, retour:'Mon chemin', titre:`${L.icon} ${L.titre}`, sous:`Salma & Ghazala · épisode ${L.n} / 10 · ${L.sous}`, controle:true, reflexion:1200,
    bandeau:`<div class="arband"><span>${A(L.l, 'arb')} Salma & Ghazala · épisode ${L.n}</span><span class="liens"><a href="ardoise-arabe.html">✍️ L'ardoise</a><a href="arabe-ghazala.html">Les épisodes</a></span></div>`,
    histoire:{ titre:L.histoire, scenes:L.scenes.map((s, k) => ({ img:`arabe/img/a${L.n}_${k}.webp`, vid:['a4_0'].includes(`a${L.n}_${k}`) ? '' : `arabe/img/a${L.n}_${k}.mp4`, txt:s.txt })) },
    bonjour:`${E('مَرْحَبًا يَا سَلْمَى')} ! C'est moi, Ghazala ! Aujourd'hui, la lettre <b>${nom}</b> ${A(L.l)}. On regarde d'abord le dessin animé, puis 8 étapes. Chaque bonne réponse te donne un ticket 🎟️ pour Serpent Légendes.`,
    confetti:['⭐', '🎟️', '🦌', L.icon, '🌙'], revoir:'Mes mots à revoir', CH,
    fiche:[{ h:`La lettre ${nom}`, tag:A(L.l), html:`<p>${FORME[L.id]}.</p>${formesL}${sonsL}`, lire:`La lettre ${nom} : ${E(NOMAR[L.id])}. C'est ${FORME[L.id]}. ${L.sons.map(s => E(s[0])).join(', ')}.` },
      { h:'Mes mots', tag:'', html:motsL, lire:M.map(m => `${m[2]} : ${E(m[0])}.`).join(' ') },
      { h:'La règle', tag:'', html:L.regle, lire:L.regle }] };
})();
