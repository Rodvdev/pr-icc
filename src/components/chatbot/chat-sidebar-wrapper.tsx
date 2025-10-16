"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  X,
  Send,
  Bot,
  User,
  Paperclip,
  Smile,
  Minimize2,
  Maximize2,
  Loader2,
  Trash2,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useChatContext } from "@/contexts/chat-context"

interface ChatSidebarWrapperProps {
  userType?: "client" | "admin"
}

const quickReplies = [
  "Horarios de atención",
  "Ubicación de sucursales",
  "Tasas de interés",
  "Ayuda técnica"
]

export function ChatSidebarWrapper({ userType = "client" }: ChatSidebarWrapperProps) {
  const router = useRouter()
  const {
    messages,
    isOpen,
    isLoading,
    closeChat,
    sendMessage,
    clearMessages,
    markAsRead
  } = useChatContext()

  const [inputValue, setInputValue] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
      markAsRead()
    }
  }, [isOpen, isMinimized, markAsRead])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    await sendMessage(inputValue)
    setInputValue("")
  }

  const handleQuickReply = (reply: string) => {
    setInputValue(reply)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
        onClick={closeChat}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-screen bg-white border-l border-gray-200 shadow-2xl z-50 transition-all duration-300 ease-in-out flex flex-col",
          isMinimized ? "w-72 sm:w-80" : "w-full sm:w-[400px] lg:w-[440px]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-indigo-700">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-white text-indigo-600">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-white text-sm">
                Asistente Virtual
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-indigo-100">En línea</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
              AI
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/chat")}
              className="text-white hover:bg-white/20 h-8 w-8"
              title="Abrir chat completo"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="text-white hover:bg-white/20 h-8 w-8"
              title="Limpiar conversación"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeChat}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  message.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.sender === "bot" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-indigo-100">
                      <Bot className="h-4 w-4 text-indigo-600" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                    message.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-1",
                      message.sender === "user"
                        ? "text-indigo-200"
                        : "text-gray-500"
                    )}
                  >
                    {message.timestamp}
                  </p>
                  
                  {/* Metadata (for debugging/admin) */}
                  {message.metadata && userType === "admin" && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                      {message.metadata.intent && (
                        <p>Intent: {message.metadata.intent}</p>
                      )}
                      {message.metadata.confidence && (
                        <p>Confidence: {(message.metadata.confidence * 100).toFixed(1)}%</p>
                      )}
                    </div>
                  )}
                </div>

                {message.sender === "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gray-200">
                      <User className="h-4 w-4 text-gray-600" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-indigo-100">
                    <Bot className="h-4 w-4 text-indigo-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Replies */}
        {!isMinimized && (
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-600 mb-2">Respuestas rápidas:</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <Button
                  key={reply}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReply(reply)}
                  className="text-xs h-7 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                  disabled={isLoading}
                >
                  {reply}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-gray-500 hover:text-gray-700"
              disabled={isLoading}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-gray-500 hover:text-gray-700"
              disabled={isLoading}
            >
              <Smile className="h-5 w-5" />
            </Button>
            <Input
              ref={inputRef}
              placeholder="Escribe tu mensaje..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

