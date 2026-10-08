import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader"
import AI from "../components/AI"
import { useSiteContent } from "../hooks/useSiteContent"
import { pageHeaders as defaultPageHeaders } from "../data"

export default function AIPage() {
  const content = useSiteContent()
  const header = content?.pageHeaders?.ai ?? defaultPageHeaders.ai
  return (
    <>
      <PageHeader
        eyebrow={header.eyebrow}
        title={
          <>
            {header.titleBefore}<span className="text-indigo-600">{header.titleAccent}</span>
          </>
        }
        description={header.description}
        grid
      >
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/portfolio" className="btn btn-primary">
            See Aurex in the ecosystem
          </Link>
          <Link to="/work" className="btn btn-secondary">
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
