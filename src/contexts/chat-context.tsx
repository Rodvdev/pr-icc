"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

export interface ChatMessage {
  id: string
  sender: "user" | "bot"
  content: string
  timestamp: string
  metadata?: {
    intent?: string
    confidence?: number
    tools?: string[]
  }
}

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  isActive: boolean
}

interface ChatContextType {
  messages: ChatMessage[]
  conversations: ChatConversation[]
  currentConversationId: string | null
  isOpen: boolean
  isLoading: boolean
  unreadCount: number
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  markAsRead: () => void
  createNewConversation: () => void
  switchConversation: (conversationId: string) => void
  deleteConversation: (conversationId: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider")
  }
  return context
}

interface ChatProviderProps {
  children: ReactNode
  userType?: "client" | "admin"
}

export function ChatProvider({ children, userType = "client" }: ChatProviderProps) {
  const createWelcomeMessage = useCallback(() => ({
    id: "welcome",
    sender: "bot" as const,
    content: `¡Hola! Soy tu asistente virtual${userType === "admin" ? " de administración" : ""}. ¿En qué puedo ayudarte hoy?`,
    timestamp: new Date().toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit"
    })
  }), [userType])

  const [conversations, setConversations] = useState<ChatConversation[]>([
    {
      id: "default",
      title: "Nueva conversación",
      messages: [createWelcomeMessage()],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    }
  ])
  
  const [currentConversationId, setCurrentConversationId] = useState<string>("default")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Get current messages from active conversation
  const messages = conversations.find(c => c.id === currentConversationId)?.messages || []

  const openChat = useCallback(() => {
    setIsOpen(true)
    setUnreadCount(0)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev)
    if (!isOpen) {
      setUnreadCount(0)
    }
  }, [isOpen])

  const createNewConversation = useCallback(() => {
    const newId = `conv-${Date.now()}`
    const newConversation: ChatConversation = {
      id: newId,
      title: "Nueva conversación",
      messages: [createWelcomeMessage()],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: false
    }
    
    setConversations(prev => 
      prev.map(c => ({ ...c, isActive: false })).concat(newConversation)
    )
    setCurrentConversationId(newId)
  }, [createWelcomeMessage])

  const switchConversation = useCallback((conversationId: string) => {
    setConversations(prev => 
      prev.map(c => ({ ...c, isActive: c.id === conversationId }))
    )
    setCurrentConversationId(conversationId)
  }, [])

  const deleteConversation = useCallback((conversationId: string) => {
    if (conversations.length <= 1) return // Don't delete the last conversation
    
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== conversationId)
      // If we deleted the current conversation, switch to the first remaining one
      if (conversationId === currentConversationId && filtered.length > 0) {
        setCurrentConversationId(filtered[0].id)
        filtered[0].isActive = true
      }
      return filtered
    })
  }, [conversations.length, currentConversationId])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      content,
      timestamp: new Date().toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit"
      })
    }

    // Update conversation with user message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === currentConversationId 
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              updatedAt: new Date().toISOString(),
              title: conv.title === "Nueva conversación" ? content.slice(0, 30) + (content.length > 30 ? "..." : "") : conv.title
            }
          : conv
      )
    )
    
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: content,
          userType,
          conversationHistory: messages.slice(-10)
        })
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        content: data.response || "Lo siento, ocurrió un error. Por favor intenta de nuevo.",
        timestamp: new Date().toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit"
        }),
        metadata: data.metadata
      }

      // Update conversation with bot message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversationId 
            ? {
                ...conv,
                messages: [...conv.messages, botMessage],
                updatedAt: new Date().toISOString()
              }
            : conv
        )
      )

      // Increment unread count if chat is closed
      if (!isOpen) {
        setUnreadCount(prev => prev + 1)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        content: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.",
        timestamp: new Date().toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit"
        })
      }

      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversationId 
            ? {
                ...conv,
                messages: [...conv.messages, errorMessage],
                updatedAt: new Date().toISOString()
              }
            : conv
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, messages, userType, isOpen, currentConversationId])

  const clearMessages = useCallback(() => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === currentConversationId 
          ? {
              ...conv,
              messages: [createWelcomeMessage()],
              title: "Nueva conversación",
              updatedAt: new Date().toISOString()
            }
          : conv
      )
    )
  }, [currentConversationId, createWelcomeMessage])

  const markAsRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  const value: ChatContextType = {
    messages,
    conversations,
    currentConversationId,
    isOpen,
    isLoading,
    unreadCount,
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
    clearMessages,
    markAsRead,
    createNewConversation,
    switchConversation,
    deleteConversation
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

