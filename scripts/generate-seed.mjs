import { mkdirSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { posts } from "../src/data.js"

const here = dirname(fileURLToPath(import.meta.url))

const sqlStr = (v) => "'" + String(v).replace(/'/g, "''") + "'"

const rows = posts.map((p, i) => {
  const blocks = JSON.stringify(p.blocks).replace(/'/g, "''")
  return `  (${sqlStr(p.slug)}, ${sqlStr(p.title)}, ${sqlStr(p.topic)}, ${sqlStr(p.date)}, ${sqlStr(
    p.readTime
  )}, ${sqlStr(p.excerpt)}, ${sqlStr(p.status)}, '${blocks}'::jsonb, ${i + 1})`
})

const out = `-- Auto-generated from src/data.js via: node scripts/generate-seed.mjs
-- Applied by "supabase db push" (after 0001_schema.sql) or paste manually.
-- Re-run anytime to sync your database with data.js.

insert into public.posts (slug, title, topic, date, read_time, excerpt, status, blocks, sort_order)
values
${rows.join(",\n")}
on conflict (slug) do update set
  title = excluded.title,
  topic = excluded.topic,
  date = excluded.date,
  read_time = excluded.read_time,
  excerpt = excluded.excerpt,
  status = excluded.status,
  blocks = excluded.blocks,
  sort_order = excluded.sort_order,
  updated_at = now();
`

const target = join(here, "..", "supabase", "migrations", "0002_seed.sql")
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, out, "utf8")
console.log(`Wrote ${target} (${posts.length} posts)`)
