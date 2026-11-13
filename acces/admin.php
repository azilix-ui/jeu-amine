<?php
/*
 * Famille Missaoui — l'administration de l'accès au site (Anis seulement).
 * GET : la page. POST (fetch, en-tête X-Garde) : les actions, réponses en JSON.
 *   etat · activer(on) · ip_ajoute(ip?, nom) · ip_supprime(id) · appareil_renomme(id, nom) · appareil_revoque(id)
 *   invitation_cree(nom, lien, duree, usages) · invitation_supprime(id) · mdp(ancien, nouveau) · sortir
 */
declare(strict_types=1);
require __DIR__ . '/garde.php';
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');

function rep(int $code, array $d): void { http_response_code($code); header('Content-Type: application/json; charset=utf-8'); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
$admin = ga_admin_fiche();
if (empty($admin['hash'])) { header('Location: /acces/', true, 303); exit; }

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (($_SERVER['HTTP_X_GARDE'] ?? '') !== '1') rep(400, ['error' => 'Requête refusée.']);
    if (!ga_admin()) rep(401, ['error' => 'Ta connexion a expiré : reconnecte-toi.']);
    $in = json_decode((string)file_get_contents('php://input'), true) ?: [];
    $a = (string)($in['action'] ?? ''); $db = ga_db(); $t = time();
    $id = (int)($in['id'] ?? 0); $nom = mb_substr(trim((string)($in['nom'] ?? '')), 0, 60);
    try {
        if ($a === 'activer') {
            if (!empty($in['on']) && !ga_appareil()) rep(400, ['error' => "Cet appareil n'est pas encore de confiance : recharge la page puis réessaie."]);
            ga_reglage('actif', !empty($in['on']) ? '1' : '0');
        } elseif ($a === 'ip_ajoute') {
            $ip = trim((string)($in['ip'] ?? '')) ?: ga_ip();
            if (!filter_var($ip, FILTER_VALIDATE_IP)) rep(400, ['error' => "Cette adresse IP n'est pas valable."]);
            $db->prepare('INSERT INTO ips (ip, nom, cree) VALUES (?, ?, ?)')->execute([$ip, $nom ?: 'Maison', $t]);
        } elseif ($a === 'ip_supprime') {
            $db->prepare('DELETE FROM ips WHERE id = ?')->execute([$id]);
        } elseif ($a === 'appareil_renomme') {
            $db->prepare('UPDATE appareils SET nom = ? WHERE id = ?')->execute([$nom ?: 'Appareil', $id]);
        } elseif ($a === 'appareil_revoque') {
            $db->prepare('UPDATE appareils SET revoque = 1 WHERE id = ?')->execute([$id]);
        } elseif ($a === 'invitation_cree') {
            $lien = max(600, min(30 * 86400, (int)($in['lien'] ?? 86400)));
            $duree = max(3600, min(GA_ANNEE, (int)($in['duree'] ?? 7 * 86400)));
            $usages = max(0, min(50, (int)($in['usages'] ?? 1)));
            $code = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
            $db->prepare('INSERT INTO invitations (code, nom, cree, lien_expire, duree, usages_max) VALUES (?, ?, ?, ?, ?, ?)')->execute([$code, $nom, $t, $t + $lien, $duree, $usages]);
        } elseif ($a === 'invitation_supprime') {
            $db->prepare('UPDATE invitations SET revoque = 1 WHERE id = ?')->execute([$id]);
            $db->prepare('UPDATE appareils SET revoque = 1 WHERE invitation = ?')->execute([$id]);   // les invités entrés avec ce lien n'ont plus accès
        } elseif ($a === 'mdp') {
            if (!password_verify((string)($in['ancien'] ?? ''), (string)$admin['hash'])) { ga_note_echec(); rep(400, ['error' => "L'ancien mot de passe ne va pas."]); }
            $n = (string)($in['nouveau'] ?? ''); if (mb_strlen($n) < 10) rep(400, ['error' => 'Le nouveau mot de passe doit faire au moins 10 caractères.']);
            $admin['hash'] = password_hash($n, PASSWORD_DEFAULT); ga_admin_ecrit($admin);
        } elseif ($a === 'sortir') {
            $db->prepare('DELETE FROM sessions WHERE hash = ?')->execute([hash('sha256', (string)($_COOKIE[GA_COOKIE_ADMIN] ?? ''))]);
            ga_cookie(GA_COOKIE_ADMIN, '', 1, 'Strict'); rep(200, ['ok' => true]);
        } elseif ($a !== 'etat') rep(400, ['error' => 'Action inconnue.']);

        $moi = ga_appareil(); $ip = ga_ip();
        $schema = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' ? 'https' : 'http';
        $base = $schema . '://' . ($_SERVER['HTTP_HOST'] ?? 'www.missaoui-family.com');
        $invs = $db->query('SELECT i.*, (SELECT COUNT(*) FROM appareils a WHERE a.invitation = i.id AND a.revoque = 0 AND a.expire > ' . $t . ') AS actifs FROM invitations i WHERE i.revoque = 0 ORDER BY i.cree DESC LIMIT 60')->fetchAll();
        foreach ($invs as &$v) { $v['lien'] = $base . '/acces/invitation.php?c=' . $v['code']; unset($v['code']); } unset($v);
        rep(200, [
            'actif' => ga_reglage('actif') === '1', 'secours' => is_file(ga_donnees() . '/acces-ouvert'), 'admin' => $admin['id'],
            'ip' => $ip, 'ip_maison' => ga_ip_maison($ip), 'moi' => $moi ? (int)$moi['id'] : 0,
            'brut' => ['remote' => (string)($_SERVER['REMOTE_ADDR'] ?? ''), 'xff' => (string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''), 'cf' => (string)($_SERVER['HTTP_CF_CONNECTING_IP'] ?? ''), 'real' => (string)($_SERVER['HTTP_X_REAL_IP'] ?? '')],
            'ips' => $db->query('SELECT id, ip, nom, cree FROM ips ORDER BY cree')->fetchAll(),
            'appareils' => $db->query('SELECT id, nom, via, invitation, cree, expire, vu, ip, ua FROM appareils WHERE revoque = 0 AND expire > ' . $t . ' ORDER BY vu DESC')->fetchAll(),
            'invitations' => $invs,
            'refus' => $db->query('SELECT ts, ip, page, ua FROM refus ORDER BY ts DESC LIMIT 80')->fetchAll(),
        ]);
    } catch (Throwable $e) { error_log('admin acces : ' . $e->getMessage()); rep(500, ['error' => "Le serveur n'a pas pu enregistrer."]); }
}
if (!ga_admin()) { header('Location: /acces/?admin=1', true, 303); exit; }
if (!ga_appareil()) ga_nouvel_appareil('admin', GA_ANNEE);
?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#14102b">
<title>Accès au site · Famille Missaoui</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E%F0%9F%94%91%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Nunito:wght@400;600;700;800&display=swap">
<link rel="stylesheet" href="/acces/porte.css?v=1">
<style>
body{align-items:flex-start}
.porte.large{width:min(920px,100%);gap:18px}
.tete{display:flex;align-items:center;gap:14px;width:100%;justify-content:space-between;flex-wrap:wrap}
.tete h1{font-size:clamp(28px,6vw,40px);text-align:left}
.tete .boutons{display:flex;gap:10px;flex-wrap:wrap}
.petit{font:inherit;font-weight:800;font-size:15px;min-height:44px;padding:0 16px;border-radius:14px;border:0;background:#ffffff1c;color:#fbf6ea;box-shadow:none;margin:0;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.carte .petit{background:#eef1f6;color:var(--ink)}
.carte .petit.rouge{background:#fde8eb;color:#8a1426}
.carte .petit.vert{background:var(--mint);color:#0d2a1d}
.etat{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.etat .rond{width:22px;height:22px;border-radius:50%;background:#c9ced8;flex:none}
.etat.on .rond{background:#2e9e6e;box-shadow:0 0 0 6px #2e9e6e33}
.etat b{font-size:20px}
.liste{display:flex;flex-direction:column;gap:8px}
.ligne{display:flex;align-items:center;gap:12px;padding:12px;border-radius:16px;background:#f5f7fb;flex-wrap:wrap}
.ligne .q{flex:1 1 220px;min-width:0}
.ligne .q b{display:block;overflow-wrap:anywhere}
.ligne .q small{color:var(--soft);display:block;overflow-wrap:anywhere}
.badge{font-size:12px;font-weight:800;padding:3px 8px;border-radius:999px;background:#e6ecfa;color:#1f3c88;margin-left:6px;vertical-align:middle}
.badge.moi{background:#fff1bf;color:#7a5200}
.grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
select{font:inherit;font-size:17px;padding:12px;border-radius:14px;border:2px solid var(--line);background:#f7f8fb;color:var(--ink);min-height:52px}
.lienbox{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px}
.lienbox input{flex:1 1 260px;font-size:14px;min-height:44px;padding:8px 10px}
.vide{color:var(--soft);font-style:italic}
.conseil{background:#fff7dd;color:#3a2600;border-radius:16px;padding:12px 14px;line-height:1.45}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#18202e;color:#fff;padding:12px 18px;border-radius:14px;font-weight:700;box-shadow:0 10px 30px #0006;opacity:0;transition:opacity .2s;pointer-events:none;max-width:calc(100% - 32px)}
.toast.vu{opacity:1}
details summary{cursor:pointer;font-weight:800;color:var(--soft)}
</style>
</head>
<body>
<main class="porte large">
  <div class="tete">
    <h1>🔑 L'accès au site</h1>
    <div class="boutons"><a class="petit" href="/">← Le site</a><button class="petit" id="sortir" type="button">Se déconnecter</button></div>
  </div>

  <section class="carte">
    <div class="etat" id="etat"><span class="rond"></span><span style="flex:1 1 240px"><b id="etatTxt">…</b><br><span id="etatSous" style="color:var(--soft)"></span></span><button class="petit vert" id="bascule" type="button"></button></div>
    <div class="conseil" id="conseil" hidden></div>
  </section>

  <section class="carte">
    <h2>🏠 L'adresse internet de la maison</h2>
    <p>Tout appareil qui se connecte depuis cette adresse (la box de la maison) entre sans rien demander, et devient de confiance pour un an, même en dehors de la maison. L'adresse de la box peut changer : mets-la à jour depuis la maison s'il le faut.</p>
    <p>Ton adresse en ce moment : <b id="monIp">…</b> <span id="monIpEtat"></span></p>
    <div class="liste" id="ips"></div>
    <div class="lienbox"><input id="ipNom" placeholder="Nom (ex. Maison)" maxlength="60"><button class="petit vert" id="ipAjout" type="button">＋ Ajouter mon adresse actuelle</button></div>
  </section>

  <section class="carte">
    <h2>💌 Inviter quelqu'un</h2>
    <p>Crée un lien et envoie-le (SMS, WhatsApp…). La personne ouvre le lien puis touche « Entrer » : son appareil a accès pendant la durée choisie.</p>
    <div class="grille">
      <label>Pour qui ?<input id="invNom" placeholder="ex. Tata Leïla" maxlength="60"></label>
      <label>Le lien marche pendant<select id="invLien"><option value="3600">1 heure</option><option value="86400" selected>1 jour</option><option value="259200">3 jours</option><option value="604800">7 jours</option><option value="2592000">30 jours</option></select></label>
      <label>L'accès dure<select id="invDuree"><option value="86400">1 jour</option><option value="604800" selected>7 jours</option><option value="2592000">30 jours</option><option value="7776000">3 mois</option><option value="31536000">1 an</option></select></label>
      <label>Nombre d'appareils<select id="invUsages"><option value="1" selected>1 seul</option><option value="3">3</option><option value="5">5</option><option value="0">sans limite</option></select></label>
    </div>
    <button type="button" id="invCree">Créer le lien d'invitation</button>
    <div class="liste" id="invs"></div>
  </section>

  <section class="carte">
    <h2>📱 Les appareils de confiance</h2>
    <p>Retirer un appareil lui ferme la porte tout de suite (il devra repasser par la maison, une invitation ou ta connexion).</p>
    <div class="liste" id="apps"></div>
  </section>

  <section class="carte">
    <h2>🚫 Les visites refusées</h2>
    <p>Les dernières tentatives d'appareils inconnus (gardées 60 jours).</p>
    <div class="liste" id="refus"></div>
  </section>

  <section class="carte">
    <h2>🔒 Mon mot de passe</h2>
    <p>Identifiant : <b id="adminId"></b></p>
    <div class="grille">
      <label>Ancien mot de passe<input type="password" id="mdpA" autocomplete="current-password"></label>
      <label>Nouveau (10 caractères au moins)<input type="password" id="mdpN" autocomplete="new-password" minlength="10"></label>
    </div>
    <button type="button" class="petit vert" id="mdpOk" style="align-self:flex-start">Changer le mot de passe</button>
    <details><summary>Secours et détails techniques</summary>
      <p style="margin-top:8px">Si un jour plus personne n'arrive à entrer : dans hPanel › Gestionnaire de fichiers, crée un fichier vide nommé <b>acces-ouvert</b> dans le dossier <b>famille-data</b> (à côté de public_html). Le site s'ouvre à tous jusqu'à ce que tu le supprimes. Mot de passe oublié : supprime <b>famille-data/acces-admin.json</b>, puis recrée le compte avec le mot de passe parent.</p>
      <p id="brut" style="font-family:monospace;font-size:13px;overflow-wrap:anywhere"></p>
    </details>
  </section>
  <p class="pied">© 2026 Anis Missaoui · Famille Missaoui</p>
</main>
<div class="toast" id="toast" role="status"></div>
<script>
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const quand = ts => ts ? new Date(ts * 1000).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—';
const jour = ts => new Date(ts * 1000).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
const duree = s => s >= 300 * 86400 ? '1 an' : s >= 80 * 86400 ? '3 mois' : s >= 86400 ? Math.round(s / 86400) + ' jour' + (s >= 2 * 86400 ? 's' : '') : Math.round(s / 3600) + ' h';
const nav = ua => { ua = ua || ''; return /iPad|Macintosh.*Mobile/.test(ua) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Macintosh/.test(ua) ? 'Mac' : /bot|crawl|spider|preview|facebookexternalhit|WhatsApp/i.test(ua) ? 'robot' : 'autre'; };
let E = null;
function toast(t){ const el = $('toast'); el.textContent = t; el.classList.add('vu'); clearTimeout(toast.k); toast.k = setTimeout(() => el.classList.remove('vu'), 2600); }
async function api(action, data = {}){
  const r = await fetch('/acces/admin.php', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-Garde':'1' }, credentials:'same-origin', body:JSON.stringify({ action, ...data }) });
  const j = await r.json().catch(() => ({ error:'Réponse illisible du serveur.' }));
  if(r.status === 401){ location.href = '/acces/?admin=1'; throw 0; }
  if(!r.ok || j.error){ toast(j.error || 'Erreur.'); throw 0; }
  return j;
}
async function charge(action = 'etat', data){ E = await api(action, data); dessine(); }
function dessine(){
  const on = E.actif;
  $('etat').classList.toggle('on', on);
  $('etatTxt').textContent = on ? 'Protection activée' : 'Protection en pause : tout le monde entre';
  $('etatSous').textContent = on ? 'Seuls la maison, les appareils de confiance et les invités entrent.' : 'Prépare la maison et tes appareils, puis active.';
  $('bascule').textContent = on ? 'Mettre en pause' : 'Activer la protection';
  $('bascule').className = 'petit ' + (on ? 'rouge' : 'vert');
  const c = $('conseil'); const msgs = [];
  if(E.secours) msgs.push('⚠️ Le fichier de secours <b>acces-ouvert</b> est présent : le site reste ouvert à tous tant qu\'il existe.');
  if(!E.ips.length) msgs.push('Conseil : ajoute d\'abord l\'adresse de la maison (depuis le Wi-Fi de la maison), pour que les tablettes des enfants entrent toutes seules.');
  c.innerHTML = msgs.join('<br>'); c.hidden = !msgs.length;
  $('monIp').textContent = E.ip; $('monIpEtat').innerHTML = E.ip_maison ? '<span class="badge">c\'est la maison</span>' : '';
  $('ips').innerHTML = E.ips.length ? E.ips.map(x => `<div class="ligne"><span class="q"><b>${esc(x.nom)}</b><small>${esc(x.ip)} · ajoutée le ${jour(x.cree)}</small></span><button class="petit rouge" data-ipdel="${x.id}">Retirer</button></div>`).join('') : '<p class="vide">Aucune adresse pour l\'instant.</p>';
  $('invs').innerHTML = E.invitations.map(v => { const fini = v.lien_expire * 1000 < Date.now() || (v.usages_max && v.usages >= v.usages_max);
    return `<div class="ligne"><span class="q"><b>${esc(v.nom || 'Invitation')}</b><small>${fini ? 'Lien terminé' : 'Lien valable jusqu\'au ' + quand(v.lien_expire)} · accès ${duree(v.duree)} · ${v.usages}/${v.usages_max || '∞'} appareil(s) · ${v.actifs} entré(s)</small>
      ${fini ? '' : `<span class="lienbox"><input readonly value="${esc(v.lien)}"><button class="petit" data-copie="${esc(v.lien)}">Copier</button>${navigator.share ? `<button class="petit" data-partage="${esc(v.lien)}" data-nom="${esc(v.nom)}">Envoyer</button>` : ''}</span>`}</span>
      <button class="petit rouge" data-invdel="${v.id}">Supprimer</button></div>`; }).join('');
  $('apps').innerHTML = E.appareils.length ? E.appareils.map(a => `<div class="ligne"><span class="q"><b>${esc(a.nom)}${a.id === E.moi ? '<span class="badge moi">cet appareil</span>' : ''}<span class="badge">${a.via === 'maison' ? 'maison' : a.via === 'admin' ? 'toi' : 'invité'}</span></b>
      <small>Vu le ${quand(a.vu)} · ${esc(a.ip)} · accès jusqu'au ${jour(a.expire)}</small></span>
      <button class="petit" data-ren="${a.id}" data-nom="${esc(a.nom)}">Renommer</button>${a.id === E.moi ? '' : `<button class="petit rouge" data-appdel="${a.id}">Retirer</button>`}</div>`).join('') : '<p class="vide">Aucun appareil pour l\'instant.</p>';
  $('refus').innerHTML = E.refus.length ? E.refus.map(r => `<div class="ligne"><span class="q"><b>${esc(r.ip)} <span class="badge">${nav(r.ua)}</span></b><small>${quand(r.ts)} · ${esc(r.page)}</small></span></div>`).join('') : '<p class="vide">Aucune visite refusée.</p>';
  $('adminId').textContent = E.admin;
  $('brut').textContent = 'REMOTE_ADDR ' + E.brut.remote + ' · X-Forwarded-For ' + (E.brut.xff || '—') + ' · CF ' + (E.brut.cf || '—') + ' · X-Real-IP ' + (E.brut.real || '—');
}
$('bascule').onclick = async () => {
  if(!E.actif && !E.ips.length && !confirm("Aucune adresse de maison n'est enregistrée : les tablettes des enfants devront être invitées une par une. Activer quand même ?")) return;
  if(E.actif && !confirm('Mettre la protection en pause ? Tout le monde pourra de nouveau entrer.')) return;
  await charge('activer', { on:!E.actif }); toast(E.actif ? 'Protection activée 🔒' : 'Protection en pause');
};
$('ipAjout').onclick = async () => { await charge('ip_ajoute', { nom:$('ipNom').value }); $('ipNom').value = ''; toast('Adresse ajoutée 🏠'); };
$('invCree').onclick = async () => {
  await charge('invitation_cree', { nom:$('invNom').value, lien:+$('invLien').value, duree:+$('invDuree').value, usages:+$('invUsages').value });
  $('invNom').value = ''; const l = E.invitations[0]; if(l) { try { await navigator.clipboard.writeText(l.lien); toast('Lien créé et copié 💌'); } catch(e){ toast('Lien créé 💌'); } }
};
$('mdpOk').onclick = async () => { await charge('mdp', { ancien:$('mdpA').value, nouveau:$('mdpN').value }); $('mdpA').value = $('mdpN').value = ''; toast('Mot de passe changé'); };
$('sortir').onclick = async () => { await api('sortir'); location.href = '/acces/?sortie=1'; };
document.addEventListener('click', async e => {
  const b = e.target.closest('button'); if(!b) return; const d = b.dataset;
  if(d.ipdel && confirm('Retirer cette adresse ?')) await charge('ip_supprime', { id:+d.ipdel });
  if(d.invdel && confirm('Supprimer cette invitation ? Les appareils entrés avec ce lien perdront aussi l\'accès.')) await charge('invitation_supprime', { id:+d.invdel });
  if(d.appdel && confirm('Retirer cet appareil ? Il ne pourra plus entrer.')) await charge('appareil_revoque', { id:+d.appdel });
  if(d.ren){ const n = prompt('Nouveau nom de cet appareil :', d.nom); if(n) await charge('appareil_renomme', { id:+d.ren, nom:n }); }
  if(d.copie){ try { await navigator.clipboard.writeText(d.copie); toast('Lien copié'); } catch(err){ toast('Sélectionne le lien pour le copier'); } }
  if(d.partage){ try { await navigator.share({ title:'Invitation · Famille Missaoui', text:'Je t\'invite sur le site de jeux de la famille Missaoui' + (d.nom ? ', ' + d.nom : '') + ' : ouvre ce lien puis touche « Entrer ».', url:d.partage }); } catch(err){} }
});
charge();
<?php if (isset($_GET['bienvenue'])): ?>toast('Compte créé, bienvenue Anis 👋');<?php endif; ?>
</script>
</body>
</html>
