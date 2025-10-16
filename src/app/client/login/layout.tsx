import { ReactNode } from "react"

export default function ClientLoginLayout({
  children,
}: {
  children: ReactNode
}) {
  // This layout doesn't check authentication to avoid redirect loops
  return <>{children}</>
}
