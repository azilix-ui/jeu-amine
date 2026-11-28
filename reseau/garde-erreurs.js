/* Mechmoum (28/11) : si une page plante, on le note sur le serveur (pour comprendre) et, si c'est un morceau de l'application
   d'avant une mise à jour (« ChunkLoadError »), on recharge une fois tout seul. */
(function () {
  var envoye = 0;
  function note(m, pile) {
    if (envoye++ > 5) return;
    try {
      var d = JSON.stringify({ message: String(m || '').slice(0, 500), pile: String(pile || '').slice(0, 1500), page: location.pathname + location.search, ua: navigator.userAgent.slice(0, 200) });
      if (navigator.sendBeacon) navigator.sendBeacon('/reseau/api/erreur', new Blob([d], { type: 'application/json' }));
      else fetch('/reseau/api/erreur', { method: 'POST', body: d, headers: { 'Content-Type': 'application/json' }, keepalive: true });
    } catch (e) {}
  }
  function morceau(m) { return /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed/i.test(String(m || '')); }
  function recharge() {
    try { if (sessionStorage.getItem('mc-recharge') === location.pathname) return; sessionStorage.setItem('mc-recharge', location.pathname); } catch (e) { return; }
    location.reload();
  }
  window.__mcNote = note;
  addEventListener('error', function (e) { var m = (e.error && (e.error.name + ': ' + e.error.message)) || e.message; note(m, e.error && e.error.stack); if (morceau(m)) recharge(); });
  addEventListener('unhandledrejection', function (e) { var r = e.reason || {}; var m = (r.name ? r.name + ': ' : '') + (r.message || r); note(m, r.stack); if (morceau(m)) recharge(); });
  addEventListener('load', function () { setTimeout(function () { try { sessionStorage.removeItem('mc-recharge'); } catch (e) {} }, 10000); });
})();
