import Section from "./Section"
import { storyParas as defaultStoryParas, storyStages as defaultStoryStages } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"

export default function Story({
  eyebrow = "01 · The Story",
  title = "How I got here.",
}) {
  const content = useSiteContent()
  const storyParas = content?.storyParas ?? defaultStoryParas
  const storyStages = content?.storyStages ?? defaultStoryStages
  return (
    <Section id="story" eyebrow={eyebrow} title={title}>
      <div className="mt-14 grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-20">
        <div className="max-w-2xl">
          <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            It started with a question I couldn&apos;t shake: how does an idea become a
            thing that works? So I learned to build.{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              And I kept going long enough for the questions to change.
            </span>
          </p>
          <div className="mt-8 space-y-6">
            {storyParas.map((p) => (
              <p key={p} className="leading-relaxed text-zinc-600 dark:text-zinc-400">
                {p}
              </p>
            ))}
          </div>
        </div>

        <div className="relative pl-7">
          <span
            aria-hidden="true"
            className="absolute left-0 top-2 bottom-2 w-px bg-zinc-200 dark:bg-zinc-800"
          />
          <ol className="space-y-9">
            {storyStages.map((stage, i) => (
              <li key={stage.label} className="relative">
                <span
                  aria-hidden="true"
                  className={`absolute -left-7 top-1.5 h-3 w-3 rounded-full ring-4 ring-white dark:ring-zinc-950 ${
                    i === 0
                      ? "bg-indigo-600 dark:bg-indigo-500"
                      : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                />
                {stage.year && (
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                    {stage.year}
                  </span>
                )}
                <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
                  {stage.label}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  )
}
