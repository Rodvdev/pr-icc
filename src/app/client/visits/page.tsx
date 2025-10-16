"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock, MapPin, User, Search, Calendar, CheckCircle, XCircle } from "lucide-react"
import { useState } from "react"

// Mock data for visits
const mockVisits = [
  {
    id: "1",
    date: "2024-10-10",
    time: "14:30",
    branch: "Sucursal San Isidro",
    module: "Módulo 3",
    agent: "María González",
    purpose: "Apertura de cuenta",
    status: "completed",
    duration: "25 min"
  },
  {
    id: "2",
    date: "2024-09-15",
    time: "10:15",
    branch: "Sucursal Miraflores",
    module: "Módulo 1",
    agent: "Carlos Ruiz",
    purpose: "Consulta de préstamo",
    status: "completed",
    duration: "18 min"
  },
  {
    id: "3",
    date: "2024-08-22",
    time: "16:45",
    branch: "Sucursal San Isidro",
    module: "Módulo 2",
    agent: "Ana Torres",
    purpose: "Actualización de datos",
    status: "completed",
    duration: "12 min"
  },
  {
    id: "4",
    date: "2024-07-30",
    time: "11:20",
    branch: "Sucursal San Isidro",
    module: "Módulo 3",
    agent: "María González",
    purpose: "Solicitud de tarjeta",
    status: "cancelled",
    duration: "-"
  },
]

const statusConfig = {
  completed: {
    label: "Completada",
    icon: CheckCircle,
    variant: "secondary" as const,
    color: "text-green-600"
  },
  cancelled: {
    label: "Cancelada",
    icon: XCircle,
    variant: "outline" as const,
    color: "text-red-600"
  },
}

export default function ClientVisitsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredVisits = mockVisits.filter(visit => {
    const matchesSearch = 
      visit.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.agent.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || visit.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Visitas</h1>
        <p className="text-gray-600 mt-1">
          Historial completo de tus visitas a nuestras sucursales
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Visitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tiempo Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18 min</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sucursal Favorita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">San Isidro</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Visitas</CardTitle>
          <CardDescription>
            Filtra y busca en tu historial de visitas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por sucursal, agente o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visits Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No se encontraron visitas</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisits.map((visit) => {
                    const statusInfo = statusConfig[visit.status as keyof typeof statusConfig]
                    const StatusIcon = statusInfo.icon

                    return (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{visit.date}</div>
                              <div className="text-xs text-gray-500">{visit.time}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {visit.branch}
                          </div>
                        </TableCell>
                        <TableCell>{visit.module}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {visit.agent}
                          </div>
                        </TableCell>
                        <TableCell>{visit.purpose}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {visit.duration}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant} className="gap-1">
                            <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Mostrando {filteredVisits.length} de {mockVisits.length} visitas
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled>
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

