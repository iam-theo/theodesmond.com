import express from "express"
import jwt from "jsonwebtoken"
import { fileURLToPath } from "node:url"
import { dirname, join, extname, resolve, sep } from "node:path"
import { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync } from "node:fs"
import { randomBytes } from "node:crypto"
import { execSync, spawn } from "node:child_process"
import { query, initDb } from "./db.js"
import { seedAdmin, login, requireAuth } from "./auth.js"
import { attachLive, roomBroadcast, roomSend, adminNotify, adminsOnline, roomSize, sendVisitorMessage } from "./live.js"
import { vapidPublicKey, pushToAll } from "./push.js"
import {
  sendMail,
  mailConfigured,
  emailShell,
  detailRows,
  quoteBlock,
  esc,
  SITE_URL,
} from "./email.js"
import { clientIp, ipHash, parseDevice, geoLookup, rateLimit } from "./util.js"

const here = dirname(fileURLToPath(import.meta.url))
const DIST = join(here, "..", "dist")
const UPLOADS = join(here, "..", "uploads")
if (!existsSync(UPLOADS)) mkdirSync(UPLOADS, { recursive: true })
const PORT = Number(process.env.PORT || 3001)
const CONTACT_TO = process.env.CONTACT_TO_EMAIL || "hello@theodesmond.com"
const VISIT_TO = process.env.VISIT_TO_EMAIL || CONTACT_TO
// Same session-based throttle as the live hub: alert only when the IP has
// been silent longer than the window. Configure with VISIT_ALERT_MINUTES.
const ALERT_WINDOW_MS =
  Math.max(1, Number(process.env.VISIT_ALERT_MINUTES || 30)) * 60 * 1000

const app = express()
app.set("trust proxy", 1)
app.use(express.json({ limit: "1mb" }))

// ---------- mappers (DB snake_case -> site camelCase) ----------
function mapPost(r) {
  return {
    slug: r.slug,
    title: r.title,
    seoTitle: r.seo_title || null,
    topic: r.topic,
    date: r.date,
    datePublished: r.date_published || null,
    dateModified: r.date_modified || null,
    readTime: r.read_time || "5 min read",
    status: r.status,
    excerpt: r.excerpt,
    seoDescription: r.seo_description || null,
    keywords: Array.isArray(r.keywords) ? r.keywords : [],
    ogImage: r.og_image || null,
    blocks: Array.isArray(r.blocks) ? r.blocks : [],
  }
}

function mapProduct(r) {
  return {
    index: r.idx,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    category: r.category,
    industry: r.industry,
    tags: r.tags || [],
    status: r.status,
    accent: r.accent,
    visual: r.visual,
    image: r.image,
    link: r.link,
    details: r.details,
    seoDesc: r.seo_desc,
    overview: r.overview,
    features: r.features || [],
    functions: r.functions || [],
    architecture: r.architecture,
    framework: r.framework || [],
  }
}

const asyncWrap = (fn) => (req, res, next) => fn(req, res, next).catch(next)

// ---------- public reads ----------
app.get("/api/health", (req, res) => res.json({ ok: true }))

app.get("/api/posts", asyncWrap(async (req, res) => {
  const { rows } = await query(
    "select * from posts where status <> 'Draft' order by sort_order asc"
  )
  res.json(rows.map(mapPost))
}))

app.get("/api/posts/:slug", asyncWrap(async (req, res) => {
  const { rows } = await query("select * from posts where slug = $1", [req.params.slug])
  if (!rows[0]) return res.status(404).json({ error: "not found" })
  res.json(mapPost(rows[0]))
}))

app.get("/api/products", asyncWrap(async (req, res) => {
  const { rows } = await query("select * from products order by sort_order asc")
  res.json(rows.map(mapProduct))
}))

app.get("/api/products/:slug", asyncWrap(async (req, res) => {
  const { rows } = await query("select * from products where slug = $1", [req.params.slug])
  if (!rows[0]) return res.status(404).json({ error: "not found" })
  res.json(mapProduct(rows[0]))
}))

app.get("/api/content", asyncWrap(async (req, res) => {
  const { rows } = await query("select key, value from site_content")
  const out = {}
  for (const r of rows) out[r.key] = r.value
  res.json(out)
}))

// ---------- contact ----------
app.post("/api/contact", asyncWrap(async (req, res) => {
  const ip = clientIp(req)
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)) {
    return res.status(429).json({ ok: false, error: "rate limited" })
  }
  const name = String(req.body?.name || "").trim().slice(0, 80)
  const email = String(req.body?.email || "").trim().slice(0, 120)
  const category = String(req.body?.category || "General").trim().slice(0, 60)
  const message = String(req.body?.message || "").trim().slice(0, 4000)
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    return res.status(400).json({ ok: false, error: "name, email and message are required" })
  }
  await query(
    "insert into contacts (name, email, category, message) values ($1, $2, $3, $4)",
    [name, email, category, message]
  )
  const result = await sendMail({
    to: CONTACT_TO,
    subject: `New message — ${category} (from ${name})`,
    text: `${message}\n\n— ${name} (${email})`,
    html: emailShell({
      eyebrow: `Contact form · ${category}`,
      title: `New message from ${name}`,
      intro: `Someone reached out through the contact form on your website.`,
      body: `${quoteBlock(esc(message).replace(/\n/g, "<br/>"))}${detailRows([
        ["Name", esc(name)],
        ["Email", `<a href="mailto:${esc(email)}" style="color:#09090b;">${esc(email)}</a>`],
        ["Category", esc(category)],
      ])}`,
      cta: { label: `Reply to ${name}`, href: `mailto:${email}` },
    }),
  })
  res.json({ ok: true, mailed: result.ok })
}))

