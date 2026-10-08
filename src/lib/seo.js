export const SITE_URL = "https://theodesmond.com"
export const SITE_NAME = "Theo Desmond"
export const SITE_DEFAULT_IMAGE = `${SITE_URL}/og-image.png`
export const AUTHOR = "Theo Desmond"

const root = {
  title: "Theo Desmond — Product Architect, Full-Stack Engineer",
  description:
    "Theo Desmond is a founder, product architect, full-stack engineer, AI strategist and digital business consultant helping businesses plan and grow in the digital space, building scalable digital products and ventures from Nigeria.",
  keywords: [
    "Theo Desmond",
    "product architect",
    "full-stack engineer",
    "AI strategist",
    "digital business consultant",
    "AI agents",
    "financial infrastructure",
    "technology ventures",
    "Nigeria",
  ],
}

export function clampTitle(title, max = 58) {
  if (title.length <= max) return title
  const cut = title.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  const end = lastSpace > max * 0.5 ? lastSpace : max - 1
  return `${cut.slice(0, end)}…`
}

export function clampDescription(text, max = 155) {
  const clean = String(text).replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  const end = lastSpace > max * 0.5 ? lastSpace : max - 1
  return `${clean.slice(0, end)}…`
}

export const routeMeta = {
  "/": {
    ...root,
    ogType: "website",
  },
  "/portfolio": {
    title: "Portfolio — Products & Platforms by Theo Desmond",
    description:
      "Explore the digital products, FinTech infrastructure and AI systems designed and built by Theo Desmond — from AuraPay and Aurex to AuraPanel and AuraPMO.",
    keywords: [
      "Theo Desmond portfolio",
      "digital products",
      "FinTech infrastructure",
      "enterprise platforms",
      "AI systems",
      "AuraPay",
      "Aurex",
    ],
    ogType: "website",
  },
  "/work": {
    title: "Work With Theo — Product Development, Architecture & AI",
    description:
      "Bring Theo Desmond in for product development, technology architecture, AI systems and technical leadership — turn complex problems into systems that work.",
    keywords: [
      "work with Theo Desmond",
      "product development",
      "technology architecture",
      "AI systems",
      "technical leadership",
      "technology advisory",
    ],
    ogType: "website",
  },
  "/ventures": {
    title: "Ventures — TD Nwogu & Auracle Technologies",
    description:
      "Two entities, one mission. TD Nwogu Global Enterprise and Auracle Technologies — the business and technology ventures founded by Theo Desmond.",
    keywords: [
      "TD Nwogu Global Enterprise",
      "Auracle Technologies",
      "Theo Desmond ventures",
      "technology company",
      "CAC registered business",
    ],
    ogType: "website",
  },
  "/about": {
    title: "About Theo Desmond — Building Technology With a Purpose",
    description:
      "The story, digital mandate and current focus of Theo Desmond: making technology comfortable for mankind and building a stronger digital magnitude for Africa.",
    keywords: [
      "about Theo Desmond",
      "digital mandate",
      "building technology for Africa",
      "technology entrepreneurship",
      "AI infrastructure",
    ],
    ogType: "profile",
  },
  "/ai": {
    title: "AI Engineering & The Future — Theo Desmond",
    description:
      "AI is moving from feature to infrastructure. Agents, RAG, orchestration and sandboxed execution — the systems behind autonomous development.",
    keywords: [
      "AI infrastructure",
      "AI agents",
      "RAG systems",
      "LLM orchestration",
      "autonomous development",
      "AI engineering",
    ],
    ogType: "website",
  },
  "/lab": {
    title: "The Technical Lab — Experiments by Theo Desmond",
    description:
      "An active lab, not a static CV. See what Theo Desmond is building, testing and shipping right now — live products, experimental systems and ongoing research.",
    keywords: ["technical lab", "experiments", "developer tooling", "AI agents", "NFC payments"],
    ogType: "website",
  },
  "/blog": {
    title: "Blog — Essays on AI, Architecture, FinTech & Building",
    description:
      "Notes and essays from Theo Desmond on AI engineering, software architecture, FinTech, product development and the discipline of building systems that last.",
    keywords: [
      "AI engineering blog",
      "software architecture",
      "FinTech essays",
      "product development",
      "technical debt",
      "engineering leadership",
    ],
    ogType: "website",
  },
  "/contact": {
    title: "Contact Theo Desmond — Start a Conversation",
    description:
      "Have a problem worth building? Get in touch with Theo Desmond about products, engineering, AI, FinTech or technology partnerships.",
    keywords: ["contact Theo Desmond", "product development", "technology consulting", "AI and automation", "engineering collaboration"],
    ogType: "website",
  },
}

