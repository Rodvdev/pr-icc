/**
 * Module API - Single Module Operations
 * 
 * GET    /api/modules/[id] - Get module by ID
 * PATCH  /api/modules/[id] - Update module
 * DELETE /api/modules/[id] - Delete module
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { branchService } from '@/services'

/**
 * GET /api/modules/[id]
 * Get module by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get module
    const moduleData = await branchService.getModuleById(id)
    if (!moduleData) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: moduleData
    })
  } catch (error) {
    console.error('[API] GET /api/modules/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/modules/[id]
 * Update module
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      )
    }

    // Parse body
    const body = await request.json()
    const {
      moduleNumber,
      moduleType,
      status,
      location,
      assignedAgentId
    } = body

    // Check if module exists
    const existingModule = await branchService.getModuleById(id)
    if (!existingModule) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      )
    }

    // Update module
    const moduleData = await branchService.updateModule(
      id,
      {
        name: moduleType,
        code: moduleNumber,
        isActive: status === 'ACTIVE'
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: moduleData
    })
  } catch (error) {
    console.error('[API] PATCH /api/modules/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/modules/[id]
 * Delete module
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      )
    }

    // Check if module exists
    const existingModule = await branchService.getModuleById(id)
    if (!existingModule) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      )
    }

    // Delete module
    await branchService.deleteModule(id, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Module deleted successfully'
    })
  } catch (error) {
    console.error('[API] DELETE /api/modules/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

