import { WebSocketServer } from "ws"
import jwt from "jsonwebtoken"
import { query } from "./db.js"
import { clientIp, parseDevice, geoLookup, rateLimit } from "./util.js"
import { sendMail, emailShell, detailRows, esc } from "./email.js"
import { pushToAll, pushToVisitor } from "./push.js"

const ALERT_WINDOW_MS =
  Math.max(1, Number(process.env.VISIT_ALERT_MINUTES || 30)) * 60 * 1000
const SWEEP_MS = 30 * 1000
const OFFLINE_TTL_MS = 5 * 60 * 1000
const HEARTBEAT_MS = 30 * 1000
const MAX_SOCKETS_PER_IP = 20

function jwtSecret() {
  return process.env.JWT_SECRET || "change-me-in-production"
}

// ip -> visitor. One entry per IP: multiple tabs/devices behind the same
// address collapse into a single live visitor.
const visitors = new Map()
const admins = new Set()

// ---- live-chat rooms: conversationId -> Set of viewer sockets ----
const rooms = new Map()

function roomAdd(convId, ws) {
  if (!rooms.has(convId)) rooms.set(convId, new Set())
  rooms.get(convId).add(ws)
}

function roomDrop(ws) {
  const id = ws._room
  if (!id) return
  const set = rooms.get(id)
  if (set) {
    set.delete(ws)
    if (set.size === 0) rooms.delete(id)
  }
  ws._room = null
}

export function roomBroadcast(convId, payload) {
  roomSend(convId, { t: "chat-msg", conversation_id: convId, message: payload })
}

/** Send a raw frame to every open socket in a conversation room. */
export function roomSend(convId, obj) {
  const set = rooms.get(convId)
  if (!set) return
  const data = JSON.stringify(obj)
  for (const ws of set) {
    if (ws.readyState === 1) {
      try {
        ws.send(data)
      } catch {
        /* ignore */
      }
    }
  }
}

/** Notify every connected admin (new chat message, typing, etc.). */
export function adminNotify(payload) {
  const data = JSON.stringify(payload)
  for (const ws of admins) {
    if (ws.readyState === 1) {
      try {
        ws.send(data)
      } catch {
        /* ignore */
      }
    }
  }
}

/** Relay a typing indicator to a conversation room (except sender) + admins. */export function typingRelay(convId, from, name, except) {
  const set = rooms.get(convId)
  if (set) {
    const data = JSON.stringify({ t: "typing", conversation_id: convId, from })
    for (const ws of set) {
      if (ws !== except && ws.readyState === 1) {
        try {
          ws.send(data)
        } catch {
          /* ignore */
        }
      }
    }
  }
  adminNotify({ t: "typing", conversation_id: convId, from, name: name || "" })
}

export function adminsOnline() {
  let n = 0
  for (const ws of admins) if (ws.readyState === 1) n += 1
  return n
}

export function roomSize(convId) {
  const set = rooms.get(convId)
  if (!set) return 0
  let n = 0
  for (const ws of set) if (ws.readyState === 1) n += 1
  return n
}

/**
 * Persist an admin message for a live visitor and push it straight to their
 * open tabs (presence popup + any live-chat room they're viewing). Resolves
 * to { conversation_id, delivered } or { error: "offline" }.
 */
export async function sendVisitorMessage(maskedIp, text) {
  let v = null
  for (const cand of visitors.values()) {
    if (cand.maskedIp === maskedIp && cand.sockets.size > 0) {
      if (!v || Date.parse(cand.lastSeen) > Date.parse(v.lastSeen)) v = cand
    }
  }
  if (!v) return { error: "offline" }

  const conv = await findOrCreateOpenConversation(v.visitorKey || v.ip)
  const { rows } = await query(
    `insert into chat_messages (conversation_id, sender, name, text, attachment_url, status)
     values ($1, 'admin', 'Theo', $2, null, 'delivered') returning *`,
    [conv.id, text]
  )
  const msg = rows[0]
  await query("update conversations set updated_at = now() where id = $1", [conv.id])

  roomSend(conv.id, { t: "chat-msg", conversation_id: conv.id, message: msg })

  const popup = {
    t: "admin-popup",
    conversation_id: conv.id,
    sender: "admin",
    from: "Theo",
    text: msg.text,
    at: msg.created_at,
  }
  let delivered = 0
  for (const ws of v.sockets) {
    if (ws.readyState === 1) {
      try {
        ws.send(JSON.stringify(popup))
        delivered += 1
      } catch {
        /* ignore */
      }
    }
  }

  adminNotify({ t: "chat", conversation_id: conv.id, message: msg })

  // Send push notification to visitor if they have subscriptions
  if (v.visitorKey) {
    pushToVisitor(v.visitorKey, {
      title: "New message from Theo",
      body: text.slice(0, 100),
      url: "/",
      tag: `chat-${conv.id}`,
    }).catch(() => {})
  }

  return { ok: true, conversation_id: conv.id, delivered }
}

