import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./ChatMessage";

interface Message {
  id: string;
  content: string;
  actor: "CLIENT" | "BOT";
  timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    content: "¡Hola! Soy tu asistente virtual del Banco Digital. ¿En qué puedo ayudarte hoy?",
    actor: "BOT",
    timestamp: new Date(),
  },
];

const QUICK_ACTIONS = [
  "¿Cuál es mi saldo?",
  "Agendar una cita",
  "Ver movimientos",
  "Hablar con un agente",
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      actor: "CLIENT",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponses: Record<string, string> = {
        "¿cuál es mi saldo?": "Tu saldo disponible es de S/ 15,432.50. ¿Deseas ver el detalle de tus cuentas?",
        "agendar una cita": "Claro, puedo ayudarte a agendar una cita. ¿Qué tipo de servicio necesitas? Tenemos disponibilidad para: Apertura de cuenta, Asesoría de inversiones, o Servicios generales.",
        "ver movimientos": "Aquí tienes tus últimos movimientos:\n• -S/ 50.00 - Pago QR (Hace 2 horas)\n• +S/ 2,500.00 - Transferencia recibida (Ayer)\n• -S/ 125.30 - Compra (Hace 2 días)",
        "hablar con un agente": "Te conecto con un agente humano. El tiempo de espera estimado es de 3 minutos. ¿Deseas continuar?",
      };

      const response = botResponses[content.toLowerCase()] || 
        "Entiendo tu consulta. Permíteme verificar esa información. ¿Podrías darme más detalles sobre lo que necesitas?";

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        actor: "BOT",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

      {/* Quick actions */}
      <div className="px-4 py-2 border-t border-border">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => handleSendMessage(action)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-full hover:bg-accent/80 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="submit" variant="bank" size="icon" className="w-12 h-12 rounded-xl">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
