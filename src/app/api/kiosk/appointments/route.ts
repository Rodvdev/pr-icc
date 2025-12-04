import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/kiosk/appointments
 * Crear una nueva cita programada desde el kiosco
 * 
 * Body: { clientId: string, scheduledAt: string (ISO), purpose?: string, notes?: string, branchId?: string }
 * Returns: { appointmentId: string, status: string }
 */
export async function POST(request: NextRequest) {
  try {
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
        { error: 'Ya tienes una cita programada para este día. Solo puedes reprogramar o cancelar la cita existente.' },
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
      }
    })

    return NextResponse.json({
      appointmentId: appointment.id,
      status: appointment.status,
      scheduledAt: appointment.scheduledAt.toISOString()
    })

  } catch (error) {
    console.error('Error al crear cita:', error)
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
 * GET /api/kiosk/appointments?clientId=xxx
 * Obtener citas programadas de un cliente
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Obtener citas programadas (solo las futuras y no canceladas)
    const appointments = await prisma.appointment.findMany({
      where: {
        clientId,
        scheduledAt: {
          gte: new Date()
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      },
      include: {
        branch: {
          select: {
            name: true,
            address: true
          }
        }
      }
    })

    return NextResponse.json({
      appointments: appointments.map(apt => ({
        id: apt.id,
        scheduledAt: apt.scheduledAt.toISOString(),
        purpose: apt.purpose,
        notes: apt.notes,
        status: apt.status,
        branch: apt.branch
      }))
    })

  } catch (error) {
    console.error('Error al obtener citas:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