async function findOrCreateOpenConversation(visitorKey) {
  const existing = await query(
    "select * from conversations where status = 'open' and visitor_key = $1 order by updated_at desc limit 1",
    [visitorKey]
  )
  if (existing.rows[0]) return existing.rows[0]
  const created = await query(
    "insert into conversations (visitor_name, visitor_email, visitor_key) values ('', '', $1) returning *",
    [visitorKey]
  )
  return created.rows[0]
}

function serialize(v) {
  return {
    ip: v.maskedIp,
    city: v.city,
    region: v.region,
    country: v.country,
    country_code: v.country_code,
    org: v.org,
    lat: v.lat,
    lon: v.lon,
    timezone: v.timezone,
    mapUrl: v.lat != null && v.lon != null ? `https://www.google.com/maps?q=${v.lat},${v.lon}` : "",
    device: v.device,
    os: v.os,
    browser: v.browser,
    screen: v.screen,
    language: v.language,
    referrer: v.referrer,
    currentPath: v.currentPath,
    pages: v.pages,
    firstSeen: v.firstSeen,
    lastSeen: v.lastSeen,
    sockets: v.sockets.size,
    online: v.sockets.size > 0,
  }
}

function snapshot() {
  return [...visitors.values()].filter((v) => v.sockets.size > 0).map(serialize)
}

function broadcast() {
  const snap = snapshot()
  const data = JSON.stringify({ t: "presence", online: snap.length, visitors: snap })
  for (const ws of admins) {
    if (ws.readyState === 1) {
      try {
        ws.send(data)
      } catch {
        /* ignore */
      }
    }
  }
}

