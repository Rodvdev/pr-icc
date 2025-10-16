/**
 * Branch API - Single Branch Operations
 * 
 * GET    /api/branches/[id] - Get branch by ID
 * PATCH  /api/branches/[id] - Update branch
 * DELETE /api/branches/[id] - Delete branch (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { branchService } from '@/services'

/**
 * GET /api/branches/[id]
 * Get branch by ID
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

    // Get branch
    const branch = await branchService.getBranchById(id)
    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: branch
    })
  } catch (error) {
    console.error('[API] GET /api/branches/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/branches/[id]
 * Update branch information
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
      code,
      name,
      address,
      city,
      country
    } = body

    // Check if branch exists
    const existingBranch = await branchService.getBranchById(id)
    if (!existingBranch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Check code uniqueness if changed
    if (code && code !== existingBranch.code) {
      const codeTaken = await branchService.getBranchByCode(code)
      if (codeTaken) {
        return NextResponse.json(
          { error: 'Branch code already in use' },
          { status: 409 }
        )
      }
    }

    // Update branch
    const branch = await branchService.updateBranch(
      id,
      {
        code,
        name,
        address,
        city,
        country
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: branch
    })
  } catch (error) {
    console.error('[API] PATCH /api/branches/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/branches/[id]
 * Delete branch (soft delete)
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

    // Check if branch exists
    const existingBranch = await branchService.getBranchById(id)
    if (!existingBranch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Delete branch (soft delete)
    await branchService.deleteBranch(id, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Branch deleted successfully'
    })
  } catch (error) {
    console.error('[API] DELETE /api/branches/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

