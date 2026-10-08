import { Link } from "react-router-dom"

export default function EditorialRow({ index, to, title, excerpt, meta, className = "" }) {
  return (
    <Link
      to={to}
      className={`group editorial-row border-zinc-200 hover:border-zinc-400/70 dark:border-zinc-800 dark:hover:border-zinc-500/60 ${className}`}
    >
      <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 transition-colors group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-100">
        {index}
      </span>

      <span className="min-w-0">
        <span className="block font-display text-2xl font-medium tracking-tight text-zinc-900 transition-transform duration-300 group-hover:translate-x-2 dark:text-zinc-100 sm:text-4xl">
          {title}
        </span>
        {excerpt && (
          <span className="mt-2 block max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {excerpt}
          </span>
        )}
      </span>

      {meta && (
        <span className="hidden shrink-0 text-right font-mono text-xs text-zinc-400 dark:text-zinc-500 sm:block">
          {meta}
        </span>
      )}

      <span
        className="ed-arrow shrink-0 text-2xl leading-none text-zinc-300 dark:text-zinc-600"
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  )
}