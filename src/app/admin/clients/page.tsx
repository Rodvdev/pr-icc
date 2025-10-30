"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"
import type { Client } from "@/services/client.service"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter] = useState<string>("all")

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append("query", searchQuery)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/clients?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setClients(data.data)
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter])
  
  useEffect(() => {
    fetchClients()
  }, [searchQuery, statusFilter, fetchClients])



  const handleAction = async (action: string, client: Client) => {
    try {
      let response
      switch (action) {
        case "block":
          response = await fetch(`/api/clients/${client.id}/block`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: "Bloqueado por administrador" })
          })
          break
        case "unblock":
          response = await fetch(`/api/clients/${client.id}/unblock`, {
            method: "POST"
          })
          break
        case "activate":
          response = await fetch(`/api/clients/${client.id}/activate`, {
            method: "POST"
          })
          break
        case "delete":
          if (!confirm("¿Está seguro de eliminar este cliente?")) return
          response = await fetch(`/api/clients/${client.id}`, {
            method: "DELETE"
          })
          break
      }

      if (response?.ok) {
        fetchClients()
      }
    } catch (error) {
      console.error("Error performing action:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: "default",
      BLOCKED: "destructive",
      DELETED: "outline"
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Consulta de clientes (solo lectura)</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por DNI o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Resultados */}
      <Card>
        <CardContent className="pt-6">

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.name || "Sin nombre"}
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.dni || "-"}</TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell>
                        {new Date(client.createdAt).toLocaleDateString()}
                      </TableCell>
                      
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      
    </div>
  )
}

