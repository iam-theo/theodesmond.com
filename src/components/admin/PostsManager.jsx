import { useEffect, useState } from "react"
import { api } from "../../lib/api"
import { clearContentCache } from "../../lib/content"
import BlocksEditor from "./BlocksEditor"
import { inputClass, labelClass } from "./AdminLogin"

const emptyPost = {
  slug: "",
  title: "",
  seoTitle: "",
  topic: "AI Engineering",
  date: "2026",
  datePublished: "",
  dateModified: "",
  readTime: "5 min read",
  status: "Published",
  excerpt: "",
  seoDescription: "",
  keywords: "",
  sort_order: 0,
  blocks: [],
}

function toRow(p, isNew) {
  return {
    ...(isNew ? { slug: p.slug.trim() } : {}),
    title: p.title,
    seo_title: p.seoTitle || null,
    topic: p.topic,
    date: p.date,
    date_published: p.datePublished || null,
    date_modified: p.dateModified || null,
    read_time: p.readTime,
    status: p.status,
    excerpt: p.excerpt,
    seo_description: p.seoDescription || null,
    keywords: p.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    sort_order: Number(p.sort_order) || 0,
    blocks: p.blocks,
  }
}

function fromPost(post) {
  return {
    slug: post.slug,
    title: post.title || "",
    seoTitle: post.seoTitle || "",
    topic: post.topic || "AI Engineering",
    date: post.date || "2026",
    datePublished: post.datePublished || "",
    dateModified: post.dateModified || "",
    readTime: post.readTime || "5 min read",
    status: post.status || "Published",
    excerpt: post.excerpt || "",
    seoDescription: post.seoDescription || "",
    keywords: (post.keywords || []).join(", "),
    sort_order: post.sort_order ?? 0,
    blocks: post.blocks || [],
  }
}

export default function PostsManager() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get("/api/admin/posts")
      setPosts(Array.isArray(data) ? data : [])
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg("")
    try {
      if (isNew) {
        await api.post("/api/admin/posts", toRow(editing, true))
      } else {
        await api.put(`/api/admin/posts/${encodeURIComponent(editing.slug)}`, toRow(editing, false))
      }
      clearContentCache()
      setMsg("Saved.")
      setEditing(null)
      load()
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    }
    setSaving(false)
  }

  const remove = async (slug) => {
    if (!window.confirm(`Delete post "${slug}"? Comments and reactions go with it.`)) return
    try {
      await api.del(`/api/admin/posts/${encodeURIComponent(slug)}`)
      setMsg("Deleted.")
      load()
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    }
  }

  const set = (key) => (e) => setEditing((f) => ({ ...f, [key]: e.target.value }))

  if (editing) {
    return (
      <form onSubmit={save} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white dark:text-zinc-100">
            {isNew ? "New post" : `Edit — ${editing.slug}`}
          </h3>
          <button type="button" onClick={() => setEditing(null)} className="font-mono text-xs text-zinc-500 hover:text-white dark:hover:text-zinc-100">← Back</button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {isNew && (
            <div className="sm:col-span-2">
              <label className={labelClass}>Slug (url, unique)</label>
              <input value={editing.slug} onChange={set("slug")} required pattern="[a-z0-9-]+" placeholder="my-new-essay" className={inputClass} />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className={labelClass}>Title</label>
            <input value={editing.title} onChange={set("title")} required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>SEO title (≤58 chars)</label>
            <input value={editing.seoTitle} onChange={set("seoTitle")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Topic</label>
            <input value={editing.topic} onChange={set("topic")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={editing.status} onChange={set("status")} className={inputClass}>
              <option>Published</option>
              <option>Featured</option>
              <option>Draft</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Date label</label>
            <input value={editing.date} onChange={set("date")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Read time</label>
            <input value={editing.readTime} onChange={set("readTime")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Published (YYYY-MM-DD)</label>
            <input value={editing.datePublished} onChange={set("datePublished")} placeholder="2026-01-01" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Modified (YYYY-MM-DD)</label>
            <input value={editing.dateModified} onChange={set("dateModified")} placeholder="2026-01-01" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Excerpt</label>
            <textarea value={editing.excerpt} onChange={set("excerpt")} rows={2} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>SEO description (≤155 chars)</label>
            <textarea value={editing.seoDescription} onChange={set("seoDescription")} rows={2} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Keywords (comma separated)</label>
            <input value={editing.keywords} onChange={set("keywords")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Sort order</label>
            <input type="number" value={editing.sort_order} onChange={set("sort_order")} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <BlocksEditor blocks={editing.blocks} onChange={(b) => setEditing((f) => ({ ...f, blocks: b }))} />
          </div>
        </div>
        {msg && <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">{msg}</p>}
        <button type="submit" disabled={saving} className="btn btn-primary mt-5">
          {saving ? "Saving…" : "Save post"}
        </button>
      </form>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white dark:text-zinc-100">Blog posts ({posts.length})</h3>
        <button
          type="button"
          onClick={() => { setEditing({ ...emptyPost }); setIsNew(true); setMsg("") }}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950"
        >
          + New post
        </button>
      </div>
      {msg && <p className="mt-3 text-sm text-zinc-500">{msg}</p>}
      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-zinc-500">Loading…</p>}
        {posts.map((p) => (
          <div key={p.slug} className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white dark:text-zinc-100">{p.title}</p>
              <p className="font-mono text-xs text-zinc-500">/{p.slug} · {p.topic} · {p.status}</p>
            </div>
            <button type="button" onClick={() => { setEditing(fromPost(p)); setIsNew(false); setMsg("") }} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700">Edit</button>
            <button type="button" onClick={() => remove(p.slug)} className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 dark:border-rose-500/40">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
