"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Bot, User as UserIcon, Sparkles } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  actor: 'CLIENT' | 'BOT'
  content: string
  timestamp: Date
}

/**
 * Interfaz de chat para kiosco
 * - Chat con asistente virtual sin necesidad de autenticación
 * - Respuestas rápidas (quick replies)
 * - Integración con MCP tools
 */
export default function KioskChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      actor: 'BOT',
      content: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `kiosk-${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickReplies = [
    { text: "¿Cómo retirar dinero?", intent: "withdrawal" },
    { text: "¿Cuáles son los horarios?", intent: "hours" },
    { text: "¿Cómo abrir una cuenta?", intent: "open_account" },
    { text: "¿Cuánto cuesta el mantenimiento?", intent: "fees" }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      actor: 'CLIENT',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Llamar a la API de chat
      const response = await fetch('/api/kiosk/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text,
          clientId: null // Usuario no autenticado
        })
      })

      const data = await response.json()

      if (response.ok) {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          actor: 'BOT',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error(data.message || 'Error al procesar el mensaje')
      }
    } catch {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        actor: 'BOT',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleQuickReply = (text: string) => {
    sendMessage(text)
  }

  return (
    <div className="container mx-auto px-6 max-w-4xl h-[calc(100vh-12rem)]">
      <div className="flex flex-col h-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/kiosk">
            <Button variant="ghost" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Asistente Virtual</h2>
              <p className="text-xs text-green-600 flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-1.5"></span>
                En línea
              </p>
            </div>
          </div>
          <div className="w-32" /> {/* Spacer */}
        </div>

        {/* Chat container */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.actor === 'CLIENT' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.actor === 'BOT'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : 'bg-blue-600'
                  }`}
                >
                  {message.actor === 'BOT' ? (
                    <Bot className="w-6 h-6 text-white" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-white" />
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`flex-1 max-w-xl ${
                    message.actor === 'CLIENT' ? 'text-right' : ''
                  }`}
                >
                  <div
                    className={`inline-block px-4 py-3 rounded-2xl ${
                      message.actor === 'BOT'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 px-2">
                    {message.timestamp.toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {messages.length === 1 && !isLoading && (
            <div className="px-6 pb-4">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <p className="text-sm font-medium text-gray-700">Preguntas frecuentes:</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickReplies.map((reply, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReply(reply.text)}
                    className="h-auto py-2 text-left justify-start whitespace-normal"
                  >
                    {reply.text}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Escribe tu pregunta..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-1 h-12 text-base"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                size="lg"
                className="h-12 px-6"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2 text-center">
              El asistente virtual puede cometer errores. Verifica información importante.
            </p>
          </div>
        </Card>

        {/* Info banner */}
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-gray-900">
              ¿Necesitas hablar con un agente humano?
            </p>
            <p className="text-xs text-gray-600">
              Escribe &quot;hablar con agente&quot; o visita el mostrador de atención
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

