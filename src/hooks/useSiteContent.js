import { useEffect, useState } from "react"
import { fetchSiteContent } from "../lib/content"

/** Returns DB-driven site content, or null while loading. Consumers fall back to data.js. */
export function useSiteContent() {
  const [content, setContent] = useState(null)

  useEffect(() => {
    let alive = true
    fetchSiteContent().then((c) => {
      if (alive) setContent(c)
    })
    return () => {
      alive = false
    }
  }, [])

  return content
}
