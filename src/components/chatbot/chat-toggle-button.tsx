"use client"

import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useChatContext } from "@/contexts/chat-context"

export function ChatToggleButton() {
  const { openChat, unreadCount } = useChatContext()

  return (
    <Button
      onClick={openChat}
      size="lg"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-indigo-600 hover:bg-indigo-700 z-30 transition-all hover:scale-110"
    >
      <MessageSquare className="h-6 w-6" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      )}
    </Button>
  )
}

