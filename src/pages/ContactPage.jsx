import PageHeader from "../components/PageHeader"
import Contact from "../components/Contact"

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact / Collaboration"
        title={
          <>
            Have a problem <span className="text-indigo-600">worth building?</span>
          </>
        }
        description="Ambitious products, complex engineering problems, opportunities where technology can create measurable impact."
        grid
      />

      <Contact eyebrow="Start the conversation" title="Let's build something real." />
    </>
  )
}
