const accents = {
  indigo: {
    soft: "fill-indigo-100 dark:fill-indigo-500/20",
    stroke: "stroke-indigo-500 dark:stroke-indigo-400",
    text: "fill-indigo-600 dark:fill-indigo-300",
    dot: "fill-indigo-500 dark:fill-indigo-400",
  },
  emerald: {
    soft: "fill-emerald-100 dark:fill-emerald-500/20",
    stroke: "stroke-emerald-500 dark:stroke-emerald-400",
    text: "fill-emerald-600 dark:fill-emerald-300",
    dot: "fill-emerald-500 dark:fill-emerald-400",
  },
  sky: {
    soft: "fill-sky-100 dark:fill-sky-500/20",
    stroke: "stroke-sky-500 dark:stroke-sky-400",
    text: "fill-sky-600 dark:fill-sky-300",
    dot: "fill-sky-500 dark:fill-sky-400",
  },
  violet: {
    soft: "fill-violet-100 dark:fill-violet-500/20",
    stroke: "stroke-violet-500 dark:stroke-violet-400",
    text: "fill-violet-600 dark:fill-violet-300",
    dot: "fill-violet-500 dark:fill-violet-400",
  },
}

const node = "fill-zinc-100 stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-600"
const label = "fill-zinc-500 dark:fill-zinc-400 text-[9.5px] font-medium"
const wire = "stroke-zinc-300 dark:stroke-zinc-600"

function Hub({ a }) {
  return (
    <>
      <path d="M115 70 L160 80" className={`${wire} animate-dash`} fill="none" strokeWidth="2" />
      <path d="M285 70 L240 80" className={`${wire} animate-dash`} fill="none" strokeWidth="2" />
      <path d="M115 100 L160 90" className={`${wire} animate-dash`} fill="none" strokeWidth="2" />
      <path d="M285 100 L240 90" className={`${wire} animate-dash`} fill="none" strokeWidth="2" />

      <rect x="20" y="40" width="96" height="34" rx="10" className={node} strokeWidth="1.5" />
      <text x="68" y="61" textAnchor="middle" className={label}>
        Marketplace
      </text>

      <rect x="284" y="40" width="96" height="34" rx="10" className={node} strokeWidth="1.5" />
      <text x="332" y="61" textAnchor="middle" className={label}>
        Payments
      </text>

      <rect x="20" y="96" width="96" height="34" rx="10" className={node} strokeWidth="1.5" />
      <text x="68" y="117" textAnchor="middle" className={label}>
        Digital Services
      </text>

      <rect x="284" y="96" width="96" height="34" rx="10" className={node} strokeWidth="1.5" />
      <text x="332" y="117" textAnchor="middle" className={label}>
        Support
      </text>

      <rect x="150" y="52" width="100" height="66" rx="16" className={a.soft} strokeWidth="2" />
      <rect x="150" y="52" width="100" height="66" rx="16" className={a.stroke} fill="none" strokeWidth="2" />
      <circle cx="170" cy="70" r="4" className={`${a.dot} animate-softpulse`} />
      <text x="200" y="76" textAnchor="middle" className={a.text}>
        HUB
      </text>
      <text x="200" y="100" textAnchor="middle" className={label}>
        one platform
      </text>
    </>
  )
}

function Payments({ a }) {
  return (
    <>
      <path d="M96 85 C 130 85, 150 85, 176 85" className={`${wire} animate-dash`} fill="none" strokeWidth="2" />
      <path d="M278 72 C 300 55, 306 52, 318 48" className={`${wire} animate-dash`} fill="none" strokeWidth="2" />
      <path d="M278 98 C 300 115, 306 118, 318 122" className={`${wire} animate-dash`} fill="none" strokeWidth="2" />

      <rect x="14" y="58" width="82" height="54" rx="14" className={node} strokeWidth="1.5" />
      <text x="55" y="80" textAnchor="middle" className={label}>
        Payer
      </text>
      <text x="55" y="96" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[8.5px]">
        initiates
      </text>

      <rect x="176" y="58" width="102" height="54" rx="14" className={a.soft} strokeWidth="2" />
      <rect x="176" y="58" width="102" height="54" rx="14" className={a.stroke} fill="none" strokeWidth="2" />
      <circle cx="194" cy="76" r="4" className={`${a.dot} animate-softpulse`} />
      <text x="227" y="82" textAnchor="middle" className={a.text}>
        Provider Route
      </text>
      <text x="227" y="98" textAnchor="middle" className={label}>
        smart routing
      </text>

      <rect x="318" y="22" width="70" height="44" rx="12" className={node} strokeWidth="1.5" />
      <text x="353" y="48" textAnchor="middle" className={label}>
        Wallet
      </text>

      <rect x="318" y="104" width="70" height="44" rx="12" className={node} strokeWidth="1.5" />
      <text x="353" y="130" textAnchor="middle" className={label}>
        Ledger
      </text>
    </>
  )
}

