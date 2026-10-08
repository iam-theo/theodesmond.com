import { Link, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import PostBody from "../components/PostBody"
import Comments from "../components/Comments"
import PostReactions from "../components/PostReactions"
import PostViews from "../components/PostViews"
import SharePost from "../components/SharePost"
import Seo from "../components/Seo"
import { usePosts } from "../hooks/usePosts"
import { fetchPost } from "../lib/blogData"
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPostMeta,
  SITE_URL,
} from "../lib/seo"

function toIso(value) {
  if (!value) return ""
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.length === 10 ? `${value}T00:00:00+00:00` : value
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "" : d.toISOString()
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const list = usePosts()
  const [post, setPost] = useState(null)

  useEffect(() => {
    let alive = true
    fetchPost(slug).then((p) => {
      if (alive) setPost(p)
    })
    return () => {
      alive = false
    }
  }, [slug])

  if (!post) {
    return (
      <section className="layout flex min-h-[50vh] flex-col items-center justify-center pt-32 text-center">
        <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
          {list === null ? "Loading…" : "Post not found."}
        </p>
        <Link
          to="/blog"
          className="mt-4 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Back to the blog
        </Link>
      </section>
    )
  }

  const index = (list || []).findIndex((p) => p.slug === slug)
  const prev = (list || [])[index - 1]
  const next = (list || [])[index + 1]
  const others = (list || []).filter((p) => p.slug !== slug).slice(0, 3)

  const postMeta = buildPostMeta(post, slug)
  const publishedTime = toIso(post.datePublished || post.date)
  const modifiedTime = toIso(post.dateModified || post.datePublished || post.date)
  const article = {
    publishedTime,
    modifiedTime,
    section: post.topic,
    tags: postMeta.keywords,
    authorUrl: `${SITE_URL}/about`,
  }

  return (
    <article>
      <Seo
        {...postMeta}
        article={article}
        jsonLd={[buildArticleJsonLd(post, slug), buildBreadcrumbJsonLd(post, slug)]}
      />
      <header className="layout pt-32 sm:pt-40">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
        >
          <span aria-hidden>←</span> Back to the blog
        </Link>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end lg:gap-20">
          <div className="max-w-4xl">
            <span className="stamp -rotate-1 border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
              {post.topic}
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>
            <p className="mt-6 flex flex-wrap items-center gap-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              <span>By Theo Desmond</span>
              <span aria-hidden>·</span>
              {publishedTime && (
                <time dateTime={publishedTime}>{post.date}</time>
              )}
              {!publishedTime && <span>{post.date}</span>}
              <span aria-hidden>·</span>
              <span>{post.readTime}</span>
              <PostViews slug={slug} />
            </p>
          </div>
          {post.excerpt && (
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300 lg:pb-1">
              {post.excerpt}
            </p>
          )}
        </div>
      </header>

      <div className="layout">
        <div className="grid gap-14 py-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-20 lg:py-20">
          <div className="mx-auto w-full max-w-3xl">
            <PostBody blocks={post.blocks} />

            {postMeta.keywords.length > 0 && (
              <div className="mt-14 border-t border-dashed border-zinc-200 pt-8 dark:border-zinc-800">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                  Filed under
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {postMeta.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-mono text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <PostReactions slug={slug} />

            <SharePost slug={slug} title={post.title} />

            <Comments slug={slug} />

            <div className="mt-16 flex flex-col gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              {prev ? (
                <Link to={`/blog/${prev.slug}`} className="group max-w-sm">
                  <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                    <span aria-hidden>←</span> Previous
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                    {prev.title}
                  </p>
                </Link>
              ) : (
                <span aria-hidden />
              )}
              {next ? (
                <Link to={`/blog/${next.slug}`} className="group max-w-sm sm:text-right">
                  <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                    Next <span aria-hidden>→</span>
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                    {next.title}
                  </p>
                </Link>
              ) : (
                <span aria-hidden />
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="eyebrow">Written by</p>
              <div className="mt-4 flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-950 font-display text-lg italic text-white dark:bg-indigo-500 dark:text-zinc-950">
                  TD
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Theo Desmond
                  </p>
                  <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    Founder · Architect · Engineer · Consultant
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                I design and build businesses, digital products and intelligent systems —
                from the first business problem to production infrastructure.
              </p>
              <Link
                to="/about"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                More about me <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                More essays
              </p>
              <div className="mt-4 space-y-5">
                {others.map((o) => (
                  <Link key={o.slug} to={`/blog/${o.slug}`} className="group block">
                    <p className="line-clamp-2 text-sm font-semibold text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                      {o.title}
                    </p>
                    <p className="mt-1 font-mono text-xs text-zinc-400 dark:text-zinc-500">
                      {o.topic} · {o.date}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/work" className="btn btn-primary w-full">
              Work With Theo <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </div>
    </article>
  )
}
