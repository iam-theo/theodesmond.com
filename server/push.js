import webpush from "web-push"
import { query } from "./db.js"

let configured = false

function setup() {
  const pub = process.env.VAPID_PUBLIC_KEY || ""
  const priv = process.env.VAPID_PRIVATE_KEY || ""
  if (!pub || !priv || configured) return configured
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:hello@theodesmond.com",
      pub,
      priv
    )
    configured = true
  } catch {
    configured = false
  }
  return configured
}

export function pushConfigured() {
  return setup()
}

export function vapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || ""
}

/** Fan out a push notification to every subscribed device. Prunes dead (410/404) endpoints. */
export async function pushToAll(payload) {
  if (!setup()) return { ok: false, sent: 0, error: "push not configured" }
  let rows = []
  try {
    const r = await query("select * from push_subscriptions")
    rows = r.rows
  } catch {
    return { ok: false, sent: 0, error: "db error" }
  }
  let sent = 0
  const body = JSON.stringify(payload)
  await Promise.all(
    rows.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        )
        sent += 1
      } catch (err) {
        // Expired/revoked subscription — prune it.
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          try {
            await query("delete from push_subscriptions where id = $1", [s.id])
          } catch {
            /* ignore */
          }
        }
      }
    })
  )
  return { ok: true, sent }
}

/** Send push notification to all subscriptions for a specific visitor_key. */
export async function pushToVisitor(visitorKey, payload) {
  if (!setup()) return { ok: false, sent: 0, error: "push not configured" }
  let rows = []
  try {
    const r = await query("select * from push_subscriptions where visitor_key = $1", [visitorKey])
    rows = r.rows
  } catch {
    return { ok: false, sent: 0, error: "db error" }
  }
  let sent = 0
  const body = JSON.stringify(payload)
  await Promise.all(
    rows.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        )
        sent += 1
      } catch (err) {
        // Expired/revoked subscription — prune it.
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          try {
            await query("delete from push_subscriptions where id = $1", [s.id])
          } catch {
            /* ignore */
          }
        }
      }
    })
  )
  return { ok: true, sent }
}
