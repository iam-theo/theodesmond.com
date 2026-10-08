import { useEffect, useMemo, useState } from "react"
import { EMOJIS, applyReaction, viewerKey, maskEmail } from "./commentUtils"
import { api } from "../lib/api"

const avatarColors = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-zinc-500",
  "bg-zinc-500",
]

function colorFor(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997
  return avatarColors[h % avatarColors.length]
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function mapComment(list, id, fn) {
  return list.map((c) => {
    if (c.id === id) return fn(c)
    if (c.replies?.length) return { ...c, replies: mapComment(c.replies, id, fn) }
    return c
  })
}

function CommentForm({ label, compact = false, onSubmit }) {
  const [name, setName] = useState(() => localStorage.getItem("td-comment-name") || "")
  const [email, setEmail] = useState(() => localStorage.getItem("td-comment-email") || "")
  const [text, setText] = useState("")

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim() || !text.trim()) return
    localStorage.setItem("td-comment-name", name.trim())
    if (email.trim()) localStorage.setItem("td-comment-email", email.trim())
    onSubmit(name.trim(), text.trim(), email.trim() || null)
    setText("")
  }

  return (
    <form onSubmit={submit} className="flex gap-3">
      <span
        className={`hidden shrink-0 items-center justify-center rounded-full text-xs font-bold text-white sm:flex ${
          compact ? "h-8 w-8" : "h-9 w-9"
        } ${colorFor(name || "You")}`}
      >
        {initials(name || "You")}
      </span>
      <div className="min-w-0 flex-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-mono text-xs text-zinc-700 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email (optional — only to get notified of replies, never shown)"
          className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-mono text-xs text-zinc-700 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={compact ? 2 : 3}
          placeholder={label}
          className="mt-2 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={!name.trim() || !text.trim()}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Post
          </button>
        </div>
      </div>
    </form>
  )
}

