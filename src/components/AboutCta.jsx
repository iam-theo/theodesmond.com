import { Link } from "react-router-dom"
import Section from "./Section"

export default function AboutCta({
  eyebrow = "08 · The Direction",
  title = "There is still a lot to build.",
}) {
  return (
    <Section id="about-cta" eyebrow={eyebrow} title={title}>
      <div className="mt-12 flex flex-col items-start justify-between gap-10 rounded-3xl bg-indigo-950 p-8 ring-1 ring-indigo-900 sm:p-12 lg:flex-row lg:items-center lg:p-16">
        <div className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-400">
            What&apos;s next
          </p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            Technology that serves people. A continent that builds — not only consumes.
          </h3>
          <p className="mt-4 text-base leading-relaxed text-indigo-200">
            If that&apos;s the direction you&apos;re building in, let&apos;s build together.
          </p>
        </div>
        <Link
          to="/work"
          className="btn group bg-white text-indigo-950 hover:bg-indigo-100"
        >
          Let&apos;s Build
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </Section>
  )
}
