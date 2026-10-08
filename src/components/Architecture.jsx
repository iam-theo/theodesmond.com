import { useState } from "react"
import Section from "./Section"
import { pipeline as defaultPipeline, architectureIntro as defaultArchitectureIntro } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"

const notes = {
  "Business Problem": "Start with the real constraint: what must change and why it matters.",
  "Product Strategy": "Define the outcome, the users, and the shape of the solution.",
  "System Architecture": "Design the boundaries, data flows and services before writing code.",
  "Technology Selection": "Choose the stack for longevity, not novelty.",
  "Implementation": "Build in layers — clean, testable, observable.",
  "Infrastructure": "Deploy, containerize, secure and harden for production.",
  "Monitoring": "Instrument everything. Know when it breaks before users do.",
  "Scale": "Design headroom: the system grows, the architecture doesn't crack.",
}

export default function Architecture({
  eyebrow = "05 · Engineering Philosophy",
  title = (
    <>
      I don&apos;t just build features.{" "}
      <span className="text-indigo-600 dark:text-indigo-400">I architect systems.</span>
    </>
  ),
}) {
  const [active, setActive] = useState(0)
  const content = useSiteContent()
  const pipeline = content?.pipeline ?? defaultPipeline
  const architectureIntro = content?.architectureIntro ?? defaultArchitectureIntro

  return (
    <Section id="architecture" eyebrow={eyebrow} title={title}>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        {architectureIntro}
      </p>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ol className="relative">
          <span className="absolute bottom-8 left-[21px] top-4 w-px bg-zinc-200 dark:bg-zinc-700" />
          {pipeline.map((stage, i) => (
            <li key={stage}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={`group relative flex w-full items-center gap-5 py-2.5 text-left transition-all ${
                  active === i ? "" : "opacity-70"
                }`}
              >
                <span
                  className={`relative z-10 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    active === i
                      ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-400 dark:text-zinc-950"
                      : "border-zinc-200 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
                  }`}
                >
                  <span className="font-mono text-xs font-semibold">0{i + 1}</span>
                </span>
                <span
                  className={`text-base font-semibold sm:text-lg ${
                    active === i
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {stage}
                </span>
              </button>
              {i < pipeline.length - 1 && (
                <span className="ml-[19px] flex h-4 items-center pl-1 font-mono text-xs text-zinc-300 dark:text-zinc-600">
                  ↓
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Stage {String(active + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {pipeline[active]}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {notes[pipeline[active]]}
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}
