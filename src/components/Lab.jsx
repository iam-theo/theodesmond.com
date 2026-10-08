import Section from "./Section"
import { lab as defaultLab, statusColors, labIntro as defaultLabIntro } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"

export default function Lab({
  eyebrow = "09 · Technical Lab",
  title = "The Lab.",
}) {
  const content = useSiteContent()
  const lab = content?.lab ?? defaultLab
  const labIntro = content?.labIntro ?? defaultLabIntro
  return (
    <Section id="lab" eyebrow={eyebrow} title={title}>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        {labIntro}
      </p>

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
        {lab.map((item) => (
          <div
            key={item.name}
            className="group flex items-center justify-between gap-4 bg-white p-6 transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/60"
          >
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
            <span
              className={`inline-flex shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider ring-1 ${statusColors[item.status]}`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </Section>
  )
}
