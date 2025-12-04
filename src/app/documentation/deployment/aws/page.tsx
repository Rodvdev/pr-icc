import Link from "next/link"
import { CodeBlock } from "@/components/documentation/code-block"
import { DocAlert } from "@/components/documentation/doc-alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cloud, Database, Server, HardDrive } from "lucide-react"

export default function DeploymentAWSPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Despliegue en AWS</h1>
        <p className="text-xl text-muted-foreground">
          Guía completa para desplegar Banking Agent ID System en AWS usando EC2, RDS, S3 y CloudWatch.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Arquitectura de Despliegue</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <Cloud className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-lg">EC2</CardTitle>
              <CardDescription>Flask API</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              nginx + gunicorn para reconocimiento facial
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Database className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle className="text-lg">RDS</CardTitle>
              <CardDescription>PostgreSQL</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Base de datos Multi-AZ
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <HardDrive className="h-8 w-8 text-orange-500 mb-2" />
              <CardTitle className="text-lg">S3</CardTitle>
              <CardDescription>Almacenamiento</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Imágenes y snapshots
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Server className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle className="text-lg">CloudWatch</CardTitle>
              <CardDescription>Monitoreo</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Logs y métricas
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configuración de VPC</h2>
        <CodeBlock
          code={`# Crear VPC
aws ec2 create-vpc \\
  --cidr-block 10.0.0.0/16 \\
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=banking-agent-vpc}]'

# Crear subnets públicas
aws ec2 create-subnet \\
  --vpc-id $VPC_ID \\
  --cidr-block 10.0.1.0/24 \\
  --availability-zone us-east-1a`}
          language="bash"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">RDS PostgreSQL</h2>
        <Card>
          <CardHeader>
            <CardTitle>Crear Instancia RDS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock
              code={`aws rds create-db-instance \\
  --db-instance-identifier banking-agent-db \\
  --db-instance-class db.t3.medium \\
  --engine postgres \\
  --engine-version 15.4 \\
  --master-username admin \\
  --master-user-password 'TuPasswordSeguro123!' \\
  --allocated-storage 20 \\
  --storage-type gp3 \\
  --storage-encrypted \\
  --multi-az \\
  --backup-retention-period 7`}
              language="bash"
            />
            <DocAlert type="warning">
              El proceso de creación puede tardar 10-15 minutos. Asegúrate de tener un password seguro.
            </DocAlert>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configurar S3</h2>
        <CodeBlock
          code={`# Crear buckets
aws s3 mb s3://banking-agent-facial-images --region us-east-1
aws s3 mb s3://banking-agent-detection-snapshots --region us-east-1

# Habilitar versionado
aws s3api put-bucket-versioning \\
  --bucket banking-agent-facial-images \\
  --versioning-configuration Status=Enabled`}
          language="bash"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Variables de Entorno</h2>
        <Card>
          <CardHeader>
            <CardTitle>Next.js (Vercel/EC2)</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock
              code={`DATABASE_URL=postgresql://admin:password@banking-agent-db.xxxxx.us-east-1.rds.amazonaws.com:5432/banking_agent_db?schema=public
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=generar-con-openssl-rand-base64-32
NEXT_PUBLIC_FACIAL_API_URL=https://api.tu-dominio.com
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_IMAGES=banking-agent-facial-images
AWS_S3_BUCKET_SNAPSHOTS=banking-agent-detection-snapshots`}
              language="bash"
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Costos Estimados</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Mensual (USD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>EC2 t3.medium</span>
                  <Badge variant="outline">~$30</Badge>
                </div>
                <div className="flex justify-between">
                  <span>RDS db.t3.medium Multi-AZ</span>
                  <Badge variant="outline">~$150</Badge>
                </div>
                <div className="flex justify-between">
                  <span>S3 Storage (100GB)</span>
                  <Badge variant="outline">~$2.30</Badge>
                </div>
                <div className="flex justify-between">
                  <span>CloudWatch Logs</span>
                  <Badge variant="outline">~$5</Badge>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total Estimado</span>
                  <Badge>~$207/mes</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checklist de Despliegue</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  VPC creada
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Security Groups configurados
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  RDS instanciado
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  S3 buckets creados
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Variables de entorno configuradas
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Siguiente</h2>
        <DocAlert type="info">
          Para detalles sobre configuración de nginx y gunicorn en EC2, ver{" "}
          <Link href="/documentation/deployment/ec2-nginx" className="underline font-semibold">
            EC2 & nginx
          </Link>
        </DocAlert>
      </section>
    </div>
  )
}

