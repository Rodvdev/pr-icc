import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/appointments/[id]
 * Obtener detalles de una cita (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      )
    }

    const { id } = await params

    const appointment = await prisma.appointment.findUnique({
      where: { id },
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
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: appointment.id,
        client: appointment.client,
        branch: appointment.branch,
        scheduledAt: appointment.scheduledAt.toISOString(),
        purpose: appointment.purpose,
        notes: appointment.notes,
        status: appointment.status,
        createdAt: appointment.createdAt.toISOString(),
        updatedAt: appointment.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('[API] GET /api/appointments/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/appointments/[id]
 * Actualizar una cita (reprogramar) - admin only
 * Body: { scheduledAt?, purpose?, notes? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { scheduledAt, purpose, notes } = body

    // Obtener la cita actual
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { client: true, branch: true }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el cliente esté activo
    if (appointment.client.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cliente no activo' },
        { status: 403 }
      )
    }

    // Verificar que la cita no esté cancelada o completada
    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'No se puede modificar una cita cancelada o completada' },
        { status: 400 }
      )
    }

    const updateData: {
      scheduledAt?: Date
      purpose?: string
      notes?: string | null
    } = {}

    // Si se está reprogramando la fecha/hora
    if (scheduledAt) {
      const newDate = new Date(scheduledAt)
      
      // Validar que la fecha no sea en el pasado
      if (newDate < new Date()) {
        return NextResponse.json(
          { error: 'No se puede programar una cita en el pasado' },
          { status: 400 }
        )
      }

      // Validar que no haya otra cita programada el mismo día para este cliente
      const sameDayStart = new Date(newDate)
      sameDayStart.setHours(0, 0, 0, 0)
      const sameDayEnd = new Date(newDate)
      sameDayEnd.setHours(23, 59, 59, 999)

      const existingSameDay = await prisma.appointment.findFirst({
        where: {
          clientId: appointment.clientId,
          id: { not: id }, // Excluir la cita actual
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
      const slotStart = new Date(newDate)
      slotStart.setMinutes(slotStart.getMinutes() - 15)
      const slotEnd = new Date(newDate)
      slotEnd.setMinutes(slotEnd.getMinutes() + 15)

      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          id: { not: id }, // Excluir la cita actual
          branchId: appointment.branchId,
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

      updateData.scheduledAt = newDate
    }

    // Actualizar otros campos si se proporcionan
    if (purpose !== undefined) updateData.purpose = purpose
    if (notes !== undefined) updateData.notes = notes

    // Actualizar la cita
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
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
        id: updatedAppointment.id,
        client: updatedAppointment.client,
        branch: updatedAppointment.branch,
        scheduledAt: updatedAppointment.scheduledAt.toISOString(),
        purpose: updatedAppointment.purpose,
        notes: updatedAppointment.notes,
        status: updatedAppointment.status
      }
    })

  } catch (error) {
    console.error('[API] PATCH /api/appointments/[id] error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/appointments/[id]
 * Cancelar una cita (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Obtener la cita actual
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { client: true }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el cliente esté activo
    if (appointment.client.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cliente no activo' },
        { status: 403 }
      )
    }

    // Verificar que la cita no esté ya cancelada o completada
    if (appointment.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'La cita ya está cancelada' },
        { status: 400 }
      )
    }

    if (appointment.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'No se puede cancelar una cita completada' },
        { status: 400 }
      )
    }

    // Cancelar la cita
    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[API] DELETE /api/appointments/[id] error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

