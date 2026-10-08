import { useEffect, useState } from "react"
import { fetchProducts } from "../lib/content"
import { products as localProducts } from "../data"

/** Returns DB-driven products (bundled data as instant default, DB when ready). */
export function useProducts() {
  const [products, setProducts] = useState(localProducts)

  useEffect(() => {
    let alive = true
    fetchProducts().then((p) => {
      if (alive) setProducts(p)
    })
    return () => {
      alive = false
    }
  }, [])

  return products
}
