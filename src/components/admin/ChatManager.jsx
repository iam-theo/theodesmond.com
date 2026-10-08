import { useCallback, useEffect, useRef, useState } from "react"
import { api, getToken } from "../../lib/api"
import { ContactsManager } from "./InboxTables"

function wsUrl(token) {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${window.location.host}/live?role=admin&token=${encodeURIComponent(token)}`
}

function timeAgo(ts) {
  const t = Date.parse(ts)
  if (Number.isNaN(t)) return ""
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(t).toLocaleDateString()
}

export default function ChatManager() {
  const [view, setView] = useState("chat") // chat | contacts
  const [convs, setConvs] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState("")
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [typingUser, setTypingUser] = useState(null)
  const typingTimerRef = useRef(null)
  const bottomRef = useRef(null)
  const activeRef = useRef(null)
  activeRef.current = activeId
  const wsRef = useRef(null)

  const loadList = useCallback(async () => {
    try {
      const data = await api.get("/api/admin/conversations")
      if (Array.isArray(data)) setConvs(data)
    } catch {
      /* ignore */
    }
    setLoading(false)
  }, [])

  const loadThread = useCallback(async (id) => {
    try {
      const data = await api.get(`/api/admin/conversations/${encodeURIComponent(id)}/messages`)
      if (Array.isArray(data)) {
        setMessages(data)
        setConvs((cs) => cs.map((c) => (c.id === id ? { ...c, unread_admin: 0 } : c)))
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    if (activeId) loadThread(activeId)
    else setMessages([])
  }, [activeId, loadThread])

  // Live admin socket: new conversations + incoming messages.
  useEffect(() => {
    let alive = true
    let ws = null
    let retryTimer = null
    let tries = 0

    const schedule = () => {
      if (!alive) return
      tries += 1
      retryTimer = setTimeout(connect, Math.min(1000 * 2 ** tries, 30000))
    }

    const connect = () => {
      const token = getToken()
      if (!token) {
        schedule()
        return
      }
      let socket
      try {
        socket = new WebSocket(wsUrl(token))
      } catch {
        schedule()
        return
      }
      wsRef.current = socket
      ws = socket
      socket.onopen = () => {
        tries = 0
      }
      socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.t === "chat-new") {
            loadList()
          } else if (msg.t === "chat" && msg.message) {
            loadList()
            if (msg.conversation_id === activeRef.current) {
              setMessages((ms) =>
                ms.some((m) => m.id === msg.message.id) ? ms : [...ms, msg.message]
              )
            }
          } else if (msg.t === "typing" && msg.conversation_id === activeId && msg.from) {
            if (msg.from === "visitor") {
              setTypingUser(msg.name || "Visitor")
            }
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
            typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000)
          }
        } catch {
          /* ignore */
        }
      }
      socket.onclose = schedule
      socket.onerror = () => {
        try {
          socket.close()
        } catch {
          /* ignore */
        }
      }
    }

    connect()
    return () => {
      alive = false
      clearTimeout(retryTimer)
      try {
        ws?.close()
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, activeId])

  // Send read receipt when admin views messages
  useEffect(() => {
    if (activeId && messages.length > 0 && wsRef.current?.readyState === 1) {
      const unreadVisitorMessages = messages.filter((m) => m.sender === "visitor" && m.status !== "read")
      if (unreadVisitorMessages.length > 0) {
        wsRef.current.send(JSON.stringify({ t: "read", conversation_id: activeId }))
      }
    }
  }, [messages, activeId])

  const upload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const data = await api.post("/api/chat/upload", { filename: file.name, dataUrl })
      await api.post(`/api/admin/conversations/${encodeURIComponent(activeId)}/reply`, {
        text: "",
        attachment_url: data.url,
      })
    } catch (err) {
      console.error("Upload failed:", err)
    }
    setUploading(false)
  }

  const sendReply = async (e) => {
    e?.preventDefault()
    const clean = reply.trim()
    if ((!clean && !uploading) || !activeId || busy) return
    setBusy(true)
    try {
      const msg = await api.post(`/api/admin/conversations/${encodeURIComponent(activeId)}/reply`, {
        text: clean,
      })
      setMessages((ms) => (ms.some((m) => m.id === msg.id) ? ms : [...ms, msg]))
      setReply("")
      loadList()
    } catch {
      /* ignore */
    }
    setBusy(false)
  }

  const setStatus = async (status) => {
    if (!activeId) return
    await api
      .post(`/api/admin/conversations/${encodeURIComponent(activeId)}/status`, { status })
      .catch(() => {})
    loadList()
  }

  const active = convs.find((c) => c.id === activeId)
  const unreadTotal = convs.reduce((n, c) => n + (c.unread_admin || 0), 0)

  return (
    <div>
      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={() => setView("chat")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            view === "chat"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
              : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          Live chat {unreadTotal > 0 && (
            <span className="ml-1.5 rounded-full bg-emerald-500 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
              {unreadTotal}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setView("contacts")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            view === "contacts"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
              : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          Contact form
        </button>
      </div>

      {view === "contacts" ? (
        <ContactsManager />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Conversation list */}
          <div className="space-y-2">
            {loading && <p className="text-sm text-zinc-500">Loading chats…</p>}
            {!loading && convs.length === 0 && (
              <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
                No conversations yet. When a visitor starts a chat, it lands here.
              </p>
            )}
            {convs.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  activeId === c.id
                    ? "border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-900"
                    : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${c.status === "open" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
                    aria-hidden
                  />
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {c.visitor_name || "Visitor"}
                  </p>
                  {c.unread_admin > 0 && (
                    <span className="ml-auto shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                      {c.unread_admin}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate font-mono text-xs text-zinc-500">
                  {c.visitor_email}
                </p>
                {c.last_message && (
                  <p className="mt-1.5 line-clamp-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {c.last_message.sender === "admin" ? "You: " : ""}
                    {c.last_message.text || "📎 attachment"}
                  </p>
                )}
                <p className="mt-1 font-mono text-[11px] text-zinc-400">
                  {timeAgo(c.updated_at)} · {c.status}
                </p>
              </button>
            ))}
          </div>

          {/* Thread */}
          <div className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {!active ? (
              <div className="flex flex-1 items-center justify-center p-8">
                <p className="text-center text-sm text-zinc-500">
                  Pick a conversation to read and reply.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white dark:text-zinc-100">
                      {active.visitor_name}
                    </p>
                    <p className="truncate font-mono text-xs text-zinc-500">{active.visitor_email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatus(active.status === "open" ? "closed" : "open")}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 font-mono text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                  >
                    {active.status === "open" ? "Close chat" : "Reopen"}
                  </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : ""}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          m.sender === "admin"
                            ? "rounded-tr-sm bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                            : "rounded-tl-sm bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                        {m.attachment_url && (
                          /\.(png|jpe?g|gif|webp|svg)$/i.test(m.attachment_url) ? (
                            <a href={m.attachment_url} target="_blank" rel="noreferrer" className="mt-1.5 block">
                              <img src={m.attachment_url} alt="attachment" className="max-h-48 rounded-lg object-cover" loading="lazy" />
                            </a>
                          ) : (
                            <a href={m.attachment_url} target="_blank" rel="noreferrer" className="mt-1.5 inline-block font-mono text-xs underline">
                              📎 {m.attachment_url.split("/").pop()}
                            </a>
                          )
                        )}
                        <p className={`mt-1 font-mono text-[10px] ${m.sender === "admin" ? "opacity-60" : "text-zinc-400"}`}>
                          {new Date(m.created_at).toLocaleString()}
                        </p>
                        {m.sender === "admin" && m.status && (
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                              {m.status === "read" && (
                                <>
                                  <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18 7l-5.5 5.5-3.5-3.5L8 14l6 6-10-10z"/></svg>
                                  <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18 7l-5.5 5.5-3.5-3.5L8 14l6 6-10-10z"/></svg>
                                </>
                              )}
                              {m.status === "delivered" && (
                                <>
                                  <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18 7l-5.5 5.5-3.5-3.5L8 14l6 6-10-10z"/></svg>
                                  <svg className="h-3 w-3 text-zinc-400" fill="currentColor" viewBox="0 0 24 24"><path d="M18 7l-5.5 5.5-3.5-3.5L8 14l6 6-10-10z"/></svg>
                                </>
                              )}
                              {m.status === "sent" && (
                                <svg className="h-3 w-3 text-zinc-400" fill="currentColor" viewBox="0 0 24 24"><path d="M18 7l-5.5 5.5-3.5-3.5L8 14l6 6-10-10z"/></svg>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

<form onSubmit={sendReply} className="flex items-end gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
                  {typingUser && (
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{animationDelay: "0ms"}} />
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{animationDelay: "150ms"}} />
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{animationDelay: "300ms"}} />
                      </span>
                      <span>{typingUser} is typing…</span>
                    </div>
                  )}
                  <label
                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 text-zinc-500 hover:text-white dark:border-zinc-700 dark:hover:text-zinc-100"
                    title="Attach a file"
                  >
                    <span aria-hidden>📎</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.txt"
                      disabled={uploading}
                      onChange={(e) => {
                        upload(e.target.files?.[0])
                        e.target.value = ""
                      }}
                    />
                  </label>
                  <input
                    value={reply}
                    onChange={(e) => {
                      setReply(e.target.value)
                      if (activeId && wsRef.current?.readyState === 1) {
                        wsRef.current.send(JSON.stringify({ t: "typing", conversation_id: activeId, from: "admin", name: "Theo" }))
                      }
                    }}
                    placeholder={active?.status === "open" ? "Reply as Theo…" : "Reopen to reply…"}
                    disabled={busy || active?.status !== "open"}
                    className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                  <button
                    type="submit"
                    disabled={busy || !reply.trim() || !active?.status || active.status !== "open"}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950"
                    aria-label="Send reply"
                  >
                    →
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
