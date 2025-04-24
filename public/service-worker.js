// Este es un service worker básico para la PWA

const CACHE_NAME = "habit-tracker-v1"
const urlsToCache = [
  "/",
  "/dashboard",
  "/auth/login",
  "/manifest.json",
  "/icon.png",
  "/icon-512.png",
  "/apple-icon.png",
]

// Instalación del service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache abierto")
      return cache.addAll(urlsToCache)
    }),
  )
})

// Activación del service worker
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Estrategia de caché: Network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Excluir las solicitudes a la API de Supabase
  if (event.request.url.includes("supabase.co")) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clonarla y almacenarla en caché
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Si la red falla, intentar servir desde caché
        return caches.match(event.request)
      }),
  )
})

// Sincronización en segundo plano
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(syncData())
  }
})

// Función para sincronizar datos
async function syncData() {
  // Aquí iría la lógica para sincronizar datos pendientes
  console.log("Sincronizando datos en segundo plano")
}

// Manejo de notificaciones push
self.addEventListener("push", (event) => {
  const data = event.data.json()
  const options = {
    body: data.body || "Es hora de completar tu hábito",
    icon: "/icon.png",
    badge: "/icon.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1",
      habitId: data.habitId,
    },
    actions: [
      {
        action: "complete",
        title: "Completar",
        icon: "/icon.png",
      },
      {
        action: "close",
        title: "Cerrar",
        icon: "/icon.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title || "Recordatorio de hábito", options))
})

// Manejo de clics en notificaciones
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "complete") {
    // Aquí se podría implementar la lógica para marcar el hábito como completado
    console.log("Usuario quiere completar el hábito:", event.notification.data.habitId)

    // Abrir la aplicación en la página de hábitos
    event.waitUntil(
      clients.openWindow("/dashboard?tab=habits&action=complete&habitId=" + event.notification.data.habitId),
    )
  } else {
    // Abrir la aplicación
    event.waitUntil(clients.openWindow("/dashboard"))
  }
})
