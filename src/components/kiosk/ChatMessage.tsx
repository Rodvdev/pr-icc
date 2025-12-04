"use client"

import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"

interface ChatMessageProps {
  content: string
  actor: "CLIENT" | "BOT"
  timestamp?: Date
}

export function ChatMessage({ content, actor, timestamp }: ChatMessageProps) {
  const isBot = actor === "BOT"

  return (
    <div className={cn(
      "flex gap-3 animate-fade-in",
      isBot ? "flex-row" : "flex-row-reverse"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isBot ? "bg-primary" : "bg-muted"
      )}>
        {isBot ? (
          <Bot className="w-4 h-4 text-primary-foreground" />
        ) : (
          <User className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3",
        isBot 
          ? "bg-card border border-border rounded-tl-sm" 
          : "bg-primary text-primary-foreground rounded-tr-sm"
      )}>
        <p className="text-sm">{content}</p>
        {timestamp && (
          <p className={cn(
            "text-xs mt-1",
            isBot ? "text-muted-foreground" : "text-primary-foreground/70"
          )}>
            {timestamp.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}

