"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Download,
  Upload,
  Search,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import { useState } from "react"

interface Document {
  id: string
  name: string
  type: string
  uploadDate: string
  size: string
  status: "approved" | "pending" | "rejected"
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "DNI - Anverso",
    type: "Identificación",
    uploadDate: "2024-10-01",
    size: "2.3 MB",
    status: "approved"
  },
  {
    id: "2",
    name: "DNI - Reverso",
    type: "Identificación",
    uploadDate: "2024-10-01",
    size: "2.1 MB",
    status: "approved"
  },
  {
    id: "3",
    name: "Recibo de Luz - Octubre 2024",
    type: "Comprobante de Domicilio",
    uploadDate: "2024-10-05",
    size: "1.8 MB",
    status: "approved"
  },
  {
    id: "4",
    name: "Boleta de Pago - Septiembre",
    type: "Ingreso",
    uploadDate: "2024-09-30",
    size: "856 KB",
    status: "pending"
  }
]

const statusConfig = {
  approved: {
    label: "Aprobado",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  pending: {
    label: "En Revisión",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200"
  },
  rejected: {
    label: "Rechazado",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200"
  }
}

export default function ClientDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredDocuments = mockDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const approvedCount = mockDocuments.filter(d => d.status === "approved").length
  const pendingCount = mockDocuments.filter(d => d.status === "pending").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Documentos</h1>
        <p className="text-gray-600 mt-1">
          Gestiona y revisa tus documentos subidos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDocuments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Aprobados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              En Revisión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Subir Nuevo Documento</CardTitle>
          <CardDescription>
            Sube tus documentos de forma segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              Haz clic para subir o arrastra y suelta
            </p>
            <p className="text-xs text-gray-500">
              PDF, JPG, PNG hasta 10MB
            </p>
            <Button className="mt-4">
              Seleccionar Archivo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documentos Subidos</CardTitle>
              <CardDescription>
                Revisa el estado de tus documentos
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 opacity-20 mb-2" />
                <p className="text-gray-500">No se encontraron documentos</p>
              </div>
            ) : (
              filteredDocuments.map((doc) => {
                const statusInfo = statusConfig[doc.status]
                const StatusIcon = statusInfo.icon

                return (
                  <div
                    key={doc.id}
                    className={`border rounded-lg p-4 ${statusInfo.bgColor} ${statusInfo.borderColor} hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-gray-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {doc.name}
                          </h3>
                          <Badge variant="outline" className="shrink-0">
                            {doc.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {doc.uploadDate}
                          </span>
                          <span>{doc.size}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={`${statusInfo.color} border-current`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {doc.status === "pending" && (
                      <div className="mt-3 pt-3 border-t border-yellow-200">
                        <p className="text-xs text-yellow-700">
                          Tu documento está siendo revisado. Recibirás una notificación cuando el proceso finalice.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información Importante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <p>
                Los documentos son revisados en un plazo máximo de 24 horas
              </p>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <p>
                Asegúrate de que los documentos sean legibles y estén completos
              </p>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <p>
                Formatos aceptados: PDF, JPG, PNG (máximo 10MB por archivo)
              </p>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <p>
                Si un documento es rechazado, recibirás un correo con las observaciones
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

