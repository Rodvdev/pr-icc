import { RoleGate } from "@/components/auth/role-gate"
import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Panel de Administración
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">ADMIN</span>
                <Link 
                  href="/api/auth/signout" 
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Cerrar Sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </RoleGate>
  )
}
