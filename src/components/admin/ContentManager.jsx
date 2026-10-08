import { useEffect, useState } from "react"
import { api } from "../../lib/api"
import { clearContentCache } from "../../lib/content"
import { inputClass, labelClass } from "./AdminLogin"

/** Generic key/value content editor (hero, headers, home, work page, …). */
export default function ContentManager() {
  const [keys, setKeys] = useState([])
  const [active, setActive] = useState("")
  const [filter, setFilter] = useState("")
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    api
      .get("/api/admin/content")
      .then((data) => setKeys((data || []).map((r) => r.key)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const open = async (key) => {
    setActive(key)
    setMsg("")
    try {
      const data = await api.get("/api/admin/content")
      const row = (data || []).find((r) => r.key === key)
      if (row) setText(JSON.stringify(row.value, null, 2))
    } catch {
      /* ignore */
    }
  }

  const save = async () => {
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      setMsg("Invalid JSON — fix it before saving.")
      return
    }
    setSaving(true)
    setMsg("")
    try {
      await api.put(`/api/admin/content/${encodeURIComponent(active)}`, { value: parsed })
      clearContentCache()
      setMsg(`Saved "${active}" — live on the site.`)
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    }
    setSaving(false)
  }

  const visible = keys.filter((k) => k.toLowerCase().includes(filter.trim().toLowerCase()))

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter sections…"
          className={inputClass}
        />
        <div className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto">
          {loading && <p className="text-sm text-zinc-500">Loading…</p>}
          {visible.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => open(k)}
              className={`block w-full rounded-lg px-3 py-2 text-left font-mono text-xs transition-colors ${
                active === k
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {!active ? (
          <p className="text-sm text-zinc-500">Pick a section to edit its JSON. Changes go live immediately after save.</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-sm font-bold text-white dark:text-zinc-100">{active}</h3>
              <span className={labelClass}>JSON</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={22}
              spellCheck={false}
              className={`${inputClass} mt-3 font-mono !text-xs`}
            />
            {msg && <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{msg}</p>}
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary mt-4">
              {saving ? "Saving…" : `Save ${active}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
