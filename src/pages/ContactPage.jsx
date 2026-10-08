import PageHeader from "../components/PageHeader"
import Contact from "../components/Contact"
import { useSiteContent } from "../hooks/useSiteContent"
import { pageHeaders as defaultPageHeaders } from "../data"

export default function ContactPage() {
  const content = useSiteContent()
  const header = content?.pageHeaders?.contact ?? defaultPageHeaders.contact
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

      <Contact eyebrow="Start the conversation" title="Let's build something real." />
    </>
  )
}