// ---------- subscribe ----------
app.post("/api/subscribe", asyncWrap(async (req, res) => {
  const ip = clientIp(req)
  if (!rateLimit(`subscribe:${ip}`, 5, 10 * 60 * 1000)) {
    return res.status(429).json({ ok: false, error: "rate limited" })
  }
  const name = String(req.body?.name || "").trim().slice(0, 80)
  const email = String(req.body?.email || "").trim().slice(0, 120)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "a valid email is required" })
  }
  await query(
    "insert into subscribers (email, name, source) values ($1, $2, 'website') on conflict (email) do update set name = excluded.name",
    [email, name || null]
  )
  const who = name ? `${name} (${email})` : email
  const notify = await sendMail({
    to: CONTACT_TO,
    subject: `New subscriber — ${who}`,
    text: `${who} just subscribed to the newsletter.\n\nEmail: ${email}${name ? `\nName: ${name}` : ""}`,
    html: emailShell({
      eyebrow: "Newsletter · New subscriber",
      title: `${who} just subscribed`,
      intro: `Someone joined your newsletter list from the website.`,
      body: detailRows([
        ["Email", `<a href="mailto:${esc(email)}" style="color:#09090b;">${esc(email)}</a>`],
        ["Name", name ? esc(name) : "—"],
      ]),
      cta: { label: "Say hello", href: `mailto:${email}` },
    }),
  })
  const welcome = await sendMail({
    to: email,
    subject: "You're on the list — Theo Desmond",
    text: `${name ? `Hi ${name},\n\n` : "Hi,\n\n"}Thanks for subscribing — you'll hear from me when there's something worth sharing.\n\n— Theo Desmond\n${SITE_URL}`,
    html: emailShell({
      eyebrow: "Newsletter",
      title: "You're on the list.",
      intro: name ? `Hi ${esc(name)} — thanks for subscribing.` : `Thanks for subscribing.`,
      body: `<p style="margin:0;">You'll get occasional notes on building products, digital business, AI systems and technology ventures — no spam, unsubscribe anytime.</p>`,
      cta: { label: "Explore the site", href: SITE_URL },
      footerNote: `You received this because you subscribed at ${SITE_URL}.`,
    }),
  })
  res.json({ ok: true, mailed: notify.ok, welcome: welcome.ok })
}))

// ---------- visit tracking ----------
app.post("/api/track", asyncWrap(async (req, res) => {
  const ip = clientIp(req)
  const path = String(req.body?.path || "/").slice(0, 500)
  const referrer = String(req.body?.referrer || "").slice(0, 1000)
  const screen = String(req.body?.screen || "").slice(0, 60)
  const language = String(req.body?.language || "").slice(0, 20)
  const ua = String(req.headers["user-agent"] || req.body?.user_agent || "").slice(0, 1000)
  const { device, os, browser } = parseDevice(ua)
  const geo = await geoLookup(ip)

  await query(
    `insert into visits (path, referrer, ip, city, region, country, country_code, org, lat, lon, timezone, user_agent, device, os, browser, screen, language)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [path, referrer || null, ip, geo.city || null, geo.region || null, geo.country || null,
     geo.country_code || null, geo.org || null, geo.lat ?? null, geo.lon ?? null, geo.timezone || null,
     ua || null, device, os, browser, screen || null, language || null]
  )

  let emailed = false
  const since = new Date(Date.now() - ALERT_WINDOW_MS).toISOString()
  const { rows } = await query(
    "select created_at from visits where ip = $1 and created_at >= $2 order by created_at desc limit 2",
    [ip, since]
  )
  if (rows.length <= 1 && mailConfigured()) {
    const where = [geo.city, geo.region, geo.country].filter(Boolean).join(", ") || "Unknown location"
    await sendMail({
      to: VISIT_TO,
      subject: `Visitor on theodesmond.com — ${where} · ${device} · ${path}`,
      text: [`New visitor`, ``, `Page: ${path}`, `IP: ${ip}`, `Location: ${where}`,
        `Device: ${device} · ${os} · ${browser}`, `Referrer: ${referrer || "direct"}`].join("\n"),
      html: emailShell({
        eyebrow: "Visitor alert",
        title: "Someone is on your website",
        intro: `${esc(where)} · ${esc(device)} · ${esc(path)}`,
        body: detailRows([
          ["Page", esc(path)],
          ["IP", esc(ip)],
          ["Location", `${esc(where)}${geo.country_code ? ` (${esc(geo.country_code)})` : ""}`],
          ["Org / ISP", esc(geo.org || "unknown")],
          ["Device", `${esc(device)} · ${esc(os)} · ${esc(browser)}`],
          ["Screen", `${esc(screen || "unknown")} · ${esc(language || "unknown")}`],
          ["Referrer", esc(referrer || "direct")],
        ]),
      }),
    })
    emailed = true
  }
  res.json({ ok: true, emailed })
}))

// ---------- post views (unique per IP) ----------
app.get("/api/views/:slug", asyncWrap(async (req, res) => {
  const { rows } = await query("select count(*)::int as n from post_views where post_slug = $1", [req.params.slug])
  res.json({ count: rows[0].n })
}))

app.post("/api/views/:slug", asyncWrap(async (req, res) => {
  const hash = ipHash(clientIp(req))
  await query(
    "insert into post_views (post_slug, ip_hash) values ($1, $2) on conflict do nothing",
    [req.params.slug, hash]
  )
  const { rows } = await query("select count(*)::int as n from post_views where post_slug = $1", [req.params.slug])
  res.json({ count: rows[0].n })
}))

// ---------- comments ----------
app.get("/api/comments", asyncWrap(async (req, res) => {
  const slug = String(req.query.post_slug || "")
  if (!slug) return res.status(400).json({ error: "post_slug is required" })
  const [c, r] = await Promise.all([
    query("select * from comments where post_slug = $1 order by created_at asc", [slug]),
    query("select * from comment_reactions where post_slug = $1", [slug]),
  ])
  res.json({ comments: c.rows, reactions: r.rows })
}))

app.post("/api/comments", asyncWrap(async (req, res) => {
  const ip = clientIp(req)
  if (!rateLimit(`comment:${ip}`, 10, 10 * 60 * 1000)) {
    return res.status(429).json({ error: "rate limited" })
  }
  const slug = String(req.body?.post_slug || "")
  const parent_id = req.body?.parent_id || null
  const author = String(req.body?.author || "").trim().slice(0, 80)
  const email = String(req.body?.email || "").trim().slice(0, 120) || null
  const text = String(req.body?.text || "").trim().slice(0, 4000)
  if (!slug || !author || !text) return res.status(400).json({ error: "post_slug, author and text are required" })
  const { rows } = await query(
    "insert into comments (post_slug, parent_id, author, email, text) values ($1,$2,$3,$4,$5) returning *",
    [slug, parent_id, author, email, text]
  )
  res.json(rows[0])
}))

app.post("/api/comments/notify", asyncWrap(async (req, res) => {
  const ip = clientIp(req)
  if (!rateLimit(`notify:${ip}`, 10, 10 * 60 * 1000)) {
    return res.status(429).json({ ok: false, error: "rate limited" })
  }
  const to = String(req.body?.to || "")
  const reply_author = String(req.body?.reply_author || "Someone").slice(0, 80)
  const reply_text = String(req.body?.reply_text || "").slice(0, 400)
  const post_slug = String(req.body?.post_slug || "blog post").slice(0, 120)
  if (!to) return res.status(400).json({ ok: false, error: "to is required" })
  const result = await sendMail({
    to,
    subject: `${reply_author} replied to your comment`,
    text: ["Hi there,", "", `${reply_author} replied to your comment on "${post_slug}":`, "", `\u201c${reply_text}\u201d`, "", `View the discussion: ${SITE_URL}/blog/${post_slug}#comments`].join("\n"),
    html: emailShell({
      eyebrow: "Blog · New reply",
      title: `${reply_author} replied to you`,
      intro: `Someone replied to your comment on “${esc(post_slug)}”.`,
      body: quoteBlock(esc(reply_text)),
      cta: { label: "View the discussion", href: `${SITE_URL}/blog/${post_slug}#comments` },
      footerNote: `You received this because you commented on ${SITE_URL}.`,
    }),
  })
  res.json({ ok: result.ok })
}))

