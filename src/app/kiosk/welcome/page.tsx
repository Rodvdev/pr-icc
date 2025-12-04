"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CheckCircle2, 
  MessageSquare, 
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
  upcomingAppointments?: number
}

/**
 * Página de bienvenida después de identificación exitosa
 * - Muestra información personalizada del cliente
 * - Accesos rápidos a servicios
 * - Estado de cuenta y citas programadas
 */
function KioskWelcomeContent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [client, setClient] = useState<ClientData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Prefer clientId from URL query (when coming from recognition), fallback to session user id
  const searchParams = useSearchParams()
  const queryClientId = searchParams?.get('clientId') ?? null
  const clientId = queryClientId ?? (session?.user ? (session.user as { id?: string })?.id : null)

  useEffect(() => {
    // Check if user is authenticated
    if (status === "unauthenticated" && !queryClientId) {
      // If there is no session AND no clientId passed in the query, redirect to login
      router.push('/kiosk/login')
      return
    }

    if ((status === "authenticated" && clientId) || queryClientId) {
      const fetchClientData = async () => {
        try {
          const response = await fetch(`/api/kiosk/client/${clientId}`)
          let data: any = null
          try {
            data = await response.json()
          } catch (e) {
            // JSON parse failed
            throw new Error(`Failed to parse server response (${response.status})`)
          }

          if (!response.ok) {
            // Use message from server if provided
            const msg = data?.message || `Server returned ${response.status}`
            throw new Error(msg)
          }

          // Normalize shape: our API returns { ok: true, id, name, ... }
          const clientData = {
            id: data.id,
            name: data.name ?? null,
            email: data.email ?? null,
            lastVisit: data.lastVisit ?? null,
            upcomingAppointments: data.upcomingAppointments ?? 0
          }

          setClient(clientData)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
          setIsLoading(false)
        }
      }

      fetchClientData()
    }
  }, [session, status, clientId, router])


  if (isLoading) {
    return (
      <div className="container mx-auto px-6 max-w-4xl">
        <Card className="p-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <div className="grid md:grid-cols-2 gap-4 mt-8">
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
    <main className="flex-1 p-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Welcome header */}
        <div className="bank-card p-8 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-8 h-8" />
                <h1 className="font-display text-3xl font-bold">¡Bienvenido de vuelta, {client.name.split(' ')[0]}!</h1>
              </div>
              <p className="text-primary-foreground/80">
                {client.lastVisit 
                  ? `Última visita: ${new Date(client.lastVisit).toLocaleDateString('es-PE')}`
                  : 'Primera vez que nos visitas'
                }
              </p>
            </div>
            <div className="w-20 h-20 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
              <User className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bank-card p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-bank-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-bank-success" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">Activo</p>
                <p className="text-sm text-muted-foreground">Estado de cuenta</p>
              </div>
            </div>
          </div>

          <Link href={`/kiosk/appointments/manage?clientId=${clientId}`} className="block">
            <div className="bank-card p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">
                    {client.upcomingAppointments || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Citas programadas</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Service options */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">¿Qué necesitas hoy?</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Link href={`/kiosk/chat?clientId=${clientId}`} className="block">
              <div className="bank-card p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Consulta General / Chat en Vivo</h3>
                      <p className="text-sm text-muted-foreground">Habla con nuestro asistente virtual</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </Link>

            <Link href={`/kiosk/appointments?clientId=${clientId}`} className="block">
              <div className="bank-card p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Programar Cita</h3>
                      <p className="text-sm text-muted-foreground">Agenda una cita para una atención personalizada</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Link href="/kiosk">
            <Button variant="bank-outline" size="lg">
              Finalizar Sesión
            </Button>
          </Link>
          
          <p className="text-sm text-muted-foreground">
            Sesión iniciada: {new Date().toLocaleTimeString('es-PE')}
          </p>
        </div>
      </div>
    </main>
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
            <div className="grid md:grid-cols-2 gap-4 mt-8">
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

