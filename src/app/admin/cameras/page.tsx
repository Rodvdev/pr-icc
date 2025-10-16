"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Camera as CameraIcon, Plus, Activity } from "lucide-react"
import type { Camera } from "@prisma/client"

interface CameraWithBranch extends Camera {
  branch: { name: string }
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<CameraWithBranch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCameras()
  }, [])

  const fetchCameras = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/cameras")
      const data = await response.json()
      
      if (data.success) {
        setCameras(data.data)
      }
    } catch (error) {
      console.error("Error fetching cameras:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      ONLINE: { variant: "default" as const, color: "bg-green-500" },
      OFFLINE: { variant: "secondary" as const, color: "bg-gray-400" },
      ERROR: { variant: "destructive" as const, color: "bg-red-500" },
      MAINTENANCE: { variant: "outline" as const, color: "bg-yellow-500" }
    }

    const config = variants[status as keyof typeof variants] || variants.OFFLINE

    return (
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${config.color}`} />
        <Badge variant={config.variant}>{status}</Badge>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoreo de Cámaras</h1>
          <p className="text-gray-600 mt-1">
            Estado en tiempo real de cámaras de reconocimiento facial
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Cámara
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cameras.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cameras.filter(c => c.status === "ONLINE").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {cameras.filter(c => c.status === "OFFLINE").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {cameras.filter(c => c.status === "ERROR").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cameras Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((camera) => (
            <Card key={camera.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <CameraIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{camera.name}</CardTitle>
                      <p className="text-sm text-gray-500">{camera.branch?.name}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estado</span>
                    {getStatusBadge(camera.status)}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Stream URL</span>
                    <span className="font-mono text-xs truncate max-w-[120px]">
                      {camera.streamUrl || "No configurado"}
                    </span>
                  </div>

                  {camera.lastSeenAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Última actividad</span>
                      <span className="text-xs">
                        {new Date(camera.lastSeenAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Activity className="mr-2 h-3 w-3" />
                      Logs
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Configurar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

