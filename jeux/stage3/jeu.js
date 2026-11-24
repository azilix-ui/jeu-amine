/* Jasmin · Stage 3 — la course du TGM : dessin, commandes, sons, commentaire, sauvegarde, et la course en ligne (api/stage3.php).
   Les règles sont dans course.js. Les images : le décor « en vrai » du Jasmin 3 (jasmin3/m1), les héros « en vrai » (jasmin2/corps-*,
   stage2/heros/* pour glisser et danser), les animaux du Jasmin et du Stage 2, et les objets ComfyUI de stage3/img (docs/stage3/build_images.py). */
import { nouvellePartie, pas, resultat, PAS, MODES, dansTrou, NMONDES, CHAMPION_DES } from './course.js';
const modeDe = (mode, monde) => monde >= CHAMPION_DES ? 'champion' : mode;   // à partir du monde 6 : seulement le Champion

/* ---------- les mondes (24/11) : le décor du Jasmin 3 (jasmin3/m<n>), les objets ComfyUI (stage3/img/), les animaux du Jasmin et du Stage 2.
   Les règles ne connaissent que des rôles (poubelle, sacs, cageot, barriere = obstacles ; banane, huile = glissants ; linge = à passer en glissant ;
   chat, chien, scooter, mouette = ennemis) : chaque monde leur donne son image. lb = hauteur (fraction de l'image, depuis le haut) du bas de ce qui pend. */
const MONDES = [null,
  { nom:'Sidi Bou Saïd', titre:'Le TGM n\'attend pas !', d:'m1', ciel:['#5fb0ea', '#cfe9fb'], v:{ le:'le TGM', Le:'Le TGM', ar:'القِطَار', f:0, ou:'à la gare' }, amb:'amb-1',
    o:{ tgm:'tgm', gare:'gare', poubelle:'poubelle', sacs:'sacs', cageot:'cageot', barriere:'barriere', banane:'banane', huile:'huile', linge:'linge' }, lb:0, en:{ chat:'chat', chien:'chien', scooter:'scooter', mouette:'mouette' },
    intro:'Cours dans les rues de Sidi Bou Saïd pour attraper le TGM avant qu\'il parte ! Saute par-dessus les poubelles, glisse sous le linge, attention aux peaux de banane et à l\'huile…' },
  { nom:'La médina de Tunis', titre:'Le métro n\'attend pas !', d:'m6', ciel:['#6fb8ea', '#f6e6c8'], v:{ le:'le métro', Le:'Le métro', ar:'المِيتْرُو', f:0, ou:'à la station' }, amb:'amb-6',
    o:{ tgm:'m2/metro', gare:'m2/gare', poubelle:'m2/jarres', sacs:'m2/tapis', cageot:'m2/epices', barriere:'m2/charrette', banane:'m2/tomate', huile:'m2/flaque', linge:'m2/tapispendus' }, lb:.87, en:{ chat:'chat', chien:'chien', scooter:'scooter', mouette:'mouette' },
    intro:'Traverse les souks de la médina pour attraper le métro léger à Bab Saadoun ! Jarres, tapis, charrettes… et gare aux tomates écrasées !' },
  { nom:'La Goulette', titre:'Le bac n\'attend pas !', d:'m22', ciel:['#6ab8e8', '#fdf2d8'], v:{ le:'le bac', Le:'Le bac', ar:'العَبَّارَة', f:1, bat:1, ou:'au quai' }, amb:'amb-22',
    o:{ tgm:'m3/bac', gare:'m3/quai', poubelle:'m3/bitte', sacs:'m3/cordes', cageot:'m3/poissons', barriere:'m3/nasses', banane:'m3/poisson', huile:'m3/eau', linge:'m3/filets' }, lb:.86, en:{ chat:'chat', chien:'crabe', scooter:'scooter', mouette:'mouette' },
    intro:'Le long du port de La Goulette, cours prendre le bac ! Cordages, caisses de sardines, filets qui sèchent… et les crabes du quai !' },
  { nom:'Sousse', titre:'Le métro du Sahel n\'attend pas !', d:'m24', ciel:['#f0b070', '#fdeac8'], v:{ le:'le métro du Sahel', Le:'Le métro du Sahel', ar:'القِطَار', f:0, ou:'à la gare' }, amb:'amb-24',
    o:{ tgm:'m4/sahel', gare:'m4/gare', poubelle:'m4/chaises', sacs:'m4/valises', cageot:'m4/pot', barriere:'m4/banc', banane:'m4/glace', huile:'huile', linge:'m4/fanions' }, lb:.32, en:{ chat:'chat', chien:'chien', scooter:'scooter', mouette:'mouette' },
    intro:'Sur la corniche de Sousse, file attraper le métro du Sahel ! Chaises de café, valises, glaces tombées par terre…' },
  { nom:'Djerba', titre:'Le bac de Djerba n\'attend pas !', d:'m8', ciel:['#6cc4f0', '#e6f7ff'], v:{ le:'le bac', Le:'Le bac', ar:'العَبَّارَة', f:1, bat:1, ou:'au quai' }, amb:'amb-8',
    o:{ tgm:'m3/bac', gare:'m3/quai', poubelle:'m5/jarre', sacs:'m5/paniers', cageot:'m5/poteries', barriere:'m5/palmes', banane:'m5/pasteque', huile:'huile', linge:'m5/tissus' }, lb:.79, en:{ chat:'crabe', chien:'chevre', scooter:'scooter', mouette:'mouette' },
    intro:'De Guellala au port d\'Ajim, cours prendre le bac de Djerba ! Jarres des potiers, paniers, tissus qui sèchent… et les chèvres de l\'île !' },
  { nom:'Les gorges de Selja', titre:'Le Lézard rouge n\'attend pas !', d:'m13', ciel:['#f0a070', '#fde0b8'], v:{ le:'le Lézard rouge', Le:'Le Lézard rouge', ar:'القِطَار', f:0, ou:'à la gare' }, amb:'amb-13',
    o:{ tgm:'m6/lezard', gare:'m6/gare', poubelle:'m6/rocher', sacs:'m6/pierres', cageot:'m6/dattes', barriere:'m6/buisson', banane:'m6/cailloux', huile:'m6/sable', linge:'m6/tronc' }, lb:.65, lsol:1, en:{ chat:'scorpion', chien:'chevre', scooter:'scooter', mouette:'faucon' },
    intro:'Dans les gorges de Selja, cours attraper le Lézard rouge, le vieux train du désert ! Rochers, buissons, cailloux qui roulent… et les scorpions !' },
  // 24/11 (nuit) : les mondes 7 à 21, en Champion seulement
  { nom:'Carthage', titre:'Le TGM n\'attend pas !', d:'m7', ciel:['#7ec4ec', '#f4ead2'], v:{ le:'le TGM', Le:'Le TGM', ar:'القِطَار', f:0, ou:'à la gare' }, amb:'amb-7',
    o:{ tgm:'tgm', gare:'gare', poubelle:'m7/colonne', sacs:'m7/amphores', cageot:'m7/chapiteau', barriere:'m10/pilier', banane:'m7/olives', huile:'huile', linge:'m7/vigne' }, lb:0.35, en:{ chat:'chat', chien:'chien', scooter:'scooter', mouette:'mouette' },
    intro:'Entre les ruines de Carthage, colonnes tombées et amphores, cours attraper le TGM à Carthage-Hannibal !' },
  { nom:'Hammamet', titre:'Le petit train n\'attend pas !', d:'m26', ciel:['#6ac0f0', '#fdf4dc'], v:{ le:'le petit train', Le:'Le petit train', ar:'القِطَار الصَّغِير', f:0, ou:'au kiosque' }, amb:'amb-7',
    o:{ tgm:'m8/petittrain', gare:'m8/gare', poubelle:'m8/parasol', sacs:'m15/bouees', cageot:'m8/seau', barriere:'m8/transats', banane:'m8/creme', huile:'m8/algues', linge:'m8/serviettes' }, lb:0.78, en:{ chat:'crabe', chien:'chien', scooter:'scooter', mouette:'mouette' },
    intro:'Sur la plage de Hammamet, le petit train touristique va partir ! Parasols, transats, crème solaire renversée… et les crabes !' },
  { nom:'Kairouan', titre:'Le louage n\'attend pas !', d:'m14', ciel:['#f2b46a', '#fde8c4'], v:{ le:'le louage', Le:'Le louage', ar:'اللُّوَاج', f:0, ou:'à la station' }, amb:'amb-14',
    o:{ tgm:'m9/louage', gare:'m9/station', poubelle:'m9/kanoun', sacs:'m9/coussins', cageot:'m9/makrouds', barriere:'m9/metier', banane:'m9/miel', huile:'m9/semoule', linge:'m9/lanternes' }, lb:0.59, en:{ chat:'chat', chien:'chien', scooter:'scooter', mouette:'cigogne' },
    intro:'Dans les rues de Kairouan, entre les makrouds et les métiers à tisser, cours prendre le louage !' },
  { nom:'El Jem', titre:'Le train n\'attend pas !', d:'m11', ciel:['#7ec4ec', '#f6e8c8'], v:{ le:'le train', Le:'Le train', ar:'القِطَار', f:0, ou:'à la gare' }, amb:'amb-11',
    o:{ tgm:'m10/train', gare:'m10/gare', poubelle:'m10/pilier', sacs:'m10/sacsble', cageot:'m10/caisseolives', barriere:'m10/cloture', banane:'m10/melon', huile:'huile', linge:'m10/banderoles' }, lb:0.44, en:{ chat:'chat', chien:'chien', scooter:'scooter', mouette:'faucon' },
    intro:'Au pied du grand amphithéâtre d\'El Jem, le jour du festival : le train pour Sfax va partir !' },
  { nom:'Tozeur', titre:'La calèche n\'attend pas !', d:'m2', ciel:['#7cc8e8', '#e8f6d8'], v:{ le:'la calèche', Le:'La calèche', ar:'العَرَبَة', f:1, fe:1, ou:'à l\'abri' }, amb:'amb-2',
    o:{ tgm:'m11/caleche', gare:'m11/station', poubelle:'m11/souche', sacs:'m11/briques', cageot:'m11/panierdattes', barriere:'m11/roseaux', banane:'m11/dattes', huile:'m11/boue', linge:'m11/palmes' }, lb:0.44, en:{ chat:'scorpion', chien:'chevre', scooter:'scooter', mouette:'faucon' },
    intro:'Dans la palmeraie de Tozeur, cours attraper la calèche ! Dattes écrasées, boue, palmes qui pendent… et les scorpions !' },
  { nom:'Le Chott el-Jérid', titre:'Le bus n\'attend pas !', d:'m12', ciel:['#b8c8f0', '#fbe8f0'], v:{ le:'le bus', Le:'Le bus', ar:'الحَافِلَة', f:1, ou:'à l\'arrêt' }, amb:'amb-12',
    o:{ tgm:'m12/bus', gare:'m12/arret', poubelle:'m12/sel', sacs:'m12/bidons', cageot:'m12/pneu', barriere:'barriere', banane:'m12/selmouille', huile:'m2/flaque', linge:'m12/toile' }, lb:0.24, en:{ chat:'scorpion', chien:'chien', scooter:'scooter', mouette:'faucon' },
    intro:'Sur la route du lac de sel, cours prendre le bus ! Tas de sel, bidons, sel mouillé qui glisse…' },
  { nom:'Les dunes de Douz', titre:'La caravane n\'attend pas !', d:'m3', ciel:['#f0a85a', '#fde3b0'], v:{ le:'la caravane', Le:'La caravane', ar:'القَافِلَة', f:1, fe:1, ou:'au puits' }, amb:'amb-3',
    o:{ tgm:'m13/caravane', gare:'m13/puits', poubelle:'m13/cactus', sacs:'m13/couvertures', cageot:'m11/panierdattes', barriere:'m13/tambours', banane:'m6/cailloux', huile:'m6/sable', linge:'m13/tente' }, lb:0.85, en:{ chat:'scorpion', chien:'chevre', scooter:'scooter', mouette:'faucon' },
    intro:'Dans le Sahara, à Douz, rejoins la caravane de dromadaires avant qu\'elle parte ! Cactus, tentes, sable qui glisse…' },
  { nom:'Matmata', titre:'Le louage n\'attend pas !', d:'m9', ciel:['#e0a060', '#f8dcb0'], v:{ le:'le louage', Le:'Le louage', ar:'اللُّوَاج', f:0, ou:'à la station' }, amb:'amb-9',
    o:{ tgm:'m9/louage', gare:'m9/station', poubelle:'m5/jarre', sacs:'m5/paniers', cageot:'m14/meule', barriere:'m6/pierres', banane:'m14/farine', huile:'huile', linge:'m2/tapispendus' }, lb:0.87, en:{ chat:'herisson', chien:'chevre', scooter:'scooter', mouette:'faucon' },
    intro:'Entre les maisons creusées dans la terre de Matmata, cours prendre le louage ! Meules, jarres, farine renversée…' },
  { nom:'Tabarka', titre:'Le bateau n\'attend pas !', d:'m10', ciel:['#5fb0e8', '#dff3ff'], v:{ le:'le bateau', Le:'Le bateau', ar:'المَرْكَب', f:0, bat:1, ou:'au ponton' }, amb:'amb-10',
    o:{ tgm:'m15/bateau', gare:'m15/ponton', poubelle:'m15/ancre', sacs:'m15/bouees', cageot:'m3/poissons', barriere:'m3/nasses', banane:'m3/poisson', huile:'m8/algues', linge:'m15/voiles' }, lb:0.85, en:{ chat:'crabe', chien:'chien', scooter:'scooter', mouette:'mouette' },
    intro:'Sur le port de Tabarka, sous le fort génois, cours prendre le bateau ! Ancres, bouées, algues qui glissent…' },
  { nom:'Aïn Draham', titre:'Le car n\'attend pas !', d:'m4', ciel:['#8fc8f0', '#eef8ff'], v:{ le:'le car', Le:'Le car', ar:'الحَافِلَة', f:1, ou:'au chalet' }, amb:'amb-4',
    o:{ tgm:'m12/bus', gare:'m16/chalet', poubelle:'m11/souche', sacs:'m16/buches', cageot:'m16/caissepommes', barriere:'m10/cloture', banane:'m16/feuilles', huile:'m16/verglas', linge:'m16/branche' }, lb:0.93, lsol:1, en:{ chat:'herisson', chien:'chien', scooter:'scooter', mouette:'faucon' },
    intro:'Dans la forêt d\'Aïn Draham, cours prendre le car de montagne ! Bûches, feuilles mouillées, verglas, branches tombées…' },
  { nom:'Le Kef', titre:'Le train n\'attend pas !', d:'m27', ciel:['#7aa8d8', '#e8eef4'], v:{ le:'le train', Le:'Le train', ar:'القِطَار', f:0, ou:'à la gare' }, amb:'amb-4',
    o:{ tgm:'m10/train', gare:'m10/gare', poubelle:'m17/tonneau', sacs:'m17/boulets', cageot:'m10/caisseolives', barriere:'m17/canon', banane:'m17/figues', huile:'m2/flaque', linge:'m17/drapeaux' }, lb:0.46, en:{ chat:'chat', chien:'chevre', scooter:'scooter', mouette:'faucon' },
    intro:'Au pied de la kasbah du Kef, entre les vieux canons, cours prendre le train !' },
  { nom:'Dougga', titre:'La calèche n\'attend pas !', d:'m19', ciel:['#7ab8e8', '#fdf0c8'], v:{ le:'la calèche', Le:'La calèche', ar:'العَرَبَة', f:1, fe:1, ou:'à l\'abri' }, amb:'amb-19',
    o:{ tgm:'m11/caleche', gare:'m11/station', poubelle:'m7/colonne', sacs:'m7/amphores', cageot:'m7/chapiteau', barriere:'m10/pilier', banane:'m7/olives', huile:'m11/boue', linge:'m7/vigne' }, lb:0.35, en:{ chat:'chat', chien:'chevre', scooter:'scooter', mouette:'cigogne' },
    intro:'Dans les ruines romaines de Dougga, au milieu des oliviers, cours attraper la calèche ! Gare aux chèvres !' },
  { nom:'Kerkennah', titre:'Le bac n\'attend pas !', d:'m20', ciel:['#8ad8e8', '#fdf6e0'], v:{ le:'le bac', Le:'Le bac', ar:'العَبَّارَة', f:1, bat:1, ou:'au quai' }, amb:'amb-20',
    o:{ tgm:'m3/bac', gare:'m3/quai', poubelle:'m3/bitte', sacs:'m3/cordes', cageot:'m3/poissons', barriere:'m3/nasses', banane:'m3/poisson', huile:'m3/eau', linge:'m3/filets' }, lb:0.86, en:{ chat:'crabe', chien:'chat', scooter:'scooter', mouette:'mouette' },
    intro:'Aux îles Kerkennah, chez les pêcheurs de poulpes, cours prendre le bac pour Sfax !' },
  { nom:'Le Cap Bon', titre:'Le train n\'attend pas !', d:'m21', ciel:['#5aa8e8', '#fde8c0'], v:{ le:'le train', Le:'Le train', ar:'القِطَار', f:0, ou:'à la gare' }, amb:'amb-21',
    o:{ tgm:'m10/train', gare:'m4/gare', poubelle:'m2/jarres', sacs:'m5/paniers', cageot:'cageot', barriere:'m5/poteries', banane:'m20/orange', huile:'huile', linge:'m20/piments' }, lb:0.73, en:{ chat:'chat', chien:'chien', scooter:'scooter', mouette:'mouette' },
    intro:'Chez les potiers de Nabeul et dans les orangers du Cap Bon, cours prendre le train ! Oranges écrasées, piments qui sèchent…' },
  { nom:'Testour', titre:'Le dernier train n\'attend pas !', d:'m23', ciel:['#8ac0e8', '#fdeccc'], v:{ le:'le train', Le:'Le train', ar:'القِطَار', f:0, ou:'à la gare' }, amb:'amb-23',
    o:{ tgm:'m10/train', gare:'m10/gare', poubelle:'m21/rosiers', sacs:'m21/tuiles', cageot:'m16/caissepommes', barriere:'m10/cloture', banane:'m17/figues', huile:'m2/flaque', linge:'m21/guirlande' }, lb:0.75, en:{ chat:'chat', chien:'chien', scooter:'scooter', mouette:'cigogne' },
    intro:'La grande finale ! Dans Testour l\'andalouse, aux toits de tuiles et aux rosiers, attrape le dernier train !' },
];
// le bruit du véhicule de chaque monde (bruitages ElevenLabs du 24/11, stage3/son.php) : train, tram, corne (bateau), bus, caleche, caravane
const SONV = { 'le TGM':'train', 'le métro':'tram', 'le métro du Sahel':'tram', 'le Lézard rouge':'train', 'le train':'train', 'le bac':'corne', 'le bateau':'corne', 'le petit train':'tram', 'le louage':'bus', 'le bus':'bus', 'le car':'bus', 'la calèche':'caleche', 'la caravane':'caravane' };
const MD = () => MONDES[(G && G.monde) || prefs.monde || 1] || MONDES[1];


