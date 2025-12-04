import { DocSidebar } from "@/components/documentation/doc-sidebar"
import type { ReactNode } from "react"

export default function DocumentationLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <DocSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-12 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

