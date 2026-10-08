import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader"
import Story from "../components/Story"
import DigitalMandate from "../components/DigitalMandate"
import Beliefs from "../components/Beliefs"
import WorkStories from "../components/WorkStories"
import BeyondSoftware from "../components/BeyondSoftware"
import CurrentFocus from "../components/CurrentFocus"
import Portrait from "../components/Portrait"
import AboutCta from "../components/AboutCta"
import { useSiteContent } from "../hooks/useSiteContent"
import { roles as defaultRoles, tagline as defaultTagline } from "../data"

export default function AboutPage() {
  const content = useSiteContent()
  const roles = content?.roles ?? defaultRoles
  const tagline = content?.tagline ?? defaultTagline
  return (
    <>
      <PageHeader
        eyebrow="About / The Person"
        title={
          <>
            Building technology <span className="text-indigo-600 dark:text-indigo-400">with a purpose.</span>
          </>
        }
        description={`${roles.join(" · ")}. ${tagline} — with the people who use them in mind.`}
        grid
      >
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/portfolio" className="btn btn-primary">
            Explore My Work <span>→</span>
          </Link>
          <Link to="/work" className="btn btn-secondary">
            Work With Me <span>→</span>
          </Link>
        </div>
      </PageHeader>

      <Story />
      <DigitalMandate />
      <Beliefs />
      <WorkStories />
      <BeyondSoftware />
      <CurrentFocus />
      <Portrait />
      <AboutCta />
    </>
  )
}
