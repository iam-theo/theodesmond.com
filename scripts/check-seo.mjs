import { readdir, readFile } from "node:fs/promises"
import { join, relative } from "node:path"

const DIST = join(process.cwd(), "dist")

async function collectIndexFiles(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await collectIndexFiles(full)
      if (entry.name === "index.html") out.push(full)
      out.push(...nested)
    } else if (entry.name === "index.html") {
      out.push(full)
    }
  }
  return out
}

function visibleHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function wordCount(text) {
  const words = text.split(" ").filter((w) => /[A-Za-z0-9]/.test(w))
  return words.length
}

function extractAttr(html, name, tag = "meta") {
  const m = html.match(
    new RegExp(`<${tag}\\s+name="${name}"\\s+content="([^"]*)"`, "i")
  )
  return m ? m[1] : ""
}

function paragraphs(html) {
  const body = html.includes("<div id=\"root\">")
    ? html.slice(html.indexOf("<div id=\"root\">"))
    : html
  return (body.match(/<p[^>]*>[\s\S]*?<\/p>/g) || []).length
}

const issues = []
let checked = 0

for (const file of await collectIndexFiles(DIST)) {
  const route = "/" + relative(DIST, file).replace(/index\.html$/, "")
  const clean = route === "/" ? "/" : route.replace(/\/$/, "")
  const html = await readFile(file, "utf8")
  checked++

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ""
  const description = extractAttr(html, "description")
  const keywords = extractAttr(html, "keywords")
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/)?.[1] ?? ""
  const h1s = (html.match(/<h1>/g) || []).length
  const h2s = (html.match(/<h2>/g) || []).length
  const paras = paragraphs(html)
  const words = wordCount(visibleHtml(html))
  const body = visibleHtml(html).toLowerCase()

  const findings = []
  const push = (flag, msg) => {
    findings.push(`${flag} ${msg}`)
    issues.push(`${clean} — ${msg}`)
  }

  if (title.length === 0) push("FAIL", "missing <title>")
  else if (title.length > 60) push("FAIL", `title too long: ${title.length} chars`)
  if (description.length === 0) push("FAIL", "missing meta description")
  else if (description.length > 155) push("FAIL", `description too long: ${description.length} chars`)
  if (keywords.length === 0) push("FAIL", "missing meta keywords")
  else {
    const stop = new Set(["the", "for", "and", "with", "from", "into", "that"])
    const list = keywords.split(",").map((k) => k.trim()).filter(Boolean)
    if (list.length < 2 || list.length > 12) push("FAIL", `keyword count ${list.length} out of 2-12`)
    const uncovered = []
    for (const kw of list) {
      const tokens = kw.toLowerCase().split(/\s+/).filter((t) => t.replace(/[^a-z0-9]/g, "").length > 2 && !stop.has(t))
      const hits = tokens.filter((t) => body.includes(t))
      if (tokens.length && hits.length < tokens.length) uncovered.push(`${kw} (${hits.length}/${tokens.length})`)
    }
    for (const u of uncovered) findings.push(`INFO uncovered "${u}"`)
  }
  if (h1s !== 1) push("FAIL", `expected exactly 1 H1, got ${h1s}`)
  else {
    const h1 = html.match(/<h1>([^<]*)<\/h1>/)?.[1] ?? ""
    if (h1.trim().split(/\s+/).length < 3) push("FAIL", `H1 too short: "${h1}"`)
  }
  if (h2s < 1) push("FAIL", `no H2 headings (got ${h2s})`)
  if (paras < 3) push("FAIL", `only ${paras} paragraph(s)`)
  if (words < 250) push("WARN", `little text: ${words} words`)
  if (!canonical) push("FAIL", "missing canonical")
  else if (canonical !== `https://theodesmond.com${clean}`) push("FAIL", `canonical mismatch: ${canonical}`)

  console.log(
    `${clean.padEnd(42)} title:${String(title.length).padStart(2)} desc:${String(description.length).padStart(3)} kw:${keywords.split(",").length} H1:${h1s} H2:${h2s} paras:${paras} words:${words}`
  )
  for (const f of findings) console.log(`   ${f}`)
}

console.log(
  `\nChecked ${checked} pages — ${issues.length ? issues.join("\n  ") : "no issues"}
`
)