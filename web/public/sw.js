/* Service Worker fuer kina-search. Handgeschrieben, bewusst konservativ.
 *
 * Es gibt in Next 16.2.10 keine eingebaute SW-Konvention, und die verfuegbaren
 * Generatoren scheiden aus (next-pwa tot seit 2022, @serwist/turbopack stirbt auf
 * Vercel bei Cache-Miss). Deshalb Handarbeit, mit so wenig Magie wie moeglich.
 *
 * FLUCHTWEG, falls diese Datei je kaputt ausgeliefert wird:
 * Seite mit "?sw=off" oeffnen, z. B. https://<host>/?sw=off
 * 1. Der SW laesst jede Anfrage mit diesem Parameter am Cache vorbei ans Netz,
 *    die Seite laedt also frisch, selbst wenn der Cache vergiftet ist.
 * 2. components/Pwa.tsx meldet daraufhin jede Registrierung ab, loescht alle
 *    Caches und merkt sich die Abschaltung in localStorage ("kina.pwa.off").
 * Zusaetzlich reagiert dieser SW auf postMessage({type:"KINA_SW_UNREGISTER"}).
 * Letzte Instanz: /sw.js wird mit no-store ausgeliefert, ein Deploy mit einer
 * leeren Fassung plus unregister() erreicht also jeden Client sofort.
 */

const VERSION = "v1";
const SHELL_CACHE = `kina-shell-${VERSION}`;
const DATA_CACHE = `kina-data-${VERSION}`;
const IMAGE_CACHE = `kina-img-${VERSION}`;
const KEEP = [SHELL_CACHE, DATA_CACHE, IMAGE_CACHE];

const OFFLINE_URL = "/offline.html";
const PRECACHE = ["/", OFFLINE_URL, "/manifest.webmanifest", "/icons/icon-192.png"];

// Datenquelle liegt auf GitHub Pages, also fremde Herkunft.
const DATA_HOST = "clemensjl.github.io";

// Harte Obergrenze fuer den Bildcache. Produktbilder kommen von fremden CDNs und
// landen als opaque Antworten im Speicher; Browser rechnen die mit einem Aufschlag
// gegen das Quota. Deshalb niedrig angesetzt und streng nach aeltestem Eintrag geraeumt.
const IMAGE_LIMIT = 120;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Einzeln, damit eine fehlende Datei die Installation nicht scheitern laesst.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {}),
        ),
      );
    })(),
  );
  // Kein skipWaiting: eine neue Fassung uebernimmt erst, wenn alle Tabs zu sind.
  // Den SW mitten in einer Sitzung zu tauschen heisst, dass spaeter nachgeladene
  // Code-Chunks aus einer anderen Cache-Generation stammen als die bereits
  // gerenderte Seite. Ein verzoegertes Update ist der billigere Fehler.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((n) => (KEEP.includes(n) ? null : caches.delete(n))));
      // clients.claim ist gewollt: bei der Erstinstallation gibt es keinen alten
      // Zustand, den man erben koennte, und ohne claim bliebe der erste Besuch
      // unbedient. Zusammen mit dem fehlenden skipWaiting greift es nur dort,
      // wo es harmlos ist.
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "KINA_SW_UNREGISTER") {
    event.waitUntil(
      (async () => {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
        await self.registration.unregister();
      })(),
    );
  }
});

// Brauchbar ist nur, was lesbar und erfolgreich ist. Opaque Antworten (no-cors)
// haben Status 0 und lassen sich nicht pruefen, deshalb hier hart ausgeschlossen.
function isStorable(res) {
  return !!res && res.status === 200 && res.type !== "opaque" && res.type !== "error";
}

async function trimCache(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys(); // Reihenfolge entspricht der Einfuegereihenfolge
  for (let i = 0; i < keys.length - limit; i++) await cache.delete(keys[i]);
}

// Cache-First mit Aktualisierung im Hintergrund.
// key trennt Cache-Schluessel von der tatsaechlichen Anfrage (Navigationen ohne Query).
async function staleWhileRevalidate(event, request, cacheName, key, revalidate) {
  const cache = await caches.open(cacheName);
  const cacheKey = key || request;
  const cached = await cache.match(cacheKey);

  // /_next/static traegt den Build-Hash in der URL. Diese Antwort kann sich nie
  // aendern, eine Revalidierung waere reine Datenverschwendung.
  if (cached && !revalidate) return cached;

  const network = fetch(request)
    .then(async (res) => {
      if (isStorable(res)) await cache.put(cacheKey, res.clone());
      return res;
    })
    .catch(() => undefined);

  // waitUntil haelt den Worker am Leben, bis der Hintergrundschreibvorgang durch ist.
  event.waitUntil(network);

  if (cached) return cached;
  const res = await network;
  if (res) return res;
  throw new Error("offline");
}

