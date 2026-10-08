import { Link } from "react-router-dom"
import Section from "./Section"
import EditorialRow from "./EditorialRow"
import { usePosts } from "../hooks/usePosts"
import { useSiteContent } from "../hooks/useSiteContent"
import { blogTopics as defaultBlogTopics, blogCopy as defaultBlogCopy } from "../data"

const pad = (n) => String(n).padStart(2, "0")

function FeaturedPost({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group mt-12 block rounded-3xl border border-zinc-200 bg-white transition-all hover:-translate-y-1 hover:border-zinc-400 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-500/70"
    >
      <div className="flex flex-col gap-10 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="stamp -rotate-1 border-zinc-400 text-zinc-700 dark:border-zinc-500 dark:text-zinc-300">
              {post.topic}
            </span>
            <span className="stamp rotate-1 border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-500">
              Featured
            </span>
          </div>
          <h3 className="mt-6 font-display text-3xl font-semibold leading-snug tracking-tight text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 sm:text-5xl">
            {post.title}
          </h3>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {post.excerpt}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
              {post.date} · {post.readTime}
            </p>
            <span className="link-swipe inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Read essay <span aria-hidden>→</span>
            </span>
          </div>
        </div>
        <span
          aria-hidden="true"
          className="hidden font-display text-9xl italic leading-none text-zinc-100 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 dark:text-zinc-800 lg:block"
        >
          {post.topic.slice(0, 1)}
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
  const content = useSiteContent()
  const blogTopics = content?.blogTopics ?? defaultBlogTopics
  const blogIntro = content?.blogCopy?.intro ?? defaultBlogCopy.intro
  const [featured, ...rest] = posts || []

  return (
    <Section id="blog" eyebrow={eyebrow} title={title}>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        {blogIntro}
      </p>

      {featured ? (
        <FeaturedPost post={featured} />
      ) : (
        <div className="mt-12 rounded-3xl border border-dashed border-zinc-200 p-12 text-center text-sm text-zinc-400 dark:border-zinc-800">
          Loading essays…
        </div>
      )}

      <div className="mt-8">
        {rest.map((post, i) => (
          <EditorialRow
            key={post.slug}
            index={pad(i + 2)}
            to={`/blog/${post.slug}`}
            title={post.title}
            excerpt={post.excerpt}
            meta={`${post.date} · ${post.readTime}`}
          />
        ))}
      </div>

      <div className="mt-12">
        <p className="eyebrow">Browse by topic</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {blogTopics.map((topic, i) => (
            <span
              key={topic}
              className={`stamp border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300 ${
                i % 2 ? "rotate-1" : "-rotate-1"
              }`}
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    </Section>
  )
}