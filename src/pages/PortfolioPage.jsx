import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader"
import ProjectCard from "../components/ProjectCard"
import Section from "../components/Section"
import { companies, products, experiments } from "../data"

export default function PortfolioPage() {
  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title={
          <>
            Things <span className="text-indigo-600">I&apos;ve Built.</span>
          </>
        }
        description="Not a portfolio grid — an ecosystem. Companies I lead, products I design and build, and experiments I'm actively working on."
        grid
      >
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/ventures" className="btn btn-primary">
            The Ventures
          </Link>
          <Link to="/contact" className="btn btn-secondary">
            Start a Project
          </Link>
        </div>
      </PageHeader>

      <Section eyebrow="Companies" title="The ventures I lead.">
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {companies.map((c) => (
            <Link
              key={c.name}
              to={c.link}
              className="group rounded-2xl border border-zinc-200 bg-white p-8 transition-colors hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/60"
            >
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                {c.role}
              </p>
              <h3 className="mt-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">{c.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {c.desc}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                Explore venture
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow="Products" title="Platforms I design and build.">
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {products.map((p) => (
            <ProjectCard key={p.name} project={p} detailed />
          ))}
        </div>
      </Section>

      <Section eyebrow="Experiments" title="What's on the bench.">
        <div className="mt-12 flex flex-wrap gap-3">
          {experiments.map((e) => (
            <span
              key={e}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-5 py-2 font-mono text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {e}
            </span>
          ))}
        </div>
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
          See the full{" "}
          <Link to="/lab" className="font-semibold text-indigo-600 hover:underline">
            Technical Lab →
          </Link>
        </p>
      </Section>
    </>
  )
}
