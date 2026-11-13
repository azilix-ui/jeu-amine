/* La Légende du Jasmin 3 : le décor « en vrai ».
   Images faites avec ComfyUI sur le PC du papa (FLUX.2 klein, gratuit) → jeux/jasmin3/m<monde>/ (voir docs/jasmin3/build.py).
   Le jeu (legende-du-jasmin-3.html = le Jasmin 2 + 3 crochets) demande à R3 de dessiner le fond, chaque case et chaque objet ;
   R3 répond false quand il n'a pas d'image : le dessin du Jasmin 2 prend alors le relais (les autres mondes restent comme avant). */
window.R3 = (() => {
  // les mondes qui ont leurs images (fond, maisons, sol, plateformes, eau, pics) ; les objets (coffres, dinars, lanterne…) sont communs : ceux de Sidi Bou Saïd (m1)
  const MONDES = Object.fromEntries(Array.from({ length:24 }, (_, i) => [i + 1, 'm' + (i + 1)]));   // les 24 mondes ont leurs images (13/11)
  const COMMUNS = ['coffre_piece', 'coffre_livre', 'coffre_lampe', 'coffre_vide', 'brique', 'jasmin_or', 'lanterne', 'jarre', 'ressort', 'panneau', 'chechia', 'harissa', 'the', 'piece', 'barque', 'flamant', 'train', 'tapis'];
  const PROPRES = ['maisons', 'oursins'], TEX = ['mur', 'dessus', 'bois_bleu', 'mer'], cache = {};
  function charge(n){
    if(cache[n]) return cache[n];
    const d = MONDES[n], R = cache[n] = { im:{}, pat:{} };
    const L = (k, f) => { const im = new Image(); im.onload = () => { R.im[k] = im; }; im.src = f; };
    COMMUNS.forEach(k => L(k, `jasmin3/m1/${k}.webp`)); PROPRES.forEach(k => L(k, `jasmin3/${d}/${k}.webp`));
    TEX.forEach(k => L('t_' + k, `jasmin3/${d}/t_${k}.webp`)); L('fond', `jasmin3/${d}/fond.webp`); L('porte', 'maison/porte_bleue.webp');
    return R; }
  const de = g => g && MONDES[g.lv.n] ? charge(g.lv.n) : null;
  function motif(R, k, taille, dx = 0){ const im = R.im['t_' + k]; if(!im) return null; let p = R.pat[k]; if(!p) p = R.pat[k] = ctx.createPattern(im, 'repeat');
    p.setTransform(new DOMMatrix().translate(dx, 0).scale(taille / im.naturalWidth)); return p; }
  const img = (R, k, x, y, w, h) => { const im = R.im[k]; if(!im) return false; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(im, x, y, w, h); return true; };
  const haut = (R, k, h) => { const im = R.im[k]; return im ? h * im.naturalWidth / im.naturalHeight : 0; };   // largeur pour une hauteur donnée

  // le fond : la photo du village (lointain, 0,15) puis la rangée de maisons (0,45), posées derrière le sol
  function fond(g){ const R = de(g); if(!R || !R.im.fond) return false;
    const im = R.im.fond, h = VHL * 1.04, w = h * im.naturalWidth / im.naturalHeight, sc = g.camX * .15;
    for(let k = Math.floor(sc / w); k * w - sc < VW; k++){ const x = k * w - sc; if(k % 2){ ctx.save(); ctx.translate(x + w, -8); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, w, h); ctx.restore(); } else ctx.drawImage(im, x, -8, w, h); }
    const m = R.im.maisons; if(m){ const mh = 112, mw = mh * m.naturalWidth / m.naturalHeight, p = g.camX * .45, y = GY * T + 10 - mh;
      ctx.filter = 'blur(.7px) saturate(.8) brightness(1.04)'; ctx.globalAlpha = .9; for(let k = Math.floor(p / mw); k * mw - p < VW; k++){ const x = k * mw - p; if(k % 2){ ctx.save(); ctx.translate(x + mw, y); ctx.scale(-1, 1); ctx.drawImage(m, 0, 0, mw, mh); ctx.restore(); } else ctx.drawImage(m, x, y, mw, mh); } ctx.globalAlpha = 1; ctx.filter = 'none';
      const gr = ctx.createLinearGradient(0, y - 20, 0, y + mh); gr.addColorStop(0, 'rgba(230,242,255,0)'); gr.addColorStop(1, 'rgba(230,242,255,.35)'); ctx.fillStyle = gr; ctx.fillRect(0, y - 20, VW + 2, mh + 20); }   // un voile de lointain
    return true; }

  // une case du décor
  function caseDe(c, cx, cy, x, y, g, t){ const R = de(g); if(!R) return false;
    if(c === '#' || c === 'w'){ const p = motif(R, 'mur', 96); if(!p) return false;
      const ouvertHaut = !SOLID.has(tileAt(cx, cy - 1)) && tileAt(cx, cy - 1) !== 'h', ouvertDroite = !SOLID.has(tileAt(cx + 1, cy)) && tileAt(cx + 1, cy) !== 'h';
      if(ouvertDroite){ ctx.fillStyle = p; ctx.beginPath(); ctx.moveTo(x + T, y); ctx.lineTo(x + T + DX, y + DY); ctx.lineTo(x + T + DX, y + T + DY); ctx.lineTo(x + T, y + T); ctx.fill(); ctx.fillStyle = 'rgba(40,60,90,.28)'; ctx.fill(); }
      ctx.fillStyle = p; ctx.fillRect(x, y, T + .5, T + .5); if(c === 'w'){ ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(x, y, T, T); }
      if(!SOLID.has(tileAt(cx - 1, cy))){ const gl = ctx.createLinearGradient(x, 0, x + 5, 0); gl.addColorStop(0, 'rgba(30,50,80,.35)'); gl.addColorStop(1, 'rgba(30,50,80,0)'); ctx.fillStyle = gl; ctx.fillRect(x, y, 5, T + .5); }   // l'arête gauche des marches se voit
      if(ouvertHaut){ const d = motif(R, 'dessus', 56) || '#1f5fbf'; ctx.fillStyle = d; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + DX, y + DY); ctx.lineTo(x + T + DX, y + DY); ctx.lineTo(x + T, y); ctx.fill();
        ctx.fillRect(x, y, T + .5, 8); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, T + .5, 1.5); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x, y + 8, T + .5, 2); }
      return true; }
    if(c === '='){ const p = motif(R, 'bois_bleu', 64); if(!p) return false;
      ctx.fillStyle = p; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + DX, y + DY); ctx.lineTo(x + T + DX, y + DY); ctx.lineTo(x + T, y); ctx.fill(); ctx.fillRect(x, y, T + .5, 12);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x, y, T + .5, 1.5); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, y + 12, T + .5, 3); return true; }
    if(c === 'c' || c === 'S' || c === 'p' || c === 'U'){ const k = { c:'coffre_piece', S:'coffre_livre', p:'coffre_lampe', U:'coffre_vide' }[c]; if(!R.im[k]) return false;
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x + 3, y + T - 1, T - 2, 3); img(R, k, x - 2, y - 2 + (c === 'U' ? -2 : 0), T + 4, T + 4);
      if(c !== 'U'){ ctx.font = '15px serif'; ctx.textAlign = 'center'; ctx.fillText(c === 'S' ? '📚' : c === 'p' ? '🪔' : '🪙', x + T / 2, y + T - 4 + Math.sin(t * 4 + cx) * 1.2); }   // le symbole reste visible pour Amine
      return true; }
    if(c === 'b'){ return img(R, 'brique', x, y, T + .5, T + .5); }
    if(c === '~'){ const top = tileAt(cx, cy - 1) !== '~', p = motif(R, 'mer', 128, t * 18); if(!p) return false; const dy = top ? 8 + Math.sin(t * 3 + cx) * 3 : 0;
      ctx.globalAlpha = .93; ctx.fillStyle = p; ctx.fillRect(x, y + dy, T + .5, T - dy + .5); ctx.globalAlpha = 1; if(top){ ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(x, y + dy, T + .5, 2.5); } return true; }
    if(c === '^'){ const w = T + 10, h = haut(R, 'oursins', 1) ? w * R.im.oursins.naturalHeight / R.im.oursins.naturalWidth : 0; return h ? img(R, 'oursins', x - 5, y + T - h, w, h) : false; }
    return false; }

  // un objet (le contexte est déjà placé sur l'objet, le bas au point 0)
  function objet(e, g, t){ const R = de(g); if(!R) return false;
    switch(e.t){
      case 'coin': { const im = R.im.piece; if(!im) return false; const s = Math.max(.12, Math.abs(Math.cos(t * 3 + e.x * .1))); ctx.drawImage(im, -11 * s, -28, 22 * s, 23); return true; }
      case 'gem': { if(!R.im.jasmin_or) return false; const b = Math.sin(t * 3) * 3; ctx.shadowColor = '#ffe066'; ctx.shadowBlur = 18; img(R, 'jasmin_or', -18, -40 + b, 36, 36); ctx.shadowBlur = 0; return true; }
      case 'lamp': { if(!R.im.lanterne) return false; const h = 84, w = haut(R, 'lanterne', h); if(e.on){ ctx.globalAlpha = .3 + .15 * Math.sin(t * 5); ctx.fillStyle = '#ffd84d'; ctx.beginPath(); ctx.arc(0, -h * .72, 30, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } else ctx.filter = 'saturate(.5) brightness(.8)';
        img(R, 'lanterne', -w / 2, -h, w, h); ctx.filter = 'none'; return true; }
      case 'spring': { if(!R.im.ressort) return false; const s = 1 - (e.sq || 0) * .4, w = 46, h = w * R.im.ressort.naturalHeight / R.im.ressort.naturalWidth * s; img(R, 'ressort', -w / 2, -h, w, h); return true; }
      case 'door': { if(!R.im.porte) return false; const h = 104, w = haut(R, 'porte', h); ctx.fillStyle = '#f4efe6'; ctx.fillRect(-w / 2 - 8, -h - 8, w + 16, h + 8); img(R, 'porte', -w / 2, -h, w, h); return true; }
      case 'sign': { if(!R.im.panneau) return false; const w = 128, h = 74; img(R, 'panneau', -w / 2, -h, w, h);   // planche un peu aplatie : le texte tient dessus
        ctx.fillStyle = '#fff8e6'; ctx.font = '800 13px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#3a2410'; ctx.strokeText(e.txt, 0, -h * .63); ctx.fillText(e.txt, 0, -h * .63); return true; }
      case 'warp': { if(!R.im.jarre) return false; const gl = e.near ? .6 + .4 * Math.sin(t * 8) : 0, h = 62, w = haut(R, 'jarre', h);
        if(gl){ ctx.fillStyle = `rgba(255,224,102,${(.35 * gl).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(0, -30, 36, 42, 0, 0, 7); ctx.fill(); }
        img(R, 'jarre', -w / 2, -h, w, h);
        if(e.near){ ctx.fillStyle = '#fff'; ctx.font = '800 22px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⬇', 0, -74 + Math.sin(t * 6) * 4); ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.fillText('ne bouge plus…', 0, -100); }
        return true; }
      case 'mover': {   // ce qui bouge : la barque de Kerkennah, le flamant d'Ichkeul, le train du Lézard Rouge, le tapis volant de la médina, et les plateformes
        const x = e.px - e.x, y = e.py - e.y, w = e.w * T;
        if(e.kind === 'boat' && R.im.barque){ const bob = Math.sin(t * 2.2 + e.x0) * 1.5, bw = w + 34, bh = bw * R.im.barque.naturalHeight / R.im.barque.naturalWidth; img(R, 'barque', x - 14, y - bh * .32 + bob, bw, bh); return true; }
        if(e.kind === 'flamingo' && R.im.flamant){ const fh = 96, fw = haut(R, 'flamant', fh); ctx.save(); ctx.translate(x + w / 2, y); ctx.scale(-1, 1); img(R, 'flamant', -fw / 2, -fh * .42, fw, fh); ctx.restore(); return true; }   // on marche sur son dos
        if(e.kind === 'train' && R.im.train){ const r0 = e.x0 - e.x - T, r1 = e.x0 - e.x + (e.dist + e.w + 1) * T; ctx.fillStyle = '#4a3220'; ctx.fillRect(r0, y + 40, r1 - r0, 6); for(let k = r0; k < r1; k += 18) ctx.fillRect(k, y + 36, 8, 4);
          const th = 62, tw = Math.max(w + 40, th * R.im.train.naturalWidth / R.im.train.naturalHeight); img(R, 'train', x + w / 2 - tw / 2, y + 44 - th, tw, th); return true; }
        if(e.kind === 'pont' || e.kind === 'aiguille') return false;   // le pont de Bizerte et l'horloge de Testour gardent leur mécanique dessinée
        if(g.lv.n === 6 && R.im.tapis){ const th = 30, tw = w + 24; ctx.save(); ctx.translate(0, Math.sin(t * 4 + e.x0) * 2.5); img(R, 'tapis', x - 12, y - 6, tw, th); ctx.restore(); return true; }
        const p = motif(R, 'bois_bleu', 64); if(!p) return false;
        ctx.fillStyle = p; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + DX, y + DY); ctx.lineTo(x + w + DX, y + DY); ctx.lineTo(x + w, y); ctx.fill(); ctx.fillRect(x, y, w, 14);
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x, y, w, 1.5); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x, y + 14, w, 3); return true; }
      case 'power': { const k = e.kind === 'chechia' ? 'chechia' : e.kind === 'harissa' ? 'harissa' : 'the'; if(!R.im[k]) return false; const h = 30, w = haut(R, k, h); img(R, k, -w / 2, -h - 2 + Math.sin(t * 3) * 2, w, h); return true; }
    }
    return false; }
  return { fond, caseDe, objet, monde:n => !!MONDES[n] };
})();
