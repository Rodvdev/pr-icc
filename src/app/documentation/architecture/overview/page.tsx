import Link from "next/link"
import { CodeBlock } from "@/components/documentation/code-block"
import { DocAlert } from "@/components/documentation/doc-alert"
import { DocNavigation } from "@/components/documentation/doc-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Server, Database, Brain, Cpu, Cloud } from "lucide-react"

export default function ArchitectureOverviewPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Arquitectura del Sistema</h1>
        <p className="text-xl text-muted-foreground">
          Descripción completa de la arquitectura del sistema Banking Agent ID, incluyendo 
          componentes principales, flujos de datos y decisiones técnicas.
        </p>
      </div>

      {/* Description */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Descripción General</h2>
        <p className="text-muted-foreground">
          El <strong>Banking Agent ID System</strong> es una aplicación completa para gestionar 
          operaciones de agentes bancarios con reconocimiento facial, gestión de clientes y 
          controles administrativos. El sistema está diseñado para operar en kioscos físicos 
          donde los clientes pueden ser identificados mediante reconocimiento facial, interactuar 
          con un chatbot, programar citas y gestionar visitas.
        </p>
      </section>

      {/* Main Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Componentes Principales</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-2">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Frontend</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Next.js 15 con TypeScript, React 19, TailwindCSS
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
                <Server className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">Backend</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Next.js API Routes + Flask API (Python)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-2">
                <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">Base de Datos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                PostgreSQL con Prisma ORM
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-2">
                <Brain className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-lg">IA/ML</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Reconocimiento Facial (face_recognition) + Chatbot Rule-based
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center mb-2">
                <Cpu className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-lg">Hardware</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ESP32/Raspberry Pi/Arduino → MQTT/HTTP
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mb-2">
                <Cloud className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-lg">AWS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                EC2, RDS, S3, CloudWatch
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Architecture Layers */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Arquitectura por Capas</h2>
        
        <div className="space-y-6">
          {/* Layer 1 */}
          <Card>
            <CardHeader>
              <CardTitle>1. Capa de Presentación (Frontend)</CardTitle>
              <CardDescription>Next.js 15, React 19, TypeScript, TailwindCSS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Panel de Administración (/admin)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Dashboard con métricas del sistema</li>
                  <li>Gestión de clientes, sucursales, cámaras</li>
                  <li>Aprobación de registros</li>
                  <li>Configuración de FAQs y chatbot</li>
                  <li>Monitoreo de reconocimiento facial</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Portal del Cliente (/client)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Perfil personal</li>
                  <li>Historial de visitas</li>
                  <li>Gestión documental</li>
                  <li>Sistema de ayuda</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interfaz de Kiosco (/kiosk)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Reconocimiento facial en tiempo real</li>
                  <li>Chatbot interactivo</li>
                  <li>Registro de visitantes</li>
                  <li>Programación de citas</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Layer 2 */}
          <Card>
            <CardHeader>
              <CardTitle>2. Capa de Aplicación (Backend)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Next.js API Routes</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Autenticación (NextAuth.js)</li>
                  <li>Gestión de Clientes (CRUD completo)</li>
                  <li>Gestión de Sucursales (multi-tenant)</li>
                  <li>Reconocimiento Facial (integración con Flask)</li>
                  <li>Chatbot (conversaciones con contexto)</li>
                  <li>FAQs y QA (gestión de base de conocimiento)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Flask API (Python) - Reconocimiento Facial</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Procesamiento de video streams</li>
                  <li>Detección y reconocimiento facial</li>
                  <li>Almacenamiento de encodings</li>
                  <li>Webhook para notificar detecciones</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Layer 3 */}
          <Card>
            <CardHeader>
              <CardTitle>3. Capa de Datos</CardTitle>
              <CardDescription>PostgreSQL con Prisma ORM</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  "User - Administradores y agentes",
                  "Client - Clientes/visitantes",
                  "Branch - Sucursales",
                  "AgentModule - Módulos físicos",
                  "Camera - Dispositivos de cámara",
                  "FacialProfile - Encodings faciales",
                  "DetectionEvent - Eventos de detección",
                  "Visit - Visitas/atenciones",
                  "Appointment - Citas programadas",
                  "ChatSession/ChatMessage - Conversaciones",
                  "FAQ/QAPair - Base de conocimiento",
                  "Device - Configuración IoT",
                ].map((model) => (
                  <div key={model} className="text-sm text-muted-foreground">
                    • {model}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Layer 4 */}
          <Card>
            <CardHeader>
              <CardTitle>4. Capa de IA/ML</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Reconocimiento Facial</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Librería: face_recognition (basada en dlib)</li>
                  <li>Encoding: Vectores de 128 dimensiones</li>
                  <li>Proceso: Captura → Detección → Encoding → Comparación → Match</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Chatbot</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Enfoque: Rule-based con matching semántico</li>
                  <li>Base de conocimiento: FAQs y QA pairs</li>
                  <li>Búsqueda: Full-text search con relevancia</li>
                  <li>Contexto: Datos del cliente cuando está autenticado</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Flow */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Flujo de Datos Principal</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flujo de Reconocimiento Facial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                code={`ESP32 Camera → HTTP Stream → Flask API → Face Detection → Encoding → 
Comparison → Match Result → Webhook → Next.js API → Database → 
Frontend Update`}
                language="text"
              />
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Captura: Cámara ESP32 transmite stream HTTP</li>
                <li>Procesamiento: Flask API captura frames y procesa</li>
                <li>Detección: Detecta rostros usando HOG detector</li>
                <li>Encoding: Genera vector de 128 dimensiones</li>
                <li>Comparación: Compara con encodings conocidos</li>
                <li>Match: Identifica persona con nivel de confianza</li>
                <li>Notificación: Envía webhook a Next.js</li>
                <li>Almacenamiento: Guarda evento en PostgreSQL</li>
                <li>Visualización: Frontend muestra resultado en tiempo real</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Flujo del Chatbot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                code={`User Query → Next.js API → Context Retrieval (FAQs/QA) → 
Response Generation → Database Logging → Response to User`}
                language="text"
              />
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Consulta: Usuario envía mensaje</li>
                <li>Contexto: Sistema busca FAQs y QA pairs relevantes</li>
                <li>Generación: Genera respuesta basada en contexto</li>
                <li>Registro: Guarda interacción en base de datos</li>
                <li>Métricas: Registra latencia y éxito</li>
                <li>Respuesta: Devuelve respuesta al usuario</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Architectural Patterns */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Patrones Arquitectónicos</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>1. MVC (Modelo-Vista-Controlador)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Modelo: Prisma Schema</p>
              <p>• Vista: React Components</p>
              <p>• Controlador: Next.js API + Servicios</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Service Layer Pattern</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• ClientService</p>
              <p>• ChatbotService</p>
              <p>• FacialRecognitionService</p>
              <p>• BranchService, CameraService</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Repository Pattern</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Prisma ORM actúa como capa de abstracción de datos, permitiendo cambios de 
              base de datos sin modificar lógica de negocio.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. API Gateway Pattern</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Next.js API Routes actúan como gateway único: autenticación centralizada, 
              rate limiting, validación de entrada, logging y monitoreo.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Technical Decisions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Decisiones Técnicas Clave</h2>
        
        <div className="space-y-4">
          {[
            {
              title: "Next.js App Router",
              reason: "Mejor rendimiento con React Server Components, routing basado en archivos, API Routes integradas, optimizaciones automáticas.",
            },
            {
              title: "Prisma ORM",
              reason: "Type-safety completo, migraciones automáticas, cliente generado con TypeScript, excelente DX.",
            },
            {
              title: "Reconocimiento Facial en Python",
              reason: "Librerías Python más maduras para CV, face_recognition es simple y efectiva, puede escalarse independientemente.",
            },
            {
              title: "Chatbot Rule-based",
              reason: "Menor costo operativo, respuestas más predecibles, control total sobre respuestas, puede integrarse con LLM después.",
            },
            {
              title: "PostgreSQL",
              reason: "ACID compliance, JSON support, excelente soporte en Prisma, escalable y confiable.",
            },
          ].map((decision) => (
            <Card key={decision.title}>
              <CardHeader>
                <CardTitle className="text-lg">{decision.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{decision.reason}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Seguridad</h2>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Autenticación</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              NextAuth.js, Roles (ADMIN/AGENT), JWT tokens, Password hashing con bcrypt
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validación</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Validación en capa de API, sanitización de inputs, CSRF protection, rate limiting
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Protección</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Encriptación de contraseñas, HTTPS en producción, variables de entorno para secrets, audit logs
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Next Steps */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Siguiente</h2>
        <div className="flex gap-4">
          <DocAlert type="info">
            Para más detalles sobre la arquitectura de IA, ver{" "}
            <Link href="/documentation/architecture/ai" className="underline font-semibold">
              Arquitectura de IA
            </Link>
          </DocAlert>
        </div>
      </section>

      {/* Navigation */}
      <DocNavigation />
    </div>
  )
}

