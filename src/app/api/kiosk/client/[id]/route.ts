import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/kiosk/client/[id]
 * Obtener información del cliente para la pantalla de bienvenida
 * 
 * NOTA: Por el momento siempre retorna datos del cliente Rodrigo (ID: 3)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Leer params para evitar errores
    await params

    // Siempre retornar datos del cliente Rodrigo (ID: 3)
    return NextResponse.json({
      id: '3',
      name: 'Rodrigo',
      email: 'rodrigo@example.com',
      lastVisit: new Date().toISOString(),
      pendingDocuments: 0,
      upcomingAppointments: 0
    })

  } catch (error) {
    console.error('Error obteniendo datos del cliente:', error)
    // Incluso en caso de error, retornar datos del cliente
    return NextResponse.json({
      id: '3',
      name: 'Rodrigo',
      email: 'rodrigo@example.com',
      lastVisit: new Date().toISOString(),
      pendingDocuments: 0,
      upcomingAppointments: 0
    })
  }
}
