import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { chatbotService } from "@/services/chatbot.service"
import { rateLimit, sanitizeInput, addSecurityHeaders, validateCSRF } from "@/lib/security"

// Rate limiting configuration
const chatRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  keyGenerator: (req) => {
    const session = req.headers.get('x-session-id')
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'
    return `chat:${session || ip}`
  }
})

/**
 * POST /api/chat
 * Handle chat messages and return AI responses with FAQ/Docs context
 * 
 * Security guards:
 * - Rate limiting (10 requests/minute per user/IP)
 * - Input sanitization
 * - CSRF protection
 * - Authentication required
 * - Content length validation
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let success = false
  let intent: string | undefined

  try {
    // Security: Validate CSRF
    if (!validateCSRF(req)) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: "Invalid request origin" },
          { status: 403 }
        )
      )
    }

    // Security: Rate limiting
    const rateLimitResult = chatRateLimit(req)
    if (!rateLimitResult.success) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            error: "Rate limit exceeded",
            retryAfter: rateLimitResult.resetTime ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) : 60
          },
          { status: 429 }
        )
      )
    }

    // Security: Authentication check
    const session = await getServerSession(authOptions)
    if (!session) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        )
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await req.json()
    } catch (error) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: "Invalid JSON in request body" },
          { status: 400 }
        )
      )
    }

    const { message } = body

    // Security: Input validation
    if (!message || typeof message !== 'string') {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: "Message is required and must be a string" },
          { status: 400 }
        )
      )
    }

    // Security: Sanitize input
    const sanitizedMessage = sanitizeInput(message)
    
    if (sanitizedMessage.length < 3) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: "Message is too short (minimum 3 characters)" },
          { status: 400 }
        )
      )
    }

    if (sanitizedMessage.length > 1000) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: "Message is too long (maximum 1000 characters)" },
          { status: 400 }
        )
      )
    }

    // Get client ID from session (if available)
    const clientId = (session.user as { id?: string })?.id || null

    // Get relevant context from FAQs/QA pairs
    const context = await chatbotService.getRelevantContext(sanitizedMessage)
    
    // Generate response using context
    const chatResponse = await chatbotService.generateResponse(
      sanitizedMessage,
      context
    )

    intent = chatResponse.intent

    // Save chat interaction to database
    let sessionId: string | null = null
    try {
      const result = await chatbotService.saveChatInteraction(
        clientId,
        sanitizedMessage,
        chatResponse.response,
        chatResponse.intent,
        {
          confidence: chatResponse.confidence,
          sources: chatResponse.sources,
          contextItems: context.faqs.length + context.qaPairs.length
        }
      )
      sessionId = result.sessionId
    } catch (dbError) {
      // Log error but don't fail the request
      console.error("[API] Failed to save chat interaction:", dbError)
    }

    // Calculate latency
    const latency = Date.now() - startTime
    success = true

    // Record metrics with sessionId
    await chatbotService.recordMetrics({
      latency,
      success: true,
      intent: chatResponse.intent,
      usedContext: context.faqs.length + context.qaPairs.length > 0,
      contextItems: context.faqs.length + context.qaPairs.length,
      sessionId: sessionId,
      clientId: clientId,
      timestamp: new Date()
    })

    // Return response with security headers
    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        response: chatResponse.response,
        metadata: {
          intent: chatResponse.intent,
          confidence: chatResponse.confidence,
          sources: chatResponse.sources,
          timestamp: new Date().toISOString(),
          latency: `${latency}ms`,
          contextUsed: context.faqs.length + context.qaPairs.length > 0
        }
      })
    )

  } catch (error) {
    const latency = Date.now() - startTime
    
    // Record failed metrics
    try {
      await chatbotService.recordMetrics({
        latency,
        success: false,
        intent,
        usedContext: false,
        contextItems: 0,
        errorMessage: error instanceof Error ? error.message : "Error processing message",
        sessionId: null,
        clientId: null,
        timestamp: new Date()
      })
    } catch (metricsError) {
      // Ignore metrics errors
      console.error("[API] Failed to record metrics:", metricsError)
    }

    console.error("[API] POST /api/chat error:", error)
    
    return addSecurityHeaders(
      NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : "Error processing message",
          latency: `${latency}ms`
        },
        { status: 500 }
      )
    )
  }
}

/**
 * GET /api/chat
 * Get chat statistics (for monitoring/evaluation)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        )
      )
    }

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId') || undefined

    // Get chat statistics
    const stats = await chatbotService.getChatStats(clientId)

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        stats
      })
    )

  } catch (error) {
    console.error("[API] GET /api/chat error:", error)
    return addSecurityHeaders(
      NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : "Error fetching statistics" 
        },
        { status: 500 }
      )
    )
  }
}

