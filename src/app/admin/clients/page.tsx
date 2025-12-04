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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">Gestiona los clientes registrados en el sistema</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por DNI o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {/* Resultados */}
      <div className="bank-card overflow-hidden">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Cliente</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">DNI</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Estado</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No se encontraron clientes
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{client.name || "Sin nombre"}</p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{client.dni || "-"}</td>
                      <td className="px-6 py-4 text-muted-foreground">{client.email}</td>
                      <td className="px-6 py-4">{getStatusBadge(client.status)}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}

