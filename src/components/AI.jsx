import { useEffect, useRef, useState } from "react"
import Section from "./Section"
import { aiCapabilities as defaultAiCapabilities, aiIntro as defaultAiIntro } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"

const lines = [
  { type: "cmd", text: "aurex run --agent architect --task \"scaffold payments core\"" },
  { type: "out", text: "› loading workspace ..." },
  { type: "out", text: "› reasoning over schema (postgres · 14 tables)" },
  { type: "ok", text: "✓ generated wallet, ledger, routing modules" },
  { type: "out", text: "› executing sandboxed build ..." },
  { type: "ok", text: "✓ 42 tests passing · build clean · deployed to staging" },
  { type: "out", text: "done in 12.4s" },
  { type: "cursor", text: "" },
]

function Terminal() {
  const [visible, setVisible] = useState(0)
  const [typing, setTyping] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    const current = lines[Math.min(visible, lines.length - 1)]
    if (current.type === "cmd") {
      if (typing < current.text.length) {
        timerRef.current = setTimeout(() => setTyping((t) => t + 1), 22)
      } else {
        timerRef.current = setTimeout(() => {
          setTyping(0)
          setVisible((v) => v + 1)
        }, 350)
      }
    } else if (visible < lines.length) {
      timerRef.current = setTimeout(() => setVisible((v) => v + 1), 280)
    }
    return () => clearTimeout(timerRef.current)
  }, [visible, typing])

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3.5">
        <span className="h-3 w-3 rounded-full bg-zinc-600" />
        <span className="h-3 w-3 rounded-full bg-zinc-400" />
        <span className="h-3 w-3 rounded-full bg-zinc-500" />
        <span className="ml-3 font-mono text-xs text-zinc-500">aurex — ai execution</span>
      </div>
      <div className="h-[320px] space-y-2 overflow-y-auto p-6 font-mono text-[13px] leading-relaxed">
        {lines.slice(0, visible).map((line, i) => {
          if (line.type === "cmd") {
            return (
              <p key={i} className="flex flex-wrap gap-x-3 text-zinc-300">
                <span className="select-none text-emerald-400">➜</span>
                <span>
                  {line.text.slice(0, typing)}
                  <span className="animate-pulse text-emerald-400">▋</span>
                </span>
              </p>
            )
          }
          if (line.type === "ok") {
            return (
              <p key={i} className="text-emerald-400">
                {line.text}
              </p>
            )
          }
          return (
            <p key={i} className="text-zinc-400">
              {line.text}
            </p>
          )
        })}
      </div>
    </div>
  )
}

export default function AI({
  eyebrow = "06 · AI & The Future",
  title = (
    <>
      Building with AI, <span className="text-indigo-600 dark:text-indigo-400">not just using AI.</span>
    </>
  ),
}) {
  const content = useSiteContent()
  const aiCapabilities = content?.aiCapabilities ?? defaultAiCapabilities
  const aiIntro = content?.aiIntro ?? defaultAiIntro
  return (
    <Section id="ai" eyebrow={eyebrow} title={title}>
      <div className="mt-12 grid items-start gap-12 lg:grid-cols-2">
        <div>
          <ul className="grid gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 sm:grid-cols-2">
            {aiCapabilities.map((cap) => (
              <li
                key={cap}
                className="flex items-center gap-3 bg-white px-5 py-4 text-sm font-medium text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <span className="flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-indigo-500 dark:bg-indigo-400" />
                {cap}
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {aiIntro}
          </p>
        </div>

        <Terminal />
      </div>
    </Section>
  )
}
