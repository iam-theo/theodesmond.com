import { useState } from "react"
import { api, setToken } from "../../lib/api"

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"

export const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-white placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"

export const labelClass =
  "mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400"

export function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    setBusy(true)
    try {
      const data = await api.post("/api/auth/login", {
        email: email.trim(),
        password,
      })
      setToken(data.token)
      onLogin?.(data.email)
    } catch (err) {
      setError(err.message || "Sign in failed")
    }
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 font-mono text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
          TD
        </span>
        <h1 className="mt-5 text-xl font-bold tracking-tight text-white dark:text-zinc-100">
          Admin sign in
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          theodesmond.com control panel. Use your Supabase staff account.
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className={labelClass}>Email</label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className={labelClass}>Password</label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
        </div>
        {error && (
          <p className="mt-4 text-sm font-medium text-rose-600 dark:text-rose-400" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  )
}
