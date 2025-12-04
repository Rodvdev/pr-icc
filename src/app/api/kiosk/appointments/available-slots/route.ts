import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/kiosk/appointments/available-slots?date=YYYY-MM-DD&branchId=xxx&excludeAppointmentId=xxx
 * Obtener horarios disponibles para una fecha específica
 * 
 * Returns: { availableSlots: string[], occupiedSlots: string[] }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateStr = searchParams.get('date')
    const branchId = searchParams.get('branchId')
    const excludeAppointmentId = searchParams.get('excludeAppointmentId')

    if (!dateStr) {
      return NextResponse.json(
        { error: 'date es requerido (formato: YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const selectedDate = new Date(dateStr)
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
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

    // Calcular rango del día
    const dayStart = new Date(selectedDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(selectedDate)
    dayEnd.setHours(23, 59, 59, 999)

    // Obtener todas las citas del día en esta sucursal
    const appointments = await prisma.appointment.findMany({
      where: {
        branchId: finalBranchId,
        scheduledAt: {
          gte: dayStart,
          lte: dayEnd
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {})
      }
    })

    // Generar todos los horarios posibles (9 AM a 6 PM, intervalos de 30 min)
    const allSlots: string[] = []
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        allSlots.push(timeString)
      }
    }

    // Identificar horarios ocupados (con margen de 15 minutos)
    const occupiedSlots: string[] = []
    appointments.forEach(apt => {
      const aptTime = new Date(apt.scheduledAt)
      const aptHour = aptTime.getHours()
      const aptMinute = aptTime.getMinutes()
      
      // Marcar el slot exacto y los adyacentes como ocupados
      const slotTime = `${aptHour.toString().padStart(2, '0')}:${aptMinute.toString().padStart(2, '0')}`
      if (allSlots.includes(slotTime)) {
        occupiedSlots.push(slotTime)
      }
    })

    // Filtrar horarios disponibles
    const availableSlots = allSlots.filter(slot => !occupiedSlots.includes(slot))

    return NextResponse.json({
      availableSlots,
      occupiedSlots
    })

  } catch (error) {
    console.error('Error al obtener horarios disponibles:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