function Workflow({ a }) {
  const cols = [
    { x: 10, label: "Plan" },
    { x: 114, label: "Build" },
    { x: 218, label: "Approve" },
    { x: 322, label: "Ship", accent: true },
  ]
  return (
    <>
      <path d="M94 80 H 110" className={`${wire} animate-dash`} fill="none" strokeWidth="2" />
      <path d="M198 80 H 214" className={`${wire} animate-dash`} fill="none" strokeWidth="2" />
      <path d="M302 80 H 318" className={`${wire} animate-dash`} fill="none" strokeWidth="2" />

      {cols.map((c) => (
        <g key={c.label}>
          <rect
            x={c.x}
            y="54"
            width={c.accent ? "68" : "80"}
            height="52"
            rx="13"
            className={c.accent ? a.soft : node}
            strokeWidth={c.accent ? 2 : 1.5}
          />
          {c.accent && (
            <rect
              x={c.x}
              y="54"
              width="68"
              height="52"
              rx="13"
              className={a.stroke}
              fill="none"
              strokeWidth="2"
            />
          )}
          {c.accent && (
            <circle cx={c.x + 14} cy="70" r="4" className={`${a.dot} animate-softpulse`} />
          )}
          <text
            x={c.x + (c.accent ? 34 : 40)}
            y="80"
            textAnchor="middle"
            className={c.accent ? a.text : label}
          >
            {c.label}
          </text>
        </g>
      ))}
    </>
  )
}

function Agents({ a }) {
  return (
    <>
      <path d="M94 85 C 120 85, 128 85, 146 85" className={`${wire} animate-dash`} fill="none" strokeWidth="2" />
      <path d="M254 62 C 285 45, 292 42, 308 40" className={`${wire} animate-dash`} fill="none" strokeWidth="2" />
      <path d="M254 108 C 285 125, 292 128, 308 130" className={`${wire} animate-dash`} fill="none" strokeWidth="2" />

      <rect x="14" y="56" width="80" height="58" rx="14" className={node} strokeWidth="1.5" />
      <text x="54" y="80" textAnchor="middle" className={label}>
        LLM
      </text>
      <text x="54" y="96" textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[8.5px]">
        reason + plan
      </text>

      <rect x="146" y="40" width="108" height="90" rx="18" className={a.soft} strokeWidth="2" />
      <rect x="146" y="40" width="108" height="90" rx="18" className={a.stroke} fill="none" strokeWidth="2" />
      <rect x="168" y="58" width="64" height="30" rx="8" className="fill-white/70 dark:fill-zinc-900/70" strokeWidth="1" />
      <text x="200" y="78" textAnchor="middle" className={a.text}>
        Agent
      </text>
      <circle cx="200" cy="112" r="4" className={`${a.dot} animate-softpulse`} />
      <text x="200" y="118" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[9px] font-medium">
        executes
      </text>

      <rect x="308" y="16" width="78" height="46" rx="12" className={node} strokeWidth="1.5" />
      <text x="347" y="37" textAnchor="middle" className={label}>
        Sandbox
      </text>
      <text x="347" y="52" textAnchor="middle" className={a.text}>
        ✓ build
      </text>

      <rect x="308" y="108" width="78" height="46" rx="12" className={node} strokeWidth="1.5" />
      <text x="347" y="129" textAnchor="middle" className={label}>
        Sandbox
      </text>
      <text x="347" y="144" textAnchor="middle" className={a.text}>
        ✓ test
      </text>
    </>
  )
}

const variants = {
  hub: Hub,
  payments: Payments,
  workflow: Workflow,
  agents: Agents,
}

export default function ProductVisual({ variant = "hub", accent = "indigo", className = "h-full w-full" }) {
  const a = accents[accent] || accents.indigo
  const Diagram = variants[variant] || variants.hub
  return (
    <svg
      viewBox="0 0 400 170"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-hidden="true"
    >
      <Diagram a={a} />
    </svg>
  )
}
