import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/kiosk/detect
 * Endpoint para detección facial en el kiosco
 * 
 * Body: { cameraId: string, timestamp: string, imageData?: string }
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

    // TODO: Integrate with Azure Face API or AWS Rekognition
    // For now, simulate facial recognition with random results
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock facial recognition logic
    const mockResults = [
      { status: 'recognized', clientId: 'client-001', confidence: 0.95 },
      { status: 'recognized', clientId: 'client-002', confidence: 0.87 },
      { status: 'new_face', clientId: null, confidence: 0.0 },
      { status: 'unknown', clientId: null, confidence: 0.0 },
      { status: 'multiple_matches', clientId: null, confidence: 0.0 }
    ]

    const result = mockResults[Math.floor(Math.random() * mockResults.length)]

    // Log detection event
    await prisma.detectionEvent.create({
      data: {
        cameraId,
        status: result.status as 'MATCHED' | 'NEW_FACE' | 'MULTIPLE_MATCHES' | 'UNKNOWN',
        confidence: result.confidence,
        clientId: result.clientId,
        metadata: {
          timestamp,
          imageData: imageData ? 'provided' : 'not_provided',
          mockResult: true
        }
      }
    })

    return NextResponse.json({
      success: true,
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
        status: 'error'
      },
      { status: 500 }
    )
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'recognized':
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
  return NextResponse.json({
    endpoint: '/api/kiosk/detect',
    method: 'POST',
    description: 'Detección facial para kiosco',
    status: 'operational',
    note: 'Implementación stub - requiere integración con servicio de reconocimiento facial'
  })
}

