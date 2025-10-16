import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Camera, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Building2 className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sistema de Identificación Bancaria
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automatiza la identificación de clientes mediante reconocimiento facial 
            e integra un asistente virtual para mejorar la experiencia del usuario
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Gestión de Clientes</CardTitle>
              <CardDescription>
                Registro, autenticación y administración de clientes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Camera className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">Reconocimiento Facial</CardTitle>
              <CardDescription>
                Identificación automática mediante cámaras IP
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageSquare className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle className="text-lg">Chatbot Inteligente</CardTitle>
              <CardDescription>
                Asistente virtual con base de conocimiento
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Building2 className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle className="text-lg">Multi-sucursal</CardTitle>
              <CardDescription>
                Gestión centralizada de múltiples ubicaciones
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">
            Accede al Sistema
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/auth/signin">
                Panel de Administración
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/client/login">
                Área de Cliente
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/kiosk">
                Módulo Kiosco
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 text-center text-gray-500">
          <p className="text-sm">
            Sistema desarrollado con Next.js 15, TypeScript, Prisma y PostgreSQL
          </p>
        </div>
      </div>
    </div>
  )
}