async function logVisitRow(v, path) {
  try {
  await query(
    `insert into visits (path, referrer, ip, city, region, country, country_code, org, lat, lon, timezone, user_agent, device, os, browser, screen, language)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [path, v.referrer || null, v.ip, v.city || null, v.region || null, v.country || null,
     v.country_code || null, v.org || null, v.lat ?? null, v.lon ?? null, v.timezone || null,
     v.ua || null, v.device, v.os, v.browser, v.screen || null, v.language || null]
  )
  } catch {
    /* logging must never break presence */
  }
}

async function maybeAlert(v, path) {
  try {
    const since = new Date(Date.now() - ALERT_WINDOW_MS).toISOString()
    const { rows } = await query(
      "select created_at from visits where ip = $1 and created_at >= $2 order by created_at desc limit 2",
      [v.ip, since]
    )
    if (rows.length > 1) return
    const where = [v.city, v.region, v.country].filter(Boolean).join(", ") || "Unknown location"
    // Desktop push — independent of email config.
    pushToAll({
      title: "Someone is on your website",
      body: `${where} · ${v.device} · ${path}`,
      url: "/admin",
      tag: `visit-${v.ip}`,
    }).catch(() => {})
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return
    const to = process.env.VISIT_TO_EMAIL || process.env.CONTACT_TO_EMAIL || "hello@theodesmond.com"
    await sendMail({
      to,
      subject: `Visitor on theodesmond.com — ${where} · ${v.device} · ${path}`,
      text: [`New visitor`, ``, `Page: ${path}`, `IP: ${v.ip}`, `Location: ${where}`,
        `Device: ${v.device} · ${v.os} · ${v.browser}`].join("\n"),
      html: emailShell({
        eyebrow: "Visitor alert",
        title: "Someone is on your website",
        intro: `${esc(where)} · ${esc(v.device)} · ${esc(path)}`,
        body: detailRows([
          ["Page", esc(path)],
          ["IP", esc(v.ip)],
          ["Location", esc(where)],
          ["Device", `${esc(v.device)} · ${esc(v.os)} · ${esc(v.browser)}`],
        ]),
      }),
    })
  } catch {
    /* mail is best-effort */
  }
}

function maskIp(ip) {
  if (!ip || ip === "unknown") return "unknown"
  const parts = ip.split(".")
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.***`
  return ip.slice(0, 6) + "***"
}

async function handlePage(ws, msg) {
  const v = ws._visitor
  if (!v) return
  if (msg.visitor_key) v.visitorKey = String(msg.visitor_key).slice(0, 60)
  const path = String(msg.path || "/").slice(0, 500)
  const now = new Date().toISOString()
  const last = v.pages[v.pages.length - 1]

  // Ignore rapid same-path repeats (reconnect storms, StrictMode, …).
  if (last && last.path === path && Date.now() - Date.parse(last.at) < 5000) {
    v.lastSeen = now
    v.currentPath = path
    broadcast()
    return
  }

  v.currentPath = path
  v.lastSeen = now
  v.pages.push({ path, at: now })
  if (v.pages.length > 50) v.pages = v.pages.slice(-50)
  if (msg.screen) v.screen = String(msg.screen).slice(0, 60)
  if (msg.language) v.language = String(msg.language).slice(0, 20)
  if (msg.referrer && !v.referrer) v.referrer = String(msg.referrer).slice(0, 1000)

  const firstPage = v.pages.length === 1
  logVisitRow(v, path)
  if (firstPage) maybeAlert(v, path)
  broadcast()
}

export function attachLive(server) {
  const wss = new WebSocketServer({ noServer: true })

  server.on("upgrade", (req, socket, head) => {
    let pathname = ""
    try {
      pathname = new URL(req.url, "http://x").pathname
    } catch {
      socket.destroy()
      return
    }
    if (pathname !== "/live") return
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req))
  })

  // Drop dead sockets.
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws._alive === false) {
        try {
          ws.terminate()
        } catch {
          /* ignore */
        }
        continue
      }
      ws._alive = false
      try {
        ws.ping()
      } catch {
        /* ignore */
      }
    }
  }, HEARTBEAT_MS)
  heartbeat.unref?.()

  // Sweep long-offline visitors.
  const sweep = setInterval(() => {
    const cutoff = Date.now() - OFFLINE_TTL_MS
    for (const [ip, v] of visitors) {
      if (v.sockets.size === 0 && Date.parse(v.lastSeen) < cutoff) visitors.delete(ip)
    }
  }, SWEEP_MS)
  sweep.unref?.()

  wss.on("connection", async (ws, req) => {
    ws._alive = true
    ws.on("pong", () => {
      ws._alive = true
    })

    let params
    try {
      params = new URL(req.url, "http://x").searchParams
    } catch {
      ws.close()
      return
    }

    // ---- admin subscriber (needs staff JWT) ----
    if (params.get("role") === "admin") {
      try {
        const token = params.get("token") || ""
        jwt.verify(token, jwtSecret())
      } catch {
        ws.close(4401, "unauthorized")
        return
      }
      admins.add(ws)
      ws.on("close", () => admins.delete(ws))
      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(String(raw))
          if (msg && msg.t === "typing" && typeof msg.conversation_id === "string") {
            typingRelay(msg.conversation_id.slice(0, 60), "admin", "Theo", ws)
          }
        } catch {
          /* ignore */
        }
      })
      try {
        const snap = snapshot()
        ws.send(JSON.stringify({ t: "presence", online: snap.length, visitors: snap }))
      } catch {
        /* ignore */
      }
      return
    }

    // ---- public viewer ----
    const ip = clientIp(req)
    const perIp = [...wss.clients].filter((c) => c._ip === ip).length
    if (perIp >= MAX_SOCKETS_PER_IP || !rateLimit(`ws:${ip}`, 30, 60 * 1000)) {
      ws.close(4429, "rate limited")
      return
    }
    ws._ip = ip

    let v = visitors.get(ip)
    if (!v) {
      const ua = String(req.headers["user-agent"] || "").slice(0, 1000)
      const { device, os, browser } = parseDevice(ua)
      const now = new Date().toISOString()
      v = {
        ip,
        maskedIp: maskIp(ip),
        city: "", region: "", country: "", country_code: "", org: "",
        lat: null, lon: null, timezone: "",
        device, os, browser, ua,
        screen: "", language: "", referrer: "",
        currentPath: "/",
        pages: [],
        firstSeen: now,
        lastSeen: now,
        sockets: new Set(),
        geoDone: false,
        visitorKey: "",
      }
      visitors.set(ip, v)
      geoLookup(ip).then((geo) => {
        v.city = geo.city || ""
        v.region = geo.region || ""
        v.country = geo.country || ""
        v.country_code = geo.country_code || ""
        v.org = geo.org || ""
        v.lat = geo.lat ?? null
        v.lon = geo.lon ?? null
        v.timezone = geo.timezone || ""
        v.geoDone = true
        broadcast()
      })
    }
    v.sockets.add(ws)
    ws._visitor = v

    ws.on("message", (raw) => {
      let msg
      try {
        msg = JSON.parse(String(raw))
      } catch {
        return
      }
      if (msg && (msg.t === "page" || msg.t === "hello")) handlePage(ws, msg)
      if (msg && msg.t === "typing" && typeof msg.conversation_id === "string") {
        typingRelay(msg.conversation_id.slice(0, 60), "visitor", "", ws)
      }
      if (msg && msg.t === "chat-join" && typeof msg.conversation_id === "string") {
        roomDrop(ws)
        ws._room = msg.conversation_id.slice(0, 60)
        roomAdd(ws._room, ws)
      }
    })

    const detach = () => {
      roomDrop(ws)
      v.sockets.delete(ws)
      v.lastSeen = new Date().toISOString()
      broadcast()
    }
    ws.on("close", detach)
    ws.on("error", detach)

    broadcast()
  })

  return { visitors, broadcast }
}
