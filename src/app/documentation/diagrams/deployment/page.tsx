import Link from "next/link"
import { CodeBlock } from "@/components/documentation/code-block"
import { DocAlert } from "@/components/documentation/doc-alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { readFile } from "fs/promises"
import { join } from "path"

export default async function DeploymentDiagramPage() {
  let mermaidContent = ""
  try {
    const filePath = join(process.cwd(), "docs/diagramas/DEPLOYMENT_DIAGRAM.mmd")
    mermaidContent = await readFile(filePath, "utf-8")
  } catch (error) {
    console.error("Error reading diagram file:", error)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Diagrama de Despliegue</h1>
        <p className="text-xl text-muted-foreground">
          Diagrama completo de la arquitectura de despliegue en AWS con todos los componentes y conexiones.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Diagrama Mermaid</h2>
        <Card>
          <CardHeader>
            <CardTitle>Arquitectura de Despliegue AWS</CardTitle>
          </CardHeader>
          <CardContent>
            {mermaidContent ? (
              <CodeBlock code={mermaidContent} language="mermaid" showCopy={true} />
            ) : (
              <p className="text-sm text-muted-foreground">Diagrama no disponible</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Componentes Principales</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Frontend Layer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-1">
                <li>• Usuarios, Clientes, Administradores</li>
                <li>• Conexión HTTPS</li>
                <li>• Route 53 DNS</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AWS Cloud</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-1">
                <li>• VPC con subnets públicas/privadas</li>
                <li>• Application Load Balancer</li>
                <li>• EC2 para Next.js y Flask API</li>
                <li>• RDS PostgreSQL en subnets privadas</li>
                <li>• S3 para almacenamiento</li>
                <li>• CloudWatch para monitoreo</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <DocAlert type="info">
        Para descripción textual completa, consulta{" "}
        <code className="px-1.5 py-0.5 bg-muted rounded">docs/diagramas/DEPLOYMENT_DIAGRAM.md</code>
        {" "}o el archivo Draw.io en{" "}
        <code className="px-1.5 py-0.5 bg-muted rounded">docs/diagramas/DEPLOYMENT_DIAGRAM.drawio.xml</code>
      </DocAlert>
    </div>
  )
}

