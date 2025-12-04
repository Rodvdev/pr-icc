import { CodeBlock } from "@/components/documentation/code-block"
import { DocAlert } from "@/components/documentation/doc-alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ArchitectureDatabasePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Arquitectura de Base de Datos</h1>
        <p className="text-xl text-muted-foreground">
          Documentación completa de la arquitectura de base de datos PostgreSQL con Prisma ORM.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tecnologías</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>PostgreSQL</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-1">
                <li>• Versión mínima: 14+</li>
                <li>• Recomendado: 15.4+</li>
                <li>• Características: JSON/JSONB, índices compuestos, Foreign keys</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prisma ORM</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-1">
                <li>• Type-safe queries</li>
                <li>• Migraciones automáticas</li>
                <li>• Cliente generado con TypeScript</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Modelos Principales</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-sm">
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
                "ChatSession - Sesiones de chat",
                "ChatMessage - Mensajes",
                "FAQ - Preguntas frecuentes",
                "QAPair - Preguntas y respuestas",
                "Device - Dispositivos IoT",
              ].map((model) => (
                <div key={model} className="text-muted-foreground">
                  • {model}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Índices y Optimizaciones</h2>
        <DocAlert type="info">
          La base de datos incluye índices optimizados para queries frecuentes en DetectionEvent, 
          Visit, ChatMessage y otros modelos de alta frecuencia.
        </DocAlert>
        <CodeBlock
          code={`-- Ejemplo de índices en DetectionEvent
CREATE INDEX "DetectionEvent_cameraId_occurredAt_idx" 
  ON "DetectionEvent"("cameraId", "occurredAt");

CREATE INDEX "DetectionEvent_clientId_occurredAt_idx" 
  ON "DetectionEvent"("clientId", "occurredAt");

CREATE INDEX "DetectionEvent_status_occurredAt_idx" 
  ON "DetectionEvent"("status", "occurredAt");`}
          language="sql"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Backup y Recuperación</h2>
        <Card>
          <CardHeader>
            <CardTitle>Estrategias de Backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p><strong>RDS Backups Automáticos:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Retention: 7 días</li>
              <li>Window: 03:00-04:00 UTC</li>
              <li>Multi-AZ: Snapshots automáticos</li>
            </ul>
            <p className="mt-4"><strong>Backup Manual:</strong></p>
            <CodeBlock
              code={`aws rds create-db-snapshot \\
  --db-instance-identifier banking-agent-db \\
  --db-snapshot-identifier banking-agent-db-manual-$(date +%Y%m%d)`}
              language="bash"
            />
          </CardContent>
        </Card>
      </section>

      <DocAlert type="info">
        Para documentación completa, consulta{" "}
        <code className="px-1.5 py-0.5 bg-muted rounded">docs/DATABASE_ARCHITECTURE.md</code>
      </DocAlert>
    </div>
  )
}

