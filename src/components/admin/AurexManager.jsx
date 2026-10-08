import { useCallback, useEffect, useRef, useState } from "react"
import { api, getToken } from "../../lib/api"
import { inputClass, labelClass } from "./AdminLogin"

function timeAgo(ts) {
  const t = Date.parse(ts)
  if (Number.isNaN(t)) return ""
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(t).toLocaleDateString()
}

// ---------- lightweight markdown renderer (no deps, XSS-safe: React elements only) ----------
function inlineMd(text, keyPrefix) {
  const nodes = []
  const re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]]+\]\([^)\s]+\))/
  let k = 0
  // split with capture keeps delimiters; iterate manually
  const parts = String(text).split(re).filter((p) => p !== "")
  for (const part of parts) {
    const key = `${keyPrefix}-i${k++}`
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      nodes.push(<strong key={key} className="font-semibold text-white dark:text-zinc-50">{part.slice(2, -2)}</strong>)
    } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2 && !part.startsWith("**")) {
      nodes.push(<em key={key}>{part.slice(1, -1)}</em>)
    } else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      nodes.push(
        <code key={key} className="rounded bg-zinc-950/[0.07] px-1 py-0.5 font-mono text-[12px] text-white dark:bg-white/10 dark:text-zinc-100">
          {part.slice(1, -1)}
        </code>
      )
    } else if (part.startsWith("[")) {
      const lm = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
      if (lm) {
        nodes.push(
          <a key={key} href={lm[2]} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-500">
            {lm[1]}
          </a>
        )
      } else {
        nodes.push(<span key={key}>{part}</span>)
      }
    } else {
      nodes.push(<span key={key}>{part}</span>)
    }
  }
  return nodes
}

function Markdown({ text }) {
  const src = String(text || "")
  const blocks = []
  const lines = src.split("\n")
  let i = 0
  let key = 0
  let list = null // { ordered: bool, items: [] }
  const flushList = () => {
    if (!list) return
    const Tag = list.ordered ? "ol" : "ul"
    const cls = list.ordered
      ? "my-2 list-decimal space-y-1 pl-5"
      : "my-2 list-disc space-y-1 pl-5 marker:text-zinc-400"
    blocks.push(
      <Tag key={`b${key++}`} className={cls}>
        {list.items.map((it, n) => (
          <li key={n} className="leading-relaxed">{inlineMd(it, `b${key}-li${n}`)}</li>
        ))}
      </Tag>
    )
    list = null
  }
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim().startsWith("```")) {
      flushList()
      i++
      const buf = []
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i])
        i++
      }
      i++ // skip closing fence
      blocks.push(
        <pre key={`b${key++}`} className="my-2 overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-[12px] leading-relaxed text-zinc-100 dark:bg-black/60">
          <code>{buf.join("\n")}</code>
        </pre>
      )
      continue
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      flushList()
      const size =
        h[1].length === 1
          ? "text-[15px] font-bold"
          : h[1].length === 2
            ? "text-sm font-bold"
            : "text-[13px] font-bold"
      blocks.push(
        <p key={`b${key++}`} className={`mb-1 mt-3 first:mt-0 ${size} text-white dark:text-zinc-50`}>
          {inlineMd(h[2], `b${key}h`)}
        </p>
      )
      i++
      continue
    }
    const ul = line.match(/^\s*[-*]\s+(.*)$/)
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/)
    if (ul || ol) {
      const ordered = Boolean(ol)
      const item = (ul || ol)[1]
      if (!list || list.ordered !== ordered) {
        flushList()
        list = { ordered, items: [] }
      }
      list.items.push(item)
      i++
      continue
    }
    if (!line.trim()) {
      flushList()
      i++
      continue
    }
    flushList()
    blocks.push(
      <p key={`b${key++}`} className="my-1 leading-relaxed">
        {inlineMd(line, `b${key}p`)}
      </p>
    )
    i++
  }
  flushList()
  return <div className="min-w-0">{blocks}</div>
}

