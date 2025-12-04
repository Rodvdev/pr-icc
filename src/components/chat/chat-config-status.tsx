"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { useState, useEffect } from "react"

export function ChatConfigStatus() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    // Check OpenAI configuration status
    fetch('/api/chat/config')
      .then(res => res.json())
      .then(data => {
        setIsConfigured(data.isConfigured ?? false)
      })
      .catch(() => {
        setIsConfigured(false)
      })
  }, [])

  if (isConfigured === null) {
    return null // Don't show anything while loading
  }

  if (isConfigured) {
    return null // Don't show anything if configured
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 mb-4">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800 text-sm">
        <strong>Nota:</strong> El asistente está funcionando con respuestas preconfiguradas. 
        Para una experiencia más completa con IA, contacta al administrador del sistema.
      </AlertDescription>
    </Alert>
  )
}

