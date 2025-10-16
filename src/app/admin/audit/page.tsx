"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Download, Filter } from "lucide-react"

interface AuditLog {
  id: string
  action: string
  actorUserId: string | null
  targetClientId: string | null
  details: Record<string, unknown>
  createdAt: string
  actorUser?: {
    name: string | null
    email: string
  } | null
  targetClient?: {
    name: string | null
    email: string
  } | null
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

  useEffect(() => {
    // TODO: Fetch audit logs from API
    // For now, using mock data
    setLogs([])
    setLoading(false)
  }, [searchQuery, actionFilter])

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CLIENT_CREATED: "bg-green-100 text-green-800",
      CLIENT_BLOCKED: "bg-red-100 text-red-800",
      CLIENT_UPDATED: "bg-blue-100 text-blue-800",
      LOGIN_SUCCESS: "bg-green-100 text-green-800",
      LOGIN_FAILED: "bg-red-100 text-red-800",
      REGISTRATION_APPROVED: "bg-green-100 text-green-800",
    }

    return (
      <Badge className={colors[action] || "bg-gray-100 text-gray-800"}>
        {action.replace(/_/g, " ")}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registro de Auditoría</h1>
          <p className="text-gray-600 mt-1">
            Historial completo de acciones del sistema
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar en logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="CLIENT_CREATED">Cliente Creado</SelectItem>
                <SelectItem value="CLIENT_BLOCKED">Cliente Bloqueado</SelectItem>
                <SelectItem value="LOGIN_SUCCESS">Login Exitoso</SelectItem>
                <SelectItem value="LOGIN_FAILED">Login Fallido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium">Sin registros de auditoría</p>
                <p className="text-sm mt-2">
                  Los registros aparecerán aquí cuando se realicen acciones en el sistema
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getActionBadge(log.action)}
                      <span className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      {log.actorUser && (
                        <p className="text-gray-700">
                          <span className="font-medium">Actor:</span>{" "}
                          {log.actorUser.name || log.actorUser.email}
                        </p>
                      )}
                      
                      {log.targetClient && (
                        <p className="text-gray-700">
                          <span className="font-medium">Cliente:</span>{" "}
                          {log.targetClient.name || log.targetClient.email}
                        </p>
                      )}
                      
                      {Object.keys(log.details).length > 0 && (
                        <details className="text-xs text-gray-500 mt-2">
                          <summary className="cursor-pointer hover:text-gray-700">
                            Ver detalles
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

