"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Settings,
  Users,
  Shield,
  Bell,
  Database,
  Eye,
  Lock,
  Server,
  Save,
  RefreshCw,
  MoreHorizontal,
  UserPlus,
  Edit2,
  Key,
  AlertCircle
} from "lucide-react"
import { useSession } from "next-auth/react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SystemSettings {
  siteName: string
  supportEmail: string
  maxLoginAttempts: number
  sessionTimeout: number
  passwordMinLength: number
  requireStrongPassword: boolean
  enableTwoFactor: boolean
  allowSelfRegistration: boolean
  requireEmailVerification: boolean
}

interface NotificationSettings {
  emailNotifications: boolean
  newClientRegistration: boolean
  cameraOfflineAlert: boolean
  suspiciousActivity: boolean
  systemErrors: boolean
}

interface FacialRecognitionSettings {
  provider: string
  confidenceThreshold: number
  maxFacesPerClient: number
  autoEnrollNewFaces: boolean
  requireManualApproval: boolean
}

interface User {
  id: string
  email: string
  name: string
  role: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  
  // System Settings State
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'Banking Agent ID System',
    supportEmail: 'support@banking-agent.com',
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireStrongPassword: true,
    enableTwoFactor: false,
    allowSelfRegistration: true,
    requireEmailVerification: false,
  })

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    newClientRegistration: true,
    cameraOfflineAlert: true,
    suspiciousActivity: true,
    systemErrors: true,
  })

  // Facial Recognition Settings State
  const [frSettings, setFrSettings] = useState<FacialRecognitionSettings>({
    provider: 'azure-vision',
    confidenceThreshold: 0.75,
    maxFacesPerClient: 3,
    autoEnrollNewFaces: false,
    requireManualApproval: true,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // In a real implementation, you would have a /api/users endpoint
      // For now, we'll use mock data
      const mockUsers: User[] = []
      setUsers(mockUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSaveSystemSettings = async () => {
    setSaveStatus('saving')
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      // TODO: Implement actual API call to save settings
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const handleSaveNotificationSettings = async () => {
    setSaveStatus('saving')
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const handleSaveFRSettings = async () => {
    setSaveStatus('saving')
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-600 mt-1">
          Gestiona configuraciones globales, usuarios y preferencias del sistema
        </p>
      </div>

      {/* Save Status Alert */}
      {saveStatus === 'success' && (
        <Alert className="border-green-500 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Configuración guardada exitosamente
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert className="border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">
            Error al guardar la configuración. Por favor intente nuevamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="facial-recognition">Reconocimiento Facial</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración General
              </CardTitle>
              <CardDescription>
                Configuraciones básicas del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nombre del Sistema</Label>
                  <Input
                    id="siteName"
                    value={systemSettings.siteName}
                    onChange={(e) => setSystemSettings({ ...systemSettings, siteName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Email de Soporte</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={systemSettings.supportEmail}
                    onChange={(e) => setSystemSettings({ ...systemSettings, supportEmail: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-registro de Clientes</Label>
                    <p className="text-sm text-gray-500">
                      Permitir que nuevos usuarios se registren sin aprobación previa
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.allowSelfRegistration}
                    onCheckedChange={(checked) => 
                      setSystemSettings({ ...systemSettings, allowSelfRegistration: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Verificación de Email</Label>
                    <p className="text-sm text-gray-500">
                      Requerir verificación de email para nuevos registros
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.requireEmailVerification}
                    onCheckedChange={(checked) => 
                      setSystemSettings({ ...systemSettings, requireEmailVerification: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restablecer
                </Button>
                <Button onClick={handleSaveSystemSettings} disabled={saveStatus === 'saving'}>
                  <Save className="mr-2 h-4 w-4" />
                  {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configuración de Seguridad
              </CardTitle>
              <CardDescription>
                Configuraciones de autenticación y seguridad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Intentos Máximos de Login</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="1"
                    max="10"
                    value={systemSettings.maxLoginAttempts}
                    onChange={(e) => setSystemSettings({ 
                      ...systemSettings, 
                      maxLoginAttempts: parseInt(e.target.value) || 5 
                    })}
                  />
                  <p className="text-xs text-gray-500">
                    Bloquear cuenta después de esta cantidad de intentos fallidos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => setSystemSettings({ 
                      ...systemSettings, 
                      sessionTimeout: parseInt(e.target.value) || 30 
                    })}
                  />
                  <p className="text-xs text-gray-500">
                    Duración de la sesión antes de requerir re-autenticación
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Longitud Mínima de Contraseña</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="32"
                    value={systemSettings.passwordMinLength}
                    onChange={(e) => setSystemSettings({ 
                      ...systemSettings, 
                      passwordMinLength: parseInt(e.target.value) || 8 
                    })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Contraseñas Fuertes</Label>
                    <p className="text-sm text-gray-500">
                      Requerir mayúsculas, minúsculas, números y caracteres especiales
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.requireStrongPassword}
                    onCheckedChange={(checked) => 
                      setSystemSettings({ ...systemSettings, requireStrongPassword: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticación de Dos Factores</Label>
                    <p className="text-sm text-gray-500">
                      Habilitar 2FA para cuentas de administrador
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.enableTwoFactor}
                    onCheckedChange={(checked) => 
                      setSystemSettings({ ...systemSettings, enableTwoFactor: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restablecer
                </Button>
                <Button onClick={handleSaveSystemSettings} disabled={saveStatus === 'saving'}>
                  <Save className="mr-2 h-4 w-4" />
                  {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Keys Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys y Tokens
              </CardTitle>
              <CardDescription>
                Gestiona claves de API para integraciones externas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Azure Face API</p>
                    <p className="text-sm text-gray-500">Para reconocimiento facial</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit2 className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Email Service (SMTP)</p>
                    <p className="text-sm text-gray-500">Para notificaciones por email</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit2 className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Database Backup</p>
                    <p className="text-sm text-gray-500">Configuración de respaldos automáticos</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit2 className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestión de Usuarios
                  </CardTitle>
                  <CardDescription>
                    Administra usuarios del sistema (admins y agentes)
                  </CardDescription>
                </div>
                <Button onClick={() => { setSelectedUser(null); setUserDialogOpen(true) }}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última Actividad</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Current user from session */}
                  {session?.user && (
                    <TableRow>
                      <TableCell className="font-medium">
                        {session.user.name || 'Usuario Actual'}
                      </TableCell>
                      <TableCell>{session.user.email}</TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {session.user.role || 'ADMIN'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Activo</Badge>
                      </TableCell>
                      <TableCell>Ahora</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Lock className="mr-2 h-4 w-4" />
                              Cambiar Contraseña
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {users.length === 0 && !session?.user && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No hay usuarios adicionales. Haz clic en &quot;Nuevo Usuario&quot; para agregar uno.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configuración de Notificaciones
              </CardTitle>
              <CardDescription>
                Gestiona alertas y notificaciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-gray-500">
                      Habilitar envío de notificaciones por correo electrónico
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nuevo Registro de Cliente</Label>
                    <p className="text-sm text-gray-500">
                      Notificar cuando un nuevo cliente se registra
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.newClientRegistration}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, newClientRegistration: checked })
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cámara Desconectada</Label>
                    <p className="text-sm text-gray-500">
                      Alertar cuando una cámara se desconecta o presenta errores
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.cameraOfflineAlert}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, cameraOfflineAlert: checked })
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Actividad Sospechosa</Label>
                    <p className="text-sm text-gray-500">
                      Notificar sobre intentos de acceso sospechosos o inusuales
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.suspiciousActivity}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, suspiciousActivity: checked })
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Errores del Sistema</Label>
                    <p className="text-sm text-gray-500">
                      Alertar sobre errores críticos del sistema
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.systemErrors}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, systemErrors: checked })
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restablecer
                </Button>
                <Button onClick={handleSaveNotificationSettings} disabled={saveStatus === 'saving'}>
                  <Save className="mr-2 h-4 w-4" />
                  {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facial Recognition Settings */}
        <TabsContent value="facial-recognition" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Configuración de Reconocimiento Facial
              </CardTitle>
              <CardDescription>
                Parámetros del sistema de identificación biométrica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="provider">Proveedor de Reconocimiento</Label>
                  <Select
                    value={frSettings.provider}
                    onValueChange={(value) => setFrSettings({ ...frSettings, provider: value })}
                  >
                    <SelectTrigger id="provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="azure-vision">Azure Face API</SelectItem>
                      <SelectItem value="aws-rekognition">AWS Rekognition</SelectItem>
                      <SelectItem value="opencv">OpenCV (Local)</SelectItem>
                      <SelectItem value="face-api">Face-API.js</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidenceThreshold">Umbral de Confianza</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="confidenceThreshold"
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={frSettings.confidenceThreshold}
                      onChange={(e) => setFrSettings({ 
                        ...frSettings, 
                        confidenceThreshold: parseFloat(e.target.value) || 0.75 
                      })}
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {(frSettings.confidenceThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Nivel mínimo de confianza para considerar una detección válida
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxFaces">Máximo de Perfiles por Cliente</Label>
                  <Input
                    id="maxFaces"
                    type="number"
                    min="1"
                    max="10"
                    value={frSettings.maxFacesPerClient}
                    onChange={(e) => setFrSettings({ 
                      ...frSettings, 
                      maxFacesPerClient: parseInt(e.target.value) || 3 
                    })}
                  />
                  <p className="text-xs text-gray-500">
                    Número máximo de perfiles faciales por cliente
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-registro de Caras Nuevas</Label>
                    <p className="text-sm text-gray-500">
                      Registrar automáticamente perfiles faciales para clientes existentes
                    </p>
                  </div>
                  <Switch
                    checked={frSettings.autoEnrollNewFaces}
                    onCheckedChange={(checked) => 
                      setFrSettings({ ...frSettings, autoEnrollNewFaces: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requiere Aprobación Manual</Label>
                    <p className="text-sm text-gray-500">
                      Los nuevos perfiles faciales requieren aprobación de un administrador
                    </p>
                  </div>
                  <Switch
                    checked={frSettings.requireManualApproval}
                    onCheckedChange={(checked) => 
                      setFrSettings({ ...frSettings, requireManualApproval: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">
                      Recomendaciones de Seguridad
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Umbral de confianza recomendado: 75-85%</li>
                      <li>• Habilitar aprobación manual para mayor seguridad</li>
                      <li>• Limitar perfiles por cliente a 3-5 para mejor rendimiento</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restablecer
                </Button>
                <Button onClick={handleSaveFRSettings} disabled={saveStatus === 'saving'}>
                  <Save className="mr-2 h-4 w-4" />
                  {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Información del Sistema
              </CardTitle>
              <CardDescription>
                Estado y configuración del servidor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Versión del Sistema</p>
                  <p className="font-medium">v1.0.0</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Entorno</p>
                  <Badge variant="default">Producción</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Base de Datos</p>
                  <p className="font-medium">PostgreSQL 15.x</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Estado del Servidor</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Operativo</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Acciones del Sistema</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start">
                    <Database className="mr-2 h-4 w-4" />
                    Respaldar Base de Datos
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Limpiar Caché
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Server className="mr-2 h-4 w-4" />
                    Verificar Integridad
                  </Button>
                  <Button variant="outline" className="justify-start" disabled>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Modo Mantenimiento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Zona de Peligro
              </CardTitle>
              <CardDescription>
                Acciones irreversibles - proceder con precaución
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <p className="font-medium text-red-900">Resetear Base de Datos</p>
                    <p className="text-sm text-red-700">Elimina todos los datos y restaura a estado inicial</p>
                  </div>
                  <Button variant="destructive" disabled>
                    Resetear
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <p className="font-medium text-red-900">Eliminar Logs Antiguos</p>
                    <p className="text-sm text-red-700">Elimina registros de auditoría mayores a 90 días</p>
                  </div>
                  <Button variant="outline" className="border-red-300 text-red-600">
                    Eliminar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Dialog - Placeholder for future implementation */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            <DialogDescription>
              {selectedUser 
                ? 'Modifica la información del usuario' 
                : 'Crea un nuevo usuario para el sistema'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Nombre Completo</Label>
              <Input id="userName" placeholder="Juan Pérez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email</Label>
              <Input id="userEmail" type="email" placeholder="juan@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userRole">Rol</Label>
              <Select defaultValue="AGENT">
                <SelectTrigger id="userRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="AGENT">Agente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!selectedUser && (
              <div className="space-y-2">
                <Label htmlFor="userPassword">Contraseña Temporal</Label>
                <Input id="userPassword" type="password" placeholder="••••••••" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setUserDialogOpen(false)}>
              {selectedUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

