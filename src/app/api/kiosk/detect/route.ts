import { NextRequest, NextResponse } from 'next/server'
import { facialRecognitionService } from '@/services/facial-recognition.service'

/**
 * POST /api/kiosk/detect
 * Endpoint para detección facial en el kiosco
 * Conectado con API externa de Python/ESP32
 * 
 * Body: { cameraId: string, timestamp: string, imageData: string }
 * Returns: { success: boolean, status: string, clientId?: string, confidence?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cameraId, timestamp, imageData } = body

    if (!cameraId) {
      return NextResponse.json(
        { success: false, error: 'cameraId es requerido' },
        { status: 400 }
      )
    }

    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'imageData es requerido' },
        { status: 400 }
      )
    }

    // Call external Python API for facial recognition
    const result = await facialRecognitionService.detectFace({
      imageData,
      cameraId,
      timestamp,
      metadata: {
        source: 'kiosk',
        timestamp: new Date().toISOString()
      }
    })

    // Store detection event in database
    await facialRecognitionService.storeDetectionEvent(cameraId, result)

    // Return the result
    return NextResponse.json({
      success: result.success,
      status: result.status,
      clientId: result.clientId,
      confidence: result.confidence,
      message: getStatusMessage(result.status)
    })

  } catch (error) {
    console.error('Error en detección facial:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'matched':
      return 'Cliente identificado exitosamente'
    case 'new_face':
      return 'Nueva cara detectada - registro requerido'
    case 'unknown':
      return 'Cara no reconocida'
    case 'multiple_matches':
      return 'Múltiples coincidencias encontradas'
    default:
      return 'Estado desconocido'
  }
}

/**
 * GET /api/kiosk/detect
 * Información sobre el endpoint de detección
 */
export async function GET() {
  try {
    // Check health of external API
    const health = await facialRecognitionService.getHealth()
    
    return NextResponse.json({
      endpoint: '/api/kiosk/detect',
      method: 'POST',
      description: 'Detección facial para kiosco - Integrado con API Python/ESP32',
      status: 'operational',
      externalApi: health.status,
      version: health.version || 'unknown'
    })
  } catch (error) {
    return NextResponse.json({
      endpoint: '/api/kiosk/detect',
      method: 'POST',
      description: 'Detección facial para kiosco',
      status: 'error',
      externalApi: 'unavailable',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
