import { useRef } from "react"

export default function Tilt({ children, className = "", max = 6 }) {
  const ref = useRef(null)

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(
      x * max
    ).toFixed(2)}deg)`
  }

  const onLeave = () => {
    const el = ref.current
    if (el) el.style.transform = ""
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transition: "transform 0.18s ease-out" }}
      className={className}
    >
      {children}
    </div>
  )
}