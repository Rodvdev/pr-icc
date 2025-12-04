import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, AppointmentStatus } from '@prisma/client'

/**
 * GET /api/appointments
 * Listar todas las citas con filtros (admin only)
 * Query params: clientId?, status?, branchId?, startDate?, endDate?, search?
 */
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

    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const branchId = searchParams.get('branchId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    // Build where clause
    const where: Prisma.AppointmentWhereInput = {}

    if (clientId) {
      where.clientId = clientId
    }

    if (status && status !== 'all') {
      where.status = status as AppointmentStatus
    }

    if (branchId) {
      where.branchId = branchId
    }

    if (startDate || endDate) {
      where.scheduledAt = {}
      if (startDate) {
        where.scheduledAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.scheduledAt.lte = new Date(endDate)
      }
    }

    // Search by client name, email, or DNI
    if (search) {
      where.client = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { dni: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    // Fetch appointments
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            dni: true,
            phone: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            code: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: appointments.map(apt => ({
        id: apt.id,
        client: apt.client,
        branch: apt.branch,
        scheduledAt: apt.scheduledAt.toISOString(),
        purpose: apt.purpose,
        notes: apt.notes,
        status: apt.status,
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString()
      }))
    })

  } catch (error) {
    console.error('[API] GET /api/appointments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/appointments
 * Crear una nueva cita desde admin
 * Body: { clientId, scheduledAt, purpose?, notes?, branchId? }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { clientId, scheduledAt, purpose, notes, branchId } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId es requerido' },
        { status: 400 }
      )
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { error: 'scheduledAt es requerido' },
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

    // Validar que la fecha no sea en el pasado
    const appointmentDate = new Date(scheduledAt)
    if (appointmentDate < new Date()) {
      return NextResponse.json(
        { error: 'No se puede programar una cita en el pasado' },
        { status: 400 }
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

    // Validar que no haya otra cita programada el mismo día para este cliente
    const sameDayStart = new Date(appointmentDate)
    sameDayStart.setHours(0, 0, 0, 0)
    const sameDayEnd = new Date(appointmentDate)
    sameDayEnd.setHours(23, 59, 59, 999)

    const existingSameDay = await prisma.appointment.findFirst({
      where: {
        clientId,
        scheduledAt: {
          gte: sameDayStart,
          lte: sameDayEnd
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    })

    if (existingSameDay) {
      return NextResponse.json(
        { error: 'El cliente ya tiene una cita programada para este día. Solo se puede reprogramar o cancelar la cita existente.' },
        { status: 409 }
      )
    }

    // Validar que el horario no esté ocupado por otro cliente
    // Consideramos un intervalo de 30 minutos para cada cita
    const slotStart = new Date(appointmentDate)
    slotStart.setMinutes(slotStart.getMinutes() - 15) // 15 min antes
    const slotEnd = new Date(appointmentDate)
    slotEnd.setMinutes(slotEnd.getMinutes() + 15) // 15 min después

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        branchId: finalBranchId,
        scheduledAt: {
          gte: slotStart,
          lte: slotEnd
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Este horario ya está ocupado por otro cliente' },
        { status: 409 }
      )
    }

    // Crear nueva cita
    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        branchId: finalBranchId,
        scheduledAt: appointmentDate,
        purpose: purpose || 'Consulta general',
        notes: notes || null,
        status: 'SCHEDULED'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            dni: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: appointment.id,
        client: appointment.client,
        branch: appointment.branch,
        scheduledAt: appointment.scheduledAt.toISOString(),
        purpose: appointment.purpose,
        notes: appointment.notes,
        status: appointment.status
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[API] POST /api/appointments error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

