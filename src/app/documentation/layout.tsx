import { DocSidebar } from "@/components/documentation/doc-sidebar"
import { TableOfContents } from "@/components/documentation/table-of-contents"
import type { ReactNode } from "react"

export default function DocumentationLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar - Pages Navigation */}
      <DocSidebar />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden lg:ml-64">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-12 lg:px-8">
            {children}
          </div>
        </main>

        {/* Right Sidebar - Table of Contents */}
        <aside className="hidden xl:block w-64 border-l border-border bg-card">
          <div className="sticky top-0 p-6">
            <TableOfContents />
          </div>
        </aside>
      </div>
    </div>
  )
}

