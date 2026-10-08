import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Nav from "./Nav"
import Footer from "./Footer"
import Subscribe from "./Subscribe"
import LiveChat from "./LiveChat"
import LivePresence from "./LivePresence"
import CookieBanner from "./CookieBanner"
import ScrollProgress from "./ScrollProgress"
import Seo from "./Seo"
import { pageMeta, buildPersonJsonLd, buildWebSiteJsonLd } from "../lib/seo"
import { fetchPost } from "../lib/blogData"
import { useState } from "react"

const blogDefaults = {
  title: "Blog — Essays on AI, Architecture, FinTech & Building",
  description:
    "Notes and essays from Theo Desmond on AI engineering, software architecture, FinTech, product development and the discipline of building systems that last.",
  keywords: ["AI engineering", "software architecture", "FinTech", "product development"],
}

export default function Layout() {
  const { pathname } = useLocation()
  const [post, setPost] = useState(null)

  const isPost = pathname.startsWith("/blog/") && pathname !== "/blog"
  const slug = isPost ? pathname.split("/").pop() : null

  useEffect(() => {
    if (slug) {
      fetchPost(slug).then((p) => setPost(p || null))
    } else {
      setPost(null)
    }
  }, [slug])

  // Always start at the top on any page/route change.
  useEffect(() => {
    // Bypass CSS `scroll-behavior: smooth` so route changes jump instantly.
    const root = document.documentElement
    const prev = root.style.scrollBehavior
    root.style.scrollBehavior = "auto"
    window.scrollTo(0, 0)
    root.style.scrollBehavior = prev
  }, [pathname])

  const meta = isPost
    ? post
      ? {
          title: `${post.title} — Theo Desmond`,
          description: post.excerpt || blogDefaults.description,
          keywords: [post.topic],
          path: pathname,
          ogType: "article",
        }
      : { ...blogDefaults, path: pathname }
    : pageMeta(pathname)

  return (
    <div className="font-sans">
      <Seo {...meta} jsonLd={pathname === "/" ? [buildWebSiteJsonLd(), buildPersonJsonLd()] : null} />
      <LivePresence />
      <ScrollProgress />
      <Nav />
      <main>
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
      <Subscribe />
      <Footer />
      <LiveChat />
      <CookieBanner />
    </div>
  )
}
