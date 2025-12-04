import { CodeBlock } from "@/components/documentation/code-block"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { readFile } from "fs/promises"
import { join } from "path"

export default async function DataFlowDiagramPage() {
  let mermaidContent = ""
  try {
    const filePath = join(process.cwd(), "docs/diagramas/FLUJO_DATOS.mmd")
    mermaidContent = await readFile(filePath, "utf-8")
  } catch (error) {
    console.error("Error reading diagram file:", error)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Flujo de Datos</h1>
        <p className="text-xl text-muted-foreground">
          Diagramas de secuencia mostrando el flujo de datos entre componentes del sistema.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Diagrama de Secuencia</h2>
        <Card>
          <CardHeader>
            <CardTitle>Flujos Principales del Sistema</CardTitle>
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
        <h2 className="text-2xl font-bold">Flujos Documentados</h2>
        <div className="space-y-3 text-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Registro de Cliente</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Cliente → Kiosk → Next.js API → Database → Admin Approval → Facial Profile Creation
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Reconocimiento Facial</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              ESP32 Camera → Flask API → Face Detection → Encoding → Comparison → Webhook → Next.js → Database
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. Chatbot</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              User Query → Next.js API → Context Retrieval → Response Generation → Database Logging
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

