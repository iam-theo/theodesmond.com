import { useEffect, useMemo, useState } from "react"
import { EMOJIS, applyReaction, viewerKey } from "./commentUtils"
import { supabase, isSupabaseConfigured } from "../lib/supabase"

export default function PostReactions({ slug }) {
  const remote = isSupabaseConfigured
  const storageKey = `td-post-reactions-${slug}`

  const [local, setLocal] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : { reactions: {}, viewer: {} }
    } catch {
      return { reactions: {}, viewer: {} }
    }
  })
  const [rows, setRows] = useState([])
  const [picker, setPicker] = useState(false)

  useEffect(() => {
    if (remote) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(local))
    } catch {
      /* storage full / unavailable */
    }
  }, [remote, storageKey, local])

  useEffect(() => {
    if (!remote) return
    let channel

    const loadAll = async () => {
      const { data, error } = await supabase
        .from("post_reactions")
        .select("*")
        .eq("post_slug", slug)
      if (!error) setRows(data || [])
    }

    loadAll()

    channel = supabase
      .channel(`post-reactions-${slug}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post_reactions", filter: `post_slug=eq.${slug}` },
        loadAll
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "post_reactions", filter: `post_slug=eq.${slug}` },
        loadAll
      )
      .subscribe()

    return () => {
      channel?.unsubscribe()
    }
  }, [remote, slug])

  const state = useMemo(() => {
    if (!remote) return local

    const key = viewerKey()
    const reactions = {}
    const viewer = {}
    for (const r of rows) {
      reactions[r.emoji] = (reactions[r.emoji] || 0) + 1
      if (r.user_key === key) viewer[r.emoji] = key
    }
    return { reactions, viewer }
  }, [remote, local, rows])

  const react = async (emoji) => {
    const key = viewerKey()
    if (remote) {
      const { data } = await supabase
        .from("post_reactions")
        .select("id")
        .eq("post_slug", slug)
        .eq("emoji", emoji)
        .eq("user_key", key)
        .maybeSingle()
      if (data) {
        await supabase.from("post_reactions").delete().eq("id", data.id)
      } else {
        await supabase.from("post_reactions").delete().eq("post_slug", slug).eq("user_key", key)
        await supabase.from("post_reactions").insert({ post_slug: slug, emoji, user_key: key })
      }
      return
    }
    setLocal((s) => ({ ...s, ...applyReaction(s, emoji, key) }))
  }

  const total = Object.values(state.reactions || {}).reduce((a, b) => a + b, 0)
  const sorted = Object.entries(state.reactions || {}).sort((a, b) => b[1] - a[1])
  const mine = Object.keys(state.viewer || {})[0]
  const myLabel = EMOJIS.find((e) => e.emoji === mine)?.label

  return (
    <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          Did this land?
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {remote ? (
            <>
              Reactions are live — everyone sees them in real time.
            </>
          ) : (
            "React to this essay — it tells me what to write next."
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {total > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {sorted.slice(0, 3).map(([e]) => (
              <span key={e} className="text-sm leading-none">
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
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              mine
                ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/30"
                : "border border-zinc-300 bg-white text-zinc-700 hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
            }`}
          >
            {mine ? `${mine} ${myLabel}` : "👍 React"}
          </button>
          {picker && (
            <>
              <span className="fixed inset-0 z-10" onClick={() => setPicker(false)} />
              <span className="absolute bottom-full right-0 z-20 mb-2 flex gap-0.5 rounded-full border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {EMOJIS.map((e) => (
                  <button
                    key={e.emoji}
                    type="button"
                    onClick={() => {
                      react(e.emoji)
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
      </div>
    </div>
  )
}
