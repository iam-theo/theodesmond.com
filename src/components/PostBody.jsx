export default function PostBody({ blocks }) {
  return (
    <div className="mt-14">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="mt-12 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl"
              >
                {block.text}
              </h2>
            )
          case "p":
            return (
              <p
                key={i}
                className="mt-6 text-base leading-[1.85] text-zinc-600 dark:text-zinc-300 sm:text-lg"
              >
                {block.text}
              </p>
            )
          case "ul":
            return (
              <ul
                key={i}
                className="mt-6 list-disc space-y-3 pl-5 text-base leading-relaxed text-zinc-600 marker:text-indigo-500 dark:text-zinc-300 sm:text-lg"
              >
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )
          case "quote":
            return (
              <blockquote
                key={i}
                className="my-8 border-l-2 border-indigo-500 pl-5 text-lg font-medium italic leading-relaxed text-zinc-900 dark:text-zinc-100 sm:text-xl"
              >
                {block.text}
              </blockquote>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
