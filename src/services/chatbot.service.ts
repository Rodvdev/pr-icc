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
          // Fall through to FAQ/QA fallback
        }
      }

      // Fallback to FAQ/QA matching
      return await this.generateResponseFromContext(
        query,
        context,
        intentDetection,
        clientData
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
      profile?: { fullName?: string; email?: string; phone?: string; status?: string }
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
        response = `Tu información de perfil:\n- Nombre: ${clientData.profile.fullName}\n- Email: ${clientData.profile.email}${clientData.profile.phone ? `\n- Teléfono: ${clientData.profile.phone}` : ''}\n- Estado: ${clientData.profile.status}`
        confidence = 0.9
      } else if (intentDetection.category === 'visits' && clientData.recentVisits.length > 0) {
        response = `Tus visitas recientes:\n${clientData.recentVisits.slice(0, 5).map((v) => `- ${v.date || ''} ${v.time || ''} en ${v.branch || ''} (${v.status || ''})`).join('\n')}`
        confidence = 0.9
      } else if (intentDetection.category === 'appointments' && clientData.upcomingAppointments.length > 0) {
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
   */
  private getDefaultResponse(query: string): string {
    const lowerQuery = query.toLowerCase()

    // Keyword-based intent detection
    if (lowerQuery.includes('horario') || lowerQuery.includes('hora')) {
      return 'Nuestro horario de atención es de lunes a viernes de 9:00 AM a 6:00 PM. ¿Necesitas información adicional?'
    }
    
    if (lowerQuery.includes('ubicación') || lowerQuery.includes('dirección')) {
      return 'Te puedo ayudar con información sobre nuestras ubicaciones. ¿Qué sede necesitas consultar?'
    }
    
    if (lowerQuery.includes('contacto') || lowerQuery.includes('teléfono')) {
      return 'Para contactarnos, puedes llamar a nuestro teléfono de atención o enviar un correo. ¿Deseas que te proporcione el número?'
    }
    
    if (lowerQuery.includes('servicio') || lowerQuery.includes('atender')) {
      return 'Ofrecemos diversos servicios. ¿Hay algo específico en lo que te pueda ayudar?'
    }

    // Generic response
    return 'Hola, soy un asistente virtual. ¿En qué puedo ayudarte hoy? Puedo responder preguntas sobre horarios, servicios, ubicaciones y más.'
  }

  /**
   * Save chat interaction to database
   */
  async saveChatInteraction(
    clientId: string | null,
    message: string,
    response: string,
    intent: string,
    metadata: ChatInteractionMetadata
  ): Promise<SaveChatInteractionResult> {
    try {
      // Find or create chat session
      let sessionId: string
      
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
   * Record chat metrics (extended with OpenAI usage data)
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
          // Store extended metrics in metadata (we'll need to update schema or use existing metadata field)
        }
      })
    } catch (error) {
      console.error('[ChatbotService] Error recording metrics:', error)
      // Don't throw - metrics errors shouldn't break the chat
    }
  }

  /**
   * Get chat statistics
   */
  async getChatStats(clientId?: string) {
    try {
      const where = clientId ? { clientId } : {}

      const [totalMessages, successfulMessages, totalSessions, avgLatency] = await Promise.all([
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
        })
      ])

      return {
        totalMessages,
        successfulMessages,
        totalSessions,
        avgLatency: Math.round(avgLatency._avg.latency || 0),
        successRate: totalMessages > 0 
          ? Math.round((successfulMessages / totalMessages) * 100) 
          : 0
      }
    } catch (error) {
      console.error('[ChatbotService] Error getting chat stats:', error)
      return {
        totalMessages: 0,
        successfulMessages: 0,
        totalSessions: 0,
        avgLatency: 0,
        successRate: 0
      }
    }
  }
}

// Export singleton instance
export const chatbotService = new ChatbotService()

