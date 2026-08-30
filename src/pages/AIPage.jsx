import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader"
import AI from "../components/AI"

export default function AIPage() {
  return (
    <>
      <PageHeader
        eyebrow="AI & The Future"
        title={
          <>
            Building with AI, <span className="text-indigo-600">not just using AI.</span>
          </>
        }
        description="AI is moving from feature to infrastructure. Agents, RAG, orchestration and sandboxed execution — the systems behind autonomous development."
        grid
      >
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/portfolio" className="btn btn-primary">
            See Aurex in the ecosystem
          </Link>
          <Link to="/contact" className="btn btn-secondary">
            Talk AI with me
          </Link>
        </div>
      </PageHeader>

      <AI
        eyebrow="AI Systems"
        title={
          <>
            Agents that don&apos;t just chat. <span className="text-indigo-600">Agents that execute.</span>
          </>
        }
      />
    </>
  )
}
