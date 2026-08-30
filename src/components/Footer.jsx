import { Link } from "react-router-dom"

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="layout flex flex-col items-center justify-between gap-8 py-12 lg:flex-row">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-950 font-mono text-xs font-semibold text-white dark:bg-indigo-500 dark:text-zinc-950">
            TD
          </span>
          <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            © {year} Theo Desmond — Built by hand, architected on purpose.
          </p>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-7 gap-y-2">
          <Link to="/portfolio" className="font-mono text-xs text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
            Portfolio
          </Link>
          <Link to="/ventures" className="font-mono text-xs text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
            Ventures
          </Link>
          <Link to="/about" className="font-mono text-xs text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
            About
          </Link>
          <Link to="/lab" className="font-mono text-xs text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
            Lab
          </Link>
          <Link to="/blog" className="font-mono text-xs text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
            Blog
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
          >
            LinkedIn
          </a>
          <a
            href="mailto:hello@theodesmond.com"
            className="font-mono text-xs text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
          >
            Email
          </a>
        </nav>
      </div>
    </footer>
  )
}
