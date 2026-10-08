import { useEffect, useState } from "react"
import { api } from "../../lib/api"
import { useLiveVisitors } from "../../hooks/useLiveVisitors"

function Row({ children }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  )
}

function useTable(table, order, limit = 100) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/api/admin/${table}?limit=${limit}`)
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  const remove = async (id) => {
    if (!window.confirm("Delete this row?")) return
    try {
      await api.del(`/api/admin/${table}/${id}`)
      load()
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    }
  }

  return { rows, loading, msg, load, remove }
}

export function ContactsManager() {
  const { rows, loading, msg, remove } = useTable("contacts", "created_at")
  return (
    <div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Messages ({rows.length})</h3>
      {msg && <p className="mt-2 text-sm text-zinc-500">{msg}</p>}
      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-zinc-500">Loading…</p>}
        {rows.map((c) => (
          <Row key={c.id}>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</p>
              <a href={`mailto:${c.email}`} className="font-mono text-xs text-zinc-500 hover:underline">{c.email}</a>
              <span className="ml-auto font-mono text-[11px] text-zinc-400">{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-1 font-mono text-xs text-indigo-600 dark:text-indigo-400">{c.category}</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{c.message}</p>
            <button type="button" onClick={() => remove(c.id)} className="mt-3 font-mono text-xs text-rose-500 hover:underline">Delete</button>
          </Row>
        ))}
        {!loading && rows.length === 0 && <p className="text-sm text-zinc-500">No messages yet.</p>}
      </div>
    </div>
  )
}

export function SubscribersManager() {
  const { rows, loading, msg, remove } = useTable("subscribers", "created_at")
  return (
    <div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Subscribers ({rows.length})</h3>
      {msg && <p className="mt-2 text-sm text-zinc-500">{msg}</p>}
      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-zinc-500">Loading…</p>}
        {rows.map((s) => (
          <Row key={s.id}>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.name || "—"}</p>
              <a href={`mailto:${s.email}`} className="font-mono text-xs text-zinc-500 hover:underline">{s.email}</a>
              <span className="ml-auto font-mono text-[11px] text-zinc-400">{new Date(s.created_at).toLocaleString()}</span>
            </div>
            <button type="button" onClick={() => remove(s.id)} className="mt-2 font-mono text-xs text-rose-500 hover:underline">Delete</button>
          </Row>
        ))}
        {!loading && rows.length === 0 && <p className="text-sm text-zinc-500">No subscribers yet.</p>}
      </div>
    </div>
  )
}

export function CommentsManager() {
  const { rows, loading, msg, remove } = useTable("comments", "created_at", 200)
  return (
    <div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Comments ({rows.length})</h3>
      {msg && <p className="mt-2 text-sm text-zinc-500">{msg}</p>}
      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-zinc-500">Loading…</p>}
        {rows.map((c) => (
          <Row key={c.id}>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{c.author}</p>
              <span className="font-mono text-xs text-zinc-500">/blog/{c.post_slug}</span>
              <span className="ml-auto font-mono text-[11px] text-zinc-400">{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{c.text}</p>
            <button type="button" onClick={() => remove(c.id)} className="mt-2 font-mono text-xs text-rose-500 hover:underline">Delete</button>
          </Row>
        ))}
        {!loading && rows.length === 0 && <p className="text-sm text-zinc-500">No comments yet.</p>}
      </div>
    </div>
  )
}

function timeAgo(ts) {
  const t = Date.parse(ts)
  if (Number.isNaN(t)) return ""
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (s < 10) return "just now"
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

function LiveVisitors() {
  const { online, visitors, connected, sendMessage } = useLiveVisitors()
  const [open, setOpen] = useState(null)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState("")
  const selected = visitors.find((v) => v.ip === open)

  const toggle = (ip) => {
    setOpen(open === ip ? null : ip)
    setDraft("")
    setSendMsg("")
  }

  const submitMsg = async (e) => {
    e.preventDefault()
    const clean = draft.trim()
    if (!clean || !selected || sending) return
    setSending(true)
    setSendMsg("")
    try {
      const res = await sendMessage(selected.ip, clean)
      setSendMsg(
        res.delivered > 0
          ? `Delivered to ${res.delivered} tab${res.delivered === 1 ? "" : "s"} · it lands in their chat inbox`
          : "Sent — visitor can reply from their chat"
      )
      setDraft("")
    } catch (err) {
      setSendMsg(err.message || "Failed to send")
    }
    setSending(false)
  }

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${connected ? "bg-emerald-500" : "bg-zinc-400"}`} />
          <span className={`relative inline-flex h-3 w-3 rounded-full ${connected ? "bg-emerald-500" : "bg-zinc-400"}`} />
        </span>
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          {connected ? `${online} online now` : "Connecting to live feed…"}
        </h4>
        <p className="font-mono text-[11px] text-zinc-500">
          one entry per IP · click a visitor to view details or send a message
        </p>
      </div>

      {connected && visitors.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500">No visitors on the site right now.</p>
      )}

      <div className="mt-4 space-y-2">
        {visitors.map((v) => (
          <div
            key={v.ip}
            className={`rounded-xl border bg-white dark:bg-zinc-900 ${
              open === v.ip
                ? "border-emerald-300 dark:border-emerald-500"
                : "border-zinc-200 hover:border-emerald-400 dark:border-zinc-800"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(v.ip)}
              className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 p-4 text-left"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {[v.city, v.country].filter(Boolean).join(", ") || "Unknown location"}
              </span>
              <span className="truncate font-mono text-xs text-emerald-700 dark:text-emerald-300">
                → {v.currentPath}
              </span>
              <span className="font-mono text-[11px] text-zinc-500">
                {v.device} · {v.pages.length} page{v.pages.length === 1 ? "" : "s"}
                {v.sockets > 1 ? ` · ${v.sockets} tabs` : ""}
              </span>
              <span className="ml-auto shrink-0 font-mono text-[11px] text-zinc-400">
                {timeAgo(v.lastSeen)} {open === v.ip ? "▾" : "▸"}
              </span>
            </button>

            {open === v.ip && selected && (
              <div className="border-t border-dashed border-zinc-200 px-4 py-4 dark:border-zinc-700">
                <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">Pages this visit</p>
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                  {selected.pages.map((p, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 font-mono text-xs">
                      <span className="truncate text-zinc-700 dark:text-zinc-300">{p.path}</span>
                      <span className="shrink-0 text-zinc-400">
                        {new Date(p.at).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-zinc-500 sm:grid-cols-4">
                  <dt>IP</dt><dd className="text-zinc-700 sm:text-right dark:text-zinc-300">{selected.ip}</dd>
                  <dt>Browser</dt><dd className="text-zinc-700 sm:text-right dark:text-zinc-300">{selected.browser} · {selected.os}</dd>
                  <dt>Screen</dt><dd className="text-zinc-700 sm:text-right dark:text-zinc-300">{selected.screen || "—"}</dd>
                  <dt>Referrer</dt><dd className="truncate text-zinc-700 sm:text-right dark:text-zinc-300">{selected.referrer || "direct"}</dd>
                  <dt>Here since</dt><dd className="text-zinc-700 sm:text-right dark:text-zinc-300">{new Date(selected.firstSeen).toLocaleTimeString()}</dd>
                  <dt>Language</dt><dd className="text-zinc-700 sm:text-right dark:text-zinc-300">{selected.language || "—"}</dd>
                  {selected.org && (
                    <>
                      <dt>Network</dt><dd className="truncate text-zinc-700 sm:text-right dark:text-zinc-300">{selected.org}</dd>
                    </>
                  )}
                  {selected.country_code && (
                    <>
                      <dt>Country</dt><dd className="text-zinc-700 sm:text-right dark:text-zinc-300">{selected.country} ({selected.country_code})</dd>
                    </>
                  )}
                  {selected.timezone && (
                    <>
                      <dt>Timezone</dt><dd className="text-zinc-700 sm:text-right dark:text-zinc-300">{selected.timezone}</dd>
                    </>
                  )}
                  {selected.mapUrl && (
                    <>
                      <dt>Map</dt><dd className="sm:text-right"><a href={selected.mapUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">Open pin →</a></dd>
                    </>
                  )}
                </dl>
                <form onSubmit={submitMsg} className="mt-4 border-t border-dashed border-zinc-200 pt-4 dark:border-zinc-700">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">Message this visitor</p>
                  <div className="mt-2 flex items-end gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={sending ? "Sending…" : "Type a message…"}
                      disabled={sending}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="shrink-0 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950"
                    >
                      {sending ? "Sending…" : "Send"}
                    </button>
                  </div>
                  {sendMsg && <p className="mt-1.5 font-mono text-[11px] text-zinc-500">{sendMsg}</p>}
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function VisitsManager() {
  const { rows, loading, msg, load } = useTable("visits", "created_at", 100)
  const [clearing, setClearing] = useState(false)

  const clearAll = async () => {
    if (!window.confirm(`Delete all ${rows.length} visit records? This cannot be undone.`)) return
    setClearing(true)
    try {
      await api.del("/api/admin/visits")
      load()
    } catch {
      /* message handled below */
    }
    setClearing(false)
  }

  return (
    <div>
      <LiveVisitors />
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Visit history ({rows.length})</h3>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            disabled={clearing}
            className="ml-auto rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 disabled:opacity-50 dark:border-rose-500/40"
          >
            {clearing ? "Clearing…" : "Clear all"}
          </button>
        )}
      </div>
      {msg && <p className="mt-2 text-sm text-zinc-500">{msg}</p>}
      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              <th className="px-4 py-2.5">Time</th>
              <th className="px-4 py-2.5">Page</th>
              <th className="px-4 py-2.5">Location</th>
              <th className="px-4 py-2.5">Device</th>
              <th className="px-4 py-2.5">IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-zinc-500">{new Date(v.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 font-mono text-xs text-zinc-700 dark:text-zinc-300">{v.path}</td>
                <td className="px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300">
                  {[v.city, v.country].filter(Boolean).join(", ") || "—"}
                  {v.lat != null && v.lon != null && (
                    <>
                      {" "}
                      <a
                        href={`https://www.google.com/maps?q=${v.lat},${v.lon}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        pin →
                      </a>
                    </>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300">{[v.device, v.browser].filter(Boolean).join(" · ") || "—"}</td>
                <td className="px-4 py-2 font-mono text-xs text-zinc-500">{v.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-4 text-sm text-zinc-500">Loading…</p>}
        {!loading && rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No visits logged yet.</p>}
      </div>
    </div>
  )
}
