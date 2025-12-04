import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/kiosk/appointments/[id]
 * Actualizar una cita (reprogramar)
 * 
 * Body: { scheduledAt?: string (ISO), purpose?: string, notes?: string }
 * Returns: { appointment: {...} }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { scheduledAt, purpose, notes } = body

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

    // Verificar que la cita no esté cancelada o completada
    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'No se puede modificar una cita cancelada o completada' },
        { status: 400 }
      )
    }

    const updateData: any = {}

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
          { error: 'Ya tienes una cita programada para este día. Solo puedes reprogramar o cancelar la cita existente.' },
          { status: 409 }
        )
      }

      // Validar que el horario no esté ocupado por otro cliente
      // Consideramos un intervalo de 30 minutos para cada cita
      const slotStart = new Date(newDate)
      slotStart.setMinutes(slotStart.getMinutes() - 15) // 15 min antes
      const slotEnd = new Date(newDate)
      slotEnd.setMinutes(slotEnd.getMinutes() + 15) // 15 min después

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
        branch: {
          select: {
            name: true,
            address: true
          }
        }
      }
    })

    return NextResponse.json({
      appointment: {
        id: updatedAppointment.id,
        scheduledAt: updatedAppointment.scheduledAt.toISOString(),
        purpose: updatedAppointment.purpose,
        notes: updatedAppointment.notes,
        status: updatedAppointment.status,
        branch: updatedAppointment.branch
      }
    })

  } catch (error) {
    console.error('Error al actualizar cita:', error)
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
 * DELETE /api/kiosk/appointments/[id]
 * Cancelar una cita
 * 
 * Returns: { success: boolean }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    console.error('Error al cancelar cita:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