const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const API = new URL('../../api/stage3.php', import.meta.url).href;
const HEROS = [['essil', 'Essil'], ['salma', 'Salma'], ['amine', 'Amine'], ['anis', 'Papa'], ['imen', 'Maman'], ['nour', 'Nour'], ['yasmine', 'Yasmine'], ['fares', 'Farès']];
const FAMILLE = ['essil', 'salma', 'amine', 'anis', 'imen'], TAILLE = { amine:.8, salma:.9, essil:.97, nour:.92, yasmine:.92, anis:1.08, imen:1.05, fares:1.04 };
const teteDe = id => FAMILLE.includes(id) ? `avatars/${id}.webp` : `avatars/mascotte-${id}.webp`;
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ---------- le joueur, sa sauvegarde ---------- */
const prefs = Object.assign({ son:true, amb:true, com:'ar', bs:1, mode:'tranquille', monde:1 }, store.get('stage3-prefs', {}));
const sauvePrefs = () => store.set('stage3-prefs', prefs);
let joueur = null, sv = null;
const cle = () => 'stage3:' + joueur;
const neuf = () => ({ heros:'', best:{}, ouvert:1, parties:0, gagnees:0, t:0 });
function monHeros(){ const k = norm(joueur); if(FAMILLE.includes(k)) return k; const h = window.Famille && Famille.head ? Famille.head(joueur) : null; return h && TAILLE[h.id] ? h.id : 'nour'; }
function heroId(){ if(sv && TAILLE[sv.heros]) return sv.heros; const j = store.get('jasmin:' + joueur, {}) || {}; return TAILLE[j.heros] ? j.heros : monHeros(); }
function tenueDe(){ const j = store.get('jasmin:' + joueur, {}) || {}; return /^[a-z]{2,10}$/.test(j.tenue || '') ? j.tenue : 'classique'; }   // la tenue portée dans le Jasmin
function sauve(){ if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); }
function repare(){ for(const m of ['tranquille', 'champion']) if(sv.best[m] && !sv.best['m1-' + m]){ sv.best['m1-' + m] = sv.best[m]; delete sv.best[m]; } if(!(sv.ouvert >= 1)) sv.ouvert = 1; if(Object.keys(sv.best).some(k => k.startsWith('m1-'))) sv.ouvert = Math.max(sv.ouvert, 2); }   // l'ancienne sauvegarde (un seul monde)
async function setJoueur(n){ joueur = n; sv = Object.assign(neuf(), store.get(cle(), {}) || {}); repare();
  if(window.Famille && Famille.track){ Famille.track('stage3', n, [cle()]); try{ const r = await Famille.load('stage3', n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = Object.assign(neuf(), d); repare(); store.set(cle(), sv); } }catch(e){} }
  if(etat === 'menu') menu(); }
