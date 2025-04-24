// Service Worker para notificaciones y funcionalidad offline

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  return self.clients.claim()
})

// Manejo de notificaciones push
self.addEventListener("push", (event) => {
  if (event.data) {
    try {
      const data = event.data.json()
      const options = {
        body: data.body || "Es hora de completar tu hábito",
        icon: "/icon.png",
        badge: "/icon.png",
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: "1",
        },
        actions: [
          {
            action: "complete",
            title: "Completar",
            icon: "/check.png",
          },
          {
            action: "close",
            title: "Cerrar",
            icon: "/close.png",
          },
        ],
      }

      event.waitUntil(self.registration.showNotification(data.title || "Recordatorio de hábito", options))
    } catch (error) {
      console.error("Error al procesar la notificación push:", error)
    }
  }
})

// Manejo de clics en notificaciones
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "complete") {
    // Aquí se podría implementar la lógica para marcar el hábito como completado
    console.log("Usuario quiere completar el hábito")
  }

  // Abre la aplicación cuando se hace clic en la notificación
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Si ya hay una ventana abierta, enfócala
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i]
        if (client.url === "/" && "focus" in client) {
          return client.focus()
        }
      }
      // Si no hay ventanas abiertas, abre una nueva
      if (clients.openWindow) {
        return clients.openWindow("/")
      }
    }),
  )
})

// Almacenamiento en caché para funcionamiento offline
const CACHE_NAME = "habitos-cache-v1"
const urlsToCache = ["/", "/index.html", "/globals.css", "/icon.png", "/manifest.json"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si encontramos una coincidencia en la caché, la devolvemos
      if (response) {
        return response
      }

      // Si no está en caché, hacemos la solicitud a la red
      return fetch(event.request).then((response) => {
        // Comprobamos si recibimos una respuesta válida
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }

        // Clonamos la respuesta porque es un stream que solo se puede consumir una vez
        var responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    }),
  )
})

