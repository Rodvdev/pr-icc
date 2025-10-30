import { NextRequest, NextResponse } from 'next/server'
import { facialRecognitionService } from '@/services/facial-recognition.service'
import { clientService } from '@/services/client.service'

/**
 * POST /api/facial-recognition/register
 * Registrar una nueva cara en el sistema de reconocimiento facial
 * 
 * Body: { 
 *   imageData: string,
 *   dni?: string,
 *   name?: string,
 *   email?: string,
 *   phone?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageData, dni, name, email, phone } = body

    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'imageData es requerido' },
        { status: 400 }
      )
    }

    // Register face with external Python API
    const result = await facialRecognitionService.registerFace({
      imageData,
      clientData: {
        dni,
        name,
        email,
        phone
      }
    })

    if (!result.success || !result.faceId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error registrando la cara en el sistema externo',
          details: result.message
        },
        { status: 500 }
      )
    }

    // If client data provided, create/update client in database
    let clientId = null
    if (dni || email) {
      try {
        // Try to find existing client
        let client = null
        if (dni) {
          client = await clientService.getClientByDni(dni)
        } else if (email) {
          client = await clientService.getClientByEmail(email)
        }

        // Create client if doesn't exist
        if (!client && (email || dni)) {
          client = await clientService.createClient({
            email: email || `client_${dni}@example.com`,
            password: Math.random().toString(36).slice(-12), // Generate random password
            dni: dni,
            name: name,
            phone: phone
          })
        }

        // Create facial profile in database
        if (client) {
          await facialRecognitionService.createFacialProfile(
            client.id,
            result
          )
          clientId = client.id
        }
      } catch (error) {
        console.error('Error creating client profile:', error)
        // Continue even if database operations fail
      }
    }

    return NextResponse.json({
      success: true,
      faceId: result.faceId,
      clientId: clientId,
      message: 'Rostro registrado exitosamente'
    })

  } catch (error) {
    console.error('Error en registro facial:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

