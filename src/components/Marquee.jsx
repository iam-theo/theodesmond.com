export default function Marquee({ items = [], className = "" }) {
  if (!items.length) return null
  const line = items.join(" ")
  return (
    <div className={`marquee overflow-hidden py-4 ${className}`} aria-hidden="true">
      <div className="marquee-track font-mono text-xs font-medium uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
        {[0, 1].map((half) => (
          <span key={half} className="flex shrink-0 items-center">
            {[0, 1, 2].map((rep) => (
              <span key={rep} className="flex items-center">
                {line.split(" ").map((w, i) => (
                  <span key={i} className="flex items-center">
                    <span className="px-6">{w}</span>
                    <span className="text-zinc-300 dark:text-zinc-700">✦</span>
                  </span>
                ))}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}