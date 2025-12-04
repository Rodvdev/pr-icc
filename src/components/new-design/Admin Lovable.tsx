import { useState } from "react";
import { 
  Users, 
  MessageSquare, 
  Camera, 
  BarChart3, 
  Settings, 
  Search,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  Building2,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "dashboard" | "clients" | "faqs" | "cameras" | "settings";

const MOCK_CLIENTS = [
  { id: 1, name: "Carlos Izaguirre", dni: "12345678", email: "carlos@email.com", status: "ACTIVE", registrationStatus: "APPROVED" },
  { id: 2, name: "María García", dni: "87654321", email: "maria@email.com", status: "ACTIVE", registrationStatus: "APPROVED" },
  { id: 3, name: "Juan Pérez", dni: "11223344", email: "juan@email.com", status: "BLOCKED", registrationStatus: "REJECTED" },
  { id: 4, name: "Ana Torres", dni: "44332211", email: "ana@email.com", status: "ACTIVE", registrationStatus: "PENDING" },
];

const MOCK_FAQS = [
  { id: 1, title: "¿Cómo puedo consultar mi saldo?", status: "PUBLISHED", tags: ["saldo", "consulta"] },
  { id: 2, title: "¿Cuáles son los horarios de atención?", status: "PUBLISHED", tags: ["horarios", "general"] },
  { id: 3, title: "¿Cómo agendar una cita?", status: "DRAFT", tags: ["citas", "agendar"] },
];

const STATS = [
  { label: "Clientes Activos", value: "1,234", change: "+12%", icon: Users },
  { label: "Consultas Hoy", value: "89", change: "+5%", icon: MessageSquare },
  { label: "Cámaras Online", value: "8/10", change: "", icon: Camera },
  { label: "Tasa de Éxito", value: "94%", change: "+2%", icon: BarChart3 },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: BarChart3 },
    { id: "clients" as Tab, label: "Clientes", icon: Users },
    { id: "faqs" as Tab, label: "FAQs", icon: MessageSquare },
    { id: "cameras" as Tab, label: "Cámaras", icon: Camera },
    { id: "settings" as Tab, label: "Configuración", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-foreground">Banco Digital</h1>
              <p className="text-xs text-muted-foreground">Panel Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">JF</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Jaime Farfán</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {navItems.find(item => item.id === activeTab)?.label}
            </h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "clients" && <ClientsView />}
          {activeTab === "faqs" && <FAQsView />}
          {activeTab === "cameras" && <CamerasView />}
          {activeTab === "settings" && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-6">
        {STATS.map((stat) => (
          <div key={stat.label} className="bank-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              {stat.change && (
                <span className="text-xs font-medium text-bank-success bg-bank-success/10 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bank-card p-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-4">Registros Pendientes</h3>
          <div className="space-y-3">
            {MOCK_CLIENTS.filter(c => c.registrationStatus === "PENDING").map((client) => (
              <div key={client.id} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                <div>
                  <p className="font-medium text-foreground">{client.name}</p>
                  <p className="text-sm text-muted-foreground">DNI: {client.dni}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="bank">
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bank-card p-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
              <div className="w-2 h-2 rounded-full bg-bank-success" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Carlos Izaguirre verificado</p>
                <p className="text-xs text-muted-foreground">Hace 5 minutos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Nueva FAQ publicada</p>
                <p className="text-xs text-muted-foreground">Hace 15 minutos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
              <div className="w-2 h-2 rounded-full bg-bank-warning" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Cámara 3 desconectada</p>
                <p className="text-xs text-muted-foreground">Hace 30 minutos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientsView() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">Gestiona los clientes registrados en el sistema</p>
        <Button variant="bank">
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="bank-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Cliente</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">DNI</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Email</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Estado</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Registro</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MOCK_CLIENTS.map((client) => (
              <tr key={client.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground">{client.name}</p>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{client.dni}</td>
                <td className="px-6 py-4 text-muted-foreground">{client.email}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    client.status === "ACTIVE" 
                      ? "bg-bank-success/10 text-bank-success" 
                      : "bg-destructive/10 text-destructive"
                  )}>
                    {client.status === "ACTIVE" ? "Activo" : "Bloqueado"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    client.registrationStatus === "APPROVED" && "bg-bank-success/10 text-bank-success",
                    client.registrationStatus === "PENDING" && "bg-bank-warning/10 text-bank-warning",
                    client.registrationStatus === "REJECTED" && "bg-destructive/10 text-destructive"
                  )}>
                    {client.registrationStatus === "APPROVED" && "Aprobado"}
                    {client.registrationStatus === "PENDING" && "Pendiente"}
                    {client.registrationStatus === "REJECTED" && "Rechazado"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FAQsView() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">Configura las preguntas frecuentes del chatbot</p>
        <Button variant="bank">
          <Plus className="w-4 h-4" />
          Nueva FAQ
        </Button>
      </div>

      <div className="grid gap-4">
        {MOCK_FAQS.map((faq) => (
          <div key={faq.id} className="bank-card p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">{faq.title}</h3>
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    faq.status === "PUBLISHED" 
                      ? "bg-bank-success/10 text-bank-success" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {faq.status === "PUBLISHED" ? "Publicado" : "Borrador"}
                  </span>
                </div>
                <div className="flex gap-2">
                  {faq.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CamerasView() {
  const cameras = [
    { id: 1, name: "Cámara Principal", module: "Módulo A", status: "ONLINE" },
    { id: 2, name: "Cámara Entrada", module: "Módulo A", status: "ONLINE" },
    { id: 3, name: "Cámara Lateral", module: "Módulo B", status: "OFFLINE" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">Estado de las cámaras ESP32-CAM</p>
        <Button variant="bank">
          <Plus className="w-4 h-4" />
          Agregar Cámara
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {cameras.map((camera) => (
          <div key={camera.id} className="bank-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "w-3 h-3 rounded-full",
                camera.status === "ONLINE" ? "bg-bank-success animate-pulse" : "bg-destructive"
              )} />
              <Button size="sm" variant="ghost">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
            <div className="aspect-video rounded-xl bg-bank-camera mb-4 flex items-center justify-center">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">{camera.name}</h3>
            <p className="text-sm text-muted-foreground">{camera.module}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                camera.status === "ONLINE" 
                  ? "bg-bank-success/10 text-bank-success" 
                  : "bg-destructive/10 text-destructive"
              )}>
                {camera.status === "ONLINE" ? "En línea" : "Desconectada"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="animate-fade-in max-w-2xl">
      <p className="text-muted-foreground mb-6">Configuración general del sistema</p>

      <div className="space-y-6">
        <div className="bank-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Información de la Sucursal</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nombre</label>
              <input
                type="text"
                defaultValue="Sucursal Principal"
                className="mt-1 w-full px-4 py-2 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Código</label>
              <input
                type="text"
                defaultValue="LIMA-001"
                className="mt-1 w-full px-4 py-2 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="bank-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Configuración del Chatbot</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Mensaje de bienvenida</label>
              <textarea
                rows={3}
                defaultValue="¡Hola! Soy tu asistente virtual del Banco Digital. ¿En qué puedo ayudarte hoy?"
                className="mt-1 w-full px-4 py-2 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
        </div>

        <Button variant="bank" className="w-full">
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
