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
      {/* Sidebar */}
      <DocSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-12 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-12">
              <div className="min-w-0">{children}</div>
              <aside className="hidden lg:block">
                <TableOfContents />
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

