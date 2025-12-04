import Link from "next/link"
import { ArrowRight, CheckCircle2, Terminal, Database, Rocket } from "lucide-react"
import { CodeBlock } from "@/components/documentation/code-block"
import { DocAlert } from "@/components/documentation/doc-alert"
import { DocNavigation } from "@/components/documentation/doc-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function GettingStartedPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Getting Started</h1>
        <p className="text-xl text-muted-foreground">
          Guía rápida para configurar y ejecutar Banking Agent ID System localmente
        </p>
      </div>

      {/* Prerequisites */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Prerequisitos</h2>
        <p className="text-muted-foreground">
          Antes de comenzar, asegúrate de tener instalado lo siguiente:
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Desarrollo Local</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Node.js 18+ y npm
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  PostgreSQL 14+
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Git
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Python 3.11+ (para Flask API)
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opcional</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Docker y Docker Compose
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  ESP32-CAM (para hardware)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Vercel CLI (para despliegue)
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Installation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Instalación</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">1. Clonar el repositorio</h3>
            <CodeBlock
              code={`# Repositorio principal
git clone https://github.com/Rodvdev/pr-icc.git
cd pr-icc

# Repositorio de hardware (opcional)
git clone https://github.com/aaiquipameza-del/hardware_ESP32Cam.git`}
              language="bash"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">2. Instalar dependencias</h3>
            <CodeBlock
              code={`# Instalar dependencias de Next.js
npm install

# Generar cliente de Prisma
npm run db:generate`}
              language="bash"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">3. Configurar variables de entorno</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Crea un archivo <code className="px-1.5 py-0.5 bg-muted rounded">.env</code> en la raíz del proyecto:
            </p>
            <CodeBlock
              code={`# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/banking_agent_db?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3005"
NEXTAUTH_SECRET="your-secret-key-here"
# Generate secret with: openssl rand -base64 32

# Optional: External Facial Recognition API
NEXT_PUBLIC_FACIAL_API_URL="http://localhost:5001/api"
EXTERNAL_FACIAL_API_URL="http://localhost:5001"

# Node Environment
NODE_ENV="development"`}
              language="bash"
            />
            <DocAlert type="info" className="mt-2">
              Genera el NEXTAUTH_SECRET con: <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">openssl rand -base64 32</code>
            </DocAlert>
          </div>
        </div>
      </section>

      {/* Database Setup */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configuración de Base de Datos</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">1. Ejecutar migraciones</h3>
            <CodeBlock
              code={`# Ejecutar migraciones de Prisma
npm run db:migrate

# O para desarrollo rápido
npm run db:push`}
              language="bash"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">2. Poblar con datos de prueba</h3>
            <CodeBlock
              code={`# Ejecutar seed para datos iniciales
npm run db:seed`}
              language="bash"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">3. Ver base de datos (Opcional)</h3>
            <CodeBlock
              code={`# Abrir Prisma Studio
npm run db:studio`}
              language="bash"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Esto abrirá una interfaz gráfica en <code className="px-1.5 py-0.5 bg-muted rounded">http://localhost:5555</code>
            </p>
          </div>
        </div>
      </section>

      {/* Running the Application */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Ejecutar la Aplicación</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Modo Desarrollo</h3>
            <CodeBlock
              code={`# Iniciar servidor de desarrollo
npm run dev`}
              language="bash"
            />
            <p className="text-sm text-muted-foreground mt-2">
              La aplicación estará disponible en <code className="px-1.5 py-0.5 bg-muted rounded">http://localhost:3005</code>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Con Docker (Recomendado)</h3>
            <CodeBlock
              code={`# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down`}
              language="bash"
            />
          </div>
        </div>
      </section>

      {/* Flask API Setup */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configurar Flask API (Reconocimiento Facial)</h2>
        
        <DocAlert type="warning">
          El sistema de reconocimiento facial requiere una API Flask separada. 
          Ver <Link href="/documentation/integration/hardware" className="underline">Integración Hardware</Link> para más detalles.
        </DocAlert>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Instalación de dependencias</h3>
            <CodeBlock
              code={`# En el directorio de Flask API
pip install flask gunicorn face_recognition opencv-python numpy requests python-dotenv`}
              language="bash"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Variables de entorno Flask</h3>
            <CodeBlock
              code={`# .env en Flask API
FLASK_APP=app.py
FLASK_ENV=development
STREAM_URL=http://192.168.1.100:81/stream
NEXTJS_WEBHOOK_URL=http://localhost:3005/api/facial-recognition/webhook
FACIAL_RECOGNITION_WEBHOOK_SECRET=your-secret-here`}
              language="bash"
            />
          </div>
        </div>
      </section>

      {/* Quick Start Commands */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Comandos Útiles</h2>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scripts Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm font-mono">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>npm run dev</span>
                <Badge variant="outline">Desarrollo</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>npm run build</span>
                <Badge variant="outline">Build</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>npm run db:migrate</span>
                <Badge variant="outline">Base de Datos</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>npm run db:seed</span>
                <Badge variant="outline">Datos</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>npm run db:studio</span>
                <Badge variant="outline">GUI</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Next Steps */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Próximos Pasos</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Arquitectura
              </CardTitle>
              <CardDescription>
                Entiende la arquitectura completa del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/documentation/architecture/overview">
                  Ver Arquitectura
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Despliegue AWS
              </CardTitle>
              <CardDescription>
                Aprende a desplegar en producción
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/documentation/deployment/aws">
                  Ver Guía de Despliegue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Solución de Problemas</h2>
        
        <div className="space-y-3">
          <DocAlert type="info">
            <strong>Error de conexión a la base de datos:</strong> Verifica que PostgreSQL esté corriendo 
            y que la URL de conexión en <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">.env</code> sea correcta.
          </DocAlert>
          
          <DocAlert type="info">
            <strong>Error al ejecutar migraciones:</strong> Asegúrate de que la base de datos exista 
            y que tengas permisos suficientes.
          </DocAlert>
          
          <DocAlert type="info">
            <strong>Puerto ya en uso:</strong> Cambia el puerto en el script de desarrollo o cierra 
            la aplicación que está usando el puerto 3005.
          </DocAlert>
        </div>
      </section>

      {/* Navigation */}
      <DocNavigation />
    </div>
  )
}

