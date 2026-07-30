/* Service worker: guarda la app para que funcione sin internet en planta. */
/* Subí este número cada vez que cambies index.html, o los teléfonos que ya
   tienen la app instalada van a seguir mostrando la versión vieja. */
const CACHE = "evidencias-v9";
const ARCHIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icono.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copia = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
