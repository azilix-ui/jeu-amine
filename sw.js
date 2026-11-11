/* Famille Missaoui : le site s'installe comme une application.
   Pages, styles et scripts : d'abord le réseau (toujours la dernière version), la copie gardée sert hors connexion.
   Images et Three.js : d'abord la copie gardée (rapide). Les API, voix et vidéos passent toujours par le réseau. */
const V = 'missaoui-v5';   // à augmenter quand une image change de contenu sans changer de nom (ex. avatar de Salma, 10/11)
const CORE = ['/', '/index.html', '/famille.css?v=6', '/famille.js', '/site.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const keep = (req, res) => { if(res && res.ok && res.type === 'basic'){ const cp = res.clone(); caches.open(V).then(c => c.put(req, cp)).catch(() => {}); } return res; };
self.addEventListener('fetch', e => {
  const r = e.request; if(r.method !== 'GET') return;
  const u = new URL(r.url); if(u.origin !== location.origin) return;
  if(u.pathname.startsWith('/api/') || u.pathname.includes('/voix/') || u.pathname.endsWith('.php')) return;
  if(r.headers.has('range') || /\.(mp4|webm|mp3|m4a|wav)$/i.test(u.pathname)) return;
  if(/\.(webp|png|jpe?g|gif|svg|ico|woff2?)$/i.test(u.pathname) || u.pathname.startsWith('/lib/')){
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => keep(r, res))));
    return;
  }
  e.respondWith(fetch(r).then(res => keep(r, res)).catch(() => caches.match(r, { ignoreSearch:r.mode === 'navigate' }).then(hit => hit || (r.mode === 'navigate' ? caches.match('/index.html') : Response.error()))));
});
