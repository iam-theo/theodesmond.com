import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "../lib/api"
import { getVisitorKey } from "../lib/visitorKey"

const STORE_KEY = "td-chat"
const PUSH_STORE_KEY = "td-push-sub"

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function subscribeToPush(visitorKey) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    if (existing) {
      // Already subscribed, ensure it's registered with our backend
      const sub = existing.toJSON()
      await api.post("/api/push/subscribe", {
        endpoint: sub.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.keys.p256dh))),
        auth: btoa(String.fromCharCode(...new Uint8Array(sub.keys.auth))),
        visitor_key: visitorKey,
      })
      return
    }
    const keyRes = await api.get("/api/push/key")
    if (!keyRes?.key) return
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyRes.key),
    })
    const subJson = sub.toJSON()
    await api.post("/api/push/subscribe", {
      endpoint: subJson.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(subJson.keys.p256dh))),
      auth: btoa(String.fromCharCode(...new Uint8Array(subJson.keys.auth))),
      visitor_key: visitorKey,
    })
    localStorage.setItem(PUSH_STORE_KEY, "1")
  } catch {
    /* ignore — push is best effort */
  }
}

async function unsubscribeFromPush(visitorKey) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    if (existing) {
      const sub = existing.toJSON()
      await api.del("/api/push/subscribe", { body: {
        endpoint: sub.endpoint,
        visitor_key: visitorKey,
      } })
      await existing.unsubscribe()
      localStorage.removeItem(PUSH_STORE_KEY)
    }
  } catch {
    /* ignore */
  }
}

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

export default function LiveChat({ isChatPage = false }) {
  // Proactive messages from the admin open the widget via a window event.
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("td-open-chat", handler)
    return () => window.removeEventListener("td-open-chat", handler)
  }, [])

  // Auto-open on dedicated chat page
  const [open, setOpen] = useState(isChatPage)
  
  // Prevent close on chat page
  const handleClose = () => {
    if (!isChatPage) setOpen(false)
  }
  const [session, setSession] = useState(loadStored)
  const [messages, setMessages] = useState([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [unread, setUnread] = useState(0)
  const [online, setOnline] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [typingUser, setTypingUser] = useState(null)
  const [pushEnabled, setPushEnabled] = useState(() => localStorage.getItem(PUSH_STORE_KEY) === "1")
  const [pushSupported, setPushSupported] = useState(false)
  const typingTimerRef = useRef(null)
  const wsRef = useRef(null)
  const bottomRef = useRef(null)
  const openRef = useRef(open)
  openRef.current = open

  // Check push support and subscribe when session starts
  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    setPushSupported(supported)
    if (supported && session?.id && pushEnabled) {
      subscribeToPush(session.id)
    }
  }, [session?.id, pushEnabled])

  // Subscribe when push is enabled
  useEffect(() => {
    if (pushEnabled && session?.id) {
      subscribeToPush(session.id)
    } else if (!pushEnabled && session?.id) {
      unsubscribeFromPush(session.id)
    }
  }, [pushEnabled, session?.id])

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

  // Send read receipt when messages are loaded/viewed
  useEffect(() => {
    if (session?.id && messages.length > 0 && wsRef.current?.readyState === 1) {
      const adminMessages = messages.filter((m) => m.sender === "admin" && m.status !== "read")
      if (adminMessages.length > 0) {
        wsRef.current.send(JSON.stringify({ t: "read", conversation_id: session.id }))
      }
    }
  }, [messages, session?.id])

  // Live socket: join the conversation room + poll fallback.
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
            if (msg.message.sender === "admin" && !openRef.current) {
              setUnread((u) => u + 1)
            }
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
  }, [messages, open])

  useEffect(() => {
    if (open) setUnread(0)
  }, [open, messages])

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

  return (
    <>
      {!open && !isChatPage && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Chat with Theo"
          title="Chat with Theo"
          className="fixed bottom-6 right-6 z-[9990] flex h-14 w-14 items-center justify-center rounded-full bg-zinc-950 text-white shadow-lg shadow-black/20 transition-transform hover:scale-110 dark:bg-white dark:text-zinc-950"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
          </svg>
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500 px-1.5 font-mono text-[11px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-[9990] flex h-[min(520px,72vh)] w-[min(380px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3 bg-zinc-950 px-4 py-3.5 text-white dark:bg-zinc-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 font-mono text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
              TD
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Chat with Theo</p>
              <p className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-300">
                <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-zinc-500"}`} />
                {online ? "Online now" : "Typically replies fast"}
              </p>
            </div>
            {pushSupported && session && (
              <button
                type="button"
                onClick={() => setPushEnabled((p) => !p)}
                aria-label={pushEnabled ? "Disable notifications" : "Enable notifications"}
                aria-pressed={pushEnabled}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors text-zinc-300 hover:text-white dark:hover:text-zinc-100"
                title={pushEnabled ? "Disable desktop notifications" : "Enable desktop notifications"}
              >
                <svg className={`h-5 w-5 ${pushEnabled ? "text-emerald-400" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  {pushEnabled && <path d="M6 8a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="1.8" />}
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-md px-2 py-1 text-lg leading-none text-zinc-400 hover:text-white"
            >
              ×
            </button>
          </div>

          {!session ? (
            <form onSubmit={start} className="flex flex-1 flex-col justify-center gap-3 p-5">
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Say hello — drop your name and email so I can reach you back.
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
              <button type="submit" disabled={busy} className="btn btn-primary w-full">
                {busy ? "Starting…" : "Start chatting →"}
              </button>
            </form>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <p className="rounded-xl bg-zinc-100 p-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
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
                      {m.sender === "visitor" && (
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
                {isClosed && (
                  <p className="text-center font-mono text-[11px] text-zinc-400">
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
                    disabled={uploading}
                    className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => send()}
                    disabled={busy || (!text.trim())}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950"
                    aria-label="Send"
                  >
                    →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
