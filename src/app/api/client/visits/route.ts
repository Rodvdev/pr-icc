import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/client/visits
 * Get current client's visit history
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
    const statusParam = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Validate status parameter
    const validStatuses = ["WAITING", "IN_SERVICE", "COMPLETED", "ABANDONED"] as const
    const status = statusParam && validStatuses.includes(statusParam as typeof validStatuses[number]) 
      ? (statusParam as typeof validStatuses[number])
      : undefined

    // For demo purposes, try to find client by email
    // In production, use proper client authentication
    const client = await prisma.client.findFirst({
      where: {
        email: session.user.email
      }
    })

    if (!client) {
      // Return empty array if client not found (for demo purposes)
      return NextResponse.json({
        success: true,
        data: {
          visits: [],
          total: 0,
          stats: {
            total: 0,
            thisMonth: 0,
            averageDuration: 0,
            favoriteBranch: null
          }
        }
      })
    }

    // Build where clause
    const where = {
      clientId: client.id,
      ...(status ? { status } : {})
    }

    // Get visits with related data
    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          module: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.visit.count({ where })
    ])

    // Calculate stats
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const [thisMonthCount, allVisits] = await Promise.all([
      prisma.visit.count({
        where: {
          clientId: client.id,
          startedAt: { gte: thisMonth }
        }
      }),
      prisma.visit.findMany({
        where: { clientId: client.id },
        include: {
          branch: true
        }
      })
    ])

    // Calculate average duration
    const completedVisits = allVisits.filter((v: { finishedAt: Date | null }) => v.finishedAt)
    const avgDuration = completedVisits.length > 0
      ? completedVisits.reduce((sum: number, v: { finishedAt: Date | null; startedAt: Date }) => {
          const duration = v.finishedAt 
            ? (v.finishedAt.getTime() - v.startedAt.getTime()) / 1000 / 60 
            : 0
          return sum + duration
        }, 0) / completedVisits.length
      : 0

    // Find favorite branch
    const branchCounts = allVisits.reduce((acc: Record<string, number>, v: { branch: { name: string } }) => {
      acc[v.branch.name] = (acc[v.branch.name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const branchEntries = (Object.entries(branchCounts) as Array<[string, number]>).sort((a, b) => b[1] - a[1])
    const favoriteBranch = branchEntries.length > 0 ? branchEntries[0][0] : null

    // Format visits for response
    const formattedVisits = visits.map((visit: { 
      id: string; 
      startedAt: Date; 
      finishedAt: Date | null;
      branch: { name: string; code: string };
      module: { name: string; code: string } | null;
      purpose: string | null;
      status: string;
    }) => ({
      id: visit.id,
      date: visit.startedAt.toISOString().split('T')[0],
      time: visit.startedAt.toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      branch: visit.branch.name,
      branchCode: visit.branch.code,
      module: visit.module?.name || "N/A",
      moduleCode: visit.module?.code || "N/A",
      purpose: visit.purpose || "Consulta general",
      status: visit.status,
      duration: visit.finishedAt
        ? `${Math.round((visit.finishedAt.getTime() - visit.startedAt.getTime()) / 1000 / 60)} min`
        : "-",
      startedAt: visit.startedAt.toISOString(),
      finishedAt: visit.finishedAt?.toISOString() || null
    }))

    return NextResponse.json({
      success: true,
      data: {
        visits: formattedVisits,
        total,
        stats: {
          total: allVisits.length,
          thisMonth: thisMonthCount,
          averageDuration: Math.round(avgDuration),
          favoriteBranch
        }
      }
    })

  } catch (error) {
    console.error("[API] GET /api/client/visits error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error al obtener visitas" 
      },
      { status: 500 }
    )
  }
}

