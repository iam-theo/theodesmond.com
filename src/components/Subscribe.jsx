import { useState } from "react"
import Reveal from "./Reveal"
import { api } from "../lib/api"
import { subscribeCopy as defaultSubscribeCopy } from "../data"
import { useSiteContent } from "../hooks/useSiteContent"

export default function Subscribe({
  eyebrow,
  title,
  body,
  compact = false,
}) {
  const content = useSiteContent()
  const copy = content?.subscribeCopy ?? defaultSubscribeCopy
  eyebrow = eyebrow ?? copy.eyebrow
  title = title ?? copy.title
  body = body ?? copy.body
  const tags = copy.tags ?? []
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState("idle") // idle | sending | done | error
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanEmail = email.trim()
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    if (!emailOk) {
      setError("Please enter a valid email address.")
      setStatus("error")
      return
    }
    setError("")
    setStatus("sending")

    try {
      await api.post("/api/subscribe", {
        name: name.trim(),
        email: cleanEmail,
      })
      setStatus("done")
    } catch (err) {
      console.error("Subscribe failed:", err)
      setStatus("error")
      setError("Something went wrong. Please try again or email hello@theodesmond.com.")
    }
  }
  return (
    <section className={`border-t border-zinc-100 dark:border-zinc-800 ${compact ? "py-16 sm:py-20" : "py-24 sm:py-32"}`}>
      <div className="layout">
        <Reveal>
          <div className="grid gap-10 overflow-hidden rounded-3xl bg-zinc-950 p-8 ring-1 ring-zinc-900 sm:p-12 lg:grid-cols-2 lg:items-center lg:gap-16 lg:p-16 dark:border dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <p className="eyebrow text-zinc-400 dark:text-zinc-500">{eyebrow}</p>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                {title}
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400">{body}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-zinc-800 px-3 py-1 font-mono text-[11px] text-zinc-400 dark:border-zinc-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              {status === "done" ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center sm:p-10">
                  <p className="text-2xl font-semibold text-emerald-300">You&apos;re on the list.</p>
                  <p className="mt-3 text-sm leading-relaxed text-emerald-200/80">
                    Thanks for subscribing — you&apos;ll hear from me when there&apos;s something worth
                    sharing.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 dark:bg-zinc-950/60">
                  <label
                    htmlFor="subscribe-name"
                    className="mb-2 block font-mono text-xs text-zinc-400"
                  >
                    Name <span className="text-zinc-600">(optional)</span>
                  </label>
                  <input
                    id="subscribe-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-zinc-400 focus:outline-none"
                  />
                  <label
                    htmlFor="subscribe-email"
                    className="mb-2 mt-5 block font-mono text-xs text-zinc-400"
                  >
                    Email
                  </label>
                  <input
                    id="subscribe-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-zinc-400 focus:outline-none"
                  />
                  {status === "error" && error && (
                    <p className="mt-3 text-sm font-medium text-rose-400" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="btn mt-5 w-full bg-white text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
                  >
                    {status === "sending" ? "Subscribing…" : "Subscribe"}
                    {status !== "sending" && <span aria-hidden="true">→</span>}
                  </button>
                  <p className="mt-4 text-center font-mono text-[11px] text-zinc-500">
                    No spam. Unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
