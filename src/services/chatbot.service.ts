/**
 * Chatbot Service
 * 
 * Business logic for chatbot operations.
 * Handles context retrieval from FAQs/Docs and AI integration.
 */

import { prisma } from '@/lib/prisma'
import { faqService } from './faq.service'

// ========== TYPE DEFINITIONS ==========

export interface ChatContext {
  faqs: Array<{
    id: string
    title: string
    answer: string
    tags: string[]
  }>
  qaPairs: Array<{
    id: string
    question: string
    answer: string
  }>
  relevantDocs: string[]
}

export interface ChatMetrics {
  latency: number
  success: boolean
  intent?: string
  usedContext: boolean
  contextItems?: number
  timestamp: Date
  sessionId?: string | null
  clientId?: string | null
  errorMessage?: string | null
}

export interface ChatResponse {
  response: string
  intent: string
  confidence: number
  sources?: Array<{
    type: 'faq' | 'qa'
    id: string
    title?: string
    relevance: number
  }>
  metadata?: Record<string, unknown>
}

// ========== CHATBOT SERVICE ==========

export class ChatbotService {
  private readonly MAX_CONTEXT_ITEMS = 5
  private readonly MIN_RELEVANCE_SCORE = 0.3

  /**
   * Retrieve relevant context from FAQs and QA pairs
   */
  async getRelevantContext(message: string): Promise<ChatContext> {
    const lowerMessage = message.toLowerCase()
    
    // Get published FAQs
    const publishedFAQs = await faqService.getPublishedFAQs()
    
    // Get active QA pairs
    const activeQAPairs = await faqService.getActiveQAPairs()
    
    // Score and rank FAQs
    const scoredFAQs = publishedFAQs.map(faq => ({
      ...faq,
      score: this.calculateRelevanceScore(lowerMessage, {
        title: faq.title.toLowerCase(),
        answer: faq.answer.toLowerCase(),
        tags: faq.tags.map(t => t.toLowerCase())
      })
    }))
    .filter(item => item.score >= this.MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, this.MAX_CONTEXT_ITEMS)
    
    // Score and rank QA pairs
    const scoredQAPairs = activeQAPairs.map(qa => ({
      ...qa,
      score: this.calculateRelevanceScore(lowerMessage, {
        question: qa.question.toLowerCase(),
        answer: qa.answer.toLowerCase()
      })
    }))
    .filter(item => item.score >= this.MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, this.MAX_CONTEXT_ITEMS)
    
    return {
      faqs: scoredFAQs.map(faq => ({
        id: faq.id,
        title: faq.title,
        answer: faq.answer,
        tags: faq.tags
      })),
      qaPairs: scoredQAPairs.map(qa => ({
        id: qa.id,
        question: qa.question,
        answer: qa.answer
      })),
      relevantDocs: [] // Placeholder for future document integration
    }
  }

  /**
   * Calculate relevance score for a message against FAQ/QA content
   */
  private calculateRelevanceScore(
    message: string,
    content: {
      title?: string
      answer?: string
      question?: string
      tags?: string[]
    }
  ): number {
    let score = 0
    const words = message.split(/\s+/).filter(w => w.length > 2)
    
    // Check title (highest weight)
    if (content.title) {
      const titleMatches = words.filter(w => content.title!.includes(w)).length
      score += (titleMatches / words.length) * 0.5
    }
    
    // Check question (high weight)
    if (content.question) {
      const questionMatches = words.filter(w => content.question!.includes(w)).length
      score += (questionMatches / words.length) * 0.3
    }
    
    // Check answer (medium weight)
    if (content.answer) {
      const answerMatches = words.filter(w => content.answer!.includes(w)).length
      score += (answerMatches / words.length) * 0.15
    }
    
    // Check tags (low weight but exact match bonus)
    if (content.tags) {
      const tagMatches = content.tags.filter(tag => 
        words.some(w => tag.includes(w) || w.includes(tag))
      ).length
      score += (tagMatches / Math.max(content.tags.length, 1)) * 0.05
    }
    
    // Exact phrase match bonus
    const exactPhrases = [
      'horario', 'sucursal', 'ubicación', 'tasa', 'interés',
      'cuenta', 'crédito', 'préstamo', 'retiro', 'pago',
      'depósito', 'transferencia', 'ahorro'
    ]
    
    const hasExactMatch = exactPhrases.some(phrase => 
      message.includes(phrase) && 
      (content.title?.includes(phrase) || 
       content.answer?.includes(phrase) ||
       content.question?.includes(phrase) ||
       content.tags?.some(tag => tag.includes(phrase)))
    )
    
    if (hasExactMatch) {
      score += 0.1
    }
    
    return Math.min(score, 1.0)
  }

