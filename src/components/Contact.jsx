import { useState } from "react"
import Section from "./Section"
import { supabase, isSupabaseConfigured } from "../lib/supabase"
import { contactCategories } from "../data"

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"

export default function Contact({
  eyebrow = "11 · Contact / Collaboration",
  title = (
    <>
      Have a problem <span className="text-indigo-600 dark:text-indigo-400">worth building?</span>
    </>
  ),
}) {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: contactCategories[0],
    message: "",
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    if (!form.name.trim() || !emailOk || !form.message.trim()) {
      setError("Please fill in your name, a valid email and a short message.")
      return
    }
    setError("")

    if (isSupabaseConfigured) {
      setSending(true)
      const { error: dbError } = await supabase.from("contacts").insert({
        name: form.name.trim(),
        email: form.email.trim(),
        category: form.category,
        message: form.message.trim(),
      })
      setSending(false)
      if (dbError) {
        setError("Something went wrong sending your message. Please try again or email me directly.")
        return
      }
      setSent(true)
      return
    }

    const subject = encodeURIComponent(`Project inquiry — ${form.category}`)
    const body = encodeURIComponent(`${form.message.trim()}\n\n— ${form.name.trim()} (${form.email.trim()})`)
    window.location.href = `mailto:hello@theodesmond.com?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <Section id="contact" eyebrow={eyebrow} title={title} className="border-t-0">
      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
        I&apos;m interested in ambitious products, complex engineering problems and opportunities
        where technology can create measurable impact.
      </p>

      {sent ? (
        <div className="mt-12 max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <p className="text-2xl font-semibold text-emerald-900 dark:text-emerald-300">
            Message on its way.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">
            Thanks for reaching out — I&apos;ll get back to you within a day or two.
            {isSupabaseConfigured &&
              " Your message has been logged in my inbox."}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-12 grid max-w-3xl gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="mb-2 block font-mono text-xs text-zinc-500 dark:text-zinc-400">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={form.name}
                onChange={set("name")}
                placeholder="Your name"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="mb-2 block font-mono text-xs text-zinc-500 dark:text-zinc-400">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-category" className="mb-2 block font-mono text-xs text-zinc-500 dark:text-zinc-400">
              What brings you here
            </label>
            <select
              id="contact-category"
              value={form.category}
              onChange={set("category")}
              className={`${inputClass} appearance-none`}
            >
              {contactCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contact-message" className="mb-2 block font-mono text-xs text-zinc-500 dark:text-zinc-400">
              Message
            </label>
            <textarea
              id="contact-message"
              required
              rows={5}
              value={form.message}
              onChange={set("message")}
              placeholder="A few lines about the problem, the timeline, and what success looks like."
              className={`${inputClass} resize-y`}
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-5">
            <button type="submit" disabled={sending} className="btn btn-primary">
              {sending ? "Sending…" : "Send Message"}
              {!sending && <span aria-hidden="true">→</span>}
            </button>
            <span className="font-mono text-sm text-zinc-400 dark:text-zinc-500">
              hello@theodesmond.com
            </span>
          </div>
        </form>
      )}
    </Section>
  )
}
