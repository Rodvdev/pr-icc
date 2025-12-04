import { Building2 } from "lucide-react";

interface KioskHeaderProps {
  title?: string;
  subtitle?: string;
}

export function KioskHeader({ 
  title = "Banco Digital", 
  subtitle = "Sistema de Atención Automatizada" 
}: KioskHeaderProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  const timeStr = now.toLocaleTimeString('es-PE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <header className="w-full px-6 py-4 flex items-center justify-between bg-card/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-bank">
          <Building2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display font-semibold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-foreground capitalize">{dateStr}</p>
        <p className="text-xs text-muted-foreground">{timeStr}</p>
      </div>
    </header>
  );
}
