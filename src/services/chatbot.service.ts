/**
 * Chatbot Service
 * 
 * Business logic for chatbot operations including context retrieval,
 * response generation with OpenAI, chat interactions, and metrics tracking.
 */

import { prisma } from '@/lib/prisma'
import { faqSearch, qaSearch } from '@/lib/mcp'
import { 
  generateChatCompletion, 
  isOpenAIConfigured, 
  estimateCost,
  ChatMessage as OpenAIChatMessage 
} from '@/lib/openai'
import { 
  getClientDataForAI, 
  formatClientDataForPrompt, 
  shouldIncludeClientData 
} from '@/services/client-data.service'
import { 
  getBankingSecuritySystemPrompt, 
  detectQueryIntent, 
  getRandomResponse,
  buildUserMessage 
} from '@/lib/ai-prompts'

// ========== TYPE DEFINITIONS ==========

export interface RelevantContext {
  faqs: Array<{
    id: string
    title: string
    answer: string
    tags: string[]
    relevance: number
  }>
  qaPairs: Array<{
    id: string
    question: string
    answer: string
    relevance: number
  }>
}

export interface ChatResponse {
  response: string
  intent: string
  confidence: number
  sources: string[]
  usedClientData?: boolean
  usedOpenAI?: boolean
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCost: number
  }
}

export interface ChatInteractionMetadata {
  confidence: number
  sources: string[]
  contextItems: number
}

export interface ChatMetrics {
  latency: number
  success: boolean
  intent?: string
  usedContext: boolean
  contextItems: number
  usedClientData?: boolean
  usedOpenAI?: boolean
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  estimatedCost?: number
  errorMessage?: string
  sessionId?: string | null
  clientId?: string | null
  handOffRequested?: boolean
  handOffReason?: string
  timestamp: Date
}

export interface SaveChatInteractionResult {
  sessionId: string
}

// ========== CHATBOT SERVICE ==========

export class ChatbotService {
  /**
   * Get relevant context from FAQs and QA pairs for a given query
   */
  async getRelevantContext(query: string): Promise<RelevantContext> {
    try {
      // Search FAQs and QA pairs in parallel
      const [faqResults, qaResults] = await Promise.all([
        faqSearch(query, [], 3),
        qaSearch(query, 3)
      ])

      return {
        faqs: faqResults.items,
        qaPairs: qaResults.items
      }
    } catch (error) {
      console.error('[ChatbotService] Error getting relevant context:', error)
      return {
        faqs: [],
        qaPairs: []
      }
    }
  }

  /**
   * Generate a chat response based on query and context
   * Now with OpenAI integration and client data access
   */
  async generateResponse(
    query: string,
    context: RelevantContext,
    clientId?: string | null
  ): Promise<ChatResponse> {
    try {
      // Detect query intent
      const intentDetection = detectQueryIntent(query)
      const requiresClientData = intentDetection.requiresClientData

      // Get client data if needed and available
      let clientData = null
      let clientContextString = ''
      if (requiresClientData && clientId) {
        try {
          clientData = await getClientDataForAI(clientId)
          if (clientData.profile) {
            clientContextString = formatClientDataForPrompt(clientData)
          }
        } catch (error) {
          console.error('[ChatbotService] Error fetching client data:', error)
        }
      }

      // Check if OpenAI is configured
      const useOpenAI = isOpenAIConfigured()

      // Try OpenAI first if configured
      if (useOpenAI) {
        try {
          return await this.generateResponseWithOpenAI(
            query,
            context,
            clientContextString,
            intentDetection
          )
        } catch (openAIError) {
          console.error('[ChatbotService] OpenAI error, falling back to FAQ/QA:', openAIError)
          // If it's a configuration error, include a helpful message
          if (openAIError instanceof Error && openAIError.message.includes('not configured')) {
            // Fall through to FAQ/QA fallback with a note
          }
          // Fall through to FAQ/QA fallback
        }
      } else {
        // Log that OpenAI is not configured (for admin monitoring)
        console.log('[ChatbotService] OpenAI not configured, using FAQ/QA fallback')
      }

      // Fallback to FAQ/QA matching
      // Convert ConsolidatedClientData to the expected format
      const formattedClientData = clientData ? {
        profile: clientData.profile ? {
          fullName: clientData.profile.fullName,
          email: clientData.profile.email,
          phone: clientData.profile.phone ?? undefined,
          status: clientData.profile.status
        } : null,
        recentVisits: (clientData.recentVisits || []).map(v => ({
          date: v.date,
          time: v.time,
          branch: v.branch,
          status: v.status
        })),
        upcomingAppointments: (clientData.upcomingAppointments || []).map(a => ({
          scheduledAt: a.scheduledAt,
          branch: a.branch,
          purpose: a.purpose
        }))
      } : null
      
      return await this.generateResponseFromContext(
        query,
        context,
        intentDetection,
        formattedClientData
      )
    } catch (error) {
      console.error('[ChatbotService] Error generating response:', error)
      return {
        response: getRandomResponse('error'),
        intent: 'error',
        confidence: 0,
        sources: [],
        usedClientData: false,
        usedOpenAI: false
      }
    }
  }

