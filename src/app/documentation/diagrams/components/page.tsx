import { CodeBlock } from "@/components/documentation/code-block"
import { DocAlert } from "@/components/documentation/doc-alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { readFile } from "fs/promises"
import { join } from "path"

export default async function ComponentsDiagramPage() {
  let mermaidContent = ""
  try {
    const filePath = join(process.cwd(), "docs/diagramas/ARQUITECTURA_COMPONENTES.mmd")
    mermaidContent = await readFile(filePath, "utf-8")
  } catch (error) {
    console.error("Error reading diagram file:", error)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Diagrama de Componentes</h1>
        <p className="text-xl text-muted-foreground">
          Arquitectura de componentes del sistema y sus interacciones.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Diagrama Mermaid</h2>
        <Card>
          <CardHeader>
            <CardTitle>Arquitectura de Componentes</CardTitle>
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
        <h2 className="text-2xl font-bold">Capas del Sistema</h2>
        <div className="space-y-3 text-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Frontend Layer</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Admin Panel, Client Portal, Kiosk Interface
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">API Routes</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Auth, Clients, Branches, Cameras, Facial Recognition, Chat, Kiosk, FAQs
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Services Layer</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              ClientService, FacialRecognitionService, ChatbotService, BranchService, CameraService
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

