import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/facial-recognition/profiles
 * Obtener todos los perfiles faciales registrados
 */
export async function GET(request: NextRequest) {
  try {
    const profiles = await prisma.facialProfile.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            dni: true,
            email: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ profiles })

  } catch (error) {
    console.error('Error obteniendo perfiles faciales:', error)
    return NextResponse.json(
      { error: 'Error obteniendo perfiles faciales' },
      { status: 500 }
    )
  }
}

