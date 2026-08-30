import { supabase, isSupabaseConfigured } from "./supabase"
import { posts as localPosts } from "../data"

export function mapRow(r) {
  return {
    slug: r.slug,
    title: r.title,
    topic: r.topic,
    date: r.date,
    readTime: r.read_time,
    status: r.status,
    excerpt: r.excerpt,
    blocks: Array.isArray(r.blocks) ? r.blocks : [],
  }
}

export async function fetchPosts() {
  if (!isSupabaseConfigured) return localPosts

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.warn("Supabase posts fetch failed, falling back to local data:", error.message)
    return localPosts
  }
  if (!data || data.length === 0) return localPosts
  return data.map(mapRow)
}

export async function fetchPost(slug) {
  const local = localPosts.find((p) => p.slug === slug)
  if (!isSupabaseConfigured) return local || null

  const { data, error } = await supabase.from("posts").select("*").eq("slug", slug).maybeSingle()
  if (error || !data) return local || null
  return mapRow(data)
}
