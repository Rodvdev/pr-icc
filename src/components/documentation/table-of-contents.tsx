"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    let observer: IntersectionObserver | null = null
    let headingElements: HTMLElement[] = []

    // Function to scroll to hash on page load
    const scrollToHash = () => {
      const hash = window.location.hash.replace("#", "")
      if (hash) {
        setTimeout(() => {
          const element = document.getElementById(hash)
          if (element) {
            const headerOffset = 120
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
            const offsetPosition = elementPosition - headerOffset

            window.scrollTo({
              top: Math.max(0, offsetPosition),
              behavior: "smooth",
            })
            
            setActiveId(hash)
          }
        }, 300)
      }
    }

    // Wait for page to be fully loaded
    const timeoutId = setTimeout(() => {
      // Extract headings from the page
      headingElements = Array.from(
        document.querySelectorAll("main h2, main h3, main h4")
      ) as HTMLElement[]

      const extractedHeadings: Heading[] = headingElements.map((heading, index) => {
        let id = heading.id

        if (!id || id === "") {
          // Generate ID from text if not present
          const text = heading.textContent || ""
          id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || `heading-${index}`
          
          // Ensure unique ID
          let uniqueId = id
          let counter = 1
          while (document.getElementById(uniqueId)) {
            uniqueId = `${id}-${counter}`
            counter++
          }
          
          heading.id = uniqueId
          id = uniqueId
        }

        return {
          id,
          text: heading.textContent || "",
          level: parseInt(heading.tagName.charAt(1)),
        }
      })

      setHeadings(extractedHeadings)

      // Scroll to hash if present in URL
      scrollToHash()

      // Intersection Observer for active heading
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id)
            }
          })
        },
        {
          rootMargin: "-120px 0% -66%",
          threshold: 0,
        }
      )

      headingElements.forEach((heading) => {
        if (heading.id) {
          observer?.observe(heading)
        }
      })
    }, 100)

    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      if (observer) {
        headingElements.forEach((heading) => {
          observer?.unobserve(heading)
        })
        observer.disconnect()
      }
    }
  }, [])

  if (headings.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        <div className="font-semibold mb-2">ON THIS PAGE</div>
        <p className="text-xs">No hay secciones disponibles</p>
      </div>
    )
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    
    // Update active ID immediately for visual feedback
    setActiveId(id)
    
    // Find the element and scroll to it
    const scrollToElement = (attempts = 0): void => {
      const element = document.getElementById(id)
      
      if (element) {
        // Calculate scroll position with offset for fixed headers
        const headerOffset = 120
        const elementTop = element.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementTop - headerOffset

        // Update URL hash
        window.history.pushState(null, "", `#${id}`)
        
        // Smooth scroll to the calculated position
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth",
        })
        
        return
      }
      
      // Retry if element not found (might still be loading)
      if (attempts < 10) {
        setTimeout(() => scrollToElement(attempts + 1), 50)
      }
    }
    
    scrollToElement()
  }

  return (
    <nav className={cn("space-y-2", className)}>
      <div className="text-sm font-semibold text-foreground mb-4">
        ON THIS PAGE
      </div>
      <ScrollArea className="h-[calc(100vh-180px)]">
        <ul className="space-y-1 pr-4">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleClick(e, heading.id)}
                className={cn(
                  "block text-sm transition-colors hover:text-foreground py-1",
                  heading.level === 3 && "ml-3 pl-2 border-l-2 border-border",
                  heading.level === 4 && "ml-6 pl-2 border-l-2 border-border",
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
      </ScrollArea>
    </nav>
  )
}

