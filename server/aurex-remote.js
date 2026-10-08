import { setTimeout as sleep } from "node:timers/promises"

// Client for the standalone aurex-saas-model backend. The Aurex tab calls
// INTO that system (runs execute there, in host mode, with the site folder
// as their working directory). Auth is a service user session cookie.
const BASE = (process.env.AUREX_API || "http://localhost:4010").replace(/\/$/, "")

let cookie = ""
let loginAt = 0
const COOKIE_TTL_MS = 20 * 60 * 60 * 1000

async function login() {
  const email = process.env.AUREX_SERVICE_EMAIL || ""
  const password = process.env.AUREX_SERVICE_PASS || ""
  if (!email || !password) throw new Error("AUREX_SERVICE_EMAIL/PASS not configured")
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`aurex login failed (${res.status})`)
  const setCookie = res.headers.get("set-cookie") || ""
  const match = setCookie.match(/[^;=\s]+=[^;]*/g) || []
  cookie = match.join("; ")
  loginAt = Date.now()
  if (!cookie) throw new Error("aurex login returned no session")
  return cookie
}

async function session() {
  if (!cookie || Date.now() - loginAt > COOKIE_TTL_MS) await login()
  return cookie
}

export async function aurexFetch(path, { method = "GET", body, retry = true } = {}) {
  const headers = { Cookie: await session() }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  let res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (res.status === 401 && retry) {
    await login()
    return aurexFetch(path, { method, body, retry: false })
  }
  return res
}

export async function aurexJson(path, opts) {
  const res = await aurexFetch(path, opts)
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `aurex request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

export async function getProjectId() {
  if (process.env.AUREX_PROJECT_ID) return process.env.AUREX_PROJECT_ID
  const projects = await aurexJson("/api/projects")
  const found = (Array.isArray(projects) ? projects : []).find((p) => p.name === "theodesmond.com")
  if (!found) throw new Error("theodesmond.com project not found in Aurex")
  return found.id
}

export { sleep }
