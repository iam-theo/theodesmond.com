import { useEffect, useState } from "react"
import { api } from "../../lib/api"
import { clearProductsCache } from "../../lib/content"
import { inputClass, labelClass } from "./AdminLogin"

const lines = (v) => v.split("\n").map((s) => s.trim()).filter(Boolean)

const emptyProduct = {
  slug: "",
  index: "",
  name: "",
  tagline: "",
  category: "",
  industry: "",
  tags: "",
  status: "BUILDING",
  accent: "indigo",
  visual: "",
  image: "",
  link: "",
  details: "",
  seoDesc: "",
  overview: "",
  features: "",
  functions: "",
  architecture: "",
  framework: "",
  sort_order: 0,
}

function toRow(p, isNew) {
  return {
    ...(isNew ? { slug: p.slug.trim() } : {}),
    idx: p.index,
    name: p.name,
    tagline: p.tagline,
    category: p.category,
    industry: p.industry,
    tags: lines(p.tags),
    status: p.status,
    accent: p.accent,
    visual: p.visual,
    image: p.image,
    link: p.link,
    details: p.details,
    seo_desc: p.seoDesc,
    overview: p.overview,
    features: lines(p.features),
    functions: lines(p.functions),
    architecture: p.architecture,
    framework: lines(p.framework),
    sort_order: Number(p.sort_order) || 0,
  }
}

function fromProduct(p) {
  const join = (a) => (a || []).join("\n")
  return {
    slug: p.slug,
    index: p.index || "",
    name: p.name || "",
    tagline: p.tagline || "",
    category: p.category || "",
    industry: p.industry || "",
    tags: join(p.tags),
    status: p.status || "BUILDING",
    accent: p.accent || "indigo",
    visual: p.visual || "",
    image: p.image || "",
    link: p.link || "",
    details: p.details || "",
    seoDesc: p.seoDesc || "",
    overview: p.overview || "",
    features: join(p.features),
    functions: join(p.functions),
    architecture: p.architecture || "",
    framework: join(p.framework),
    sort_order: p.sort_order ?? 0,
  }
}

const ACCENTS = ["indigo", "emerald", "sky", "violet", "rose", "amber"]

export default function ProductsManager() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get("/api/admin/products")
      setProducts(Array.isArray(data) ? data : [])
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
        await api.post("/api/admin/products", toRow(editing, true))
      } else {
        await api.put(`/api/admin/products/${encodeURIComponent(editing.slug)}`, toRow(editing, false))
      }
      clearProductsCache()
      setMsg("Saved.")
      setEditing(null)
      load()
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    }
    setSaving(false)
  }

  const remove = async (slug) => {
    if (!window.confirm(`Delete product "${slug}"?`)) return
    try {
      await api.del(`/api/admin/products/${encodeURIComponent(slug)}`)
      clearProductsCache()
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
            {isNew ? "New product" : `Edit — ${editing.slug}`}
          </h3>
          <button type="button" onClick={() => setEditing(null)} className="font-mono text-xs text-zinc-500 hover:text-white dark:hover:text-zinc-100">← Back</button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {isNew && (
            <div>
              <label className={labelClass}>Slug (unique)</label>
              <input value={editing.slug} onChange={set("slug")} required pattern="[a-z0-9-]+" placeholder="aurax" className={inputClass} />
            </div>
          )}
          <div>
            <label className={labelClass}>Index (01, 02…)</label>
            <input value={editing.index} onChange={set("index")} className={inputClass} />
          </div>
          <div className={isNew ? "" : "sm:col-span-2"}>
            <label className={labelClass}>Name</label>
            <input value={editing.name} onChange={set("name")} required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Tagline</label>
            <input value={editing.tagline} onChange={set("tagline")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <input value={editing.category} onChange={set("category")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Industry</label>
            <input value={editing.industry} onChange={set("industry")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <input value={editing.status} onChange={set("status")} placeholder="BUILDING / LIVE" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Accent</label>
            <select value={editing.accent} onChange={set("accent")} className={inputClass}>
              {ACCENTS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Visual</label>
            <input value={editing.visual} onChange={set("visual")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Image</label>
            <input value={editing.image} onChange={set("image")} placeholder="/aurax.jpeg" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Link</label>
            <input value={editing.link} onChange={set("link")} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Tags (one per line)</label>
            <textarea value={editing.tags} onChange={set("tags")} rows={2} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Details</label>
            <textarea value={editing.details} onChange={set("details")} rows={2} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>SEO description</label>
            <textarea value={editing.seoDesc} onChange={set("seoDesc")} rows={2} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Overview</label>
            <textarea value={editing.overview} onChange={set("overview")} rows={3} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Features (one per line)</label>
            <textarea value={editing.features} onChange={set("features")} rows={4} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Functions (one per line)</label>
            <textarea value={editing.functions} onChange={set("functions")} rows={4} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Architecture</label>
            <textarea value={editing.architecture} onChange={set("architecture")} rows={3} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Framework (one per line)</label>
            <textarea value={editing.framework} onChange={set("framework")} rows={4} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Sort order</label>
            <input type="number" value={editing.sort_order} onChange={set("sort_order")} className={inputClass} />
          </div>
        </div>
        {msg && <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">{msg}</p>}
        <button type="submit" disabled={saving} className="btn btn-primary mt-5">
          {saving ? "Saving…" : "Save product"}
        </button>
      </form>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white dark:text-zinc-100">Products ({products.length})</h3>
        <button
          type="button"
          onClick={() => { setEditing({ ...emptyProduct }); setIsNew(true); setMsg("") }}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950"
        >
          + New product
        </button>
      </div>
      {msg && <p className="mt-3 text-sm text-zinc-500">{msg}</p>}
      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-zinc-500">Loading…</p>}
        {products.map((p) => (
          <div key={p.slug} className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white dark:text-zinc-100">{p.index} · {p.name}</p>
              <p className="font-mono text-xs text-zinc-500">/{p.slug} · {p.category} · {p.status}</p>
            </div>
            <button type="button" onClick={() => { setEditing(fromProduct(p)); setIsNew(false); setMsg("") }} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700">Edit</button>
            <button type="button" onClick={() => remove(p.slug)} className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 dark:border-rose-500/40">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
