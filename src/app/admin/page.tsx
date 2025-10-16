import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Building2, 
  Camera, 
  MessageSquare, 
  BarChart3, 
  Settings,
  UserPlus,
  Shield
} from "lucide-react"
import Link from "next/link"
import { clientService, branchService, cameraService } from "@/services"
import { getRecentAuditLogs } from "@/lib/audit"
import { prisma } from "@/lib/prisma"

export default async function AdminDashboard() {
  // Fetch real statistics from services
  const [clientStats, branchStats, cameraStats, chatSessionsToday] = await Promise.all([
    clientService.getClientStats(),
    branchService.getBranchStats(),
    cameraService.getCameraStats(),
    prisma.chatSession.count({
      where: {
        startedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)) // Start of today
        }
      }
    })
  ])

  const stats = [
    { 
      title: "Clientes Activos", 
      value: clientStats.active.toLocaleString(), 
      icon: Users, 
      color: "text-blue-600" 
    },
    { 
      title: "Sucursales", 
      value: branchStats.totalBranches.toString(), 
      icon: Building2, 
      color: "text-green-600" 
    },
    { 
      title: "Cámaras Online", 
      value: cameraStats.online.toString(), 
      icon: Camera, 
      color: "text-purple-600" 
    },
    { 
      title: "Conversaciones Hoy", 
      value: chatSessionsToday.toLocaleString(), 
      icon: MessageSquare, 
      color: "text-orange-600" 
    },
  ]

  const quickActions = [
    {
      title: "Gestionar Clientes",
      description: "Ver, editar y aprobar registros de clientes",
      href: "/admin/clients",
      icon: Users,
    },
    {
      title: "Configurar Sucursales",
      description: "Administrar sucursales y módulos",
      href: "/admin/branches",
      icon: Building2,
    },
    {
      title: "Monitorear Cámaras",
      description: "Estado de cámaras y detecciones",
      href: "/admin/cameras",
      icon: Camera,
    },
    {
      title: "Base de Conocimiento",
      description: "Gestionar FAQs y dataset del chatbot",
      href: "/admin/faqs",
      icon: MessageSquare,
    },
    {
      title: "Métricas y Reportes",
      description: "Dashboard ejecutivo y KPIs",
      href: "/admin/metrics",
      icon: BarChart3,
    },
    {
      title: "Configuración",
      description: "Configuración del sistema y usuarios",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Administrativo
        </h2>
        <p className="text-gray-600">
          Bienvenido al panel de control del Sistema de Identificación Bancaria
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <action.icon className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </div>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={action.href}>
                    Acceder
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  )
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'hace un momento'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days > 1 ? 's' : ''}`
}

// Helper function to get icon and color for audit action
function getActionDisplay(action: string): { 
  icon: typeof UserPlus, 
  color: string, 
  text: string 
} {
  switch (action) {
    case 'CLIENT_CREATED':
      return { icon: UserPlus, color: 'text-green-600', text: 'Nuevo cliente registrado' }
    case 'REGISTRATION_APPROVED':
      return { icon: Shield, color: 'text-blue-600', text: 'Registro aprobado' }
    case 'CLIENT_BLOCKED':
      return { icon: Shield, color: 'text-red-600', text: 'Cliente bloqueado' }
    case 'CLIENT_UNBLOCKED':
      return { icon: Shield, color: 'text-green-600', text: 'Cliente desbloqueado' }
    case 'DETECTION_LOGGED':
      return { icon: Camera, color: 'text-purple-600', text: 'Detección facial exitosa' }
    case 'CAMERA_CREATED':
      return { icon: Camera, color: 'text-blue-600', text: 'Nueva cámara registrada' }
    case 'BRANCH_CREATED':
      return { icon: Building2, color: 'text-green-600', text: 'Nueva sucursal creada' }
    case 'FAQ_CREATED':
      return { icon: MessageSquare, color: 'text-orange-600', text: 'Nueva FAQ creada' }
    case 'LOGIN_SUCCESS':
      return { icon: Shield, color: 'text-blue-600', text: 'Inicio de sesión exitoso' }
    default:
      return { icon: Shield, color: 'text-gray-600', text: action.replace(/_/g, ' ').toLowerCase() }
  }
}

async function RecentActivity() {
  // Fetch recent audit logs
  const recentLogs = await getRecentAuditLogs(10, 0)

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Actividad Reciente
      </h3>
      <Card>
        <CardHeader>
          <CardTitle>Últimas Acciones</CardTitle>
          <CardDescription>
            Registro de actividades del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay actividad reciente
            </p>
          ) : (
            <div className="space-y-4">
              {recentLogs.slice(0, 5).map((log: {
                id: string
                action: string
                createdAt: Date
                actorUser: { name: string | null } | null
                targetClient: { name: string | null } | null
              }) => {
                const display = getActionDisplay(log.action)
                const userName = log.actorUser?.name || log.targetClient?.name || 'Sistema'
                
                return (
                  <div key={log.id} className="flex items-center space-x-4">
                    <display.icon className={`h-4 w-4 ${display.color}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{display.text}</p>
                      <p className="text-xs text-gray-500">
                        {userName} - {formatTimeAgo(log.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {recentLogs.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/audit">
                  Ver todos los registros
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
