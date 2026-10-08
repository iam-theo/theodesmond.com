import { api } from "./api"
import { posts as localPosts } from "../data"

export function mapRow(r) {
  // Server already returns camelCase; tolerate snake_case too.
  return {
    slug: r.slug,
    title: r.title,
    seoTitle: r.seo_title ?? r.seoTitle ?? null,
    topic: r.topic,
    date: r.date,
    datePublished: r.date_published ?? r.datePublished ?? null,
    dateModified: r.date_modified ?? r.dateModified ?? null,
    readTime: r.read_time ?? r.readTime ?? "5 min read",
    status: r.status,
    excerpt: r.excerpt,
    seoDescription: r.seo_description ?? r.seoDescription ?? null,
    keywords: Array.isArray(r.keywords) ? r.keywords : [],
    ogImage: r.og_image ?? r.ogImage ?? null,
    blocks: Array.isArray(r.blocks) ? r.blocks : [],
  }
}

const live = () => localPosts.filter((p) => p.status !== "Draft")

export async function fetchPosts() {
  try {
    const data = await api.get("/api/posts")
    if (!Array.isArray(data) || data.length === 0) return live()
    return data.map(mapRow)
  } catch (err) {
    console.warn("Posts API fetch failed, falling back to local data:", err?.message)
    return live()
  }
}

export async function fetchPost(slug) {
  try {
    const data = await api.get(`/api/posts/${encodeURIComponent(slug)}`)
    return mapRow(data)
  } catch {
    return live().find((p) => p.slug === slug) || null
  }
}
