// Service worker di Dosi impasti.
// Rete prima, cache come rete di scorta. Quando cambia il contenuto dei file
// alzo VERSIONE: le cache vecchie vengono buttate all'attivazione.
const VERSIONE = "impasti-v3";
const FILE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSIONE)
      .then(c => c.addAll(FILE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== VERSIONE).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  // niente domini terzi e niente scritture: il service worker si occupa
  // solo dei file di questa app
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && res.type === "basic"){
          const copia = res.clone();
          caches.open(VERSIONE).then(c => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
