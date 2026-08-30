import { useState } from "react"
import Section from "./Section"
import { socials } from "../data"

const socialIcons = {
  GitHub: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .3.2.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  ),
  "X / Twitter": (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  ),
  Email: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
}

export default function Portrait({
  eyebrow = "07 · Outside the Architecture",
  title = "Before the systems, there's the person.",
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <Section id="portrait" eyebrow={eyebrow} title={title}>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        Curiosity first, everything else second. I learn by building, build by learning,
        and write down what I figure out. Some of it becomes products. Some of it becomes
        ideas worth keeping.
      </p>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-950 dark:border-zinc-800">
          {!imgError && (
            <img
              src="/portraits/theo-desmond.jpg"
              alt="Portrait of Theo Desmond"
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
          {imgError && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-5 p-8 text-center">
              <span className="flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-white/5 font-display text-5xl italic text-white">
                TD
              </span>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
                Portrait coming soon
              </p>
            </div>
          )}
        </div>

        <div className="lg:pt-2">
          <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            Beyond architecture: I read widely, prototype relentlessly, and keep one eye on
            Africa&apos;s future — because that&apos;s the direction the work is pointed. If
            you&apos;re building something that matters, the door is open.
          </p>

          <div className="mt-10 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="group flex items-center justify-between gap-6 py-5"
              >
                <div className="flex items-center gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors group-hover:border-indigo-300 group-hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:group-hover:border-indigo-500 dark:group-hover:text-indigo-400">
                    {socialIcons[s.label]}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                      {s.label}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-zinc-400 dark:text-zinc-500">
                      {s.desc}
                    </p>
                  </div>
                </div>
                <span className="text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600 dark:text-zinc-600 dark:group-hover:text-indigo-400">
                  →
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
