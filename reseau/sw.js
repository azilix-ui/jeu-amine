/* Mechmoum : l'application à installer (portée /reseau/ seulement).
   - L'API (/reseau/api/) ne passe jamais par le cache : les données privées ne restent pas dans la tablette.
   - Les fichiers de Next.js (/reseau/_next/static/, noms qui changent à chaque version) : la copie gardée d'abord.
   - Les pages : le réseau d'abord, la copie gardée seulement hors connexion. */
const V = 'mechmoum-v1';
const BASE = '/reseau/';
const CORE = [BASE, BASE + 'login/', BASE + 'manifest.webmanifest', BASE + 'icone-192.png', BASE + 'avatar.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('mechmoum-') && k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const garde = (req, res) => { if (res && res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(V).then((c) => c.put(req, cp)).catch(() => {}); } return res; };
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin || !u.pathname.startsWith(BASE)) return;
  if (u.pathname.startsWith(BASE + 'api/')) return;
  if (u.pathname.startsWith(BASE + '_next/static/') || /\.(png|svg|woff2?)$/i.test(u.pathname)) {
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => garde(r, res))));
    return;
  }
  e.respondWith(fetch(r).then((res) => garde(r, res)).catch(() => caches.match(r, { ignoreSearch: true }).then((hit) => hit || caches.match(BASE))));
});
