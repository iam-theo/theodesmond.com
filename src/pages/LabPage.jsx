import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader"
import Lab from "../components/Lab"

export default function LabPage() {
  return (
    <>
      <PageHeader
        eyebrow="Technical Lab"
        title={
          <>
            Not a static CV — <span className="text-indigo-600">an active lab.</span>
          </>
        }
        description="Things I'm building, testing and shipping right now. Each experiment has a status — some are live, some are experimental, none are finished thinking."
        grid
      >
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/ai" className="btn btn-primary">
            Explore AI work
          </Link>
          <Link to="/contact" className="btn btn-secondary">
            Collaborate
          </Link>
        </div>
      </PageHeader>

      <Lab eyebrow="The Lab" title="Currently on the bench." />
    </>
  )
}
