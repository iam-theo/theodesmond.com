import { Link } from "react-router-dom"
import ProductVisual from "./ProductVisual"

const accentStyles = {
  indigo: {
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/30",
    panel: "from-indigo-600/15 via-indigo-500/5 to-transparent",
    number: "text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
    hover: "hover:border-indigo-300 dark:hover:border-indigo-500/60",
    link: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
  },
  violet: {
    chip: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30",
    panel: "from-violet-600/15 via-violet-500/5 to-transparent",
    number: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
    hover: "hover:border-violet-300 dark:hover:border-violet-500/60",
    link: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
  },
  sky: {
    chip: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30",
    panel: "from-sky-600/15 via-sky-500/5 to-transparent",
    number: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
    hover: "hover:border-sky-300 dark:hover:border-sky-500/60",
    link: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
  },
  emerald: {
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
    panel: "from-emerald-600/15 via-emerald-500/5 to-transparent",
    number: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    hover: "hover:border-emerald-300 dark:hover:border-emerald-500/60",
    link: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
  },
}

export default function ProjectCard({ project, detailed = false }) {
  const a = accentStyles[project.accent]

  const handleMove = (e) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`)
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`)
  }

  return (
    <article
      onMouseMove={handleMove}
      className={`spotlight group relative flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white transition-all dark:border-zinc-800 dark:bg-zinc-900 ${a.hover}`}
    >
      <div
        className={`relative aspect-[16/7] overflow-hidden border-b border-zinc-200/70 bg-gradient-to-br px-6 py-4 dark:border-zinc-800 ${a.panel}`}
      >
        <ProductVisual variant={project.visual} accent={project.accent} className="h-full w-full" />
        <span
          className={`absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-3 py-1 font-mono text-[10px] font-semibold tracking-wider text-zinc-700 backdrop-blur dark:border-zinc-700/70 dark:bg-zinc-900/80 dark:text-zinc-300`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              project.status === "LIVE" ? "bg-emerald-500" : a.dot
            }`}
          />
          {project.status}
        </span>
        <span
          className={`absolute bottom-3 left-5 font-display text-xl italic leading-none ${a.number}`}
        >
          {project.index}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-8 sm:p-9">
        <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          {project.name}
        </h3>
        <p className="mt-2.5 font-mono text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {project.tagline}
        </p>

        {detailed && project.details && (
          <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {project.details}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {project.tags.map((t) => (
            <span
              key={t}
              className="rounded-md bg-zinc-100 px-2.5 py-1 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <Link
            to="/contact"
            className={`inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 transition-colors dark:text-zinc-100 ${a.link}`}
          >
            View Case Study
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
