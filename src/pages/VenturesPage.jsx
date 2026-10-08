import PageHeader from "../components/PageHeader"
import Company from "../components/Company"
import Auracle from "../components/Auracle"
import { useSiteContent } from "../hooks/useSiteContent"
import { pageHeaders as defaultPageHeaders } from "../data"

export default function VenturesPage() {
  const content = useSiteContent()
  const header = content?.pageHeaders?.ventures ?? defaultPageHeaders.ventures
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
      />

      <Company eyebrow="01 · Business Venture" title="TD Nwogu Global Enterprise" />

      <Auracle eyebrow="02 · The Technology Company" title="Auracle Technologies" />
    </>
  )
}
