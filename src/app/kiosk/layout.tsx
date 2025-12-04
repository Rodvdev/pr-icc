import { ReactNode } from "react"
import { KioskHeader } from "@/components/kiosk/KioskHeader"
import { KioskFooter } from "@/components/kiosk/KioskFooter"

export const metadata = {
  title: "Kiosco Bancario",
  description: "Sistema de identificación y atención automatizada",
}

/**
 * Layout para el módulo kiosco
 * - Sin navegación compleja (pantalla completa)
 * - Optimizado para pantallas táctiles
 * - UI simple y accesible
 */
export default function KioskLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bank-gradient flex flex-col">
      <KioskHeader />
      
      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      <KioskFooter />
    </div>
  )
}

