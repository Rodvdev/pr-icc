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

export default function AdminDashboard() {
  const stats = [
    { title: "Clientes Activos", value: "1,234", icon: Users, color: "text-blue-600" },
    { title: "Sucursales", value: "12", icon: Building2, color: "text-green-600" },
    { title: "Cámaras Online", value: "48", icon: Camera, color: "text-purple-600" },
    { title: "Conversaciones Hoy", value: "156", icon: MessageSquare, color: "text-orange-600" },
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
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <UserPlus className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Nuevo cliente registrado</p>
                  <p className="text-xs text-gray-500">Juan Pérez - hace 2 minutos</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Shield className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Registro aprobado</p>
                  <p className="text-xs text-gray-500">María González - hace 5 minutos</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Camera className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Detección facial exitosa</p>
                  <p className="text-xs text-gray-500">Carlos Rodríguez - hace 8 minutos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
