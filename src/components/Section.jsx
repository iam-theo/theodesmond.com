import Reveal from "./Reveal"

export default function Section({ id, eyebrow, title, children, className = "" }) {
  return (
    <section
      id={id}
      className={`scroll-mt border-t border-zinc-100 py-24 sm:py-32 dark:border-zinc-800 ${className}`}
    >
      <div className="layout">
        {(eyebrow || title) && (
          <Reveal>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && (
              <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
                {title}
              </h2>
            )}
          </Reveal>
        )}
        {children && <Reveal delay={120}>{children}</Reveal>}
      </div>
    </section>
  )
}
