const BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "")

const TOKEN_KEY = "td-admin-token"

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ""
  } catch {
    return ""
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

async function req(method, path, { body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers["Content-Type"] = "application/json"
  const t = token || getToken()
  if (t) headers["Authorization"] = `Bearer ${t}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  get: (path, opts) => req("GET", path, opts),
  post: (path, body, opts) => req("POST", path, { ...opts, body }),
  put: (path, body, opts) => req("PUT", path, { ...opts, body }),
  del: (path, opts) => req("DELETE", path, opts),
}
