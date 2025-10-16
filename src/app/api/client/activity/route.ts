import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Visit } from "@/services/visit.service"

/**
 * GET /api/client/activity
 * Get recent activity feed for current client
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    // Try to find client by email
    const client = await prisma.client.findFirst({
      where: {
        email: session.user.email
      }
    })

    if (!client) {
      return NextResponse.json({
        success: true,
        data: {
          activities: []
        }
      })
    }

    // Get recent visits
    const recentVisits = await prisma.visit.findMany({
      where: { clientId: client.id },
      include: {
        branch: {
          select: { name: true }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: limit
    })

    // Format activities
    const activities = recentVisits.map((visit: Visit) => ({
      id: visit.id,
      type: "visit",
      title: visit.status === "COMPLETED" ? "Visita completada" : "Visita registrada",
      description: `${visit.purpose ? ` - ${visit.purpose}` : ""}`,
      timestamp: visit.startedAt.toISOString(),
      status: visit.status,
      icon: visit.status === "COMPLETED" ? "CheckCircle" : "Clock"
    }))

    // Add profile update activity (mock)
    if (activities.length > 0) {
      activities.push({
        id: "profile-update",
        type: "profile",
        title: "Perfil actualizado",
        description: "Información de contacto",
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        icon: "FileText"
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        activities: activities.slice(0, limit)
      }
    })

  } catch (error) {
    console.error("[API] GET /api/client/activity error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error al obtener actividad" 
      },
      { status: 500 }
    )
  }
}

