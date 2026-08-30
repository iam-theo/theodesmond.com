export const Icon = ({ name, className = "h-6 w-6" }) => {
  const paths = {
    product: (
      <>
        <path d="M3 6h18" />
        <path d="M3 12h18" />
        <path d="M3 18h10" />
      </>
    ),
    code: (
      <>
        <path d="m8 9-3 3 3 3" />
        <path d="m16 9 3 3-3 3" />
        <path d="m13 7-2 10" />
      </>
    ),
    ai: (
      <>
        <path d="M12 3a3 3 0 0 1 3 3v1h4a1 1 0 0 1 1 1v2.5a6 6 0 0 1-4 5.6V20a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-3.9a6 6 0 0 1-4-5.6V8a1 1 0 0 1 1-1h4V6a3 3 0 0 1 3-3Z" />
      </>
    ),
    fintech: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h4" />
      </>
    ),
    strategy: (
      <>
        <path d="M3 3v18h18" />
        <path d="m6 16 4-4 4 4 5-6" />
        <path d="M15 10h4v4" />
      </>
    ),
    leadership: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] || paths.code}
    </svg>
  )
}
