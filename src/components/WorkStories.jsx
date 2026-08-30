import { Link } from "react-router-dom"
import Section from "./Section"
import { workStories } from "../data"

export default function WorkStories({
  eyebrow = "04 · The Work",
  title = "Turning ideas into systems.",
  intro = "Not a portfolio grid — proof of the philosophy. Each one started as a problem. Each one became a system.",
}) {
  return (
    <Section id="work" eyebrow={eyebrow} title={title}>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        {intro}
      </p>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {workStories.map((p, i) => (
          <article
            key={p.name}
            className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-8 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30 sm:p-10 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                  {p.tag}
                </span>
                <h3 className="mt-2 font-display text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                  {p.name}
                </h3>
              </div>
              <span className="font-mono text-sm text-zinc-300 dark:text-zinc-700">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>

            <dl className="mt-8 space-y-6">
              <div>
                <dt className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                  What it is
                </dt>
                <dd className="mt-2 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {p.what}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                  The problem it addresses
                </dt>
                <dd className="mt-2 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {p.problem}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                  My role
                </dt>
                <dd className="mt-2 leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {p.role}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap gap-2">
              {p.tech.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-zinc-200 px-3 py-1 font-mono text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                >
                  {t}
                </span>
              ))}
            </div>

            <Link
              to={p.link}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Explore {p.name}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-12">
        <Link
          to="/portfolio"
          className="group inline-flex items-center gap-3 rounded-full border border-zinc-200 px-6 py-3 font-semibold text-zinc-900 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-800 dark:text-zinc-100 dark:hover:border-indigo-500/50 dark:hover:text-indigo-400"
        >
          View all work
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </Section>
  )
}
