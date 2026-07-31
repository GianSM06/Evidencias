/* Service worker: hace que la app funcione sin internet en planta.

   Estrategia: RED PRIMERO, con la copia guardada como respaldo.
   Antes era al revés (copia primero) y eso hacía que un teléfono con la app
   instalada se quedara con una versión vieja aunque el servidor ya tuviera otra.
   Ahora, si hay señal, siempre se trae lo último; si no hay, usa la copia.
   El timeout evita que una señal mala deje la app colgada esperando la red. */
const CACHE = "evidencias-v13";
const ESPERA_RED = 1200;   // sin señal, es lo que se espera antes de usar la copia
const ARCHIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icono.svg"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARCHIVOS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function conEspera(promesa, ms){
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("sin respuesta")), ms);
    promesa.then(
      v => { clearTimeout(t); res(v); },
      e => { clearTimeout(t); rej(e); }
    );
  });
}

self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  if(new URL(e.request.url).origin !== self.location.origin) return;

  e.respondWith(
    conEspera(fetch(e.request), ESPERA_RED)
      .then(res => {
        if(res && res.ok){
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(hit => hit || caches.match("./index.html"))
      )
  );
});