  /**
   * Generate response using OpenAI
   */
  private async generateResponseWithOpenAI(
    query: string,
    context: RelevantContext,
    clientContext: string,
    intentDetection: { category: string; confidence: number; requiresClientData: boolean }
  ): Promise<ChatResponse> {
    const systemPrompt = getBankingSecuritySystemPrompt(
      clientContext || undefined
    )

    // Build context from FAQs and QA pairs
    let contextText = ''
    if (context.faqs.length > 0 || context.qaPairs.length > 0) {
      contextText = '\n\nINFORMACIÓN ADICIONAL DISPONIBLE:\n'
      
      if (context.faqs.length > 0) {
        contextText += '\nFAQs relevantes:\n'
        context.faqs.slice(0, 3).forEach((faq) => {
          contextText += `- ${faq.title}: ${faq.answer}\n`
        })
      }
      
      if (context.qaPairs.length > 0) {
        contextText += '\nPreguntas y respuestas relevantes:\n'
        context.qaPairs.slice(0, 3).forEach((qa) => {
          contextText += `- P: ${qa.question}\n  R: ${qa.answer}\n`
        })
      }
    }

    const userMessage = buildUserMessage(query, clientContext ? 'Sí' : undefined)

    const messages: OpenAIChatMessage[] = [
      { role: 'system', content: systemPrompt + contextText },
      { role: 'user', content: userMessage }
    ]

    const completion = await generateChatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 500
    })

    const usage = completion.usage
    const estimatedCost = usage ? estimateCost(usage) : 0

    return {
      response: completion.response,
      intent: intentDetection.category,
      confidence: intentDetection.confidence,
      sources: context.faqs.map(f => `FAQ: ${f.title}`).concat(
        context.qaPairs.map(q => `QA: ${q.question}`)
      ),
      usedClientData: !!clientContext,
      usedOpenAI: true,
      usage: usage ? {
        ...usage,
        estimatedCost
      } : undefined
    }
  }

  /**
   * Generate response from FAQ/QA context (fallback)
   */
  private async generateResponseFromContext(
    query: string,
    context: RelevantContext,
    intentDetection: { category: string; confidence: number; requiresClientData: boolean },
    clientData: {
      profile?: { fullName?: string; email?: string; phone?: string; status?: string } | null
      recentVisits?: Array<{ date?: string; time?: string; branch?: string; status?: string }>
      upcomingAppointments?: Array<{ scheduledAt: string | Date; branch?: { name?: string }; purpose?: string | null }>
    } | null
  ): Promise<ChatResponse> {
    let response = ''
    let intent = intentDetection.category
    let confidence = intentDetection.confidence
    const sources: string[] = []

    // Check for pre-configured responses
    if (intentDetection.category === 'greeting') {
      response = getRandomResponse('greeting')
      confidence = 0.9
    } else if (intentDetection.category === 'farewell') {
      response = getRandomResponse('farewell')
      confidence = 0.9
    } else if (intentDetection.category === 'hours') {
      response = getRandomResponse('hours')
      confidence = 0.85
    } else if (intentDetection.category === 'location') {
      response = getRandomResponse('location')
      confidence = 0.85
    } else if (intentDetection.category === 'contact') {
      response = getRandomResponse('contact')
      confidence = 0.85
    } else if (intentDetection.category === 'services') {
      response = getRandomResponse('services')
      confidence = 0.8
    }
    // Try to use client data for personal queries
    else if (intentDetection.requiresClientData && clientData) {
      if (intentDetection.category === 'profile' && clientData.profile) {
        const profile = clientData.profile
        response = `Tu información de perfil:\n- Nombre: ${profile.fullName || 'N/A'}\n- Email: ${profile.email || 'N/A'}${profile.phone ? `\n- Teléfono: ${profile.phone}` : ''}\n- Estado: ${profile.status || 'N/A'}`
        confidence = 0.9
      } else if (intentDetection.category === 'visits' && clientData.recentVisits && clientData.recentVisits.length > 0) {
        response = `Tus visitas recientes:\n${clientData.recentVisits.slice(0, 5).map((v) => `- ${v.date || ''} ${v.time || ''} en ${v.branch || ''} (${v.status || ''})`).join('\n')}`
        confidence = 0.9
      } else if (intentDetection.category === 'appointments' && clientData.upcomingAppointments && clientData.upcomingAppointments.length > 0) {
        response = `Tus citas programadas:\n${clientData.upcomingAppointments.map((a) => `- ${new Date(a.scheduledAt).toLocaleDateString('es-PE')} en ${a.branch?.name || ''} (${a.purpose || 'Consulta general'})`).join('\n')}`
        confidence = 0.9
      } else {
        response = 'No tengo información disponible sobre eso en tu perfil. ¿Te gustaría que te ayude con algo más?'
        confidence = 0.5
      }
    }
    // Prioritize FAQ matches
    else if (context.faqs.length > 0 && context.faqs[0].relevance > 0.6) {
      response = context.faqs[0].answer
      intent = 'faq'
      confidence = context.faqs[0].relevance
      sources.push(`FAQ: ${context.faqs[0].title}`)
    }
    // Fall back to QA pairs
    else if (context.qaPairs.length > 0 && context.qaPairs[0].relevance > 0.6) {
      response = context.qaPairs[0].answer
      intent = 'qa'
      confidence = context.qaPairs[0].relevance
      sources.push(`QA: ${context.qaPairs[0].question}`)
    }
    // Default response
    else {
      response = this.getDefaultResponse(query)
      intent = 'default'
      confidence = 0.3
    }

    return {
      response,
      intent,
      confidence,
      sources,
      usedClientData: !!clientData?.profile,
      usedOpenAI: false
    }
  }

  /**
   * Get default response for queries without matching context
   * Includes suggestions for reformulation and hand-off to human agent when appropriate
   */
  private getDefaultResponse(query: string): string {
    const lowerQuery = query.toLowerCase()

    // Keyword-based intent detection
    if (lowerQuery.includes('horario') || lowerQuery.includes('hora')) {
      return 'Nuestro horario de atención es de lunes a viernes de 9:00 AM a 6:00 PM, y los sábados de 9:00 AM a 1:00 PM. ¿Necesitas información adicional sobre algún servicio específico?'
    }
    
    if (lowerQuery.includes('ubicación') || lowerQuery.includes('dirección') || lowerQuery.includes('sucursal')) {
      return 'Te puedo ayudar con información sobre nuestras ubicaciones. ¿Qué sede necesitas consultar? También puedes preguntarme por direcciones específicas o cómo llegar.'
    }
    
    if (lowerQuery.includes('contacto') || lowerQuery.includes('teléfono') || lowerQuery.includes('llamar')) {
      return 'Para contactarnos directamente, puedes llamar a nuestro teléfono de atención o visitar una de nuestras sucursales. ¿Te gustaría que te proporcione más información sobre nuestros canales de contacto?'
    }
    
    if (lowerQuery.includes('servicio') || lowerQuery.includes('atender') || lowerQuery.includes('ofrecen')) {
      return 'Ofrecemos diversos servicios bancarios. ¿Hay algo específico en lo que te pueda ayudar? Por ejemplo, puedo informarte sobre cuentas, préstamos, tarjetas, o servicios de atención al cliente.'
    }

    // Check if query seems complex or requires human assistance
    const complexKeywords = [
      'reclamo', 'queja', 'problema', 'error', 'no funciona', 'no puedo',
      'ayuda urgente', 'emergencia', 'fraude', 'robo', 'perdí', 'olvidé',
      'cancelar', 'suspender', 'bloquear', 'desactivar'
    ]
    
    const requiresHuman = complexKeywords.some(keyword => lowerQuery.includes(keyword))
    
    if (requiresHuman) {
      return `Entiendo que necesitas asistencia con un tema que requiere atención personalizada. Para brindarte el mejor servicio, te recomiendo hablar con uno de nuestros agentes humanos. ¿Te gustaría que te ayude a programar una cita o prefieres contactarnos directamente?`
    }

    // Check if query is too vague or unclear
    const isVeryShort = query.trim().length < 10
    const isUnclear = lowerQuery.match(/\b(que|qué|como|cómo|donde|dónde|cuando|cuándo|porque|por qué)\b/g)?.length === 1 && query.trim().length < 20

    if (isVeryShort || isUnclear) {
      return `Hola, soy tu asistente virtual. Para poder ayudarte mejor, ¿podrías ser más específico con tu consulta? Por ejemplo, puedes preguntarme sobre:
      
• Horarios de atención
• Ubicaciones de sucursales
• Servicios disponibles
• Información sobre tu perfil (si estás autenticado)
• Visitas y citas programadas

¿En qué puedo ayudarte específicamente?`
    }

    // Generic response with reformulation suggestion
    return `No estoy seguro de haber entendido completamente tu consulta. ¿Podrías reformularla de otra manera? 

Puedo ayudarte con:
• Información sobre horarios y ubicaciones
• Consultas sobre servicios bancarios
• Información de tu perfil y visitas (si estás autenticado)
• Preguntas frecuentes sobre nuestros servicios

Si tu consulta es más compleja o requiere atención personalizada, puedo ayudarte a conectarte con un agente humano. ¿Qué te gustaría hacer?`
  }

  /**
   * Save chat interaction to database
   * 
   * @param clientId - Client ID (if authenticated)
   * @param message - User message
   * @param response - Bot response
   * @param intent - Detected intent
   * @param metadata - Interaction metadata
   * @param providedSessionId - Optional session ID from request (validated)
   */
  async saveChatInteraction(
    clientId: string | null,
    message: string,
    response: string,
    intent: string,
    metadata: ChatInteractionMetadata,
    providedSessionId?: string | null
  ): Promise<SaveChatInteractionResult> {
    try {
      // Find or create chat session
      let sessionId: string
      
      // If sessionId is provided, validate it exists and is active
      if (providedSessionId) {
        const validatedSession = await prisma.chatSession.findUnique({
          where: {
            id: providedSessionId,
            endedAt: null // Only accept active sessions
          }
        })

        if (validatedSession) {
          // Verify clientId matches if both are provided
          if (clientId && validatedSession.clientId && validatedSession.clientId !== clientId) {
            // Session belongs to different client, create new session
            const newSession = await prisma.chatSession.create({
              data: {
                clientId,
                tempVisitorId: null
              }
            })
            sessionId = newSession.id
          } else {
            sessionId = validatedSession.id
          }
        } else {
          // Invalid or ended session, create new one
          const newSession = await prisma.chatSession.create({
            data: {
              clientId,
              tempVisitorId: clientId ? null : `temp_${Date.now()}`
            }
          })
          sessionId = newSession.id
        }
      } else {
        // No sessionId provided, find existing or create new
        const existingSession = clientId 
          ? await prisma.chatSession.findFirst({
              where: {
                clientId,
                endedAt: null
              },
              orderBy: {
                startedAt: 'desc'
              }
            })
          : null

        if (existingSession) {
          sessionId = existingSession.id
        } else {
          const newSession = await prisma.chatSession.create({
            data: {
              clientId,
              tempVisitorId: clientId ? null : `temp_${Date.now()}`
            }
          })
          sessionId = newSession.id
        }
      }

      // Save user message
      await prisma.chatMessage.create({
        data: {
          sessionId,
          actor: 'CLIENT',
          content: message
        }
      })

      // Save bot response
      await prisma.chatMessage.create({
        data: {
          sessionId,
          actor: 'BOT',
          content: response,
          intent,
          metadata: {
            confidence: metadata.confidence,
            sources: metadata.sources,
            contextItems: metadata.contextItems
          }
        }
      })

      return { sessionId }
    } catch (error) {
      console.error('[ChatbotService] Error saving chat interaction:', error)
      throw error
    }
  }

  /**
   * Record chat metrics (extended with OpenAI usage data and hand-offs)
   */
  async recordMetrics(metrics: ChatMetrics): Promise<void> {
    try {
      // Store extended metrics in metadata JSON field
      const metadata: {
        usedClientData?: boolean
        usedOpenAI?: boolean
        promptTokens?: number
        completionTokens?: number
        totalTokens?: number
        estimatedCost?: number
        handOffRequested?: boolean
        handOffReason?: string
      } = {
        usedClientData: metrics.usedClientData || false,
        usedOpenAI: metrics.usedOpenAI || false,
      }

      if (metrics.promptTokens !== undefined) {
        metadata.promptTokens = metrics.promptTokens
      }
      if (metrics.completionTokens !== undefined) {
        metadata.completionTokens = metrics.completionTokens
      }
      if (metrics.totalTokens !== undefined) {
        metadata.totalTokens = metrics.totalTokens
      }
      if (metrics.estimatedCost !== undefined) {
        metadata.estimatedCost = metrics.estimatedCost
      }
      if (metrics.handOffRequested !== undefined) {
        metadata.handOffRequested = metrics.handOffRequested
      }
      if (metrics.handOffReason) {
        metadata.handOffReason = metrics.handOffReason
      }

      await prisma.chatMetric.create({
        data: {
          sessionId: metrics.sessionId || null,
          clientId: metrics.clientId || null,
          latency: metrics.latency,
          success: metrics.success,
          intent: metrics.intent || null,
          usedContext: metrics.usedContext,
          contextItems: metrics.contextItems,
          errorMessage: metrics.errorMessage || null,
          timestamp: metrics.timestamp,
        }
      })
    } catch (error) {
      console.error('[ChatbotService] Error recording metrics:', error)
      // Don't throw - metrics errors shouldn't break the chat
    }
  }

  /**
   * Record a hand-off request to human agent
   */
  async recordHandOff(
    sessionId: string | null,
    clientId: string | null,
    reason?: string
  ): Promise<void> {
    try {
      await this.recordMetrics({
        latency: 0,
        success: true,
        intent: 'handoff',
        usedContext: false,
        contextItems: 0,
        handOffRequested: true,
        handOffReason: reason,
        sessionId,
        clientId,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('[ChatbotService] Error recording hand-off:', error)
    }
  }

  /**
   * Get hand-off statistics
   */
  async getHandOffStats(clientId?: string) {
    try {
      const where = clientId ? { clientId } : {}

      // Count hand-offs from chat messages with handOff metadata
      const handOffMessages = await prisma.chatMessage.findMany({
        where: {
          ...(clientId ? {
            session: {
              clientId
            }
          } : {}),
          actor: 'BOT',
          metadata: {
            path: ['handOff'],
            equals: true
          }
        }
      })

      // Also count from metrics
      const handOffMetrics = await prisma.chatMetric.findMany({
        where: {
          ...where,
          intent: 'handoff'
        }
      })

      return {
        totalHandOffs: handOffMessages.length + handOffMetrics.length,
        handOffMessages: handOffMessages.length,
        handOffMetrics: handOffMetrics.length
      }
    } catch (error) {
      console.error('[ChatbotService] Error getting hand-off stats:', error)
      return {
        totalHandOffs: 0,
        handOffMessages: 0,
        handOffMetrics: 0
      }
    }
  }

  /**
   * Get chat statistics
   * Includes comprehensive metrics: latency, success rate, hand-offs, intent distribution, context usage
   */
  async getChatStats(clientId?: string) {
    try {
      const where = clientId ? { clientId } : {}

      const [
        totalMessages,
        successfulMessages,
        totalSessions,
        avgLatency,
        allMetrics,
        handOffStats
      ] = await Promise.all([
        // Total messages
        prisma.chatMessage.count({
          where: {
            session: where
          }
        }),
        
        // Successful messages (from metrics)
        prisma.chatMetric.count({
          where: {
            ...where,
            success: true
          }
        }),
        
        // Total sessions
        prisma.chatSession.count({
          where
        }),
        
        // Average latency
        prisma.chatMetric.aggregate({
          where: {
            ...where,
            success: true
          },
          _avg: {
            latency: true
          }
        }),

        // All metrics for detailed analysis
        prisma.chatMetric.findMany({
          where,
          select: {
            intent: true,
            usedContext: true,
            contextItems: true,
            success: true
          }
        }),

        // Hand-off statistics
        this.getHandOffStats(clientId)
      ])

      // Calculate intent distribution
      const intentDistribution = allMetrics.reduce((acc, metric) => {
        const intent = metric.intent || 'unknown'
        acc[intent] = (acc[intent] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Calculate context usage statistics
      const metricsWithContext = allMetrics.filter(m => m.usedContext)
      const contextUsageRate = allMetrics.length > 0
        ? Math.round((metricsWithContext.length / allMetrics.length) * 100)
        : 0

      // Calculate average context items used
      const avgContextItems = allMetrics.length > 0
        ? Math.round(
            allMetrics.reduce((sum, m) => sum + (m.contextItems || 0), 0) / allMetrics.length
          )
        : 0

      // Calculate client data usage (from metrics metadata - would need to query metadata field)
      // For now, we'll estimate based on intent types that typically require client data
      const clientDataIntents = ['profile', 'visits', 'appointments']
      const clientDataUsageCount = allMetrics.filter(m => 
        m.intent && clientDataIntents.includes(m.intent)
      ).length
      const clientDataUsageRate = allMetrics.length > 0
        ? Math.round((clientDataUsageCount / allMetrics.length) * 100)
        : 0

      return {
        totalMessages,
        successfulMessages,
        totalSessions,
        avgLatency: Math.round(avgLatency._avg.latency || 0),
        successRate: totalMessages > 0 
          ? Math.round((successfulMessages / totalMessages) * 100) 
          : 0,
        handOffs: handOffStats.totalHandOffs,
        intentDistribution,
        contextUsageRate,
        avgContextItems,
        clientDataUsageRate
      }
    } catch (error) {
      console.error('[ChatbotService] Error getting chat stats:', error)
      return {
        totalMessages: 0,
        successfulMessages: 0,
        totalSessions: 0,
        avgLatency: 0,
        successRate: 0,
        handOffs: 0,
        intentDistribution: {},
        contextUsageRate: 0,
        avgContextItems: 0,
        clientDataUsageRate: 0
      }
    }
  }

  /**
   * Get intent distribution statistics
   */
  async getIntentDistribution(clientId?: string) {
    try {
      const where = clientId ? { clientId } : {}

      const metrics = await prisma.chatMetric.findMany({
        where,
        select: {
          intent: true
        }
      })

      const distribution = metrics.reduce((acc, metric) => {
        const intent = metric.intent || 'unknown'
        acc[intent] = (acc[intent] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return distribution
    } catch (error) {
      console.error('[ChatbotService] Error getting intent distribution:', error)
      return {}
    }
  }

  /**
   * Get context usage statistics
   */
  async getContextUsageStats(clientId?: string) {
    try {
      const where = clientId ? { clientId } : {}

      const metrics = await prisma.chatMetric.findMany({
        where,
        select: {
          usedContext: true,
          contextItems: true
        }
      })

      const totalMetrics = metrics.length
      const withContext = metrics.filter(m => m.usedContext).length
      const totalContextItems = metrics.reduce((sum, m) => sum + (m.contextItems || 0), 0)

      return {
        totalRequests: totalMetrics,
        requestsWithContext: withContext,
        contextUsageRate: totalMetrics > 0
          ? Math.round((withContext / totalMetrics) * 100)
          : 0,
        avgContextItems: totalMetrics > 0
          ? Math.round(totalContextItems / totalMetrics)
          : 0,
        totalContextItems
      }
    } catch (error) {
      console.error('[ChatbotService] Error getting context usage stats:', error)
      return {
        totalRequests: 0,
        requestsWithContext: 0,
        contextUsageRate: 0,
        avgContextItems: 0,
        totalContextItems: 0
      }
    }
  }
}

// Export singleton instance
export const chatbotService = new ChatbotService()

