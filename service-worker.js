const CACHE_NAME = 'pwacache-v1';
const PRECACHE = [
  'index.html','tienda.html','contacto.html','css/style.css','js/main.js','nav.html'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(PRECACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=> k!==CACHE_NAME && caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  const { request } = e;
  if (request.method !== 'GET') return;
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE_NAME).then(c => c.put(request, copy));
      return resp;
    }).catch(()=> cached))
  );
});