  /**
   * Generate response using context from FAQs/QA pairs
   */
  async generateResponse(
    message: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    const intent = this.detectIntent(message)
    
    // Try to find exact match in context
    let response = ''
    let confidence = 0.7
    const sources: ChatResponse['sources'] = []
    
    // Search in FAQs first
    for (const faq of context.faqs) {
      const faqLower = `${faq.title} ${faq.answer}`.toLowerCase()
      const messageLower = message.toLowerCase()
      
      // Check for key phrase matches
      const keywords = ['horario', 'sucursal', 'ubicación', 'tasa', 'interés', 
                       'cuenta', 'crédito', 'préstamo', 'retiro', 'pago']
      
      const hasKeywordMatch = keywords.some(keyword => 
        messageLower.includes(keyword) && faqLower.includes(keyword)
      )
      
      if (hasKeywordMatch || faqLower.includes(messageLower.substring(0, 20))) {
        response = faq.answer
        confidence = 0.9
        sources.push({
          type: 'faq',
          id: faq.id,
          title: faq.title,
          relevance: 0.9
        })
        break
      }
    }
    
    // If no FAQ match, try QA pairs
    if (!response) {
      for (const qa of context.qaPairs) {
        const qaLower = `${qa.question} ${qa.answer}`.toLowerCase()
        const messageLower = message.toLowerCase()
        
        // Check for semantic similarity (simple word overlap)
        const messageWords = messageLower.split(/\s+/).filter(w => w.length > 3)
        const qaWords = qaLower.split(/\s+/).filter(w => w.length > 3)
        const commonWords = messageWords.filter(w => qaWords.includes(w))
        
        if (commonWords.length >= 2 || qaLower.includes(messageLower.substring(0, 20))) {
          response = qa.answer
          confidence = 0.85
          sources.push({
            type: 'qa',
            id: qa.id,
            relevance: 0.85
          })
          break
        }
      }
    }
    
    // Fallback response if no context match
    if (!response) {
      response = this.getFallbackResponse(intent)
      confidence = 0.6
    }
    
    return {
      response,
      intent,
      confidence,
      sources: sources.length > 0 ? sources : undefined,
      metadata: {
        contextUsed: context.faqs.length + context.qaPairs.length,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Detect intent from message
   */
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('horario')) return 'query_hours'
    if (lowerMessage.includes('sucursal') || lowerMessage.includes('ubicación')) return 'query_location'
    if (lowerMessage.includes('tasa') || lowerMessage.includes('interés')) return 'query_rates'
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('soporte')) return 'request_help'
    if (lowerMessage.includes('cuenta')) return 'query_account'
    if (lowerMessage.includes('crédito') || lowerMessage.includes('préstamo')) return 'query_credit'
    if (lowerMessage.includes('retiro')) return 'query_withdrawal'
    if (lowerMessage.includes('pago') || lowerMessage.includes('depósito')) return 'query_payment'
    
    return 'general_query'
  }

  /**
   * Get fallback response when no context match is found
   */
  private getFallbackResponse(intent: string): string {
    const responses: Record<string, string> = {
      query_hours: 'Nuestros horarios de atención son de lunes a viernes de 9:00 AM a 6:00 PM, y sábados de 9:00 AM a 1:00 PM.',
      query_location: 'Contamos con sucursales en San Isidro, Miraflores, Surco y San Borja. ¿En cuál de ellas te gustaría obtener más información?',
      query_rates: 'Nuestras tasas de interés varían según el tipo de producto. Para ahorro, ofrecemos tasas desde 2.5% anual. Para créditos, las tasas comienzan desde 8% anual.',
      request_help: 'Estoy aquí para ayudarte. Puedo asistirte con información sobre sucursales, horarios, productos financieros, y consultas generales. ¿Qué necesitas saber?',
      query_account: 'Para consultas sobre tu cuenta, por favor acércate a alguna de nuestras sucursales o contáctanos por teléfono.',
      query_credit: 'Ofrecemos diferentes opciones de crédito según tus necesidades. ¿Te gustaría conocer más detalles sobre algún producto en particular?',
      query_withdrawal: 'Puedes realizar retiros en cualquiera de nuestras sucursales o cajeros automáticos asociados.',
      query_payment: 'Ofrecemos múltiples canales para realizar pagos y depósitos. ¿Qué tipo de operación necesitas realizar?',
      general_query: 'Gracias por tu mensaje. Estoy aquí para ayudarte con información sobre nuestros servicios. ¿Hay algo específico en lo que pueda asistirte?'
    }
    
    return responses[intent] || responses.general_query
  }

