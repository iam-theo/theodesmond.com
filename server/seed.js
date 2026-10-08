import { pool, initDb } from "./db.js"
import * as data from "../src/data.js"

/**
 * Seed the self-hosted DB from src/data.js.
 * Usage: npm run server:seed   (needs DATABASE_URL)
 * Idempotent — safe to re-run (upserts by key).
 */
async function seed() {
  await initDb()

  // ---------- posts (only seed when table is empty — never overwrite admin edits) ----------
  const { rows: existing } = await pool.query("select count(*)::int as n from posts")
  if (existing[0].n === 0) {
    for (const [i, p] of data.posts.entries()) {
      await pool.query(
        `insert into posts (slug, title, seo_title, topic, date, date_published, date_modified, read_time, excerpt, seo_description, keywords, og_image, status, blocks, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [p.slug, p.title, p.seoTitle || null, p.topic, p.date, p.datePublished || null,
         p.dateModified || null, p.readTime, p.excerpt, p.seoDescription || null,
         p.keywords || [], p.ogImage || null, p.status || "Published", JSON.stringify(p.blocks || []), i + 1]
      )
    }
    console.log(`seeded ${data.posts.length} posts`)
  } else {
    console.log(`posts table already has ${existing[0].n} rows — skipping`)
  }

  // ---------- products ----------
  for (const [i, p] of data.products.entries()) {
    await pool.query(
      `insert into products (slug, idx, name, tagline, category, industry, tags, status, accent, visual, image, link, details, seo_desc, overview, features, functions, architecture, framework, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       on conflict (slug) do update set
         idx = excluded.idx, name = excluded.name, tagline = excluded.tagline,
         category = excluded.category, industry = excluded.industry, tags = excluded.tags,
         status = excluded.status, accent = excluded.accent, visual = excluded.visual,
         image = excluded.image, link = excluded.link, details = excluded.details,
         seo_desc = excluded.seo_desc, overview = excluded.overview, features = excluded.features,
         functions = excluded.functions, architecture = excluded.architecture,
         framework = excluded.framework, sort_order = excluded.sort_order, updated_at = now()`,
      [p.slug, p.index, p.name, p.tagline, p.category, p.industry, p.tags, p.status, p.accent,
       p.visual, p.image, p.link, p.details, p.seoDesc, p.overview, p.features, p.functions,
       p.architecture, p.framework, i + 1]
    )
  }
  console.log(`seeded ${data.products.length} products`)

  // ---------- site_content ----------
  const keys = [
    "nav", "roles", "identity", "tagline", "supporting", "heroStats", "storyParas",
    "storyStages", "mandate", "beliefs", "workStories", "beyondSoftware",
    "beyondSoftwareStatement", "currentFocus", "company", "auracle", "companies",
    "experiments", "pipeline", "aiCapabilities", "lab", "blogTopics",
    "contactCategories", "socials", "testimonials",
    "heroWords", "homeCopy", "workCopy", "pageHeaders", "footerCopy",
    "subscribeCopy", "contactIntro", "blogCopy", "labIntro", "aiIntro",
    "architectureIntro", "branding",
  ]
  for (const k of keys) {
    await pool.query(
      "insert into site_content (key, value) values ($1, $2) on conflict (key) do nothing",
      [k, JSON.stringify(data[k])]
    )
  }
  console.log(`seeded ${keys.length} content keys (new keys only — existing values untouched)`)

  await pool.end()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