function Comment({ comment, onReply, onReact }) {
  const [replying, setReplying] = useState(false)
  const [picker, setPicker] = useState(false)

  const total = Object.values(comment.reactions || {}).reduce((a, b) => a + b, 0)
  const sorted = Object.entries(comment.reactions || {}).sort((a, b) => b[1] - a[1])
  const mine = Object.keys(comment.viewer || {})[0]
  const myLabel = EMOJIS.find((e) => e.emoji === mine)?.label

  return (
    <div className="flex gap-3">
      <span
        className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${colorFor(
          comment.author
        )}`}
      >
        {initials(comment.author)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-2.5 dark:bg-zinc-800">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {comment.author}
          </p>
          {comment.email && (
            <p className="font-mono text-[10px] tracking-wide text-zinc-400 dark:text-zinc-500">
              {maskEmail(comment.email)}
            </p>
          )}
          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {comment.text}
          </p>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {total > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {sorted.slice(0, 3).map(([e]) => (
                <span key={e} className="text-xs leading-none">
                  {e}
                </span>
              ))}
              <span className="ml-0.5">{total}</span>
            </span>
          )}

          <span className="relative">
            <button
              type="button"
              onClick={() => setPicker((v) => !v)}
              className={`font-semibold transition-colors ${
                mine
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {mine ? `${mine} ${myLabel}` : "Like"}
            </button>
            {picker && (
              <>
                <span className="fixed inset-0 z-10" onClick={() => setPicker(false)} />
                <span className="absolute bottom-full left-0 z-20 mb-2 flex gap-0.5 rounded-full border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  {EMOJIS.map((e) => (
                    <button
                      key={e.emoji}
                      type="button"
                      onClick={() => {
                        onReact(comment.id, e.emoji)
                        setPicker(false)
                      }}
                      className="text-lg transition-transform hover:scale-125"
                      title={e.label}
                      aria-label={e.label}
                    >
                      {e.emoji}
                    </button>
                  ))}
                </span>
              </>
            )}
          </span>

          <button
            type="button"
            onClick={() => setReplying((v) => !v)}
            className="font-semibold text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Reply
          </button>
          <span className="text-zinc-400 dark:text-zinc-500">{timeAgo(comment.createdAt)}</span>
        </div>

        {replying && (
          <div className="mt-3">
            <CommentForm
              label="Write a reply..."
              compact
              onSubmit={(author, text, email) => {
                onReply(comment.id, author, text, email)
                setReplying(false)
              }}
            />
          </div>
        )}

        {comment.replies?.length > 0 && (
          <div className="mt-4 space-y-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
            {comment.replies.map((r) => (
              <Comment key={r.id} comment={r} onReply={onReply} onReact={onReact} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function countAll(nodes) {
  return nodes.reduce((n, c) => n + 1 + (c.replies?.length || 0), 0)
}

export default function Comments({ slug }) {
  const [mode, setMode] = useState("loading") // loading | remote | local
  const remote = mode === "remote"
  const storageKey = `td-comments-${slug}`

  const [localComments, setLocalComments] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [rows, setRows] = useState([])
  const [reactions, setReactions] = useState([])
  const [ready, setReady] = useState(!remote)

  useEffect(() => {
    if (remote) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(localComments))
    } catch {
      /* storage full / unavailable */
    }
  }, [remote, storageKey, localComments])

  useEffect(() => {
    let alive = true
    let timer

    const loadAll = async () => {
      try {
        const data = await api.get(`/api/comments?post_slug=${encodeURIComponent(slug)}`)
        if (!alive) return
        setRows(Array.isArray(data?.comments) ? data.comments : [])
        setReactions(Array.isArray(data?.reactions) ? data.reactions : [])
        setMode("remote")
        setReady(true)
      } catch {
        if (alive) {
          setMode("local")
          setReady(true)
        }
      }
    }

    loadAll()
    // Poll for new comments (replaces realtime channel).
    timer = setInterval(() => {
      if (document.visibilityState === "visible") loadAll()
    }, 15000)

    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [slug])

  const comments = useMemo(() => {
    if (!remote) return localComments

    const key = viewerKey()
    const counts = {}
    const viewer = {}
    for (const r of reactions) {
      counts[r.comment_id] = counts[r.comment_id] || {}
      counts[r.comment_id][r.emoji] = (counts[r.comment_id][r.emoji] || 0) + 1
      if (r.user_key === key) viewer[r.comment_id] = r.emoji
    }

    const nodes = rows.map((r) => ({
      id: r.id,
      parent_id: r.parent_id,
      author: r.author,
      email: r.email,
      text: r.text,
      createdAt: Date.parse(r.created_at),
      reactions: counts[r.id] || {},
      viewer: viewer[r.id] ? { [viewer[r.id]]: key } : {},
      replies: [],
    }))

    const map = new Map(nodes.map((n) => [n.id, n]))
    const roots = []
    for (const n of nodes) {
      if (n.parent_id && map.has(n.parent_id)) map.get(n.parent_id).replies.push(n)
      else roots.push(n)
    }
    return roots
  }, [remote, localComments, rows, reactions])

  const notifyReply = async (to, author, text) => {
    if (!to) return
    try {
      await api.post("/api/comments/notify", {
        to,
        reply_author: author,
        reply_text: text.slice(0, 400),
        post_slug: slug,
      })
    } catch {
      /* notifications are best-effort */
    }
  }

  const refresh = async () => {
    try {
      const data = await api.get(`/api/comments?post_slug=${encodeURIComponent(slug)}`)
      setRows(Array.isArray(data?.comments) ? data.comments : [])
      setReactions(Array.isArray(data?.reactions) ? data.reactions : [])
    } catch {
      /* ignore */
    }
  }

  const addComment = async (author, text, email = null) => {
    if (remote) {
      try {
        await api.post("/api/comments", { post_slug: slug, parent_id: null, author, text, email })
        refresh()
      } catch (err) {
        console.warn("Failed to post comment:", err.message)
      }
      return
    }
    const c = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      author,
      email,
      text,
      createdAt: Date.now(),
      reactions: {},
      viewer: {},
      replies: [],
    }
    setLocalComments((cs) => [c, ...cs])
  }

  const addReply = async (id, author, text, email = null) => {
    if (remote) {
      try {
        await api.post("/api/comments", { post_slug: slug, parent_id: id, author, text, email })
        const parent = rows.find((r) => r.id === id)
        notifyReply(parent?.email, author, text)
        refresh()
      } catch (err) {
        console.warn("Failed to post reply:", err.message)
      }
      return
    }
    const r = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      author,
      email,
      text,
      createdAt: Date.now(),
      reactions: {},
      viewer: {},
      replies: [],
    }
    setLocalComments((cs) =>
      mapComment(cs, id, (c) => ({ ...c, replies: [...(c.replies || []), r] }))
    )
  }

  const toggleReaction = async (commentId, emoji) => {
    const key = viewerKey()
    if (remote) {
      try {
        await api.post("/api/reactions/toggle", {
          scope: "comment",
          post_slug: slug,
          comment_id: commentId,
          emoji,
          user_key: key,
        })
        refresh()
      } catch {
        /* ignore */
      }
      return
    }
    setLocalComments((cs) =>
      mapComment(cs, commentId, (c) => ({ ...c, ...applyReaction(c, emoji, key) }))
    )
  }

  const count = countAll(comments)

  return (
    <section className="mt-16">
      <h2 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Comments <span className="text-zinc-400 dark:text-zinc-500">({count})</span>
        {remote && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
            Live
          </span>
        )}
      </h2>

      <div className="mt-8">
        <CommentForm label="What are your thoughts?" onSubmit={addComment} />
      </div>

      {remote && !ready ? (
        <p className="mt-10 font-mono text-xs text-zinc-400 dark:text-zinc-500">
          Loading comments…
        </p>
      ) : (
        comments.length > 0 && (
          <div className="mt-10 space-y-6">
            {comments.map((c) => (
              <Comment key={c.id} comment={c} onReply={addReply} onReact={toggleReaction} />
            ))}
          </div>
        )
      )}
    </section>
  )
}
