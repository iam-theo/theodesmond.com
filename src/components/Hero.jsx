import { Link } from "react-router-dom"
import Reveal from "./Reveal"
import { roles, tagline, supporting, heroStats } from "../data"

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-36 pb-28 sm:pt-44 sm:pb-36">
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(24,24,27,0.05) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
        }}
      />
      <div
        className="animate-floaty pointer-events-none absolute -top-24 right-[-10%] -z-10 h-[28rem] w-[28rem] rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-[-8%] top-1/3 -z-10 h-[20rem] w-[20rem] rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/10"
        aria-hidden="true"
      />

      <div className="layout">
        <Reveal>
          <div className="inline-flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono text-xs font-medium text-emerald-800 dark:text-emerald-300">
              Currently building: Digital Platforms · AI Systems · FinTech Infrastructure
            </span>
          </div>

          <h1 className="mt-8 text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-8xl">
            Theo <span className="italic text-indigo-600 dark:text-indigo-400">Desmond</span>
          </h1>

          <p className="mt-7 max-w-4xl font-mono text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-base">
            {roles.map((role, i) => (
              <span key={role}>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{role}</span>
                {i < roles.length - 1 && <span className="text-zinc-300 dark:text-zinc-600"> · </span>}
              </span>
            ))}
          </p>

          <p className="mt-8 max-w-3xl font-display text-2xl font-medium leading-snug tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {tagline}
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            {supporting}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/portfolio" className="btn btn-primary">
              Explore My Work <span aria-hidden="true">→</span>
            </Link>
            <Link to="/contact" className="btn btn-secondary">
              Work With Theo
            </Link>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-16 border-t border-zinc-100 pt-8 dark:border-zinc-800">
            <p className="eyebrow">Ventures</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to="/ventures"
                className="group inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 font-mono text-xs font-medium text-zinc-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
              >
                TD Nwogu Global Enterprise
                <span className="text-zinc-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600">
                  →
                </span>
              </Link>
              <Link
                to="/ventures"
                className="group inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 font-mono text-xs font-medium text-zinc-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
              >
                Auracle Technologies
                <span className="text-zinc-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600">
                  →
                </span>
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 sm:grid-cols-4">
            {heroStats.map((s) => (
              <div
                key={s.label}
                className="bg-white p-5 transition-colors hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.label}</p>
                <p className="mt-1 font-mono text-xs text-zinc-400 dark:text-zinc-500">{s.sub}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