async function choisirJoueur(){ if(!window.Famille) return null; const n = await Famille.choosePlayer({ title:'Qui court ?', cancel:!!joueur, extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }],
  avatar:k => `<img src="avatars/${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` }); if(n) await setJoueur(n); return n; }

/* ---------- les images ---------- */
const IM = {}; const img = (k, src) => { if(IM[k]) return IM[k]; const i = new Image(); i.src = src; IM[k] = i; return i; };
const ok = i => i && i.complete && i.naturalWidth > 0;
['piece', 'jasmin_or', 'the', 'chechia', 'lanterne'].forEach(k => img(k, `jasmin3/m1/${k}.webp`));
const DECOR = ['fond', 'maisons', 't_dessus', 't_mur', 't_mer'];
function chargeMonde(n){ const W = MONDES[n]; DECOR.forEach(k => img(W.d + '/' + k, `jasmin3/${W.d}/${k}.webp`)); for(const f of Object.values(W.o)) img('o/' + f, `stage3/img/${f}.webp?v=2`); motifs = {}; }
const IMo = k => IM['o/' + MD().o[k]], IMd = k => IM[MD().d + '/' + k];
const SPR = { chat:{ f:'jasmin2/chat.webp', h:40, dy:2 }, chien:{ f:'stage2/chien-anim.webp', h:42 }, mouette:{ f:'jasmin2/mouette.webp', h:52, dy:14 },
  crabe:{ f:'jasmin2/crabe.webp', h:34, dy:2 }, herisson:{ f:'jasmin2/herisson-anim.webp', h:30, dy:2 }, cigogne:{ f:'jasmin2/cigogne.webp', h:60, dy:16 }, chevre:{ f:'jasmin2/chevre-anim.webp', h:46, dy:2 }, scorpion:{ f:'jasmin2/scorpion.webp', h:36, dy:2 }, faucon:{ f:'jasmin2/faucon.webp', h:50, dy:12 } };
Object.entries(SPR).forEach(([k, s]) => img('sp_' + k, s.f + '?v=2')); img('scooter', 'stage2/en/scooter.webp?v=1');
// les héros : la planche de course du Jasmin (6 × 4 : 0-11 la foulée, 12-19 le bond, 20 de profil, 21 de face) + les gestes du Stage 2 (glisser, danser)
const CORPS = {};
function corps(id, tenue){ const k = id + '|' + tenue; if(CORPS[k]) return CORPS[k]; const C = CORPS[k] = { im:null, g:null };
  const im = new Image(); im.onload = () => { const cw = im.naturalWidth / 6, ch = im.naturalHeight / 4, c = document.createElement('canvas'); c.width = cw; c.height = ch; const x = c.getContext('2d', { willReadFrequently:true }); x.drawImage(im, 2 * cw, 3 * ch, cw, ch, 0, 0, cw, ch);
    const d = x.getImageData(0, 0, cw, ch).data; let top = ch, feet = 0; for(let y = 0; y < ch; y++){ let n = 0; for(let q = 0; q < cw; q++) if(d[(y * cw + q) * 4 + 3] > 120) n++; if(n > 2){ if(y < top) top = y; feet = y; } }
    C.im = { im, cw, ch, top, feet, k:TAILLE[id] || 1 }; };
  im.onerror = () => { if(tenue !== 'classique'){ const b = corps(id, 'classique'); const t = setInterval(() => { if(b.im){ C.im = b.im; C.g = C.g || b.g; clearInterval(t); } }, 300); } };
  im.src = `jasmin2/corps-${id}${tenue === 'classique' ? '' : '-' + tenue}.webp?v=2`;
  const gk = id + (tenue === 'classique' ? '' : '-' + tenue), meta = (window.S2_GESTES || {})[gk] || (window.S2_GESTES || {})[id];
  if(meta){ const gi = new Image(); gi.onload = () => { C.g = Object.assign({ im:gi }, meta); }; gi.src = `stage2/heros/${(window.S2_GESTES || {})[gk] ? gk : id}.webp?v=${meta.v || 1}`; }
  // les poses du Stage 3 (ComfyUI, 24/11) : glisser, tombé sonné, assis qui se relève (docs/stage3/poses.py)
  const P3 = window.S3_POSES || {}, pk = P3[gk] ? gk : P3[id] ? id : null;
  if(pk){ const pi = new Image(); pi.onload = () => { C.p = Object.assign({ im:pi }, P3[pk]); }; pi.src = `stage3/heros/${pk}.webp?v=${P3[pk].v || 1}`; }
  return C; }

/* ---------- les sons ---------- */
let AC = null, master = null;
function audio(){ if(AC) S3.charge(); if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .9; master.connect(AC.destination); if(window.Sons) Sons.charger('jasmin', ['saut', 'piece', 'aie', 'chute', 'gemme', 'bonus', 'victoire', 'ecrase', 'lampe', 'atterrir', MD().amb]); }catch(e){} } if(AC && AC.state !== 'running') AC.resume(); return AC; }
function bip(f, d, type = 'sine', v = .08, f2 = 0, t0 = 0){ if(!AC || !prefs.son) return; const t = AC.currentTime + t0, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .02); }
/* les bruitages de course du Stage 3 : 2 versions de chaque, tirées au hasard */
const S3 = { b:{}, charge(){ if(S3.fait || !AC) return; S3.fait = true; for(const n of ['saut', 'glisse', 'chute', 'etoiles', 'releve', 'train', 'tram', 'corne', 'bus', 'caleche', 'caravane', 'foule', 'depart', 'pas']) for(const k of [1, 2])
    fetch(new URL('son.php?n=' + n + k, import.meta.url)).then(r => r.ok ? r.arrayBuffer() : null).then(a => a && AC.decodeAudioData(a)).then(b => { if(b) (S3.b[n] = S3.b[n] || []).push(b); }).catch(() => {}); },
  joue(n, vol = .8, rate = 1){ if(!prefs.son || !audio()) return false; const l = S3.b[n]; if(!l || !l.length) return false; const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = l[Math.floor(Math.random() * l.length)]; s.playbackRate.value = rate; g.gain.value = vol; s.connect(g); g.connect(master); s.start(); return true; },
  pas:null, pasMaj(on, rate){ if(!AC) return; if(on && prefs.son && S3.b.pas){ if(!S3.pas){ const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = S3.b.pas[0]; s.loop = true; g.gain.value = 0; s.connect(g); g.connect(master); s.start(); S3.pas = { s, g }; }
      S3.pas.g.gain.setTargetAtTime(.32, AC.currentTime, .05); S3.pas.s.playbackRate.setTargetAtTime(rate, AC.currentTime, .1); } else if(S3.pas) S3.pas.g.gain.setTargetAtTime(0, AC.currentTime, .05); } };
const vehicule = (vol = .8) => S3.joue(SONV[MD().v.le] || 'train', vol) || klaxon();
function son(n, secours){ if(!prefs.son || !audio()) return; if(window.Sons && Sons.jouer(AC, master, n, .7)) return; secours && secours(); }
const klaxon = () => { if(!prefs.son || !audio()) return; if(MD().v.bat){ bip(110, 1.1, 'sawtooth', .07); bip(138, 1.1, 'sawtooth', .05); return; }   // la corne du bac
  [0, .35].forEach(t0 => { bip(440, .3, 'sawtooth', .05, 0, t0); bip(554, .3, 'sawtooth', .04, 0, t0); }); };
function ambiance(on){ if(!window.Sons || !audio()) return; if(on && prefs.amb){ const a = MD().amb; Sons.charger('jasmin', [a]); Sons.boucle(AC, master, a, .35); } else Sons.stop(); }

/* ---------- le commentaire (arabe par défaut, voix Mohammad ; français : Céline ; Lulu pour Amine) ---------- */
function PH(k){ const V = MD().v, f = V.f;   // f = 1 : la, le bac (en arabe : العَبَّارَة, féminin)
  return ({
  depart:[`Vite ! ${V.Le} part bientôt, cours ${V.ou} !`, `أَسْرِعْ! ${V.ar} ${f ? 'سَتَنْطَلِقُ' : 'سَيَنْطَلِقُ'} قَرِيبًا!`],
  presse:['Plus que quinze secondes !', 'بَقِيَتْ خَمْسَ عَشْرَةَ ثَانِيَة!'],
  arrive:[`Bravo, tu as attrapé ${V.le} !`, `أَحْسَنْت! لَحِقْتَ بِ${V.ar}!`],
  rate:[`Oh non, ${V.le} est parti${V.fe ? 'e' : ''}… Essaie encore !`, `لِلْأَسَف، ${f ? 'اِنْطَلَقَتِ' : 'اِنْطَلَقَ'} ${V.ar}… حَاوِلْ مَرَّةً أُخْرَى!`],
  ko:['Tu n\'as plus de force… Ce n\'est pas grave, on recommence !', 'لَا بَأْس، نُعِيدُ مِنْ جَدِيد!'],
  jasmin:['Un jasmin doré !', 'يَاسَمِينَةٌ ذَهَبِيَّة!'],
  sonne:['Aïe ! Relève-toi vite !', 'آه! قُمْ بِسُرْعَة!'],
  })[k]; }
let parleT = 0;
function parle(k){ const L = norm(joueur) === 'amine' ? (prefs.com === 'non' ? 'non' : 'fr') : prefs.com, p = PH(k); if(L === 'non' || !p || !('speechSynthesis' in window)) return;
  if(k === 'sonne'){ if(performance.now() - parleT < 6000) return; } parleT = performance.now();
  try{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(L === 'ar' ? p[1] : p[0]); u.lang = L === 'ar' ? 'ar' : 'fr-FR'; speechSynthesis.speak(u); }catch(e){} }
let bulleT = 0; function bulle(t, ms = 1800){ const b = $('bulle'); b.textContent = t; b.classList.add('on'); clearTimeout(bulleT); bulleT = setTimeout(() => b.classList.remove('on'), ms); }

