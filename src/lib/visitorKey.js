const VISITOR_KEY = "td-visitor-key"

/** Stable per-browser visitor id, shared by the live chat and presence beacon. */
export function getVisitorKey() {
  try {
    let k = localStorage.getItem(VISITOR_KEY)
    if (!k) {
      k = Math.random().toString(36).slice(2, 14)
      localStorage.setItem(VISITOR_KEY, k)
    }
    return k
  } catch {
    return ""
  }
}