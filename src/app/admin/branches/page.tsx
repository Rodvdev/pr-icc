"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Users, Camera as CameraIcon } from "lucide-react"
import type { Branch } from "@prisma/client"

interface BranchWithRelations extends Branch {
  modules: { id: string; status: string }[]
  cameras: { id: string; status: string }[]
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/branches")
      const data = await response.json()
      
      if (data.success) {
        setBranches(data.data)
      }
    } catch (error) {
      console.error("Error fetching branches:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sucursales</h1>
          <p className="text-gray-600 mt-1">
            Gestiona sucursales, módulos y cámaras
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Sucursal
        </Button>
      </div>

      {/* Branches Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <Card key={branch.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{branch.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {branch.city}, {branch.country}
                    </CardDescription>
                  </div>
                  <Badge variant="default">
                    Activa
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Módulos
                    </span>
                    <span className="font-medium">
                      {branch.modules?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <CameraIcon className="h-4 w-4" />
                      Cámaras
                    </span>
                    <span className="font-medium">
                      {branch.cameras?.length || 0} total
                    </span>
                  </div>

                  {branch.address && (
                    <p className="text-xs text-gray-500 pt-2 border-t">
                      {branch.address}
                    </p>
                  )}

                  <Button variant="outline" className="w-full mt-4">
                    Ver Detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

