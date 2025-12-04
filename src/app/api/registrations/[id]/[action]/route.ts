/**
 * Registration Request Actions API
 * 
 * POST /api/registrations/[id]/approve - Approve a registration
 * POST /api/registrations/[id]/reject - Reject a registration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      )
    }

    const { id, action } = await params
    const body = await request.json()
    const { notes } = body

    // Get registration request
    const registrationRequest = await prisma.registrationRequest.findUnique({
      where: { id },
      include: { client: true }
    })

    if (!registrationRequest) {
      return NextResponse.json(
        { error: 'Registration request not found' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      // Update registration status to APPROVED
      const updatedRequest = await prisma.registrationRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          decidedAt: new Date(),
          approverId: session.user.id
        }
      })

      // Activate the client
      await prisma.client.update({
        where: { id: registrationRequest.clientId },
        data: { status: 'ACTIVE' }
      })

      return NextResponse.json({
        success: true,
        message: 'Registration approved successfully',
        data: updatedRequest
      })
    } else if (action === 'reject') {
      // Update registration status to REJECTED
      const updatedRequest = await prisma.registrationRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          decidedAt: new Date(),
          approverId: session.user.id
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Registration rejected successfully',
        data: updatedRequest
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[API] POST /api/registrations/[id]/[action] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
