"use client"

import { ReactNode, useEffect, useState } from "react"

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
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header fijo con logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Banco Digital</h1>
                <p className="text-xs text-gray-500">Sistema de Atención Automatizada</p>
              </div>
            </div>
            
            {/* Indicador de tiempo */}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {now.toLocaleDateString('es-PE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <p className="text-xs text-gray-500">
                {now.toLocaleTimeString('es-PE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="pt-24 pb-8 min-h-screen">
        {children}
      </main>

      {/* Footer fijo */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <p>© 2025 Banco Digital - Todos los derechos reservados</p>
            <p>¿Necesitas ayuda? Llama al <span className="font-semibold text-blue-600">0800-1234</span></p>
          </div>
        </div>
      </footer>
    </div>
  )
}

