import { useEffect, useMemo } from "react"
import {
  SITE_URL,
  SITE_NAME,
  SITE_DEFAULT_IMAGE,
  canonicalUrl,
} from "../lib/seo"

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement("link")
    el.setAttribute("rel", "canonical")
    document.head.appendChild(el)
  }
  el.setAttribute("href", href)
}

function upsertJsonLd(id, data) {
  const existing = document.getElementById(id)
  if (existing) existing.remove()
  if (!data) return
  const script = document.createElement("script")
  script.type = "application/ld+json"
  script.id = id
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

export default function Seo({
  title,
  description,
  keywords = [],
  path = "/",
  image = SITE_DEFAULT_IMAGE,
  ogType = "website",
  jsonLd = null,
}) {
  const canonical = canonicalUrl(path || "/")
  const ogTitle = title
  const ogDescription = description
  const fullImage = image.startsWith("http") ? image : `${SITE_URL}${image}`
  const keywordsKey = keywords.join("|")
  const jsonLdItems = useMemo(
    () => (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []),
    [jsonLd]
  )

  useEffect(() => {
    document.title = title

    upsertMeta("name", "description", description)
    upsertMeta("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1")
    if (keywordsKey) upsertMeta("name", "keywords", keywordsKey.replace(/\|/g, ", "))
    upsertCanonical(canonical)

    upsertMeta("property", "og:title", ogTitle)
    upsertMeta("property", "og:description", ogDescription)
    upsertMeta("property", "og:url", canonical)
    upsertMeta("property", "og:type", ogType)
    upsertMeta("property", "og:site_name", SITE_NAME)
    upsertMeta("property", "og:image", fullImage)
    upsertMeta("property", "og:locale", "en_US")

    upsertMeta("name", "twitter:card", "summary_large_image")
    upsertMeta("name", "twitter:title", ogTitle)
    upsertMeta("name", "twitter:description", ogDescription)
    upsertMeta("name", "twitter:image", fullImage)

    if (jsonLdItems.length) {
      jsonLdItems.forEach((ld, i) => upsertJsonLd(`jsonld-${i}`, ld))
    } else {
      upsertJsonLd("jsonld-page", null)
    }
  }, [
    title,
    description,
    keywordsKey,
    canonical,
    ogTitle,
    ogDescription,
    fullImage,
    ogType,
    jsonLdItems,
  ])

  return null
}
