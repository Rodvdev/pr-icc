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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  Calendar as CalendarIcon, 
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  Edit,
  X,
  Trash2
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

interface Appointment {
  id: string
  scheduledAt: string
  purpose: string | null
  notes: string | null
  status: string
  branch: {
    name: string
    address: string
  }
}

function KioskAppointmentsManageContent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [client, setClient] = useState<ClientData | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para edición
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [editDate, setEditDate] = useState<Date>()
  const [editTime, setEditTime] = useState("")
  const [editPurpose, setEditPurpose] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const queryClientId = searchParams?.get('clientId') ?? null
  const clientId = queryClientId ?? (session?.user ? (session.user as { id?: string })?.id : null)

  useEffect(() => {
    if (status === "unauthenticated" && !queryClientId) {
      router.push('/kiosk/login')
      return
    }

    if ((status === "authenticated" && clientId) || queryClientId) {
      fetchData()
    }
  }, [session, status, clientId, router, queryClientId])

  const fetchData = async () => {
    try {
      // Fetch client data
      const clientResponse = await fetch(`/api/kiosk/client/${clientId}`)
      const clientData = await clientResponse.json()
      
      if (!clientResponse.ok) {
        throw new Error(clientData.message || 'Error al cargar datos del cliente')
      }

      setClient({
        id: clientData.id,
        name: clientData.name ?? null,
        email: clientData.email ?? null,
      })

      // Fetch appointments
      const appointmentsResponse = await fetch(`/api/kiosk/appointments?clientId=${clientId}`)
      const appointmentsData = await appointmentsResponse.json()
      
      if (!appointmentsResponse.ok) {
        throw new Error(appointmentsData.error || 'Error al cargar citas')
      }

      setAppointments(appointmentsData.appointments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableSlots = async (date: Date, excludeAppointmentId?: string) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const url = `/api/kiosk/appointments/available-slots?date=${dateStr}${excludeAppointmentId ? `&excludeAppointmentId=${excludeAppointmentId}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setAvailableSlots(data.availableSlots || [])
        setOccupiedSlots(data.occupiedSlots || [])
      }
    } catch (err) {
      console.error('Error al obtener horarios disponibles:', err)
    }
  }

  const handleEdit = (appointment: Appointment) => {
    const scheduledDate = new Date(appointment.scheduledAt)
    setEditingAppointment(appointment)
    setEditDate(scheduledDate)
    setEditTime(format(scheduledDate, 'HH:mm'))
    setEditPurpose(appointment.purpose || '')
    setEditNotes(appointment.notes || '')
    setSubmitError(null)
    fetchAvailableSlots(scheduledDate, appointment.id)
  }

  const handleDateChange = (date: Date | undefined) => {
    setEditDate(date)
    if (date) {
      fetchAvailableSlots(date, editingAppointment?.id)
      setEditTime("") // Reset time when date changes
    }
  }

  const handleUpdate = async () => {
    if (!editingAppointment) return

    setSubmitError(null)

    if (!editDate) {
      setSubmitError('Por favor selecciona una fecha')
      return
    }

    if (!editTime) {
      setSubmitError('Por favor selecciona una hora')
      return
    }

    // Combinar fecha y hora
    const [hours, minutes] = editTime.split(':').map(Number)
    const scheduledAt = new Date(editDate)
    scheduledAt.setHours(hours, minutes, 0, 0)

    // Validar que la fecha no sea en el pasado
    if (scheduledAt < new Date()) {
      setSubmitError('No puedes programar una cita en el pasado')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/kiosk/appointments/${editingAppointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: scheduledAt.toISOString(),
          purpose: editPurpose || 'Consulta general',
          notes: editNotes || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar la cita')
      }

      // Refresh appointments list
      await fetchData()
      setEditingAppointment(null)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al actualizar la cita')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      return
    }

    try {
      const response = await fetch(`/api/kiosk/appointments/${appointmentId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar la cita')
      }

      // Refresh appointments list
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar la cita')
    }
  }

  // Horarios disponibles (9 AM a 6 PM en intervalos de 30 minutos)
  const allTimes: string[] = []
  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      allTimes.push(timeString)
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
          <h1 className="text-3xl font-display font-bold text-foreground">Citas Programadas</h1>
          <div className="w-32" /> {/* Spacer */}
        </div>

        {/* Client info */}
        <div className="bank-card p-4 bg-primary/5">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Cliente:</span> {client.name}
          </p>
          {client.email && (
            <p className="text-sm text-muted-foreground">{client.email}</p>
          )}
        </div>

        {/* Appointments list */}
        {appointments.length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No tienes citas programadas</h3>
            <p className="text-muted-foreground mb-4">Puedes programar una nueva cita desde el menú principal</p>
            <Link href={`/kiosk/appointments?clientId=${clientId}`}>
              <Button variant="bank">Programar Nueva Cita</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const scheduledDate = new Date(appointment.scheduledAt)
              return (
                <Card key={appointment.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">
                          {format(scheduledDate, "PPP", { locale: es })}
                        </h3>
                        <span className={cn(
                          "text-xs font-medium px-2 py-1 rounded-full",
                          appointment.status === 'CONFIRMED' 
                            ? "bg-bank-success/10 text-bank-success"
                            : "bg-primary/10 text-primary"
                        )}>
                          {appointment.status === 'CONFIRMED' ? 'Confirmada' : 'Programada'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" />
                        <span>{format(scheduledDate, "HH:mm")}</span>
                      </div>
                      {appointment.purpose && (
                        <p className="text-sm text-foreground mb-1">
                          <span className="font-medium">Motivo:</span> {appointment.purpose}
                        </p>
                      )}
                      {appointment.branch && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Sucursal:</span> {appointment.branch.name}
                        </p>
                      )}
                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(appointment)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Reprogramar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(appointment.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Link to create new appointment */}
        <div className="text-center">
          <Link href={`/kiosk/appointments?clientId=${clientId}`}>
            <Button variant="bank-outline" size="lg">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Programar Nueva Cita
            </Button>
          </Link>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reprogramar Cita</DialogTitle>
            <DialogDescription>
              Selecciona una nueva fecha y hora para tu cita
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Date picker */}
            <div className="space-y-2">
              <Label htmlFor="edit-date">Fecha de la cita *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editDate ? format(editDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editDate}
                    onSelect={handleDateChange}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time picker */}
            {editDate && (
              <div className="space-y-2">
                <Label htmlFor="edit-time">Hora de la cita *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    id="edit-time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                {occupiedSlots.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Los horarios marcados como &quot;(Ocupado)&quot; no están disponibles
                  </p>
                )}
              </div>
            )}

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="edit-purpose">Motivo de la cita</Label>
              <Input
                id="edit-purpose"
                value={editPurpose}
                onChange={(e) => setEditPurpose(e.target.value)}
                placeholder="Ej: Consulta sobre cuenta, Apertura de cuenta, etc."
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas adicionales (opcional)</Label>
              <Textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Información adicional que consideres relevante..."
                rows={4}
              />
            </div>

            {/* Error message */}
            {submitError && (
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <p className="text-sm text-destructive">{submitError}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingAppointment(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="bank"
                onClick={handleUpdate}
                disabled={isSubmitting || !editDate || !editTime}
              >
                {isSubmitting ? 'Actualizando...' : 'Actualizar Cita'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function KioskAppointmentsManagePage() {
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
      <KioskAppointmentsManageContent />
    </Suspense>
  )
}

