import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import Tilt from "./Tilt"

export default function ProjectCard({ project, detailed = false }) {
  const screenshots =
    project.screenshots?.length > 0
      ? project.screenshots
      : project.image
        ? [project.image]
        : []

  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    if (screenshots.length <= 1 || paused) return

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % screenshots.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [screenshots.length, paused])

  const previous = () => {
    setCurrent((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1))
  }

  const next = () => {
    setCurrent((prev) => (prev + 1) % screenshots.length)
  }

  const showSlider = screenshots.length > 0 && !imageFailed

  return (
    <article className="group">
      <Tilt>
        <div
          className="relative overflow-hidden rounded-2xl bg-zinc-100 p-3 dark:bg-zinc-900"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
        {showSlider ? (
          <>
            <div className="aspect-[16/10] overflow-hidden rounded-xl">
              {screenshots.map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt={`${project.name} screenshot ${index + 1}`}
                  loading={index === 0 ? "eager" : "lazy"}
                  onError={() => setImageFailed(true)}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                    index === current ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>

            {screenshots.length > 1 && (
              <button
                type="button"
                onClick={previous}
                aria-label={`Previous ${project.name} screenshot`}
                className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-sm backdrop-blur transition-opacity dark:bg-zinc-900/90 dark:text-white"
              >
                ←
              </button>
            )}

            {screenshots.length > 1 && (
              <button
                type="button"
                onClick={next}
                aria-label={`Next ${project.name} screenshot`}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-sm backdrop-blur dark:bg-zinc-900/90 dark:text-white"
              >
                →
              </button>
            )}

            {screenshots.length > 1 && (
              <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[10px] text-white backdrop-blur">
                {current + 1} / {screenshots.length}
              </div>
            )}

            {screenshots.length > 1 && (
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/50 px-2.5 py-2 backdrop-blur">
                {screenshots.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrent(index)}
                    aria-label={`Show screenshot ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      index === current ? "w-5 bg-white" : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-zinc-200/70 via-zinc-100/50 to-transparent text-center dark:from-zinc-800/70 dark:via-zinc-900/50 dark:to-transparent">
            <span className="font-display text-lg italic text-zinc-400 dark:text-zinc-500">
              {project.name}
            </span>
            <span className="rounded-full border border-zinc-200 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
              Screenshot coming soon
            </span>
          </div>
        )}
        </div>
      </Tilt>

      <div className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-white transition-colors group-hover:italic dark:text-zinc-100">
              {project.name}
            </h3>

            <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {project.tagline}
            </p>
          </div>

          <span className="shrink-0 font-mono text-xs text-zinc-400 dark:text-zinc-600">
            {project.index}
          </span>
        </div>

        {detailed && project.details && (
          <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {project.details}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5">
          <Link
            to={`/portfolio/${project.slug}`}
            className="link-swipe gap-2 text-sm font-semibold text-white dark:text-zinc-100"
          >
            View Project <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}