// ---------- reactions ----------
app.get("/api/reactions", asyncWrap(async (req, res) => {
  const slug = String(req.query.post_slug || "")
  if (!slug) return res.status(400).json({ error: "post_slug is required" })
  const [p, c] = await Promise.all([
    query("select * from post_reactions where post_slug = $1", [slug]),
    query("select * from comment_reactions where post_slug = $1", [slug]),
  ])
  res.json({ post: p.rows, comments: c.rows })
}))

app.post("/api/reactions/toggle", asyncWrap(async (req, res) => {
  const { scope, post_slug, comment_id, emoji, user_key } = req.body || {}
  if (!post_slug || !emoji || !user_key) {
    return res.status(400).json({ error: "post_slug, emoji and user_key are required" })
  }
  if (scope === "comment") {
    if (!comment_id) return res.status(400).json({ error: "comment_id is required" })
    const { rows } = await query(
      "select id from comment_reactions where comment_id = $1 and emoji = $2 and user_key = $3",
      [comment_id, emoji, user_key]
    )
    if (rows[0]) {
      await query("delete from comment_reactions where id = $1", [rows[0].id])
    } else {
      await query("delete from comment_reactions where comment_id = $1 and user_key = $2", [comment_id, user_key])
      await query(
        "insert into comment_reactions (post_slug, comment_id, emoji, user_key) values ($1,$2,$3,$4)",
        [post_slug, comment_id, emoji, user_key]
      )
    }
  } else {
    const { rows } = await query(
      "select id from post_reactions where post_slug = $1 and emoji = $2 and user_key = $3",
      [post_slug, emoji, user_key]
    )
    if (rows[0]) {
      await query("delete from post_reactions where id = $1", [rows[0].id])
    } else {
      await query("delete from post_reactions where post_slug = $1 and user_key = $2", [post_slug, user_key])
      await query("insert into post_reactions (post_slug, emoji, user_key) values ($1,$2,$3)", [post_slug, emoji, user_key])
    }
  }
  res.json({ ok: true })
}))

// ---------- auth ----------
app.post("/api/auth/login", asyncWrap(async (req, res) => {
  const ip = clientIp(req)
  if (!rateLimit(`login:${ip}`, 10, 10 * 60 * 1000)) {
    return res.status(429).json({ error: "rate limited" })
  }
  const result = await login(req.body?.email, req.body?.password)
  if (!result) return res.status(401).json({ error: "Invalid email or password" })
  res.json(result)
}))

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ email: req.user.email })
})

// ---------- admin ----------
const adminTables = ["contacts", "subscribers", "comments", "visits"]

app.get("/api/admin/stats", requireAuth, asyncWrap(async (req, res) => {
  const tables = ["posts", "products", "contacts", "subscribers", "comments", "visits", "post_views"]
  const out = {}
  for (const t of tables) {
    const { rows } = await query(`select count(*)::int as n from ${t}`)
    out[t] = rows[0].n
  }
  res.json(out)
}))

function adminList(table, order) {
  return asyncWrap(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500)
    const { rows } = await query(`select * from ${table} order by ${order} desc limit $1`, [limit])
    res.json(rows)
  })
}

app.get("/api/admin/posts", requireAuth, asyncWrap(async (req, res) => {
  const { rows } = await query("select * from posts order by sort_order asc")
  res.json(rows.map((r) => ({ ...mapPost(r), sort_order: r.sort_order })))
}))
app.get("/api/admin/products", requireAuth, asyncWrap(async (req, res) => {
  const { rows } = await query("select * from products order by sort_order asc")
  res.json(rows.map((r) => ({ ...mapProduct(r), sort_order: r.sort_order })))
}))
app.get("/api/admin/content", requireAuth, asyncWrap(async (req, res) => {
  const { rows } = await query("select key, value from site_content order by key asc")
  res.json(rows)
}))
for (const t of adminTables) {
  app.get(`/api/admin/${t}`, requireAuth, adminList(t, "created_at"))
  app.delete(`/api/admin/${t}/:id`, requireAuth, asyncWrap(async (req, res) => {
    await query(`delete from ${t} where id = $1`, [req.params.id])
    res.json({ ok: true })
  }))
}

