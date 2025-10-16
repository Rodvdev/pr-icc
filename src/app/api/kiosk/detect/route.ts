import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/kiosk/detect
 * Endpoint para detección facial en el kiosco
 * 
 * Body: { cameraId: string, timestamp: string }
 * Returns: { success: true }
 * 
 * NOTA: Por el momento siempre retorna TRUE
 */
export async function POST(request: NextRequest) {
  try {
    // Leer el body para evitar errores, pero no validar nada
    await request.json().catch(() => ({}))

    // Siempre retornar TRUE
    return NextResponse.json({
      success: true,
      status: 'recognized',
      message: 'Detección exitosa (modo de prueba)'
    })

  } catch (error) {
    console.error('Error en detección facial:', error)
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  }
}

/**
 * GET /api/kiosk/detect
 * Información sobre el endpoint de detección
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/kiosk/detect',
    method: 'POST',
    description: 'Detección facial para kiosco',
    status: 'operational',
    note: 'Implementación stub - requiere integración con servicio de reconocimiento facial'
  })
}

