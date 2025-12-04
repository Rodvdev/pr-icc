"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Paperclip,
  Smile,
  Loader2,
  Trash2,
  MessageSquare,
  Plus,
  MoreVertical,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useChatContext } from "@/contexts/chat-context"
import { ChatConfigStatus } from "@/components/chat/chat-config-status"

const quickReplies = [
  "Horarios de atención",
  "Ubicación de sucursales", 
  "Tasas de interés",
  "Ayuda técnica",
  "Estado de mi cuenta",
  "Problemas con la app"
]

export default function ChatPage() {
  const router = useRouter()
  const {
    messages,
    conversations,
    currentConversationId,
    isLoading,
    sendMessage,
    clearMessages,
    markAsRead,
    createNewConversation,
    switchConversation,
    deleteConversation
  } = useChatContext()

  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Mark messages as read when page loads
  useEffect(() => {
    markAsRead()
  }, [markAsRead])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    await sendMessage(inputValue)
    setInputValue("")
  }

  const handleQuickReply = (reply: string) => {
    setInputValue(reply)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                  <AvatarFallback className="bg-indigo-600 text-white">
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                    Asistente Virtual
                  </h1>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs sm:text-sm text-gray-600">En línea</span>
                    <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                      AI
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={clearMessages}
                className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Limpiar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Chat rápido</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Chat History Sidebar */}
          <div className="lg:col-span-3 order-1">
            <Card className="h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Conversaciones</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createNewConversation}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full px-3">
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={cn(
                          "group relative p-3 rounded-lg cursor-pointer transition-colors",
                          conversation.id === currentConversationId
                            ? "bg-indigo-50 border border-indigo-200"
                            : "hover:bg-gray-50 border border-transparent"
                        )}
                        onClick={() => switchConversation(conversation.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {conversation.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {conversation.messages.length > 1 
                                ? conversation.messages[conversation.messages.length - 1].content
                                : "Nueva conversación"
                              }
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {new Date(conversation.updatedAt).toLocaleDateString("es-PE", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                          </div>
                          {conversations.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteConversation(conversation.id)
                              }}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-6 order-2">
            <Card className="h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] flex flex-col">
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full p-3 sm:p-6" ref={scrollRef}>
                  <div className="space-y-4 sm:space-y-6">
                    {/* Configuration Status Alert */}
                    <ChatConfigStatus />
                    
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                          message.sender === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.sender === "bot" && (
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                            <AvatarFallback className="bg-indigo-100">
                              <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={cn(
                            "max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm",
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
                              "text-xs mt-1 sm:mt-2",
                              message.sender === "user"
                                ? "text-indigo-200"
                                : "text-gray-500"
                            )}
                          >
                            {message.timestamp}
                          </p>
                          
                          {/* Metadata (for debugging/admin) */}
                          {message.metadata && (
                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 text-xs text-gray-500">
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
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                            <AvatarFallback className="bg-gray-200">
                              <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                      <div className="flex gap-2 sm:gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                          <AvatarFallback className="bg-indigo-100">
                            <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 sm:px-4 sm:py-3">
                          <div className="flex gap-1">
                            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-gray-400 rounded-full animate-bounce" />
                            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-3 sm:p-6 bg-white">
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-gray-500 hover:text-gray-700 h-8 w-8 sm:h-10 sm:w-10"
                    disabled={isLoading}
                  >
                    <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-gray-500 hover:text-gray-700 h-8 w-8 sm:h-10 sm:w-10"
                    disabled={isLoading}
                  >
                    <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Input
                    placeholder="Escribe tu mensaje..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 text-sm sm:text-base"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-700 h-8 w-8 sm:h-10 sm:w-10"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 order-3">
            <div className="space-y-4 sm:space-y-6">
              {/* Quick Replies */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Respuestas rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickReplies.map((reply) => (
                    <Button
                      key={reply}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickReply(reply)}
                      className="w-full justify-start text-left h-auto py-2 px-3 text-xs sm:text-sm"
                      disabled={isLoading}
                    >
                      {reply}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Help */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">¿Necesitas ayuda?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Si necesitas hablar con un agente humano, escribe:
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                    <code className="text-xs sm:text-sm text-blue-800">
                      &quot;hablar con agente&quot;
                    </code>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    O visita el mostrador de atención en tu sucursal más cercana.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
