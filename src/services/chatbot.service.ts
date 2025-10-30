/**
 * Chatbot Service
 * 
 * Business logic for chatbot operations including context retrieval,
 * response generation, chat interactions, and metrics tracking.
 */

import { prisma } from '@/lib/prisma'
import { faqSearch, qaSearch } from '@/lib/mcp'

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
   */
  async generateResponse(
    query: string,
    context: RelevantContext
  ): Promise<ChatResponse> {
    try {
      // Determine the best response based on context
      let response = ''
      let intent = 'general'
      let confidence = 0.5
      const sources: string[] = []

      // Prioritize FAQ matches
      if (context.faqs.length > 0 && context.faqs[0].relevance > 0.6) {
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
        sources
      }
    } catch (error) {
      console.error('[ChatbotService] Error generating response:', error)
      return {
        response: 'Lo siento, tuve un problema al procesar tu pregunta. ¿Podrías reformularla?',
        intent: 'error',
        confidence: 0,
        sources: []
      }
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
   * Record chat metrics
   */
  async recordMetrics(metrics: ChatMetrics): Promise<void> {
    try {
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
          timestamp: metrics.timestamp
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

