import Link from "next/link"
import { ArrowRight, Building2, Brain, Cpu, Database, Cloud, Users, Camera, MessageSquare, Zap, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DocumentationHomePage() {
  const features = [
    {
      icon: Camera,
      title: "Reconocimiento Facial",
      description: "Identificación automática de clientes mediante análisis facial en tiempo real con ESP32-CAM",
    },
    {
      icon: MessageSquare,
      title: "Chatbot Inteligente",
      description: "Asistente conversacional con base de conocimiento configurable para resolver consultas",
    },
    {
      icon: Users,
      title: "Gestión de Clientes",
      description: "Sistema completo de registro, aprobación y administración de clientes",
    },
    {
      icon: Building2,
      title: "Multi-sucursal",
      description: "Gestión centralizada de múltiples sucursales y módulos de atención",
    },
    {
      icon: Brain,
      title: "Inteligencia Artificial",
      description: "Reconocimiento facial con face_recognition y chatbot rule-based extensible",
    },
    {
      icon: Cloud,
      title: "Despliegue en AWS",
      description: "Arquitectura escalable en la nube con EC2, RDS, S3 y CloudWatch",
    },
  ]

  const techStack = [
    { name: "Next.js 15", category: "Frontend" },
    { name: "TypeScript", category: "Frontend" },
    { name: "React 19", category: "Frontend" },
    { name: "Python Flask", category: "Backend" },
    { name: "PostgreSQL", category: "Database" },
    { name: "Prisma ORM", category: "Database" },
    { name: "face_recognition", category: "AI/ML" },
    { name: "ESP32-CAM", category: "Hardware" },
    { name: "AWS EC2/RDS/S3", category: "Cloud" },
    { name: "Docker", category: "DevOps" },
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Sistema de Identificación Bancaria
          </Badge>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Banking Agent ID
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-3xl">
          Una plataforma completa para gestionar operaciones de agentes bancarios con 
          reconocimiento facial, gestión de clientes y controles administrativos. 
          Diseñada para la sucursal bancaria del futuro.
        </p>

        <div className="flex flex-wrap gap-4">
          <Button asChild size="lg">
            <Link href="/documentation/getting-started">
              Comenzar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="https://github.com/Rodvdev/pr-icc" target="_blank">
              Ver Código
            </Link>
          </Button>
        </div>
      </div>

      {/* YouTube Video Embed - Contexto */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Contexto</h2>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src="https://www.youtube.com/embed/vW08FPfk7_A"
            title="Banking Agent ID System - Contexto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>

      {/* Problem & Solution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Problema</CardTitle>
            <CardDescription>
              La transformación digital del sistema bancario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La transformación digital ha trasladado servicios a la banca móvil, pero 
              existe una brecha en la gestión de atención al cliente en sucursales. Los 
              procesos de identificación, gestión de citas y resolución de consultas son 
              lentos y dependen en gran medida de la intervención humana.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solución</CardTitle>
            <CardDescription>
              Plataforma autónoma, confiable y segura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sistema que permite gestionar citas y solucionar consultas mediante un 
              chatbot, luego de una verificación facial. El cliente puede solicitar registro 
              y, una vez aprobado, validar su identidad con ESP32-CAM para ingresar a la 
              plataforma desplegada en AWS.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Características Principales</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* YouTube Video Embed - Demo */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Video Demo</h2>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src="https://www.youtube.com/embed/-ZZV3ewQPy0"
            title="Banking Agent ID System - Video Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Arquitectura del Sistema</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Frontend</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Next.js 15</li>
                <li>• React 19</li>
                <li>• TypeScript</li>
                <li>• TailwindCSS</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Backend</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Next.js API Routes</li>
                <li>• Flask API (Python)</li>
                <li>• Prisma ORM</li>
                <li>• NextAuth.js</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Base de Datos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• PostgreSQL</li>
                <li>• Multi-AZ RDS</li>
                <li>• Migraciones automáticas</li>
                <li>• Backup automático</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">IA/ML</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• face_recognition</li>
                <li>• Chatbot rule-based</li>
                <li>• Matching semántico</li>
                <li>• Base de conocimiento</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Stack Tecnológico</h2>
        <div className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <Badge key={tech.name} variant="secondary" className="text-sm py-1.5 px-3">
              {tech.name}
              <span className="ml-2 text-xs text-muted-foreground">
                ({tech.category})
              </span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Documentación</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Getting Started
              </CardTitle>
              <CardDescription>
                Guía rápida para comenzar con el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/documentation/getting-started">
                  Ver Guía
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Arquitectura
              </CardTitle>
              <CardDescription>
                Documentación completa de la arquitectura del sistema
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
                <Cloud className="h-5 w-5" />
                Despliegue AWS
              </CardTitle>
              <CardDescription>
                Guía completa para desplegar en AWS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/documentation/deployment/aws">
                  Ver Guía AWS
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Integración Hardware
              </CardTitle>
              <CardDescription>
                Cómo integrar dispositivos ESP32 y Raspberry Pi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/documentation/integration/hardware">
                  Ver Integración
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Project Info */}
      <div className="border-t pt-8 space-y-4">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold mb-2">Proyecto Académico</h3>
            <p className="text-sm text-muted-foreground">
              Introducción a Cognitive Computing - Universidad de Ingeniería y Tecnología (UTEC)
              <br />
              <span className="font-medium">2025-2</span>
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Equipo</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Carlos Daniel Izaguirre Zavaleta (202410640)</li>
              <li>• Rodrigo Vásquez de Velasco (202110682)</li>
              <li>• Sharon Alejandra Aiquipa Meza (202210010)</li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link 
            href="https://github.com/Rodvdev/pr-icc" 
            target="_blank"
            className="hover:text-foreground underline"
          >
            Repositorio Principal
          </Link>
          <Link 
            href="https://github.com/aaiquipameza-del/hardware_ESP32Cam.git" 
            target="_blank"
            className="hover:text-foreground underline"
          >
            Repositorio Hardware
          </Link>
        </div>
      </div>
    </div>
  )
}

