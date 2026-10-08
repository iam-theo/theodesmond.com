import { useEffect, useRef, useState } from "react"
import { api, getToken } from "../lib/api"

function wsUrl(token) {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${window.location.host}/live?role=admin&token=${encodeURIComponent(token)}`
}

/** Live visitor presence for the admin panel. Reconnects with backoff. */
export function useLiveVisitors() {
  const [online, setOnline] = useState(0)
  const [visitors, setVisitors] = useState([])
  const [connected, setConnected] = useState(false)
  const aliveRef = useRef(true)
  const retryRef = useRef(0)

  useEffect(() => {
    aliveRef.current = true
    let ws = null
    let retryTimer = null

    const schedule = () => {
      if (!aliveRef.current) return
      retryRef.current += 1
      retryTimer = setTimeout(
        connect,
        Math.min(1000 * 2 ** retryRef.current, 30000)
      )
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
      ws = socket
      socket.onopen = () => {
        retryRef.current = 0
        if (aliveRef.current) setConnected(true)
      }
      socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.t === "presence" && aliveRef.current) {
            setOnline(msg.online || 0)
            setVisitors(Array.isArray(msg.visitors) ? msg.visitors : [])
          }
        } catch {
          /* ignore */
        }
      }
      socket.onclose = () => {
        if (aliveRef.current) setConnected(false)
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
        ws?.close()
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Send a proactive message to a live visitor. Returns { conversation_id, delivered }. */
  const sendMessage = async (ip, text) => {
    const data = await api.post(
      `/api/admin/visitors/${encodeURIComponent(ip)}/message`,
      { text }
    )
    return data
  }

  return { online, visitors, connected, sendMessage }
}
