import PageHeader from "../components/PageHeader"
import Blog from "../components/Blog"

export default function BlogPage() {
  return (
    <>
      <PageHeader
        eyebrow="Blog & Insights"
        title={
          <>
            Notes on building <span className="text-indigo-600">what lasts.</span>
          </>
        }
        description="Essays on AI engineering, software architecture, FinTech and the discipline of building systems that last."
        grid
      />

      <Blog eyebrow="Latest Essays" title="Ideas worth writing down." />
    </>
  )
}
