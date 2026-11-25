// Mechmoum s'installe sur l'écran d'accueil (iPad, iPhone, Android, ordinateur).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/reseau/sw.js', { scope: '/reseau/' }).catch(function () {});
  });
}
