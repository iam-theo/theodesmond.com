import Section from "./Section"
import { beliefs as defaultBeliefs } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"

export default function Beliefs({
  eyebrow = "03 · What I Believe",
  title = "What I believe.",
}) {
  const content = useSiteContent()
  const beliefs = content?.beliefs ?? defaultBeliefs
  return (
    <Section
      id="beliefs"
      eyebrow={eyebrow}
      title={title}
      className="bg-zinc-50 dark:bg-zinc-900/40"
    >
      <div className="mt-14 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        {beliefs.map((b, i) => (
          <div
            key={b.title}
            className={`grid gap-4 p-8 sm:grid-cols-[3.5rem_1fr] sm:items-baseline sm:gap-8 sm:p-10 ${
              i > 0
                ? "border-t border-zinc-200 dark:border-zinc-800"
                : ""
            } hover:bg-white transition-colors dark:hover:bg-zinc-900`}
          >
            <span className="font-display text-3xl italic text-indigo-600/30 dark:text-indigo-400/30">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {b.title}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {b.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
