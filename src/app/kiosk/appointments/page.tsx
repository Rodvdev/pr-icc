"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Calendar as CalendarIcon, 
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ClientData {
  id: string
  name: string
  email: string
}

function KioskAppointmentsContent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [client, setClient] = useState<ClientData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState("")
  const [purpose, setPurpose] = useState("")
  const [notes, setNotes] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([])

  // Prefer clientId from URL query (when coming from recognition), fallback to session user id
  const searchParams = useSearchParams()
  const queryClientId = searchParams?.get('clientId') ?? null
  const clientId = queryClientId ?? (session?.user ? (session.user as { id?: string })?.id : null)

  useEffect(() => {
    // Check if user is authenticated
    if (status === "unauthenticated" && !queryClientId) {
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
            throw new Error(`Failed to parse server response (${response.status})`)
          }

          if (!response.ok) {
            const msg = data?.message || `Server returned ${response.status}`
            throw new Error(msg)
          }

          const clientData = {
            id: data.id,
            name: data.name ?? null,
            email: data.email ?? null,
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
  }, [session, status, clientId, router, queryClientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    if (!date) {
      setSubmitError('Por favor selecciona una fecha')
      return
    }

    if (!time) {
      setSubmitError('Por favor selecciona una hora')
      return
    }

    if (!clientId) {
      setSubmitError('No se pudo identificar al cliente')
      return
    }

    // Combinar fecha y hora
    const [hours, minutes] = time.split(':').map(Number)
    const scheduledAt = new Date(date)
    scheduledAt.setHours(hours, minutes, 0, 0)

    // Validar que la fecha no sea en el pasado
    if (scheduledAt < new Date()) {
      setSubmitError('No puedes programar una cita en el pasado')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/kiosk/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          scheduledAt: scheduledAt.toISOString(),
          purpose: purpose || 'Consulta general',
          notes: notes || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al programar la cita')
      }

      setSubmitSuccess(true)
      
      // Limpiar formulario
      setDate(undefined)
      setTime("")
      setPurpose("")
      setNotes("")

      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push(`/kiosk/welcome?clientId=${clientId}`)
      }, 2000)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al programar la cita')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 max-w-4xl">
        <Card className="p-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
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

  // Fetch available slots when date changes
  useEffect(() => {
    if (date) {
      const fetchSlots = async () => {
        try {
          const dateStr = format(date, 'yyyy-MM-dd')
          const response = await fetch(`/api/kiosk/appointments/available-slots?date=${dateStr}`)
          const data = await response.json()
          
          if (response.ok) {
            setAvailableSlots(data.availableSlots || [])
            setOccupiedSlots(data.occupiedSlots || [])
          }
        } catch (err) {
          console.error('Error al obtener horarios disponibles:', err)
        }
      }
      fetchSlots()
    } else {
      setAvailableSlots([])
      setOccupiedSlots([])
    }
  }, [date])

  // Horarios disponibles (9 AM a 6 PM en intervalos de 30 minutos)
  const allTimes: string[] = []
  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      allTimes.push(timeString)
    }
  }

  return (
    <div className="container mx-auto px-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={`/kiosk/welcome?clientId=${clientId}`}>
            <Button variant="ghost" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Programar Cita</h1>
          <div className="w-32" /> {/* Spacer */}
        </div>

        {/* Success message */}
        {submitSuccess && (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">¡Cita programada exitosamente!</h3>
                <p className="text-sm text-green-700">Serás redirigido en breve...</p>
              </div>
            </div>
          </Card>
        )}

        {/* Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Cliente:</span> {client.name}
              </p>
              {client.email && (
                <p className="text-sm text-blue-700">{client.email}</p>
              )}
            </div>

            {/* Date picker */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha de la cita *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time picker */}
            <div className="space-y-2">
              <Label htmlFor="time">Hora de la cita *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecciona una hora</option>
                  {allTimes.map((timeOption) => {
                    const isOccupied = occupiedSlots.includes(timeOption)
                    return (
                      <option
                        key={timeOption}
                        value={timeOption}
                        disabled={isOccupied}
                      >
                        {timeOption} {isOccupied ? '(Ocupado)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
              <p className="text-xs text-gray-500">
                Horario de atención: 9:00 AM - 6:00 PM (Lunes a Viernes), 9:00 AM - 1:00 PM (Sábados)
              </p>
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Motivo de la cita</Label>
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Ej: Consulta sobre cuenta, Apertura de cuenta, etc."
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Información adicional que consideres relevante..."
                rows={4}
              />
            </div>

            {/* Error message */}
            {submitError && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end space-x-4">
              <Link href={`/kiosk/welcome?clientId=${clientId}`}>
                <Button type="button" variant="outline" size="lg">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Programando...' : 'Programar Cita'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function KioskAppointmentsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-6 max-w-4xl">
        <Card className="p-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Card>
      </div>
    }>
      <KioskAppointmentsContent />
    </Suspense>
  )
}

