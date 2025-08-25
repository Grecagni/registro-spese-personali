const CACHE_NAME = 'spese-cache-v1';
const ASSETS = [
  '/',
  'index.html',
  'inserisci.html',
  'storico.html',
  'login.html',
  'signup.html',
  'css/style.css',
  'js/auth.js',
  'js/spese.js',
  'js/login.js',
  'js/signup.js',
  'js/dashboard.js',
  'js/navbar.js',
  'js/sw.js',
  'partials/navbar.html',
  'manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', event => {
  const requestOrigin = new URL(event.request.url).origin;
  if (requestOrigin !== self.location.origin) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
