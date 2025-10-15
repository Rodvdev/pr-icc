import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        modules: true,
        cameras: true,
        admins: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            visits: true,
          },
        },
      },
    })

    return NextResponse.json({ branches })
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, address, city, country } = body

    const branch = await prisma.branch.create({
      data: {
        name,
        code,
        address,
        city,
        country,
      },
    })

    return NextResponse.json({ branch }, { status: 201 })
  } catch (error) {
    console.error('Error creating branch:', error)
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
    )
  }
}
