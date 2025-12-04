"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  className?: string
}

export function TableOfContents({ className }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    // Extract headings from the page
    const headingElements = Array.from(
      document.querySelectorAll("h2, h3, h4")
    ) as HTMLElement[]

    const extractedHeadings: Heading[] = headingElements.map((heading) => {
      let id = heading.id

      if (!id) {
        // Generate ID from text if not present
        id = heading.textContent
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || ""
        heading.id = id
      }

      return {
        id,
        text: heading.textContent || "",
        level: parseInt(heading.tagName.charAt(1)),
      }
    })

    setHeadings(extractedHeadings)

    // Intersection Observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: "-100px 0% -66%",
      }
    )

    headingElements.forEach((heading) => observer.observe(heading))

    return () => {
      headingElements.forEach((heading) => observer.unobserve(heading))
    }
  }, [])

  if (headings.length === 0) {
    return null
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  return (
    <nav className={cn("sticky top-24 space-y-2", className)}>
      <div className="text-sm font-semibold text-muted-foreground mb-4">
        ON THIS PAGE
      </div>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className={cn(
                "block text-sm transition-colors hover:text-foreground",
                heading.level === 3 && "ml-4",
                heading.level === 4 && "ml-8",
                activeId === heading.id
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

