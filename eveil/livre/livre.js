/* Le livre animé de l'Éveil (18/11) : remplit les textes depuis les épisodes validés, monte le moteur scroll-craft,
   et « Raconte-moi » : la page défile toute seule, chapitre par chapitre, pendant que papa (Jon) ou maman (Céline)
   raconte, ou Mohammad en arabe. Un doigt sur l'écran reprend la main. Le verset est récité par cheikh Al-Husary. */
const SERIE = 'prophetes', EP = 2, AVANT = { 11:1473 };
const { EPISODES } = await import('../' + SERIE + '/episodes.js');
const ep = EPISODES.find(e => e.n === EP);
const recits = ep.scenes.filter(s => s.fr);           // les 5 scènes racontées, dans l'ordre
const verset = ep.scenes.find(s => s.coran).coran;
const $ = id => document.getElementById(id);

document.querySelectorAll('[data-txt]').forEach(e => { e.textContent = recits[+e.dataset.txt].fr; });
document.querySelectorAll('[data-txt-ar]').forEach(e => { e.textContent = recits[+e.dataset.txtAr].ar; });
$('coran').textContent = verset.v[0][0] + ' ﴿' + verset.d + '﴾';
$('sens').textContent = '« ' + verset.v[0][1] + ' »';
$('lecon').textContent = ep.lecon.fr; $('lecon-ar').textContent = ep.lecon.ar;
ScrollCraft.mount(document.body);

/* ---------- les voix ---------- */
let langue = 'fr'; try{ langue = localStorage.getItem('livre-langue') || 'fr'; }catch(e){}
const majLangue = () => { $('langue').textContent = langue === 'ar' ? '🗣️ العربية' : '🗣️ Français'; };
majLangue();
$('langue').onclick = () => { langue = langue === 'ar' ? 'fr' : 'ar'; try{ localStorage.setItem('livre-langue', langue); }catch(e){} majLangue(); };
const voixCoupee = () => !!(window.FamilleVoix && FamilleVoix.on && !FamilleVoix.on());
let audio = null, jeton = 0;
const coupe = () => { jeton++; if(window.FamilleSon) FamilleSon.stop(); if(audio){ try{ audio.pause(); }catch(e){} audio = null; } };
// joue un son ; onDuree(ms) dès que la durée est connue ; rend quand c'est fini (false si interrompu)
function joue(url, moi, onDuree){
  if(window.FamilleSon){   // 19/11 : le lecteur unique du site (tablettes), voir explorateur.js
    const el = FamilleSon.element, d = () => { if(onDuree && isFinite(el.duration)) onDuree(el.duration * 1000); };
    return FamilleSon.joue(url, { onStart:d }).then(r => jeton !== moi ? false : r);
  }
  return new Promise(res => { const a = audio = new Audio(url); let fini = false; const fin = r => { if(!fini){ fini = true; res(r); } };
    a.onloadedmetadata = () => onDuree && isFinite(a.duration) && onDuree(a.duration * 1000);
    a.onended = () => fin(true); a.onerror = () => fin(null);
    a.play().catch(() => fin(null));
    const t = setInterval(() => { if(jeton !== moi){ clearInterval(t); try{ a.pause(); }catch(e){} fin(false); } else if(fini) clearInterval(t); }, 150); });
}
// même adresse que le lecteur des histoires : la voix est déjà gardée sur le site, elle ne coûte rien
const urlVoix = s => langue === 'ar' ? '/api/voix.php?l=ar&t=' + encodeURIComponent(s.ar) : '/api/voix.php?l=fr&t=' + encodeURIComponent(s.fr) + (s.qui === 'papa' ? '&v=jon' : '');
const RECIT = n => 'https://cdn.islamic.network/quran/audio/128/ar.husary/' + n + '.mp3';

/* ---------- « Raconte-moi » : la page défile toute seule ---------- */
const chap = n => document.querySelector(`[data-chap="${n}"]`);
const haut = el => el.getBoundingClientRect().top + scrollY;
let auto = false, anim = 0;
function glisse(de, a, ms, moi){   // défilement doux de « de » à « a » en ms
  return new Promise(res => { const t0 = performance.now(); cancelAnimationFrame(anim);
    const pas = t => { if(jeton !== moi) return res(false); const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      scrollTo({ top:de + (a - de) * e, behavior:'instant' }); if(k < 1) anim = requestAnimationFrame(pas); else res(true); };
    anim = requestAnimationFrame(pas); });
}
async function raconte(){
  coupe(); const moi = jeton; auto = true; $('raconte').textContent = '⏸ Arrêter';
  const pause = ms => new Promise(r => setTimeout(r, ms));
  // la couverture
  await glisse(scrollY, haut(chap(0)), 900, moi); if(jeton !== moi) return;
  await glisse(scrollY, haut(chap(1)) - innerHeight * .1, 2600, moi);
  const plan = [[1, 0], [2, 1], [3, 2], [4, 'v'], [5, 3], [6, 4], [7, 'l']];
  for(const [c, quoi] of plan){
    if(jeton !== moi) return;
    const el = chap(c), h0 = haut(el), longueur = Math.max(0, el.offsetHeight - innerHeight * (el.dataset.scAct === 'flow' ? .6 : 1));
    await glisse(scrollY, h0 - (el.dataset.scAct === 'flow' ? innerHeight * .05 : 0), 1100, moi); if(jeton !== moi) return;
    // pendant la voix, la page avance doucement dans le chapitre (les films avancent, les animaux marchent, la mer monte)
    let duree = 12000; const depart = performance.now(), dep = scrollY;
    let avance = glisse(dep, dep + longueur * .9, duree, moi);
    const reglage = ms => { duree = Math.max(4000, ms + 600); avance = glisse(scrollY, dep + longueur * .9, Math.max(1500, duree - (performance.now() - depart)), moi); };
    let son;
    if(quoi === 'v') son = joue(RECIT(AVANT[verset.s] + verset.d), moi, reglage);
    else if(quoi === 'l') son = voixCoupee() ? pause(3000) : joue(langue === 'ar' ? '/api/voix.php?l=ar&t=' + encodeURIComponent(ep.lecon.ar) : '/api/voix.php?l=fr&t=' + encodeURIComponent(ep.lecon.fr), moi, reglage);
    else son = voixCoupee() ? pause(Math.max(5000, recits[quoi].fr.length * 60)) : joue(urlVoix(recits[quoi]), moi, reglage);
    await son; if(jeton !== moi) return; await avance; if(jeton !== moi) return;
    await pause(700);
  }
  arrete();
}
function arrete(){ coupe(); cancelAnimationFrame(anim); auto = false; $('raconte').textContent = '▶ Raconte-moi'; }
$('raconte').onclick = () => auto ? arrete() : raconte();
// un doigt, la molette ou une touche : l'enfant reprend la main
['wheel', 'touchstart', 'keydown'].forEach(t => addEventListener(t, e => { if(auto && !(e.target.closest && e.target.closest('button,a'))) arrete(); }, { passive:true }));
$('recite').onclick = () => { arrete(); const moi = jeton; joue(RECIT(AVANT[verset.s] + verset.d), moi); };
$('encore').onclick = () => { arrete(); scrollTo({ top:0, behavior:'smooth' }); };
window.__livre = { raconte, arrete, ep };
