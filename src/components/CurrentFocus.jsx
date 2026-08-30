import Section from "./Section"
import { currentFocus } from "../data"

export default function CurrentFocus({
  eyebrow = "06 · Current Focus",
  title = "What I'm building now.",
  updated = "Updated August 2026",
}) {
  return (
    <Section
      id="focus"
      eyebrow={eyebrow}
      title={title}
      className="bg-zinc-50 dark:bg-zinc-900/40"
    >
      <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-xs uppercase tracking-[0.15em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {updated}
      </p>

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 sm:grid-cols-3">
        {currentFocus.map((item, i) => (
          <div
            key={item.title}
            className="group bg-white p-8 transition-colors hover:bg-zinc-50 sm:p-10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            <span className="font-display text-3xl italic text-indigo-600/30 dark:text-indigo-400/30">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  )
}
