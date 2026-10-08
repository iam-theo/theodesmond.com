import { useEffect, useState } from "react"
import { api } from "../lib/api"

export default function PostViews({ slug }) {
  const [count, setCount] = useState(null)

  useEffect(() => {
    let alive = true
    api
      .post(`/api/views/${encodeURIComponent(slug)}`)
      .then((data) => {
        if (alive && data && typeof data.count === "number") setCount(data.count)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [slug])

  if (count === null) return null
  return (
    <>
      <span aria-hidden>·</span>
      <span title="Unique visitors">
        {count.toLocaleString()} {count === 1 ? "view" : "views"}
      </span>
    </>
  )
}