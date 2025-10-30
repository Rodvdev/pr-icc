import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { faqService } from "@/services"
import { prisma } from "@/lib/prisma"

export default async function MetricsPage() {
  const [chatStats, faqStats] = await Promise.all([
    getChatStats(),
    faqService.getFAQStats(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Métricas</h1>
        <p className="text-gray-600 mt-1">Básico para empezar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sesiones de chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{chatStats.totalSessions.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Total histórico</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mensajes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{chatStats.totalMessages.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Total histórico</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>FAQs publicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{faqStats.publishedFAQs?.toLocaleString?.() ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">de {faqStats.totalFAQs?.toLocaleString?.() ?? 0} totales</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preguntas más vistas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(faqStats.topViewed ?? []).length === 0 ? (
            <div className="text-gray-500 text-sm">Aún sin datos.</div>
          ) : (
            (faqStats.topViewed as { title: string; views: number }[]).slice(0, 5).map((f, i) => {
              const max = Math.max(...(faqStats.topViewed as { views: number }[]).map(x => x.views)) || 1
              const pct = Math.round((f.views / max) * 100)
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="line-clamp-1 pr-2">{f.title}</span>
                    <span className="text-gray-500">{f.views.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
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

