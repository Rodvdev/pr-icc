import { CodeBlock } from "@/components/documentation/code-block"
import { DocAlert } from "@/components/documentation/doc-alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HardwareIntegrationPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Integración de Hardware</h1>
        <p className="text-xl text-muted-foreground">
          Guía para integrar dispositivos IoT (ESP32, Raspberry Pi, Arduino) con el sistema.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Dispositivos Soportados</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ESP32-CAM</CardTitle>
              <CardDescription>Recomendado</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-1">
                <li>• WiFi integrado</li>
                <li>• OV2640 camera</li>
                <li>• Stream HTTP</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Raspberry Pi</CardTitle>
              <CardDescription>Gateway opcional</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-1">
                <li>• Procesamiento local</li>
                <li>• Agregación de cámaras</li>
                <li>• MQTT broker</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Arduino</CardTitle>
              <CardDescription>Opcional</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-1">
                <li>• Sensores adicionales</li>
                <li>• Dispositivos IoT</li>
                <li>• Protocolo MQTT</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configuración ESP32-CAM</h2>
        <Card>
          <CardHeader>
            <CardTitle>Stream HTTP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock
              code={`// Configuración WiFi
const char* ssid = "TU_SSID";
const char* password = "TU_PASSWORD";

// Stream disponible en:
// http://192.168.1.100/stream
// http://192.168.1.100/capture
// http://192.168.1.100/status`}
              language="cpp"
            />
            <DocAlert type="info">
              El stream estará disponible en la IP local del ESP32. Asegúrate de que el dispositivo 
              esté en la misma red que el servidor Flask API.
            </DocAlert>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Protocolos de Comunicación</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>HTTP Streaming</CardTitle>
              <CardDescription>
                <Badge variant="outline">Recomendado</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>Ventajas:</strong></p>
              <ul className="list-disc list-inside">
                <li>Simple de implementar</li>
                <li>Compatible con estándares web</li>
                <li>Fácil debugging</li>
              </ul>
              <p className="pt-2"><strong>Uso:</strong> Cámaras ESP32 directamente al Flask API</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MQTT</CardTitle>
              <CardDescription>
                <Badge variant="outline">Escalable</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>Ventajas:</strong></p>
              <ul className="list-disc list-inside">
                <li>Bajo consumo de recursos</li>
                <li>Escalable</li>
                <li>QoS levels</li>
              </ul>
              <p className="pt-2"><strong>Uso:</strong> Múltiples dispositivos, sensores</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Flujo de Conexión</h2>
        <CodeBlock
          code={`ESP32 Camera
    │
    │ HTTP Stream
    │ (http://192.168.1.100:81/stream)
    ▼
Flask API (EC2)
    │
    │ Webhook
    ▼
Next.js API
    │
    │ SQL
    ▼
PostgreSQL (RDS)`}
          language="text"
        />
      </section>

      <DocAlert type="info">
        Para documentación completa con código de ejemplo, consulta{" "}
        <code className="px-1.5 py-0.5 bg-muted rounded">docs/HARDWARE_INTEGRATION.md</code>
      </DocAlert>
    </div>
  )
}

