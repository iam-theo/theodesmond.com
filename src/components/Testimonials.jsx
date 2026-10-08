import Section from "./Section"
import { testimonials as defaultTestimonials } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"

export default function Testimonials() {
  const content = useSiteContent()
  const testimonials = content?.testimonials ?? defaultTestimonials
  return (
    <Section
      id="testimonials"
      eyebrow="Testimonials"
      title="What collaborators say."
    >
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        A partnership, not a handoff — here&apos;s how that lands for the people I
        build with.
      </p>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/60"
          >
            <span
              aria-hidden="true"
              className="font-display text-5xl italic leading-none text-indigo-600 dark:text-indigo-400"
            >
              &ldquo;
            </span>
            <blockquote className="mt-3 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
              {t.quote}
            </blockquote>
            <figcaption className="mt-auto pt-8">
              <p className="text-sm font-semibold text-white dark:text-zinc-100">{t.name}</p>
              <p className="mt-1 font-mono text-xs text-zinc-400 dark:text-zinc-500">{t.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  )
}
