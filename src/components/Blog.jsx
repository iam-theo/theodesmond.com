import { Link } from "react-router-dom"
import Section from "./Section"
import { usePosts } from "../hooks/usePosts"
import { blogTopics } from "../data"

function Meta({ post }) {
  return (
    <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
      {post.date} · {post.readTime}
    </p>
  )
}

function FeaturedPost({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group mt-12 block rounded-3xl border border-zinc-200 bg-white transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/60"
    >
      <div className="flex flex-col gap-10 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-indigo-50 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/30">
              {post.topic}
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              Featured
            </span>
          </div>
          <h3 className="mt-6 text-2xl font-semibold leading-snug tracking-tight text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 sm:text-4xl">
            {post.title}
          </h3>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {post.excerpt}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Meta post={post} />
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition-transform group-hover:translate-x-1 dark:text-indigo-400">
              Read essay <span aria-hidden>→</span>
            </span>
          </div>
        </div>
        <span
          aria-hidden="true"
          className="hidden font-display text-8xl italic leading-none text-zinc-100 dark:text-zinc-800 lg:block"
        >
          {post.topic.slice(0, 1)}
        </span>
      </div>
    </Link>
  )
}

function PostCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-7 transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/60"
    >
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
        {post.topic}
      </span>
      <h3 className="mt-4 text-xl font-semibold leading-snug tracking-tight text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
        {post.title}
      </h3>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {post.excerpt}
      </p>
      <div className="mt-auto flex items-center justify-between gap-4 pt-6">
        <Meta post={post} />
        <span className="shrink-0 text-sm font-semibold text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
          Read <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  )
}

export default function Blog({
  eyebrow = "Latest Essays",
  title = "Ideas worth writing down.",
}) {
  const posts = usePosts()
  const [featured, ...rest] = posts || []

  return (
    <Section id="blog" eyebrow={eyebrow} title={title}>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        Notes on AI engineering, software architecture, FinTech and the discipline of
        building systems that last.
      </p>

      {featured ? (
        <FeaturedPost post={featured} />
      ) : (
        <div className="mt-12 rounded-3xl border border-dashed border-zinc-200 p-12 text-center text-sm text-zinc-400 dark:border-zinc-800">
          Loading essays…
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rest.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>

      <div className="mt-14 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          Browse by topic
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {blogTopics.map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 font-mono text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    </Section>
  )
}
