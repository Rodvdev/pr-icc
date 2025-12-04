import { ReactNode } from "react"
import { cn } from "@/lib/utils"

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

  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements

  return (
    <HeadingTag id={headingId} className={className}>
      {children}
    </HeadingTag>
  )
}

