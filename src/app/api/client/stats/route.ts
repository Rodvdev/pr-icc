import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/client/stats
 * Get client dashboard statistics
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session as { userType?: string }).userType !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const clientId = session.user?.id
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID not found' },
        { status: 400 }
      )
    }

    // Get client visits in the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [totalVisits, upcomingAppointments, unreadMessages, recentVisits] = await Promise.all([
      // Total visits in last 6 months
      prisma.visit.count({
        where: {
          clientId,
          startedAt: {
            gte: sixMonthsAgo
          }
        }
      }),

      // Upcoming appointments (visits with WAITING status)
      prisma.visit.count({
        where: {
          clientId,
          status: 'WAITING'
        }
      }),

      // Unread messages (chat messages from BOT that haven't been read)
      prisma.chatMessage.count({
        where: {
          session: {
            clientId
          },
          actor: 'BOT',
          metadata: {
            path: ['read'],
            equals: false
          }
        }
      }),

      // Recent visits for activity feed
      prisma.visit.findMany({
        where: {
          clientId
        },
        take: 5,
        orderBy: {
          startedAt: 'desc'
        },
        include: {
          branch: {
            select: {
              name: true
            }
          }
        }
      })
    ])

    // Format recent activity
    const recentActivity = recentVisits.map((visit: {
      id: string
      startedAt: Date
      status: string
      branch: { name: string }
    }) => ({
      id: visit.id,
      type: 'visit',
      description: `Visita en ${visit.branch.name}`,
      date: formatTimeAgo(visit.startedAt),
      status: getVisitStatusText(visit.status)
    }))

    return NextResponse.json({
      totalVisits,
      upcomingAppointments,
      unreadMessages,
      recentActivity
    })

  } catch (error) {
    console.error('[API] GET /api/client/stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'hace un momento'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} día${days > 1 ? 's' : ''}`
  const weeks = Math.floor(days / 7)
  return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`
}

function getVisitStatusText(status: string): string {
  switch (status) {
    case 'WAITING':
      return 'En espera'
    case 'IN_SERVICE':
      return 'En servicio'
    case 'COMPLETED':
      return 'Completada'
    case 'ABANDONED':
      return 'Abandonada'
    default:
      return status
  }
}