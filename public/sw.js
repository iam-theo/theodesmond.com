/* theodesmond.com — push service worker (desktop visitor alerts) */

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const title = data.title || "Someone is on your website"
  const options = {
    body: data.body || "A visitor just landed on theodesmond.com",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: data.tag || "visitor",
    renotify: true,
    requireInteraction: true,
    vibrate: [120, 60, 120],
    data: { url: data.url || "/admin" },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || "/admin"
  event.waitUntil(
    (async () => {
      const windows = await clients.matchAll({ type: "window", includeUncontrolled: true })
      for (const w of windows) {
        if (w.url.includes("/admin")) {
          await w.focus()
          return
        }
      }
      await clients.openWindow(url)
    })()
  )
})
