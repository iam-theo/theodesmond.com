import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "td-cookie-consent"

function pushConsent(value) {
  try {
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        ad_storage: value,
        ad_user_data: value,
        ad_personalization: value,
        analytics_storage: value,
        functionality_storage: value,
        personalization_storage: value,
        security_storage: "granted",
      })
    } else {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push([
        "consent",
        "update",
        {
          ad_storage: value,
          ad_user_data: value,
          ad_personalization: value,
          analytics_storage: value,
          functionality_storage: value,
          personalization_storage: value,
          security_storage: "granted",
        },
      ])
    }
  } catch {
    /* storage / gtag unavailable — non-fatal */
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let stored = null
    try {
      stored = localStorage.getItem(STORAGE_KEY)
    } catch {
      stored = null
    }
    if (stored === "granted" || stored === "denied") {
      pushConsent(stored)
      setVisible(false)
    } else {
      // No choice yet — show banner (required in denied-by-default regions,
      // optional elsewhere but lets visitors opt out).
      const t = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  // Allow reopening via `window.dispatchEvent(new Event("open-cookie-settings"))`
  useEffect(() => {
    const open = () => setVisible(true)
    window.addEventListener("open-cookie-settings", open)
    return () => window.removeEventListener("open-cookie-settings", open)
  }, [])

  const choose = useCallback((value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
    pushConsent(value)
    setVisible(false)
  }, [])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-[100] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-md"
    >
      <div className="rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-2xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Cookies
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          I use Google Analytics to understand which pages are useful. Accept to enable
          measurement, or decline to browse with strictly necessary cookies only.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="flex-1 rounded-full border border-zinc-300 px-4 py-2 font-mono text-xs text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="flex-1 rounded-full bg-zinc-900 px-4 py-2 font-mono text-xs text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
