import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Building2,
  Camera,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  UserCheck,
  UserX,
  ShieldCheck
} from "lucide-react"
import { clientService, branchService, cameraService, faqService } from "@/services"
import { prisma } from "@/lib/prisma"

export default async function MetricsPage() {
  // Fetch all statistics in parallel
  const [
    baseClientStats,
    branchStats,
    cameraStats,
    faqStats,
    visitStats,
    detectionStats,
    registrationStats,
    chatStats,
    auditLogCount,
    recentActivity,
    clientGrowthStats,
    facialProfileStats,
  ] = await Promise.all([
    clientService.getClientStats(),
    branchService.getBranchStats(),
    cameraService.getCameraStats(),
    faqService.getFAQStats(),
    getVisitStats(),
    getDetectionStats(),
    getRegistrationStats(),
    getChatStats(),
    prisma.auditLog.count(),
    getRecentActivityStats(),
    getClientGrowthStats(),
    getFacialProfileStats(),
  ])

  // Combine client stats
  const clientStats = {
    ...baseClientStats,
    ...clientGrowthStats,
    ...facialProfileStats,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Métricas y Análisis</h1>
        <p className="text-gray-600 mt-1">
          Dashboard ejecutivo con KPIs y estadísticas del sistema
        </p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Clientes Activos"
          value={clientStats.active.toLocaleString()}
          change={calculateGrowth(clientStats.active, clientStats.total)}
          icon={Users}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Sucursales Operativas"
          value={branchStats.totalBranches.toString()}
          subtitle={`${branchStats.totalModules} módulos activos`}
          icon={Building2}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <MetricCard
          title="Cámaras Online"
          value={cameraStats.online.toString()}
          subtitle={`${cameraStats.total} total`}
          icon={Camera}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
        />
        <MetricCard
          title="Detecciones Hoy"
          value={detectionStats.today.toLocaleString()}
          change={calculateDailyGrowth(detectionStats.today, detectionStats.yesterday)}
          icon={Eye}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="operations">Operaciones</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Clientes</CardTitle>
                <CardDescription>Por estado de cuenta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusRow
                  label="Activos"
                  count={clientStats.active}
                  total={clientStats.total}
                  color="green"
                  icon={CheckCircle2}
                />
                <StatusRow
                  label="Bloqueados"
                  count={clientStats.blocked}
                  total={clientStats.total}
                  color="red"
                  icon={XCircle}
                />
                <StatusRow
                  label="Eliminados"
                  count={clientStats.deleted}
                  total={clientStats.total}
                  color="gray"
                  icon={AlertCircle}
                />
              </CardContent>
            </Card>

            {/* Registration Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de Registro</CardTitle>
                <CardDescription>Estado de aprobaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusRow
                  label="Pendientes"
                  count={registrationStats.pending}
                  total={registrationStats.total}
                  color="yellow"
                  icon={Clock}
                />
                <StatusRow
                  label="Aprobadas"
                  count={registrationStats.approved}
                  total={registrationStats.total}
                  color="green"
                  icon={CheckCircle2}
                />
                <StatusRow
                  label="Rechazadas"
                  count={registrationStats.rejected}
                  total={registrationStats.total}
                  color="red"
                  icon={XCircle}
                />
                <StatusRow
                  label="Canceladas"
                  count={registrationStats.cancelled}
                  total={registrationStats.total}
                  color="gray"
                  icon={AlertCircle}
                />
              </CardContent>
            </Card>

            {/* Client Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Crecimiento de Clientes</CardTitle>
                <CardDescription>Últimos periodos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Hoy</span>
                    <span className="font-semibold">{clientStats.today}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Esta Semana</span>
                    <span className="font-semibold">{clientStats.thisWeek}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Este Mes</span>
                    <span className="font-semibold">{clientStats.thisMonth}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Total</span>
                    <span className="font-bold text-lg">{clientStats.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client with Facial Profiles */}
            <Card>
              <CardHeader>
                <CardTitle>Perfiles Faciales</CardTitle>
                <CardDescription>Registro biométrico</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{clientStats.withFacialProfile}</p>
                    <p className="text-sm text-gray-600">Clientes con perfil facial</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Cobertura</span>
                    <span className="font-semibold">
                      {clientStats.total > 0 
                        ? ((clientStats.withFacialProfile / clientStats.total) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 rounded-full"
                      style={{ 
                        width: `${clientStats.total > 0 
                          ? (clientStats.withFacialProfile / clientStats.total) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visit Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Visitas y Atenciones</CardTitle>
                <CardDescription>Estado de atención al cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusRow
                  label="En Espera"
                  count={visitStats.waiting}
                  total={visitStats.total}
                  color="yellow"
                  icon={Clock}
                />
                <StatusRow
                  label="En Servicio"
                  count={visitStats.inService}
                  total={visitStats.total}
                  color="blue"
                  icon={Activity}
                />
                <StatusRow
                  label="Completadas"
                  count={visitStats.completed}
                  total={visitStats.total}
                  color="green"
                  icon={CheckCircle2}
                />
                <StatusRow
                  label="Abandonadas"
                  count={visitStats.abandoned}
                  total={visitStats.total}
                  color="red"
                  icon={XCircle}
                />
              </CardContent>
            </Card>

            {/* Detection Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Detecciones Faciales</CardTitle>
                <CardDescription>Resultados de reconocimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusRow
                  label="Identificados"
                  count={detectionStats.matched}
                  total={detectionStats.total}
                  color="green"
                  icon={UserCheck}
                />
                <StatusRow
                  label="Caras Nuevas"
                  count={detectionStats.newFace}
                  total={detectionStats.total}
                  color="blue"
                  icon={UserX}
                />
                <StatusRow
                  label="Múltiples Matches"
                  count={detectionStats.multipleMatches}
                  total={detectionStats.total}
                  color="yellow"
                  icon={AlertCircle}
                />
                <StatusRow
                  label="Desconocidos"
                  count={detectionStats.unknown}
                  total={detectionStats.total}
                  color="gray"
                  icon={XCircle}
                />
              </CardContent>
            </Card>

            {/* Daily Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad Diaria</CardTitle>
                <CardDescription>Comparativa con día anterior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Visitas Hoy</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{visitStats.today}</span>
                      <TrendComparison 
                        current={visitStats.today} 
                        previous={visitStats.yesterday} 
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Detecciones Hoy</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{detectionStats.today}</span>
                      <TrendComparison 
                        current={detectionStats.today} 
                        previous={detectionStats.yesterday} 
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Chats Hoy</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{chatStats.today}</span>
                      <TrendComparison 
                        current={chatStats.today} 
                        previous={chatStats.yesterday} 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Visit Time */}
            <Card>
              <CardHeader>
                <CardTitle>Tiempo de Atención</CardTitle>
                <CardDescription>Promedios y métricas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {visitStats.avgWaitTime ? `${visitStats.avgWaitTime} min` : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">Tiempo promedio de espera</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tiempo en servicio</span>
                      <span className="font-medium">
                        {visitStats.avgServiceTime ? `${visitStats.avgServiceTime} min` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tiempo total</span>
                      <span className="font-medium">
                        {visitStats.avgTotalTime ? `${visitStats.avgTotalTime} min` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Camera Status */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Cámaras</CardTitle>
                <CardDescription>Monitoreo de dispositivos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusRow
                  label="Online"
                  count={cameraStats.online}
                  total={cameraStats.total}
                  color="green"
                  icon={CheckCircle2}
                />
                <StatusRow
                  label="Offline"
                  count={cameraStats.offline}
                  total={cameraStats.total}
                  color="red"
                  icon={XCircle}
                />
                <StatusRow
                  label="Con Errores"
                  count={cameraStats.error}
                  total={cameraStats.total}
                  color="yellow"
                  icon={AlertCircle}
                />
              </CardContent>
            </Card>

            {/* Branch Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Sucursal</CardTitle>
                <CardDescription>Recursos del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Sucursales</span>
                    <span className="font-semibold">{branchStats.totalBranches}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Módulos Activos</span>
                    <span className="font-semibold">{branchStats.totalModules}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cámaras Instaladas</span>
                    <span className="font-semibold">{cameraStats.total}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Promedio cámaras/sucursal</span>
                    <span className="font-semibold">
                      {branchStats.totalBranches > 0 
                        ? (cameraStats.total / branchStats.totalBranches).toFixed(1)
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>Salud del Sistema</CardTitle>
                <CardDescription>Indicadores de rendimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <HealthIndicator
                  label="Disponibilidad de Cámaras"
                  percentage={cameraStats.total > 0 ? (cameraStats.online / cameraStats.total) * 100 : 0}
                  status={getHealthStatus(cameraStats.total > 0 ? (cameraStats.online / cameraStats.total) * 100 : 0)}
                />
                <HealthIndicator
                  label="Tasa de Detección"
                  percentage={detectionStats.total > 0 ? (detectionStats.matched / detectionStats.total) * 100 : 0}
                  status={getHealthStatus(detectionStats.total > 0 ? (detectionStats.matched / detectionStats.total) * 100 : 0)}
                />
                <HealthIndicator
                  label="Clientes con Perfil"
                  percentage={clientStats.total > 0 ? (clientStats.withFacialProfile / clientStats.total) * 100 : 0}
                  status={getHealthStatus(clientStats.total > 0 ? (clientStats.withFacialProfile / clientStats.total) * 100 : 0)}
                />
              </CardContent>
            </Card>

            {/* Audit Log Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Registro de Auditoría</CardTitle>
                <CardDescription>Actividad del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{auditLogCount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total de eventos registrados</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Eventos hoy</span>
                      <span className="font-medium">{recentActivity.today}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Esta semana</span>
                      <span className="font-medium">{recentActivity.thisWeek}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Interacciones de Chat</CardTitle>
                <CardDescription>Uso del chatbot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sesiones Hoy</span>
                    <span className="font-semibold">{chatStats.today}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Sesiones</span>
                    <span className="font-semibold">{chatStats.totalSessions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Mensajes</span>
                    <span className="font-semibold">{chatStats.totalMessages.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Promedio mensajes/sesión</span>
                    <span className="font-semibold">
                      {chatStats.totalSessions > 0 
                        ? (chatStats.totalMessages / chatStats.totalSessions).toFixed(1)
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Base de Conocimiento</CardTitle>
                <CardDescription>FAQs y contenido</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusRow
                  label="Publicadas"
                  count={faqStats.publishedFAQs}
                  total={faqStats.totalFAQs}
                  color="green"
                  icon={CheckCircle2}
                />
                <StatusRow
                  label="Borradores"
                  count={faqStats.draftFAQs}
                  total={faqStats.totalFAQs}
                  color="yellow"
                  icon={AlertCircle}
                />
                <StatusRow
                  label="Archivadas"
                  count={faqStats.archivedFAQs}
                  total={faqStats.totalFAQs}
                  color="gray"
                  icon={XCircle}
                />
              </CardContent>
            </Card>

            {/* QA Pairs */}
            <Card>
              <CardHeader>
                <CardTitle>Dataset de Entrenamiento</CardTitle>
                <CardDescription>Pares pregunta-respuesta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{faqStats.totalQAPairs.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total de pares Q&A</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Pares activos</span>
                    <span className="font-semibold">{faqStats.activeQAPairs.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Tasa de Engagement</CardTitle>
                <CardDescription>Participación de clientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <HealthIndicator
                  label="Clientes con Interacciones"
                  percentage={clientStats.active > 0 
                    ? ((chatStats.totalSessions + visitStats.total) / clientStats.active) * 100 
                    : 0}
                  status="healthy"
                />
                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Interacciones</span>
                    <span className="font-medium">
                      {(chatStats.totalSessions + visitStats.total).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Chats</span>
                    <span className="font-medium">{chatStats.totalSessions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Visitas</span>
                    <span className="font-medium">{visitStats.total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper Components
interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  change?: number
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  bgColor: string
}

function MetricCard({ title, value, subtitle, change, icon: Icon, iconColor, bgColor }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StatusRowProps {
  label: string
  count: number
  total: number
  color: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple'
  icon: React.ComponentType<{ className?: string }>
}

function StatusRow({ label, count, total, color, icon: Icon }: StatusRowProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  
  const colorClasses = {
    green: { text: 'text-green-600', bg: 'bg-green-600' },
    red: { text: 'text-red-600', bg: 'bg-red-600' },
    yellow: { text: 'text-yellow-600', bg: 'bg-yellow-600' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-600' },
    gray: { text: 'text-gray-600', bg: 'bg-gray-600' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-600' },
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${colorClasses[color].text}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{count.toLocaleString()}</span>
          <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
        </div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color].bg} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface HealthIndicatorProps {
  label: string
  percentage: number
  status: 'healthy' | 'warning' | 'critical'
}

function HealthIndicator({ label, percentage, status }: HealthIndicatorProps) {
  const statusConfig = {
    healthy: { color: 'text-green-600', bg: 'bg-green-600', badge: 'Saludable' },
    warning: { color: 'text-yellow-600', bg: 'bg-yellow-600', badge: 'Atención' },
    critical: { color: 'text-red-600', bg: 'bg-red-600', badge: 'Crítico' },
  }

  const config = statusConfig[status]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{percentage.toFixed(1)}%</span>
          <Badge variant={status === 'healthy' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'} className="text-xs">
            {config.badge}
          </Badge>
        </div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${config.bg} rounded-full transition-all`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

function TrendComparison({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  
  const change = ((current - previous) / previous) * 100
  const isPositive = change >= 0

  return (
    <span className={`text-xs flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(change).toFixed(0)}%
    </span>
  )
}

// Helper Functions
function calculateGrowth(current: number, total: number): number {
  if (total === 0) return 0
  return (current / total) * 100
}

function calculateDailyGrowth(today: number, yesterday: number): number {
  if (yesterday === 0) return today > 0 ? 100 : 0
  return ((today - yesterday) / yesterday) * 100
}

function getHealthStatus(percentage: number): 'healthy' | 'warning' | 'critical' {
  if (percentage >= 80) return 'healthy'
  if (percentage >= 50) return 'warning'
  return 'critical'
}

// Stats Helper Functions
async function getClientGrowthStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  
  const monthAgo = new Date(today)
  monthAgo.setMonth(monthAgo.getMonth() - 1)

  const [todayCount, weekCount, monthCount] = await Promise.all([
    prisma.client.count({ where: { createdAt: { gte: today } } }),
    prisma.client.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.client.count({ where: { createdAt: { gte: monthAgo } } })
  ])

  return {
    today: todayCount,
    thisWeek: weekCount,
    thisMonth: monthCount
  }
}

async function getFacialProfileStats() {
  const [clientsWithProfiles] = await Promise.all([
    prisma.client.count({
      where: {
        facialProfiles: {
          some: {
            isActive: true
          }
        }
      }
    })
  ])

  return {
    withFacialProfile: clientsWithProfiles
  }
}

async function getVisitStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const [total, waiting, inService, completed, abandoned, todayVisits, yesterdayVisits, completedVisitsWithTime] = 
    await Promise.all([
      prisma.visit.count(),
      prisma.visit.count({ where: { status: 'WAITING' } }),
      prisma.visit.count({ where: { status: 'IN_SERVICE' } }),
      prisma.visit.count({ where: { status: 'COMPLETED' } }),
      prisma.visit.count({ where: { status: 'ABANDONED' } }),
      prisma.visit.count({ where: { startedAt: { gte: today } } }),
      prisma.visit.count({ 
        where: { 
          startedAt: { 
            gte: yesterday, 
            lt: today 
          } 
        } 
      }),
      prisma.visit.findMany({
        where: {
          status: 'COMPLETED',
          assignedAt: { not: null },
          finishedAt: { not: null }
        },
        select: {
          startedAt: true,
          assignedAt: true,
          finishedAt: true
        }
      })
    ])

  // Calculate average times
  let avgWaitTime = 0
  let avgServiceTime = 0
  let avgTotalTime = 0

  if (completedVisitsWithTime.length > 0) {
    interface VisitTime {
      wait: number
      service: number
      total: number
    }
    
    const times = completedVisitsWithTime.map((v: { startedAt: Date; assignedAt: Date | null; finishedAt: Date | null }): VisitTime => ({
      wait: v.assignedAt ? (v.assignedAt.getTime() - v.startedAt.getTime()) / (1000 * 60) : 0,
      service: v.finishedAt && v.assignedAt ? (v.finishedAt.getTime() - v.assignedAt.getTime()) / (1000 * 60) : 0,
      total: v.finishedAt ? (v.finishedAt.getTime() - v.startedAt.getTime()) / (1000 * 60) : 0,
    }))

    avgWaitTime = Math.round(times.reduce((sum: number, t: VisitTime) => sum + t.wait, 0) / times.length)
    avgServiceTime = Math.round(times.reduce((sum: number, t: VisitTime) => sum + t.service, 0) / times.length)
    avgTotalTime = Math.round(times.reduce((sum: number, t: VisitTime) => sum + t.total, 0) / times.length)
  }

  return {
    total,
    waiting,
    inService,
    completed,
    abandoned,
    today: todayVisits,
    yesterday: yesterdayVisits,
    avgWaitTime,
    avgServiceTime,
    avgTotalTime
  }
}

async function getDetectionStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const [total, matched, newFace, multipleMatches, unknown, todayDetections, yesterdayDetections] = 
    await Promise.all([
      prisma.detectionEvent.count(),
      prisma.detectionEvent.count({ where: { status: 'MATCHED' } }),
      prisma.detectionEvent.count({ where: { status: 'NEW_FACE' } }),
      prisma.detectionEvent.count({ where: { status: 'MULTIPLE_MATCHES' } }),
      prisma.detectionEvent.count({ where: { status: 'UNKNOWN' } }),
      prisma.detectionEvent.count({ where: { occurredAt: { gte: today } } }),
      prisma.detectionEvent.count({ 
        where: { 
          occurredAt: { 
            gte: yesterday, 
            lt: today 
          } 
        } 
      })
    ])

  return {
    total,
    matched,
    newFace,
    multipleMatches,
    unknown,
    today: todayDetections,
    yesterday: yesterdayDetections
  }
}

async function getRegistrationStats() {
  const [total, pending, approved, rejected, cancelled] = await Promise.all([
    prisma.registrationRequest.count(),
    prisma.registrationRequest.count({ where: { status: 'PENDING' } }),
    prisma.registrationRequest.count({ where: { status: 'APPROVED' } }),
    prisma.registrationRequest.count({ where: { status: 'REJECTED' } }),
    prisma.registrationRequest.count({ where: { status: 'CANCELLED' } })
  ])

  return { total, pending, approved, rejected, cancelled }
}

async function getChatStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const [totalSessions, totalMessages, todaySessions, yesterdaySessions] = await Promise.all([
    prisma.chatSession.count(),
    prisma.chatMessage.count(),
    prisma.chatSession.count({ where: { startedAt: { gte: today } } }),
    prisma.chatSession.count({ 
      where: { 
        startedAt: { 
          gte: yesterday, 
          lt: today 
        } 
      } 
    })
  ])

  return {
    totalSessions,
    totalMessages,
    today: todaySessions,
    yesterday: yesterdaySessions
  }
}

async function getRecentActivityStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [todayCount, weekCount] = await Promise.all([
    prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: weekAgo } } })
  ])

  return {
    today: todayCount,
    thisWeek: weekCount
  }
}

