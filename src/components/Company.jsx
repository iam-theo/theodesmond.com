import Section from "./Section"
import { company as defaultCompany } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"

export default function Company({
  eyebrow = "The Business",
  title = "TD Nwogu Global Enterprise",
}) {
  const content = useSiteContent()
  const company = content?.company ?? defaultCompany
  return (
    <Section id="company" eyebrow={eyebrow} title={title}>
      <div className="mt-12 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-6 bg-indigo-950 px-8 py-10 sm:px-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-300">
              {company.type}
            </p>
            <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{company.name}</h3>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 ring-1 ring-emerald-400/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-xs font-semibold text-emerald-300">
              {company.registration}
            </span>
          </span>
        </div>

        <div className="grid gap-10 bg-white p-8 sm:p-10 dark:bg-zinc-900 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              {company.mission}
            </p>
            <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
              {company.stats.map((s) => (
                <div
                  key={s.value}
                  className="bg-white p-4 text-center dark:bg-zinc-900"
                >
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {s.value}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Areas of activity
            </p>
            <ul className="mt-5 space-y-2.5">
              {company.services.map((s) => (
                <li
                  key={s}
                  className="flex items-center gap-3 text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  <span className="h-1 w-1 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  )
}
