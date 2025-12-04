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
import { OpenAIConfigAlert } from "@/components/admin/openai-config-alert"
import { isOpenAIConfigured } from "@/lib/openai"

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

  const openAIConfigured = isOpenAIConfigured()

  return (
    <div className="space-y-8 animate-fade-in">
      {/* OpenAI Configuration Alert */}
      <OpenAIConfigAlert isConfigured={openAIConfigured} showDetails={true} />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bank-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-display font-semibold text-foreground mb-6">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <div key={index} className="bank-card hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <action.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-display font-semibold text-lg text-foreground">{action.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
              <Button asChild variant="bank" className="w-full">
                <Link href={action.href}>
                  Acceder
                </Link>
              </Button>
            </div>
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
      <h3 className="text-xl font-display font-semibold text-foreground mb-6">
        Actividad Reciente
      </h3>
      <div className="bank-card p-6">
        {recentLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay actividad reciente
          </p>
        ) : (
          <div className="space-y-3">
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
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                  <display.icon className={`h-4 w-4 ${display.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{display.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {userName} - {formatTimeAgo(log.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {recentLogs.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <Button asChild variant="bank-outline" className="w-full">
              <Link href="/admin/audit">
                Ver todos los registros
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
