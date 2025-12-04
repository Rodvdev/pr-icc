"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Edit, 
  Trash2, 
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Appointment {
  id: string
  client: {
    id: string
    name: string
    email: string
    dni: string | null
    phone: string | null
  }
  branch: {
    id: string
    name: string
    address: string
    code: string
  }
  scheduledAt: string
  purpose: string | null
  notes: string | null
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  createdAt: string
  updatedAt: string
}

interface Client {
  id: string
  name: string
  email: string
  dni: string | null
}

interface Branch {
  id: string
  name: string
  code: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<Date | undefined>()
  
  // Modal states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [appointmentDate, setAppointmentDate] = useState<Date>()
  const [appointmentTime, setAppointmentTime] = useState("")
  const [purpose, setPurpose] = useState("")
  const [notes, setNotes] = useState("")
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (branchFilter !== "all") params.append("branchId", branchFilter)
      if (dateFilter) {
        const startDate = new Date(dateFilter)
        startDate.setHours(0, 0, 0, 0)
        params.append("startDate", startDate.toISOString())
        const endDate = new Date(dateFilter)
        endDate.setHours(23, 59, 59, 999)
        params.append("endDate", endDate.toISOString())
      }

      const response = await fetch(`/api/appointments?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setAppointments(data.data)
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter, branchFilter, dateFilter])

  // Fetch clients for search
  const fetchClients = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setClients([])
      return
    }
    try {
      const response = await fetch(`/api/clients?query=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.success) {
        setClients(data.data.slice(0, 10)) // Limit to 10 results
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }, [])

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch("/api/branches")
        const data = await response.json()
        if (data.success) {
          setBranches(data.data)
        }
      } catch (error) {
        console.error("Error fetching branches:", error)
      }
    }
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Fetch available slots when date changes
  useEffect(() => {
    if (appointmentDate && selectedBranch) {
      const fetchSlots = async () => {
        try {
          const dateStr = format(appointmentDate, 'yyyy-MM-dd')
          const excludeId = editingAppointment?.id
          const url = `/api/kiosk/appointments/available-slots?date=${dateStr}&branchId=${selectedBranch}${excludeId ? `&excludeAppointmentId=${excludeId}` : ''}`
          const response = await fetch(url)
          const data = await response.json()
          
          if (response.ok) {
            setOccupiedSlots(data.occupiedSlots || [])
            // availableSlots is used implicitly for filtering in the select dropdown
          }
        } catch (err) {
          console.error('Error al obtener horarios disponibles:', err)
        }
      }
      fetchSlots()
    } else {
      setOccupiedSlots([])
    }
  }, [appointmentDate, selectedBranch, editingAppointment])

  // Debounce client search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(clientSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [clientSearch, fetchClients])

  const openCreateDialog = () => {
    setEditingAppointment(null)
    setSelectedClient(null)
    setClientSearch("")
    setSelectedBranch(branches[0]?.id || "")
    setAppointmentDate(undefined)
    setAppointmentTime("")
    setPurpose("")
    setNotes("")
    setError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setSelectedClient(appointment.client as Client)
    setClientSearch(appointment.client.name)
    setSelectedBranch(appointment.branch.id)
    const scheduledDate = new Date(appointment.scheduledAt)
    setAppointmentDate(scheduledDate)
    setAppointmentTime(format(scheduledDate, 'HH:mm'))
    setPurpose(appointment.purpose || "")
    setNotes(appointment.notes || "")
    setError(null)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setError(null)

    if (!selectedClient) {
      setError('Debes seleccionar un cliente')
      return
    }

    if (!appointmentDate) {
      setError('Debes seleccionar una fecha')
      return
    }

    if (!appointmentTime) {
      setError('Debes seleccionar una hora')
      return
    }

    if (!selectedBranch) {
      setError('Debes seleccionar una sucursal')
      return
    }

    // Combinar fecha y hora
    const [hours, minutes] = appointmentTime.split(':').map(Number)
    const scheduledAt = new Date(appointmentDate)
    scheduledAt.setHours(hours, minutes, 0, 0)

    // Validar que la fecha no sea en el pasado
    if (scheduledAt < new Date()) {
      setError('No puedes programar una cita en el pasado')
      return
    }

    setSubmitting(true)

    try {
      const url = editingAppointment 
        ? `/api/appointments/${editingAppointment.id}`
        : '/api/appointments'
      const method = editingAppointment ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          scheduledAt: scheduledAt.toISOString(),
          purpose: purpose || 'Consulta general',
          notes: notes || null,
          branchId: selectedBranch
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar la cita')
      }

      // Refresh appointments
      await fetchAppointments()
      setDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la cita')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      return
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar la cita')
      }

      await fetchAppointments()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar la cita')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      SCHEDULED: { label: 'Programada', className: 'bg-primary/10 text-primary' },
      CONFIRMED: { label: 'Confirmada', className: 'bg-bank-success/10 text-bank-success' },
      COMPLETED: { label: 'Completada', className: 'bg-muted text-muted-foreground' },
      CANCELLED: { label: 'Cancelada', className: 'bg-destructive/10 text-destructive' },
      NO_SHOW: { label: 'No asistió', className: 'bg-bank-warning/10 text-bank-warning' }
    }

    const config = variants[status] || variants.SCHEDULED

    return (
      <span className={cn("text-xs font-medium px-2 py-1 rounded-full", config.className)}>
        {config.label}
      </span>
    )
  }

  // Horarios disponibles (9 AM a 6 PM en intervalos de 30 minutos)
  const allTimes: string[] = []
  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      allTimes.push(timeString)
    }
  }

  const filteredAppointments = useMemo(() => {
    return appointments
  }, [appointments])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Citas Programadas</h1>
          <p className="text-muted-foreground">Gestiona todas las citas del sistema</p>
        </div>
        <Button variant="bank" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Filters */}
      <div className="bank-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, DNI, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="SCHEDULED">Programada</SelectItem>
              <SelectItem value="CONFIRMED">Confirmada</SelectItem>
              <SelectItem value="COMPLETED">Completada</SelectItem>
              <SelectItem value="CANCELLED">Cancelada</SelectItem>
              <SelectItem value="NO_SHOW">No asistió</SelectItem>
            </SelectContent>
          </Select>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Sucursal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sucursales</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "PPP", { locale: es }) : "Filtrar por fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
              />
              {dateFilter && (
                <div className="p-3 border-t">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setDateFilter(undefined)}>
                    Limpiar filtro
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table */}
      <div className="bank-card overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron citas
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Cliente</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Fecha y Hora</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Sucursal</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Motivo</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Estado</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAppointments.map((appointment) => {
                const scheduledDate = new Date(appointment.scheduledAt)
                return (
                  <tr key={appointment.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{appointment.client.name}</p>
                        <p className="text-sm text-muted-foreground">{appointment.client.email}</p>
                        {appointment.client.dni && (
                          <p className="text-xs text-muted-foreground">DNI: {appointment.client.dni}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-foreground">{format(scheduledDate, "PPP", { locale: es })}</p>
                        <p className="text-sm text-muted-foreground">{format(scheduledDate, "HH:mm")}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{appointment.branch.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{appointment.purpose || "-"}</td>
                    <td className="px-6 py-4">{getStatusBadge(appointment.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(appointment)}
                          disabled={appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED'}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancel(appointment.id)}
                          disabled={appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED'}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? 'Reprogramar Cita' : 'Nueva Cita'}</DialogTitle>
            <DialogDescription>
              {editingAppointment ? 'Modifica los detalles de la cita' : 'Crea una nueva cita para un cliente'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Client Search */}
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <div className="relative">
                <Input
                  placeholder="Buscar por nombre, DNI o email..."
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value)
                    if (!e.target.value) setSelectedClient(null)
                  }}
                />
                {clientSearch && clients.length > 0 && !selectedClient && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {clients.map(client => (
                      <button
                        key={client.id}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
                        onClick={() => {
                          setSelectedClient(client)
                          setClientSearch(client.name)
                          setClients([])
                        }}
                      >
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                        {client.dni && (
                          <p className="text-xs text-muted-foreground">DNI: {client.dni}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedClient && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium text-foreground">{selectedClient.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                </div>
              )}
            </div>

            {/* Branch Selection */}
            <div className="space-y-2">
              <Label>Sucursal *</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date picker */}
            <div className="space-y-2">
              <Label>Fecha de la cita *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !appointmentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {appointmentDate ? format(appointmentDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={appointmentDate}
                    onSelect={setAppointmentDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time picker */}
            {appointmentDate && selectedBranch && (
              <div className="space-y-2">
                <Label>Hora de la cita *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
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
              <Label>Motivo de la cita</Label>
              <Input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Ej: Consulta sobre cuenta, Apertura de cuenta, etc."
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notas adicionales (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Información adicional..."
                rows={4}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="bank"
                onClick={handleSubmit}
                disabled={submitting || !selectedClient || !appointmentDate || !appointmentTime || !selectedBranch}
              >
                {submitting ? 'Guardando...' : editingAppointment ? 'Actualizar' : 'Crear Cita'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

