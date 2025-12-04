import { ReactNode } from "react"

interface DocHeadingProps {
  children: ReactNode
  level?: 2 | 3 | 4
  id?: string
  className?: string
}

function generateId(text: string): string {
  if (typeof text !== "string") {
    return ""
  }
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function DocHeading({
  children,
  level = 2,
  id,
  className,
}: DocHeadingProps) {
  const headingId =
    id || (typeof children === "string" ? generateId(children) : "")

  const HeadingTag = `h${level}` as "h2" | "h3" | "h4"

  return (
    <HeadingTag id={headingId} className={className}>
      {children}
    </HeadingTag>
  )
}

