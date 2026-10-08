import { inputClass, labelClass } from "./AdminLogin"

const TYPES = [
  { value: "p", label: "Paragraph" },
  { value: "h2", label: "Heading" },
  { value: "quote", label: "Quote" },
  { value: "ul", label: "List" },
]

function blankBlock(type = "p") {
  return type === "ul" ? { type, items: [""] } : { type, text: "" }
}

/** Structured editor for post body blocks (p / h2 / quote / ul). */
export default function BlocksEditor({ blocks, onChange }) {
  const list = Array.isArray(blocks) ? blocks : []

  const update = (i, patch) => {
    const next = list.map((b, j) => (j === i ? { ...b, ...patch } : b))
    onChange(next)
  }

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className={labelClass}>Body blocks ({list.length})</span>
        <div className="flex gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange([...list, blankBlock(t.value)])}
              className="rounded-md border border-zinc-300 px-2 py-1 font-mono text-[11px] text-zinc-600 hover:border-zinc-900 hover:text-white dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-400 dark:hover:text-zinc-100"
            >
              + {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {list.map((b, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center gap-2">
              <select
                value={b.type}
                onChange={(e) => {
                  const t = e.target.value
                  onChange(list.map((x, j) => (j === i ? blankBlock(t) : x)))
                }}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <span className="font-mono text-[11px] text-zinc-400">#{i + 1}</span>
              <span className="ml-auto flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded px-1.5 py-0.5 font-mono text-xs text-zinc-500 hover:bg-zinc-200 disabled:opacity-30 dark:hover:bg-zinc-800">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="rounded px-1.5 py-0.5 font-mono text-xs text-zinc-500 hover:bg-zinc-200 disabled:opacity-30 dark:hover:bg-zinc-800">↓</button>
                <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="rounded px-1.5 py-0.5 font-mono text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">✕</button>
              </span>
            </div>
            {b.type === "ul" ? (
              <textarea
                value={(b.items || []).join("\n")}
                onChange={(e) => update(i, { items: e.target.value.split("\n") })}
                rows={Math.max(2, (b.items || []).length + 1)}
                placeholder="One bullet per line"
                className={`${inputClass} mt-2`}
              />
            ) : (
              <textarea
                value={b.text || ""}
                onChange={(e) => update(i, { text: e.target.value })}
                rows={b.type === "h2" ? 1 : 3}
                placeholder={b.type === "h2" ? "Heading text" : b.type === "quote" ? "Quote text" : "Paragraph text"}
                className={`${inputClass} mt-2`}
              />
            )}
          </div>
        ))}
        {list.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-400 dark:border-zinc-700">
            No blocks yet — add a paragraph to start.
          </p>
        )}
      </div>
    </div>
  )
}
