/**
 * Branch Modules API
 * 
 * GET  /api/branches/[id]/modules - Get modules for a branch
 * POST /api/branches/[id]/modules - Create a new module for branch
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { branchService } from '@/services'

/**
 * GET /api/branches/[id]/modules
 * Get modules for a branch
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

    // Get modules
    const modules = await branchService.getModulesByBranch(id)

    return NextResponse.json({
      success: true,
      data: modules,
      total: modules.length
    })
  } catch (error) {
    console.error('[API] GET /api/branches/[id]/modules error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/branches/[id]/modules
 * Create a new module for branch
 */
export async function POST(
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

    // Check if branch exists
    const branch = await branchService.getBranchById(id)
    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Parse body
    const body = await request.json()
    const { moduleNumber, moduleType } = body

    // Validate required fields
    if (!moduleNumber || !moduleType) {
      return NextResponse.json(
        { error: 'Module number and type are required' },
        { status: 400 }
      )
    }

    // Create module
    const newModule = await branchService.createModule(
      {
        name: moduleType,
        code: moduleNumber,
        branchId: id
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: newModule
    }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/branches/[id]/modules error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

