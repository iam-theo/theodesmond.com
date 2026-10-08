import PageHeader from "../components/PageHeader"
import Marquee from "../components/Marquee"
import Blog from "../components/Blog"
import { useSiteContent } from "../hooks/useSiteContent"
import { pageHeaders as defaultPageHeaders, blogCopy as defaultBlogCopy } from "../data"

export default function BlogPage() {
  const content = useSiteContent()
  const header = content?.pageHeaders?.blog ?? defaultPageHeaders.blog
  const blogMarquee = content?.blogCopy?.marquee ?? defaultBlogCopy.marquee
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
      />

      <div className="border-y border-zinc-200 dark:border-zinc-800">
        <Marquee items={blogMarquee} />
      </div>

      <Blog eyebrow="Latest Essays" title="Ideas worth writing down." />
    </>
  )
}
