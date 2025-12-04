"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ChatInterface } from "@/components/kiosk/ChatInterface"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Chat content component that uses useSearchParams
 */
function KioskChatContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams?.get('clientId') ?? null
  const [sessionId] = useState(() => `kiosk-${Date.now()}`)

  const quickActions = [
    "¿Cuáles son los horarios de atención?",
    "¿A qué hora abren?",
    "¿Hasta qué hora atienden?",
    "¿Atienden los sábados?"
  ]

  return (
    <>
      {/* Chat interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          sessionId={sessionId}
          clientId={clientId}
          quickActions={quickActions}
        />
      </div>
    </>
  )
}

/**
 * Interfaz de chat para kiosco
 * - Chat con asistente virtual sin necesidad de autenticación
 * - Respuestas rápidas (quick replies)
 * - Integración con MCP tools
 */
export default function KioskChatPage() {
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <Link href="/kiosk">
          <Button variant="ghost" size="lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      {/* Chat interface with Suspense */}
      <Suspense fallback={
        <div className="flex-1 overflow-hidden p-4">
          <Skeleton className="h-full w-full" />
        </div>
      }>
        <KioskChatContent />
      </Suspense>
    </main>
  )
}