/* ---------- l'écran ---------- */
// l'échelle : au moins 330 unités de haut et 760 de large (pour voir arriver les obstacles, même en portrait) ; le sol est à 72 % de la hauteur
const cv = $('cv'), ctx = cv.getContext('2d'); let DPR = 1, CW = 0, CH = 0, SC = 1, VW = 0, GYs = 0, HAUT = 0, BAS = 0;
function resize(){ DPR = Math.min(2, devicePixelRatio || 1); CW = innerWidth; CH = innerHeight; cv.width = Math.round(CW * DPR); cv.height = Math.round(CH * DPR); SC = Math.min(CH / 330, CW / 760); VW = CW / SC; GYs = CH * (CH > CW ? .66 : .74); HAUT = GYs / SC; BAS = (CH - GYs) / SC; document.documentElement.style.setProperty('--bs', prefs.bs); }
addEventListener('resize', () => { resize(); if(document.body.classList.contains('touch') && CH > CW && etat === 'course' && !L) togglePause(); }); resize();
if(matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
function montre(id){ document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); document.body.classList.toggle('menu', id === 'menu'); }

/* ---------- la partie ---------- */
let G = null, etat = 'menu', camX = 0, acc = 0, last = 0, presse = false, depart = 0;   // etat : menu, compte, course, pause, fin
const C = { saut:false, bas:false, vite:false, lent:false }, K = {};
let L = null;   // la course en ligne (classe Ligne plus bas) ; null en solo
function partie(graine, mode, monde = prefs.monde || 1){
  mode = modeDe(mode, monde); chargeMonde(monde); G = nouvellePartie(graine, mode, monde); camX = 0; poussiere.length = 0; acc = 0; presse = false; G.vu = G.h.x;
  const id = heroId(), tn = tenueDe(); G.moiC = corps(id, tn); G.heros = id;
  document.body.classList.add('joue'); montre('-'); audio(); ambiance(true);
  etat = 'compte'; depart = performance.now() + 3000; $('compte').classList.add('on'); $('compte').textContent = '3';
  rendHud(); }
function lance(){ if(!joueur) return choisirJoueur().then(n => n && lance()); partie((Math.random() * 2 ** 31) | 0, prefs.mode, prefs.monde); }

const CLAVIER = { ArrowUp:'saut', ' ':'saut', w:'saut', z:'saut', ArrowDown:'bas', s:'bas', ArrowRight:'vite', d:'vite', ArrowLeft:'lent', q:'lent', a:'lent' };
addEventListener('keydown', e => { const k = CLAVIER[e.key] || CLAVIER[e.key.toLowerCase()]; if(k && etat !== 'menu'){ K[k] = true; e.preventDefault(); }
  if((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && (etat === 'course' || etat === 'pause')) togglePause(); });
addEventListener('keyup', e => { const k = CLAVIER[e.key] || CLAVIER[e.key.toLowerCase()]; if(k) K[k] = false; });
addEventListener('blur', () => { for(const k in K) K[k] = false; if(etat === 'course' && !L) togglePause(); });
const TB = { bLent:'lent', bVite:'vite', bBas:'bas', bSaut:'saut' }, TT = {};
for(const [id, k] of Object.entries(TB)){ const b = $(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); audio(); TT[k] = true; b.classList.add('on'); try{ b.setPointerCapture(e.pointerId); }catch(er){} });
  const off = () => { TT[k] = false; b.classList.remove('on'); }; b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off); }
function manette(){ const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null; if(!gp) return {}; const b = i => gp.buttons[i] && gp.buttons[i].pressed, ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  if(b(9) && !manette.st && (etat === 'course' || etat === 'pause')) togglePause(); manette.st = b(9);
  return { saut:b(0) || b(12) || ay < -.6, bas:b(13) || ay > .6, vite:b(15) || ax > .5, lent:b(14) || ax < -.5 }; }
function lisCommandes(){ const m = manette(); for(const k of ['saut', 'bas', 'vite', 'lent']) C[k] = !!(K[k] || TT[k] || m[k]); }
function togglePause(){ if(L){ L.demandeQuitter(); return; } if(etat === 'course'){ etat = 'pause'; ambiance(false); montre('pause'); } else if(etat === 'pause'){ etat = 'course'; last = performance.now(); ambiance(true); montre('-'); } }
$('pauseB').onclick = () => { audio(); togglePause(); };
$('pReprend').onclick = () => togglePause();
$('pRecommence').onclick = () => { montre('-'); partie((Math.random() * 2 ** 31) | 0, G.P.mode, G.monde); };
$('pMenu').onclick = () => quitter();
function quitter(){ etat = 'menu'; G = null; ambiance(false); document.body.classList.remove('joue'); $('compte').classList.remove('on'); if(L){ L.quitte(); L = null; } menu(); }

// les événements de la course : sons, bulles, commentaire
function evenements(){ for(const e of G.ev){
  if(e.k === 'saut'){ if(!S3.joue('saut', .6)) son('saut', () => bip(520, .12, 'square', .05, 880)); }
  else if(e.k === 'piece') son('piece', () => bip(1320, .08, 'square', .05));
  else if(e.k === 'jasmin'){ son('gemme', () => bip(990, .3, 'triangle', .08, 1480)); bulle('🌼 Un jasmin doré !'); parle('jasmin'); }
  else if(e.k === 'bonus'){ son('bonus'); bulle(e.t === 'the' ? '🍵 Thé à la menthe : turbo !' : '🎩 La chéchia te protège !'); }
  else if(e.k === 'aie'){ son('aie', () => bip(200, .2, 'sawtooth', .06, 90)); if(navigator.vibrate) try{ navigator.vibrate(60); }catch(er){} }
  else if(e.k === 'sonne'){ if(S3.joue('chute', .9)) setTimeout(() => S3.joue('etoiles', .6), 300); else { son('chute', () => bip(150, .3, 'triangle', .07, 70)); setTimeout(() => bip(1200, .08, 'sine', .04), 250); setTimeout(() => bip(1500, .08, 'sine', .04), 420); } bulle('💫 Aïe ! Sonné… il se relève', 1500); parle('sonne'); }
  else if(e.k === 'releve'){ S3.joue('releve', .6); }
  else if(e.k === 'glisse'){ S3.joue('glisse', .7); const n = MD().o[e.o.t].split('/').pop(); bulle(({ banane:'🍌 Oups, une peau de banane !', huile:'🫒 Attention, de l\'huile !', tomate:'🍅 Oups, une tomate écrasée !', flaque:'🫧 Ça glisse, de l\'eau savonneuse !', poisson:'🐟 Oups, une sardine !', eau:'💧 Ça glisse, de l\'eau de mer !', glace:'🍦 Oups, une glace tombée !', pasteque:'🍉 Oups, de la pastèque !', cailloux:'🪨 Attention, des cailloux qui roulent !', sable:'🏜️ Ça glisse, du sable !' })[n] || '😵 Ça glisse !', 1400); bip(700, .4, 'sine', .06, 200); }
  else if(e.k === 'trou'){ son('chute'); bulle('Aïe, un trou ! Saute par-dessus la prochaine fois.', 1800); }
  else if(e.k === 'linge'){ bulle('⤓ Glisse dessous la prochaine fois !', 1500); }
  else if(e.k === 'renverse'){ if(e.o.t === 'poubelle') bip(160, .25, 'triangle', .07, 80); }
  else if(e.k === 'ecrase'){ son('ecrase', () => bip(300, .15, 'square', .06, 600)); }
  else if(e.k === 'bouclier'){ bulle('🎩 La chéchia t\'a protégé !'); }
  else if(e.k === 'lanterne'){ son('lampe'); bulle(e.soin ? '🏮 La lanterne te redonne de la force ❤️' : '🏮 Une lanterne', 1300); }
  else if(e.k === 'arrive'){ if(!S3.joue('foule', .8)) son('victoire'); setTimeout(() => vehicule(), 700); { const v = MD().v; if(!v.bat && SONV[v.le] !== 'caravane' && SONV[v.le] !== 'caleche') setTimeout(() => S3.joue('depart', .7), 1700); } parle('arrive'); G.danse = performance.now() / 1000; { const g0 = G; setTimeout(() => G === g0 && fin(), 4600); }; if(L) L.arrive(G); }
  else if(e.k === 'rate'){ vehicule(); parle('rate'); { const g0 = G; setTimeout(() => G === g0 && fin(), 2600); }; if(L) L.rate(G, 'rate'); }
  else if(e.k === 'ko'){ son('chute'); parle('ko'); { const g0 = G; setTimeout(() => G === g0 && fin(), 2600); }; if(L) L.rate(G, 'ko'); }
} G.ev.length = 0; }

function frame(now){
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if(etat === 'compte'){ const r = Math.ceil((depart - now) / 1000); $('compte').textContent = r > 0 ? r : 'Yalla !';
    if(r !== frame.r){ frame.r = r; if(r > 0) bip(660, .12, 'square', .06); else { bip(990, .3, 'square', .07); parle('depart'); } }
    if(now >= depart + 400){ etat = 'course'; $('compte').classList.remove('on'); } }
  if(G && (etat === 'course' || (etat === 'compte' && now >= depart) || etat === 'fin-attente')){
    lisCommandes(); acc += dt; while(acc >= PAS){ pas(G, G.etat === 'course' ? C : {}, PAS); acc -= PAS; } evenements();
    if(G.etat === 'course' && !presse && G.limite - G.t < 15){ presse = true; parle('presse'); vehicule(.6); } }
  if(G){ const h = G.h, court = etat === 'course' && G.etat === 'course' && h.sol && !(h.sonne > 0) && !h.glisse && Math.abs(h.vx) > 40; S3.pasMaj(court, Math.max(.7, Math.min(1.5, Math.abs(h.vx) / 280)));
    if(etat === 'course' && h.glisse && !G.glAvant) S3.joue('glisse', .6); G.glAvant = h.glisse; } else S3.pasMaj(false);
  if(G){ const cible = (G.etat === 'arrive' && G.vuX ? G.vuX : G.h.x) - VW * .3; camX += (cible - camX) * Math.min(1, dt * 8); if(G.h.chute > 0) camX = Math.min(camX, G.h.x - VW * .3); dessine(now / 1000); rendHud(); }
  if(L && G) L.avance(dt);
  requestAnimationFrame(frame);
}

/* ---------- le dessin ---------- */
function bande(im, h, par, y){ if(!ok(im)) return; const w = h * im.naturalWidth / im.naturalHeight, p = camX * par, k0 = Math.floor(p / w);
  for(let k = k0; k * w - p < VW + w; k++){ ctx.save(); const x = k * w - p; if(k % 2){ ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, w, h); } else ctx.drawImage(im, x, y, w, h); ctx.restore(); } }
