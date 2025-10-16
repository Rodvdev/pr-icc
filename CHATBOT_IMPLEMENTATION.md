# Chatbot Implementation Guide

## Overview
The chatbot system is now fully integrated into both the **Client Portal** and **Admin Dashboard** as a persistent right sidebar. It uses React Context for state management and is ready for Claude AI integration.

---

## Architecture

### 1. Context & State Management
**File:** `src/contexts/chat-context.tsx`

The `ChatProvider` manages all chatbot state:
- Message history
- Open/closed state
- Loading state
- Unread message count

**Key Functions:**
```typescript
- openChat(): Opens the chatbot sidebar
- closeChat(): Closes the chatbot sidebar
- toggleChat(): Toggles chatbot visibility
- sendMessage(content: string): Sends a message and gets AI response
- clearMessages(): Clears conversation history
- markAsRead(): Marks all messages as read
```

### 2. Components

#### ChatSidebarWrapper
**File:** `src/components/chatbot/chat-sidebar-wrapper.tsx`

The main chatbot UI component with:
- Message display area with auto-scroll
- User/bot message bubbles
- Typing indicators
- Quick reply buttons
- Input area with send button
- Minimize/maximize functionality
- Clear conversation button

**Props:**
- `userType?: "client" | "admin"` - Determines context and available features

#### ChatToggleButton
**File:** `src/components/chatbot/chat-toggle-button.tsx`

Floating action button that:
- Opens the chatbot when clicked
- Shows unread message count badge
- Positioned at bottom-right
- Always visible when chat is closed

### 3. API Route

**File:** `src/app/api/chat/route.ts`

**Endpoint:** `POST /api/chat`

**Request Body:**
```json
{
  "message": "string",
  "userType": "client" | "admin",
  "conversationHistory": ChatMessage[]
}
```

**Response:**
```json
{
  "success": true,
  "response": "string",
  "metadata": {
    "intent": "string",
    "confidence": number,
    "tools": string[],
    "timestamp": "ISO date string"
  }
}
```

**Current Status:** Returns mock responses based on keywords
**TODO:** Integrate with Anthropic Claude API

---

## Integration

### Client Portal
**File:** `src/app/client/layout.tsx`

```tsx
<ChatProvider userType="client">
  <div className="flex h-screen">
    {/* Main content */}
    <ClientSidebar />
    <main>{children}</main>
    
    {/* Chatbot */}
    <ChatToggleButton />
    <ChatSidebarWrapper userType="client" />
  </div>
</ChatProvider>
```

### Admin Dashboard
**File:** `src/app/admin/layout.tsx`

```tsx
<RoleGate allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
  <ChatProvider userType="admin">
    <div className="flex h-screen">
      {/* Main content */}
      <AdminSidebar />
      <main>{children}</main>
      
      {/* Chatbot */}
      <ChatToggleButton />
      <ChatSidebarWrapper userType="admin" />
    </div>
  </ChatProvider>
</RoleGate>
```

---

## Features

### Current Features ✅
1. **Persistent State** - Chat history maintained across page navigation
2. **Unread Badges** - Shows count of unread messages
3. **Quick Replies** - Pre-configured common questions
4. **Auto-scroll** - Automatically scrolls to latest message
5. **Loading States** - Typing indicators while waiting for response
6. **Minimize/Maximize** - Compact mode for less screen space
7. **Clear History** - Button to start fresh conversation
8. **Responsive Design** - Works on mobile and desktop
9. **Context-aware** - Different behavior for client vs admin users
10. **Authentication** - Requires valid session

### Planned Features 🚧
1. **Claude AI Integration** - Real AI responses
2. **MCP Tools Integration** - Function calling for data access
3. **File Attachments** - Upload documents in chat
4. **Rich Formatting** - Markdown support, code blocks
5. **Voice Input** - Speech-to-text
6. **Conversation History** - Save past conversations
7. **Suggested Actions** - Context-aware action buttons
8. **Multi-language** - Support for multiple languages

---

## Usage

### For Developers

#### Using the Chat Context
```tsx
import { useChatContext } from "@/contexts/chat-context"

function MyComponent() {
  const { 
    messages, 
    isOpen, 
    isLoading, 
    sendMessage,
    openChat 
  } = useChatContext()

  return (
    <button onClick={() => openChat()}>
      Open Chat ({messages.length} messages)
    </button>
  )
}
```

#### Programmatic Message Sending
```tsx
const { sendMessage } = useChatContext()

// Send a message from code
await sendMessage("Show me my account balance")
```

### For End Users

1. **Opening Chat**
   - Click the floating purple button at bottom-right
   - Click opens the chatbot sidebar

2. **Sending Messages**
   - Type in the input field
   - Press Enter or click Send button
   - Use quick reply buttons for common questions

3. **Managing Chat**
   - Minimize: Click minimize icon to compact view
   - Clear: Click trash icon to clear conversation
   - Close: Click X to close sidebar