function QuestionCard({
  pending,
  qTab,
  setQTab,
  qAnswers,
  qCustom,
  setQCustom,
  qCustomEdit,
  setQCustomEdit,
  qSubmitting,
  qError,
  qSingle,
  pickOne,
  toggleQ,
  pickQCustom,
  submitQAnswers,
}) {
  const questions = pending.questions
  const confirm = !qSingle && qTab === questions.length
  const current = questions[qTab]
  const multi = current?.multiple === true
  const allowCustom = current?.custom !== false
  const currentAnswer = qAnswers[qTab] || []

  return (
    <div className="border-t border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-700 dark:text-amber-300">
        <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[11px] text-white">?</span>
        {qSingle ? "Aurex asks" : `Question ${Math.min(qTab + 1, questions.length)} of ${questions.length}`}
      </p>

      {!qSingle && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {questions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQTab(i)}
              className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${
                i === qTab
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                  : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {q.header}
              {(qAnswers[i] || []).length ? " ✓" : ""}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setQTab(questions.length)}
            className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${
              confirm
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            Confirm
          </button>
        </div>
      )}

      {!confirm ? (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-white dark:text-zinc-100">
            {current.question}
            {multi && <span className="text-zinc-500"> (select all that apply)</span>}
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {(current.options || []).map((o) => {
              const picked = currentAnswer.includes(o.label)
              return (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => (multi ? toggleQ(o.label) : pickOne(o.label))}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                    picked
                      ? "border-zinc-900 bg-zinc-900/5 dark:border-zinc-100 dark:bg-zinc-100/10"
                      : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                  }`}
                >
                  <span className="mt-0.5 text-sm">{multi ? (picked ? "☑" : "☐") : picked ? "◉" : "○"}</span>
                  <span>
                    <span className="block text-[13px] font-semibold text-white dark:text-zinc-100">{o.label}</span>
                    {o.description && (
                      <span className="mt-0.5 block text-xs text-zinc-500">{o.description}</span>
                    )}
                  </span>
                </button>
              )
            })}
            {allowCustom && (
              qCustomEdit ? (
                <div className="flex gap-2">
                  <input
                    value={qCustom[qTab] || ""}
                    onChange={(e) => setQCustom((prev) => prev.map((c, i) => (i === qTab ? e.target.value : c)))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        pickQCustom()
                      }
                    }}
                    placeholder="Type your own answer…"
                    autoFocus
                    className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                  <button type="button" onClick={pickQCustom} className="btn btn-primary shrink-0 !px-3 !py-2 !text-xs">
                    Use
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setQCustomEdit(true)}
                  className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-left text-xs text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:hover:text-zinc-200"
                >
                  ✎ Or write your own answer…
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">Your answers:</p>
          <ul className="mt-1 space-y-1">
            {questions.map((q, i) => (
              <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold">{q.header}:</span> {(qAnswers[i] || []).join(", ") || "—"}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => submitQAnswers()}
            disabled={qSubmitting}
            className="btn btn-primary mt-3"
          >
            {qSubmitting ? "Sending…" : "Send answers →"}
          </button>
        </div>
      )}
      {qError && <p className="mt-2 text-xs font-medium text-rose-600">{qError}</p>}
    </div>
  )
}

function FileNode({ node, depth, currentPath, onNavigate, onFileClick, onDelete }) {
  const [expanded, setExpanded] = useState(depth === 0)
  const [children, setChildren] = useState(null)
  const full = currentPath ? `${currentPath}/${node.name}` : node.name

  const toggle = async () => {
    if (!node.isDirectory) {
      onFileClick(full)
      return
    }
    if (expanded) {
      setExpanded(false)
      return
    }
    try {
      const data = await api.get(`/api/aurex/files?path=${encodeURIComponent(full)}`)
      setChildren(Array.isArray(data?.files) ? data.files : [])
      setExpanded(true)
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <button
          type="button"
          onClick={toggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span aria-hidden>{node.isDirectory ? (expanded ? "📂" : "📁") : "📄"}</span>
          <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">{node.name}</span>
        </button>
        {!node.isDirectory && (
          <button
            type="button"
            onClick={() => onDelete(full)}
            className="shrink-0 px-1 text-xs text-zinc-400 hover:text-rose-500"
            title={`Delete ${full}`}
          >
            🗑
          </button>
        )}
      </div>
      {expanded && node.isDirectory && (
        <div className="ml-4 border-l border-zinc-200 pl-1 dark:border-zinc-800">
          {children === null ? (
            <p className="px-2 py-1 font-mono text-[11px] text-zinc-400">…</p>
          ) : children.length === 0 ? (
            <p className="px-2 py-1 font-mono text-[11px] text-zinc-400">empty</p>
          ) : (
            children.map((c) => (
              <FileNode
                key={full + "/" + c.name}
                node={c}
                depth={depth + 1}
                currentPath={full}
                onNavigate={onNavigate}
                onFileClick={onFileClick}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

const TERMINAL_STATUSES = ["completed", "failed", "timeout", "cancelled"]

export default function AurexManager() {
  const [currentView, setCurrentView] = useState("files") // files | chat | terminal
  const [loading, setLoading] = useState(true)
  const [roots, setRoots] = useState([])
  const [editingFile, setEditingFile] = useState(null)
  const [fileContent, setFileContent] = useState("")
  const [dirty, setDirty] = useState(false)
  const [messages, setMessages] = useState([])
  const [prompt, setPrompt] = useState("")
  const [busy, setBusy] = useState(false)
  const [activity, setActivity] = useState("")
  const [runId, setRunId] = useState(() => {
    try {
      return localStorage.getItem("td-aurex-run") || null
    } catch {
      return null
    }
  })
  const [runStatus, setRunStatus] = useState(null)
  const [settling, setSettling] = useState(false)
  const [pendingQuestion, setPendingQuestion] = useState(null)
  const [qTab, setQTab] = useState(0)
  const [qAnswers, setQAnswers] = useState([])
  const [qCustom, setQCustom] = useState([])
  const [qCustomEdit, setQCustomEdit] = useState(false)
  const [qSubmitting, setQSubmitting] = useState(false)
  const [qError, setQError] = useState("")
  const [deploying, setDeploying] = useState(false)
  const [deployMsg, setDeployMsg] = useState("")
  const esRef = useRef(null)
  const seenSeq = useRef(new Set())
  const attachedId = useRef(null)
  const closeTimer = useRef(null)
  const [terminalInput, setTerminalInput] = useState("")
  const [terminalOutput, setTerminalOutput] = useState("")
  const [gitStatus, setGitStatus] = useState("")
  const [msg, setMsg] = useState("")
  const bottomRef = useRef(null)

  const loadRoots = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get("/api/aurex/files?path=")
      setRoots(Array.isArray(data?.files) ? data.files : [])
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    }
    setLoading(false)
  }, [])

  const loadGit = useCallback(async () => {
    try {
      const data = await api.get("/api/aurex/git/status")
      setGitStatus(data.stdout || data.error || "")
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadRoots()
    loadGit()
    document.title = "Aurex — Theo Desmond"
    return () => {
      try {
        esRef.current?.close()
      } catch {
        /* ignore */
      }
      try {
        clearTimeout(closeTimer.current)
      } catch {
        /* ignore */
      }
    }
  }, [loadRoots, loadGit])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, terminalOutput, pendingQuestion, activity])

  // Reattach to an in-flight run after reload.
  useEffect(() => {
    if (!runId) return
    let alive = true
    api
      .get(`/api/aurex/runs/${encodeURIComponent(runId)}`)
      .then((run) => {
        if (!alive) return
        setRunStatus(run.status || null)
        if (["queued", "running"].includes(run.status)) {
          setBusy(true)
          attachStream(runId)
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const readFile = async (path) => {
    try {
      const data = await api.get(`/api/aurex/files/read?path=${encodeURIComponent(path)}`)
      setEditingFile({ path: data.path })
      setFileContent(data.content || "")
      setDirty(false)
      setMsg("")
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    }
  }

  const saveFile = async () => {
    if (!editingFile) return
    setBusy(true)
    try {
      await api.post("/api/aurex/files/write", { path: editingFile.path, content: fileContent })
      setDirty(false)
      setMsg(`Saved ${editingFile.path}. Rebuild + redeploy to publish.`)
      loadGit()
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    }
    setBusy(false)
  }

  const newFile = async () => {
    const name = window.prompt("New file path (relative to site root, e.g. src/pages/NewPage.jsx):")
    if (!name) return
    setEditingFile({ path: name })
    setFileContent("")
    setDirty(true)
  }

  const deleteFile = async (path) => {
    if (!window.confirm(`Delete ${path}?`)) return
    try {
      await api.post("/api/aurex/files/delete", { path })
      if (editingFile?.path === path) {
        setEditingFile(null)
        setFileContent("")
      }
      loadRoots()
      loadGit()
      setMsg(`Deleted ${path}.`)
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    }
  }

  const eventText = (data) => {    if (!data || typeof data !== "object") return typeof data === "string" ? data : ""
    if (typeof data.text === "string") return data.text
    if (data.part && typeof data.part.text === "string") return data.part.text
    if (typeof data.content === "string") return data.content
    if (typeof data.message === "string") return data.message
    if (typeof data.error === "string") return data.error
    return ""
  }

  const toolLabel = (data) => {
    const part = data?.part || {}
    const name = part.tool || data?.name || "tool"
    if (name === "question") return "❓ preparing questions"
    const input = part.input || part.state?.input || {}
    const target =
      input.path || input.file || input.command || input.query || input.message || input.url || "";
    const short = String(target).split("\n")[0].slice(0, 80)
    return short ? `⚙ ${name} · ${short}` : `⚙ ${name}`
  }

  const isToolDone = (data) => {
    const st = data?.part?.state?.status
    return st === "completed" || st === "error"
  }

  const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const runIdRef = useRef(runId)
  runIdRef.current = runId
  const runStatusRef = useRef(runStatus)
  runStatusRef.current = runStatus

  // Late work arriving after a terminal status means the backend completed
  // early (idle timeout) while the agent kept going — show working again.
  // NOTE: must be declared before handleRunEvent — its deps array reads this
  // binding during render, so it has to be initialized first (TDZ otherwise).
  const markWorking = useCallback(() => {
    if (TERMINAL_STATUSES.includes(runStatusRef.current || "")) {
      setRunStatus("running")
    }
    setSettling(false)
  }, [])

  // Append to the open streaming bubble of the same role, or start a new one.
  const appendStream = useCallback((role, text) => {
    if (!text) return
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.role === role && last.stream) {
        return [...prev.slice(0, -1), { ...last, content: last.content + text }]
      }
      return [...prev, { id: uid(role[0]), role, content: text, stream: true }]
    })
  }, [])

  const finalizeStreams = useCallback(() => {
    setActivity("")
    setMessages((prev) => (prev.some((m) => m.stream) ? prev.map((m) => (m.stream ? { ...m, stream: false } : m)) : prev))
  }, [])

  const handleRunEvent = useCallback((evt) => {
    const type = evt.type || "message"
    const seq = evt.seq
    const id = (p) => `${p}-${seq ?? Date.now()}`
    if (type === "question") {
      const qs = Array.isArray(evt.data?.questions) ? evt.data.questions : []
      if (qs.length) {
        markWorking()
        setPendingQuestion({ requestId: evt.data.requestId || "", questions: qs })
        setQTab(0)
        setQAnswers(qs.map(() => []))
        setQCustom(qs.map(() => ""))
        setQCustomEdit(false)
        setQError("")
        // The run is waiting on the user, not working — unlock the input so
        // the user can answer or send a follow-up.
        setBusy(false)
        finalizeStreams()
      }
      return
    }
    if (type === "question_reply") {
      setPendingQuestion(null)
      setMessages((prev) => [...prev, { id: id("qr"), role: "activity", content: "✓ answered — Aurex resumed" }])
      setBusy(true)
      return
    }
    if (type === "error") {
      finalizeStreams()
      setMessages((prev) => [...prev, { id: id("e"), role: "assistant", content: `**Error:** ${eventText(evt.data)}` }])
      return
    }
    if (type === "tool") {
      markWorking()
      if (!isToolDone(evt.data)) {
        setActivity(`${toolLabel(evt.data)} …`)
        return
      }
      setActivity("")
      setMessages((prev) => [...prev, { id: id("t"), role: "activity", content: toolLabel(evt.data) }])
      return
    }
    if (type === "step_start") {
      markWorking()
      setActivity((prev) => prev || "Aurex is working…")
      return
    }
    if (type === "step_finish") return
    if (type === "system") {
      const text = eventText(evt.data)
      if (evt.status) setRunStatus(evt.status)
      // Never announce completion as a message: the backend can report
      // "completed" on session idle while the agent is still working. The
      // status pill + thinking indicator convey state instead.
      if (text && !/^agent run (completed|queued|running)$/i.test(text.trim())) {
        finalizeStreams()
        setMessages((prev) => [...prev, { id: id("sys"), role: "system", content: text }])
      }
      return
    }
    if (type === "message") {
      // Backend echoes chat messages. A user echo is not an answer — render
      // it as the user's own bubble (unless we already show it).
      const role = evt.data?.role
      const text = eventText(evt.data)
      if (!text) return
      if (role === "user") {
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last && last.role === "user" && last.content === text) return prev
          return [...prev, { id: id("u"), role: "user", content: text }]
        })
        return
      }
      markWorking()
      appendStream("assistant", text)
      return
    }
    if (type === "reasoning") {
      // Chain-of-thought is never shown — the answer speaks for itself.
      return
    }
    if (type === "image" || type === "artifact") {
      markWorking()
      const d = evt.data || {}
      const label = d.url || d.path || d.name || "generated file"
      setMessages((prev) => [...prev, { id: id("img"), role: "activity", content: `🖼 ${type}: ${label}` }])
      return
    }
    const text = eventText(evt.data)
    if (!text) return
    markWorking()
    appendStream("assistant", text)
  }, [appendStream, finalizeStreams, markWorking])

  const refreshRun = async (status) => {
    const id = runIdRef.current
    if (!id) return
    try {
      const run = await api.get(`/api/aurex/runs/${encodeURIComponent(id)}`)
      setRunStatus(run.status || status || null)
      const text = run.result || (run.error && (status === "failed" || run.status === "failed") ? `**Run failed:** ${run.error}` : "")
      if (text) {
        setMessages((prev) => {
          // The streamed answer already contains this — don't duplicate it.
          const lastA = [...prev].reverse().find((m) => m.role === "assistant")
          const head = text.slice(0, 120)
          if (lastA && head && lastA.content.includes(head)) return prev
          if (lastA && lastA.content.slice(-120) && text.includes(lastA.content.slice(-120))) return prev
          return [...prev, { id: `r-${id}-${Date.now()}`, role: "assistant", content: text }]
        })
      }
    } catch {
      /* ignore */
    }
  }

  const attachStream = (id) => {
    try {
      esRef.current?.close()
    } catch {
      /* ignore */
    }
    try {
      clearTimeout(closeTimer.current)
    } catch {
      /* ignore */
    }
    // Fresh run → fresh dedupe set. Same run (reconnect) → keep seqs so the
    // backend's history replay doesn't duplicate what we already show.
    if (attachedId.current !== id) {
      seenSeq.current = new Set()
      attachedId.current = id
    }
    const es = new EventSource(
      `/api/aurex/runs/${encodeURIComponent(id)}/events?token=${encodeURIComponent(getToken())}`
    )
    esRef.current = es
    es.addEventListener("event", (e) => {
      try {
        const evt = JSON.parse(e.data)
        if (evt.seq != null) {
          if (seenSeq.current.has(evt.seq)) return
          seenSeq.current.add(evt.seq)
        }
        handleRunEvent(evt)
      } catch {
        /* ignore */
      }
    })
    es.addEventListener("run", (e) => {
      try {
        const st = JSON.parse(e.data)
        if (st.status) {
          setRunStatus(st.status)
          if (TERMINAL_STATUSES.includes(st.status)) {
            setBusy(false)
            finalizeStreams()
            refreshRun(st.status)
            // Terminal status may be premature (idle-timeout completion while
            // the agent keeps working). Show "finishing" — not "completed" —
            // until the grace window passes with no further work.
            setSettling(true)
            // Don't slam the stream shut: the backend can emit late events
            // (e.g. a question) after an idle-timeout "completed". Stay
            // subscribed a while longer so those still surface.
            try {
              clearTimeout(closeTimer.current)
            } catch {
              /* ignore */
            }
            closeTimer.current = setTimeout(() => {
              setSettling(false)
              try {
                if (esRef.current === es) es.close()
              } catch {
                /* ignore */
              }
            }, 120000)
          }
        }
      } catch {
        /* ignore */
      }
    })
    // Intentionally no es.close() here: EventSource auto-reconnects on
    // transient drops, and the seq dedupe above makes the replay safe.
    es.onerror = () => {
      setActivity((prev) => prev || "Reconnecting…")
    }
  }

  const sendChat = async (e) => {
    e?.preventDefault()
    const text = prompt.trim()
    if (!text || busy) return
    setPrompt("")
    setBusy(true)
    try {
      if (runId && ["queued", "running"].includes(runStatus || "")) {
        // Follow-up on the live run. Unlock the input right away — the run
        // stays live and new events keep streaming in.
        setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }])
        await api.post(`/api/aurex/runs/${encodeURIComponent(runId)}/messages`, { text })
        setBusy(false)
      } else {
        setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }])
        const data = await api.post("/api/aurex/chat", { message: text })
        if (data.runId) {
          setRunId(data.runId)
          runIdRef.current = data.runId
          try {
            localStorage.setItem("td-aurex-run", data.runId)
          } catch {
            /* ignore */
          }
          setRunStatus(data.status || "queued")
          attachStream(data.runId)
        } else {
          setBusy(false)
        }
      }
    } catch (err) {
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: "assistant", content: `**Error:** ${err.message}` }])
      setBusy(false)
    }
  }

  const newTask = () => {
    try {
      esRef.current?.close()
    } catch {
      /* ignore */
    }
    try {
      clearTimeout(closeTimer.current)
    } catch {
      /* ignore */
    }
    setRunId(null)
    runIdRef.current = null
    attachedId.current = null
    seenSeq.current = new Set()
    setRunStatus(null)
    setSettling(false)
    setMessages([])
    setPendingQuestion(null)
    setActivity("")
    setBusy(false)
    try {
      localStorage.removeItem("td-aurex-run")
    } catch {
      /* ignore */
    }
  }

  const qSingle = (pendingQuestion?.questions?.length || 0) === 1 && pendingQuestion.questions[0].multiple !== true

  const pickOne = (label) => {
    if (!pendingQuestion) return
    const next = pendingQuestion.questions.map((_, i) => (i === qTab ? [label] : qAnswers[i] || []))
    if (qSingle) {
      void submitQAnswers(next)
    } else {
      setQAnswers(next)
      setQTab((t) => Math.min(t + 1, pendingQuestion.questions.length))
    }
  }

  const toggleQ = (label) => {
    setQAnswers((prev) => {
      const next = prev.map((a) => [...a])
      const cur = next[qTab] || []
      const i = cur.indexOf(label)
      if (i === -1) cur.push(label)
      else cur.splice(i, 1)
      next[qTab] = cur
      return next
    })
  }

  const pickQCustom = () => {
    const text = (qCustom[qTab] || "").trim()
    if (!text || !pendingQuestion) return
    const next = pendingQuestion.questions.map((_, i) => (i === qTab ? [text] : qAnswers[i] || []))
    setQCustom((prev) => prev.map((c, i) => (i === qTab ? text : c)))
    setQCustomEdit(false)
    if (qSingle) void submitQAnswers(next)
    else {
      setQAnswers(next)
      setQTab((t) => Math.min(t + 1, pendingQuestion.questions.length))
    }
  }

  const submitQAnswers = async (ans) => {
    if (!pendingQuestion || !runId || qSubmitting) return
    const answers = (ans || qAnswers).map((a) => [...a])
    if (answers.some((a) => a.length === 0)) return
    setQSubmitting(true)
    setQError("")
    try {
      await api.post(`/api/aurex/runs/${encodeURIComponent(runId)}/questions`, {
        requestId: pendingQuestion.requestId,
        answers,
      })
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "user", content: answers.map((a) => a.join(", ")).join(" / ") },
      ])
      setPendingQuestion(null)
    } catch (err) {
      setQError(err.message)
    }
    setQSubmitting(false)
  }

  const deploySite = async () => {
    if (deploying) return
    setDeploying(true)
    setDeployMsg("Rebuilding the site… (install + vite build, a few minutes)")
    try {
      const r = await api.post("/api/aurex/deploy", {})
      setDeployMsg(
        r.ok
          ? `✅ Live in ${r.seconds}s — you got a push + email too.`
          : `❌ Deploy failed. ${String(r.log || "").slice(-500)}`
      )
    } catch (err) {
      setDeployMsg(err.status === 409 ? "A deploy is already running." : `Error: ${err.message}`)
    }
    setDeploying(false)
  }

  const abortRun = async () => {
    if (!runId) return
    try {
      await api.post(`/api/aurex/runs/${encodeURIComponent(runId)}/abort`, {})
    } catch {
      /* ignore */
    }
    setBusy(false)
  }

  const runCommand = async (command) => {
    const cmd = (command ?? terminalInput).trim()
    if (!cmd) return
    setTerminalInput("")
    setTerminalOutput((prev) => `${prev}\n$ ${cmd}\n`)
    try {
      const r = await api.post("/api/aurex/terminal", { command: cmd })
      setTerminalOutput((prev) => `${prev}${r.stdout || ""}${r.stderr ? `\n${r.stderr}` : ""}`)
    } catch (err) {
      setTerminalOutput((prev) => `${prev}\nError: ${err.message}\n`)
    }
  }

  const commit = async () => {
    const message = window.prompt("Commit message:")
    if (!message) return
    setBusy(true)
    try {
      const r = await api.post("/api/aurex/git/commit", { message })
      setMsg(r.success ? `Committed ${r.hash?.slice(0, 7)}. Redeploy to publish.` : `Commit failed: ${r.error}`)
      loadGit()
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    }
    setBusy(false)
  }

  const tabs = [
    { id: "files", label: "Files" },
    { id: "chat", label: "Chat" },
    { id: "terminal", label: "Terminal" },
  ]

  const runActive = ["queued", "running"].includes(runStatus || "")

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setCurrentView(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              currentView === t.id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto hidden font-mono text-[11px] text-zinc-400 sm:block">
          workspace: theodesmond.com (live site files)
        </span>
      </div>

      {msg && <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{msg}</p>}

      {currentView === "files" && (
        <div className="mt-4 grid gap-4 lg:h-[calc(100dvh-300px)] lg:min-h-[480px] lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-3 lg:max-h-none dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className={labelClass}>Site files</p>
              <button
                type="button"
                onClick={newFile}
                className="rounded-md border border-zinc-300 px-2 py-1 font-mono text-[11px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
              >
                + file
              </button>
            </div>
            {loading ? (
              <p className="px-2 text-sm text-zinc-500">Loading…</p>
            ) : (
              roots.map((n) => (
                <FileNode
                  key={n.name}
                  node={n}
                  depth={0}
                  currentPath=""
                  onNavigate={() => {}}
                  onFileClick={readFile}
                  onDelete={deleteFile}
                />
              ))
            )}
            {gitStatus && (
              <div className="mt-3 border-t border-zinc-200 px-1 pt-3 dark:border-zinc-800">
                <p className={labelClass}>Git changes</p>
                <pre className="max-h-32 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                  {gitStatus}
                </pre>
                <button
                  type="button"
                  onClick={commit}
                  disabled={busy}
                  className="mt-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
                >
                  Commit…
                </button>
              </div>
            )}
          </div>

          <div className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:min-h-0 dark:border-zinc-800 dark:bg-zinc-900">
            {!editingFile ? (
              <div className="flex flex-1 items-center justify-center p-8">
                <p className="text-center text-sm text-zinc-500">
                  Pick a file to read and edit it here.
                  <br />
                  Saving writes straight into the live codebase — rebuild + redeploy to publish.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
                  <p className="truncate font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {editingFile.path}
                    {dirty && <span className="ml-2 text-amber-600">● unsaved</span>}
                  </p>
                  <button type="button" onClick={saveFile} disabled={busy || !dirty} className="btn btn-primary !px-4 !py-1.5 !text-xs">
                    {busy ? "Saving…" : "Save file"}
                  </button>
                </div>
                <textarea
                  value={fileContent}
                  onChange={(e) => {
                    setFileContent(e.target.value)
                    setDirty(true)
                  }}
                  rows={24}
                  spellCheck={false}
                  className="w-full flex-1 resize-y bg-white p-4 font-mono text-xs leading-relaxed text-zinc-900 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
                />
              </>
            )}
          </div>
        </div>
      )}

      {currentView === "chat" && (
        <div className="mt-4 flex h-[calc(100dvh-300px)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
              <span className={`h-1.5 w-1.5 rounded-full ${runActive || settling ? "animate-pulse bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
              {runId ? `run ${settling ? "finishing…" : runStatus || "…"}` : "no active run"}
            </span>
            {runId && (
              <>
                <button
                  type="button"
                  onClick={newTask}
                  className="rounded-md border border-zinc-300 px-2 py-1 font-mono text-[11px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                >
                  + new task
                </button>
                <button
                  type="button"
                  onClick={deploySite}
                  disabled={deploying}
                  title="Rebuild the site and put it live, then notify you"
                  className="rounded-md bg-zinc-900 px-2 py-1 font-mono text-[11px] font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
                >
                  {deploying ? "deploying…" : "▲ build & deploy live"}
                </button>
                {runActive && (
                  <button
                    type="button"
                    onClick={abortRun}
                    className="rounded-md border border-rose-300 px-2 py-1 font-mono text-[11px] text-rose-600 dark:border-rose-500/40"
                  >
                    abort
                  </button>
                )}
              </>
            )}
            <span className="ml-auto hidden font-mono text-[11px] text-zinc-400 sm:block">
              works in /root/theodesmond.com on the server
            </span>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
            {messages.length === 0 && (
              <p className="rounded-xl bg-zinc-100 p-4 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Ask Aurex to read, edit, debug or extend the site — e.g. “change the hero headline”, “find where the subscribe form posts”, “add a testimonials section to About”.
              </p>
            )}
            {deployMsg && (
              <p className="border-b border-zinc-200 px-4 py-2 font-mono text-[11px] text-zinc-500 dark:border-zinc-800">
                {deployMsg}
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-zinc-950 px-3.5 py-2.5 text-sm leading-relaxed text-white dark:bg-zinc-100 dark:text-zinc-950">
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                ) : m.role === "activity" ? (
                  <p className="font-mono text-[11px] text-zinc-400">{m.content}</p>
                ) : m.role === "system" ? (
                  <p className="w-full text-center font-mono text-[11px] text-zinc-400">— {m.content} —</p>
                ) : (
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-zinc-100 px-3.5 py-2.5 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    <Markdown text={m.content} />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {(runActive || settling || activity) && (
            <div className="flex items-center gap-2 px-5 pb-2 pt-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <p className="font-mono text-[11px] text-zinc-500">
                Thinking<span className="animate-think">...</span>
                {activity && activity !== "Reconnecting…" ? <span className="text-zinc-400"> — {activity}</span> : null}
              </p>
            </div>
          )}
          {pendingQuestion && (
            <QuestionCard
              pending={pendingQuestion}
              qTab={qTab}
              setQTab={setQTab}
              qAnswers={qAnswers}
              qCustom={qCustom}
              setQCustom={setQCustom}
              qCustomEdit={qCustomEdit}
              setQCustomEdit={setQCustomEdit}
              qSubmitting={qSubmitting}
              qError={qError}
              qSingle={qSingle}
              pickOne={pickOne}
              toggleQ={toggleQ}
              pickQCustom={pickQCustom}
              submitQAnswers={submitQAnswers}
            />
          )}
          <form onSubmit={sendChat} className="flex items-end gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Aurex to change the site…"
              className={inputClass}
            />
            <button type="submit" disabled={busy || !prompt.trim()} className="btn btn-primary shrink-0">
              {busy ? "…" : "Send →"}
            </button>
          </form>
        </div>
      )}

      {currentView === "terminal" && (
        <div className="mt-4 flex h-[calc(100dvh-300px)] min-h-[380px] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed">
            <p className="text-zinc-500"># commands run inside the live site directory</p>
            <pre className="whitespace-pre-wrap text-zinc-200">{terminalOutput}</pre>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              runCommand()
            }}
            className="flex items-center gap-2 border-t border-zinc-800 p-3"
          >
            <span className="font-mono text-emerald-400">➜</span>
            <input
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="npm run lint, git status, ls src/pages…"
              className="w-full bg-transparent font-mono text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
          </form>
        </div>
      )}
    </div>
  )
}
