"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Clock } from "lucide-react"

interface RegistrationRequest {
  id: string
  status: string
  requestData: Record<string, unknown>
  createdAt: string
  client: {
    id: string
    name: string | null
    email: string
    dni: string | null
    phone: string | null
  }
}

export default function RegistrationsPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [notes, setNotes] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/registrations')
      const data = await response.json()
      
      if (data.success) {
        setRequests(data.data)
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/registrations/${selectedRequest.id}/${actionType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
      })

      if (response.ok) {
        fetchRequests()
        setDialogOpen(false)
        setNotes("")
        setSelectedRequest(null)
        setActionType(null)
      } else {
        const error = await response.json()
        console.error("Error:", error)
      }
    } catch (error) {
      console.error("Error performing action:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      APPROVED: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      REJECTED: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    }

    const config = variants[status as keyof typeof variants] || variants.PENDING
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Registro</h1>
        <p className="text-gray-600 mt-1">
          Revisa y aprueba nuevos registros de clientes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {requests.filter(r => r.status === "PENDING").length}
            </div>
            <p className="text-sm text-gray-600">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === "APPROVED").length}
            </div>
            <p className="text-sm text-gray-600">Aprobadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {requests.filter(r => r.status === "REJECTED").length}
            </div>
            <p className="text-sm text-gray-600">Rechazadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium">No hay solicitudes</p>
                <p className="text-sm mt-2">
                  Las nuevas solicitudes de registro aparecerán aquí
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {request.client.name || "Sin nombre"}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <div>
                        <span className="text-gray-600">Email:</span>{" "}
                        <span className="font-medium">{request.client.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">DNI:</span>{" "}
                        <span className="font-medium">{request.client.dni || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Teléfono:</span>{" "}
                        <span className="font-medium">{request.client.phone || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fecha:</span>{" "}
                        <span className="font-medium">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {request.status === "PENDING" && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request)
                          setActionType("approve")
                          setDialogOpen(true)
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request)
                          setActionType("reject")
                          setDialogOpen(true)
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Aprobar Solicitud" : "Rechazar Solicitud"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "¿Estás seguro de aprobar este registro? El cliente podrá iniciar sesión."
                : "¿Estás seguro de rechazar este registro? Puedes agregar notas opcionales."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                <div><strong>Nombre:</strong> {selectedRequest.client.name}</div>
                <div><strong>Email:</strong> {selectedRequest.client.email}</div>
                <div><strong>DNI:</strong> {selectedRequest.client.dni}</div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agrega notas o comentarios..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {actionLoading ? "Procesando..." : actionType === "approve" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

