import PageHeader from "../components/PageHeader"
import Company from "../components/Company"
import Auracle from "../components/Auracle"

export default function VenturesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ventures"
        title={
          <>
            The ventures <span className="text-indigo-600">behind the work.</span>
          </>
        }
        description="Two entities, one mission: turning ideas into businesses, products and intelligent systems. One is the business venture. The other builds the technology."
        grid
      />

      <Company eyebrow="01 · Business Venture" title="TD Nwogu Global Enterprise" />

      <Auracle eyebrow="02 · The Technology Company" title="Auracle Technologies" />
    </>
  )
}
