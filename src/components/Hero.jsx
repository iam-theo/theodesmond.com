import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Reveal from "./Reveal"
import Marquee from "./Marquee"
import { identity as defaultIdentity, supporting as defaultSupporting, heroStats as defaultHeroStats, roles as defaultRoles, heroWords as defaultHeroWords } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"

function RotatingWord({ words }) {
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % words.length), 2600)
    return () => clearInterval(t)
  }, [words.length])

  return (
    <span key={i} className="rotating-word inline-block italic text-zinc-900 dark:text-zinc-50">
      {words[i]}
    </span>
  )
}

const DEFAULT_HERO_WORDS = ["businesses.", "technology products.", "intelligent systems.", "ventures."]

export default function Hero() {
  const content = useSiteContent()
  const identity = content?.identity ?? defaultIdentity
  const supporting = content?.supporting ?? defaultSupporting
  const heroStats = content?.heroStats ?? defaultHeroStats
  const roles = content?.roles ?? defaultRoles
  const heroWords = content?.heroWords ?? defaultHeroWords
  return (
    <section id="top" className="relative overflow-hidden pb-0 pt-36 sm:pt-44">
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(24,24,27,0.05) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 35%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 70% at 50% 0%, black 35%, transparent 100%)",
        }}
      />
      <span
        className="ghost-mark -top-12 right-0 -z-10 hidden text-[22rem] leading-none text-zinc-100 lg:block dark:text-white/80"
        aria-hidden="true"
      >
        TD
      </span>

      <div className="layout">
        <Reveal>
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">
            Portfolio — {roles.join(" / ")}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mt-8 font-display text-7xl font-semibold leading-[0.95] tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-8xl lg:text-[9rem]">
            Theo <span className="italic font-medium">Desmond</span>
            <span className="hero-underline mt-5 max-w-[42rem]" aria-hidden="true" />
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-12 max-w-3xl font-display text-2xl font-medium leading-snug tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            I build <RotatingWord words={heroWords.length ? heroWords : DEFAULT_HERO_WORDS} />
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            {supporting}
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/portfolio" className="btn btn-primary">
              Explore My Work <span aria-hidden="true">→</span>
            </Link>
            <Link to="/work" className="btn btn-secondary">
              Work With Theo
            </Link>
          </div>
        </Reveal>

        <Reveal delay={320}>
          <div className="mt-20">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Roles</p>
              <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">td/archive</p>
            </div>
            <div className="mt-4">
              {heroStats.map((s, i) => (
                <div
                  key={s.label}
                  className="group flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-dashed border-zinc-200 py-5 transition-colors first:border-t dark:border-zinc-800"
                >
                  <span className="w-8 shrink-0 font-mono text-xs text-zinc-400 transition-colors group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-100">
                    0{i + 1}
                  </span>
                  <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                    {s.label}
                  </span>
                  <span className="ml-auto hidden font-mono text-xs text-zinc-400 dark:text-zinc-500 sm:block">
                    {s.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mt-20 border-y border-zinc-200 dark:border-zinc-800">
        <Marquee items={identity.split(" → ")} />
      </div>
    </section>
  )
}