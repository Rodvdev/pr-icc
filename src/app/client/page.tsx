"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  CheckCircle,
  MessageSquare,
  Calendar,
  FileText,
  ArrowRight,
  Bell
} from "lucide-react"
import Link from "next/link"

export default function ClientDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido a tu Portal
        </h1>
        <p className="text-gray-600 mt-1">
          Gestiona tu información y accede a nuestros servicios
        </p>
      </div>

      {/* Status Alert */}
      <Card className="border-l-4 border-l-green-500 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-900">Tu cuenta está activa</p>
              <p className="text-sm text-green-700">
                Puedes acceder a todos nuestros servicios
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Visitas Totales
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-gray-500 mt-1">
              En los últimos 6 meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Próxima Cita
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-500 mt-1">
              Sin citas programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Mensajes
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-gray-500 mt-1">
              2 no leídos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle>Chatbot de Ayuda</CardTitle>
                <CardDescription>
                  Obtén respuestas instantáneas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/client/chat">
                Iniciar Chat
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Historial de Visitas</CardTitle>
                <CardDescription>
                  Revisa tus visitas anteriores
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/client/visits">
                Ver Historial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>
            Tus últimas interacciones con el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 pb-4 border-b last:border-0">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Visita completada</p>
                <p className="text-xs text-gray-500">
                  Sucursal San Isidro - Hace 3 días
                </p>
              </div>
              <Badge variant="secondary">Completada</Badge>
            </div>

            <div className="flex items-start gap-4 pb-4 border-b last:border-0">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Consulta por chat</p>
                <p className="text-xs text-gray-500">
                  Información de servicios - Hace 1 semana
                </p>
              </div>
              <Badge variant="secondary">Resuelta</Badge>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Perfil actualizado</p>
                <p className="text-xs text-gray-500">
                  Información de contacto - Hace 2 semanas
                </p>
              </div>
              <Badge variant="secondary">Actualizada</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Mantente informado</CardDescription>
            </div>
            <Bell className="h-5 w-5 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Nueva funcionalidad disponible
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Ahora puedes agendar citas directamente desde el portal
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-2 w-2 rounded-full bg-gray-400 mt-2 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Recordatorio de actualización
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Por favor verifica que tu información de contacto esté actualizada
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

