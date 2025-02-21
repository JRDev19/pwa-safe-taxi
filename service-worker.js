const CACHE_NAME = 'pwa-cache-v4';
const OFFLINE_URL = '/offline.html';

// Archivos que quieres precargar
const PRECACHE_URLS = [
  '/',
  '/index.html',
  OFFLINE_URL,
  '/style.css',
  '/app.js',
  '/service-worker.js'
];

//Cuando se instala el service worker(Solo ocurre la ´rimera vez)
self.addEventListener('install', e => {
    // console.log('Instalado el service worker');
    // console.log(e)
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
          return cache.addAll(PRECACHE_URLS);
        })
      );
      self.skipWaiting();
});

//Activar el service worker
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      // Eliminar los cachés antiguos que no sean el actual
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`Eliminando caché viejo: ${cacheName}`); // Agrega un log para saber qué se está eliminando
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Reclama clientes para controlar el sitio inmediatamente
});

// Manejo del evento fetch
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // Si la respuesta de la red es válida, actualiza el caché
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse; // Devuelve la respuesta de la red
        });
      })
      .catch(() => {
        // Si no hay conexión, intenta obtener el recurso del caché
        return caches.match(e.request).then(cachedResponse => {
          // Si no está cacheado, sirve el archivo offline.html
          return caches.match(OFFLINE_URL);
        });
      })
  );
});

// Sincronizar el caché cuando se detecta que está en línea
self.addEventListener('sync', event => {
  if (event.tag === 'update-cache') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return Promise.all(
          PRECACHE_URLS.map(url => {
            return fetch(url).then(response => {
              return cache.put(url, response); // Actualiza el caché con cada recurso
            });
          })
        );
      })
    );
  }
});

// Registrar un evento para manejar reconexiones
self.addEventListener('message', event => {
  if (event.data === 'online') {
    self.registration.sync.register('update-cache'); // Activa la sincronización del caché
  }
});