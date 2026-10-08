import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "../lib/api"
import { getVisitorKey } from "../lib/visitorKey"

const STORE_KEY = "td-chat"

function loadStored() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "null")
  } catch {
    return null
  }
}

function wsUrl() {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${window.location.host}/live`
}

function isImage(url) {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(url || "")
}

function Attachment({ url }) {
  if (!url) return null
  if (isImage(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-1.5 block">
        <img src={url} alt="attachment" className="max-h-40 rounded-lg object-cover" loading="lazy" />
      </a>
    )
  }
  const name = url.split("/").pop()
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-1.5 inline-block rounded-md bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white dark:bg-zinc-100 dark:text-zinc-950"
    >
      📎 {name}
    </a>
  )
}

export default function ChatApp() {
  const [session, setSession] = useState(loadStored)
  const [messages, setMessages] = useState([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [online, setOnline] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [typingUser, setTypingUser] = useState(null)
  const typingTimerRef = useRef(null)
  const wsRef = useRef(null)
  const bottomRef = useRef(null)
  const openRef = useRef(true)
  openRef.current = true

  const mergeMessages = useCallback((list) => {
    setMessages((prev) => {
      const ids = new Set(prev.map((m) => m.id))
      const fresh = (list || []).filter((m) => !ids.has(m.id))
      if (!fresh.length) return prev
      return [...prev, ...fresh].sort(
        (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)
      )
    })
  }, [])

  const loadMessages = useCallback(
    async (id) => {
      try {
        const [msgs, conv] = await Promise.all([
          api.get(`/api/chat/${encodeURIComponent(id)}/messages`),
          api.get(`/api/chat/${encodeURIComponent(id)}`).catch(() => null),
        ])
        if (Array.isArray(msgs)) {
          setMessages(
            [...msgs].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
          )
        }
        if (conv) setIsClosed(conv.status === "closed")
      } catch {
        /* offline — keep what we have */
      }
    },
    []
  )

  useEffect(() => {
    if (!session?.id) return
    let alive = true
    let retryTimer = null
    let tries = 0
    let pollTimer = null

    const poll = () => loadMessages(session.id)

    const connect = () => {
      let socket
      try {
        socket = new WebSocket(wsUrl())
      } catch {
        retryTimer = setTimeout(() => alive && connect(), 5000)
        return
      }
      wsRef.current = socket
      socket.onopen = () => {
        tries = 0
        if (alive) setOnline(true)
        try {
          socket.send(JSON.stringify({ t: "chat-join", conversation_id: session.id }))
        } catch {
          /* ignore */
        }
      }
      socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.t === "chat-msg" && msg.conversation_id === session.id && msg.message) {
            mergeMessages([msg.message])
          }
          if (msg.t === "typing" && msg.conversation_id === session.id && msg.from) {
            if (msg.from === "admin") {
              setTypingUser("Theo")
            } else {
              setTypingUser(msg.name || "Visitor")
            }
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
            typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000)
          }
          if (msg.t === "chat-status" && msg.conversation_id === session.id && msg.ids) {
            setMessages((prev) =>
              prev.map((m) => (msg.ids.includes(m.id) ? { ...m, status: msg.status } : m))
            )
          }
        } catch {
          /* ignore */
        }
      }
      const down = () => {
        if (wsRef.current === socket) wsRef.current = null
        if (alive) {
          setOnline(false)
          tries += 1
          retryTimer = setTimeout(connect, Math.min(1000 * 2 ** tries, 30000))
        }
      }
      socket.onclose = down
      socket.onerror = () => {
        try {
          socket.close()
        } catch {
          /* ignore */
        }
      }
    }

    loadMessages(session.id)
    connect()
    pollTimer = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== 1) poll()
    }, 5000)

    return () => {
      alive = false
      clearTimeout(retryTimer)
      clearInterval(pollTimer)
      try {
        wsRef.current?.close()
      } catch {
        /* ignore */
      }
      wsRef.current = null
    }
  }, [session?.id, loadMessages, mergeMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  const start = async (e) => {
    e.preventDefault()
    const cleanName = name.trim()
    const cleanEmail = email.trim()
    if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter your name and a valid email.")
      return
    }
    setError("")
    setBusy(true)
    try {
      const conv = await api.post("/api/chat/start", {
        name: cleanName,
        email: cleanEmail,
        visitor_key: getVisitorKey(),
      })
      const s = { id: conv.id, name: cleanName, email: cleanEmail }
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(s))
      } catch {
        /* ignore */
      }
      setSession(s)
      setMessages([])
    } catch (err) {
      setError(err.message || "Could not start chat. Try again.")
    }
    setBusy(false)
  }

  const send = async (attachmentUrl = "") => {
    const clean = text.trim()
    if ((!clean && !attachmentUrl) || !session?.id || busy) return
    setBusy(true)
    setError("")
    try {
      const msg = await api.post(`/api/chat/${encodeURIComponent(session.id)}/messages`, {
        name: session.name,
        text: clean,
        attachment_url: attachmentUrl,
      })
      mergeMessages([msg])
      setText("")
    } catch (err) {
      if (/closed/i.test(err.message || "")) {
        try {
          localStorage.removeItem(STORE_KEY)
        } catch {
          /* ignore */
        }
        setSession(null)
        setMessages([])
        setError("This chat was closed — start a fresh one below.")
      } else {
        setError(err.message || "Message failed to send.")
      }
    }
    setBusy(false)
  }

  const upload = async (file) => {
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const data = await api.post("/api/chat/upload", { filename: file.name, dataUrl })
      await send(data.url)
    } catch (err) {
      setError(err.message || "Upload failed.")
    }
    setUploading(false)
  }

  const formatTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white dark:bg-zinc-950 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <svg className="mx-auto h-16 w-16 text-zinc-400 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
            </svg>
            <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Chat with Theo</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">Start a conversation — I typically reply within a few hours.</p>
          </div>
          <form onSubmit={start} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Your name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
            <button type="submit" disabled={busy} className="btn btn-primary w-full py-3">
              {busy ? "Starting…" : "Start chatting →"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 font-mono text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
          TD
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">Theo Desmond</p>
          <p className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-zinc-500"}`} />
            {online ? "Online now" : "Typically replies fast"}
          </p>
        </div>
        <a href="/work" className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400 hidden sm:inline">
          Work with Theo
        </a>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
            You&apos;re in, {session.name.split(" ")[0]}. Send your first message 👇
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "admin" ? "" : "justify-end"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.sender === "admin"
                  ? "rounded-tl-sm bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  : "rounded-tr-sm bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
              }`}
            >
              {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
              <Attachment url={m.attachment_url} />
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
            <span className={`ml-2 mr-2 text-[10px] text-zinc-400 ${m.sender === "admin" ? "ml-auto" : "mr-auto"}`}>
              {formatTime(m.created_at)}
            </span>
          </div>
        ))}
        {isClosed && (
          <p className="text-center font-mono text-[11px] text-zinc-400 py-2">
            This conversation was closed. Start a new one anytime.
          </p>
        )}
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
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        {error && <p className="mb-2 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
        <div className="flex items-end gap-2">
          <label
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
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
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              if (session?.id && wsRef.current?.readyState === 1) {
                wsRef.current.send(JSON.stringify({ t: "typing", conversation_id: session.id }))
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={uploading ? "Uploading…" : "Type a message…"}
            disabled={uploading || isClosed}
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={busy || (!text.trim()) || isClosed}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950"
            aria-label="Send"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}