import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { branding as defaultBranding } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"
import { api, getToken, setToken } from "../lib/api"
import { AdminLogin } from "../components/admin/AdminLogin"
import PostsManager from "../components/admin/PostsManager"
import ProductsManager from "../components/admin/ProductsManager"
import ContentManager from "../components/admin/ContentManager"
import SettingsManager from "../components/admin/SettingsManager"
import ChatManager from "../components/admin/ChatManager"
import AurexManager from "../components/admin/AurexManager"
import {
  SubscribersManager,
  CommentsManager,
  VisitsManager,
} from "../components/admin/InboxTables"

const GROUPS = [
  {
    label: "Manage",
    items: [
      { id: "overview", label: "Overview", icon: "◧" },
      { id: "posts", label: "Posts", icon: "✎" },
{ id: "products", label: "Products", icon: "▦" },
        { id: "content", label: "Content", icon: "☰" },
        { id: "settings", label: "Settings", icon: "⚙" },
        { id: "aurex", label: "Aurex", icon: "⚡" },
    ],
  },
  {
    label: "Inbox",
    items: [
      { id: "messages", label: "Messages", icon: "✉" },
      { id: "subscribers", label: "Subscribers", icon: "◉" },
      { id: "comments", label: "Comments", icon: "💬" },
      { id: "visits", label: "Visits", icon: "◎" },
    ],
  },
]

const TITLES = {
  overview: "Site at a glance",
  posts: "Blog posts",
  products: "Products",
  content: "Site content",
  settings: "Settings",
  aurex: "Aurex AI",
  messages: "Messages",
  subscribers: "Subscribers",
  comments: "Comments",
  visits: "Visits",
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="font-display text-4xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
      <p className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-zinc-500">{label}</p>
    </div>
  )
}

function Overview() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const data = await api.get("/api/admin/stats")
        if (alive) setStats(data)
      } catch {
        if (alive) setStats({})
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [])

  if (!stats) return <p className="text-sm text-zinc-500">Loading stats…</p>

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Posts" value={stats.posts} />
        <Stat label="Products" value={stats.products} />
        <Stat label="Messages" value={stats.contacts} />
        <Stat label="Subscribers" value={stats.subscribers} />
        <Stat label="Comments" value={stats.comments} />
        <Stat label="Visits" value={stats.visits} />
        <Stat label="Post views" value={stats.post_views} />
      </div>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 text-sm leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">How this panel works</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><b>Posts</b> and <b>Products</b> edits go live on the site immediately (DB-driven with bundled fallback).</li>
          <li><b>Content</b> edits every text section — hero, headers, home, work page, footer, subscribe box, socials, lab, testimonials…</li>
          <li>New posts/products need a <b>rebuild + redeploy</b> to appear in the static SEO pages (sitemap + prerender).</li>
        </ul>
      </div>
    </div>
  )
}

function SidebarBody({ tab, setTab, user, signOut, close, branding }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-6 pt-6">
{branding.logoImage ? (
            <img src={branding.logoImage} alt="Theo Desmond" className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 font-mono text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
              {branding.mark || "TD"}
            </span>
          )}
        <div>
          <p className="text-sm font-bold text-white">Admin</p>
          <p className="font-mono text-[11px] text-zinc-400">theodesmond.com</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              {g.label}
            </p>
            <div className="space-y-1">
              {g.items.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTab(t.id)
                    close?.()
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    tab === t.id
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <span className="w-5 text-center" aria-hidden>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <span className="w-5 text-center" aria-hidden>→</span>
          View site
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2 px-3 py-2">
          <p className="truncate font-mono text-[11px] text-zinc-500" title={user}>
            {user}
          </p>
          <button
            type="button"
            onClick={signOut}
            className="shrink-0 rounded-md border border-zinc-700 px-2 py-1 font-mono text-[11px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [tab, setTab] = useState("overview")
  const [drawer, setDrawer] = useState(false)
  const content = useSiteContent()
  const branding = content?.branding ?? defaultBranding

  useEffect(() => {
    document.title = "Admin — Theo Desmond"
    let meta = document.head.querySelector('meta[name="robots"]')
    const prev = meta?.getAttribute("content")
    if (!meta) {
      meta = document.createElement("meta")
      meta.setAttribute("name", "robots")
      document.head.appendChild(meta)
    }
    meta.setAttribute("content", "noindex, nofollow")
    return () => {
      if (meta && prev) meta.setAttribute("content", prev)
    }
  }, [])

  useEffect(() => {
    let alive = true
    if (!getToken()) {
      setChecking(false)
      return
    }
    api
      .get("/api/auth/me")
      .then((data) => {
        if (alive) setUser(data.email || "staff")
      })
      .catch(() => {
        setToken("")
        if (alive) setUser(null)
      })
      .finally(() => {
        if (alive) setChecking(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const signOut = () => {
    setToken("")
    setUser(null)
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="font-mono text-sm text-zinc-500">Checking session…</p>
      </div>
    )
  }

  if (!user) return <AdminLogin onLogin={(email) => setUser(email || "staff")} />

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-zinc-950 lg:block">
        <SidebarBody tab={tab} setTab={setTab} user={user} signOut={signOut} branding={branding} />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 bg-zinc-950 shadow-2xl">
            <SidebarBody tab={tab} setTab={setTab} user={user} signOut={signOut} close={() => setDrawer(false)} branding={branding} />
          </aside>
        </div>
      )}

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-950/90">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 dark:text-zinc-300"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </button>
        {branding.logoImage ? (
          <img src={branding.logoImage} alt="Theo Desmond" className="h-8 w-8 rounded-lg object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 font-mono text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
            {branding.mark || "TD"}
          </span>
        )}
        <p className="font-mono text-sm font-semibold text-white dark:text-zinc-100">
          {TITLES[tab]}
        </p>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 hidden text-2xl font-bold tracking-tight text-zinc-900 lg:block dark:text-zinc-100">
          {TITLES[tab]}
        </h1>
        {tab === "overview" && <Overview />}
        {tab === "posts" && <PostsManager />}
        {tab === "products" && <ProductsManager />}
        {tab === "content" && <ContentManager />}
        {tab === "settings" && <SettingsManager />}
        {tab === "aurex" && <AurexManager />}
        {tab === "messages" && <ChatManager />}
        {tab === "subscribers" && <SubscribersManager />}
        {tab === "comments" && <CommentsManager />}
        {tab === "visits" && <VisitsManager />}
      </main>
    </div>
  )
}
