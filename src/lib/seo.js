export const SITE_URL = "https://theodesmond.com"
export const SITE_NAME = "Theo Desmond"
export const SITE_DEFAULT_IMAGE = `${SITE_URL}/og-image.png`
export const AUTHOR = "Theo Desmond"

const root = {
  title: "Theo Desmond — Product Architect, Full-Stack Engineer & AI Strategist",
  description:
    "Theo Desmond is a founder, product architect, full-stack engineer and AI strategist building scalable digital products, intelligent systems and technology ventures from Nigeria.",
  keywords: [
    "Theo Desmond",
    "product architect",
    "full-stack engineer",
    "AI strategist",
    "software engineer Nigeria",
    "FinTech infrastructure",
    "AI agent infrastructure",
    "digital product development",
  ],
}

export const routeMeta = {
  "/": {
    ...root,
    ogType: "website",
  },
  "/portfolio": {
    title: "Portfolio — Products & Platforms by Theo Desmond",
    description:
      "Explore the companies, digital products, FinTech infrastructure and AI systems designed and built by Theo Desmond — from DtheHub and AuraPay to Aurex and FASYL PMO.",
    keywords: [
      "Theo Desmond portfolio",
      "digital products",
      "FinTech infrastructure",
      "AI platform",
      "enterprise software",
      "Aurex",
      "AuraPay",
    ],
    ogType: "website",
  },
  "/ventures": {
    title: "Ventures — TD Nwogu Global Enterprise & Auracle Technologies",
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
    keywords: ["contact Theo Desmond", "hire product architect", "technology consulting", "AI collaboration"],
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

export function buildArticleJsonLd(post, slug) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || "",
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: AUTHOR,
      url: `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Person",
      name: AUTHOR,
      url: `${SITE_URL}/about`,
    },
    mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
    keywords: (post.topic || "").toLowerCase(),
  }
}

export function buildPersonJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: AUTHOR,
    url: SITE_URL,
    jobTitle: "Founder, Product Architect & AI Strategist",
    description: root.description,
    knowsAbout: [
      "Product Architecture",
      "Full-Stack Engineering",
      "AI & Intelligent Systems",
      "FinTech Infrastructure",
      "Technology Entrepreneurship",
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
