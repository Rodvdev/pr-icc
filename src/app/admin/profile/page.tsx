"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Lock,
  Activity,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Clock
} from "lucide-react"

interface ProfileData {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  passwordUpdatedAt: string | null
}

interface ActivityLog {
  id: string
  action: string
  createdAt: string
  details: Record<string, unknown> | null
}

export default function AdminProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form states
  const [editedName, setEditedName] = useState("")
  const [editedEmail, setEditedEmail] = useState("")
  const [editedPhone, setEditedPhone] = useState("")
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const fetchProfileData = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      // In a real implementation, you would fetch from /api/users/[id]
      // For now, we'll use session data
      const mockProfile: ProfileData = {
        id: session.user.id,
        name: session.user.name || null,
        email: session.user.email || "",
        phone: null,
        role: session.user.role || "ADMIN",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        passwordUpdatedAt: null,
      }
      
      setProfileData(mockProfile)
      setEditedName(mockProfile.name || "")
      setEditedEmail(mockProfile.email)
      setEditedPhone(mockProfile.phone || "")
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }, [session])

  const fetchActivityLogs = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      // Mock activity logs
      const mockLogs: ActivityLog[] = [
        {
          id: "1",
          action: "LOGIN_SUCCESS",
          createdAt: new Date().toISOString(),
          details: { ip: "192.168.1.1" }
        },
        {
          id: "2",
          action: "PROFILE_UPDATED",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          details: { fields: ["name"] }
        }
      ]
      setActivityLogs(mockLogs)
    } catch (error) {
      console.error("Error fetching activity logs:", error)
    }
  }, [session])

  useEffect(() => {
    fetchProfileData()
    fetchActivityLogs()
  }, [session, fetchProfileData, fetchActivityLogs])

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveStatus('idle')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // TODO: Implement actual API call
      // await fetch(`/api/users/${session?.user?.id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name: editedName,
      //     email: editedEmail,
      //     phone: editedPhone
      //   })
      // })

      setSaveStatus('success')
      
      // Update session with new data
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: editedName,
          email: editedEmail,
        }
      })

      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error("Error saving profile:", error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError("")
    setPasswordSuccess(false)

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Todos los campos son requeridos")
      return
    }

    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }

    setSaving(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // TODO: Implement actual API call
      // const response = await fetch(`/api/users/${session?.user?.id}/password`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     currentPassword,
      //     newPassword
      //   })
      // })

      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      
      setTimeout(() => setPasswordSuccess(false), 5000)
    } catch (error) {
      console.error("Error changing password:", error)
      setPasswordError("Error al cambiar la contraseña. Verifica tu contraseña actual.")
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'LOGIN_SUCCESS': 'Inicio de sesión exitoso',
      'PROFILE_UPDATED': 'Perfil actualizado',
      'PASSWORD_CHANGED': 'Contraseña cambiada',
      'CLIENT_CREATED': 'Cliente creado',
      'CLIENT_BLOCKED': 'Cliente bloqueado',
      'CLIENT_UNBLOCKED': 'Cliente desbloqueado',
      'FAQ_CREATED': 'FAQ creada',
      'BRANCH_CREATED': 'Sucursal creada',
      'CAMERA_CREATED': 'Cámara registrada',
    }
    return labels[action] || action.replace(/_/g, ' ').toLowerCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se pudo cargar la información del perfil
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      {/* Save Status Alert */}
      {saveStatus === 'success' && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Cambios guardados exitosamente
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al guardar los cambios. Por favor intenta nuevamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 text-2xl">
              <AvatarFallback className="bg-blue-600 text-white">
                {getInitials(profileData.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profileData.name || "Sin nombre"}
                </h2>
                <Badge variant={profileData.isActive ? "default" : "secondary"}>
                  {profileData.isActive ? "Activo" : "Inactivo"}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {profileData.role.toLowerCase()}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profileData.email}
                </div>
                {profileData.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {profileData.phone}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Miembro desde {new Date(profileData.createdAt).toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">Información Personal</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Actualiza tu información de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Juan Pérez"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    placeholder="juan@example.com"
                  />
                  <p className="text-xs text-gray-500">
                    El email es usado para iniciar sesión
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={editedPhone}
                    onChange={(e) => setEditedPhone(e.target.value)}
                    placeholder="+51 999 999 999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Input
                    id="role"
                    value={profileData.role}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    Contacta a un administrador para cambiar tu rol
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={fetchProfileData}
                  disabled={saving}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Descartar Cambios
                </Button>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Cambiar Contraseña
              </CardTitle>
              <CardDescription>
                Actualiza tu contraseña de acceso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              {passwordSuccess && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Contraseña cambiada exitosamente
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Mínimo 8 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={saving}>
                  <Lock className="mr-2 h-4 w-4" />
                  {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Información de Seguridad
              </CardTitle>
              <CardDescription>
                Estado de seguridad de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Última actualización de contraseña</p>
                    <p className="text-xs text-gray-500">
                      {profileData.passwordUpdatedAt 
                        ? formatDate(profileData.passwordUpdatedAt)
                        : 'Nunca actualizada'}
                    </p>
                  </div>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Autenticación de dos factores</p>
                    <p className="text-xs text-gray-500">No configurada</p>
                  </div>
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">
                      Recomendaciones de Seguridad
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Cambia tu contraseña cada 3 meses</li>
                      <li>• Usa una contraseña única para este sistema</li>
                      <li>• No compartas tus credenciales con nadie</li>
                      <li>• Cierra sesión al usar computadoras compartidas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>
                Historial de acciones realizadas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay actividad reciente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Acción</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {getActionLabel(log.action)}
                        </TableCell>
                        <TableCell>
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