  /**
   * Save chat session and message
   */
  async saveChatInteraction(
    clientId: string | null,
    message: string,
    response: string,
    intent: string,
    metadata?: Record<string, unknown>
  ): Promise<{ sessionId: string; messageId: string }> {
    // Find or create session
    let session = await prisma.chatSession.findFirst({
      where: {
        clientId: clientId || undefined,
        endedAt: null
      },
      orderBy: {
        startedAt: 'desc'
      }
    })
    
    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          clientId: clientId || undefined
        }
      })
    }
    
    // Save both user message and bot response
    const [userMessage, botMessage] = await Promise.all([
      prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          actor: 'CLIENT',
          content: message,
          intent: null,
          metadata: metadata as Record<string, unknown>
        }
      }),
      prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          actor: 'BOT',
          content: response,
          intent,
          metadata: metadata as Record<string, unknown>
        }
      })
    ])
    
    return {
      sessionId: session.id,
      messageId: botMessage.id
    }
  }

  /**
   * Record chat metrics to database
   */
  async recordMetrics(metrics: ChatMetrics): Promise<void> {
    try {
      // Use provided sessionId/clientId or try to find from latest session
      let sessionId = metrics.sessionId || null
      let clientId = metrics.clientId || null

      // If sessionId not provided, try to find latest session
      if (!sessionId) {
        const session = await prisma.chatSession.findFirst({
          where: {
            endedAt: null
          },
          orderBy: {
            startedAt: 'desc'
          },
          take: 1
        })
        
        if (session) {
          sessionId = session.id
          clientId = session.clientId || null
        }
      } else if (!clientId) {
        // If sessionId provided but not clientId, fetch it
        const session = await prisma.chatSession.findUnique({
          where: { id: sessionId },
          select: { clientId: true }
        })
        if (session) {
          clientId = session.clientId || null
        }
      }

      // Calculate context items count
      const contextItems = metrics.contextItems !== undefined 
        ? metrics.contextItems 
        : (metrics.usedContext ? 1 : 0)

      // Save metric to database
      await prisma.chatMetric.create({
        data: {
          sessionId: sessionId,
          clientId: clientId,
          latency: metrics.latency,
          success: metrics.success,
          intent: metrics.intent || null,
          usedContext: metrics.usedContext,
          contextItems: contextItems,
          errorMessage: metrics.success ? null : (metrics.errorMessage || null),
          timestamp: metrics.timestamp || new Date()
        }
      })

      // Also log for debugging
      console.log('[Chatbot Metrics] Saved to DB', {
        latency: metrics.latency,
        success: metrics.success,
        intent: metrics.intent,
        usedContext: metrics.usedContext,
        contextItems: contextItems,
        sessionId: sessionId,
        timestamp: metrics.timestamp
      })
    } catch (error) {
      // Log error but don't fail the request
      console.error('[Chatbot Service] Failed to record metrics:', error)
      // Fallback to console log if DB write fails
      console.log('[Chatbot Metrics] (fallback)', {
        latency: metrics.latency,
        success: metrics.success,
        intent: metrics.intent,
        usedContext: metrics.usedContext,
        timestamp: metrics.timestamp
      })
    }
  }

  /**
   * Get chat statistics with metrics from database
   */
  async getChatStats(clientId?: string): Promise<{
    totalSessions: number
    totalMessages: number
    averageResponseTime: number
    successRate: number
    topIntents: Array<{ intent: string; count: number }>
    metricsCount: number
    recentMetrics?: Array<{
      timestamp: Date
      latency: number
      success: boolean
      intent?: string | null
    }>
  }> {
    const where = clientId ? { clientId } : {}
    const metricWhere = clientId ? { clientId } : {}
    
    const [sessions, messages, intents, metrics, recentMetrics] = await Promise.all([
      prisma.chatSession.count({ where }),
      prisma.chatMessage.count({
        where: {
          session: where,
          actor: 'BOT'
        }
      }),
      prisma.chatMessage.groupBy({
        by: ['intent'],
        where: {
          session: where,
          actor: 'BOT',
          intent: { not: null }
        },
        _count: {
          intent: true
        },
        orderBy: {
          _count: {
            intent: 'desc'
          }
        },
        take: 5
      }),
      prisma.chatMetric.findMany({
        where: metricWhere,
        select: {
          latency: true,
          success: true
        }
      }),
      prisma.chatMetric.findMany({
        where: metricWhere,
        orderBy: {
          timestamp: 'desc'
        },
        take: 10,
        select: {
          timestamp: true,
          latency: true,
          success: true,
          intent: true
        }
      })
    ])

    // Calculate average response time from metrics
    const avgResponseTime = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length
      : 0

    // Calculate success rate
    const successCount = metrics.filter(m => m.success).length
    const successRate = metrics.length > 0
      ? (successCount / metrics.length) * 100
      : 100

    // Get top intents from metrics (more accurate)
    const intentCounts = new Map<string, number>()
    metrics.forEach(m => {
      // We'll use ChatMessage intents as primary source, but can augment with metrics
    })
    
    return {
      totalSessions: sessions,
      totalMessages: messages,
      averageResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      topIntents: intents.map(i => ({
        intent: i.intent || 'unknown',
        count: i._count.intent || 0
      })),
      metricsCount: metrics.length,
      recentMetrics: recentMetrics.map(m => ({
        timestamp: m.timestamp,
        latency: m.latency,
        success: m.success,
        intent: m.intent
      }))
    }
  }
}

// ========== SINGLETON EXPORT ==========

export const chatbotService = new ChatbotService()

