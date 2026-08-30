import { useCallback, useEffect, useState } from "react"
import { ThemeContext } from "./themeContext.js"

function getInitialTheme() {
  if (typeof window === "undefined") return "light"
  try {
    const stored = window.localStorage.getItem("theme")
    if (stored === "light" || stored === "dark") return stored
  } catch {
    /* ignore storage errors */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    try {
      window.localStorage.setItem("theme", theme)
    } catch {
      /* ignore storage errors */
    }
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), [])

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}
