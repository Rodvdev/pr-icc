import { Shield } from "lucide-react";

export function KioskFooter() {
  return (
    <footer className="w-full px-6 py-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border bg-card/50">
      <p>© 2025 Banco Digital - Todos los derechos reservados</p>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Conexión segura
        </span>
        <span>¿Necesitas ayuda? Llama al <a href="tel:08001234" className="text-primary font-medium hover:underline">0800-1234</a></span>
      </div>
    </footer>
  );
}
