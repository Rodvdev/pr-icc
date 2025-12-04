"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, ExternalLink, Key, Info } from "lucide-react"
import Link from "next/link"

interface OpenAIConfigAlertProps {
  isConfigured: boolean
  showDetails?: boolean
}

export function OpenAIConfigAlert({ isConfigured, showDetails = false }: OpenAIConfigAlertProps) {
  if (isConfigured) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">OpenAI Configurado</AlertTitle>
        <AlertDescription className="text-green-800">
          El módulo de IA está activo y funcionando correctamente. El chat utilizará GPT-3.5-turbo para generar respuestas inteligentes.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive" className="border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900">OpenAI No Configurado</AlertTitle>
      <AlertDescription className="space-y-3 text-orange-800">
        <p>
          El módulo de IA requiere una API key de OpenAI para funcionar completamente. 
          Actualmente el sistema está usando respuestas preconfiguradas y FAQs como fallback.
        </p>
        
        {showDetails && (
          <div className="space-y-2 mt-3">
            <div className="flex items-start gap-2">
              <Key className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">Pasos para configurar:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Obtén una API key en <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">platform.openai.com/api-keys</a></li>
                  <li>Agrega la key al archivo <code className="bg-orange-100 px-1 rounded">.env.local</code>:</li>
                </ol>
                <pre className="mt-2 p-2 bg-orange-100 rounded text-xs font-mono overflow-x-auto">
                  OPENAI_API_KEY=sk-...
                </pre>
                <li className="list-none ml-2 mt-2">Reinicia el servidor de desarrollo</li>
              </div>
            </div>
            
            <div className="flex items-start gap-2 mt-3">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">Nota:</p>
                <p>
                  El sistema funcionará sin OpenAI usando FAQs y respuestas preconfiguradas, 
                  pero las respuestas serán más limitadas. Para una experiencia completa con IA, 
                  se recomienda configurar OpenAI.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 mt-4">
          <Button asChild variant="outline" size="sm">
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Obtener API Key
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/settings">
              Ir a Configuración
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

