/**
 * Registration Requests API
 * 
 * GET  /api/registrations - List all registration requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      )
    }

    // Get all registration requests
    const requests = await prisma.registrationRequest.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            dni: true,
            phone: true,
            status: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: requests
    })
  } catch (error) {
    console.error('[API] GET /api/registrations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
