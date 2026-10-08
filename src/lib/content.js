import { api } from "./api"
import * as local from "../data"

const CONTENT_KEYS = [
  "nav",
  "roles",
  "identity",
  "tagline",
  "supporting",
  "heroStats",
  "storyParas",
  "storyStages",
  "mandate",
  "beliefs",
  "workStories",
  "beyondSoftware",
  "beyondSoftwareStatement",
  "currentFocus",
  "company",
  "auracle",
  "companies",
  "experiments",
  "pipeline",
  "aiCapabilities",
  "lab",
  "blogTopics",
  "contactCategories",
  "socials",
  "testimonials",
  "heroWords",
  "homeCopy",
  "workCopy",
  "pageHeaders",
  "footerCopy",
  "subscribeCopy",
  "contactIntro",
  "blogCopy",
  "labIntro",
  "aiIntro",
  "architectureIntro",
  "branding",
]

function localContent() {
  const out = {}
  for (const k of CONTENT_KEYS) out[k] = local[k]
  return out
}

let contentCache = null

/** DB-first site content. Merges API rows over bundled defaults. */
export async function fetchSiteContent() {
  if (contentCache) return contentCache
  const fallback = localContent()
  try {
    const data = await api.get("/api/content")
    const merged = { ...fallback }
    for (const k of CONTENT_KEYS) {
      if (data[k] !== undefined) merged[k] = data[k]
    }
    contentCache = merged
    return merged
  } catch (err) {
    console.warn("Content API fetch failed, falling back to local data:", err?.message)
    return fallback
  }
}

export function clearContentCache() {
  contentCache = null
}

export function mapProductRow(r) {
  return {
    index: r.idx ?? r.index,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    category: r.category,
    industry: r.industry,
    tags: Array.isArray(r.tags) ? r.tags : [],
    status: r.status,
    accent: r.accent,
    visual: r.visual,
    image: r.image,
    link: r.link,
    details: r.details,
    seoDesc: r.seo_desc ?? r.seoDesc,
    overview: r.overview,
    features: Array.isArray(r.features) ? r.features : [],
    functions: Array.isArray(r.functions) ? r.functions : [],
    architecture: r.architecture,
    framework: Array.isArray(r.framework) ? r.framework : [],
  }
}

let productsCache = null

/** DB-first products, bundled data.js as fallback. */
export async function fetchProducts() {
  if (productsCache) return productsCache
  try {
    const data = await api.get("/api/products")
    if (!Array.isArray(data) || data.length === 0) return local.products
    productsCache = data.map(mapProductRow)
    return productsCache
  } catch (err) {
    console.warn("Products API fetch failed, falling back to local data:", err?.message)
    return local.products
  }
}

export async function fetchProduct(slug) {
  try {
    const data = await api.get(`/api/products/${encodeURIComponent(slug)}`)
    return mapProductRow(data)
  } catch {
    const all = await fetchProducts()
    return all.find((p) => p.slug === slug) || null
  }
}

export function clearProductsCache() {
  productsCache = null
}
