import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader"
import Lab from "../components/Lab"
import { useSiteContent } from "../hooks/useSiteContent"
import { pageHeaders as defaultPageHeaders } from "../data"

export default function LabPage() {
  const content = useSiteContent()
  const header = content?.pageHeaders?.lab ?? defaultPageHeaders.lab
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
          <Link to="/ai" className="btn btn-primary">
            Explore AI work
          </Link>
          <Link to="/work" className="btn btn-secondary">
            Collaborate
          </Link>
        </div>
      </PageHeader>

      <Lab eyebrow="The Lab" title="Currently on the bench." />
    </>
  )
}
