"use client"

import { ClientSidebar } from "@/components/client/client-sidebar"
import { ClientHeader } from "@/components/client/client-header"
import { ChatProvider } from "@/contexts/chat-context"
import { ChatSidebarWrapper } from "@/components/chatbot/chat-sidebar-wrapper"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The middleware handles authentication and redirects
  // If we reach this layout, we should render the full client interface
  return (
    <ChatProvider userType="client">
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <ClientSidebar />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
          {/* Header */}
          <ClientHeader />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Chatbot Sidebar */}
        <ChatSidebarWrapper userType="client" />
      </div>
    </ChatProvider>
  )
}
