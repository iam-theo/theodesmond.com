import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader"
import Section from "../components/Section"
import EditorialRow from "../components/EditorialRow"
import Marquee from "../components/Marquee"
import Reveal from "../components/Reveal"
import { useProducts } from "../hooks/useProducts"
import { useSiteContent } from "../hooks/useSiteContent"
import { companies as defaultCompanies, experiments as defaultExperiments, pageHeaders as defaultPageHeaders } from "../data"

const pad = (n) => String(n).padStart(2, "0")

export default function PortfolioPage() {
  const products = useProducts()
  const content = useSiteContent()
  const companies = content?.companies ?? defaultCompanies
  const experiments = content?.experiments ?? defaultExperiments
  const header = content?.pageHeaders?.portfolio ?? defaultPageHeaders.portfolio
  return (
    <>
      <PageHeader
        eyebrow={header.eyebrow}
        title={
          <>
            {header.titleBefore}<span className="italic text-zinc-900 dark:text-zinc-50">{header.titleAccent}</span>
          </>
        }
        description={header.description}
        grid
      >
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/ventures" className="btn btn-primary">
            The Ventures
          </Link>
          <Link to="/work" className="btn btn-secondary">
            Start a Project
          </Link>
        </div>
      </PageHeader>

      <div className="border-y border-zinc-200 dark:border-zinc-800">
        <Marquee
          items={[
            "Ventures",
            "Products",
            "Platforms",
            "Experiments",
            "Intelligent Systems",
          ]}
        />
      </div>

      <Section eyebrow="Companies" title="The ventures I lead.">
        <div className="mt-12">
          {companies.map((c, i) => (
            <Reveal key={c.name}>
              <EditorialRow
                index={pad(i + 1)}
                to={c.link}
                title={c.name}
                excerpt={c.desc}
                meta={c.role}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="Products" title="Platforms I design and build.">
        <div className="mt-12">
          {products.map((p) => (
            <Reveal key={p.name}>
              <EditorialRow
                index={p.index}
                to={`/portfolio/${p.slug}`}
                title={p.name}
                excerpt={p.details || p.tagline}
                meta={p.category}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="Experiments" title="What's on the bench.">
        <div className="mt-12 flex flex-wrap items-center gap-3">
          {experiments.map((e, i) => (
            <span
              key={e}
              className={`stamp border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300 ${
                i % 2 ? "rotate-1" : "-rotate-1"
              }`}
            >
              {e}
            </span>
          ))}
        </div>
        <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-400">
          See the full{" "}
          <Link
            to="/lab"
            className="link-swipe font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Technical Lab →
          </Link>
        </p>
      </Section>
    </>
  )
}