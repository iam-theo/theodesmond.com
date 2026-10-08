import { createHash } from "node:crypto"

export function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"]
  if (fwd) return String(fwd).split(",")[0].trim()
  return (
    req.headers["x-real-ip"] ||
    req.headers["cf-connecting-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  )
}

export function ipHash(ip) {
  return createHash("sha256").update(`td:${ip}`).digest("hex")
}

export function parseDevice(ua) {
  const u = ua || ""
  let device = "Desktop"
  if (/mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(u)) device = "Mobile"
  else if (/tablet|ipad|android(?!.*mobile)|kindle|silk/i.test(u)) device = "Tablet"
  else if (/bot|crawl|spider|slurp|mediapartners|baidu|yandex|bingpreview/i.test(u)) device = "Bot"

  let os = "Unknown"
  if (/windows nt 10/i.test(u)) os = "Windows 10/11"
  else if (/windows/i.test(u)) os = "Windows"
  else if (/android/i.test(u)) {
    const m = u.match(/android\s([\d.]+)/i)
    os = m ? `Android ${m[1]}` : "Android"
  } else if (/iphone|ipad|ipod/i.test(u)) {
    const m = u.match(/os\s([\d_]+)/i)
    os = m ? `iOS ${m[1].replace(/_/g, ".")}` : "iOS"
  } else if (/mac os x/i.test(u)) {
    const m = u.match(/mac os x\s([\d_]+)/i)
    os = m ? `macOS ${m[1].replace(/_/g, ".")}` : "macOS"
  } else if (/linux/i.test(u)) os = "Linux"

  let browser = "Unknown"
  if (/edg\//i.test(u)) browser = "Edge"
  else if (/opr\/|opera/i.test(u)) browser = "Opera"
  else if (/firefox\/|fxios\//i.test(u)) browser = "Firefox"
  else if (/crios\/|chrome\//i.test(u)) browser = "Chrome"
  else if (/safari\//i.test(u)) browser = "Safari"

  return { device, os, browser }
}

async function fetchJson(url, timeoutMs) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "theodesmond.com-track" },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

/**
 * IP geolocation. Accuracy is inherently approximate: IPs map to the
 * carrier's egress point, not the person's GPS — expect the right city or a
 * nearby one, never a street address. Three providers are chained (best for
 * Nigerian mobile IPs first) so one outage or blind spot doesn't blank it.
 */
export async function geoLookup(ip) {
  if (!ip || ip === "unknown" || ip.startsWith("127.") || ip === "::1" || ip.includes("127.0.0.1")) return {}
  const clean = ip.replace(/^::ffff:/, "")

  // 1) ipinfo — most reliable for these mobile carrier ranges.
  const info = await fetchJson(`https://ipinfo.io/${encodeURIComponent(clean)}/json`, 3500)
  if (info && !info.error && !info.bogon && (info.city || info.country)) {
    const [lat, lon] = String(info.loc || "").split(",").map(Number)
    return {
      city: info.city || "",
      region: info.region || "",
      country: info.country || "",
      country_code: info.country || "",
      org: info.org || "",
      lat: Number.isFinite(lat) ? lat : null,
      lon: Number.isFinite(lon) ? lon : null,
      timezone: info.timezone || "",
    }
  }

  // 2) ip-api.
  const fallback = await fetchJson(
    `http://ip-api.com/json/${encodeURIComponent(clean)}?fields=status,message,country,countryCode,regionName,city,lat,lon,timezone,org`,
    3500
  )
  if (fallback && fallback.status === "success") {
    return {
      city: fallback.city || "",
      region: fallback.regionName || "",
      country: fallback.country || "",
      country_code: fallback.countryCode || "",
      org: fallback.org || "",
      lat: typeof fallback.lat === "number" ? fallback.lat : null,
      lon: typeof fallback.lon === "number" ? fallback.lon : null,
      timezone: fallback.timezone || "",
    }
  }

  // 3) ipapi.co.
  const primary = await fetchJson(`https://ipapi.co/${encodeURIComponent(clean)}/json/`, 3500)
  if (primary && !primary.error && !primary.reserved) {
    return {
      city: primary.city || "",
      region: primary.region || "",
      country: primary.country_name || "",
      country_code: primary.country_code || "",
      org: primary.org || "",
      lat: Number(primary.latitude) || null,
      lon: Number(primary.longitude) || null,
      timezone: primary.timezone || "",
    }
  }
  return {}
}

/** Simple in-memory per-IP rate limiter. Returns true if allowed. */
const hits = new Map()
export function rateLimit(key, max, windowMs) {
  const now = Date.now()
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}
