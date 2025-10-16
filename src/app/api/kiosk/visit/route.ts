import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/kiosk/visit
 * Crear una nueva visita desde el kiosco
 * 
 * Body: { clientId: string, purpose: string, branchId?: string }
 * Returns: { visitId: string, status: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, purpose, branchId } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe y está activo
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    if (client.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cliente no activo' },
        { status: 403 }
      )
    }

    // Determinar branchId (usar el primero disponible si no se especifica)
    let finalBranchId = branchId
    if (!finalBranchId) {
      const firstBranch = await prisma.branch.findFirst()
      if (!firstBranch) {
        return NextResponse.json(
          { error: 'No hay sucursales disponibles' },
          { status: 500 }
        )
      }
      finalBranchId = firstBranch.id
    }

    // Verificar si ya tiene una visita activa
    const activeVisit = await prisma.visit.findFirst({
      where: {
        clientId,
        status: {
          in: ['WAITING', 'IN_SERVICE']
        }
      }
    })

    if (activeVisit) {
      return NextResponse.json({
        visitId: activeVisit.id,
        status: activeVisit.status,
        message: 'Ya tienes una visita activa'
      })
    }

    // Crear nueva visita
    const visit = await prisma.visit.create({
      data: {
        clientId,
        branchId: finalBranchId,
        purpose: purpose || 'consulta',
        status: 'WAITING'
      }
    })

    return NextResponse.json({
      visitId: visit.id,
      status: visit.status,
      message: 'Visita creada exitosamente'
    })

  } catch (error) {
    console.error('Error creando visita:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/kiosk/visit
 * Información sobre el endpoint de visitas
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/kiosk/visit',
    method: 'POST',
    description: 'Crear visita desde kiosco',
    status: 'operational'
  })
}

