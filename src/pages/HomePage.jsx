import { Link } from "react-router-dom"
import Hero from "../components/Hero"
import ProjectCard from "../components/ProjectCard"
import Testimonials from "../components/Testimonials"
import Reveal from "../components/Reveal"
import Counter from "../components/Counter"
import { products, companies } from "../data"

const metrics = [
  { value: 2, suffix: "", label: "Companies / Ventures" },
  { value: 4, suffix: "", label: "Flagship products" },
  { value: 3, suffix: "+", label: "Years building" },
  { value: 8, suffix: "", label: "Stages owned end-to-end" },
]

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="border-t border-zinc-100 py-24 sm:py-32 dark:border-zinc-800">
        <div className="layout">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:items-center">
            <Reveal>
              <p className="eyebrow">The Ventures</p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
                Two entities. One mission.
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                A business venture and a technology company — the foundation everything else
                is built on.
              </p>
              <Link
                to="/ventures"
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Explore the ventures <span>→</span>
              </Link>
            </Reveal>
            <Reveal delay={120}>
              <div className="grid gap-4 sm:grid-cols-2">
                {companies.map((c) => (
                  <Link
                    key={c.name}
                    to={c.link}
                    className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/60"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {c.role}
                    </p>
                    <p className="mt-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {c.name}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {c.desc}
                    </p>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-100 py-24 sm:py-32 dark:border-zinc-800">
        <div className="layout">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Selected Work</p>
                <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
                  A built / building ecosystem.
                </h2>
              </div>
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 transition-colors hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400"
              >
                View all projects <span>→</span>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {products.slice(0, 2).map((p) => (
                <ProjectCard key={p.name} project={p} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-zinc-100 bg-zinc-50 py-24 sm:py-32 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="layout">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <Reveal>
              <p className="eyebrow">What I Do</p>
              <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
                From product strategy to production infrastructure.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <div>
                <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Product architecture, full-stack engineering, AI systems, FinTech
                  infrastructure, technology strategy and product leadership — one person
                  who can take an idea from whiteboard to deployed, scaled system.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link to="/about" className="btn btn-primary">
                    More about how I work
                  </Link>
                  <Link to="/portfolio" className="btn btn-secondary">
                    See the projects
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Testimonials />

      <section className="border-t border-zinc-100 py-24 sm:py-32 dark:border-zinc-800">
        <div className="layout">
          <Reveal>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 lg:grid-cols-4">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="bg-white p-6 text-center transition-colors hover:bg-zinc-50 sm:p-10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  <Counter
                    value={m.value}
                    suffix={m.suffix}
                    className="font-display text-4xl font-semibold italic text-indigo-600 dark:text-indigo-400 sm:text-5xl"
                  />
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-zinc-100 py-24 sm:py-32 dark:border-zinc-800">
        <div className="layout">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-10 rounded-3xl bg-indigo-950 p-8 ring-1 ring-indigo-900 sm:p-12 lg:flex-row lg:items-center lg:p-16">
              <div className="max-w-xl">
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                  Have a problem worth building?
                </h2>
                <p className="mt-5 text-base leading-relaxed text-indigo-200">
                  Ambitious products, complex engineering, measurable impact. Let&apos;s
                  start a conversation.
                </p>
              </div>
              <Link
                to="/contact"
                className="btn group bg-white text-indigo-950 hover:bg-indigo-100"
              >
                Work With Theo
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
