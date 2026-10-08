import { Link, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import ProductVisual from "../components/ProductVisual"
import Reveal from "../components/Reveal"
import Seo from "../components/Seo"
import { pageMeta } from "../lib/seo"
import { fetchProduct, fetchProducts } from "../lib/content"

const accents = {
  indigo: {
    number: "text-indigo-600 dark:text-indigo-400",
    panel: "from-indigo-600/15 via-indigo-500/5 to-transparent",
    dot: "bg-indigo-500",
    label: "text-indigo-600 dark:text-indigo-400",
  },
  emerald: {
    number: "text-emerald-600 dark:text-emerald-400",
    panel: "from-emerald-600/15 via-emerald-500/5 to-transparent",
    dot: "bg-emerald-500",
    label: "text-emerald-600 dark:text-emerald-400",
  },
  sky: {
    number: "text-sky-600 dark:text-sky-400",
    panel: "from-sky-600/15 via-sky-500/5 to-transparent",
    dot: "bg-sky-500",
    label: "text-sky-600 dark:text-sky-400",
  },
  violet: {
    number: "text-violet-600 dark:text-violet-400",
    panel: "from-violet-600/15 via-violet-500/5 to-transparent",
    dot: "bg-violet-500",
    label: "text-violet-600 dark:text-violet-400",
  },
  rose: {
    number: "text-rose-600 dark:text-rose-400",
    panel: "from-rose-600/15 via-rose-500/5 to-transparent",
    dot: "bg-rose-500",
    label: "text-rose-600 dark:text-rose-400",
  },
  amber: {
    number: "text-amber-600 dark:text-amber-400",
    panel: "from-amber-600/15 via-amber-500/5 to-transparent",
    dot: "bg-amber-500",
    label: "text-amber-600 dark:text-amber-400",
  },
}

function Fact({ label, children }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium leading-relaxed text-white dark:text-zinc-100">
        {children}
      </p>
    </div>
  )
}

export default function ProjectPage() {
  const { slug } = useParams()
  const [project, setProject] = useState(null)
  const [others, setOthers] = useState([])

  useEffect(() => {
    let alive = true
    fetchProduct(slug).then((p) => {
      if (alive) setProject(p)
    })
    fetchProducts().then((all) => {
      if (alive) setOthers(all.filter((p) => p.slug !== slug).slice(0, 3))
    })
    return () => {
      alive = false
    }
  }, [slug])

  if (!project) {
    return (
      <section className="layout flex min-h-[50vh] flex-col items-center justify-center pt-32 text-center">
        <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">Product not found.</p>
        <Link
          to="/portfolio"
          className="mt-4 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← Back to the portfolio
        </Link>
      </section>
    )
  }

  const a = accents[project.accent] || accents.indigo
  const baseMeta = pageMeta("/portfolio")
  const meta = {
    title: `${project.name} — ${project.category}`,
    description: project.seoDesc || project.details || baseMeta.description,
    keywords: [project.category, project.industry, ...baseMeta.keywords],
    path: `/portfolio/${project.slug}`,
    ogType: "website",
  }

  return (
    <article>
      <Seo {...meta} />
      <header className="layout pt-32 sm:pt-40">
        <Link
          to="/portfolio"
          className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
        >
          <span aria-hidden>←</span> Back to the portfolio
        </Link>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end lg:gap-20">
          <div className="max-w-4xl">
            <p className={`font-mono text-xs uppercase tracking-[0.2em] ${a.label}`}>
              {project.category}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white dark:text-zinc-50 sm:text-5xl lg:text-6xl">
              {project.name}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              {project.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end lg:pb-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 font-mono text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              <span className={`h-1.5 w-1.5 rounded-full ${project.status === "LIVE" ? "bg-emerald-500" : a.dot}`} />
              {project.status}
            </span>
            <span className={`font-display text-2xl italic leading-none ${a.number}`}>
              {project.index}
            </span>
          </div>
        </div>
      </header>

      <div className="layout">
        <Reveal>
          <div
            className={`mt-12 flex aspect-[16/7] items-center overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br px-6 py-4 dark:border-zinc-800 ${a.panel}`}
          >
            <ProductVisual
              variant={project.visual}
              accent={project.accent}
              className="h-full w-full"
              image={project.image}
              alt={`${project.name} interface`}
            />
          </div>
        </Reveal>

        <div className="grid gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-20 lg:py-20">
          <div className="min-w-0 space-y-14">
            <section>
              <p className="eyebrow">Overview</p>
              <h2 className="mt-5 max-w-3xl text-2xl font-semibold tracking-tight text-white dark:text-zinc-100 sm:text-3xl">
                What {project.name} is.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                {project.overview}
              </p>
            </section>

            <section>
              <p className="eyebrow">Features</p>
              <h2 className="mt-5 max-w-3xl text-2xl font-semibold tracking-tight text-white dark:text-zinc-100 sm:text-3xl">
                What it ships.
              </h2>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {project.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.dot}`}
                      aria-hidden="true"
                    />
                    <span className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <p className="eyebrow">Functions</p>
              <h2 className="mt-5 max-w-3xl text-2xl font-semibold tracking-tight text-white dark:text-zinc-100 sm:text-3xl">
                What it does.
              </h2>
              <ul className="mt-7 space-y-3">
                {project.functions.map((fn) => (
                  <li
                    key={fn}
                    className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <span className="mt-0.5 font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500">
                      0{project.functions.indexOf(fn) + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{fn}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <p className="eyebrow">Architecture &amp; Framework</p>
              <h2 className="mt-5 max-w-3xl text-2xl font-semibold tracking-tight text-white dark:text-zinc-100 sm:text-3xl">
                How it is built.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                {project.architecture}
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {project.framework.map((f) => (
                  <span
                    key={f}
                    className="rounded-md bg-zinc-100 px-3 py-1.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-7 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                Quick facts
              </p>
              <div className="mt-5 space-y-5">
                <Fact label="Category">{project.category}</Fact>
                <Fact label="Industry">{project.industry}</Fact>
                <Fact label="Status">{project.status}</Fact>
                <Fact label="Architecture">
                  {project.framework.slice(0, 3).join(" · ")}
                </Fact>
              </div>

              <div className="mt-7 flex flex-col gap-3">
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary w-full"
                >
                  Visit the Product <span aria-hidden="true">→</span>
                </a>
                <Link
                  to="/work"
                  className="btn btn-secondary w-full"
                >
                  Start a Conversation
                </Link>
              </div>

              <Link
                to="/portfolio"
                className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
              >
                <span aria-hidden>←</span> All projects
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <section className="layout border-t border-zinc-200 py-16 dark:border-zinc-800 sm:py-20">
        <p className="eyebrow">Keep exploring</p>
        <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-white dark:text-zinc-50 sm:text-4xl">
          More in the portfolio.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((o) => (
            <Link
              key={o.slug}
              to={`/portfolio/${o.slug}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-zinc-400 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-500/70"
            >
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                {o.index}
              </span>
              <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-white transition-colors group-hover:italic dark:text-zinc-100">
                {o.name}
              </p>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{o.category}</p>
            </Link>
          ))}
        </div>
        <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-400">
          Want to see how these are built and what&apos;s next? Read the{" "}
          <Link
            to="/blog"
            className="link-swipe font-semibold text-white dark:text-zinc-100"
          >
            essays on the blog →
          </Link>
        </p>
      </section>
    </article>
  )
}