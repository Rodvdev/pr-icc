import Link from "next/link"
import { DocAlert } from "@/components/documentation/doc-alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DatabaseIntegrationPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Integración de Base de Datos</h1>
        <p className="text-xl text-muted-foreground">
          Documentación sobre la integración y uso de PostgreSQL con Prisma ORM en el sistema.
        </p>
      </div>

      <DocAlert type="info">
        Para información completa sobre la arquitectura de base de datos, consulta{" "}
        <Link href="/documentation/architecture/database" className="underline font-semibold">
          Arquitectura de Base de Datos
        </Link>
        {" "}o el documento técnico en{" "}
        <code className="px-1.5 py-0.5 bg-muted rounded">docs/DATABASE_ARCHITECTURE.md</code>
      </DocAlert>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Conexión</h2>
        <Card>
          <CardHeader>
            <CardTitle>Connection String</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`DATABASE_URL="postgresql://
  username:password@
  host:5432/
  banking_agent_db?schema=public"`}
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