let motifs = {};
function motif(k, taille){ k = MD().d + '/' + k; const im = IM[k]; if(!ok(im)) return null; let p = motifs[k]; if(!p) p = motifs[k] = ctx.createPattern(im, 'repeat'); p.setTransform(new DOMMatrix().scale(taille / im.naturalWidth)); return p; }
function dessine(t){
  ctx.setTransform(DPR * SC, 0, 0, DPR * SC, 0, DPR * GYs); ctx.imageSmoothingQuality = 'high';   // y = 0 : le sol
  const W = MD(), ciel = ctx.createLinearGradient(0, -HAUT, 0, 0); ciel.addColorStop(0, W.ciel[0]); ciel.addColorStop(1, W.ciel[1]); ctx.fillStyle = ciel; ctx.fillRect(0, -HAUT, VW, HAUT + BAS);
  const hf = Math.max(260, HAUT * .9); bande(IMd('fond'), hf, .15, -hf - 20);
  if(ok(IMd('maisons'))) bande(IMd('maisons'), 120, .45, -112);
  ctx.save(); ctx.translate(-Math.round(camX * SC * DPR) / (SC * DPR), 0);
  const P = G.P, x0 = camX - 60, x1 = camX + VW + 60;
  // la mer au fond des trous, puis le sol (dessus en faïence, mur à la chaux)
  const mer = motif('t_mer', 80); ctx.fillStyle = mer || '#2a7fc0'; ctx.fillRect(x0, 30, x1 - x0, BAS + 10);
  const morceaux = []; let a = x0; for(const tr of P.trous){ if(tr.x + tr.w < x0 || tr.x > x1) continue; if(tr.x > a) morceaux.push([a, tr.x]); a = Math.max(a, tr.x + tr.w); } if(a < x1) morceaux.push([a, x1]);
  const mur = motif('t_mur', 90), dessus = motif('t_dessus', 40);
  for(const [u, v] of morceaux){ ctx.fillStyle = mur || '#f1ede4'; ctx.fillRect(u, 0, v - u, BAS + 10); ctx.fillStyle = dessus || '#3a6fd0'; ctx.fillRect(u, -2, v - u, 14); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(u, 12, v - u, 3); }
  // la gare et le TGM
  const gx = P.gare, ig = IMo('gare'); if(ok(ig)){ const w = 330, h = Math.min(w * ig.naturalHeight / ig.naturalWidth, 260), w2 = h * ig.naturalWidth / ig.naturalHeight; ctx.drawImage(ig, gx + 30 - w2, -h + 6, w2, h); }
  ctx.fillStyle = '#8a8a8a'; ctx.fillRect(gx - 40, -4, 900, 4);
  let tx = gx + 60; if(G.etat === 'rate' || (G.etat === 'arrive' && G.danse && t - G.danse > MONTE)){ G.trainT = G.trainT || t; tx += Math.pow(t - G.trainT, 2) * 160; }
  G.tx = tx;
  const it = IMo('tgm'); if(ok(it)){ const w = 640, h = Math.min(w * it.naturalHeight / it.naturalWidth, 230), w2 = h * it.naturalWidth / it.naturalHeight; if(W.v.bat){ ctx.fillStyle = motif('t_mer', 80) || '#2a7fc0'; ctx.fillRect(gx + 40, 0, 1400, BAS + 10); } ctx.drawImage(it, tx, -h + (W.v.bat ? h * .18 : -2), w2, h); G.porte = [w2 * (W.v.bat ? .35 : .22), -h * (W.v.bat ? .42 : .14)]; }
  if(G.etat === 'course' && G.limite - G.t < 6 && Math.sin(t * 10) > 0){ ctx.fillStyle = '#ffdd33'; ctx.font = '800 22px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🔔', tx + 40, -150); }
  // les lanternes
  for(const lx of P.lanternes) if(lx > x0 && lx < x1 && ok(IM.lanterne)){ ctx.globalAlpha = G.lanterne >= lx ? 1 : .75; ctx.drawImage(IM.lanterne, lx - 10, -92, 22, 90); ctx.globalAlpha = 1; }
  // les obstacles
  for(const o of P.obstacles){ if(o.x + o.w < x0 || o.x > x1) continue; const im = IMo(o.t); if(!ok(im)) continue; const tombe = G.tombes.has(o), glisse = G.glisses.has(o);
    if(o.glisse){ const w = o.w + 10, h = Math.min(o.t === 'banane' ? 26 : 24, w * im.naturalHeight / im.naturalWidth, MD().d === 'm1' ? (o.t === 'banane' ? 12 : 24) : 99); ctx.globalAlpha = glisse ? .5 : 1; ctx.drawImage(im, o.x - 5, -h + 4, w, h); ctx.globalAlpha = 1; continue; }
    let h = o.t === 'sacs' ? o.h + 6 : o.t === 'poubelle' ? o.h + 4 : o.double ? o.h / 2 : o.h + 4, w = h * im.naturalWidth / im.naturalHeight;
    if(w > o.w * 1.9){ w = o.w * 1.9; h = w * im.naturalHeight / im.naturalWidth; }   // une image très large : on la tient à peu près dans la boîte
    ctx.save(); ctx.translate(o.x + o.w / 2, 0); if(tombe){ ctx.rotate(1.35); ctx.globalAlpha = .9; }
    ctx.drawImage(im, -w / 2, -h, w, h); if(o.double && !tombe) ctx.drawImage(im, -w / 2, -2 * h + 2, w, h); ctx.restore(); }
  // le linge (une corde entre deux poteaux)
  for(const l of P.linges){ if(l.x + l.w < x0 || l.x > x1) continue; const im = IMo('linge'); if(!ok(im)) continue;
    if(!W.lb){ const w = l.w + 30, h = w * im.naturalHeight / im.naturalWidth, y = -h * .98;
      ctx.drawImage(im, l.x - 15, y, w, h); ctx.strokeStyle = 'rgba(90,70,50,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(l.x - 10, y + h * .17); ctx.quadraticCurveTo(l.x + l.w / 2, y + h * .24, l.x + l.w + 10, y + h * .17); ctx.stroke(); }
    else if(W.lsol){ const w = l.w + 130, h = w * im.naturalHeight / im.naturalWidth; ctx.drawImage(im, l.x + l.w / 2 - w / 2, -h, w, h); }   // posé au sol (le tronc sur ses deux rochers)
    else { const w = l.w + 50, h = w * im.naturalHeight / im.naturalWidth, y = -50 - W.lb * h, x = l.x + l.w / 2 - w / 2;   // le bas de ce qui pend à 50 au-dessus du sol
      ctx.save(); ctx.beginPath(); ctx.rect(x - 10, -400, w + 20, 400); ctx.clip(); ctx.drawImage(im, x, y, w, h);
      if(y + h < 0){ ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + w * .025, y + h - 2); ctx.lineTo(x + w * .025, 0); ctx.moveTo(x + w * .975, y + h - 2); ctx.lineTo(x + w * .975, 0); ctx.stroke(); }
      ctx.restore(); } }
  // les dinars, les jasmins, les bonus
  P.pieces.forEach((p, i) => { if(G.pris.has('p' + i) || p.x < x0 || p.x > x1) return; const s = Math.abs(Math.cos(t * 4 + i)); if(ok(IM.piece)) ctx.drawImage(IM.piece, p.x - 9 * s, p.y - 9, 18 * s + .5, 18); });
  P.jasmins.forEach((p, i) => { if(G.pris.has('j' + i) || p.x < x0 || p.x > x1) return; if(ok(IM.jasmin_or)) ctx.drawImage(IM.jasmin_or, p.x - 16, p.y - 16 + Math.sin(t * 3) * 3, 32, 32); });
  P.bonus.forEach((b, i) => { if(G.pris.has('b' + i) || b.x < x0 || b.x > x1) return; const im = IM[b.t]; if(ok(im)) ctx.drawImage(im, b.x - 14, b.y - 14 + Math.sin(t * 3) * 2, 28, 28); });
  // les ennemis
  for(const e of G.ennemis){ if(!e.actif || e.parti || e.x < x0 - 60 || e.x > x1) continue; ctx.save(); ctx.translate(e.x, e.y); if(e.etourdi > 0){ ctx.globalAlpha = .8; ctx.rotate(-.25); }
    const et = MD().en[e.t] || e.t;
    if(et === 'scooter'){ const im = IM.scooter; if(ok(im)){ const h = 56, w = h * im.naturalWidth / im.naturalHeight; ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h, w, h); } }
    else { const s = SPR[et], im = IM['sp_' + et]; if(ok(im)){ const cw = im.naturalWidth / 12, ch = im.naturalHeight, w = s.h * cw / ch, f = e.etourdi > 0 ? 0 : Math.floor(t * (e.t === 'chien' ? 18 : 11)) % 12; ctx.scale(-1, 1); ctx.drawImage(im, f * cw, 0, cw, ch, -w / 2, -s.h + (s.dy || 0), w, s.h); } }
    if(e.etourdi > 0){ ctx.globalAlpha = 1; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💫', 0, -e.h - 8); }
    ctx.restore(); }
  // les autres coureurs (en ligne), en transparence, puis soi
  if(L) for(const o of L.fantomes()){ if(o.x < x0 - 60 || o.x > x1) continue; heros(o.C, { x:o.x, y:o.y, vx:o.vx, vy:o.vy, sol:o.a === 0, glisse:o.a === 2, sonne:o.a >= 3 ? (o.a === 4 ? .3 : 2) : 0, sonneMax:o.a === 5 ? 99 : 3, chute:0, inv:0 }, t, .5, o.danse ? o.danse : 0, o.nom); }
  dessinePoussiere(1 / 60);
  if(G.etat === 'arrive' && G.danse){   // 24/11 : il danse, saute dans le train, puis part avec lui en saluant
    const a = t - G.danse, p = G.porte || [140, -20], xd = gx + 60 + p[0], h = G.h;
    if(a < 1) heros(G.moiC, h, t, 1, G.danse);
    else if(a < MONTE){ const u = (a - 1) / (MONTE - 1), x = h.x + (xd - h.x) * u, y = p[1] * u - Math.sin(u * Math.PI) * 70; G.vuX = x; heros(G.moiC, { x, y, vx:200, vy:u < .5 ? -300 : 300, sol:false, inv:0 }, t, 1, 0); }
    else { const x = G.tx + p[0]; G.vuX = x; heros(G.moiC, { x, y:p[1], vx:0, vy:0, sol:true, inv:0 }, t, 1, 0, null, true); } }
  else heros(G.moiC, G.h, t, 1, G.danse || 0);
  ctx.restore();
}
// la poussière de la glissade (dessinée par le code)
const poussiere = [];
function etoilesSonne(x, y, t, r = 1){ for(let k = 0; k < 3; k++){ const a = t * 5 + k * 2.1; ctx.save(); ctx.translate(x + Math.cos(a) * 16 * r, y + Math.sin(a) * 5 * r); ctx.fillStyle = k % 2 ? '#fff6a0' : '#ffd23c'; ctx.beginPath();
  for(let i = 0; i < 10; i++){ const rr = i % 2 ? 2.4 : 5.6, b = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(b) * rr, Math.sin(b) * rr); } ctx.fill(); ctx.restore(); } }
