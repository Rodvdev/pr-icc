"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatMessage } from "./ChatMessage"

interface Message {
  id: string
  content: string
  actor: "CLIENT" | "BOT"
  timestamp: Date
}

interface ChatInterfaceProps {
  initialMessages?: Message[]
  onSendMessage?: (message: string) => Promise<string>
  quickActions?: string[]
  sessionId?: string
  clientId?: string | null
}

const DEFAULT_QUICK_ACTIONS = [
  "¿Cuál es mi saldo?",
  "Agendar una cita",
  "Ver movimientos",
  "Hablar con un agente",
]

export function ChatInterface({ 
  initialMessages,
  onSendMessage,
  quickActions = DEFAULT_QUICK_ACTIONS,
  sessionId,
  clientId
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages || [
      {
        id: "1",
        content: "¡Hola! Soy tu asistente virtual del Banco Digital. ¿En qué puedo ayudarte hoy?",
        actor: "BOT",
        timestamp: new Date(),
      },
    ]
  )
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      actor: "CLIENT",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      let response: string

      if (onSendMessage) {
        // Use custom handler if provided
        response = await onSendMessage(content)
      } else {
        // Default API call
        const apiResponse = await fetch('/api/kiosk/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId || `kiosk-${Date.now()}`,
            message: content,
            clientId: clientId || null
          })
        })

        const data = await apiResponse.json()
        
        if (apiResponse.ok) {
          response = data.response
        } else {
          throw new Error(data.message || 'Error al procesar el mensaje')
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        actor: "BOT",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        actor: "BOT",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage(inputValue)
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            content={message.content}
            actor={message.actor}
            timestamp={message.timestamp}
          />
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-sm text-muted-foreground">Escribiendo...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form - Fixed at bottom */}
      <div className="sticky bottom-0 bg-card border-t border-border z-10">
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-3 items-end">
            {/* Quick actions - Vertical column on the left */}
            {quickActions.length > 0 && (
              <div className="flex flex-col gap-1.5 flex-shrink-0 max-h-24 overflow-y-auto">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => handleSendMessage(action)}
                    className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-full hover:bg-accent/80 transition-colors whitespace-nowrap text-left max-w-[150px] truncate"
                    title={action}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            
            {/* Input and send button */}
            <div className="flex gap-2 items-center flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button 
                type="submit" 
                variant="bank" 
                size="icon" 
                className="w-12 h-12 rounded-xl flex-shrink-0"
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

