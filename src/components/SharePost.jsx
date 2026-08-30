import { useEffect, useState } from "react"
import { SITE_URL } from "../lib/seo"

const SHARE_LABELS = {
  x: "Share on X",
  linkedin: "Share on LinkedIn",
  facebook: "Share on Facebook",
  whatsapp: "Share on WhatsApp",
}

function shareUrl(platform, url, title) {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  switch (platform) {
    case "x":
      return `https://twitter.com/intent/tweet?url=${u}&text=${t}`
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`
    case "whatsapp":
      return `https://wa.me/?text=${t}%20${u}`
    default:
      return url
  }
}

function ShareIcon({ platform }) {
  const props = {
    className: "h-4 w-4",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
  }
  switch (platform) {
    case "x":
      return (
        <svg {...props}>
          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
        </svg>
      )
    case "linkedin":
      return (
        <svg {...props}>
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
        </svg>
      )
    case "facebook":
      return (
        <svg {...props}>
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" />
        </svg>
      )
    case "whatsapp":
      return (
        <svg {...props}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      )
    case "link":
      return (
        <svg
          {...props}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
        </svg>
      )
    default:
      return null
  }
}

export default function SharePost({ slug, title }) {
  const url = `${SITE_URL}/blog/${slug}`
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      /* clipboard unavailable */
    }
  }

  const platforms = ["x", "linkedin", "facebook", "whatsapp"]

  return (
    <div className="mt-14 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          Share this essay
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {platforms.map((platform) => (
            <a
              key={platform}
              href={shareUrl(platform, url, title)}
              target="_blank"
              rel="noopener noreferrer"
              title={SHARE_LABELS[platform]}
              aria-label={SHARE_LABELS[platform]}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
            >
              <ShareIcon platform={platform} />
            </a>
          ))}
          <button
            type="button"
            onClick={copy}
            title={copied ? "Link copied" : "Copy link"}
            aria-label={copied ? "Link copied" : "Copy link"}
            className={`flex h-9 items-center gap-2 rounded-full border px-4 font-mono text-xs font-medium transition-colors ${
              copied
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
            }`}
          >
            <ShareIcon platform="link" />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  )
}
