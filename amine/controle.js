/* Le contrôle des réponses pour Amine (20/11), demandé par le papa : « il peut cliquer les trois propositions au hasard
   et tomber sur la bonne réponse ». Utilisé par la Planète des Nombres, l'Épicerie de Lulu, Je lis et le dessin animé de Zib.
   - Controle.arme(zone, sel, occupe) : les réponses restent grises pendant la consigne, puis encore un petit moment (une barre
     « 👂 J'écoute… » se remplit) ; occupe() dit si la voix parle encore.
   - Controle.faux(bouton, zone, sel) : la réponse fausse est barrée et ne peut plus être touchée. Renvoie 'encore'
     (on réessaie, sans montrer la réponse) ou 'fini' (2e erreur : le jeu montre la bonne réponse).
     Deux réponses fausses trop rapides (moins d'1 s) : la tortue « Doucement ! » bloque tout 4 secondes.
   - Controle.compte(objets, fini) : compter méthodiquement. Chaque objet touché reçoit son numéro, dans l'ordre ;
     on ne peut pas toucher deux fois le même. fini() est appelé quand tout est compté (et seulement là, les réponses arrivent).
   - Controle.nouvelle() : remet le compteur d'erreurs à zéro pour une nouvelle question. */
(function(){
  'use strict';
  const css = document.createElement('style');
  css.textContent = `.ctl-attends{opacity:.45;filter:grayscale(.6);pointer-events:none!important}
.ctl-barre{position:fixed;left:50%;top:calc(74px + env(safe-area-inset-top));transform:translateX(-50%);z-index:50;background:rgba(20,16,43,.85);color:#fff;border-radius:999px;padding:8px 16px 12px;font:800 18px Nunito,system-ui,sans-serif;min-width:190px;text-align:center;pointer-events:none}
.ctl-barre i{display:block;height:6px;border-radius:3px;background:#ffd23f;margin-top:6px;width:0;transition:width linear}
.ctl-barre.go i{width:100%}
.ctl-barree{position:relative;opacity:.5;filter:grayscale(1);pointer-events:none}
.ctl-barree::after{content:'';position:absolute;left:8%;right:8%;top:50%;height:6px;border-radius:3px;background:#ff5b5b;transform:rotate(-14deg)}
.ctl-tortue{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(20,16,43,.55);pointer-events:auto}
.ctl-tortue div{background:#fff;color:#23324a;border-radius:28px;padding:22px 26px;font:800 24px Nunito,system-ui,sans-serif;text-align:center;max-width:340px;box-shadow:0 10px 0 rgba(0,0,0,.25)}
.ctl-tortue b{display:block;font-size:72px;animation:ctl-t 1s ease-in-out infinite alternate}
@keyframes ctl-t{to{transform:translateX(14px)}}
.ctl-num{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:1.6em;height:1.6em;border-radius:50%;background:#ffd23f;color:#3a2600;font:800 clamp(18px,4vmin,30px)/1.6em 'Baloo 2',Nunito,sans-serif;text-align:center;box-shadow:0 3px 0 rgba(0,0,0,.3);pointer-events:none;text-decoration:none}
.ctl-compte{position:relative}
.ctl-compte.ctl-vu img{opacity:.6}
@media (prefers-reduced-motion:reduce){.ctl-tortue b{animation:none}}`;
  document.head.appendChild(css);
  let essais = 0, t0 = 0, vites = 0, minuteur = null, barre = null, parle = null;
  const zonesDe = (zone, sel) => zone ? [...(typeof zone === 'string' ? document.querySelectorAll(zone) : [zone])] : [];
  function lache(zs){ zs.forEach(z => z.classList.remove('ctl-attends')); if(barre){ barre.remove(); barre = null; } t0 = performance.now(); }
  const C = window.Controle = {
    attente:1400,            // le petit temps de réflexion après la consigne (ms)
    dire(f){ parle = f; },  // parle(['Doucement…']) : la voix du jeu, pour la tortue
    nouvelle(){ essais = 0; },
    arme(zone, occupe, ms){
      clearInterval(minuteur); const zs = zonesDe(zone); zs.forEach(z => z.classList.add('ctl-attends'));
      if(barre) barre.remove(); barre = document.createElement('div'); barre.className = 'ctl-barre'; barre.innerHTML = '👂 J\'écoute…<i></i>'; document.body.appendChild(barre);
      const debut = performance.now(); let fin = 0;
      minuteur = setInterval(() => {
        const t = performance.now() - debut, parleEncore = occupe && occupe() && t < 9000;
        if(parleEncore || t < 500) return;
        if(!fin){ fin = performance.now(); const b = barre; if(b){ b.firstChild.textContent = '🤔 Je réfléchis…'; const i = b.querySelector('i'); i.style.transitionDuration = (ms || C.attente) + 'ms'; requestAnimationFrame(() => b.classList.add('go')); } }
        if(performance.now() - fin >= (ms || C.attente)){ clearInterval(minuteur); lache(zs); }
      }, 100);
    },
    libre(zone){ clearInterval(minuteur); lache(zonesDe(zone)); },
    faux(bt, zone){
      essais++; const vite = t0 && performance.now() - t0 < 1000; vites = vite ? vites + 1 : 0;
      if(bt){ bt.classList.add('ctl-barree'); bt.disabled = true; }
      if(vites >= 2){ vites = 0; const o = document.createElement('div'); o.className = 'ctl-tortue'; o.innerHTML = '<div><b>🐢</b>Doucement, Amine !<br>Écoute, réfléchis, puis réponds.</div>'; document.body.appendChild(o);
        const phr = ['Doucement, Amine !', 'Écoute bien, réfléchis, puis réponds.']; if(parle) parle(phr); else try{ const u = new SpeechSynthesisUtterance(phr.join(' ')); u.lang = 'fr-FR'; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){}
        setTimeout(() => { o.remove(); t0 = performance.now(); }, 4000); }
      else t0 = performance.now();
      return essais >= 2 ? 'fini' : 'encore';
    },
    get essais(){ return essais; },
    compte(objets, dit, fini){
      let c = 0; const n = objets.length;
      objets.forEach(o => { o.classList.add('ctl-compte'); o.onclick = e => { e.stopPropagation(); if(o.classList.contains('ctl-vu')) return; c++; o.classList.add('ctl-vu');
        o.insertAdjacentHTML('beforeend', `<u class="ctl-num">${c}</u>`); if(dit) dit(c); if(c === n && fini) setTimeout(fini, 700); }; });
      return () => c;
    },
  };
})();
