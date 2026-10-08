import { useEffect, useState } from "react"
import { Link, NavLink } from "react-router-dom"
import { nav as defaultNav, branding as defaultBranding } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"
import ThemeToggle from "./ThemeToggle"

export default function Nav() {
  const content = useSiteContent()
  const nav = content?.nav ?? defaultNav
  const branding = content?.branding ?? defaultBranding
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    }`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b bg-white/80 backdrop-blur-md transition-shadow dark:border-zinc-800 dark:bg-zinc-950/80 ${
        scrolled ? "border-zinc-200 shadow-sm dark:border-zinc-800" : "border-transparent"
      }`}
    >
      <nav
        className={`layout flex items-center justify-between transition-[height] ${
          scrolled ? "h-14" : "h-16"
        }`}
      >
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          {branding.logoImage ? (
            <img src={branding.logoImage} alt="Theo Desmond" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-950 font-mono text-sm font-semibold text-white dark:bg-indigo-500 dark:text-zinc-950">
              {branding.mark || "TD"}
            </span>
          )}
          <span className="font-mono text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            {branding.nameBefore || "theo"}<span className="text-indigo-600 dark:text-indigo-400">{branding.nameAfter || "desmond"}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <div className="hidden items-center gap-7 lg:flex">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass} end>
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/work"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-indigo-500 dark:hover:text-white"
            >
              Work With Theo
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 dark:text-zinc-300 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? (
                <>
                  <path d="M6 6l12 12" />
                  <path d="M18 6 6 18" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
          <div className="layout flex flex-col gap-1 py-4">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            >
              Home
            </Link>
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/work"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-zinc-900 px-3 py-2.5 text-center text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950"
            >
              Work With Theo
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
