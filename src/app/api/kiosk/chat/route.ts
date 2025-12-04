import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { faqSearch, qaSearch } from '@/lib/mcp'
import { Prisma } from '@prisma/client'

/**
 * POST /api/kiosk/chat
 * Endpoint para chat en kiosco
 * 
 * Body: { sessionId: string, message: string, clientId?: string }
 * Returns: { response: string, metadata?: object }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, clientId } = body

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'sessionId y message son requeridos' },
        { status: 400 }
      )
    }

    // Buscar o crear sesión de chat
    let chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId }
    })

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          id: sessionId,
          clientId: clientId || null,
          tempVisitorId: clientId ? null : sessionId
        }
      })
    }

    // Guardar mensaje del cliente
    await prisma.chatMessage.create({
      data: {
        sessionId,
        actor: 'CLIENT',
        content: message
      }
    })

    // Buscar respuesta en base de conocimiento
    let response = ''
    let metadata: Record<string, unknown> = {}

    try {
      const lowerMessage = message.toLowerCase()
      const isAboutHours = lowerMessage.includes('horario') || 
                           lowerMessage.includes('hora') || 
                           lowerMessage.includes('abierto') || 
                           lowerMessage.includes('cerrado') ||
                           lowerMessage.includes('atención') ||
                           lowerMessage.includes('atender')

      // Solo responder si es sobre horarios
      if (isAboutHours) {
        // Buscar en FAQs relacionadas con horarios
        const faqResults = await faqSearch(message, ['horarios', 'horario', 'atención'], 3)
        
        // Buscar en QA pairs relacionadas con horarios
        const qaResults = await qaSearch(message, 3)

        // Si hay resultados sobre horarios, usar el más relevante
        if (faqResults.items.length > 0 && faqResults.items[0].relevance > 0.6) {
          response = faqResults.items[0].answer
          metadata = {
            source: 'faq',
            faqId: faqResults.items[0].id,
            relevance: faqResults.items[0].relevance
          }
        } else if (qaResults.items.length > 0 && qaResults.items[0].relevance > 0.6) {
          response = qaResults.items[0].answer
          metadata = {
            source: 'qa',
            qaId: qaResults.items[0].id,
            relevance: qaResults.items[0].relevance
          }
        } else {
          // Respuesta por defecto sobre horarios
          response = getDefaultResponse(message)
          metadata = { source: 'default' }
        }
      } else {
        // Si no es sobre horarios, indicar que solo puede ayudar con horarios
        response = getDefaultResponse(message)
        metadata = { source: 'default' }
      }
    } catch (error) {
      console.error('Error buscando respuesta:', error)
      response = 'Lo siento, tuve un problema al procesar tu pregunta sobre horarios. ¿Podrías reformularla?'
      metadata = { error: true }
    }

    // Guardar respuesta del bot
    await prisma.chatMessage.create({
      data: {
        sessionId,
        actor: 'BOT',
        content: response,
        metadata: metadata as Prisma.InputJsonValue
      }
    })

    return NextResponse.json({
      response,
      metadata
    })

  } catch (error) {
    console.error('Error en chat:', error)
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
 * Respuestas por defecto - solo sobre horarios de atención
 */
function getDefaultResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  // Saludos
  if (lowerMessage.includes('hola') || lowerMessage.includes('buenos días') || lowerMessage.includes('buenas tardes') || lowerMessage.includes('buenas noches')) {
    return '¡Hola! Bienvenido. Solo puedo ayudarte con información sobre nuestros horarios de atención. ¿Cuál es tu consulta sobre horarios?'
  }

  // Despedidas
  if (lowerMessage.includes('gracias') || lowerMessage.includes('adios') || lowerMessage.includes('chau')) {
    return 'De nada. Si necesitas más información sobre horarios, no dudes en consultarme. ¡Que tengas un excelente día!'
  }

  // Consultas sobre horarios
  if (lowerMessage.includes('horario') || 
      lowerMessage.includes('hora') || 
      lowerMessage.includes('abierto') || 
      lowerMessage.includes('cerrado') ||
      lowerMessage.includes('atención') ||
      lowerMessage.includes('atender') ||
      lowerMessage.includes('cuándo') ||
      lowerMessage.includes('disponible')) {
    return 'Nuestros horarios de atención son de lunes a viernes de 9:00 AM a 6:00 PM, y sábados de 9:00 AM a 1:00 PM. ¿Hay algo más sobre horarios en lo que pueda ayudarte?'
  }

  // Si no es sobre horarios, indicar que solo puede ayudar con horarios
  return 'Solo puedo ayudarte con información sobre nuestros horarios de atención. Nuestros horarios son de lunes a viernes de 9:00 AM a 6:00 PM, y sábados de 9:00 AM a 1:00 PM. Para otras consultas, por favor dirígete al mostrador de atención al cliente.'
}

/**
 * GET /api/kiosk/chat
 * Información sobre el endpoint de chat
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/kiosk/chat',
    method: 'POST',
    description: 'Chat con asistente virtual para kiosco',
    status: 'operational'
  })
}