---

## Customization

### Quick Replies
Edit in `src/components/chatbot/chat-sidebar-wrapper.tsx`:

```tsx
const quickReplies = [
  "Horarios de atención",
  "Ubicación de sucursales",
  "Tasas de interés",
  "Ayuda técnica"
]
```

### Styling
The chatbot uses Tailwind CSS. Key colors:
- Primary: `indigo-600` (buttons, user messages)
- Background: `white` (sidebar)
- Bot messages: `gray-100`
- User messages: `indigo-600`

### Message Format
Messages follow this interface:

```typescript
interface ChatMessage {
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
```

---

## API Integration (Next Steps)

### 1. Anthropic Claude Integration

Update `src/app/api/chat/route.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(req: NextRequest) {
  // ... auth code ...
  
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: conversationHistory.map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.content
    }))
  })
  
  return NextResponse.json({
    success: true,
    response: response.content[0].text,
    metadata: {
      model: response.model,
      usage: response.usage
    }
  })
}
```

### 2. MCP Tools Integration

The `src/lib/mcp.ts` file already contains MCP tool definitions:
- `search_faq` - Search knowledge base
- `lookup_client` - Get client information
- `list_visits` - Show visit history
- `get_branch_info` - Branch details
- `create_visit` - Create new visit

Connect these to the chatbot API route for function calling.

### 3. Environment Variables

Add to `.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

---

## Testing

### Manual Testing Checklist

**Basic Functionality:**
- [ ] Open chatbot from toggle button
- [ ] Send a message
- [ ] Receive response
- [ ] Quick replies work
- [ ] Clear conversation works
- [ ] Minimize/maximize works
- [ ] Close chatbot works

**State Management:**
- [ ] Chat history persists on page navigation
- [ ] Unread count increments when chat is closed
- [ ] Unread count resets when chat is opened
- [ ] Messages don't duplicate

**Responsive Design:**
- [ ] Works on mobile (< 768px)
- [ ] Works on tablet (768px - 1024px)
- [ ] Works on desktop (> 1024px)
- [ ] Backdrop appears on mobile
- [ ] Sidebar sizes correctly

**Authentication:**
- [ ] Requires valid session
- [ ] Returns 401 when unauthorized
- [ ] Works for both client and admin users

### API Testing

```bash
# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<token>" \
  -d '{
    "message": "Cuáles son los horarios?",
    "userType": "client",
    "conversationHistory": []
  }'
```

---

## Performance Considerations

1. **Message History Limit**
   - Currently sends last 10 messages for context
   - Prevents excessive API token usage
   - Configurable in `chat-context.tsx`

2. **Auto-scroll**
   - Uses `useEffect` to scroll on new messages
   - Efficient with `scrollRef`

3. **State Updates**
   - Uses `useCallback` for memoization
   - Prevents unnecessary re-renders

4. **API Calls**
   - Debouncing not implemented (single send button)
   - Loading state prevents multiple simultaneous requests

---

## Troubleshooting

### Chat doesn't open
- Check if `ChatProvider` wraps the layout
- Verify `ChatToggleButton` is rendered
- Check browser console for errors

### Messages not sending
- Verify `/api/chat` route is accessible
- Check authentication session is valid
- Inspect network tab for API errors

### State not persisting
- Ensure `ChatProvider` is at correct level in component tree
- Check React DevTools for provider presence
- Verify context is not being recreated

### Styling issues
- Check Tailwind CSS is compiling correctly
- Verify z-index values (chat should be z-50)
- Check for CSS conflicts with other components

---

## Security

1. **Authentication Required**
   - All chat API calls require valid session
   - Session validated on server

2. **Input Sanitization**
   - User messages should be sanitized before AI processing
   - Prevent injection attacks

3. **Rate Limiting**
   - TODO: Implement rate limiting on `/api/chat`
   - Prevent abuse and excessive API costs

4. **Data Privacy**
   - Chat history stored in memory (not persisted)
   - Consider encryption for sensitive conversations
   - Comply with data protection regulations

---

## Roadmap

### Phase 5.1 - Current ✅
- [x] Chat UI component
- [x] Context for state management
- [x] Integration with layouts
- [x] Mock API responses
- [x] Quick replies

### Phase 5.2 - Next
- [ ] Anthropic Claude integration
- [ ] MCP tools connection
- [ ] Function calling support
- [ ] Conversation persistence
- [ ] Admin chat analytics

### Phase 5.3 - Future
- [ ] Voice input/output
- [ ] File attachments
- [ ] Rich media support
- [ ] Conversation export
- [ ] Multi-language support

---

## Support

For questions or issues with the chatbot system:
1. Check this documentation
2. Review implementation in codebase
3. Test with mock responses first
4. Verify Anthropic API integration

---

Last Updated: October 16, 2024
Version: 1.0.0

