import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github, GraduationCap, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Acerca del Proyecto</h1>
        <p className="text-xl text-muted-foreground">
          Información sobre el proyecto académico y el equipo de desarrollo.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Información Académica</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Universidad de Ingeniería y Tecnología (UTEC)
            </CardTitle>
            <CardDescription>2025-2</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Curso</h3>
              <p className="text-sm text-muted-foreground">
                Introducción a Cognitive Computing
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Profesor</h3>
              <p className="text-sm text-muted-foreground">Jaime Farfán</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Trabajo</h3>
              <p className="text-sm text-muted-foreground">
                Reconocimiento Facial APP Banca - Entrega Final
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Equipo de Desarrollo</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              name: "Carlos Daniel Izaguirre Zavaleta",
              code: "202410640",
            },
            {
              name: "Rodrigo Vásquez de Velasco Gonzales Vigil",
              code: "202110682",
            },
            {
              name: "Sharon Alejandra Aiquipa Meza",
              code: "202210010",
            },
          ].map((member) => (
            <Card key={member.code}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {member.name.split(" ")[0]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Código: <code className="px-1.5 py-0.5 bg-muted rounded">{member.code}</code>
                </p>
                <p className="text-sm text-muted-foreground mt-1">{member.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Repositorios</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Repositorio Principal
              </CardTitle>
              <CardDescription>Monolito - Next.js + Flask</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link
                  href="https://github.com/Rodvdev/pr-icc"
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  Ver en GitHub
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                https://github.com/Rodvdev/pr-icc
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Repositorio Hardware
              </CardTitle>
              <CardDescription>Backend Hardware - ESP32-CAM</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link
                  href="https://github.com/aaiquipameza-del/hardware_ESP32Cam.git"
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  Ver en GitHub
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                https://github.com/aaiquipameza-del/hardware_ESP32Cam.git
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Entregables del Proyecto</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Código</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Código backend, frontend, hardware</p>
              <p>• Dockerfile + docker-compose (para levantar local)</p>
              <p>• Scripts SQL de creación de esquema y datos de prueba</p>
              <p>• Prisma ORM con seed file en TypeScript</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Documentación técnica completa</p>
              <p>• Diagramas de despliegue y arquitectura</p>
              <p>• Manual de usuario</p>
              <p>• Presentación y video demo</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Enlaces del Proyecto</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">App AWS:</Badge>
            <code className="text-sm text-muted-foreground">(enlace a agregar)</code>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Video Demo:</Badge>
            <code className="text-sm text-muted-foreground">(enlace a agregar)</code>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Presentación:</Badge>
            <Link
              href="https://docs.google.com/presentation/d/1E3ijxQC_A3kKk31WZHaUEZfBp5jPyjZeggErgZxX1_k/edit?usp=sharing"
              target="_blank"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Ver Presentación
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

