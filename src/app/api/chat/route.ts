import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * POST /api/chat
 * Handle chat messages and return AI responses
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      )
    }

    // TODO: Integrate with Anthropic Claude API
    // For now, return a mock response
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock response based on message content
    let response = "Gracias por tu mensaje. Estoy aquí para ayudarte."
    
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes("horario")) {
      response = "Nuestros horarios de atención son de lunes a viernes de 9:00 AM a 6:00 PM, y sábados de 9:00 AM a 1:00 PM."
    } else if (lowerMessage.includes("sucursal") || lowerMessage.includes("ubicación")) {
      response = "Contamos con sucursales en San Isidro, Miraflores, Surco y San Borja. ¿En cuál de ellas te gustaría obtener más información?"
    } else if (lowerMessage.includes("tasa") || lowerMessage.includes("interés")) {
      response = "Nuestras tasas de interés varían según el tipo de producto. Para ahorro, ofrecemos tasas desde 2.5% anual. Para créditos, las tasas comienzan desde 8% anual. ¿Te gustaría conocer más detalles?"
    } else if (lowerMessage.includes("ayuda") || lowerMessage.includes("soporte")) {
      response = "Estoy aquí para ayudarte. Puedo asistirte con información sobre sucursales, horarios, productos financieros, y consultas generales. ¿Qué necesitas saber?"
    }

    return NextResponse.json({
      success: true,
      response,
      metadata: {
        intent: detectIntent(message),
        confidence: 0.85,
        tools: [],
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("[API] POST /api/chat error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error processing message" 
      },
      { status: 500 }
    )
  }
}

function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes("horario")) return "query_hours"
  if (lowerMessage.includes("sucursal") || lowerMessage.includes("ubicación")) return "query_location"
  if (lowerMessage.includes("tasa") || lowerMessage.includes("interés")) return "query_rates"
  if (lowerMessage.includes("ayuda") || lowerMessage.includes("soporte")) return "request_help"
  if (lowerMessage.includes("cuenta")) return "query_account"
  if (lowerMessage.includes("crédito") || lowerMessage.includes("préstamo")) return "query_credit"
  
  return "general_query"
}

