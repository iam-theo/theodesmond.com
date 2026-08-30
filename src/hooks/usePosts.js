import { useEffect, useState } from "react"
import { fetchPosts } from "../lib/blogData"

export function usePosts() {
  const [posts, setPosts] = useState(null)

  useEffect(() => {
    let alive = true
    fetchPosts().then((p) => {
      if (alive) setPosts(p)
    })
    return () => {
      alive = false
    }
  }, [])

  return posts
}
