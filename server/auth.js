import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { query } from "./db.js"

const JWT_DAYS = 7

function jwtSecret() {
  return process.env.JWT_SECRET || "change-me-in-production"
}

/** Seed the first staff account from env (only when the table is empty). */
export async function seedAdmin() {
  const { rows } = await query("select count(*)::int as n from admin_users")
  if (rows[0].n > 0) return null
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || ""
  if (!email || !password) {
    console.log("[auth] no admin users and ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping seed")
    return null
  }
  const hash = await bcrypt.hash(password, 12)
  await query("insert into admin_users (email, password_hash) values ($1, $2)", [email, hash])
  console.log(`[auth] seeded admin user ${email}`)
  return email
}

export async function login(email, password) {
  const { rows } = await query("select * from admin_users where email = $1", [
    String(email || "").trim().toLowerCase(),
  ])
  const user = rows[0]
  if (!user) return null
  const ok = await bcrypt.compare(String(password || ""), user.password_hash)
  if (!ok) return null
  const token = jwt.sign({ sub: user.id, email: user.email }, jwtSecret(), {
    expiresIn: `${JWT_DAYS}d`,
  })
  return { token, email: user.email }
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (!token) return res.status(401).json({ error: "unauthorized" })
  try {
    req.user = jwt.verify(token, jwtSecret())
    next()
  } catch {
    return res.status(401).json({ error: "unauthorized" })
  }
}
