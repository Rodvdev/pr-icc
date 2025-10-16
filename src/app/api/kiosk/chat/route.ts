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
      // Buscar en FAQs
      const faqResults = await faqSearch(message, [], 3)
      
      // Buscar en QA pairs
      const qaResults = await qaSearch(message, 3)

      // Si hay resultados, usar el más relevante
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
        // Respuesta por defecto si no hay match
        response = getDefaultResponse(message)
        metadata = { source: 'default' }
      }
    } catch (error) {
      console.error('Error buscando respuesta:', error)
      response = 'Lo siento, tuve un problema al procesar tu pregunta. ¿Podrías reformularla?'
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
 * Respuestas por defecto basadas en palabras clave
 */
function getDefaultResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('horario')) {
    return 'Nuestros horarios de atención son de lunes a viernes de 9:00 AM a 6:00 PM, y sábados de 9:00 AM a 1:00 PM. ¿Hay algo más en lo que pueda ayudarte?'
  }

  if (lowerMessage.includes('retiro') || lowerMessage.includes('dinero')) {
    return 'Para realizar un retiro de dinero, puedes hacerlo en nuestros cajeros automáticos disponibles 24/7, o en ventanilla durante nuestro horario de atención. El monto máximo de retiro diario es de S/ 2,000. ¿Necesitas más información?'
  }

  if (lowerMessage.includes('cuenta') || lowerMessage.includes('abrir')) {
    return 'Para abrir una cuenta con nosotros, necesitas tu DNI vigente y comprobante de domicilio. El proceso toma aproximadamente 15 minutos. ¿Te gustaría agendar una cita con uno de nuestros asesores?'
  }

  if (lowerMessage.includes('mantenimiento') || lowerMessage.includes('costo')) {
    return 'Nuestras cuentas de ahorro no tienen costo de mantenimiento mensual. Las cuentas corrientes tienen un mantenimiento de S/ 15 mensuales. ¿Quieres conocer más detalles sobre nuestros productos?'
  }

  if (lowerMessage.includes('agente') || lowerMessage.includes('humano') || lowerMessage.includes('persona')) {
    return 'Entiendo que prefieres hablar con un agente humano. Por favor, dirígete al mostrador de atención al cliente donde un asesor estará encantado de ayudarte. Si estás en cola, tu turno será llamado pronto.'
  }

  if (lowerMessage.includes('hola') || lowerMessage.includes('buenos días') || lowerMessage.includes('buenas tardes')) {
    return '¡Hola! Bienvenido al Banco Digital. Estoy aquí para ayudarte con tus consultas sobre nuestros servicios. ¿En qué puedo asistirte hoy?'
  }

  if (lowerMessage.includes('gracias')) {
    return 'De nada, es un placer ayudarte. Si tienes más preguntas, no dudes en consultarme. ¡Que tengas un excelente día!'
  }

  // Respuesta genérica
  return 'Gracias por tu pregunta. Para poder ayudarte mejor, podrías ser más específico? También puedes hablar con uno de nuestros asesores en el mostrador de atención al cliente.'
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

