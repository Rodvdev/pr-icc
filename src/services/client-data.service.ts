/**
 * Client Data Service
 * 
 * Service for consolidating and preprocessing client data for AI chat context.
 * Aggregates data from profile, visits, appointments, and statistics.
 */

import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export interface ClientProfileData {
  id: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  dni: string | null
  status: string
  createdAt: string
}

export interface ClientVisitData {
  id: string
  date: string
  time: string
  branch: string
  branchCode: string
  module: string
  purpose: string | null
  status: string
  duration: string
  startedAt: string
  finishedAt: string | null
}

export interface ClientAppointmentData {
  id: string
  scheduledAt: string
  purpose: string | null
  notes: string | null
  status: string
  branch: {
    name: string
    address: string | null
  }
}

export interface ClientStatsData {
  totalVisits: number
  thisMonth: number
  averageDuration: number
  favoriteBranch: string | null
  upcomingAppointments: number
}

export interface ConsolidatedClientData {
  profile: ClientProfileData | null
  recentVisits: ClientVisitData[]
  upcomingAppointments: ClientAppointmentData[]
  stats: ClientStatsData | null
}

/**
 * Get consolidated client data for AI context
 */
export async function getClientDataForAI(clientId: string | null): Promise<ConsolidatedClientData> {
  if (!clientId) {
    return {
      profile: null,
      recentVisits: [],
      upcomingAppointments: [],
      stats: null,
    }
  }

  try {
    // Fetch all data in parallel
    const [client, visits, appointments, stats] = await Promise.all([
      getClientProfile(clientId),
      getRecentVisits(clientId),
      getUpcomingAppointments(clientId),
      getClientStats(clientId),
    ])

    return {
      profile: client,
      recentVisits: visits,
      upcomingAppointments: appointments,
      stats,
    }
  } catch (error) {
    console.error('[ClientDataService] Error fetching client data:', error)
    // Return partial data on error
    return {
      profile: null,
      recentVisits: [],
      upcomingAppointments: [],
      stats: null,
    }
  }
}

/**
 * Get client profile data
 */
async function getClientProfile(clientId: string): Promise<ClientProfileData | null> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dni: true,
        status: true,
        createdAt: true,
      },
    })

    if (!client) {
      return null
    }

    const nameParts = client.name?.split(' ') || []
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    return {
      id: client.id,
      fullName: client.name || '',
      firstName,
      lastName,
      email: client.email || '',
      phone: client.phone,
      dni: client.dni,
      status: client.status,
      createdAt: client.createdAt.toISOString(),
    }
  } catch (error) {
    console.error('[ClientDataService] Error fetching profile:', error)
    return null
  }
}

/**
 * Get recent visits (last 10)
 */