// items.json: fremde Herkunft. Die Anfrage wird unveraendert weitergereicht, damit
// ihre CORS-Eigenschaften erhalten bleiben; ein selbst gebautes Request-Objekt hat
// hier schon einmal den Abruf zerlegt. Gespeichert wird nur, was isStorable durch
// laesst, also nie ein opaque Eintrag, dessen Inhalt wir nicht pruefen koennen.
async function dataStaleWhileRevalidate(event, request) {
  const cache = await caches.open(DATA_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request).then(async (res) => {
    if (isStorable(res)) {
      try {
        await cache.put(request, res.clone());
      } catch {
        /* Quota oder nicht speicherbare Antwort: der Abruf selbst bleibt gueltig. */
      }
    }
    return res;
  });

  if (cached) {
    // Aktualisierung laeuft im Hintergrund weiter, Fehler bleiben folgenlos.
    event.waitUntil(network.catch(() => {}));
    return cached;
  }
  // Ohne Cache wird die Netzantwort unveraendert durchgereicht, inklusive Fehlern.
  // Der Aufrufer faengt das ab und faellt auf einen nackten fetch zurueck.
  return network;
}

async function imageCacheFirst(event, request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const res = await fetch(request);
  // Produktbilder liegen auf fremden CDNs ohne CORS-Header und kommen deshalb
  // opaque zurueck. Fuer die reine Anzeige reicht das, nur "error" wird verworfen.
  if (res && res.type !== "error" && (res.status === 200 || res.status === 0)) {
    const copy = res.clone();
    event.waitUntil(
      cache.put(request, copy).then(() => trimCache(IMAGE_CACHE, IMAGE_LIMIT)),
    );
  }
  return res;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Fluchtweg: mit ?sw=off geht alles am Cache vorbei ans Netz.
  if (url.searchParams.get("sw") === "off") return;

  const sameOrigin = url.origin === self.location.origin;

  // API-Routen niemals cachen. Dort haengen Anmeldung, Session und Nutzerdaten dran.
  if (sameOrigin && (url.pathname.startsWith("/api/") || url.pathname === "/sw.js")) return;

  if (request.mode === "navigate") {
    // Ohne Query als Schluessel, sonst legt jede Suchanfrage eine eigene Kopie an.
    const key = new Request(url.origin + url.pathname);
    event.respondWith(
      staleWhileRevalidate(event, request, SHELL_CACHE, key, true).catch(async () => {
        const fallback = await caches.match(OFFLINE_URL);
        return (
          fallback ||
          new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
        );
      }),
    );
    return;
  }

  // Der grosse Brocken. Der Dateiname wird zusaetzlich zum bekannten Host geprueft,
  // weil NEXT_PUBLIC_DATA_URL die Quelle umbiegen kann und der SW kein env liest.
  const isData =
    url.pathname.endsWith("/items.json") ||
    (url.hostname === DATA_HOST && url.pathname.endsWith(".json"));
  if (isData) {
    // Sicherheitsnetz: jeder Fehler im Cache-Pfad endet in einem nackten fetch.
    // Ein Service Worker darf die Datenbank niemals unerreichbar machen.
    event.respondWith(dataStaleWhileRevalidate(event, request).catch(() => fetch(request)));
    return;
  }

  if (request.destination === "image") {
    // Faellt bei jedem Fehler auf das nackte Netz zurueck. Ein Fehler im Cache-Code
    // darf niemals dazu fuehren, dass ein Bild gar nicht mehr laedt.
    event.respondWith(imageCacheFirst(event, request).catch(() => fetch(request)));
    return;
  }

  if (sameOrigin) {
    const immutable = url.pathname.startsWith("/_next/static/");
    event.respondWith(
      staleWhileRevalidate(event, request, SHELL_CACHE, null, !immutable).catch(() =>
        fetch(request),
      ),
    );
  }
});
