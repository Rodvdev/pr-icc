import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/facial-recognition/detections
 * Obtener todos los eventos de detección facial
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const [detections, total] = await Promise.all([
      prisma.detectionEvent.findMany({
        include: {
          client: {
            select: {
              id: true,
              name: true,
              dni: true,
              email: true
            }
          },
          camera: {
            select: {
              id: true,
              name: true,
              branch: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { occurredAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.detectionEvent.count()
    ])

    return NextResponse.json({
      detections,
      total,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error obteniendo detecciones:', error)
    return NextResponse.json(
      { error: 'Error obteniendo detecciones' },
      { status: 500 }
    )
  }
}

