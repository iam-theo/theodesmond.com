import Reveal from "./Reveal"

export default function PageHeader({ eyebrow, title, description, children, grid = false }) {
  return (
    <section className="relative overflow-hidden pb-16 pt-36 sm:pb-20 sm:pt-44">
      {grid && (
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(24,24,27,0.05) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          }}
        />
      )}
      <div className="layout">
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          )}
        </Reveal>
        {children && <Reveal delay={140}>{children}</Reveal>}
      </div>
    </section>
  )
}
