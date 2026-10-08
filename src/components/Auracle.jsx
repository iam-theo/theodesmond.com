import { Link } from "react-router-dom"
import Section from "./Section"
import { auracle as defaultAuracle } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"

export default function Auracle({
  eyebrow = "The Technology Company",
  title = "Auracle Technologies",
}) {
  const content = useSiteContent()
  const auracle = content?.auracle ?? defaultAuracle
  return (
    <Section id="auracle" eyebrow={eyebrow} title={title}>
      <p className="mt-6 max-w-2xl text-xl font-bold text-indigo-600 dark:text-indigo-400">
        {auracle.tagline}
      </p>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        {auracle.mission}
      </p>

      <div className="mt-14">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          The Ecosystem
        </p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-10 dark:border-zinc-800 dark:bg-zinc-900 sm:px-12 sm:py-14">
          <div className="mx-auto max-w-md rounded-xl border border-indigo-200 bg-white px-8 py-6 text-center shadow-sm dark:border-indigo-500/30 dark:bg-zinc-900">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">
              Auracle
            </p>
            <p className="mt-1 text-lg font-bold text-white dark:text-zinc-100">Ecosystem</p>
          </div>

          <div className="mx-auto h-8 w-px bg-zinc-300 dark:bg-zinc-700" />
          <div className="relative h-px w-full">
            <span className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-zinc-300 dark:bg-zinc-700" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3">
            {auracle.ecosystem.map((e) => (
              <span key={e.name} className="mx-auto h-8 w-px bg-zinc-300 dark:bg-zinc-700" />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {auracle.ecosystem.map((e) => (
              <div
                key={e.name}
                className="rounded-xl border border-zinc-200 bg-white p-6 text-center transition-all hover:-translate-y-0.5 hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/60"
              >
                <p className="text-base font-bold text-white dark:text-zinc-100">{e.name}</p>
                <span className="mt-2 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  {e.domain}
                </span>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-14">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          Products & Platforms
        </p>
        <ul className="mt-6 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {auracle.products.map((p) => (
            <li
              key={p.name}
              className="flex flex-wrap items-center gap-x-6 gap-y-1.5 py-5"
            >
              <span className="min-w-36 text-base font-bold text-white dark:text-zinc-100">
                {p.name}
              </span>
              <span className="rounded-md bg-zinc-100 px-2.5 py-1 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {p.tag}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{p.desc}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <Link to="/portfolio" className="btn btn-primary">
          Explore Auracle
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </Section>
  )
}
