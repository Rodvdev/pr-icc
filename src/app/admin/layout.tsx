import { RoleGate } from "@/components/auth/role-gate"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { ChatProvider } from "@/contexts/chat-context"
import { ChatSidebarWrapper } from "@/components/chatbot/chat-sidebar-wrapper"
import { ChatToggleButton } from "@/components/chatbot/chat-toggle-button"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGate allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <ChatProvider userType="admin">
        <div className="flex h-screen overflow-hidden bg-gray-50">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
            {/* Header */}
            <AdminHeader />

            {/* Page content */}
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>

          {/* Chatbot Toggle Button */}
          <ChatToggleButton />

          {/* Chatbot Sidebar */}
          <ChatSidebarWrapper userType="admin" />
        </div>
      </ChatProvider>
    </RoleGate>
  )
}
