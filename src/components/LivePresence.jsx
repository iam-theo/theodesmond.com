import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { api } from "../lib/api"
import { getVisitorKey } from "../lib/visitorKey"

function wsUrl() {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${window.location.host}/live`
}

function pagePayload(path) {
  return {
    path,
    referrer: typeof document !== "undefined" ? document.referrer || "" : "",
    screen:
      typeof window.screen !== "undefined"
        ? `${window.screen.width}x${window.screen.height}`
        : "",
    language: typeof navigator !== "undefined" ? navigator.language || "" : "",
    visitor_key: getVisitorKey(),
  }
}

/**
 * Live presence beacon. Streams page views over WebSocket (/live) so the
 * admin sees visitors in real time. Also receives proactive admin messages
 * ("admin-popup") and surfaces them as a small reply-able toast. Falls back
 * to POST /api/track when the socket has never connected.
 */
export default function LivePresence() {
  const { pathname } = useLocation()
  const wsRef = useRef(null)
  const aliveRef = useRef(true)
  const retryRef = useRef(0)
  const connectedOnce = useRef(false)
  const pathRef = useRef(pathname)
  pathRef.current = pathname
  const [popups, setPopups] = useState([])

  const fallbackTrack = () => {
    api
      .post("/api/track", {
        ...pagePayload(pathRef.current),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent || "" : "",
      })
      .catch(() => {})
  }

  useEffect(() => {
    aliveRef.current = true
    let retryTimer = null

    const schedule = () => {
      if (!aliveRef.current) return
      if (!connectedOnce.current) fallbackTrack()
      retryRef.current += 1
      const delay = Math.min(1000 * 2 ** retryRef.current, 30000)
      retryTimer = setTimeout(connect, delay)
    }

    const connect = () => {
      let socket
      try {
        socket = new WebSocket(wsUrl())
      } catch {
        schedule()
        return
      }
      wsRef.current = socket
      socket.onopen = () => {
        retryRef.current = 0
        connectedOnce.current = true
        try {
          socket.send(JSON.stringify({ t: "hello", ...pagePayload(pathRef.current) }))
        } catch {
          /* ignore */
        }
      }
      socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.t === "admin-popup" && msg.conversation_id && msg.text) {
            const id = msg.conversation_id
            setPopups((ps) => {
              if (ps.some((p) => p.conversation_id === id)) return ps
              return [...ps.slice(-2), { ...msg }]
            })
            setTimeout(() => {
              setPopups((ps) => ps.filter((p) => p.conversation_id !== id))
            }, 30000)
          }
        } catch {
          /* ignore */
        }
      }
      socket.onclose = () => {
        if (wsRef.current === socket) wsRef.current = null
        schedule()
      }
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
      aliveRef.current = false
      if (retryTimer) clearTimeout(retryTimer)
      try {
        wsRef.current?.close()
      } catch {
        /* ignore */
      }
      wsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Live page visit over the open socket on every route change.
  useEffect(() => {
    const ws = wsRef.current
    if (ws && ws.readyState === 1) {
      try {
        ws.send(JSON.stringify({ t: "page", ...pagePayload(pathname) }))
      } catch {
        /* ignore */
      }
    }
  }, [pathname])

  const dismiss = (id) => setPopups((ps) => ps.filter((p) => p.conversation_id !== id))

  const openChat = (id) => {
    window.dispatchEvent(new Event("td-open-chat"))
    dismiss(id)
  }

  return (
    <>
      {popups.length > 0 && (
        <div className="fixed bottom-28 right-6 z-[9980] flex w-[min(340px,calc(100vw-3rem))] flex-col gap-2">
          {popups.map((p) => (
            <div
              key={p.conversation_id}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
                <p className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                  {p.from || "Theo"}
                </p>
                <button
                  type="button"
                  onClick={() => dismiss(p.conversation_id)}
                  aria-label="Dismiss message"
                  className="rounded px-1.5 text-lg leading-none text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  ×
                </button>
              </div>
              <p className="whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {p.text}
              </p>
              <button
                type="button"
                onClick={() => openChat(p.conversation_id)}
                className="block w-full bg-zinc-950 py-2.5 text-center text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950"
              >
                Reply to Theo →
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}