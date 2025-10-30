"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CheckCircle2, 
  MessageSquare, 
  FileText, 
  Calendar,
  User,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

interface ClientData {
  id: string
  name: string
  email: string
  lastVisit?: Date
  pendingDocuments?: number
  upcomingAppointments?: number
}

/**
 * Página de bienvenida después de identificación exitosa
 * - Muestra información personalizada del cliente
 * - Accesos rápidos a servicios
 * - Estado de visitas y documentos pendientes
 */
function KioskWelcomeContent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [client, setClient] = useState<ClientData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get client ID from session
  const clientId = session?.user ? (session.user as { id?: string })?.id : null

  useEffect(() => {
    // Check if user is authenticated
    if (status === "unauthenticated") {
      router.push('/kiosk/login')
      return
    }

    if (status === "authenticated" && clientId) {
      const fetchClientData = async () => {
        try {
          const response = await fetch(`/api/kiosk/client/${clientId}`)
          
          if (!response.ok) {
            throw new Error('No se pudo cargar la información del cliente')
          }

          const data = await response.json()
          setClient(data)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
          setIsLoading(false)
        }
      }

      fetchClientData()
    }
  }, [session, status, clientId, router])

  const handleStartVisit = async (purpose: string) => {
    if (!client?.id) return

    try {
      const response = await fetch('/api/kiosk/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          purpose
        })
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/kiosk/visit/${data.visitId}`)
      }
    } catch (error) {
      console.error('Error al crear visita:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 max-w-4xl">
        <Card className="p-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="container mx-auto px-6 max-w-4xl">
        <Card className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <User className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Error al cargar datos</h2>
          <p className="text-gray-600">{error || 'No se pudo encontrar la información del cliente'}</p>
          <Link href="/kiosk">
            <Button size="lg">Volver al Inicio</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 max-w-5xl">
      <div className="space-y-6">
        {/* Welcome header */}
        <Card className="p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-8 h-8" />
                <h1 className="text-3xl font-bold">¡Bienvenido de vuelta, {client.name.split(' ')[0]}!</h1>
              </div>
              <p className="text-blue-100">
                {client.lastVisit 
                  ? `Última visita: ${new Date(client.lastVisit).toLocaleDateString('es-PE')}`
                  : 'Primera vez que nos visitas'
                }
              </p>
            </div>
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <User className="w-10 h-10" />
            </div>
          </div>
        </Card>

        {/* Quick stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">Activo</p>
                <p className="text-sm text-gray-600">Estado de cuenta</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {client.pendingDocuments || 0}
                </p>
                <p className="text-sm text-gray-600">Documentos pendientes</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {client.upcomingAppointments || 0}
                </p>
                <p className="text-sm text-gray-600">Citas programadas</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Service options */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">¿Qué necesitas hoy?</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleStartVisit('consulta')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Consulta General</h3>
                    <p className="text-sm text-gray-600">Habla con nuestro asistente virtual</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
            </Card>

            <Card 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleStartVisit('retiro')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Retiro de Dinero</h3>
                    <p className="text-sm text-gray-600">Solicita un retiro de tu cuenta</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
            </Card>

            <Card 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleStartVisit('pago')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-lg bg-purple-100 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Pago de Servicios</h3>
                    <p className="text-sm text-gray-600">Realiza pagos de facturas</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
            </Card>

            <Link href={`/kiosk/chat?clientId=${clientId}`} className="block">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-lg bg-orange-100 flex items-center justify-center">
                      <MessageSquare className="w-7 h-7 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Chat en Vivo</h3>
                      <p className="text-sm text-gray-600">Habla con un agente ahora</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Link href="/kiosk">
            <Button variant="outline" size="lg">
              Finalizar Sesión
            </Button>
          </Link>
          
          <p className="text-sm text-gray-500">
            Sesión iniciada: {new Date().toLocaleTimeString('es-PE')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function KioskWelcomePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-6 max-w-4xl">
        <Card className="p-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </Card>
      </div>
    }>
      <KioskWelcomeContent />
    </Suspense>
  )
}

