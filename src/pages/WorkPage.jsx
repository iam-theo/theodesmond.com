import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader"
import Section from "../components/Section"
import Seo from "../components/Seo"
import { pageMeta } from "../lib/seo"
import { useSiteContent } from "../hooks/useSiteContent"
import { workCopy as defaultWorkCopy, pageHeaders as defaultPageHeaders } from "../data"

export default function WorkPage() {
  const meta = pageMeta("/work")
  const content = useSiteContent()
  const wc = content?.workCopy ?? defaultWorkCopy
  const header = content?.pageHeaders?.work ?? defaultPageHeaders.work
  const { help, sectors, partners, outcomes, process, audiences, sections } = wc

  return (
    <>
      <Seo {...meta} />
      <PageHeader
        eyebrow={header.eyebrow}
        title={
          <>
            {header.titleBefore}{" "}
            <span className="italic">{header.titleAccent}</span>
          </>
        }
        description={header.description}
        grid
      >
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/contact" className="btn btn-primary">
            Start a Conversation <span aria-hidden="true">→</span>
          </Link>
          <Link to="/portfolio" className="btn btn-secondary">
            Explore My Work
          </Link>
        </div>
      </PageHeader>

      <Section eyebrow={sections.help.eyebrow} title={sections.help.title}>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          I bring together{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {wc.helpIntroAccent}
          </span>{" "}
          to turn complex problems into systems that work.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {help.map((h, i) => (
            <div
              key={h.title}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-7 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
            >
              <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {h.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {h.body}
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {h.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow={sections.sectors.eyebrow} title={sections.sectors.title}>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {wc.sectorsIntro}
        </p>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((s, i) => (
            <div key={s.title} className="flex flex-col bg-white p-6 dark:bg-zinc-900">
              <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow={sections.partners.eyebrow} title={sections.partners.title}>
        <div className="mt-12 space-y-3">
          {partners.map((p, i) => (
            <div
              key={p.title}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-7 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 sm:flex-row sm:items-start sm:gap-8"
            >
              <p className="shrink-0 font-mono text-sm text-zinc-400 dark:text-zinc-500">
                {String(i + 1).padStart(2, "0")}
              </p>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {p.title}
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow={sections.outcomes.eyebrow} title={sections.outcomes.title}>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {outcomes.map((o, i) => (
            <div
              key={o.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {o.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {o.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow={sections.process.eyebrow} title={sections.process.title}>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {process.map((p, i) => (
            <div key={p.step} className="relative rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-display text-3xl italic text-zinc-200 dark:text-zinc-700">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {p.step}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow={sections.audiences.eyebrow} title={sections.audiences.title}>
        <div className="mt-12 flex flex-wrap gap-3">
          {audiences.map((a) => (
            <span
              key={a}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-5 py-2.5 font-mono text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {a}
            </span>
          ))}
        </div>
      </Section>

      <Section eyebrow={sections.talk.eyebrow} title={sections.talk.title}>
        <div className="mt-12 flex flex-col items-start justify-between gap-10 rounded-3xl bg-zinc-900 p-8 ring-1 ring-zinc-700 sm:p-12 lg:flex-row lg:items-center lg:p-16">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              {wc.talkKicker}
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              {wc.talkTitle}
            </h3>
            <p className="mt-4 text-base leading-relaxed text-zinc-300">
              {wc.talkBody}
            </p>
          </div>
          <Link to="/contact" className="btn group shrink-0 bg-white text-zinc-900 hover:bg-zinc-200">
            Start a Conversation
            <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </Section>
    </>
  )
}