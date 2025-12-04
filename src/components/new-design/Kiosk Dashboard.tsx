import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskHeader } from "@/components/kiosk/KioskHeader";
import { KioskFooter } from "@/components/kiosk/KioskFooter";
import { ChatInterface } from "@/components/kiosk/ChatInterface";
import { Button } from "@/components/ui/button";
import { 
  User, 
  LogOut, 
  CalendarDays, 
  CreditCard, 
  Wallet, 
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  MessageSquare
} from "lucide-react";

const QUICK_SERVICES = [
  { icon: Wallet, label: "Ver Saldo", color: "bg-emerald-500" },
  { icon: ArrowRightLeft, label: "Transferir", color: "bg-blue-500" },
  { icon: CreditCard, label: "Pagar", color: "bg-purple-500" },
  { icon: CalendarDays, label: "Agendar Cita", color: "bg-orange-500" },
];

const RECENT_VISITS = [
  { id: 1, purpose: "Consulta de cuenta", date: "28 Nov 2025", status: "COMPLETED" },
  { id: 2, purpose: "Apertura de cuenta", date: "15 Nov 2025", status: "COMPLETED" },
];

export default function KioskDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"chat" | "services">("chat");

  const handleLogout = () => {
    navigate("/kiosk");
  };

  return (
    <div className="min-h-screen bank-gradient flex flex-col">
      <KioskHeader />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Left sidebar - User info */}
        <aside className="w-80 bg-card border-r border-border flex flex-col">
          {/* User profile */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg text-foreground">Carlos Izaguirre</h2>
                <p className="text-sm text-muted-foreground">DNI: ****4521</p>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-bank-success" />
                  <span className="text-xs text-bank-success font-medium">Verificado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick services */}
          <div className="p-6 border-b border-border">
            <h3 className="font-display font-semibold text-sm text-foreground mb-4">Servicios Rápidos</h3>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_SERVICES.map((service) => (
                <button
                  key={service.label}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full ${service.color} flex items-center justify-center`}>
                    <service.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{service.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent visits */}
          <div className="p-6 flex-1">
            <h3 className="font-display font-semibold text-sm text-foreground mb-4">Visitas Recientes</h3>
            <div className="space-y-3">
              {RECENT_VISITS.map((visit) => (
                <div key={visit.id} className="p-3 rounded-xl bg-muted">
                  <p className="text-sm font-medium text-foreground">{visit.purpose}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{visit.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logout */}
          <div className="p-6 border-t border-border">
            <Button 
              variant="bank-outline" 
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </aside>

        {/* Main content - Chat */}
        <section className="flex-1 flex flex-col bg-background">
          {/* Tab header */}
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-card">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "chat" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Asistente Virtual
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "services" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Mis Servicios
            </button>
          </div>

          {/* Chat interface */}
          {activeTab === "chat" && (
            <div className="flex-1 overflow-hidden">
              <ChatInterface />
            </div>
          )}

          {/* Services view */}
          {activeTab === "services" && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">Mis Servicios</h2>
                <div className="grid gap-4">
                  <div className="bank-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">Cuenta de Ahorros</h3>
                      <span className="text-xs px-2 py-1 bg-bank-success/10 text-bank-success rounded-full">Activa</span>
                    </div>
                    <p className="text-3xl font-display font-bold text-foreground">S/ 15,432.50</p>
                    <p className="text-sm text-muted-foreground mt-1">N° ****-****-****-4521</p>
                  </div>
                  <div className="bank-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">Próxima Cita</h3>
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Programada</span>
                    </div>
                    <p className="font-medium text-foreground">Asesoría de Inversiones</p>
                    <p className="text-sm text-muted-foreground mt-1">Viernes, 6 de Diciembre - 10:00 AM</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <KioskFooter />
    </div>
  );
}
