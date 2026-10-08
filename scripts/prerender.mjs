import { readFile, writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import {
  SITE_URL,
  routeMeta,
  clampDescription,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPostMeta,
  buildWebSiteJsonLd,
  buildPersonJsonLd,
} from "../src/lib/seo.js"
import { products, posts } from "../src/data.js"

const DIST = join(process.cwd(), "dist")

const mainPages = [
  { href: "/portfolio", label: "Portfolio — products & platforms" },
  { href: "/ventures", label: "Ventures — the companies behind the work" },
  { href: "/work", label: "Work With Theo — product, architecture & AI" },
  { href: "/about", label: "About Theo Desmond" },
  { href: "/ai", label: "AI & The Future — engineering with AI" },
  { href: "/lab", label: "The Technical Lab — experiments" },
  { href: "/blog", label: "Blog — essays on AI, architecture & building" },
  { href: "/contact", label: "Contact Theo Desmond" },
]

const pageSpecs = {
  "/": {
    h1: "Theo Desmond — Product Architect, Full-Stack Engineer, AI Strategist",
    lead: "Product Architect, Full-Stack Engineer & AI Strategist building scalable digital products, intelligent systems and technology ventures.",
    paras: [
      "I am Theo Desmond — a founder, product architect, full-stack engineer and AI strategist building scalable digital products, intelligent systems and technology ventures from Nigeria.",
      "I design and build products that turn complex ideas into real-world solutions, from product strategy and system architecture to deployed infrastructure. As a product architect I own the full arc from whiteboard to production, and as a full-stack engineer I ship the frontend, backend and infrastructure myself.",
      "I lead two ventures: TD Nwogu Global Enterprise, a CAC-registered business venture, and Auracle Technologies, my technology company building AI-powered products and financial infrastructure.",
      "Under those ventures I am building a portfolio of products — AuraPay for payments, Aurex for AI agents, AuraPanel for server infrastructure, AuraPMO, AuraHRMS, AuraNotify and AuraMart.",
      "Explore the portfolio, read the essays on building systems that last, or work with me on your next product. Follow the work on GitHub, LinkedIn and X, or share any essay with the social sharing links on each post.",
    ],
  },
  "/portfolio": {
    h1: "Products and platforms I build.",
    lead: "The companies I lead, the digital products, FinTech infrastructure and AI systems I design and build — from AuraPay and Aurex to AuraPanel, AuraPMO, AuraHRMS, AuraNotify and AuraMart.",
    paras: [
      "The companies I lead — TD Nwogu Global Enterprise and Auracle Technologies — share one mission: building a stronger digital magnitude for Africa.",
      "The products span FinTech infrastructure, AI agent infrastructure, cloud and DevOps platforms, enterprise project management, HR technology, programmable communications and commerce.",
      "Beyond shipping, the Technical Lab is where I test and research what comes next: AI agents, RAG, local LLMs, NFC payments and developer infrastructure.",
      "Each product page below covers the problem, the architecture and the technology behind it — the full stack from product strategy to deployed infrastructure.",
      "Browse the products, then read the essays — the same thinking that ships the software is in the writing.",
    ],
  },
  "/work": {
    h1: "Work in product, technology and AI systems.",
    lead: "Work with Theo Desmond for product development, technology architecture, AI systems, technical leadership or advisory — turn complex problems into systems that work.",
    paras: [
      "I help founders, companies and institutions build, modernize or rethink their technology — from shaping an idea and defining technical direction to leading implementation.",
      "My work covers product development, technology architecture, AI systems, technical leadership and independent advisory for important decisions.",
      "That work lives across financial services, enterprise, workforce and HR, project and delivery, and commerce — always anchored to real business outcomes.",
      "If you are building something ambitious, start a conversation — from a whiteboard problem to a production system.",
      "The work is where product, engineering and business intersect: a clear problem, a deliberate architecture, and a team that ships.",
    ],
  },
  "/ventures": {
    h1: "The ventures and the work.",
    lead: "Two entities, one mission: TD Nwogu Global Enterprise, a CAC-registered business venture, and Auracle Technologies, the technology company building AI-powered products and financial infrastructure.",
    paras: [
      "The business venture: TD Nwogu Global Enterprise registers with the Corporate Affairs Commission (CAC) and pursues opportunities across digital technology, consulting, commerce, product development and emerging businesses.",
      "The technology company: Auracle Technologies focuses on AI-powered products, financial infrastructure, software platforms and intelligent digital ecosystems.",
      "Auracle's ecosystem spans AuraPay in FinTech, AuraBot in AI, AuraCloud for cloud infrastructure, AuraDev for developer tools and Aurex for AI agent execution.",
      "The two entities work in sequence: the venture holds the opportunity and the technology company builds the product.",
      "Both ventures exist to move Africa from consuming technology to creating, owning and scaling it — through products, platforms and people.",
    ],
  },
  "/about": {
    h1: "Building technology for a mission.",
    lead: "Founder, product architect, full-stack engineer and AI strategist — making technology comfortable for mankind and building a stronger digital magnitude for Africa.",
    paras: [
      "Most people meet code as a tool. I met it as a doorway — I started by making things work, learning to build from the ground up, and the questions changed with every deploy.",
      "My digital mandate is making technology comfortable for mankind: the complexity belongs inside the system, and the experience stays intuitive for the person using it.",
      "My mission is building a stronger digital magnitude for Africa — helping a continent move from consuming technology to creating, owning and scaling it.",
      "I believe technology should serve people, Africa should build rather than only consume, ownership matters, and innovation requires experimentation.",
      "Beyond applications, I invest in AI infrastructure, data centers, cloud infrastructure, telecommunications, research and technology education.",
    ],
  },
  "/ai": {
    h1: "AI from feature to infrastructure.",
    lead: "AI is moving from feature to infrastructure. Agents, RAG, orchestration and sandboxed execution — the systems behind autonomous development.",
    paras: [
      "AI is moving from feature to infrastructure. The teams that ship durable AI products treat the model like a database or a queue — a dependable layer other parts of the product stand on.",
      "That means the interesting work lives around the model: RAG pipelines for context, evaluation harnesses before users, fallback chains across models, guardrails on cost and behaviour, and observability tracing every request.",
      "I design and build AI systems across agents, LLM orchestration, autonomous development, code generation and intelligent automation.",
      "Aurex is my AI agent execution platform — combining orchestration, code generation, sandboxed execution and autonomous workflows.",
      "Read the essay on why I think of AI as infrastructure, or work with me to build AI systems that last.",
    ],
  },
  "/lab": {
    h1: "On the bench right now.",
    lead: "An active lab, not a static CV. The products, experimental systems and ongoing research Theo Desmond is building, testing and shipping right now.",
    paras: [
      "An active lab, not a static CV. Right now I am building AI agents, local LLMs, WebSockets, payment infrastructure, NFC payments, cloud infrastructure, developer tooling, automation and Android systems.",
      "Some of that is live, some is experimental, and some is on the bench being shaped into the next product.",
      "The lab feeds the portfolio: what starts as an experiment — AI agents, RAG, developer infrastructure — becomes a product or platform.",
      "If you are exploring the same problems — AI infrastructure, developer tools or ambient payments — the lab is a good place to start a conversation.",
      "A bench, a pipeline and a few running bets — that is the lab.",
    ],
  },
  "/blog": {
    h1: "Essays and notes on building.",
    lead: "Notes and essays from Theo Desmond on AI engineering, software architecture, FinTech, product development and building systems that last.",
    paras: [
      "Notes from Theo Desmond on AI engineering, software architecture, FinTech, product development and the discipline of building systems that last.",
      "Recent essays include: why AI should be treated as infrastructure, why architecture is a product decision, what payment infrastructure teaches about engineering discipline, and a founder's approach to technical debt.",
      "Writing is where I turn the patterns from building into argument — ideas I can stand behind in code and in business.",
      "The essays are deliberately short and practical — written from the trenches of building infrastructure, not from theory.",
      "Subscribe or come back often: the list is longer than the archive, because the writing only covers what survived contact with real systems.",
    ],
  },
  "/contact": {
    h1: "A problem you need solved.",
    lead: "Ambitious products, complex engineering problems, and opportunities where technology creates measurable impact. Start the conversation.",
    paras: [
      "Start a conversation about building a product, technology consulting, AI and automation, engineering collaboration, or speaking and partnership.",
      "The fastest way to reach me is email at hello@theodesmond.com or the contact form on this page.",
      "Tell me what you are building and what problem you need solved — complex problems and ambitious products get my attention.",
      "Every engagement starts with the same question: what is the real outcome you need, and what is the simplest system that gets you there?",
      "Whether you are a founder, an institution or a team, the conversation starts with the problem, not the pitch — reach out and we will work out the right starting point together.",
    ],
  },
}

const SHELL_STYLE = `<style>
  .seo-shell { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 44rem; margin: 0 auto; padding: 3rem 1.5rem 5rem; color: #18181b; background: #fff; }
  .js .seo-shell { display: none !important; }
  .seo-shell h1 { font-size: 2.2rem; line-height: 1.15; margin: 0 0 1rem; }
  .seo-shell h2 { font-size: 1.1rem; margin: 2.5rem 0 0.6rem; border-top: 1px solid #e4e4e7; padding-top: 1.2rem; }
  .seo-shell .seo-lead { font-size: 1.05rem; line-height: 1.6; color: #3f3f46; }
  .seo-shell ul { columns: 2; column-gap: 2rem; padding-left: 0; list-style: none; margin: 0; }
  .seo-shell li { margin: 0 0 0.45rem; break-inside: avoid; }
  .seo-shell a { color: #334155; text-decoration: underline; text-underline-offset: 2px; }
</style>`

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function safeText(s) {
  return String(s).replace(/[\n\r\u2028\u2029]/g, " ").trim()
}

function linkList(section, links, ariaLabel) {
  if (!links.length) return ""
  const rows = links
    .map(
      (l) =>
        `          <li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`
    )
    .join("\n")
  return `      <nav aria-label="${escapeHtml(ariaLabel)}">
        <h2>${escapeHtml(section)}</h2>
        <ul>
${rows}
        </ul>
      </nav>`
}

function productLinks() {
  return products.map((p) => ({
    href: `/portfolio/${p.slug}`,
    label: `${p.name} — ${p.category}`,
  }))
}

function postLinks() {
  return posts.map((p) => ({
    href: `/blog/${p.slug}`,
    label: p.title,
  }))
}

function shellBody({ h1, lead, paras }) {
  const indexLinks = [
    { href: "/", label: "Home — Theo Desmond" },
    ...mainPages,
    ...productLinks().map((l) => ({ href: l.href, label: `Product: ${l.label}` })),
    ...postLinks().map((l) => ({ href: l.href, label: `Essay: ${l.label}` })),
  ]
  const index = linkList(
    "Explore this website",
    indexLinks,
    "Main sections of this website"
  )
  const connectLinks = [
    { href: "https://github.com/iam-theo", label: "GitHub — code, experiments & open source" },
    { href: "https://www.linkedin.com/in/iam-theo/", label: "LinkedIn — professional history & network" },
    { href: "https://x.com/iam__theo", label: "X (Twitter) — builds, ideas & product notes" },
    { href: "https://www.instagram.com/iam___theo", label: "Instagram — behind the builds" },
    { href: "mailto:hello@theodesmond.com", label: "Email hello@theodesmond.com" },
  ]
  const connect = linkList(
    "Connect & share",
    connectLinks,
    "External profiles and sharing links"
  )
  const liveProducts = linkList(
    "Live products",
    [
      { href: "https://auraapay.com", label: "AuraPay — live FinTech product" },
      { href: "https://runaurex.tech", label: "Aurex — live AI agent platform" },
      { href: "https://aurahost.online", label: "AuraPanel — live server platform" },
    ],
    "Live external products"
  )

  return `<div id="root"><div class="seo-shell">
    <main>
      <h1>${escapeHtml(h1)}</h1>
      <p class="seo-lead">${escapeHtml(safeText(lead))}</p>
${paras.map((p) => `      <p>${escapeHtml(safeText(p))}</p>`).join("\n")}
${index}
${connect}
${liveProducts}
    </main>
  </div></div>`
}

function normalizeTemplate(template) {
  return template
    .replace(
      /<div id="root">\s*<div class="seo-shell">[\s\S]*?<\/div>\s*<\/div>\s*<\/body>/i,
      '<div id="root"></div>\n  </body>'
    )
    .replace(/<style>\s*\.seo-shell[\s\S]*?<\/style>\n?/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, "")
    .replace(/<!-- SBP-COUNT:[0-9]* -->\n?/g, "")
}

function jsonLdTag(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
}

async function writeRoute(route, template) {
  const { title, description, keywords, jsonLd, h1, lead, paras, ogType, article } = route

  const articleTags = article
    ? [
        article.publishedTime
          ? `<meta property="article:published_time" content="${escapeHtml(article.publishedTime)}" />`
          : "",
        article.modifiedTime
          ? `<meta property="article:modified_time" content="${escapeHtml(article.modifiedTime)}" />`
          : "",
        article.section
          ? `<meta property="article:section" content="${escapeHtml(article.section)}" />`
          : "",
        `<meta property="article:author" content="${escapeHtml(article.authorUrl || `${SITE_URL}/about`)}" />`,
        ...(article.tags || [])
          .slice(0, 10)
          .map((t) => `<meta property="article:tag" content="${escapeHtml(t)}" />`),
        `<meta name="author" content="Theo Desmond" />`,
        `<meta name="twitter:creator" content="@iam__theo" />`,
      ]
        .filter(Boolean)
        .join("\n    ")
    : ""

  let html = template
    .replace(/<title>[^<]*<\/title>/g, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/g,
      `<meta name="description" content="${escapeHtml(safeText(description))}" />`
    )
    .replace(
      /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/g,
      `<meta name="keywords" content="${escapeHtml(keywords)}" />`
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/g,
      `<link rel="canonical" href="${route.canonical}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/g,
      `<meta property="og:title" content="${escapeHtml(title)}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/g,
      `<meta property="og:description" content="${escapeHtml(safeText(description))}" />`
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/g,
      `<meta property="og:url" content="${route.canonical}" />`
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/g,
      `<meta name="twitter:title" content="${escapeHtml(title)}" />`
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/g,
      `<meta name="twitter:description" content="${escapeHtml(safeText(description))}" />`
    )
    .replace(
      /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/g,
      `<meta property="og:type" content="${escapeHtml(ogType || "website")}" />`
    )
    .replace("<div id=\"root\"></div>", shellBody({ h1, lead, paras: paras || [] }))
    .replace("</head>", `${SHELL_STYLE}${jsonLd}\n    ${articleTags}</head>`)

  const outPath = join(DIST, route.path.replace(/^\//, ""), "index.html")
  await mkdir(join(outPath, ".."), { recursive: true })
  await writeFile(outPath, html)
  return outPath
}

function makeRoute(path, meta, overrides = {}) {
  const canonical = `${SITE_URL}${path === "/" ? "/" : path}`
  return {
    path,
    canonical,
    title: meta.title,
    description: clampDescription(meta.description),
    keywords: (meta.keywords || []).join(", "),
    ogType: meta.ogType || "website",
    article: null,
    ...overrides,
  }
}

function buildRoutes() {
  const routes = []

  for (const path of Object.keys(routeMeta)) {
    const spec = pageSpecs[path] || { h1: routeMeta[path].title, lead: routeMeta[path].description }
    const jsonLd =
      path === "/"
        ? [buildWebSiteJsonLd(), buildPersonJsonLd()].map(jsonLdTag).join("")
        : ""
    routes.push(
      makeRoute(path, routeMeta[path], {
        h1: spec.h1,
        lead: spec.lead,
        paras: spec.paras || [],
        jsonLd,
      })
    )
  }

  for (const p of products) {
    routes.push(
      makeRoute(`/portfolio/${p.slug}`, routeMeta["/portfolio"], {
        title: `${p.name} — ${p.category} · Theo Desmond`,
        description: clampDescription(p.seoDesc || p.details || p.tagline),
        keywords: [...p.tags, p.category].join(", "),
        h1: `${p.name} — ${p.category}`,
        lead: p.details,
        paras: [
          p.seoDesc || p.details || p.tagline,
          p.overview,
          `Core features include ${p.features.slice(0, 3).join("; ")}.`,
          p.architecture,
          `Built with ${p.framework.slice(0, 4).join(", ")}. ${p.name} sits in the ${p.category} space — explore the portfolio or start a conversation.`,
        ],
        jsonLd: createProductJsonLd(p),
      })
    )
  }

  const postH1 = {
    "ai-as-infrastructure": "AI as infrastructure.",
    "architecture-is-a-product-decision": "Architecture is a product decision.",
    "lessons-from-payment-infrastructure": "Building payment infrastructure.",
    "systems-that-last": "Technical debt is a decision problem.",
    "inside-aurex-building-intelligence-into-the-system":
      "Building AI systems that can actually do the work.",
  }


    for (const post of posts) {
    const meta = buildPostMeta(post, post.slug)
    const toIso = (v) => {
      if (!v) return ""
      if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.length === 10 ? `${v}T00:00:00+00:00` : v
      const d = new Date(v)
      return Number.isNaN(d.getTime()) ? "" : d.toISOString()
    }
    routes.push(
      makeRoute(`/blog/${post.slug}`, routeMeta["/blog"], {
        title: meta.title,
        description: meta.description,
        keywords: meta.keywords.join(", "),
        ogType: "article",
        article: {
          publishedTime: toIso(post.datePublished || post.date),
          modifiedTime: toIso(post.dateModified || post.datePublished || post.date),
          section: post.topic,
          tags: meta.keywords,
          authorUrl: `${SITE_URL}/about`,
        },
        h1: postH1[post.slug] || post.title,
        lead: post.excerpt,
        paras: (post.blocks || [])
          .filter((b) => b.type === "p")
          .map((b) => b.text)
          .slice(0, 4),
        jsonLd: [buildArticleJsonLd(post, post.slug), buildBreadcrumbJsonLd(post, post.slug)]
          .map(jsonLdTag)
          .join(""),
      })
    )
  }

  return routes
}

function createProductJsonLd(p) {
  return jsonLdTag({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    category: p.category,
    description: p.details,
    brand: { "@type": "Brand", name: "Auracle Technologies" },
    url: `${SITE_URL}/portfolio/${p.slug}`,
  })
}

async function main() {
  const template = normalizeTemplate(await readFile(join(DIST, "index.html"), "utf8"))
  const routes = buildRoutes()
  let count = 0
  for (const route of routes) {
    const out = await writeRoute(route, template)
    count++
    console.log(`prerendered ${route.path} -> ${out.replace(DIST, "dist")}`)
  }
  console.log(`\nPrerendered ${count} routes into dist/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
