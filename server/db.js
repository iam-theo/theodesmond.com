import pg from "pg"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
})

export function query(text, params) {
  return pool.query(text, params)
}

/** Create all tables (idempotent). Called on every boot. */
export async function initDb() {
  const sql = readFileSync(join(here, "schema.sql"), "utf8")
  let retries = 30
  while (retries > 0) {
    try {
      await pool.query(sql)
      return
    } catch (err) {
      if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") {
        retries--
        if (retries === 0) throw err
        await new Promise((r) => setTimeout(r, 1000))
      } else {
        throw err
      }
    }
  }
}