async function getRecentVisits(clientId: string): Promise<ClientVisitData[]> {
  try {
    const visits = await prisma.visit.findMany({
      where: { clientId },
      include: {
        branch: {
          select: {
            name: true,
            code: true,
          },
        },
        module: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 10, // Limit to last 10 visits
    })

    return visits.map((visit) => ({
      id: visit.id,
      date: format(visit.startedAt, 'dd/MM/yyyy'),
      time: format(visit.startedAt, 'HH:mm'),
      branch: visit.branch.name,
      branchCode: visit.branch.code,
      module: visit.module?.name || 'N/A',
      purpose: visit.purpose || null,
      status: visit.status,
      duration: visit.finishedAt
        ? `${Math.round((visit.finishedAt.getTime() - visit.startedAt.getTime()) / 1000 / 60)} min`
        : '-',
      startedAt: visit.startedAt.toISOString(),
      finishedAt: visit.finishedAt?.toISOString() || null,
    }))
  } catch (error) {
    console.error('[ClientDataService] Error fetching visits:', error)
    return []
  }
}

/**
 * Get upcoming appointments (next 5)
 */
async function getUpcomingAppointments(clientId: string): Promise<ClientAppointmentData[]> {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        clientId,
        scheduledAt: {
          gte: new Date(),
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      include: {
        branch: {
          select: {
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      take: 5, // Limit to next 5 appointments
    })

    return appointments.map((apt) => ({
      id: apt.id,
      scheduledAt: apt.scheduledAt.toISOString(),
      purpose: apt.purpose || null,
      notes: apt.notes || null,
      status: apt.status,
      branch: {
        name: apt.branch.name,
        address: apt.branch.address,
      },
    }))
  } catch (error) {
    console.error('[ClientDataService] Error fetching appointments:', error)
    return []
  }
}

/**
 * Get client statistics
 */
async function getClientStats(clientId: string): Promise<ClientStatsData | null> {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const [
      totalVisits,
      thisMonthCount,
      allVisits,
      upcomingAppointmentsCount,
    ] = await Promise.all([
      // Total visits in last 6 months
      prisma.visit.count({
        where: {
          clientId,
          startedAt: {
            gte: sixMonthsAgo,
          },
        },
      }),

      // This month visits
      prisma.visit.count({
        where: {
          clientId,
          startedAt: {
            gte: thisMonth,
          },
        },
      }),

      // All visits for calculations
      prisma.visit.findMany({
        where: { clientId },
        include: {
          branch: {
            select: {
              name: true,
            },
          },
        },
      }),

      // Upcoming appointments
      prisma.appointment.count({
        where: {
          clientId,
          scheduledAt: {
            gte: new Date(),
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED'],
          },
        },
      }),
    ])

    // Calculate average duration
    const completedVisits = allVisits.filter((v) => v.finishedAt)
    const avgDuration =
      completedVisits.length > 0
        ? completedVisits.reduce((sum, v) => {
            const duration = v.finishedAt
              ? (v.finishedAt.getTime() - v.startedAt.getTime()) / 1000 / 60
              : 0
            return sum + duration
          }, 0) / completedVisits.length
        : 0

    // Find favorite branch
    const branchCounts = allVisits.reduce(
      (acc, v) => {
        acc[v.branch.name] = (acc[v.branch.name] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const branchEntries = Object.entries(branchCounts).sort((a, b) => b[1] - a[1])
    const favoriteBranch = branchEntries.length > 0 ? branchEntries[0][0] : null

    return {
      totalVisits,
      thisMonth: thisMonthCount,
      averageDuration: Math.round(avgDuration),
      favoriteBranch,
      upcomingAppointments: upcomingAppointmentsCount,
    }
  } catch (error) {
    console.error('[ClientDataService] Error fetching stats:', error)
    return null
  }
}

/**
 * Format client data as a readable string for AI context
 */
export function formatClientDataForPrompt(data: ConsolidatedClientData): string {
  if (!data.profile) {
    return 'No hay información del cliente disponible.'
  }

  const parts: string[] = []

  // Profile information
  parts.push('=== INFORMACIÓN DEL CLIENTE ===')
  parts.push(`Nombre: ${data.profile.fullName}`)
  parts.push(`Email: ${data.profile.email}`)
  if (data.profile.phone) {
    parts.push(`Teléfono: ${data.profile.phone}`)
  }
  parts.push(`Estado: ${data.profile.status}`)
  parts.push(`Cliente desde: ${format(new Date(data.profile.createdAt), 'dd/MM/yyyy')}`)

  // Statistics
  if (data.stats) {
    parts.push('\n=== ESTADÍSTICAS ===')
    parts.push(`Total de visitas (últimos 6 meses): ${data.stats.totalVisits}`)
    parts.push(`Visitas este mes: ${data.stats.thisMonth}`)
    if (data.stats.averageDuration > 0) {
      parts.push(`Duración promedio de visitas: ${data.stats.averageDuration} minutos`)
    }
    if (data.stats.favoriteBranch) {
      parts.push(`Sucursal favorita: ${data.stats.favoriteBranch}`)
    }
    parts.push(`Citas próximas: ${data.stats.upcomingAppointments}`)
  }

  // Recent visits
  if (data.recentVisits.length > 0) {
    parts.push('\n=== VISITAS RECIENTES ===')
    data.recentVisits.slice(0, 5).forEach((visit) => {
      parts.push(
        `- ${visit.date} ${visit.time} | ${visit.branch} | ${visit.purpose || 'Consulta general'} | ${visit.status} | ${visit.duration}`
      )
    })
  }

  // Upcoming appointments
  if (data.upcomingAppointments.length > 0) {
    parts.push('\n=== CITAS PROGRAMADAS ===')
    data.upcomingAppointments.forEach((apt) => {
      const date = format(new Date(apt.scheduledAt), 'dd/MM/yyyy HH:mm')
      parts.push(
        `- ${date} | ${apt.branch.name} | ${apt.purpose || 'Consulta general'} | ${apt.status}`
      )
    })
  }

  return parts.join('\n')
}

/**
 * Check if client data should be included based on query intent
 */
export function shouldIncludeClientData(query: string): boolean {
  const lowerQuery = query.toLowerCase()
  
  // Keywords that suggest the query is about the client's personal data
  const personalDataKeywords = [
    'mi perfil',
    'mis datos',
    'mi información',
    'mis visitas',
    'mis citas',
    'mi historial',
    'mi cuenta',
    'cuándo visité',
    'dónde estuve',
    'próxima cita',
    'tengo cita',
    'cuántas visitas',
    'estadísticas',
    'mi sucursal',
  ]

  return personalDataKeywords.some((keyword) => lowerQuery.includes(keyword))
}

