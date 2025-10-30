"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, Phone, Calendar, Shield, Save, AlertCircle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  documentType: string
  documentNumber: string
}

export default function ClientProfilePage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    documentType: "DNI",
    documentNumber: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/client/profile")
      const result = await response.json()

      if (response.ok && result.success) {
        const profile = result.data
        setFormData({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: profile.email || "",
          phone: profile.phone || "",
          documentType: profile.documentType || "DNI",
          documentNumber: profile.documentNumber || "",
        })
      } else {
        setError(result.error || "Error al cargar el perfil")
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError("Error de conexión. Por favor intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setError("")
    setSuccess(false)
    setIsSaving(true)

    try {
      const response = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(true)
        setIsEditing(false)
        // Refresh profile data
        await fetchProfile()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || "Error al actualizar el perfil")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Error de conexión. Por favor intenta de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError("")
    // Reload original data
    fetchProfile()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Perfil actualizado exitosamente
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-indigo-600 text-white text-2xl">
                {formData.firstName[0]}{formData.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="text-gray-600 mt-1">{formData.email}</p>
              <div className="flex gap-2 mt-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Cuenta Activa
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Cliente desde 2024
                </Badge>
              </div>
            </div>
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={isEditing ? handleCancel : () => setIsEditing(true)}
              disabled={isSaving}
            >
              {isEditing ? "Cancelar" : "Editar Perfil"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Tu información básica y datos de contacto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                Nombre
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">El email no se puede modificar</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                Teléfono
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Tipo de Documento</Label>
              <Input
                id="documentType"
                value={formData.documentType}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">Número de Documento</Label>
              <Input
                id="documentNumber"
                value={formData.documentNumber}
                disabled
              />
            </div>
          </div>


          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>
            Gestiona la seguridad de tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Contraseña</p>
              <p className="text-sm text-gray-500">
                Última actualización hace 3 meses
              </p>
            </div>
            <Button variant="outline">Cambiar Contraseña</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Autenticación de Dos Factores</p>
              <p className="text-sm text-gray-500">
                Añade una capa extra de seguridad
              </p>
            </div>
            <Button variant="outline">Habilitar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

