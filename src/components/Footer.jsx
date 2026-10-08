import { Link } from "react-router-dom"
import { footerCopy as defaultFooterCopy, branding as defaultBranding } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"

export default function Footer() {
  const year = new Date().getFullYear()
  const content = useSiteContent()
  const copy = content?.footerCopy ?? defaultFooterCopy
  const branding = content?.branding ?? defaultBranding
  return (
    <footer className="overflow-hidden border-t border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="layout relative py-20 sm:py-28">
        <span
          className="ghost-mark -bottom-16 right-0 hidden text-[16rem] leading-none text-zinc-200/70 dark:text-white/60 lg:block"
          aria-hidden="true"
        >
          TD
        </span>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
          {copy.titleBefore}{" "}
          <span className="italic font-medium">{copy.titleAccent}</span>
        </h2>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {copy.body}
        </p>
        <Link to="/work" className="btn btn-primary mt-10">
          Work With Theo <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="layout flex flex-col items-center justify-between gap-8 py-10 lg:flex-row">
          <div className="flex items-center gap-3">
            {branding.logoImage ? (
              <img src={branding.logoImage} alt="Theo Desmond" className="h-7 w-7 rounded-md object-cover" />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 font-mono text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
                {branding.mark || "TD"}
              </span>
            )}
            <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              © {year} Theo Desmond — {copy.signoff}
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-7 gap-y-2">
            <Link to="/portfolio" className="link-swipe font-mono text-xs text-zinc-500 dark:text-zinc-400">
              Portfolio
            </Link>
            <Link to="/ventures" className="link-swipe font-mono text-xs text-zinc-500 dark:text-zinc-400">
              Ventures
            </Link>
            <Link to="/about" className="link-swipe font-mono text-xs text-zinc-500 dark:text-zinc-400">
              About
            </Link>
            <Link to="/lab" className="link-swipe font-mono text-xs text-zinc-500 dark:text-zinc-400">
              Lab
            </Link>
            <Link to="/blog" className="link-swipe font-mono text-xs text-zinc-500 dark:text-zinc-400">
              Blog
            </Link>
            <a
              href="https://github.com/iam-theo"
              target="_blank"
              rel="noopener noreferrer"
              className="link-swipe font-mono text-xs text-zinc-500 dark:text-zinc-400"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/iam-theo/"
              target="_blank"
              rel="noopener noreferrer"
              className="link-swipe font-mono text-xs text-zinc-500 dark:text-zinc-400"
            >
              LinkedIn
            </a>
            <a
              href="https://x.com/iam__theo"
              target="_blank"
              rel="noopener noreferrer"
              className="link-swipe font-mono text-xs text-zinc-500 dark:text-zinc-400"
            >
              X
            </a>
            <a
              href="mailto:hello@theodesmond.com"
              className="link-swipe font-mono text-xs text-zinc-500 dark:text-zinc-400"
            >
              Email
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}