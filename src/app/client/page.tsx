"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Clock,
  CheckCircle,
  MessageSquare,
  Calendar,
  ArrowRight,
  Bell
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { ChatToggleButton } from "@/components/chatbot/chat-toggle-button"

interface ClientStats {
  totalVisits: number
  upcomingAppointments: number
  unreadMessages: number
  recentActivity: Array<{
    id: string
    type: string
    description: string
    date: string
    status: string
  }>
}

export default function ClientBranchLandingPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<ClientStats>({
    totalVisits: 0,
    upcomingAppointments: 0,
    unreadMessages: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClientStats = async () => {
      try {
        const response = await fetch('/api/client/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching client stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClientStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Bienvenido</CardTitle>
          <CardDescription>
            Atención rápida para clientes en sucursal. ¿En qué podemos ayudarte?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-gray-700">
              Explora las opciones más comunes o habla con nuestro asistente para recibir ayuda inmediata.
            </p>
            {/* Prominent chatbot button at the same visual level as FAQs */}
            <div className="flex items-center gap-3">
              <ChatToggleButton />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Preguntas frecuentes</CardTitle>
          <CardDescription>Información clave para tu visita</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-modulos">
              <AccordionTrigger className="text-left">¿Qué puedo hacer en los módulos?</AccordionTrigger>
              <AccordionContent>
                Realiza apertura de cuenta, actualización de datos y consultas rápidas.{' '}
                <Link href="/client/help" className="underline">Ver detalles</Link>.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-ventanilla">
              <AccordionTrigger className="text-left">¿Qué puedo hacer en ventanilla?</AccordionTrigger>
              <AccordionContent>
                Depósitos, retiros, pagos y operaciones en efectivo.{' '}
                <Link href="/client/help" className="underline">Ver detalles</Link>.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-prestamo">
              <AccordionTrigger className="text-left">¿Qué documentos necesito para un préstamo?</AccordionTrigger>
              <AccordionContent>
                DNI vigente, sustento de ingresos y recibo de servicios.{' '}
                <Link href="/client/documents" className="underline">Lista completa</Link>.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
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
            <div className="text-2xl font-bold">
              {stats.upcomingAppointments > 0 ? stats.upcomingAppointments : '-'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.upcomingAppointments > 0 ? 'Citas programadas' : 'Sin citas programadas'}
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
            <div className="text-2xl font-bold">{stats.unreadMessages}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.unreadMessages > 0 ? 'mensajes no leídos' : 'Todos leídos'}
            </p>
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
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay actividad reciente
            </p>
          ) : (
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {activity.date}
                    </p>
                  </div>
                  <Badge variant="secondary">{activity.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
