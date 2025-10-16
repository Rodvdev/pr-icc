import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/client/stats
 * Get dashboard statistics for current client
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Try to find client by email
    const client = await prisma.client.findFirst({
      where: {
        email: session.user.email
      }
    })

    if (!client) {
      // Return default stats if client not found
      return NextResponse.json({
        success: true,
        data: {
          totalVisits: 0,
          nextAppointment: null,
          unreadMessages: 0,
          accountStatus: "ACTIVE",
          registrationDate: new Date().toISOString(),
          lastVisit: null
        }
      })
    }

    // Calculate stats
    const [totalVisits, lastVisit, thisMonthVisits] = await Promise.all([
      prisma.visit.count({
        where: { clientId: client.id }
      }),
      prisma.visit.findFirst({
        where: { clientId: client.id },
        orderBy: { startedAt: 'desc' },
        include: {
          branch: {
            select: { name: true }
          }
        }
      }),
      prisma.visit.count({
        where: {
          clientId: client.id,
          startedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ])

    const stats = {
      totalVisits,
      thisMonthVisits,
      nextAppointment: null, // TODO: Implement appointments
      unreadMessages: 3, // TODO: Implement messaging system
      accountStatus: client.status,
      registrationDate: client.createdAt.toISOString(),
      lastVisit: lastVisit ? {
        date: lastVisit.startedAt.toISOString(),
        branch: lastVisit.branch.name,
        purpose: lastVisit.purpose
      } : null
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error("[API] GET /api/client/stats error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error al obtener estadísticas" 
      },
      { status: 500 }
    )
  }
}

