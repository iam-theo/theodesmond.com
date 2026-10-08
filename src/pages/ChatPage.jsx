import ChatApp from "../components/ChatApp"

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80 sticky top-0 z-40">
        <div className="layout flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              <span className="font-mono text-sm font-medium">Back</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
              theodesmond.com
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <ChatApp />
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-4">
        <div className="layout flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <p className="font-mono">Chat with Theo Desmond</p>
          <a href="/work" className="text-indigo-600 hover:underline dark:text-indigo-400">
            Work with Theo →
          </a>
        </div>
      </footer>
    </div>
  )
}