// Clear all visit history at once.
app.delete("/api/admin/visits", requireAuth, asyncWrap(async (req, res) => {
  const { rowCount } = await query("delete from visits")
  res.json({ ok: true, deleted: rowCount })
}))

function postColumns() {
  return "(slug, title, seo_title, topic, date, date_published, date_modified, read_time, excerpt, seo_description, keywords, og_image, status, blocks, sort_order)"
}

app.post("/api/admin/posts", requireAuth, asyncWrap(async (req, res) => {
  const b = req.body || {}
  try {
    await query(
      `insert into posts ${postColumns()} values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [b.slug, b.title, b.seo_title || null, b.topic || "General", b.date, b.date_published || null,
       b.date_modified || null, b.read_time || "5 min read", b.excerpt || null, b.seo_description || null,
       b.keywords || [], b.og_image || null, b.status || "Published", JSON.stringify(b.blocks || []), Number(b.sort_order) || 0]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}))

app.put("/api/admin/posts/:slug", requireAuth, asyncWrap(async (req, res) => {
  const b = req.body || {}
  await query(
    `update posts set title=$1, seo_title=$2, topic=$3, date=$4, date_published=$5, date_modified=$6,
     read_time=$7, excerpt=$8, seo_description=$9, keywords=$10, og_image=$11, status=$12, blocks=$13,
     sort_order=$14, updated_at=now() where slug=$15`,
    [b.title, b.seo_title || null, b.topic, b.date, b.date_published || null, b.date_modified || null,
     b.read_time, b.excerpt || null, b.seo_description || null, b.keywords || [], b.og_image || null,
     b.status, JSON.stringify(b.blocks || []), Number(b.sort_order) || 0, req.params.slug]
  )
  res.json({ ok: true })
}))

app.delete("/api/admin/posts/:slug", requireAuth, asyncWrap(async (req, res) => {
  await query("delete from posts where slug = $1", [req.params.slug])
  res.json({ ok: true })
}))

app.post("/api/admin/products", requireAuth, asyncWrap(async (req, res) => {
  const b = req.body || {}
  try {
    await query(
      `insert into products (slug, idx, name, tagline, category, industry, tags, status, accent, visual, image, link, details, seo_desc, overview, features, functions, architecture, framework, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [b.slug, b.idx || "", b.name, b.tagline || "", b.category || "", b.industry || "", b.tags || [],
       b.status || "BUILDING", b.accent || "indigo", b.visual || "", b.image || "", b.link || "",
       b.details || "", b.seo_desc || "", b.overview || "", b.features || [], b.functions || [],
       b.architecture || "", b.framework || [], Number(b.sort_order) || 0]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}))

app.put("/api/admin/products/:slug", requireAuth, asyncWrap(async (req, res) => {
  const b = req.body || {}
  await query(
    `update products set idx=$1, name=$2, tagline=$3, category=$4, industry=$5, tags=$6, status=$7, accent=$8,
     visual=$9, image=$10, link=$11, details=$12, seo_desc=$13, overview=$14, features=$15, functions=$16,
     architecture=$17, framework=$18, sort_order=$19, updated_at=now() where slug=$20`,
    [b.idx || "", b.name, b.tagline || "", b.category || "", b.industry || "", b.tags || [],
     b.status, b.accent, b.visual || "", b.image || "", b.link || "", b.details || "", b.seo_desc || "",
     b.overview || "", b.features || [], b.functions || [], b.architecture || "", b.framework || [],
     Number(b.sort_order) || 0, req.params.slug]
  )
  res.json({ ok: true })
}))

app.delete("/api/admin/products/:slug", requireAuth, asyncWrap(async (req, res) => {
  await query("delete from products where slug = $1", [req.params.slug])
  res.json({ ok: true })
}))

app.put("/api/admin/content/:key", requireAuth, asyncWrap(async (req, res) => {
  await query(
    "insert into site_content (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value, updated_at = now()",
    [req.params.key, JSON.stringify(req.body?.value ?? {})]
  )
  res.json({ ok: true })
}))

// ---------- web push (desktop alerts) ----------
app.get("/api/push/key", (req, res) => {
  const key = vapidPublicKey()
  if (!key) return res.status(503).json({ error: "push not configured" })
  res.json({ key })
})

// Public: visitor subscribes to push notifications for their chat
app.post("/api/push/subscribe", asyncWrap(async (req, res) => {
  const { endpoint, p256dh, auth: authKey, visitor_key } = req.body || {}
  if (!endpoint || !p256dh || !authKey || !visitor_key) {
    return res.status(400).json({ error: "endpoint, p256dh, auth and visitor_key are required" })
  }
  await query(
    `insert into push_subscriptions (endpoint, p256dh, auth, visitor_key, label)
     values ($1, $2, $3, $4, 'visitor-chat')
     on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, visitor_key = excluded.visitor_key`,
    [String(endpoint).slice(0, 2000), String(p256dh).slice(0, 500), String(authKey).slice(0, 500), String(visitor_key).slice(0, 60)]
  )
  res.json({ ok: true })
}))

// Public: visitor unsubscribes from push notifications
app.delete("/api/push/subscribe", asyncWrap(async (req, res) => {
  const { endpoint, visitor_key } = req.body || {}
  if (!endpoint || !visitor_key) {
    return res.status(400).json({ error: "endpoint and visitor_key are required" })
  }
  await query("delete from push_subscriptions where endpoint = $1 and visitor_key = $2", [String(endpoint).slice(0, 2000), String(visitor_key).slice(0, 60)])
  res.json({ ok: true })
}))

app.get("/api/admin/subscriptions", requireAuth, asyncWrap(async (req, res) => {
  const { rows } = await query(
    "select id, label, created_at from push_subscriptions order by created_at desc"
  )
  res.json(rows)
}))

app.post("/api/admin/subscriptions", requireAuth, asyncWrap(async (req, res) => {
  const { endpoint, p256dh, auth: authKey, label } = req.body || {}
  if (!endpoint || !p256dh || !authKey) {
    return res.status(400).json({ error: "endpoint, p256dh and auth are required" })
  }
  await query(
    `insert into push_subscriptions (endpoint, p256dh, auth, label)
     values ($1, $2, $3, $4)
     on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, label = excluded.label`,
    [String(endpoint).slice(0, 2000), String(p256dh).slice(0, 500), String(authKey).slice(0, 500), String(label || "").slice(0, 120)]
  )
  res.json({ ok: true })
}))

app.delete("/api/admin/subscriptions/:id", requireAuth, asyncWrap(async (req, res) => {
  await query("delete from push_subscriptions where id = $1", [req.params.id])
  res.json({ ok: true })
}))

app.post("/api/admin/push/test", requireAuth, asyncWrap(async (req, res) => {
  const result = await pushToAll({
    title: "Test alert — theodesmond.com",
    body: "Desktop notifications are working. You'll get one per new visitor.",
    url: "/admin",
    tag: "push-test",
  })
  res.json(result)
}))

// ---------- uploads ----------
const UPLOAD_EXTS = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif", ".ico"])
const UPLOAD_MAX_BYTES = 2 * 1024 * 1024
const CHAT_UPLOAD_EXTS = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif", ".pdf", ".txt"])
const CHAT_UPLOAD_MAX_BYTES = 5 * 1024 * 1024

function saveUpload(filename, dataUrl, exts, maxBytes) {
  const ext = extname(String(filename || "")).toLowerCase()
  if (!exts.has(ext) || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return { error: "File type not allowed" }
  }
  const base64 = dataUrl.split(",", 2)[1] || ""
  const buf = Buffer.from(base64, "base64")
  if (!buf.length || buf.length > maxBytes) {
    return { error: "File must be under 5MB" }
  }
  const safe = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`
  writeFileSync(join(UPLOADS, safe), buf)
  return { url: `/uploads/${safe}` }
}

app.post("/api/admin/upload", requireAuth, asyncWrap(async (req, res) => {
  const isChat = req.body?.kind === "chat"
  const saved = saveUpload(
    req.body?.filename,
    req.body?.dataUrl,
    isChat ? CHAT_UPLOAD_EXTS : UPLOAD_EXTS,
    isChat ? CHAT_UPLOAD_MAX_BYTES : UPLOAD_MAX_BYTES
  )
  if (saved.error) {
    return res.status(400).json({
      error: isChat ? "Images, PDF or TXT only (≤5MB)" : "Only PNG, JPG, SVG, WebP, GIF or ICO images allowed (≤2MB)",
    })
  }
  res.json({ ok: true, url: saved.url })
}))

// ---------- public live chat ----------
app.post("/api/chat/start", asyncWrap(async (req, res) => {
  const ip = clientIp(req)
  if (!rateLimit(`chat-start:${ip}`, 10, 10 * 60 * 1000)) {
    return res.status(429).json({ error: "rate limited" })
  }
  const name = String(req.body?.name || "").trim().slice(0, 80)
  const email = String(req.body?.email || "").trim().slice(0, 120)
  const visitor_key = String(req.body?.visitor_key || "").slice(0, 60)
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "name and a valid email are required" })
  }
  // Reuse the visitor's open conversation across reloads.
  if (visitor_key) {
    const { rows } = await query(
      "select * from conversations where visitor_key = $1 and status = 'open' order by updated_at desc limit 1",
      [visitor_key]
    )
    if (rows[0]) {
      await query("update conversations set visitor_name = $1, visitor_email = $2, updated_at = now() where id = $3", [name, email, rows[0].id])
      return res.json({ ...rows[0], visitor_name: name, visitor_email: email })
    }
  }
  const { rows } = await query(
    "insert into conversations (visitor_name, visitor_email, visitor_key) values ($1, $2, $3) returning *",
    [name, email, visitor_key || null]
  )
  const conv = rows[0]
  adminNotify({ t: "chat-new", conversation: { id: conv.id, visitor_name: name, visitor_email: email, status: conv.status, unread_admin: 0, updated_at: conv.updated_at } })
  res.json(conv)
}))

app.get("/api/chat/:id", asyncWrap(async (req, res) => {
  const { rows } = await query(
    "select id, status, updated_at from conversations where id = $1",
    [req.params.id]
  )
  if (!rows[0]) return res.status(404).json({ error: "conversation not found" })
  res.json(rows[0])
}))

app.get("/api/chat/:id/messages", asyncWrap(async (req, res) => {  const { rows } = await query(
    "select * from chat_messages where conversation_id = $1 order by created_at asc limit 200",
    [req.params.id]
  )
  res.json(rows)
}))

app.post("/api/chat/:id/messages", asyncWrap(async (req, res) => {
  const ip = clientIp(req)
  if (!rateLimit(`chat-msg:${ip}`, 20, 10 * 60 * 1000)) {
    return res.status(429).json({ error: "rate limited" })
  }
  const { rows: convs } = await query("select * from conversations where id = $1", [req.params.id])
  const conv = convs[0]
  if (!conv) return res.status(404).json({ error: "conversation not found" })
  if (conv.status !== "open") return res.status(400).json({ error: "conversation is closed" })
  const name = String(req.body?.name || conv.visitor_name).trim().slice(0, 80)
  const text = String(req.body?.text || "").trim().slice(0, 4000)
  const attachment_url = String(req.body?.attachment_url || "").slice(0, 500) || null
  if (!text && !attachment_url) return res.status(400).json({ error: "message is empty" })
  const { rows } = await query(
    "insert into chat_messages (conversation_id, sender, name, text, attachment_url, status) values ($1, 'visitor', $2, $3, $4, $5) returning *",
    [req.params.id, name, text, attachment_url, adminsOnline() > 0 ? "delivered" : "sent"]
  )
  await query("update conversations set unread_admin = unread_admin + 1, updated_at = now() where id = $1", [req.params.id])
  const msg = rows[0]
  roomBroadcast(req.params.id, msg)
  adminNotify({ t: "chat", conversation_id: req.params.id, message: msg })
  pushToAll({
    title: `New chat from ${name || "a visitor"}`,
    body: text ? text.slice(0, 120) : "Sent an attachment",
    url: "/admin",
    tag: `chat-${req.params.id}`,
  }).catch(() => {})
  res.json(msg)
}))

app.post("/api/chat/upload", asyncWrap(async (req, res) => {
  const ip = clientIp(req)
  if (!rateLimit(`chat-upload:${ip}`, 10, 10 * 60 * 1000)) {
    return res.status(429).json({ error: "rate limited" })
  }
  const saved = saveUpload(req.body?.filename, req.body?.dataUrl, CHAT_UPLOAD_EXTS, CHAT_UPLOAD_MAX_BYTES)
  if (saved.error) return res.status(400).json({ error: "Images, PDF or TXT only (≤5MB)" })
  res.json({ ok: true, url: saved.url })
}))

// ---------- admin chat ----------
app.get("/api/admin/conversations", requireAuth, asyncWrap(async (req, res) => {
  const { rows } = await query(
    `select c.*, (select row_to_json(m) from chat_messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_message
     from conversations c order by c.updated_at desc limit 100`
  )
  res.json(rows)
}))

app.get("/api/admin/conversations/:id/messages", requireAuth, asyncWrap(async (req, res) => {
  const { rows } = await query(
    "select * from chat_messages where conversation_id = $1 order by created_at asc limit 200",
    [req.params.id]
  )
  await query("update conversations set unread_admin = 0 where id = $1", [req.params.id])
  res.json(rows)
}))

app.post("/api/admin/conversations/:id/reply", requireAuth, asyncWrap(async (req, res) => {
  const text = String(req.body?.text || "").trim().slice(0, 4000)
  const attachment_url = String(req.body?.attachment_url || "").slice(0, 500) || null
  if (!text && !attachment_url) return res.status(400).json({ error: "message is empty" })
  const { rows: convs } = await query("select * from conversations where id = $1", [req.params.id])
  if (!convs[0]) return res.status(404).json({ error: "conversation not found" })
  const { rows } = await query(
    "insert into chat_messages (conversation_id, sender, name, text, attachment_url, status) values ($1, 'admin', 'Theo', $2, $3, $4) returning *",
    [req.params.id, text, attachment_url, roomSize(req.params.id) > 0 ? "delivered" : "sent"]
  )
  await query("update conversations set status = 'open', unread_admin = 0, updated_at = now() where id = $1", [req.params.id])
  const msg = rows[0]
  roomBroadcast(req.params.id, msg)
  res.json(msg)
}))

app.post("/api/admin/conversations/:id/status", requireAuth, asyncWrap(async (req, res) => {
  const status = req.body?.status === "closed" ? "closed" : "open"
  await query("update conversations set status = $1, updated_at = now() where id = $2", [status, req.params.id])
  res.json({ ok: true })
}))

// ---------- read receipts ----------
// Marks the other party's messages as read and pushes live tick updates.
async function markRead(convId, sender) {
  const { rows } = await query(
    "update chat_messages set status = 'read' where conversation_id = $1 and sender = $2 and status <> 'read' returning id",
    [convId, sender]
  )
  const ids = rows.map((r) => r.id)
  if (ids.length) {
    const frame = { t: "chat-status", conversation_id: convId, ids, status: "read" }
    roomSend(convId, frame)
    adminNotify(frame)
  }
  return ids
}

app.post("/api/chat/:id/read", asyncWrap(async (req, res) => {
  const ids = await markRead(req.params.id, "admin")
  res.json({ ok: true, ids })
}))

app.post("/api/admin/conversations/:id/read", requireAuth, asyncWrap(async (req, res) => {
  const ids = await markRead(req.params.id, "visitor")
  res.json({ ok: true, ids })
}))

app.post(
  "/api/admin/visitors/:ip/message",
  requireAuth,
  asyncWrap(async (req, res) => {
    const ip = clientIp(req)
    if (!rateLimit(`admin-msg:${ip}`, 30, 60 * 1000)) {
      return res.status(429).json({ error: "rate limited" })
    }
    const text = String(req.body?.text || "").trim().slice(0, 4000)
    if (!text) return res.status(400).json({ error: "message is empty" })
    const result = await sendVisitorMessage(String(req.params.ip || "").slice(0, 60), text)
    if (result.error) return res.status(404).json({ error: "visitor is no longer online" })
    res.json(result)
  })
)

// ---------- Aurex API ----------
// Aurex operates directly on this codebase (the live site directory).
// Staff-only. No projects: one workspace = the repo root.
const SITE_ROOT = join(here, "..")
const SITE_GUARD = new Set([".env"])

function sitePath(rel) {
  const cleaned = String(rel || "").replace(/^\/+/, "")
  if (!cleaned) return SITE_ROOT
  const full = resolve(SITE_ROOT, cleaned)
  if (full !== SITE_ROOT && !full.startsWith(SITE_ROOT + sep)) return null
  const first = cleaned.split("/")[0]
  if (SITE_GUARD.has(first)) return null
  return full
}

app.get("/api/aurex/files", requireAuth, asyncWrap(async (req, res) => {
  const full = sitePath(req.query.path || "")
  if (!full) return res.status(400).json({ error: "invalid path" })
  let entries
  try {
    entries = readdirSync(full, { withFileTypes: true })
  } catch {
    return res.status(404).json({ error: "not found" })
  }
  res.json({
    root: SITE_ROOT,
    files: entries
      .filter((e) => e.name !== ".git")
      .map((e) => ({
        name: e.name,
        type: e.isDirectory() ? "directory" : "file",
        size: e.isFile() ? statSync(join(full, e.name)).size : 0,
      })),
  })
}))

app.get("/api/aurex/files/read", requireAuth, asyncWrap(async (req, res) => {
  const full = sitePath(req.query.path || "")
  if (!full) return res.status(400).json({ error: "invalid path" })
  try {
    const buf = readFileSync(full)
    if (buf.length > 2 * 1024 * 1024) return res.status(400).json({ error: "file too large" })
    res.json({ path: req.query.path, content: buf.toString("utf-8") })
  } catch {
    return res.status(404).json({ error: "cannot read file" })
  }
}))

app.post("/api/aurex/files/write", requireAuth, asyncWrap(async (req, res) => {
  const rel = String(req.body?.path || "")
  const full = sitePath(rel)
  if (!full || !rel || rel === "node_modules" || rel.startsWith("node_modules/")) {
    return res.status(400).json({ error: "invalid path" })
  }
  const content = String(req.body?.content ?? "")
  if (Buffer.byteLength(content, "utf-8") > 2 * 1024 * 1024) {
    return res.status(400).json({ error: "file too large" })
  }
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content, "utf-8")
  res.json({ ok: true })
}))

app.post("/api/aurex/files/mkdir", requireAuth, asyncWrap(async (req, res) => {
  const full = sitePath(req.body?.path || "")
  if (!full) return res.status(400).json({ error: "invalid path" })
  mkdirSync(full, { recursive: true })
  res.json({ ok: true })
}))

app.post("/api/aurex/files/delete", requireAuth, asyncWrap(async (req, res) => {
  const full = sitePath(req.body?.path || "")
  if (!full || full === SITE_ROOT) return res.status(400).json({ error: "invalid path" })
  rmSync(full, { recursive: true, force: true })
  res.json({ ok: true })
}))

app.post("/api/aurex/terminal", requireAuth, asyncWrap(async (req, res) => {
  const command = String(req.body?.command || "").slice(0, 2000)
  if (!command.trim()) return res.status(400).json({ error: "command is required" })
  try {
    const stdout = execSync(command, { cwd: SITE_ROOT, timeout: 60000, encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, shell: "/bin/sh" })
    res.json({ stdout: String(stdout), stderr: "", exitCode: 0 })
  } catch (err) {
    res.json({
      stdout: String(err.stdout || ""),
      stderr: String(err.stderr || err.message || "failed"),
      exitCode: typeof err.status === "number" ? err.status : 1,
    })
  }
}))

app.get("/api/aurex/search", requireAuth, asyncWrap(async (req, res) => {
  const q = String(req.query.q || "").slice(0, 200)
  if (!q) return res.status(400).json({ error: "query parameter 'q' is required" })
  try {
    const out = execSync(`grep -r -n -I --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist -e ${JSON.stringify(q)} .`, {
      cwd: SITE_ROOT, timeout: 30000, encoding: "utf-8", maxBuffer: 1024 * 1024, shell: "/bin/sh",
    })
    const results = []
    for (const line of String(out).split("\n").slice(0, 100)) {
      const m = line.match(/^\.\/([^:]+):(\d+):(.*)$/)
      if (m) results.push({ file: m[1], line: Number(m[2]), content: m[3].slice(0, 300) })
    }
    res.json(results)
  } catch {
    res.json([])
  }
}))

app.get("/api/aurex/git/status", requireAuth, asyncWrap(async (req, res) => {
  try {
    const out = execSync("git status --short && git rev-parse --abbrev-ref HEAD", { cwd: SITE_ROOT, timeout: 15000, encoding: "utf-8", shell: "/bin/sh" })
    res.json({ stdout: String(out) })
  } catch (err) {
    res.json({ stdout: "", error: String(err.message || err).slice(0, 500) })
  }
}))

app.get("/api/aurex/git/diff", requireAuth, asyncWrap(async (req, res) => {
  const flag = req.query.cached === "true" ? "--cached" : ""
  try {
    const out = execSync(`git diff ${flag}`, { cwd: SITE_ROOT, timeout: 15000, encoding: "utf-8", maxBuffer: 1024 * 1024, shell: "/bin/sh" })
    res.json({ stdout: String(out) })
  } catch (err) {
    res.json({ stdout: "", error: String(err.message || err).slice(0, 500) })
  }
}))

app.post("/api/aurex/git/commit", requireAuth, asyncWrap(async (req, res) => {
  const message = String(req.body?.message || "").slice(0, 500).replace(/"/g, "")
  if (!message) return res.status(400).json({ error: "message is required" })
  try {
    execSync(`git add -A && git commit -m "${message}"`, { cwd: SITE_ROOT, timeout: 30000, encoding: "utf-8", shell: "/bin/sh" })
    const hash = execSync("git rev-parse HEAD", { cwd: SITE_ROOT, timeout: 15000, encoding: "utf-8", shell: "/bin/sh" })
    res.json({ success: true, hash: String(hash).trim() })
  } catch (err) {
    res.json({ success: false, error: String(err.stderr || err.message || err).slice(0, 500) })
  }
}))

app.post("/api/aurex/chat", requireAuth, asyncWrap(async (req, res) => {
  const message = String(req.body?.message || "").slice(0, 20000)
  if (message.trim().length < 3) return res.status(400).json({ error: "message is required" })
  // Working agreement: clean architecture first, ask when ambiguous.
  const task = [
    message,
    "",
    "Working agreement: keep the architecture clean (small focused changes, existing conventions, no dead code). If any choice is ambiguous or destructive, ask me a clarifying question before acting.",
  ].join("\n")
  try {
    const { getProjectId, aurexJson } = await import("./aurex-remote.js")
    const run = await aurexJson("/api/runs", {
      method: "POST",
      body: { projectId: await getProjectId(), task },
    })
    res.status(201).json({ runId: run.id, status: run.status })
  } catch (err) {
    res.status(err.status === 429 ? 429 : 502).json({ error: `Aurex backend: ${err.message}` })
  }
}))

app.get("/api/aurex/runs/:id", requireAuth, asyncWrap(async (req, res) => {
  try {
    const { aurexJson } = await import("./aurex-remote.js")
    res.json(await aurexJson(`/api/runs/${encodeURIComponent(req.params.id)}`))
  } catch (err) {
    res.status(err.status || 502).json({ error: `Aurex backend: ${err.message}` })
  }
}))

app.post("/api/aurex/runs/:id/messages", requireAuth, asyncWrap(async (req, res) => {
  const text = String(req.body?.text || "").trim().slice(0, 20000)
  if (!text) return res.status(400).json({ error: "text is required" })
  try {
    const { aurexJson } = await import("./aurex-remote.js")
    res.status(202).json(await aurexJson(`/api/runs/${encodeURIComponent(req.params.id)}/messages`, {
      method: "POST",
      body: { text },
    }))
  } catch (err) {
    res.status(err.status || 502).json({ error: `Aurex backend: ${err.message}` })
  }
}))

app.post("/api/aurex/runs/:id/abort", requireAuth, asyncWrap(async (req, res) => {
  try {
    const { aurexJson } = await import("./aurex-remote.js")
    res.json(await aurexJson(`/api/runs/${encodeURIComponent(req.params.id)}/abort`, { method: "POST", body: {} }))
  } catch (err) {
    res.status(err.status || 502).json({ error: `Aurex backend: ${err.message}` })
  }
}))

app.post("/api/aurex/runs/:id/questions", requireAuth, asyncWrap(async (req, res) => {
  const { requestId, answers } = req.body || {}
  if (typeof requestId !== "string" || !Array.isArray(answers)) {
    return res.status(400).json({ error: "requestId and answers (array of string arrays) are required" })
  }
  try {
    const { aurexJson } = await import("./aurex-remote.js")
    res.status(202).json(await aurexJson(`/api/runs/${encodeURIComponent(req.params.id)}/questions`, {
      method: "POST",
      body: { requestId, answers },
    }))
  } catch (err) {
    res.status(err.status || 502).json({ error: `Aurex backend: ${err.message}` })
  }
}))

// ---------- Aurex deploy: rebuild the site in place, then notify ----------
// Rebuilds dist/ inside the running container (devDeps install + vite build),
// so the new bundle goes live immediately. Staff-only.
let deployRunning = false

app.post("/api/aurex/deploy", requireAuth, asyncWrap(async (req, res) => {
  if (deployRunning) return res.status(409).json({ error: "a deploy is already running" })
  deployRunning = true
  const started = Date.now()
  const run = (cmd, args, timeoutMs) =>
    new Promise((resolve) => {
      const child = spawn(cmd, args, { cwd: SITE_ROOT, timeout: timeoutMs, shell: false })
      let out = ""
      const push = (d) => {
        out += String(d)
        if (out.length > 20000) out = out.slice(-20000)
      }
      child.stdout?.on("data", push)
      child.stderr?.on("data", push)
      child.on("error", (err) => resolve({ code: 1, log: out + `\nspawn error: ${err.message}` }))
      child.on("close", (code) => resolve({ code: code ?? 1, log: out }))
    })

  const { pushToAll } = await import("./push.js")
  const finish = async (ok, log) => {
    deployRunning = false
    const secs = Math.round((Date.now() - started) / 1000)
    const title = ok ? "Site built and deployed live" : "Site deploy failed"
    const body = ok
      ? `theodesmond.com rebuilt in ${secs}s and is live.`
      : `theodesmond.com build failed after ${secs}s — check the Aurex tab.`
    pushToAll({ title, body, url: "/admin", tag: "deploy" }).catch(() => {})
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      sendMail({
        to: CONTACT_TO,
        subject: `${title} — theodesmond.com`,
        text: `${body}\n\n${log.slice(-2000)}`,
        html: emailShell({
          eyebrow: "Deploy",
          title,
          intro: body,
          body: `<pre style="font-size:11px;white-space:pre-wrap;">${esc(log.slice(-2000))}</pre>`,
        }),
      }).catch(() => {})
    }
    res.json({ ok, log: log.slice(-4000), seconds: secs })
  }

  try {
    const install = await run("npm", ["install", "--include=dev", "--no-audit", "--no-fund"], 8 * 60 * 1000)
    if (install.code !== 0) {
      await finish(false, `INSTALL FAILED\n${install.log}`)
      return
    }
    const build = await run("npm", ["run", "build"], 8 * 60 * 1000)
    if (build.code !== 0) {
      await finish(false, `BUILD FAILED\n${build.log}`)
      return
    }
    await finish(true, build.log)
  } catch (err) {
    await finish(false, `DEPLOY ERROR\n${String(err && err.message ? err.message : err)}`)
  }
}))

// SSE passthrough: live run events from the Aurex backend to the admin UI.
// EventSource can't send headers, so a staff token query param is accepted.
app.get("/api/aurex/runs/:id/events", asyncWrap(async (req, res) => {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : String(req.query.token || "")
  try {
    jwt.verify(token, process.env.JWT_SECRET || "change-me-in-production")
  } catch {
    return res.status(401).json({ error: "unauthorized" })
  }
  const { aurexFetch } = await import("./aurex-remote.js")
  let upstream
  try {
    upstream = await aurexFetch(`/api/runs/${encodeURIComponent(req.params.id)}/events`)
  } catch (err) {
    return res.status(err.status || 502).json({ error: `Aurex backend: ${err.message}` })
  }
  if (!upstream.ok || !upstream.body) {
    return res.status(502).json({ error: "Aurex event stream unavailable" })
  }
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders()
  const reader = upstream.body.getReader()
  const pump = async () => {
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (!res.write(value)) await new Promise((r) => res.once("drain", r))
      }
    } catch {
      /* upstream closed */
    }
    try {
      res.end()
    } catch {
      /* ignore */
    }
  }
  req.on("close", () => {
    try {
      reader.cancel()
    } catch {
      /* ignore */
    }
  })
  pump()
}))

// express.static serves prerendered files first (keeps static SEO),
// then the SPA shell handles the rest (incl. /admin).
app.use("/uploads", express.static(UPLOADS, { maxAge: "30d", immutable: false }))
app.use(express.static(DIST, { extensions: ["html"] }))
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next()
  if (req.method !== "GET") return next()
  res.sendFile(join(DIST, "index.html"), (err) => {
    if (err) next()
  })
})

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: "internal error" })
})

async function boot() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required")
    process.exit(1)
  }
  await initDb()
  await seedAdmin()
  const server = app.listen(PORT, () => console.log(`theodesmond.com server on :${PORT}`))
  attachLive(server)
}

boot().catch((err) => {
  console.error(err)
  process.exit(1)
})