// une pose du Stage 3 (glisse, tombe, releve), posée au sol, centrée sur le héros ; renvoie sa boîte (pour les étoiles)
function pose(Cp, nom, k, dx = 0){ const P = Cp && Cp.p, q = P && P.poses && P.poses[nom]; if(!q) return null; const s = 76 * k / P.ref, w = q[2] * s, h = q[3] * s;
  ctx.drawImage(P.im, q[0], q[1], q[2], q[3], -w / 2 + dx, -h, w, h); return { w, h }; }
const MONTE = 1.55;   // le moment où il est monté dans le train
function heros(Cp, h, t, alpha, danse, nom, salue){
  const B = Cp && Cp.im; if(h.inv > 0 && !(h.sonne > 0) && Math.sin(t * 40) > 0 && alpha === 1) return;
  ctx.save(); ctx.translate(h.x, h.y); ctx.globalAlpha = alpha;
  if(!B){ ctx.fillStyle = '#1f5fbf'; ctx.fillRect(-10, -66, 20, 66); ctx.restore(); return; }
  const k = B.k, sc = 76 * k / (B.feet - B.top), gs = Cp.g;
  const geste = (ligne, f) => { if(!gs || !gs.n || !gs.n[ligne]) return false; const n = gs.n[ligne], i = ((f % n) + n) % n, s = 76 * k / gs.ref, w = gs.cw * s, hh = gs.ch * s; ctx.drawImage(gs.im, i * gs.cw, ligne * gs.ch, gs.cw, gs.ch, -w / 2, -hh + (gs.pied ? gs.pied * s : 0), w, hh); return true; };
  const debout = f => { const w = B.cw * sc, hh = B.ch * sc; ctx.drawImage(B.im, (f % 6) * B.cw, Math.floor(f / 6) * B.ch, B.cw, B.ch, -w / 2, -B.feet * sc, w, hh); };
  let fait = false;
  if(h.sonne > 0){   // sonné : il tombe en arrière, reste par terre avec des étoiles, puis s'assoit et se relève
    const a = h.sonneMax - h.sonne, finit = h.sonne < .6 && h.sonneMax < 50;
    if(a < .16){ ctx.save(); ctx.rotate(-a / .16 * 1.3); debout(15); ctx.restore(); fait = true; }
    else { const bx = finit ? pose(Cp, 'releve', k) : pose(Cp, 'tombe', k, 0);
      if(bx){ fait = true; const bump = a < .4 ? Math.sin((a - .16) / .24 * Math.PI) * 6 : 0; if(bump) ctx.translate(0, -bump);
        if(alpha === 1 || true) etoilesSonne(finit ? -bx.w * .05 : -bx.w * .4, finit ? -bx.h * 1.02 : -bx.h * .95, t, k); }
      else { ctx.save(); ctx.rotate(finit ? -.5 : -1.45); debout(15); ctx.restore(); etoilesSonne(-20, -40, t, k); fait = true; } } }
  else if(danse) fait = geste(5, Math.floor((t - danse) * 10));
  else if(h.glisse || h.glissade > 0){ const bx = pose(Cp, 'glisse', k, 6); if(bx){ fait = true; if(alpha === 1 && Math.random() < .5) poussiere.push({ x:h.x - 22 + Math.random() * 8, y:-3 - Math.random() * 4, t:0 }); } else fait = geste(1, Math.floor(t * 14)); }
  if(!fait){ let f; const air = !h.sol;
    if(h.chute > 0 || h.trebuche > 0) f = 15; else if(air) f = h.vy < -260 ? 13 : h.vy < -90 ? 14 : h.vy < 90 ? 15 : h.vy < 300 ? 16 : 17; else if(Math.abs(h.vx) > 20) f = Math.floor(t * Math.max(8, Math.abs(h.vx) / 22)) % 12; else f = 20;
    if(salue) f = 21;   // dans le train : de face, il salue
    if(h.vx < -20) ctx.scale(-1, 1); debout(f); if(salue){ ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(Math.sin(t * 8) > 0 ? '👋' : '✋', 26 * k, -70 * k); } }
  ctx.globalAlpha = 1;
  if(nom){ ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(11,30,70,.75)'; const w = ctx.measureText(nom).width + 12; ctx.fillRect(-w / 2, -96, w, 16); ctx.fillStyle = '#fff'; ctx.fillText(nom, 0, -84); }
  if(alpha === 1 && G.h.chechia){ ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🎩', 0, -84); }
  if(alpha === 1 && G.h.the > 0){ ctx.fillStyle = 'rgba(125,255,176,.25)'; ctx.beginPath(); ctx.arc(0, -36, 34, 0, 7); ctx.fill(); }
  ctx.restore(); }
function dessinePoussiere(dt){ for(let i = poussiere.length - 1; i >= 0; i--){ const p = poussiere[i]; p.t += dt; if(p.t > .5){ poussiere.splice(i, 1); continue; }
  ctx.fillStyle = `rgba(200,180,150,${.5 * (1 - p.t / .5)})`; ctx.beginPath(); ctx.arc(p.x - p.t * 30, p.y - p.t * 14, 3 + p.t * 14, 0, 7); ctx.fill(); } }

/* ---------- le haut de l'écran ---------- */
function rendHud(){ if(!G) return; const h = G.h, M = G.M;
  let s = ''; for(let i = 0; i < M.morceaux; i++) s += `<i class="${i < h.morceaux ? '' : 'vide'}"></i>`; if($('vie').innerHTML !== s) $('vie').innerHTML = s; $('vie').classList.toggle('bas', h.morceaux <= 2);
  $('hVies').textContent = 'Monde ' + G.monde; $('hDin').textContent = '🪙 ' + G.dinars; $('hJas').textContent = '🌼 ' + G.jasmins + '/3';
  const reste = Math.max(0, G.limite - G.t), m = Math.floor(reste / 60), sec = Math.floor(reste % 60);
  const V = MD().v, ic = V.bat ? '⛴️' : '🚋'; $('chrono').textContent = G.etat === 'arrive' ? `🎉 Dans ${V.le.replace(/^le /, 'le ')} !` : G.etat === 'rate' ? `😢 ${V.Le} est parti${V.fe ? 'e' : ''}` : G.etat === 'ko' ? '💔 Plus de force…' : `${ic} ${V.Le} part dans ${m}:${String(sec).padStart(2, '0')}`; $('chrono').classList.toggle('vite', G.etat === 'course' && reste < 15);
  const pos = [[teteDe(G.heros), G.h.x, true]].concat(L ? L.fantomes().map(o => [teteDe(o.heros), o.x, false]) : []);
  const piste = $('piste'); let html = `<b>${ic}</b>`; for(const [im, x, moi] of pos) html += `<span class="${moi ? 'moi' : ''}" style="left:${Math.min(100, Math.max(0, x / (G.P.gare + 120) * 96))}%;background-image:url('${im}')"></span>`;
  if(piste.dataset.h !== html){ piste.innerHTML = html; piste.dataset.h = html; } }

/* ---------- la fin ---------- */
function fin(){ if(!G || etat === 'fin') return; const r = resultat(G), mode = G.P.mode, mo = G.monde, cle = 'm' + mo + '-' + mode, V = MD().v; etat = 'fin'; ambiance(false); let ouvre = false;
  if(sv){ sv.parties++; if(r.gagne){ sv.gagnees++; const b = sv.best[cle] || {}; sv.best[cle] = { etoiles:Math.max(b.etoiles || 0, r.etoiles), score:Math.max(b.score || 0, r.score), reste:Math.max(b.reste || 0, r.reste), jasmins:Math.max(b.jasmins || 0, r.jasmins) };
      if(mo < NMONDES && sv.ouvert <= mo){ sv.ouvert = mo + 1; ouvre = true; }
      if(window.Famille) Famille.score('stage3', cle, r.score, joueur).catch(() => {}); } sauve(); }
  if(L){ L.fin(r); return; }
  const suite = r.gagne && mo < NMONDES;   // le monde suivant est toujours proposé après une victoire (24/11 : déjà ouvert, le bouton manquait)
  const titre = r.gagne ? `🎉 Tu as attrapé ${V.le} !` : G.etat === 'ko' ? '💔 Plus de force…' : `😢 ${V.Le} est parti${V.fe ? 'e' : ''}…`;
  $('finBox').innerHTML = `<h2>${titre}</h2>${r.gagne ? `<div class="etoiles">${'⭐'.repeat(r.etoiles)}${'☆'.repeat(3 - r.etoiles)}</div>` : ''}
    <div class="res"><span>⏱️ Temps</span><b>${r.temps} s</b>${r.gagne ? `<span>🚋 Avance sur le départ</span><b>${r.reste} s</b>` : ''}<span>🪙 Dinars</span><b>${r.dinars} / ${r.total}</b><span>🌼 Jasmins</span><b>${r.jasmins} / 3</b>${r.gagne ? `<span>🏆 Score</span><b>${r.score}</b>` : ''}</div>
    ${ouvre ? `<p style="font-weight:800;color:var(--gold)">🔓 Nouveau monde ouvert : ${MONDES[mo + 1].nom} !</p>` : ''}
    <p>${r.gagne ? (r.etoiles < 3 ? 'Pour plus d\'étoiles : ramasse plus de dinars, et prends de l\'élan (▶) pour les jasmins tout en haut.' : `Parfait ! Tu es le roi de ${MONDES[mo].nom} !`) : G.etat === 'ko' ? 'Chaque choc te fait tomber : saute plus tôt, glisse sous ce qui pend, et ralentis (◀) quand ça se complique.' : 'Saute plus tôt, glisse dessous, et cours plus vite (▶) quand la rue est libre.'}</p>
    <div class="rang">${suite ? '<button class="btn" id="fSuite">▶ Monde suivant</button>' : ''}<button class="btn${suite ? ' gris' : ''}" id="fRe">↻ Recommencer</button><button class="btn gris" id="fMenu">🏠 Menu</button></div>`;
  montre('fin'); document.body.classList.remove('joue');
  $('fRe').onclick = () => partie((Math.random() * 2 ** 31) | 0, mode, mo); $('fMenu').onclick = () => quitter();
  if(suite) $('fSuite').onclick = () => { prefs.monde = mo + 1; sauvePrefs(); partie((Math.random() * 2 ** 31) | 0, mode, mo + 1); }; }

/* ---------- le menu ---------- */
function menu(){ etat = 'menu'; montre('menu'); document.body.classList.remove('joue');
  const ouv = sv ? sv.ouvert : 1; if(prefs.monde > ouv) prefs.monde = 1; const W = MONDES[prefs.monde];
  $('mTitre').innerHTML = `${W.titre} <small>Jasmin · Stage 3 · Monde ${prefs.monde} : ${W.nom}</small>`; $('mIntro').textContent = W.intro;
  $('mondes').innerHTML = MONDES.slice(1).map((w, i) => { const n = i + 1, f = n > ouv, b = sv && (sv.best['m' + n + '-champion'] || sv.best['m' + n + '-tranquille']);
    return `<button data-mo="${n}" class="${n === prefs.monde ? 'on' : ''}${f ? ' ferme' : ''}"><span class="im" style="background-image:url('jasmin3/${w.d}/fond.webp')">${f ? '🔒' : ''}</span>${n}. ${w.nom}<small>${b ? '⭐'.repeat(b.etoiles) : f ? 'à ouvrir' : w.v.Le}</small></button>`; }).join('');
  $('who').innerHTML = joueur ? `<img src="${teteDe(monHeros())}" alt=""><span>${esc(joueur)}<small>Toucher pour changer de joueur</small></span>` : '<span>Qui joue ?<small>Touche pour choisir</small></span>';
  const cur = joueur ? heroId() : '';
  $('heros').innerHTML = HEROS.map(([id, n]) => `<button data-h="${id}" class="${cur === id ? 'on' : ''}"><img src="${teteDe(id)}" alt="">${n}</button>`).join('');
  const seulCh = prefs.monde >= CHAMPION_DES, md = modeDe(prefs.mode, prefs.monde);
  $('modes').querySelectorAll('button').forEach(b => { b.classList.toggle('on', b.dataset.m === md); b.classList.toggle('ferme', seulCh && b.dataset.m === 'tranquille'); });
  $('mCh').hidden = !seulCh;
  setTimeout(() => { const on = $('mondes').querySelector('.on'); if(on) on.scrollIntoView({ block:'nearest', inline:'center' }); }, 0);
  const b = sv && sv.best['m' + prefs.monde + '-' + md]; $('mRec').textContent = b ? `Ton record (${prefs.mode}) : ${'⭐'.repeat(b.etoiles)} · ${b.score} points · ${b.reste} s d'avance` : '';
  rendOpts(); }
$('who').onclick = () => choisirJoueur();
$('heros').onclick = async e => { const b = e.target.closest('[data-h]'); if(!b) return; if(!joueur && !(await choisirJoueur())) return; sv.heros = b.dataset.h; sauve(); menu(); };
$('mondes').onclick = e => { const b = e.target.closest('[data-mo]'); if(!b) return; const n = +b.dataset.mo; if(n > (sv ? sv.ouvert : 1)){ bulle('🔒 Réussis le monde ' + (n - 1) + ' pour ouvrir celui-ci !', 2200); return; } prefs.monde = n; sauvePrefs(); menu(); };
$('modes').onclick = e => { const b = e.target.closest('[data-m]'); if(!b) return; if(prefs.monde >= CHAMPION_DES && b.dataset.m === 'tranquille'){ bulle('🐆 À partir du monde ' + CHAMPION_DES + ', seulement le mode Champion !', 2200); return; } prefs.mode = b.dataset.m; sauvePrefs(); menu(); };
$('solo').onclick = () => { audio(); lance(); };
$('ligne').onclick = async () => { audio(); if(!joueur && !(await choisirJoueur())) return; Ligne.salon(); };
$('oHelp').onclick = () => montre('aide'); $('aideOk').onclick = () => menu();
$('oOpts').onclick = () => { rendOpts(); montre('opts'); }; $('optOk').onclick = () => menu();
function rendOpts(){ $('oSon').textContent = prefs.son ? 'Oui' : 'Non'; $('oSon').setAttribute('aria-pressed', prefs.son); $('oAmb').textContent = prefs.amb ? 'Oui' : 'Non'; $('oAmb').setAttribute('aria-pressed', prefs.amb);
  document.querySelectorAll('[data-com]').forEach(b => b.setAttribute('aria-pressed', b.dataset.com === prefs.com)); document.querySelectorAll('[data-bs]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.bs === prefs.bs)); resize(); }
$('oSon').onclick = () => { prefs.son = !prefs.son; sauvePrefs(); rendOpts(); }; $('oAmb').onclick = () => { prefs.amb = !prefs.amb; sauvePrefs(); rendOpts(); };
document.querySelectorAll('[data-com]').forEach(b => b.onclick = () => { prefs.com = b.dataset.com; sauvePrefs(); rendOpts(); });
document.querySelectorAll('[data-bs]').forEach(b => b.onclick = () => { prefs.bs = +b.dataset.bs; sauvePrefs(); rendOpts(); });
let recMode = 'tranquille', recMonde = 1;
$('oRecs').onclick = () => { montre('recs'); recMonde = prefs.monde; records(prefs.mode); }; $('recOk').onclick = () => menu();
$('recTabs').onclick = e => { const b = e.target.closest('[data-r]'); if(b) records(b.dataset.r); };
$('recMondes').onclick = e => { const b = e.target.closest('[data-rm]'); if(b){ recMonde = +b.dataset.rm; records(recMode); } };
async function records(mode){ recMode = mode; document.querySelectorAll('#recTabs button').forEach(b => b.classList.toggle('on', b.dataset.r === mode));
  $('recMondes').innerHTML = MONDES.slice(1).map((w, i) => `<button data-rm="${i + 1}" class="${i + 1 === recMonde ? 'on' : ''}">${i + 1}. ${w.nom}</button>`).join(''); $('recList').innerHTML = '<span>…</span><b></b>';
  const l = window.Famille ? await Famille.highscores('stage3', 'm' + recMonde + '-' + mode, 10).catch(() => null) : null;
  $('recList').innerHTML = !l ? '<span>Records indisponibles hors connexion.</span><b></b>' : !l.length ? '<span>Pas encore de record : à toi !</span><b></b>' : l.map((r, i) => `<span>${['🥇', '🥈', '🥉'][i] || i + 1 + '.'} ${esc(r.player)}</span><b>${r.score}</b>`).join(''); }

/* ---------- la course en ligne : le salon (comme l'Arène) et la course (chacun court sur sa tablette, les autres en transparence) ---------- */
async function post(d){ const f = new FormData(); for(const k in d) f.append(k, typeof d[k] === 'object' ? JSON.stringify(d[k]) : d[k]); const r = await fetch(API, { method:'POST', body:f, credentials:'same-origin' }); const j = await r.json().catch(() => ({ error:'Le serveur ne répond pas.' })); if(!r.ok) throw new Error(j.error || 'Erreur'); return j; }
async function get(q){ const r = await fetch(API + '?' + new URLSearchParams(q), { credentials:'same-origin', cache:'no-store' }); const j = await r.json().catch(() => ({})); if(!r.ok) throw new Error(j.error || 'Erreur'); return j; }
function clientId(){ let c = null; try{ c = localStorage.getItem('stage3-client'); }catch(e){} if(!c || !/^[a-z0-9]{8,20}$/.test(c)){ c = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); try{ localStorage.setItem('stage3-client', c); }catch(e){} } return c; }
const Ligne = {
  client:clientId(), code:null, room:null, host:null, online:[], status:'menu', poll:null,
  moi(){ return { client:this.client, nom:joueur, tete:teteDe(heroId()), heros:heroId(), tenue:tenueDe() }; },
  async hello(){ if(!joueur || document.hidden) return; try{ const r = await post({ action:'hello', client:this.client, name:joueur, tete:teteDe(heroId()), status:this.status, code:this.code || '' }); this.online = r.online || [];
    (r.invites || []).forEach(i => this.invitation(i)); if(this.status === 'salon' && !this.room) this.rendSalon(); else if(this.status === 'salon') this.rendSalle(); }catch(e){} },
  invitation(i){ if(etat !== 'menu' && etat !== 'fin' || this.code === i.code) return; const d = $('invit');
    d.innerHTML = `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><img src="${esc(i.tete)}" style="width:44px;height:44px;border-radius:50%;object-fit:cover"><b>${esc(i.name)} t'invite à une course !</b><button class="btn" id="invOk" style="min-height:44px;font-size:18px">Courir</button><button class="btn gris" id="invNo">✕</button></div>`;
    d.classList.add('on'); bip(880, .15, 'triangle', .08); $('invOk').onclick = () => { d.classList.remove('on'); this.rejoindre(i.code); }; $('invNo').onclick = () => d.classList.remove('on'); setTimeout(() => d.classList.remove('on'), 30000); },
  salon(){ this.status = 'salon'; montre('salon'); $('salonRetour').onclick = () => { this.status = 'menu'; this.code = null; this.room = null; clearInterval(this.poll); menu(); }; if(this.room) this.rendSalle(); else this.rendSalon(); this.hello(); },
  rendSalon(){ const gens = this.online.filter(g => g.status !== 'joue');
    $('salonCorps').innerHTML = `<p>Crée une course et invite la famille : chacun court sur sa tablette, et tu vois les autres coureurs en transparence. Le premier arrivé gagne !</p>
      <button class="btn" id="sCree">🚋 Créer une course</button>
      <p class="lab">Rejoindre avec un code</p><div class="rang"><input id="sCode" maxlength="4" placeholder="ABCD" style="font:800 28px 'Baloo 2';text-transform:uppercase;width:150px;padding:6px 12px;border-radius:14px;border:0;letter-spacing:4px;text-align:center"><button class="btn bleu" id="sJoin">Rejoindre</button></div>
      <p class="lab">Sur le Stage 3 en ce moment</p>${gens.length ? `<div class="gens">${gens.map(g => `<button disabled><img src="${esc(g.tete)}" alt=""><span>${esc(g.name)}<small>${g.code ? 'course ' + g.code : 'au menu'}</small></span></button>`).join('')}</div>` : '<p style="color:var(--mist)">Personne d\'autre pour l\'instant : demande à la famille d\'ouvrir le Stage 3 !</p>'}`;
    $('sCree').onclick = () => this.cree(); $('sJoin').onclick = () => { const c = $('sCode').value.trim().toUpperCase(); if(c.length === 4) this.rejoindre(c); }; },
  async cree(){ try{ const st = { etat:'attente', mode:prefs.mode, monde:prefs.monde, graine:(Math.random() * 1e9) | 0, joueurs:[this.moi()] }; const r = await post({ action:'create', client:this.client, state:st });
      this.code = r.code; this.room = st; this.host = this.client; this.attend(); this.rendSalle(); this.hello(); }catch(e){ bulle(e.message, 3000); } },
  async rejoindre(code){ try{ const m = this.moi(); const r = await post({ action:'join', code, client:this.client, name:m.nom, tete:m.tete, heros:m.heros, tenue:m.tenue }); this.code = code; this.room = r.state; this.host = r.host; this.status = 'salon'; montre('salon');
      $('salonRetour').onclick = () => { this.status = 'menu'; this.code = null; this.room = null; clearInterval(this.poll); menu(); }; this.attend(); this.rendSalle(); this.hello(); }catch(e){ bulle(e.message, 3000); } },
  attend(){ clearInterval(this.poll); this.poll = setInterval(async () => { if(!this.code || L) return; try{ const r = await get({ action:'room', code:this.code }); this.room = r.state; this.host = r.host; if(r.state.etat === 'jeu' && r.state.n !== this.dernier) this.commence(); else this.rendSalle(); }catch(e){} }, 900); },
  rendSalle(){ const s = this.room, hote = this.host === this.client; if(!s || L) return; const libres = this.online.filter(g => g.status !== 'joue' && !s.joueurs.some(j => j.client === g.client));
    $('salonCorps').innerHTML = `<p>Code de la course :</p><div class="code">${this.code}</div>
      <p class="lab">Les coureurs (${s.joueurs.length} / 6)</p><div class="gens">${s.joueurs.map(j => `<button disabled><img src="${teteDe(j.heros)}" alt=""><span>${esc(j.nom)}<small>${j.client === this.host ? 'a créé la course' : 'prêt'}</small></span></button>`).join('')}</div>
      ${libres.length ? `<p class="lab">Inviter</p><div class="gens">${libres.map(g => `<button data-inv="${g.client}"><img src="${esc(g.tete)}" alt=""><span>${esc(g.name)}<small>✉️ inviter</small></span></button>`).join('')}</div>` : ''}
      ${hote ? `<p class="lab">Le monde</p><div class="choix">${MONDES.slice(1).map((w, i) => i + 1 > (sv ? sv.ouvert : 1) ? '' : `<button data-smo="${i + 1}" class="${(s.monde || 1) === i + 1 ? 'on' : ''}">${i + 1}. ${w.nom}</button>`).join('')}</div>
        <p class="lab">La course</p><div class="choix">${(s.monde >= CHAMPION_DES ? ['champion'] : ['tranquille', 'champion']).map(m => `<button data-sm="${m}" class="${s.mode === m ? 'on' : ''}">${m === 'tranquille' ? '🐢 Tranquille' : '🐆 Champion'}</button>`).join('')}</div><button class="btn" id="sGo">▶ Départ !</button>` : `<p style="font-weight:800">Monde ${s.monde || 1} : ${MONDES[s.monde || 1].nom} · on attend le départ…</p>`}`;
    $('salonCorps').onclick = async e => { const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.inv){ const m = this.moi(); try{ await post({ action:'invite', client:this.client, name:m.nom, tete:m.tete, to:b.dataset.inv, code:this.code }); b.querySelector('small').textContent = '✔ invité'; }catch(err){ bulle(err.message, 3000); } return; }
      if(!hote) return; if(b.dataset.sm) s.mode = b.dataset.sm; else if(b.dataset.smo){ s.monde = +b.dataset.smo; s.mode = modeDe(s.mode, s.monde); } else if(b.id === 'sGo'){ s.etat = 'jeu'; s.graine = (Math.random() * 1e9) | 0; s.n = (s.n || 0) + 1; } else return;
      try{ await post({ action:'update', code:this.code, client:this.client, state:s }); }catch(err){ bulle(err.message, 3000); }
      if(s.etat === 'jeu') this.commence(); else this.rendSalle(); }; },
  commence(){ const s = this.room; this.dernier = s.n; L = new Course(this, s); this.status = 'joue'; partie(s.graine, s.mode, Math.min(NMONDES, Math.max(1, s.monde || 1))); },
  quitteCourse(){ this.status = this.code ? 'salon' : 'menu'; },
};
setInterval(() => Ligne.hello(), 4000);
// une course en ligne : envoie sa position toutes les 150 ms, reçoit celles des autres
class Course {
  constructor(S, s){ this.S = S; this.s = s; this.since = 0; this.sortants = []; this.autres = {}; this.arrivees = []; this.on = true; this.fini = false;
    s.joueurs.forEach(j => { if(j.client !== S.client) this.autres[j.client] = { nom:j.nom, heros:j.heros, C:corps(j.heros, j.tenue || 'classique'), x:120, y:0, vx:0, vy:0, a:0, tx:120, ty:0, vu:performance.now(), etat:'course' }; });
    this.boucle(); }
  fantomes(){ return Object.values(this.autres).filter(o => o.etat !== 'parti'); }
  avance(dt){ for(const o of Object.values(this.autres)){ const k = Math.min(1, dt * 10); o.x += (o.tx + o.vx * .08 - o.x) * k; o.y += (o.ty - o.y) * k; } }
  async boucle(){ while(this.on){ const t0 = performance.now(), h = G && G.h;
      const p = h ? [Math.round(h.x), Math.round(h.y), G.etat === 'ko' ? 5 : h.sonne > 0 ? (h.sonne < .6 ? 4 : 3) : h.glisse || h.glissade > 0 ? 2 : h.sol ? 0 : 1, Math.round(h.vx), Math.round(h.vy), G.danse ? 1 : 0] : null;
      const e = this.sortants; this.sortants = [];
      try{ const r = await post({ action:'sync', code:this.S.code, client:this.S.client, since:this.since, msgs:{ p, e } });
        if(this.since === 0) this.since = r.id; else { this.since = r.id; r.msgs.forEach(m => this.recoit(m.c, m.m)); } }
      catch(err){ this.sortants = e.concat(this.sortants).slice(-50); }
      for(const [c, o] of Object.entries(this.autres)) if(o.etat === 'course' && performance.now() - o.vu > 9000){ o.etat = 'parti'; bulle(`${o.nom} ne répond plus`, 2000); this.majFin(); }
      const reste = 150 - (performance.now() - t0); if(reste > 0) await new Promise(r => setTimeout(r, reste)); } }
  recoit(c, m){ const o = this.autres[c]; if(!o) return; o.vu = performance.now();
    if(m.p){ const [x, y, a, vx, vy, d] = m.p; o.tx = x; o.ty = y; o.a = a; o.vx = vx; o.vy = vy; if(d && !o.danse) o.danse = performance.now() / 1000; }
    (m.e || []).forEach(e => { if(e.k === 'arrive'){ o.etat = 'arrive'; o.temps = e.t; this.arrivees.push({ nom:o.nom, heros:o.heros, temps:e.t }); bulle(`🚋 ${o.nom} est arrivé ! (${e.t} s)`, 2500); }
      else if(e.k === 'rate' || e.k === 'ko'){ o.etat = e.k; } else if(e.k === 'part'){ o.etat = 'parti'; bulle(`${o.nom} a quitté la course`, 2000); } this.majFin(); }); }
  arrive(g){ const t = Math.round(g.h.fin * 10) / 10; this.sortants.push({ k:'arrive', t }); this.arrivees.push({ nom:joueur, heros:heroId(), temps:t, moi:true }); }
  rate(g, k){ this.sortants.push({ k }); }
  fin(r){ this.r = r; this.fini = true; this.majFin(); }
  majFin(){ if(!this.fini) return; const tous = this.fantomes().every(o => o.etat !== 'course'), cl = [...this.arrivees].sort((a, b) => a.temps - b.temps), rang = cl.findIndex(a => a.moi) + 1;
    const r = this.r, hote = this.S.host === this.S.client;
    const V = MD().v; $('finBox').innerHTML = `<h2>${r.gagne ? (rang === 1 ? `🏆 Premier dans ${V.le} !` : `🚋 Dans ${V.le} (${rang}e)`) : '😢 Raté cette fois'}</h2>
      <div class="res">${cl.map((a, i) => `<span>${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'} <img src="${teteDe(a.heros)}" alt="">${esc(a.nom)}${a.moi ? ' (toi)' : ''}</span><b>${a.temps} s</b>`).join('')}
      ${this.fantomes().filter(o => o.etat === 'course').map(o => `<span>🏃 <img src="${teteDe(o.heros)}" alt="">${esc(o.nom)}</span><b>court encore…</b>`).join('')}
      ${[...this.fantomes().filter(o => o.etat === 'rate' || o.etat === 'ko')].map(o => `<span>😢 <img src="${teteDe(o.heros)}" alt="">${esc(o.nom)}</span><b>raté</b>`).join('')}</div>
      <div class="res"><span>🪙 Tes dinars</span><b>${r.dinars} / ${r.total}</b><span>🌼 Tes jasmins</span><b>${r.jasmins} / 3</b></div>
      ${tous ? '' : '<p style="color:var(--mist)">On attend les autres coureurs…</p>'}
      <div class="rang">${hote ? '<button class="btn" id="fSalon">🚋 Une autre course</button>' : '<button class="btn" id="fSalon">🚋 Revenir au salon</button>'}<button class="btn gris" id="fMenu">🏠 Menu</button></div>`;
    montre('fin'); document.body.classList.remove('joue');
    $('fSalon').onclick = () => { this.stop(); L = null; G = null; etat = 'menu'; const S = this.S; S.room.etat = 'attente'; if(hote) post({ action:'update', code:S.code, client:S.client, state:S.room }).catch(() => {}); S.status = 'salon'; S.attend(); S.salon(); };
    $('fMenu').onclick = () => { this.partir(); quitter(); }; }
  demandeQuitter(){ $('finBox').innerHTML = `<h2>🚪 Quitter la course ?</h2><p>Les autres continuent sans toi.</p><div class="rang"><button class="btn" id="qReste">▶ Je reste</button><button class="btn gris" id="qPart">🚪 Quitter</button></div>`; montre('fin');
    $('qReste').onclick = () => montre('-'); $('qPart').onclick = () => { this.partir(); quitter(); }; }
  partir(){ if(!this.on) return; post({ action:'sync', code:this.S.code, client:this.S.client, since:this.since || 1, msgs:{ p:null, e:[{ k:'part' }] } }).catch(() => {}); this.stop(); this.S.code = null; this.S.room = null; this.S.status = 'menu'; }
  stop(){ this.on = false; }
  quitte(){ this.stop(); }
}

/* ---------- au démarrage ---------- */
const p0 = window.Famille ? Famille.player() : null; if(p0) setJoueur(p0); else menu();
requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
window.__stage3 = { get G(){ return G; }, get etat(){ return etat; }, partie, C, K, get L(){ return L; }, Ligne, MONDES, get sv(){ return sv; } };
