"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Camera as CameraIcon, Plus, Activity } from "lucide-react"
import type { Camera } from "@prisma/client"
import { cn } from "@/lib/utils"

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">Estado de las cámaras ESP32-CAM</p>
        </div>
        <Button variant="bank">
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
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((camera) => (
            <div key={camera.id} className="bank-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  camera.status === "ONLINE" ? "bg-bank-success animate-pulse" : "bg-destructive"
                )} />
                <Button size="sm" variant="ghost">
                  <Activity className="w-4 h-4" />
                </Button>
              </div>
              <div className="aspect-video rounded-xl bg-bank-camera mb-4 flex items-center justify-center">
                <CameraIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">{camera.name}</h3>
              <p className="text-sm text-muted-foreground">{camera.branch?.name}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  camera.status === "ONLINE" 
                    ? "bg-bank-success/10 text-bank-success" 
                    : "bg-destructive/10 text-destructive"
                )}>
                  {camera.status === "ONLINE" ? "En línea" : "Desconectada"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

