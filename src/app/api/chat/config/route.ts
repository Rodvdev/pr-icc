import { NextResponse } from "next/server"
import { isOpenAIConfigured } from "@/lib/openai"
import { addSecurityHeaders } from "@/lib/security"

/**
 * GET /api/chat/config
 * Get chat configuration status (for UI display)
 */
export async function GET() {
  try {
    const isConfigured = isOpenAIConfigured()

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        isConfigured,
        message: isConfigured
          ? "OpenAI está configurado y funcionando"
          : "OpenAI no está configurado. El sistema usará respuestas preconfiguradas.",
      })
    )
  } catch (error) {
    console.error("[API] GET /api/chat/config error:", error)
    return addSecurityHeaders(
      NextResponse.json(
        {
          success: false,
          isConfigured: false,
          error: error instanceof Error ? error.message : "Error al verificar configuración",
        },
        { status: 500 }
      )
    )
  }
}

