import Section from "./Section"
import { mandate as defaultMandate } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"

export default function DigitalMandate({
  eyebrow = "02 · The Digital Mandate",
  title = "The mandate behind the work.",
}) {
  const content = useSiteContent()
  const mandate = content?.mandate ?? defaultMandate
  return (
    <Section id="mandate" eyebrow={eyebrow} title={title}>
      <div className="mt-14 overflow-hidden rounded-3xl bg-indigo-950 text-white">
        <div className="p-8 sm:p-12 lg:p-16">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-indigo-400">
            The principle
          </p>
          <h3 className="mt-5 max-w-3xl font-display text-3xl font-medium italic leading-tight sm:text-5xl">
            &ldquo;{mandate.statement}.&rdquo;
          </h3>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-indigo-200">
            {mandate.philosophy}
          </p>
        </div>

        <div className="border-t border-indigo-900/60 p-8 sm:p-12 lg:p-16">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-indigo-400">
            The mission
          </p>
          <h4 className="mt-5 max-w-3xl text-2xl font-semibold tracking-tight sm:text-4xl">
            {mandate.mission}.
          </h4>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-indigo-200">
            {mandate.missionBody}
          </p>
        </div>

        <div className="divide-y divide-indigo-900/60 border-t border-indigo-900/60">
          {mandate.transitions.map((t) => (
            <div
              key={t.from}
              className="group flex flex-col gap-3 px-8 py-7 transition-colors hover:bg-indigo-900/40 sm:flex-row sm:items-center sm:justify-between sm:px-12 lg:px-16"
            >
              <span className="text-xl font-semibold tracking-tight text-indigo-400 sm:text-2xl">
                {t.from}
              </span>
              <span
                aria-hidden="true"
                className="font-mono text-sm text-indigo-600 transition-transform group-hover:translate-x-2 sm:order-none"
              >
                →
              </span>
              <span className="font-display text-2xl font-medium italic text-white sm:text-3xl">
                {t.to}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
