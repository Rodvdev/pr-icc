import { Button } from "@/components/ui/button"
import { Building2, Monitor, BookOpen, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bank-gradient flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Welcome section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6 mx-auto shadow-glow">
            <Building2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-5xl font-bold text-foreground mb-4">
            Sistema de Identificación Bancaria
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Automatiza la identificación de clientes mediante reconocimiento facial 
            e integra un asistente virtual para mejorar la experiencia del usuario
          </p>
        </div>

        {/* Main access cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full mb-8">
          {/* Kiosk Card */}
          <Link href="/kiosk" className="group">
            <div className="bank-card-elevated p-8 h-full flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-6 shadow-glow group-hover:shadow-glow-lg transition-shadow">
                <Monitor className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                Módulo Kiosco
              </h2>
              <p className="text-muted-foreground mb-6 flex-grow">
                Acceso público para reconocimiento facial, registro de clientes y atención automatizada
              </p>
              <Button variant="bank" size="lg" className="w-full group-hover:gap-2 transition-all">
                Acceder al Kiosco
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Link>

          {/* Admin Card */}
          <Link href="/auth/signin" className="group">
            <div className="bank-card-elevated p-8 h-full flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-6 shadow-glow group-hover:shadow-glow-lg transition-shadow">
                <Building2 className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                Panel de Administración
              </h2>
              <p className="text-muted-foreground mb-6 flex-grow">
                Gestión completa del sistema: clientes, cámaras, sucursales, métricas y configuración
              </p>
              <Button variant="bank" size="lg" className="w-full group-hover:gap-2 transition-all">
                Acceder al Admin
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Link>

          {/* Documentation Card */}
          <Link href="/documentation" className="group">
            <div className="bank-card-elevated p-8 h-full flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-6 shadow-glow group-hover:shadow-glow-lg transition-shadow">
                <BookOpen className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                Documentación
              </h2>
              <p className="text-muted-foreground mb-6 flex-grow">
                Guías completas de arquitectura, integración, despliegue y uso del sistema
              </p>
              <Button variant="bank" size="lg" className="w-full group-hover:gap-2 transition-all">
                Ver Documentación
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <p className="text-sm text-muted-foreground">
            Sistema desarrollado con Next.js 15, TypeScript, Prisma y PostgreSQL
          </p>
        </div>
      </main>
    </div>
  )
}