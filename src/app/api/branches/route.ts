/**
 * Branches API - List and Create
 * 
 * GET  /api/branches - List all branches
 * POST /api/branches - Create a new branch
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { branchService } from '@/services'

/**
 * GET /api/branches
 * List all branches
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Get branches
    const branches = await branchService.getAllBranches(includeInactive)

    return NextResponse.json({
      success: true,
      data: branches,
      total: branches.length
    })
  } catch (error) {
    console.error('[API] GET /api/branches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/branches
 * Create a new branch
 */
export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      )
    }

    // Check if branch code already exists
    const existingBranch = await branchService.getBranchByCode(code)
    if (existingBranch) {
      return NextResponse.json(
        { error: 'Branch with this code already exists' },
        { status: 409 }
      )
    }

    // Create branch
    const branch = await branchService.createBranch(
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
    }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/branches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