export function pageMeta(pathname, overrides = {}) {
  const base = routeMeta[pathname] || root
  return { ...base, path: pathname, ...overrides }
}

export function canonicalUrl(pathname) {
  return `${SITE_URL}${pathname === "/" ? "/" : pathname.replace(/\/$/, "")}`
}

function toIsoDate(value) {
  if (!value) return null
  // Already ISO (YYYY-MM-DD or full timestamp)
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.length === 10 ? `${value}T00:00:00+00:00` : value
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export function postWordCount(post) {
  if (!post?.blocks) return 0
  return post.blocks
    .flatMap((b) => {
      if (b.type === "p" || b.type === "quote" || b.type === "h2") return [b.text || ""]
      if (b.type === "ul") return b.items || []
      return []
    })
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length
}

function postReadMinutes(post) {
  const m = /(\d+)\s*min/.exec(post?.readTime || "")
  if (m) return Number(m[1])
  const words = postWordCount(post)
  return Math.max(1, Math.round(words / 200))
}

/** Single source of truth for a blog post's <title>, description + keywords. */
export function buildPostMeta(post, slug) {
  const blog = routeMeta["/blog"]
  const title = clampTitle(post.seoTitle || `${post.title} — Theo Desmond`)
  const description = clampDescription(post.seoDescription || post.excerpt || blog.description)
  const keywords = [
    ...(Array.isArray(post.keywords) ? post.keywords : []),
    post.topic,
    "Theo Desmond",
  ]
    .map((k) => String(k).trim())
    .filter(Boolean)
    .filter((k, i, arr) => arr.findIndex((x) => x.toLowerCase() === k.toLowerCase()) === i)
    .slice(0, 10)
  return {
    title,
    description,
    keywords,
    path: `/blog/${slug}`,
    ogType: "article",
    image: post.ogImage || SITE_DEFAULT_IMAGE,
  }
}

export function buildBreadcrumbJsonLd(post, slug) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.seoTitle || post.title,
        item: `${SITE_URL}/blog/${slug}`,
      },
    ],
  }
}

export function buildArticleJsonLd(post, slug) {
  const meta = buildPostMeta(post, slug)
  const url = canonicalUrl(`/blog/${slug}`)
  const datePublished = toIsoDate(post.datePublished || post.date) || undefined
  const dateModified = toIsoDate(post.dateModified || post.datePublished || post.date) || undefined
  const words = postWordCount(post)
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    image: [meta.image.startsWith("http") ? meta.image : `${SITE_URL}${meta.image}`],
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: {
      "@type": "Person",
      name: AUTHOR,
      url: `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: AUTHOR,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: SITE_DEFAULT_IMAGE,
      },
    },
    articleSection: post.topic || "Blog",
    keywords: meta.keywords.join(", "),
    inLanguage: "en-US",
    ...(words ? { wordCount: words, timeRequired: `PT${postReadMinutes(post)}M` } : {}),
    isPartOf: {
      "@type": "Blog",
      name: "Theo Desmond — Blog",
      url: `${SITE_URL}/blog`,
    },
  }
}

export function buildPersonJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: AUTHOR,
    url: SITE_URL,
    jobTitle: "Founder, Product Architect, AI Strategist & Digital Business Consultant",
    description: root.description,
    knowsAbout: [
      "Product Architecture",
      "Full-Stack Engineering",
      "AI & Intelligent Systems",
      "FinTech Infrastructure",
      "Technology Entrepreneurship",
      "Digital Business Consulting",
    ],
  }
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: root.description,
  }
}
