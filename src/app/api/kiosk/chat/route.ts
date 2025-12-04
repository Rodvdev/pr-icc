import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { chatbotService } from '@/services/chatbot.service'
import { sanitizeInput } from '@/lib/security'

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

    // Sanitize input
    const sanitizedMessage = sanitizeInput(message)
    
    if (sanitizedMessage.length < 3) {
      return NextResponse.json(
        { error: 'El mensaje es muy corto (mínimo 3 caracteres)' },
        { status: 400 }
      )
    }

    if (sanitizedMessage.length > 1000) {
      return NextResponse.json(
        { error: 'El mensaje es muy largo (máximo 1000 caracteres)' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Get relevant context from FAQs/QA pairs
    const context = await chatbotService.getRelevantContext(sanitizedMessage)
    
    // Generate response using chatbot service (with OpenAI if configured)
    const chatResponse = await chatbotService.generateResponse(
      sanitizedMessage,
      context,
      clientId || null
    )

    // Save chat interaction
    try {
      await chatbotService.saveChatInteraction(
        clientId || null,
        sanitizedMessage,
        chatResponse.response,
        chatResponse.intent,
        {
          confidence: chatResponse.confidence,
          sources: chatResponse.sources,
          contextItems: context.faqs.length + context.qaPairs.length
        }
      )
    } catch (dbError) {
      console.error('[Kiosk Chat] Failed to save chat interaction:', dbError)
    }

    // Calculate latency
    const latency = Date.now() - startTime

    // Record metrics
    try {
      await chatbotService.recordMetrics({
        latency,
        success: true,
        intent: chatResponse.intent,
        usedContext: context.faqs.length + context.qaPairs.length > 0,
        contextItems: context.faqs.length + context.qaPairs.length,
        usedClientData: chatResponse.usedClientData || false,
        usedOpenAI: chatResponse.usedOpenAI || false,
        promptTokens: chatResponse.usage?.promptTokens,
        completionTokens: chatResponse.usage?.completionTokens,
        totalTokens: chatResponse.usage?.totalTokens,
        estimatedCost: chatResponse.usage?.estimatedCost,
        sessionId: sessionId,
        clientId: clientId || null,
        timestamp: new Date()
      })
    } catch (metricsError) {
      console.error('[Kiosk Chat] Failed to record metrics:', metricsError)
    }

    // Build metadata
    const metadata: Record<string, unknown> = {
      intent: chatResponse.intent,
      confidence: chatResponse.confidence,
      sources: chatResponse.sources,
      usedClientData: chatResponse.usedClientData || false,
      usedOpenAI: chatResponse.usedOpenAI || false,
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    }

    if (chatResponse.usage) {
      metadata.usage = chatResponse.usage
    }

    return NextResponse.json({
      response: chatResponse.response,
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

