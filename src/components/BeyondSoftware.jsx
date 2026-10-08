import Section from "./Section"
import { beyondSoftware as defaultBeyondSoftware, beyondSoftwareStatement as defaultBeyondSoftwareStatement } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"

export default function BeyondSoftware({
  eyebrow = "05 · Beyond Software",
  title = "Technology is bigger than software.",
}) {
  const content = useSiteContent()
  const beyondSoftware = content?.beyondSoftware ?? defaultBeyondSoftware
  const beyondSoftwareStatement = content?.beyondSoftwareStatement ?? defaultBeyondSoftwareStatement
  return (
    <Section id="beyond-software" eyebrow={eyebrow} title={title}>
      <div className="mt-14 grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
        <div>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Applications are the visible layer. Beneath them sits the infrastructure that
            lets a continent create, operate and own the technology it depends on.
          </p>
          <div className="mt-10 flex flex-wrap gap-2.5">
            {beyondSoftware.map((area) => (
              <span
                key={area}
                className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm text-zinc-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-400"
              >
                {area}
              </span>
            ))}
          </div>
        </div>

        <blockquote className="self-center rounded-2xl border-l-4 border-indigo-600 bg-zinc-50 p-8 sm:p-10 dark:bg-zinc-900/60">
          <p className="text-lg font-medium leading-relaxed text-zinc-900 dark:text-zinc-100">
            {beyondSoftwareStatement}
          </p>
        </blockquote>
      </div>
    </Section>
  )
}
